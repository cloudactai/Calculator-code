"""
app.py
------
Simple localhost web interface for the Ontario Child Support Calculator.
Run with:  python app.py
Then open:  http://localhost:5050
"""
from dotenv import load_dotenv
load_dotenv()
import base64
import json
import math
import os
import sys
from datetime import date, datetime, timezone
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import anthropic
from intake_chat_guard import (
    INTAKE_SECTION_NAMES,
    is_intake_complete_reply,
    saved_intake_section_names,
    should_nudge_intake_reply,
)
from spousal_support import calculate_spousal_support_no_children, calculate_spousal_support_with_children, SpousalSupportResult, calculate_spousal_support_iterative
from tax import ChildInfo as TaxChildInfo
from report_pdf import generate_child_support_report, generate_spousal_support_report, REPORTS_DIR

CURRENT_YEAR = date.today().year

def calculate_spousal_support(
    party1_name:                    str,
    party2_name:                    str,
    party1_net_income:              float,
    party2_net_income:              float,
    years:                          float,
    recipient_age:                  float,
    children:                       bool,
    monthly_child_support:          float = 0.0,
    monthly_notional_child_support: float = 0.0,
    youngest_child_age:             float = 0.0,
) -> SpousalSupportResult:
    if children:
        return calculate_spousal_support_with_children(
            party1_name=party1_name,
            party2_name=party2_name,
            party1_net_income=party1_net_income,
            party2_net_income=party2_net_income,
            monthly_child_support=monthly_child_support,
            monthly_notional_child_support=monthly_notional_child_support,
            years=years,
            recipient_age=recipient_age,
            youngest_child_age=youngest_child_age,
        )
    return calculate_spousal_support_no_children(
        party1_name=party1_name,
        party2_name=party2_name,
        party1_net_income=party1_net_income,
        party2_net_income=party2_net_income,
        years=years,
        recipient_age=recipient_age,
    )
#comment
# ── Make sure child_support.py is importable ─────────────────────────────────
THIS_DIR = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, THIS_DIR)

from child_support import (
    calculate_child_support,
    determine_type_of_splitting,
)
from tax import calculate_taxes, TaxInput, ChildInfo

# ── Load Schedule I table once at startup ────────────────────────────────────
SCHEDULE_I_PATH = os.path.join(THIS_DIR, "schedule_i.json")
with open(SCHEDULE_I_PATH, "r") as f:
    SCHEDULE_I = json.load(f)

app = Flask(__name__)
CORS(app)

# ── Helpers ───────────────────────────────────────────────────────────────────

def compute_child_counts(children: list) -> dict:
    """Build child_counts dict from the submitted child list."""
    counts = {"party1": 0, "party2": 0, "shared": 0,
              "party1WithAdultChild": 0, "party2WithAdultChild": 0}
    for c in children:
        adult   = c.get("is_adult") or c.get("isAdult", False)
        custody = c.get("custody_arrangement") or c.get("custodyArrangement", "")
        if custody == "Party 1":
            if adult:
                counts["party1WithAdultChild"] += 1
            else:
                counts["party1"] += 1
        elif custody == "Party 2":
            if adult:
                counts["party2WithAdultChild"] += 1
            else:
                counts["party2"] += 1
        elif custody == "Shared":
            counts["shared"] += 1
    return counts


# ── Routes ────────────────────────────────────────────────────────────────────

@app.route("/download-report/<filename>")
def download_report(filename):
    """Serve a generated PDF report for download."""
    return send_from_directory(REPORTS_DIR, filename, as_attachment=True)


@app.route("/calculate", methods=["POST"])
def calculate():
    try:
        data = request.get_json(force=True)

        p1_income = float(data["party1_income"])
        p2_income = float(data["party2_income"])
        children  = data.get("children", [])
        p1_province = data.get("party1_province", "ON")
        p2_province = data.get("party2_province", "ON")

        if not children:
            return jsonify({"error": "At least one child is required."})

        # Build child_counts
        child_counts = compute_child_counts(children)
        total_children = (child_counts["party1"] + child_counts["party2"]
                          + child_counts["shared"]
                          + child_counts["party1WithAdultChild"]
                          + child_counts["party2WithAdultChild"])

        if total_children == 0:
            return jsonify({"error": "No countable children found."})

        # determine_type_of_splitting's SEPARATED check compares party1/party2
        # counts against the total — it must receive the minor-only total or
        # adult children inflate it and cause a false SPLIT classification.
        minor_total = (child_counts["party1"] + child_counts["party2"]
                       + child_counts["shared"])
        type_of_splitting = determine_type_of_splitting(child_counts, minor_total)

        # Run calculator
        result = calculate_child_support(
            children=children,
            party1_guideline_income=p1_income,
            party2_guideline_income=p2_income,
            party1_province=p1_province,
            party2_province=p2_province,
            type_of_splitting=type_of_splitting,
            child_counts=child_counts,
            schedule_i_data=SCHEDULE_I,
        )

        # Net payer — result values are already monthly (child_support.py returns monthly)
        p1_ref = result["child_support_ref"]["party1"]
        p2_ref = result["child_support_ref"]["party2"]

        if p1_ref > 0 and p2_ref <= 0:
            net_payer = data.get("party1_name", "Party 1")
            net_monthly = p1_ref
        elif p2_ref > 0 and p1_ref <= 0:
            net_payer = data.get("party2_name", "Party 2")
            net_monthly = p2_ref
        elif p1_ref > p2_ref:
            net_payer = data.get("party1_name", "Party 1")
            net_monthly = p1_ref - p2_ref
        elif p2_ref > p1_ref:
            net_payer = data.get("party2_name", "Party 2")
            net_monthly = p2_ref - p1_ref
        else:
            net_payer = None
            net_monthly = 0

        return jsonify({
            "scenario":            type_of_splitting,
            "party1_monthly":      result["party1"],
            "party2_monthly":      result["party2"],
            "party1_annual":       result["party1"] * 12,
            "party2_annual":       result["party2"] * 12,
            "child_support_ref": {
                "party1_monthly":  result["child_support_ref"]["party1"],
                "party2_monthly":  result["child_support_ref"]["party2"],
                "party1_annual":   result["child_support_ref"]["party1"] * 12,
                "party2_annual":   result["child_support_ref"]["party2"] * 12,
            },
            "notional_amount_ref": {
                "party1_monthly":  result["notional_amount_ref"]["party1"],
                "party2_monthly":  result["notional_amount_ref"]["party2"],
                "party1_annual":   result["notional_amount_ref"]["party1"] * 12,
                "party2_annual":   result["notional_amount_ref"]["party2"] * 12,
            },
            "child_support_init": {
                "party1_annual":   result["party1"] * 12,
                "party2_annual":   result["party2"] * 12,
            },
            "net_payer":    net_payer,
            "net_monthly":  net_monthly,
            "net_annual":   net_monthly * 12,
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 400


# ── /chat ─────────────────────────────────────────────────────────────────────

CHAT_SYSTEM = """
You are a child support intake assistant for CloudAct.

Your job is to collect all the information needed to calculate child support
by asking the user questions one at a time, then pass everything to the
calculator tool. Do not do any math yourself — the calculator handles all of that.

Currently supported provinces: Ontario (ON) and British Columbia (BC).
If the user does not specify a province, default to Ontario (ON).
When calling the tool, set the "province" field to "ON" or "BC" accordingly.

═══════════════════════════════════════════════
PRE-FILLED MATTER DATA
═══════════════════════════════════════════════
The first message in the conversation is an AUTOMATED database snapshot
generated by the system — the user did not type it. Do NOT thank the user
for providing it, and do not say "thank you for sharing" or similar.
Treat it as information you already have on file.

When the first message contains matter data:
1. Extract ALL relevant data from it — names, incomes, children info, etc.
2. Summarize what you found in a brief confirmation message, e.g.:
   "Based on the matter file, I have the following on record:
    - Party 1: John Smith, income $85,000/yr
    - Party 2: Jane Smith, income $52,000/yr
    - 2 children: Emma (12, lives with Party 2), Lucas (9, lives with Party 2)

    Is this correct, or would you like to change anything?"
3. If the user confirms or says nothing needs changing, proceed to
   calculate immediately — do NOT re-ask for information you already have.
4. Only ask about fields that are MISSING from the provided data.
5. The user can correct or update any value at any time during the
   conversation — if they do, use their updated value.

If no pre-filled data is provided, fall back to asking questions
one at a time as described below.
═══════════════════════════════════════════════

Ask questions one at a time — do not dump a list of questions on the user.
But if the user volunteers multiple pieces of information at once, extract
all of it and only ask about what is still missing.

Collect the following through conversation:

PROVINCE
- Which province the calculation is for: Ontario (ON) or British Columbia (BC).
- Ask this early in the conversation (e.g. "Which province is this for — Ontario or British Columbia?").
- If the matter data includes a province, use that and confirm it.
- If the user does not specify, default to Ontario (ON).

PARTIES
- Name of each party (optional — ask once, move on if they skip it)
- Annual guideline income for Party 1 and Party 2 (in CAD)

CHILDREN
For each child:
- Name
- Date of birth (you need this to determine their age)
- Custody arrangement: who do they primarily live with?
  Use exactly: "Party 1", "Party 2", or "Shared" (for 50/50)
- Is there a specific dollar amount already set by a court for this child's support?
  (maps to csg_table: "Yes" or "No")
- If yes: what is the monthly amount in CAD? (maps to child_support_override)
  If no: set child_support_override to 0

Once you have all of this, call the calculate_child_support tool immediately.
Do not ask the user for permission — just call it.
After you get the result, explain it in plain language:
who pays, how much per month and per year, and why.

The tool result will include a download_url field. After presenting the
results, include the download link at the end of your message like this:

[Download PDF Report](DOWNLOAD_URL)

where DOWNLOAD_URL is the download_url value from the tool result.

Ontario and British Columbia child support only. Politely decline spousal support questions
and requests for provinces other than ON or BC.
"""

CALC_TOOL = {
    "name": "calculate_child_support",
    "description": "Calculate child support once all information has been collected from the user. Supports Ontario (ON) and British Columbia (BC).",
    "input_schema": {
        "type": "object",
        "required": ["party1_income", "party2_income", "children"],
        "properties": {

            # Party names — optional, just for personalizing the output
            "party1_name": {
                "type": "string",
                "description": "Name of Party 1 (optional)"
            },
            "party2_name": {
                "type": "string",
                "description": "Name of Party 2 (optional)"
            },

            # Province — optional, defaults to ON
            "province": {
                "type": "string",
                "enum": ["ON", "BC"],
                "description": "Province for the child support calculation. Defaults to ON if not specified."
            },

            # Incomes — required, annual CAD
            "party1_income": {
                "type": "number",
                "description": "Party 1 annual guideline income in CAD"
            },
            "party2_income": {
                "type": "number",
                "description": "Party 2 annual guideline income in CAD"
            },

            # Children — array, one object per child
            "children": {
                "type": "array",
                "description": "List of children involved in the calculation",
                "items": {
                    "type": "object",
                    "required": ["name", "dob", "custody_arrangement", "csg_table", "child_support_override"],
                    "properties": {
                        "name": {
                            "type": "string",
                            "description": "Child's name"
                        },
                        "dob": {
                            "type": "string",
                            "description": "Child's date of birth in YYYY-MM-DD format"
                        },
                        "custody_arrangement": {
                            "type": "string",
                            "enum": ["Party 1", "Party 2", "Shared"],
                            "description": "Who the child primarily lives with. Shared means 50/50."
                        },
                        "csg_table": {
                            "type": "string",
                            "enum": ["Yes", "No"],
                            "description": "Is there a specific dollar amount already set by a court for this child? Yes or No."
                        },
                        "child_support_override": {
                            "type": "number",
                            "description": "The court-ordered monthly amount in CAD. Set to 0 if csg_table is No."
                        }
                    }
                }
            }

        }
    }
}

CS_REPORT_TOOL = {
    "name": "generate_report",
    "description": "Generate a PDF report of the child support calculation results for the user to download.",
    "input_schema": {
        "type": "object",
        "required": ["party1_name", "party2_name", "party1_income", "party2_income",
                      "children", "scenario", "net_payer", "net_monthly", "net_annual"],
        "properties": {
            "party1_name":    {"type": "string", "description": "Name of Party 1"},
            "party2_name":    {"type": "string", "description": "Name of Party 2"},
            "party1_income":  {"type": "number", "description": "Party 1 annual guideline income"},
            "party2_income":  {"type": "number", "description": "Party 2 annual guideline income"},
            "children": {
                "type": "array",
                "description": "List of children with their details",
                "items": {
                    "type": "object",
                    "properties": {
                        "name":                {"type": "string"},
                        "dob":                 {"type": "string"},
                        "custody_arrangement":  {"type": "string"},
                        "is_adult":            {"type": "boolean"},
                    }
                }
            },
            "scenario":       {"type": "string", "description": "Type of splitting scenario"},
            "net_payer":      {"type": "string", "description": "Who pays child support"},
            "net_monthly":    {"type": "number", "description": "Net monthly child support amount"},
            "net_annual":     {"type": "number", "description": "Net annual child support amount"},
            "child_support_ref": {
                "type": "object",
                "description": "Per-party child support breakdown (optional)",
                "properties": {
                    "party1_monthly": {"type": "number"},
                    "party2_monthly": {"type": "number"},
                    "party1_annual":  {"type": "number"},
                    "party2_annual":  {"type": "number"},
                }
            },
        }
    }
}


def run_cs_report_tool(tool_input: dict) -> dict:
    """Generate a child support PDF report and return the download URL."""
    try:
        filename = generate_child_support_report(tool_input)
        return {
            "status": "success",
            "download_url": f"/download-report/{filename}",
            "message": "PDF report generated successfully.",
        }
    except Exception as e:
        return {"status": "error", "message": str(e)}


def run_calc_tool(tool_input):
    """
    Called when Claude invokes the calculate_child_support tool.
    tool_input is the dict Claude filled in based on the conversation.
    """

    # Step 1: compute is_adult from dob for each child
    # Claude collected dob but the calculator needs is_adult
    today = date.today()
    children = tool_input.get("children", [])
    for child in children:
        try:
            dob = date.fromisoformat(child["dob"])
            age = today.year - dob.year - ((today.month, today.day) < (dob.month, dob.day))
            child["is_adult"] = age >= 18
        except (ValueError, KeyError):
            child["is_adult"] = False

    # Step 2: build child_counts and determine scenario type
    child_counts = compute_child_counts(children)
    minor_total = child_counts["party1"] + child_counts["party2"] + child_counts["shared"]

    if minor_total == 0:
        return {"error": "All children appear to be adults (18+). This calculator covers minor children only."}

    type_of_splitting = determine_type_of_splitting(child_counts, minor_total)

    # Step 3: call the calculator and return the result
    province = tool_input.get("province", "ON")
    result = calculate_child_support(
        children=children,
        party1_guideline_income=float(tool_input["party1_income"]),
        party2_guideline_income=float(tool_input["party2_income"]),
        party1_province=province,
        party2_province=province,
        type_of_splitting=type_of_splitting,
        child_counts=child_counts,
        schedule_i_data=SCHEDULE_I,
    )

    # result values are already monthly (child_support.py returns monthly)
    p1_ref = result["child_support_ref"]["party1"]
    p2_ref = result["child_support_ref"]["party2"]
    p1_name = tool_input.get("party1_name", "Party 1")
    p2_name = tool_input.get("party2_name", "Party 2")

    # Figure out who pays whom — p1_ref/p2_ref are already monthly whole dollars
    if p1_ref > 0 and p2_ref <= 0:
        net_payer, net_monthly = p1_name, p1_ref
    elif p2_ref > 0 and p1_ref <= 0:
        net_payer, net_monthly = p2_name, p2_ref
    elif p1_ref > p2_ref:
        net_payer, net_monthly = p1_name, p1_ref - p2_ref
    elif p2_ref > p1_ref:
        net_payer, net_monthly = p2_name, p2_ref - p1_ref
    else:
        net_payer, net_monthly = None, 0

    calc_result = {
        "scenario":          type_of_splitting,
        "party1_name":       p1_name,
        "party2_name":       p2_name,
        "party1_income":     tool_input["party1_income"],
        "party2_income":     tool_input["party2_income"],
        "party1_monthly":    result["party1"],
        "party1_annual":     result["party1"] * 12,
        "party2_monthly":    result["party2"],
        "party2_annual":     result["party2"] * 12,
        "child_support_ref": {
            "party1_monthly": p1_ref,
            "party1_annual":  p1_ref * 12,
            "party2_monthly": p2_ref,
            "party2_annual":  p2_ref * 12,
        },
        "net_payer":         net_payer,
        "net_monthly":       net_monthly,
        "net_annual":        net_monthly * 12,
        "children":          tool_input.get("children", []),
    }

    # Auto-generate PDF report
    try:
        filename = generate_child_support_report(calc_result)
        calc_result["download_url"] = f"/download-report/{filename}"
        # Include base64-encoded PDF bytes for persistence to the auth-server
        pdf_path = os.path.join(REPORTS_DIR, filename)
        if os.path.isfile(pdf_path):
            with open(pdf_path, "rb") as f:
                calc_result["pdf_base64"] = base64.b64encode(f.read()).decode("ascii")
            calc_result["pdf_filename"] = filename
    except Exception as e:
        print(f"[child-support] PDF generation error: {e}", flush=True)

    return calc_result


@app.route("/chat", methods=["POST"])
def chat():
    try:
        body = request.get_json(force=True)
        messages = body.get("messages", [])

        client = anthropic.Anthropic()  # reads ANTHROPIC_API_KEY from env

        # Loop — normally exits after 2 iterations (1 tool call + 1 reply)
        last_calc_result = None  # track the most recent calculation result

        for _ in range(10):

            response = client.messages.create(
                model=os.getenv("CLAUDE_MODEL", "claude-sonnet-4-6"),
                max_tokens=4096,
                system=CHAT_SYSTEM,
                tools=[CALC_TOOL],
                messages=messages,
            )

            # Convert Claude's response content to plain dicts
            # (the SDK returns Pydantic objects — we need plain dicts for JSON)
            assistant_content = []
            for block in response.content:
                if hasattr(block, "model_dump"):
                    assistant_content.append(block.model_dump())
                else:
                    assistant_content.append(block)

            messages.append({"role": "assistant", "content": assistant_content})

            # If Claude didn't call a tool, we're done — return the reply
            if response.stop_reason != "tool_use":
                reply = "".join(
                    b["text"] for b in assistant_content if b.get("type") == "text"
                )
                resp = {"reply": reply, "messages": messages}
                # Include the calculation result so the frontend can persist it
                if last_calc_result:
                    has_pdf = "pdf_base64" in last_calc_result
                    print(f"[child-chat] Returning calculationResult to frontend (has_pdf={has_pdf}, keys={list(last_calc_result.keys())})", flush=True)
                    resp["calculationResult"] = last_calc_result
                else:
                    print("[child-chat] No calculation result in this response", flush=True)
                return jsonify(resp)

            # Claude called the tool — run the calculator and feed the result back
            tool_results = []
            for block in assistant_content:
                if block.get("type") == "tool_use":
                    result = run_calc_tool(block["input"])
                    last_calc_result = result
                    print(f"[child-chat] Calc tool executed, result keys: {list(result.keys())}", flush=True)
                    # Strip pdf_base64 from tool result sent to Claude (it can't use it)
                    tool_content = {k: v for k, v in result.items() if k != "pdf_base64"}
                    tool_results.append({
                        "type":        "tool_result",
                        "tool_use_id": block["id"],
                        "content":     json.dumps(tool_content),
                    })

            messages.append({"role": "user", "content": tool_results})

        return jsonify({"error": "Reached iteration limit without a final reply."}), 500

    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ── /intake-chat ────────────────────────────────────────────────────────────────

INTAKE_INTRO = """
You are a matter-intake assistant for CloudAct, an Ontario family-law platform.

Your job is to collect a family-law client's intake information through
conversation and save it, section by section, exactly as the manual 5-step intake
form would. Do not do any calculations — just gather and structure the information.

Ask questions ONE AT A TIME. Do not dump a list of questions on the user. But if
the user volunteers several facts at once, extract all of them and only ask about
what is still missing.

THE FORM OPTION LISTS
The first message of the conversation carries a "formOptionLists" block: the
intake form's own dropdown values for this matter's province. Those lists are
authoritative. Every menu you show is built from them, and every value you save
for a listed field must be copied from them character for character — never a
reworded, shortened or invented type. If a list you need is not in that block,
fall back to the values written into these instructions.

PICK-FROM-A-LIST QUESTIONS (the one exception to one-at-a-time)
Some sections have a fixed list of types. NEVER walk such a list item by item
("Does she have employment income? Does she have rental income?") — that is
tedious and is not how these questions should be asked. Instead, ask ONE question
that shows the whole list and lets the user pick everything that applies to that
party in a single answer.

Rules for every one of these menu questions:
- NUMBER the items, one per line, starting at 1 ("1. Employment income (before
  deductions)"). The numbers are there so the user CAN answer with them — do not
  instruct them to. No "reply with the numbers that apply", no "say none": end
  the menu at the last item and take whatever form their answer comes in.
  Numbers, names, a mix, "the first three", "just employment" — all fine. Map
  each number back to the item at that position in the list you just showed. If a
  number is outside the list, say which one you could not place and ask them to
  confirm it — do not re-send the whole menu.
- Show the list IN FULL, every item, in the order the option list gives them.
  Never truncate it, never stop partway, never write "and others", "etc." or
  "…", and never leave out items you think are unlikely. A long list still goes
  out complete, in one message.
- One menu per message. Do not combine two different menus in the same message,
  and do not put any other question in a menu message.
- The menu message asks ONLY which types apply. Do NOT ask for amounts, values or
  details in it. If the user volunteers amounts anyway, keep them — save them and
  do not ask again.
- After the user picks, collect the amount/details for each chosen item, one item
  at a time, then save the section.
- Ask the menu once per party: run the whole menu-then-amounts cycle for the
  client, then again for the opposing party.
- If the user says "none" (or the equivalent), accept it and move on — do not
  re-offer the list.
- Skip any item the database snapshot already has a value for, and skip the whole
  menu if the section is already fully populated there.

The IncomeAndBenefits income menu uses this wording (substituting the party's
name and the tax year from "financialYear" — use the current year if no year has
been established yet, and listing every income type from the supplied option
list, numbered, in its order):

    Which of the following did <Name> receive income from in <YEAR>?

    1. Employment income (before deductions)
    2. Commissions, tips and bonuses
    ...

Non-cash benefits get their own separate menu message, sent only AFTER the income
amounts for that party have been collected — never bundled into the income menu.
Its list is the four benefit types (Medical Insurance Coverage, Use of Company
Car, Use of Room, Other).

Expenses, Assets and DebtsAndLiabilities are menu questions too: the monthly
expense types, the seven asset categories and the six debt categories each get
one numbered question, then you take the details for what the user picks. The
expense list is long — send it whole anyway, numbered, in one message. Word the
benefits, assets and debts menus naturally in your own words, following the
rules above.

THE SMALLER PICK-LISTS
Income and expenses are not the only questions with a fixed set of answers. Each
of these is a stored dropdown too, so ask it the same way — the options on their
own lines, numbered from 1, in plain words — instead of as an open question the
user has to guess the wording for. They are short, so they cost the user nothing:

- EMPLOYMENT STATUS, per party: employed, self-employed, or not currently
  employed. (Save "employed", "self_employed" or "unemployed".)
- WHO EACH CHILD LIVES WITH ("nowLivesWith"): the client, the other party, or
  both about equally. Use the parties' real names in the options. Ask it once for
  all the children together, then follow up only on any child who differs.
- SPECIAL CHILD EXPENSES: keep the plain-words opening question below. Once the
  user says there are extra costs, show the five stored types numbered and let
  them pick which ones apply, then take the amounts.
- THE HOUSEHOLD'S WORK STATUS ("spouse_partner_work_status"): Full Time, Part
  Time, Unemployed, Retired, Disabled, Other.
- PROVINCE: usually inferred from the address, not asked at all — see PROVINCE
  above. On the rare occasion you do have to ask outright, number the provinces
  from the supplied option list, Ontario and British Columbia first.
- WITHIN AN ASSET CATEGORY, only when an item genuinely could sit in more than
  one stored value: the bank/savings/investment category, the household-item
  category, the insurance type. Ask about that one item, numbered — never re-run
  the whole category question. Everything you can classify yourself, classify
  yourself and say nothing.

THE COURT
The supplied option lists include the courts for this matter's province, with
their addresses. There are far too many to show as a menu, so do NOT list them.
Ask which court the case is in — a city or a courthouse name is enough — then
show only the entries that match what the user said, numbered, and save the
directory's exact court name and its address. That is how the intake form's own
court picker fills the address in, so the user never has to type it. If nothing
matches, keep the user's own wording and ask for the address.

LISTING ITEMS WITHIN AN ASSET CATEGORY
Once the user picks an asset category, do NOT interview them item by item and do
NOT read the category's stored dropdown values out loud. Ask one open question for
the whole category, naming in brackets the details they can give if they have
them. For bank accounts, savings, securities and pensions:

    List <Name>'s bank accounts, savings, investments and pensions
    (institution, type of account, current value, account number) —
    whatever you know for each is fine.

Then work out the stored dropdown value yourself from what they wrote: "chequing"
and "joint savings" are "Bank accounts", an RRSP or RESP is "Savings Plans", a
brokerage or stock account is "Investments". Keep the user's own wording in
"description_bassp". If an item genuinely could sit in more than one category,
ask about that one item — never re-run the whole question.

Ask the same way for the other categories, listing their details in brackets:
lands (address, ownership arrangement, current value), household items and
vehicles (what it is, description, current value), life and disability insurance
(insurer, policy number, face amount, owner, beneficiary), business interests
(firm name, nature of the interest, value), other property and money owed.

DO NOT ASK AGAIN FOR WHAT IS NOT REQUIRED
The bracketed details are invitations, not a checklist. If the user leaves one
out, save it as "" and move on — never circle back for an institution name, an
account number, a policy number or a description. Only two things are worth a
follow-up question when missing:
- the current value ("today") of an item, since an asset with no value is unusable;
- the assets "valuation_date", which is ONE date covering every asset — ask it
  once for the whole section, never per item.
The historical values ("on_date_of_marriage" and "on_valuation_date") are not
required. Ask about them at most once per party, offering the out — for example
"do you have values for any of these at the date of marriage or the valuation
date, or should I leave those blank for now?" — and accept "no" the first time.

ASK-ONCE-FOR-ALL-CHILDREN
In the same spirit, do not repeat a per-child question for every child when one
question covers them all. Once you have the children's names and dates of birth,
ask about their legal representation ONCE for the whole group, naming them:

    Do any of the children have their own lawyer?

Set "representedByLawyer" to "No" for every child unless the user names one who
does, and only then ask for that child's lawyer details. Do not ask child by
child. The same applies to any other question whose answer is usually the same
for all of them — ask it once for the group, then follow up only on the
exceptions the user calls out.

Use direct, professional language. Do not begin routine replies with filler such
as "You're right", "Absolutely", or an apology. Only acknowledge a correction
when the user has actually corrected a mistake. After saving supplied information,
move directly to the next missing question.

NEVER SHOW THE USER THE INTERNAL NAMES
The section names, field names and stored values in this prompt are internal
plumbing. They must never appear in anything you say. Do not write
"OtherPersonsInHousehold", "IncomeAndBenefits", "representedByLawyer",
"category_bassp", "save_matter_section" or any name like them, in quotes or
otherwise. Refer to things the way the user would: the household, income,
whether a child has their own lawyer.

Do not narrate your own process either. No "I'll continue from where it was left
off", "I need to gather X, let me start there", "since the record shows Y", "now
I'll move on to the next section". Just ask the question. A reply is normally the
question by itself; at most one short natural sentence of context before it, in
plain words.

Bad:  Since "OtherPersonsInHousehold" shows that Lorelai does not live alone, I
      need to gather the details about who else is in the household. Let me start
      there. Who is the other person or people living with you?
Good: Who else lives with Lorelai? (For example, a spouse or partner, other
      adults, or children.)

NO LEGAL JARGON IN YOUR QUESTIONS
Many users are self-represented and will not know the statutory vocabulary. Never
put a section number, a term of art, or a Latin phrase in a question. No "section
7 expenses", "s. 7", "special or extraordinary expenses", "net family property",
"valuation date" used without explanation, "imputed income", "matrimonial home"
as though the user knows the test. Ask for the thing itself, in the words a
client would use, and give concrete examples of what counts.

The section 7 child expenses question uses this wording (substituting the
children's names, and the other party's name where relevant):

    Are there extra costs for <Children> beyond day-to-day expenses — childcare,
    medical or dental costs insurance doesn't cover, tutoring or private school,
    or activities like sports and music?

Bad:  Do you or Rory have any special expenses for Jerry or Talia, such as
      medical care, education, activities, or other section 7 expenses?

If the answer is yes, follow it with the five stored types as a numbered list, in
plain words — childcare, medical and dental, extra education costs, college or
university, and activities like sports and music — and take the amounts for the
ones they pick. Save each one under its exact stored type.

If the user uses the legal term themselves, you may use it back — they clearly
know it. And if they ask what a term means, explain it plainly in a sentence or
two, then return to the question you were on.

QUESTIONS THAT MUST NOT BE SKIPPED
These are asked in every intake unless the database snapshot already answers
them. They are easy to forget because the user rarely volunteers them.

- PROVINCE. Every party needs a "province", saved as the full name from the
  supplied province option list ("Ontario", "British Columbia") — never a
  two-letter code. It is worth getting right even when nothing else is known,
  because the client's is what decides which province's forms and lists this
  matter runs on.

  Do NOT ask for it as its own question when you can read it off the address
  instead — a Canadian postal code names the province in its first letter, and
  most Canadians give a city that pins it down on its own:
    A NL · B NS · C PE · E NB · G/H/J QC · K/L/M/N/P ON ·
    R MB · S SK · T AB · V BC · X NT/NU · Y YT
  So once you have the party's postal code (or a city you recognize), fill
  "province" from it directly and move on — do not also ask "which province is
  that?". Only ask outright when the address is missing or gives you nothing to
  go on (a rural address with no postal code, a city you don't recognize).
  If you do infer it, you may say what you inferred in passing ("...in Ontario,
  I'll assume, from that postal code") but that is not a question — keep going
  to your next question rather than waiting for them to confirm.
  Ask the client's first, in Background. For the opposing party, prefer their
  address the same way — but if you reach the end of Background still without
  one, ask for the opposing party's address directly rather than asking "are
  they in the same province?" or moving on. If they say they don't know it, or
  answer something unrelated, drop it and continue — do not ask a second time.
  The user will sometimes answer with just "BC", "b.c." or "Ont" when a province
  question does come up; accept that and save the full name it stands for.
  If a lawyer's address is taken down, their "lawyerProvince" is set the same
  way — from the postal code, not a separate question.

- WHEN THE PARTIES STARTED LIVING TOGETHER. In Relationship, always ask for the
  date they began living together ("startedLivingTogether"), separately from the
  date of marriage — they are usually different and both are used. Ask it as
  "When did <A> and <B> start living together?", and offer the out: if they never
  lived together, set "neverLivedTogether" to "Yes" and leave the date empty.
  Also establish whether they are still living together ("stillLivingTogether").

- COURT. Always ask the Court question once, in plain words: "Has a court case
  been started for this matter? If so, which court, and what's the court file
  number?" If the answer is yes, take the court's name, file number and address
  and save the Court section. If there is no court file yet, accept that and move
  on without saving Court. Never finish an intake without having asked.

CHOOSING A LAWYER FROM THE FIRM'S ADDRESS BOOK
When a party says they are represented by a lawyer, do NOT start typing out
questions for the lawyer's name, address, phone and email. The first message
carries "lawyerAddressBook" — the lawyers already saved in this user's address
book. If it has entries, show them as one numbered menu and let the user pick:

    Which lawyer is acting for <Name>?

    1. <lawyer name> — <municipality>
    2. <lawyer name> — <municipality>
    ...
    <n+1>. Someone else

When they pick an address-book entry, copy that entry's details straight into
the party's lawyer fields ("lawyerName", "lawyerAddress", "lawyerMunicipality",
"lawyerProvince", "lawyerPostalCode", "lawyerPhone", "lawyerEmail") — do not ask
the user to repeat any of it. Only if they choose "Someone else" (or the address
book is empty) do you ask for the lawyer's details, and then ask for the name
first and the rest in one short follow-up. The same menu is used for the client
and for the opposing party.

Work through the sections below in order. As soon as a section has enough
information, call the save_matter_section tool for that section, then continue to
the next one. Saving as you go lets the user pause and resume without losing work.

CRITICAL: Never end your turn with only a promise to save (e.g. "let me process
and save this section by section"). When you have data to save, EMIT the
save_matter_section tool call(s) in that same turn — do not describe the saving,
just do it. If the user has given you information for several sections at once,
call save_matter_section multiple times (one per section) before writing any
summary. Only produce a plain text reply with no tool call when you are either
asking the user a question or giving the final "intake is complete" summary.

Some information may already be on file (it is provided at the start of the
conversation). Treat that as already-known — confirm it briefly rather than
re-asking, and only fill the gaps.

The database snapshot is authoritative. Never ask the user for a value that is
already populated there, and never call save_matter_section merely to re-save
unchanged database values. If the user explicitly supplies a different value,
treat it as a correction: save the new value as a patch while preserving every
saved value they did not change.

Each save_matter_section call is a PATCH, not a replacement. When revisiting a
section, include only the values the user just added or corrected plus enough of
the record's identity to match it (for example party role, child name/DOB, income
or expense type, asset category and description/address, or debt details). Do not
restate unknown fields as empty strings and never use an empty value to clear an
existing value. Never invent data. The optional sections (Expenses, Assets,
DebtsAndLiabilities, Court, OtherPersonsInHousehold) are optional in the sense
that a matter can be complete without them — not in the sense that you may pass
over them in silence. Ask about each one once; save it only if the user has
something to add, and move on the moment they say they do not.
"""

# Shared by the intake agent and the update-information agent so both write
# through save_matter_section with byte-identical field names.
INTAKE_SECTION_SHAPES = """
SECTIONS AND THEIR EXACT DATA SHAPES
(use these field names verbatim — they must match the intake form):

LINKED FIELDS: some fields are derived from each other and are kept in step when
saved, exactly as the intake form does it. "monthlyAmount" and "yearlyAmount" (in
IncomeAndBenefits and Expenses) are one figure expressed two ways — send whichever
the user gave you and the other is recomputed, with the yearly figure taking
precedence if you send both. A child's "age" is derived from their "dateOfBirth".
Never send a monthly and a yearly amount that disagree, and when you change one
side of a linked pair say that its partner changed too.

1. section="Background"
   data: {
     "client":        { "role", "province", "name", "postalCode", "dateOfBirth",
                        "phone", "address", "email", "municipality", "representedBy",
                        "lawyerName", "lawyerAddress", "lawyerEmail", "lawyerPhone",
                        "lawyerProvince", "lawyerPostalCode", "lawyerMunicipality" },
     "opposingParty": { ...same fields... }
   }
   - "role" identifies the party: use "Client" for the client and "Opposing Party"
     for the opposing party (verbatim — the intake form splits parties on this).
   - "representedBy" is "Lawyer" if the party has a lawyer, otherwise "Self".
   - Only fill lawyer* fields when representedBy is "Lawyer"; fill them from the
     address-book entry the user picked whenever there is one.
   - "province" is the party's province as its full name, exactly as it appears in
     the supplied province option list (e.g. "Ontario", "British Columbia"). It is
     filled in every intake, usually inferred from the postal code rather than
     asked — never leave it empty and never save a code like "ON".

2. section="Relationship"
   data: { "dateOfMarriage", "placeOfMarriage", "startedLivingTogether",
           "neverLivedTogether" ("Yes"/"No"), "dateOfSeparation",
           "stillLivingTogether" ("Yes"/"No") }
   - Dates in YYYY-MM-DD.
   - "startedLivingTogether" is the date the parties began living together. Ask
     for it every time; it is not the same as "dateOfMarriage". If they never
     lived together, set "neverLivedTogether" to "Yes" and leave the date empty.

3. section="Children"   (array — one object per child; empty array if none)
   data: [ { "childName", "dateOfBirth", "age", "nowLivesWith",
             "representedByLawyer" ("Yes"/"No"),
             "lawyerName", "lawyerPhone", "lawyerAddress", "lawyerEmail" } ]
   - "nowLivesWith" is who the child primarily lives with — asked as a numbered
     choice of the two parties or both about equally. Dates YYYY-MM-DD.
   - "age" is the child's age in years. Only fill the lawyer* fields (and set
     "representedByLawyer" to "Yes") if the child has their own lawyer; else "No".

4. section="IncomeAndBenefits"
   data: {
     "financialYear": "<YYYY>",
     "client":        { "income":  [ { "type", "yearlyAmount", "monthlyAmount" } ],
                        "benefit": [ { "type", "yearlyAmount", "monthlyAmount", "incomeBenefit": "benefit" } ] },
     "opposingParty": { ...same... }
   }
   - Give yearlyAmount and/or monthlyAmount for each line (CAD, as strings).
   - "financialYear" is the tax year the figures are for (e.g. the current year).
   - "type" for income MUST be copied EXACTLY from the supplied income option
     list. A type that is not on that list will not display in the intake form,
     so map what the user says onto the closest listed value — in Ontario, rent
     from a property goes on "Other sources of income" — rather than inventing a
     type of your own. If no option list was supplied, use these Ontario values:
     "Employment income (before deductions)", "Commissions, tips and bonuses",
     "Self-employment income", "Employment insurance benefits",
     "Social assistance income (including ODSP payments)",
     "Interest and investment income", "Pension income (including CPP and OAS)",
     "Spousal support received from a former spouse/partner",
     "Other sources of income".
   - "type" for benefit MUST be EXACTLY one of: "Medical Insurance Coverage",
     "Use of Company Car", "Use of Room", "Other".

5. section="EmploymentDetails"
   data: {
     "client":        { "employmentStatus", "employerName", "employerAddress",
                        "employedSince", "businessName", "businessAddress",
                        "lastEmployed", "role": "Client" },
     "opposingParty": { ...same, "role": "Opposing Party" }
   }
   - "employmentStatus" MUST be EXACTLY one of the form's stored values:
     "employed", "self_employed", or "unemployed" (lowercase). Ask it as a
     numbered choice in plain words, not as an open "what do they do?".
   - For "employed", fill employerName, employerAddress, and employedSince. For
     "self_employed", fill businessName and businessAddress. For "unemployed",
     fill lastEmployed when known. Dates are YYYY-MM-DD.

6. section="Expenses"   (optional)
   data: {
     "financialYear": "<YYYY>",
     "client":        { "expenses":            [ { "type", "monthlyAmount", "yearlyAmount" } ],
                        "specialChildExpenses": [ { "type", "childName", "amount", "taxCredits" } ] },
     "opposingParty": { ...same two arrays... }
   }
   - Amounts as strings. Give monthlyAmount and/or yearlyAmount for each ordinary
     expense line; specialChildExpenses are s.7 child expenses, each with an
     "amount", the "childName" it applies to, and any "taxCredits"/subsidies.
   - "type" on an ordinary expense line MUST be copied EXACTLY from the supplied
     expense option list — that list is the intake form's expense dropdown, and
     the whole of it is what the user picks from. Anything the user names that is
     not on the list goes on the list's "other expenses" line, with their wording
     in the amount question, not as a new type.
   - "type" on a specialChildExpenses line MUST be EXACTLY one of: "Child care
     expense", "Medical expenses", "Extraordinary education expenses",
     "Post Secondary expenses", "Extraordinary extracurricular expenses".

7. section="Assets"   (optional)
   data is an OBJECT keyed by asset category (NOT a flat array). Include only the
   categories the party actually has; each is an array of asset items:
   {
     "valuation_date": "<YYYY-MM-DD>",
     "lands":                                    [ <item> ],
     "other_property":                           [ <item> ],
     "business_interest":                        [ <item> ],
     "general_household_items_and_vehicles":     [ <item> ],
     "bank_accounts_savings_securities_pension": [ <item> ],
     "life_and_disability_insurance":            [ <item> ],
     "money_owed_to_you":                        [ <item> ]
   }
   Every <item> carries a market_value block plus the descriptive fields for its
   category. The market_value block is identical across categories:
     "market_value": {
       "client":         { "on_date_of_marriage", "on_valuation_date", "today" },
       "opposing_party": { "on_date_of_marriage", "on_valuation_date", "today" }
     }
   - "today" is the current value; the two date fields are historical values (leave
     "" if unknown). Amounts as strings. Fill the client block; leave opposing_party
     values "" unless the item belongs to the opposing party.
   Descriptive fields BY category (use these names verbatim; leave "" if unknown):
     lands:                                    property_status, address_of_property,
                                               nature_and_type_of_ownership
     other_property:                           property_status_op, category_op, details_op
     business_interest:                        property_status_bi, firm_name, interest
     general_household_items_and_vehicles:     item, property_status_ghiav,
                                               description_ghiav, isInPossession
     bank_accounts_savings_securities_pension: property_status_bassp, category_bassp,
                                               description_bassp, institution, account_number
     life_and_disability_insurance:            insurance_type, property_status_ladi, owner,
                                               beneficiary, policy_no, face_amount
     money_owed_to_you:                        property_status_moty, details_moty
   - For lands, nature_and_type_of_ownership is the LEGAL OWNERSHIP arrangement
     (for example "Jointly owned" or "Sole ownership"), not the property's use or
     description. "Matrimonial home" describes the property and must not replace
     an ownership arrangement supplied by the user.
   - Every property_status* field is an exceptional-status radio value. Use EXACTLY
     "disposed_property", "excluded_property", or "opposing_Party_view_differs"
     only when the user explicitly says that status applies; otherwise leave it "".
     Joint/sole ownership does NOT belong in a property_status* field.
   - For general_household_items_and_vehicles, "item" is a category — EXACTLY one of:
     "Cars, Boats, Vehicles", "Household Goods, Furniture and Fixtures",
     "Jewelery, art, electronics, tools,sports & hobby equipment", "Other Special Items".
     "isInPossession" is "Yes" or "No".
   - For bank_accounts_savings_securities_pension, "category_bassp" is EXACTLY one
     of: "Investments", "Bank accounts", "Life Insurance", "Savings Plans",
     "Other Assets". Put account-specific wording such as Chequing or RRSP in
     description_bassp instead of inventing a dropdown value.
   - For life_and_disability_insurance, "insurance_type" is EXACTLY one of:
     "Life Insurance", "Pension Fund", or "Disability Cover".

8. section="DebtsAndLiabilities"   (optional; array — one object per debt)
   data: [ { "category", "details", "on_date_of_marriage",
             "on_valuation_date", "today" } ]
   - "category" is EXACTLY one of: "Mortgages", "Line of credits", "Other loans",
     "Outstanding credit card balances", "Unpaid Support Amounts", "Other Debts".
     Put the lender/card type and other specifics in "details".

9. section="Court"   (optional — but always asked about)
   data: { "name", "fileNumber", "address" }
   - Court name, court file number, and court address. Save this section only if
     a court case has actually been started; if there is none, ask once, accept
     the answer, and save nothing.
   - Take "name" and "address" from the supplied court list whenever one of its
     entries matches what the user said, so they match the intake form's court
     picker exactly. Never show that whole list.

10. section="OtherPersonsInHousehold"   (optional; a single object)
    data: {
      "live_alone" ("yes"/"no", lowercase),
      "name_of_person_married_to",
      "name_of_other_adults",
      "number_of_children",
      "spouse_partner_work_status",
      "amount_spouse_partner_earns"
    }
    - Describes who else lives in the CLIENT's household: a new spouse/partner,
      other adults, and other children. Set "live_alone" to "yes" (lowercase) if
      the client lives alone and leave the other fields empty; otherwise "no".
    - "spouse_partner_work_status" MUST be EXACTLY one of: "Full Time", "Part Time",
      "Unemployed", "Retired", "Disabled", "Other" (a work status, not a job title).
      Offer those six as a numbered choice rather than asking what they do.
    - "number_of_children" and "amount_spouse_partner_earns" are numbers as strings.
"""

INTAKE_OUTRO = """
When all required sections are complete and every optional section has either been
provided or explicitly skipped, your final plain-text response MUST begin exactly:
"Required information saved."

Only the following are actually required: both parties' names, the date of
marriage and the date of separation, each party's employment status, and at least
one income line for each party. Children, assets, debts, expenses, court and
household details are optional — a matter can reach this point without them. So
do not tell the user the intake is finished or that there is nothing left to do.

After that opening line, briefly say what was captured, then make both ways
forward explicit: they can return to Tasks whenever they're ready, or keep going
and add the children, assets, debts or expenses. Do not ask another intake
question after this final message — but if the user does continue, carry on
normally and save what they give you.
"""

INTAKE_SYSTEM = INTAKE_INTRO + INTAKE_SECTION_SHAPES + INTAKE_OUTRO

# ── Update Information agent ────────────────────────────────────────────────────
# Same tool and the same section shapes as intake, but this agent only changes
# values that are already on file — it never runs an intake.

# The short form of intake's pick-from-a-list rules. Intake keeps its own fuller
# version for its long menus; this one is for the smaller questions the update
# agent asks, above all "which of these records did you mean?".
NUMBERED_CHOICES_RULE = """

───────────────────────────────────────────────
QUESTIONS WITH A FIXED SET OF ANSWERS
───────────────────────────────────────────────
When a question has a closed set of possible answers — three or more — put them
on their own lines, numbered from 1, rather than running them together in a
sentence. The same goes for asking the user to pick one record out of several
you can already see: number the candidates and show what tells them apart.

Do not tell the user how to reply and do not add "reply with a number" or "say
none" — the numbers are there so they can use one if they want. Take whatever
form the answer comes in: a number, a name, or a phrase like "the first one".
If a number does not match any item, say which one you could not place instead
of re-sending the list.

Do not number a plain yes/no question, and never number an open one — a date, an
amount, a name, an address. Those are not choices.
"""

UPDATE_INTRO = """
You are the update-information assistant for CloudAct, an Ontario family-law
platform. This matter's intake has already been done. Your ONLY job is to change
values that are already on file. You never run a fresh intake.

The conversation opens with an authoritative snapshot of everything currently
stored for this matter. Treat that snapshot as the truth.

Your FIRST message must be one short question asking what the user wants to
change (for example: "What would you like to change?"). Do not list every field
and do not summarise the file unless the user asks.

For each change the user asks for:

1. Work out exactly which stored value they mean. If more than one record could
   match — two properties, two children, two income lines, both parties — ask
   which one before saving anything. Never guess which record to change.
   Ask it as a numbered list of the records that actually match, each shown by
   what tells it apart from the others — an address, a child's name, the income
   type and its amount, the party's name:

       Which one do you mean?

       1. 168 Westcourt Pl — $610,000
       2. 40 Rideau St — $285,000

   Never make the user retype a description you could have listed.

2. In that SAME turn, call the save_matter_section tool once with the smallest
   patch that makes the change: the new value plus only the identity fields
   needed to match the existing record (party role, child name/date of birth,
   income or expense type, asset category and its address/description, debt
   category and details).

3. Then reply in exactly this form, on its own line:
   Updated **<field>** from **<old value>** to **<new value>**.
   <field> is the plain-English name for the value, the way the user would say it
   ("home phone number", "date of separation", "the RRSP's current value") — never
   the internal field or section name from this prompt ("phone", "dateOfSeparation",
   "category_bassp", "IncomeAndBenefits"). Those names must not appear anywhere in
   what you say. Do not narrate your process either — no "let me pull that up",
   "since the record shows", "now I'll move to that section".
   Take <old value> verbatim from the snapshot, or from a change made earlier in
   this same conversation. If the field had no stored value, write "(not set)"
   as the old value. NEVER invent, round, or approximate an old value. If you
   cannot find the old value in the snapshot, say so instead of guessing.
   After that line, ask whether there is anything else to change.

CRITICAL: never end a turn with only a promise to save ("let me update that").
When you have the change, EMIT the save_matter_section tool call in that turn.

Each save_matter_section call is a PATCH, not a replacement. Send only the value
being changed plus the identity fields that match the record. Never restate
unrelated fields, never send empty strings for fields you were not asked about,
and never use a blank value to clear a stored value. Never invent data.

Do not ask for information the user did not offer, and do not work through the
intake sections in order. If the user asks what is currently on file, answer
from the snapshot and save nothing. If they ask to change something that has no
stored value yet, save it and report the old value as "(not set)".

Use direct, professional language. Do not open replies with filler such as
"Absolutely" or "You're right".
"""

UPDATE_OUTRO = """
Pick the section that owns the value the user named. For example: a property's
value is Assets → that category's item → its market_value block; a phone number
or address is Background → that party's record; a salary is IncomeAndBenefits →
that party's income line; a separation date is Relationship.

Never produce an "intake complete" summary — this assistant stays available for
as many changes as the user wants to make.
"""

UPDATE_SYSTEM = (
    UPDATE_INTRO + INTAKE_SECTION_SHAPES + UPDATE_OUTRO + NUMBERED_CHOICES_RULE
)

SAVE_SECTION_TOOL = {
    "name": "save_matter_section",
    "description": (
        "Save one section of the matter intake. Call this each time a section is "
        "complete. 'section' must be one of the exact section names listed in the "
        "system prompt and 'data' must match that section's documented shape exactly."
    ),
    "input_schema": {
        "type": "object",
        "required": ["section", "data"],
        "properties": {
            "section": {
                "type": "string",
                "enum": list(INTAKE_SECTION_NAMES),
                "description": "Which intake section this data belongs to.",
            },
            "data": {
                "description": (
                    "The section payload. An object for Background, Relationship, "
                    "IncomeAndBenefits, EmploymentDetails, Expenses, Assets, Court "
                    "and OtherPersonsInHousehold; an array for Children and "
                    "DebtsAndLiabilities. Use the exact field names from the system prompt."
                ),
            },
        },
    },
}

# Same tool name and schema as intake — only the description changes, so the
# update agent is told to send a single targeted patch rather than a whole section.
UPDATE_SECTION_TOOL = {
    **SAVE_SECTION_TOOL,
    "description": (
        "Apply one change to a value already stored for this matter. Send only "
        "the field being changed plus the identity fields needed to match the "
        "existing record. 'section' must be one of the exact section names listed "
        "in the system prompt and 'data' must match that section's documented "
        "shape exactly. This is a patch: omitted fields keep their stored values."
    ),
}


@app.route("/intake-chat", methods=["POST"])
def intake_chat():
    """Matter-intake AI agent.

    Same Claude message-loop pattern as /chat, but instead of computing anything the
    tool records structured section data. This endpoint never writes to the matter
    database itself — it returns the collected sections so the authenticated frontend
    can persist them via its existing save_matter action.
    """
    try:
        body = request.get_json(force=True)
        messages = body.get("messages", [])
        saved_section_names = saved_intake_section_names(messages)

        client = anthropic.Anthropic()  # reads ANTHROPIC_API_KEY from env

        saved_sections = []  # [{ "section": str, "data": object|array }, ...]
        nudges = 0           # how many times we've pushed a stalled "I'll save" turn

        # Loop — exits once Claude produces a reply with no further tool call.
        # max_tokens must be roomy: a bulk paste makes the model emit many
        # save_matter_section tool calls in ONE turn, and if it hits the token
        # cap mid-flight the turn ends with stop_reason "max_tokens" on unanswered
        # tool_use blocks — which 400s the next request. Higher cap + answering
        # tool calls by PRESENCE (below) rather than stop_reason avoids that.
        for _ in range(16):

            response = client.messages.create(
                model=os.getenv("CLAUDE_MODEL", "claude-sonnet-4-6"),
                max_tokens=8192,
                system=INTAKE_SYSTEM,
                tools=[SAVE_SECTION_TOOL],
                messages=messages,
            )

            # Convert Claude's response content to plain dicts for JSON transport.
            assistant_content = []
            for block in response.content:
                if hasattr(block, "model_dump"):
                    assistant_content.append(block.model_dump())
                else:
                    assistant_content.append(block)

            messages.append({"role": "assistant", "content": assistant_content})

            # Answer EVERY tool_use with a tool_result, keyed off the blocks that are
            # actually present (NOT response.stop_reason — a max_tokens cut-off leaves
            # tool_use blocks with stop_reason "max_tokens", and skipping them here
            # would leave them unpaired and 400 the next call). Then loop so the model
            # can save the remaining sections and write its summary.
            tool_uses = [b for b in assistant_content if b.get("type") == "tool_use"]
            if tool_uses:
                tool_results = []
                for block in tool_uses:
                    section = block.get("input", {}).get("section")
                    data = block.get("input", {}).get("data")
                    saved_sections.append({"section": section, "data": data})
                    if section in INTAKE_SECTION_NAMES:
                        saved_section_names.add(section)
                    tool_results.append({
                        "type":        "tool_result",
                        "tool_use_id": block["id"],
                        "content":     json.dumps({"status": "saved", "section": section}),
                    })
                messages.append({"role": "user", "content": tool_results})
                continue

            # No tool call this turn — a question, a stall, or the final summary.
            reply = "".join(
                b["text"] for b in assistant_content if b.get("type") == "text"
            )
            # Guard against the "let me now save this section by section" stall:
            # the model announces it will save but ends the turn without emitting
            # any tool call, so nothing gets persisted. If it clearly intends to
            # save, nudge it to actually call the tool instead of dead-ending on
            # the user. Bounded so a genuine question/summary still returns.
            if should_nudge_intake_reply(reply) and nudges < 2:
                nudges += 1
                messages.append({
                    "role": "user",
                    "content": (
                        "Go ahead now: call the save_matter_section tool for every "
                        "section you already have information for — do not just "
                        "describe what you will do. If you are still missing "
                        "information for a section, ask your next question instead."
                    ),
                })
                continue
            return jsonify({
                "reply": reply,
                "messages": messages,
                "saved_sections": saved_sections,
                "intake_complete": (
                    set(INTAKE_SECTION_NAMES).issubset(saved_section_names)
                    or is_intake_complete_reply(reply)
                ),
            })

        return jsonify({"error": "Reached iteration limit without a final reply."}), 500

    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ── /update-chat ────────────────────────────────────────────────────────────────


@app.route("/update-chat", methods=["POST"])
def update_chat():
    """Update-information AI agent.

    Same message loop as /intake-chat and the same save_matter_section tool, but
    the agent only edits values that are already on file. Like /intake-chat it
    never writes to the matter database itself: it returns the requested changes
    as `saved_sections` patches, and the authenticated frontend persists them and
    reports the real before/after values it read back from the database.
    """
    try:
        body = request.get_json(force=True)
        messages = body.get("messages", [])

        client = anthropic.Anthropic()  # reads ANTHROPIC_API_KEY from env

        saved_sections = []  # [{ "section": str, "data": object|array }, ...]
        nudges = 0           # how many times we've pushed a stalled "I'll save" turn

        # Bounded loop — exits on the first turn with no tool call. Tool calls are
        # answered by PRESENCE (not stop_reason) for the same reason as intake: a
        # max_tokens cut-off would otherwise leave tool_use blocks unpaired and 400
        # the next request.
        for _ in range(16):

            response = client.messages.create(
                model=os.getenv("CLAUDE_MODEL", "claude-sonnet-4-6"),
                max_tokens=8192,
                system=UPDATE_SYSTEM,
                tools=[UPDATE_SECTION_TOOL],
                messages=messages,
            )

            assistant_content = []
            for block in response.content:
                if hasattr(block, "model_dump"):
                    assistant_content.append(block.model_dump())
                else:
                    assistant_content.append(block)

            messages.append({"role": "assistant", "content": assistant_content})

            tool_uses = [b for b in assistant_content if b.get("type") == "tool_use"]
            if tool_uses:
                tool_results = []
                for block in tool_uses:
                    section = block.get("input", {}).get("section")
                    data = block.get("input", {}).get("data")
                    saved_sections.append({"section": section, "data": data})
                    tool_results.append({
                        "type":        "tool_result",
                        "tool_use_id": block["id"],
                        "content":     json.dumps({"status": "saved", "section": section}),
                    })
                messages.append({"role": "user", "content": tool_results})
                continue

            reply = "".join(
                b["text"] for b in assistant_content if b.get("type") == "text"
            )
            # Same stall guard as intake: the model says it will make the change
            # but ends the turn without emitting a tool call, so nothing is saved.
            if should_nudge_intake_reply(reply) and nudges < 2:
                nudges += 1
                messages.append({
                    "role": "user",
                    "content": (
                        "Go ahead now: call the save_matter_section tool for the "
                        "change I asked for — do not just describe what you will "
                        "do. If you still need to know which record to change, ask "
                        "that question instead."
                    ),
                })
                continue
            return jsonify({
                "reply": reply,
                "messages": messages,
                "saved_sections": saved_sections,
            })

        return jsonify({"error": "Reached iteration limit without a final reply."}), 500

    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ── /t1-extract ─────────────────────────────────────────────────────────────────

T1_EXTRACT_SYSTEM = """
You are a document-extraction assistant for CloudAct, an Ontario family-law
platform. You are given one uploaded file that should be a Canadian T1 Income
Tax and Benefit Return (it may be a scan or photo). Read it and record the
intake-relevant data by calling the record_t1_data tool exactly once.

Rules:
- NEVER extract or output the Social Insurance Number (SIN) or any part of it.
- Never invent values. If a field is not present or not legible, use "" for it.
- Amounts are yearly CAD figures as plain number strings with two decimals and
  no currency symbols or thousands separators (e.g. "85000.00").
- "province" is the full province name (e.g. "Ontario", not "ON").
- Dates are YYYY-MM-DD.
- incomeLines: one entry per income line on the return that has a non-zero
  amount (employment income 10100, other employment income 10400, OAS 11300,
  CPP/QPP 11400, other pensions 11500, split pension 11600, UCCB 11700,
  EI benefits 11900, taxable dividends 12000, interest/investment 12100,
  partnership 12200, RDSP 12500, rental 12600, taxable capital gains 12700,
  support payments received 12800, RRSP income 12900, other income 13000,
  self-employment lines 13500/13700/13900/14100/14300, workers' compensation
  14400, social assistance 14500, net federal supplements 14600). Use a short
  human label for "label" (e.g. "Employment income") and the line number for
  "line".
- If the file is NOT a T1 return (or you cannot find any T1 content), set
  is_t1 to false and leave everything else empty.
"""

T1_ALLOWED_MEDIA_TYPES = {"application/pdf", "image/png", "image/jpeg", "image/webp"}

T1_RECORD_TOOL = {
    "name": "record_t1_data",
    "description": (
        "Record the intake-relevant data extracted from the uploaded T1 income "
        "tax return. Call exactly once. Leave unknown fields as empty strings."
    ),
    "input_schema": {
        "type": "object",
        "required": ["is_t1"],
        "properties": {
            "is_t1": {
                "type": "boolean",
                "description": "True only if the uploaded document is a Canadian T1 income tax return.",
            },
            "taxYear": {
                "type": "string",
                "description": "The tax year the return covers, e.g. '2025'.",
            },
            "taxpayer": {
                "type": "object",
                "properties": {
                    "firstName":     {"type": "string"},
                    "lastName":      {"type": "string"},
                    "dateOfBirth":   {"type": "string", "description": "YYYY-MM-DD"},
                    "maritalStatus": {"type": "string", "description": "As ticked on the return, e.g. 'Married', 'Separated'."},
                    "address":       {"type": "string", "description": "Street address incl. apt/unit. No city/province."},
                    "poBox":         {"type": "string", "description": "PO Box, if the mailing address uses one."},
                    "city":          {"type": "string"},
                    "province":      {"type": "string", "description": "Full name, e.g. 'Ontario'."},
                    "postalCode":    {"type": "string"},
                    "phone":         {"type": "string"},
                    "email":         {"type": "string"},
                    "spouseName":    {"type": "string", "description": "Full name of the taxpayer's spouse or common-law partner, if shown on the return."},
                },
            },
            "incomeLines": {
                "type": "array",
                "items": {
                    "type": "object",
                    "required": ["label", "amount"],
                    "properties": {
                        "line":   {"type": "string", "description": "T1 line number, e.g. '10100'."},
                        "label":  {"type": "string", "description": "Short income-type label, e.g. 'Employment income'."},
                        "amount": {"type": "string", "description": "Yearly CAD amount, e.g. '85000.00'."},
                    },
                },
            },
            "totalIncome":   {"type": "string", "description": "Line 15000 (total income)."},
            "netIncome":     {"type": "string", "description": "Line 23600 (net income)."},
            "taxableIncome": {"type": "string", "description": "Line 26000 (taxable income)."},
        },
    },
}


@app.route("/t1-extract", methods=["POST"])
def t1_extract():
    """Extract intake-relevant data from an uploaded T1 income tax return.

    Accepts JSON { media_type, data } where data is the base64-encoded file
    (PDF or image). Sends the document to Claude with a forced tool call and
    returns the structured extraction. Like /intake-chat, this endpoint never
    writes to the matter database — the authenticated frontend persists the
    (user-reviewed) data via its existing patch_matter_intake action. The raw
    file is not stored anywhere server-side.
    """
    try:
        body = request.get_json(force=True)
        media_type = body.get("media_type")
        file_data = body.get("data") or ""

        if media_type not in T1_ALLOWED_MEDIA_TYPES:
            return jsonify({"error": "Unsupported file type. Please upload a PDF or an image (PNG, JPEG or WebP)."}), 400
        # The API rejects base64 containing whitespace/newlines.
        file_data = "".join(file_data.split())
        if not file_data:
            return jsonify({"error": "No file was received. Please try the upload again."}), 400
        if len(file_data) > 43_000_000:  # ~32 MB decoded, the API request cap
            return jsonify({"error": "That file is too large. Please upload a copy under 30 MB."}), 400

        block_type = "document" if media_type == "application/pdf" else "image"

        client = anthropic.Anthropic()  # reads ANTHROPIC_API_KEY from env
        try:
            response = client.messages.create(
                model=os.getenv("CLAUDE_MODEL", "claude-sonnet-4-6"),
                max_tokens=4096,
                system=T1_EXTRACT_SYSTEM,
                tools=[T1_RECORD_TOOL],
                tool_choice={"type": "tool", "name": "record_t1_data"},
                messages=[{
                    "role": "user",
                    "content": [
                        {
                            "type": block_type,
                            "source": {
                                "type": "base64",
                                "media_type": media_type,
                                "data": file_data,
                            },
                        },
                        {
                            "type": "text",
                            "text": "Extract the intake-relevant data from this T1 income tax return.",
                        },
                    ],
                }],
            )
        except anthropic.BadRequestError:
            # The document/image couldn't be decoded or rendered (corrupt file,
            # unreadable scan, empty page, etc.). Surface a user-friendly message
            # instead of leaking the raw API error.
            return jsonify({
                "error": "That file couldn't be read. Please upload a clearer copy "
                         "of the T1 — a good-quality PDF or a sharp, well-lit photo."
            }), 422

        extracted = None
        for block in response.content:
            if getattr(block, "type", None) == "tool_use" and block.name == "record_t1_data":
                extracted = block.input
                break

        if not isinstance(extracted, dict):
            return jsonify({"error": "The document could not be read. Please try a clearer copy."}), 502
        if not extracted.get("is_t1"):
            return jsonify({
                "error": "That file doesn't look like a T1 Income Tax and Benefit Return. "
                         "Please upload the client's T1 (a scan or photo is fine)."
            }), 422

        return jsonify({"extracted": extracted})

    except Exception as e:
        return jsonify({"error": str(e)}), 500


def _parse_dob(dob) -> str:
    """Normalise a date-of-birth value to 'YYYY-MM-DD'.

    Handles:
      - None / missing          → '2000-01-01'
      - ISO string 'YYYY-MM-DD' → unchanged
      - JS timestamp (ms int)   → converted via datetime
    """
    if dob is None:
        return "2000-01-01"
    if isinstance(dob, (int, float)):
        try:
            return datetime.fromtimestamp(dob / 1000, tz=timezone.utc).strftime("%Y-%m-%d")
        except Exception:
            return "2000-01-01"
    return str(dob)[:10]


@app.route("/spousal-calculate", methods=["POST"])
def spousal_calculate():
    try:
        data = request.get_json(force=True)

        party1_gross      = float(data["party1_net_income"])   # frontend sends gross as "net_income"
        party2_gross      = float(data["party2_net_income"])
        party1_age        = int(data.get("party1_age", 35))
        recipient_age     = int(data["recipient_age"])
        years             = float(data["years"])
        province          = data.get("province", "ON")
        year              = int(data.get("year", 2025))
        youngest_child_age = float(data.get("youngest_child_age", 0.0))

        # --- Build children list and child_counts ---
        raw_children  = data.get("children_list", []) or []
        has_children  = bool(data.get("children", False)) or len(raw_children) > 0

        tax_children = [
            TaxChildInfo(
                date_of_birth       = _parse_dob(c.get("dateOfBirth") or c.get("date_of_birth")),
                custody_arrangement = c.get("custodyArrangement") or c.get("custody_arrangement", "Party 1"),
                child_has_disability = "Yes" if c.get("hasDisability") or c.get("child_has_disability") else "No",
            )
            for c in raw_children
        ]

        if raw_children:
            child_counts = compute_child_counts(raw_children)
            minor_total  = child_counts["party1"] + child_counts["party2"] + child_counts["shared"]
        else:
            child_counts = {"party1": 0, "party2": 0, "shared": 0,
                            "party1WithAdultChild": 0, "party2WithAdultChild": 0}
            minor_total  = 0

        # --- CS amounts: pass -1 to let the function compute from children ---
        monthly_cs_paid  = float(data["monthly_child_support"])  if "monthly_child_support"  in data else -1
        monthly_notional = float(data["monthly_notional_child_support"]) if "monthly_notional_child_support" in data else -1

        # --- Determine payor/recipient for response label ---
        payor_gross     = party1_gross if party1_gross >= party2_gross else party2_gross
        recipient_gross = party2_gross if party1_gross >= party2_gross else party1_gross
        payor_name      = data.get("party1_name", "Party 1") if party1_gross >= party2_gross else data.get("party2_name", "Party 2")
        recipient_name  = data.get("party2_name", "Party 2") if party1_gross >= party2_gross else data.get("party1_name", "Party 1")
        payor_age       = party1_age if party1_gross >= party2_gross else recipient_age

        # --- No-children path: without-child formula (1.5%/1.75%/2% × income diff) ---
        if not has_children:
            result_nc = calculate_spousal_support_no_children(
                party1_name         = payor_name,
                party2_name         = recipient_name,
                party1_gross_income = payor_gross,
                party2_gross_income = recipient_gross,
                years               = years,
                recipient_age       = recipient_age,
            )
            return jsonify({
                "payor":               payor_name,
                "recipient":           recipient_name,
                "monthly_low":         result_nc.monthly_low,
                "monthly_med":         result_nc.monthly_med,
                "monthly_high":        result_nc.monthly_high,
                "annual_low":          result_nc.annual_low,
                "annual_med":          result_nc.annual_med,
                "annual_high":         result_nc.annual_high,
                "payor_indi_low":      0, "payor_indi_mid":      0, "payor_indi_high":      0,
                "recipient_indi_low":  0, "recipient_indi_mid":  0, "recipient_indi_high":  0,
                "payor_taxes_low":     0, "payor_taxes_mid":     0, "payor_taxes_high":     0,
                "recipient_taxes_low": 0, "recipient_taxes_mid": 0, "recipient_taxes_high": 0,
                "payor_benefits_low":     0, "payor_benefits_mid":     0, "payor_benefits_high":     0,
                "recipient_benefits_low": 0, "recipient_benefits_mid": 0, "recipient_benefits_high": 0,
                "iterations_low":      0, "iterations_mid":      0, "iterations_high":      0,
                "duration_low":        result_nc.duration_low,
                "duration_high":       result_nc.duration_high,
            })

        # --- Run iterative calculation (computes CS internally if -1) ---
        result = calculate_spousal_support_iterative(
            payor_gross          = payor_gross,
            recipient_gross      = recipient_gross,
            payor_age            = payor_age,
            recipient_age        = recipient_age,
            years                = years,
            children             = tax_children,
            child_counts         = child_counts,
            monthly_cs_paid      = monthly_cs_paid,
            monthly_notional_cs  = monthly_notional,
            youngest_child_age   = youngest_child_age,
            province             = province,
            year                 = year,
            payor_is_party1      = (party1_gross >= party2_gross),
        )

        # --- Determine actual payor/recipient by INDI (disposable income after CS) ---
        # The old app compares household incomes (INDI) not gross incomes.
        # After child support adjustments, the party with higher INDI is the
        # spousal payor — this can differ from the higher-gross-income party.
        if result.recipient_indi_mid > result.payor_indi_mid:
            payor_name, recipient_name = recipient_name, payor_name

        return jsonify({
            "payor":              payor_name,
            "recipient":          recipient_name,
            "monthly_low":        result.monthly_low,
            "monthly_med":        result.monthly_mid,   # IterativeResult uses monthly_mid
            "monthly_high":       result.monthly_high,
            "annual_low":         result.annual_low,
            "annual_med":         result.annual_mid,
            "annual_high":        result.annual_high,
            "payor_indi_low":     result.payor_indi_low,
            "payor_indi_mid":     result.payor_indi_mid,
            "payor_indi_high":    result.payor_indi_high,
            "recipient_indi_low":  result.recipient_indi_low,
            "recipient_indi_mid":  result.recipient_indi_mid,
            "recipient_indi_high": result.recipient_indi_high,
            "payor_taxes_low":     result.payor_taxes_low,
            "payor_taxes_mid":     result.payor_taxes_mid,
            "payor_taxes_high":    result.payor_taxes_high,
            "recipient_taxes_low":  result.recipient_taxes_low,
            "recipient_taxes_mid":  result.recipient_taxes_mid,
            "recipient_taxes_high": result.recipient_taxes_high,
            "payor_benefits_low":     result.payor_benefits_low,
            "payor_benefits_mid":     result.payor_benefits_mid,
            "payor_benefits_high":    result.payor_benefits_high,
            "recipient_benefits_low":  result.recipient_benefits_low,
            "recipient_benefits_mid":  result.recipient_benefits_mid,
            "recipient_benefits_high": result.recipient_benefits_high,
            "iterations_low":     result.iterations_low,
            "iterations_mid":     result.iterations_mid,
            "iterations_high":    result.iterations_high,
            "duration_low":       result.duration_low,
            "duration_high":      result.duration_high,
        })

    except KeyError as e:
        import traceback; traceback.print_exc()
        return jsonify({"error": f"Missing field: {e}"}), 400
    except Exception as e:
        import traceback; traceback.print_exc()
        return jsonify({"error": str(e)}), 400
    
# ── /tax-chat ─────────────────────────────────────────────────────────────────

TAX_CHAT_SYSTEM = """
You are a Canadian income tax intake assistant for CloudAct (Ontario).

Your job is to collect all the information needed to calculate a user's Ontario
income taxes and benefits by asking questions one at a time, then call the
calculate_taxes tool. Do not do any math yourself — the calculator handles all of that.

Ask one question at a time. If the user volunteers multiple pieces of information
at once, extract all of it and only ask about what is still missing.
Use plain language — avoid tax jargon where possible, but do use correct field names
when confirming what you've collected.

Collect the following through conversation:

BASIC INFO
- Age (integer, as of December 31 of the tax year)
- Tax year (default: 2025 if not mentioned)
- Do they have a disability and claim the Disability Tax Credit? (Yes / No)

INCOME  (enter 0 if none — don't skip fields)
- Employed / T4 income (gross employment income before deductions)
- Net self-employment income (after business expenses)
- Other income (interest, dividends, rental income, foreign income, RRSP withdrawals, etc.)
- Spousal / child support received (taxable alimony only — not child support received)
- Deductible support paid (court-ordered spousal support paid to a former spouse)

DEDUCTIONS  (enter 0 if none)
- Child care expenses paid
- Other deductions (RRSP contributions, union dues, moving expenses, etc.)

CHILDREN  (only ask if they mention having children, or if income suggests it)
For each child:
- Date of birth (ask for year and month; you will format it as YYYY-MM-01 internally)
- Custody arrangement: who do they primarily live with?
  Use exactly: "Party 1" (this user), "Party 2" (other parent), or "Shared" (50/50)
- Does the child have a disability? (Yes / No)

If there are children with shared or split custody, also ask:
- Monthly child support this user pays
- Monthly child support the other parent pays
- The other parent's annual income (needed to determine which parent claims the child for credits)

Once you have everything, call calculate_taxes immediately — do not ask for permission.

After you get the result, write a brief plain-language explanation (who qualifies for which benefits, why taxable income differs from gross, etc.), then output the FULL detailed breakdown below — every section, every line, no exceptions. Round all amounts to the nearest dollar and use comma formatting (e.g. $12,345). Include every line even if it is $0.

--- Income ---
Gross income:                      $X,XXX
Taxable income:                    $X,XXX

--- Federal Credits ---
Basic personal amount:             $X,XXX
CPP/EI credit:                     $X,XXX
Canada employment credit:          $X,XXX
Eligible dependent credit:         $X,XXX
Age amount:                        $X,XXX
Disability credit:                 $X,XXX
Total federal credits:             $X,XXX

--- Provincial Credits ---
Basic personal amount (ON):        $X,XXX
Eligible dependent credit (ON):    $X,XXX
Age amount (ON):                   $X,XXX
Disability credit (ON):            $X,XXX
Total provincial credits:          $X,XXX

--- Tax ---
Federal tax before credits:        $X,XXX
Provincial tax before credits:     $X,XXX
Federal tax:                       $X,XXX
Provincial tax:                    $X,XXX
Ontario health premium:            $X,XXX
Ontario surtax:                    $X,XXX
Ontario tax reduction:             $X,XXX
Ontario LIFT credit:               $X,XXX

--- CPP / EI ---
CPP base:                          $X,XXX
CPP enhanced:                      $X,XXX
CPP2:                              $X,XXX
EI premium:                        $X,XXX
Total CPP/EI deductions:           $X,XXX

--- Benefits ---
Canada Workers Benefit:            $X,XXX
Canada Child Benefit:              $X,XXX
GST/HST benefit:                   $X,XXX
Ontario Child Benefit:             $X,XXX
Ontario Sales Tax Credit:          $X,XXX
Climate Action Incentive:          $X,XXX
Total benefits:                    $X,XXX

--- Summary ---
**Federal tax:                     $X,XXX**
**Ontario provincial tax:          $X,XXX**
**Total taxes owing:               $X,XXX**
Total benefits received:           $X,XXX
Net income after tax and benefits: $X,XXX

This full breakdown must always appear at the end of your reply, after any explanation.

Ontario income tax only (2024 or 2025). Politely decline questions about other provinces or corporate tax.
"""

TAX_CALC_TOOL = {
    "name": "calculate_taxes",
    "description": "Calculate Ontario income taxes and benefits once all information has been collected from the user.",
    "input_schema": {
        "type": "object",
        "required": [
            "age", "year",
            "eligible_for_disability",
            "employed_income", "self_employed_income", "other_income",
            "support_received", "deductible_support_paid",
            "child_care_expenses", "other_deductions",
            "children",
            "child_support_party1", "child_support_party2",
            "party2_income"
        ],
        "properties": {
            "age": {
                "type": "integer",
                "description": "User's age as of December 31 of the tax year"
            },
            "year": {
                "type": "integer",
                "description": "Tax year (e.g. 2025). Default to 2025 if not specified.",
                "default": 2025
            },
            "eligible_for_disability": {
                "type": "string",
                "enum": ["Yes", "No"],
                "description": "Does the user have an approved Disability Tax Credit certificate?"
            },
            "employed_income": {
                "type": "number",
                "description": "Gross T4 / employment income in CAD. 0 if none."
            },
            "self_employed_income": {
                "type": "number",
                "description": "Net self-employment income (after business expenses) in CAD. 0 if none."
            },
            "other_income": {
                "type": "number",
                "description": "Other income: interest, dividends, rental, RRSP withdrawals, etc. in CAD. 0 if none."
            },
            "support_received": {
                "type": "number",
                "description": "Taxable spousal support received (NOT child support). 0 if none."
            },
            "deductible_support_paid": {
                "type": "number",
                "description": "Court-ordered spousal support paid to a former spouse (deductible). 0 if none."
            },
            "child_care_expenses": {
                "type": "number",
                "description": "Child care expenses paid in CAD. 0 if none."
            },
            "other_deductions": {
                "type": "number",
                "description": "Other deductions: RRSP, union dues, moving expenses, etc. in CAD. 0 if none."
            },
            "children": {
                "type": "array",
                "description": "List of dependent children. Empty array if no children.",
                "items": {
                    "type": "object",
                    "required": ["date_of_birth", "custody_arrangement", "child_has_disability"],
                    "properties": {
                        "date_of_birth": {
                            "type": "string",
                            "description": "Child's date of birth in YYYY-MM-DD format. Use YYYY-MM-01 if only year/month known."
                        },
                        "custody_arrangement": {
                            "type": "string",
                            "enum": ["Party 1", "Party 2", "Shared"],
                            "description": "Who the child primarily lives with. Party 1 = this user."
                        },
                        "child_has_disability": {
                            "type": "string",
                            "enum": ["Yes", "No"],
                            "description": "Does the child have a disability?"
                        }
                    }
                }
            },
            "child_support_party1": {
                "type": "number",
                "description": "Monthly child support this user (Party 1) pays. 0 if none."
            },
            "child_support_party2": {
                "type": "number",
                "description": "Monthly child support the other parent (Party 2) pays. 0 if none."
            },
            "party2_income": {
                "type": "number",
                "description": "Other parent's annual income in CAD. 0 if no other parent or unknown."
            }
        }
    }
}


def run_tax_calc_tool(tool_input: dict) -> dict:
    """Called when Claude invokes the calculate_taxes tool."""

    children_raw = tool_input.get("children", [])

    # Build child_counts from the children list
    child_counts = {"party1": 0, "party2": 0, "shared": 0,
                    "party1WithAdultChild": 0, "party2WithAdultChild": 0}
    child_infos = []

    today = date.today()
    year = int(tool_input.get("year", 2025))

    for c in children_raw:
        dob_str = c["date_of_birth"]
        try:
            dob = date.fromisoformat(dob_str)
            age = today.year - dob.year - ((today.month, today.day) < (dob.month, dob.day))
            is_adult = age >= 18
        except (ValueError, KeyError):
            is_adult = False

        arrangement = c["custody_arrangement"]
        if arrangement == "Party 1":
            if is_adult:
                child_counts["party1WithAdultChild"] += 1
            else:
                child_counts["party1"] += 1
        elif arrangement == "Party 2":
            if is_adult:
                child_counts["party2WithAdultChild"] += 1
            else:
                child_counts["party2"] += 1
        elif arrangement == "Shared":
            child_counts["shared"] += 1

        child_infos.append(ChildInfo(
            date_of_birth=dob_str,
            custody_arrangement=arrangement,
            child_has_disability=c.get("child_has_disability", "No"),
        ))

    minor_total = child_counts["party1"] + child_counts["party2"] + child_counts["shared"]
    type_of_splitting = determine_type_of_splitting(child_counts, minor_total) if minor_total > 0 else "SEPARATED"

    user_income = (
        float(tool_input.get("employed_income", 0))
        + float(tool_input.get("self_employed_income", 0))
        + float(tool_input.get("other_income", 0))
    )

    inp = TaxInput(
        party_num=1,
        province="ON",
        age=int(tool_input["age"]),
        eligible_for_disability=tool_input.get("eligible_for_disability", "No"),
        employed_income=float(tool_input.get("employed_income", 0)),
        self_employed_income=float(tool_input.get("self_employed_income", 0)),
        other_income=float(tool_input.get("other_income", 0)),
        support_received=float(tool_input.get("support_received", 0)),
        deductible_support_paid=float(tool_input.get("deductible_support_paid", 0)),
        child_care_expenses=float(tool_input.get("child_care_expenses", 0)),
        other_deductions=float(tool_input.get("other_deductions", 0)),
        children=child_infos,
        type_of_splitting=type_of_splitting,
        child_counts=child_counts,
        child_support_amounts={
            "party1": float(tool_input.get("child_support_party1", 0)),
            "party2": float(tool_input.get("child_support_party2", 0)),
        },
        both_incomes={
            "party1": user_income,
            "party2": float(tool_input.get("party2_income", 0)),
        },
        year=year,
    )

    return calculate_taxes(inp)


@app.route("/tax-chat", methods=["POST"])
def tax_chat():
    try:
        body = request.get_json(force=True)
        messages = body.get("messages", [])

        client = anthropic.Anthropic()

        for _ in range(10):
            response = client.messages.create(
                model=os.getenv("CLAUDE_MODEL", "claude-sonnet-4-6"),
                max_tokens=4096,
                system=TAX_CHAT_SYSTEM,
                tools=[TAX_CALC_TOOL],
                messages=messages,
            )

            assistant_content = []
            for block in response.content:
                if hasattr(block, "model_dump"):
                    assistant_content.append(block.model_dump())
                else:
                    assistant_content.append(block)

            messages.append({"role": "assistant", "content": assistant_content})

            if response.stop_reason != "tool_use":
                reply = "".join(
                    b["text"] for b in assistant_content if b.get("type") == "text"
                )
                return jsonify({"reply": reply, "messages": messages})

            tool_results = []
            for block in assistant_content:
                if block.get("type") == "tool_use":
                    result = run_tax_calc_tool(block["input"])
                    tool_results.append({
                        "type":        "tool_result",
                        "tool_use_id": block["id"],
                        "content":     json.dumps(result),
                    })

            messages.append({"role": "user", "content": tool_results})

        return jsonify({"error": "Reached iteration limit without a final reply."}), 500

    except Exception as e:
        return jsonify({"error": str(e)}), 500


SPOUSAL_CHAT_SYSTEM = """
You are a spousal support intake assistant for CloudAct (Ontario).

Your job is to collect all the information needed to calculate Ontario SSAG
spousal support by asking questions one at a time, then call the
calculate_spousal_support tool. Do not do any math yourself.

═══════════════════════════════════════════════
PRE-FILLED MATTER DATA
═══════════════════════════════════════════════
The first message in the conversation is an AUTOMATED database snapshot
generated by the system — the user did not type it. Do NOT thank the user
for providing it, and do not say "thank you for sharing" or similar.
Treat it as information you already have on file.

When the first message contains matter data:
1. Extract ALL relevant data from it — names, incomes, children info,
   relationship dates, ages, etc.
2. Summarize what you found in a brief confirmation message, e.g.:
   "Based on the matter file, I have the following on record:
    - Party 1: John Smith, age 45, income $85,000/yr
    - Party 2: Jane Smith, age 42, income $52,000/yr
    - Married: 2005-06-15, Separated: 2023-01-10 (17.5 years)
    - 2 children: Emma (12), Lucas (9), both live with Party 2

    Is this correct, or would you like to change anything?"
3. If the user confirms or says nothing needs changing, proceed to
   calculate immediately — do NOT re-ask for information you already have.
4. Only ask about fields that are MISSING from the provided data.
5. The user can correct or update any value at any time during the
   conversation — if they do, use their updated value.

If no pre-filled data is provided, fall back to asking questions
one at a time as described below.
═══════════════════════════════════════════════

Ask one question at a time. If the user volunteers multiple pieces of
information at once, extract all of it and only ask about what is still missing.

───────────────────────────────────────────────
STEP 1 — Ask first: are there children from the relationship?
If yes, collect each child's date of birth BEFORE proceeding.
This determines which income type and which formula to use.

IMPORTANT — ALL CHILDREN ARE ADULTS (18+):
After collecting dates of birth, compute each child's age using the
current year ({current_year}). Simply subtract the birth year from
{current_year} — do not worry about the exact date or month.
If EVERY child is 18 or older, inform the user:
  "All children from this relationship are 18 or older and are
   considered adults under the guidelines. Spousal support will
   be calculated using the without-children formula, which does
   not factor in child support obligations."
Then proceed with PATH A (no-children). Set children=false and
do NOT include a children_list in the tool call.

Only use PATH B (with children) when at least one child is under 18.
When there ARE minor children, do NOT mention age calculations, formula
selection, or that you are using the with-children formula. Just silently
proceed with PATH B. The adult-children message above should ONLY appear
when ALL children are 18 or older.
───────────────────────────────────────────────

══════════════════════════════════════════════
PATH A — NO CHILDREN
══════════════════════════════════════════════
Collect:
- Names of each party (optional)
- Party 1 annual GROSS (before-tax) income in CAD
- Party 2 annual GROSS (before-tax) income in CAD
- Years of marriage or common-law cohabitation
- Age of the lower-income spouse at separation

The no-children SSAG formula applies a percentage directly to the gross
income difference — no tax calculation is needed and deductions do not
affect the result. Do NOT ask about deductions on this path.

Set children=false. Call the tool immediately once you have all of the above.

══════════════════════════════════════════════
PATH B — CHILDREN (uses iterative tax-converging formula)
══════════════════════════════════════════════
Collect:
- Names of each party (optional)
- Party 1 annual GROSS (before-tax) income in CAD
- Party 2 annual GROSS (before-tax) income in CAD
- Age of Party 1 at separation
- Age of Party 2 at separation
- Years of marriage or common-law cohabitation

For each child:
- Name
- Date of birth (YYYY-MM-DD)
- Custody: who do they primarily live with? ("Party 1", "Party 2", or "Shared")
- Does the child have a disability? (Yes / No)

Child support amounts (table CS and notional CS) are computed automatically
from the children's details and incomes — do NOT ask the user for these.

DEDUCTIONS — ask this question exactly once, after collecting incomes:
"Does either party have significant tax deductions — such as RRSP
contributions, child care expenses, union dues, or other deductions?"

  • If NEITHER has deductions:
    Set all deduction fields to 0 and call the tool.

  • If PARTY 1 has deductions, collect:
    - RRSP contributions / other deductions (combined, annual CAD)
    - Child care expenses (annual CAD)
    Party 1's result will be fully accurate.

  • If PARTY 2 has deductions, collect ONLY:
    - RRSP contributions / other deductions (combined, annual CAD)
    - Child care expenses (annual CAD)
    Note in your reply that Party 2's tax position is approximate
    (simplified income model; self-employment and other income not captured).

  • If BOTH have deductions, collect the above for each party.

Set children=true. Call the tool once you have everything.

───────────────────────────────────────────────
RESULT FORMAT (always include after the tool returns)
───────────────────────────────────────────────
After the result, explain in plain language who pays and why, then show:

Payor:              [name]
Recipient:          [name]

If the children path was used, show child support first:
Child support:      $X,XXX / month

Then show all three spousal support scenarios separately:
Low (40%):          $X,XXX / month   ($X,XXX / year)
Mid (43%):          $X,XXX / month   ($X,XXX / year)
High (46%):         $X,XXX / month   ($X,XXX / year)

Duration:           [label]

If the children path was used, also show:
Payor INDI (mid):   $X,XXX / year
Recipient INDI (mid): $X,XXX / year

Ontario SSAG only. Politely decline questions about other provinces.

───────────────────────────────────────────────
PDF REPORT
───────────────────────────────────────────────
The tool result will include a download_url field. After presenting the
results, include the download link at the end of your message like this:

[Download PDF Report](DOWNLOAD_URL)

where DOWNLOAD_URL is the download_url value from the tool result.
"""

SPOUSAL_CALC_TOOL = {
    "name": "calculate_spousal_support",
    "description": (
        "Calculate Ontario SSAG spousal support. "
        "Both paths use gross (before-tax) incomes. "
        "Use children=false for the no-children formula (pct × gross income difference). "
        "Use children=true for the iterative tax-converging formula."
    ),
    "input_schema": {
        "type": "object",
        "required": ["years", "children"],
        "properties": {

            # ── Party names ───────────────────────────────────────────────
            "party1_name": {
                "type": "string",
                "description": "Name of Party 1 (optional)"
            },
            "party2_name": {
                "type": "string",
                "description": "Name of Party 2 (optional)"
            },

            # ── Relationship ──────────────────────────────────────────────
            "years": {
                "type": "number",
                "description": "Years of marriage or common-law cohabitation"
            },
            "recipient_age": {
                "type": "number",
                "description": "Age of the lower-income spouse at separation. Required when children=false. When children=true, derived from party1_age/party2_age."
            },
            "children": {
                "type": "boolean",
                "description": "True if there are dependent children. Determines which formula is used."
            },

            # ── Incomes — gross (before-tax) for BOTH paths ───────────────
            "party1_gross_income": {
                "type": "number",
                "description": "Party 1 annual gross (before-tax) income (CAD). Required for both paths."
            },
            "party2_gross_income": {
                "type": "number",
                "description": "Party 2 annual gross (before-tax) income (CAD). Required for both paths."
            },
            "party1_age": {
                "type": "integer",
                "description": "Age of Party 1 at separation. Required when children=true."
            },
            "party2_age": {
                "type": "integer",
                "description": "Age of Party 2 at separation. Required when children=true."
            },

            # ── Children details (children=true only) ─────────────────────
            "children_list": {
                "type": "array",
                "description": "List of children. Required when children=true.",
                "items": {
                    "type": "object",
                    "required": ["date_of_birth", "custody_arrangement", "child_has_disability"],
                    "properties": {
                        "date_of_birth": {
                            "type": "string",
                            "description": "Child's date of birth in YYYY-MM-DD format."
                        },
                        "custody_arrangement": {
                            "type": "string",
                            "enum": ["Party 1", "Party 2", "Shared"],
                            "description": "Who the child primarily lives with."
                        },
                        "child_has_disability": {
                            "type": "string",
                            "enum": ["Yes", "No"],
                            "description": "Does the child have a disability?"
                        }
                    }
                }
            },
            # ── Deductions — Party 1 (children=true path only) ────────────
            "party1_other_deductions": {
                "type": "number",
                "description": "Party 1 annual RRSP contributions + other deductions (CAD). Use 0 if none.",
                "default": 0
            },
            "party1_child_care_expenses": {
                "type": "number",
                "description": "Party 1 annual child care expenses (CAD). Use 0 if none.",
                "default": 0
            },

            # ── Deductions — Party 2 (children=true path only) ────────────
            "party2_other_deductions": {
                "type": "number",
                "description": "Party 2 annual RRSP contributions + other deductions (CAD). Use 0 if none. Result is approximate if non-zero.",
                "default": 0
            },
            "party2_child_care_expenses": {
                "type": "number",
                "description": "Party 2 annual child care expenses (CAD). Use 0 if none. Result is approximate if non-zero.",
                "default": 0
            },

            # ── Optional metadata for PDF report ─────────────────────────
            "party1_province": {
                "type": "string",
                "description": "Province of Party 1 (e.g. 'Ontario'). Optional, for report display."
            },
            "party2_province": {
                "type": "string",
                "description": "Province of Party 2 (e.g. 'Ontario'). Optional, for report display."
            },
            "date_of_marriage": {
                "type": "string",
                "description": "Date of marriage/cohabitation in YYYY-MM-DD format. Optional, for report display."
            },
            "date_of_separation": {
                "type": "string",
                "description": "Date of separation in YYYY-MM-DD format. Optional, for report display."
            },
            "tax_year": {
                "type": "integer",
                "description": "Tax year used for calculation (e.g. 2025). Optional, for report display."
            },
            "party1_claims_dependent": {
                "type": "string",
                "enum": ["Yes", "No"],
                "description": "Does Party 1 claim the eligible dependent credit? Optional, for report display."
            },
            "party2_claims_dependent": {
                "type": "string",
                "enum": ["Yes", "No"],
                "description": "Does Party 2 claim the eligible dependent credit? Optional, for report display."
            },
        }
    }
}

SPOUSAL_REPORT_TOOL = {
    "name": "generate_spousal_report",
    "description": "Generate a PDF report of the spousal support calculation results for the user to download.",
    "input_schema": {
        "type": "object",
        "required": ["party1_name", "party2_name", "party1_income", "party2_income",
                      "payor", "recipient", "formula"],
        "properties": {
            "party1_name":    {"type": "string"},
            "party2_name":    {"type": "string"},
            "party1_income":  {"type": "number", "description": "Party 1 annual guideline income"},
            "party2_income":  {"type": "number", "description": "Party 2 annual guideline income"},
            "years_married":  {"type": "number"},
            "years_cohabited": {"type": "number"},
            "payor":          {"type": "string", "description": "Name of the payor"},
            "recipient":      {"type": "string", "description": "Name of the recipient"},
            "formula":        {"type": "string", "description": "no_children or with_children"},
            "child_support_paid": {"type": "number", "description": "Monthly child support paid by payor (0 if no children)"},
            "children": {
                "type": "array",
                "description": "List of children (empty array if no children)",
                "items": {
                    "type": "object",
                    "properties": {
                        "name": {"type": "string"},
                        "dob":  {"type": "string"},
                        "custody_arrangement": {"type": "string"},
                    }
                }
            },
            "spousal_low_monthly":  {"type": "number"},
            "spousal_mid_monthly":  {"type": "number"},
            "spousal_high_monthly": {"type": "number"},
            "spousal_low_annual":   {"type": "number"},
            "spousal_mid_annual":   {"type": "number"},
            "spousal_high_annual":  {"type": "number"},
            "duration_low_months":  {"type": "number"},
            "duration_high_months": {"type": "number"},
            "calculation_details": {
                "type": "object",
                "description": "Detailed breakdown for LOW/MID/HIGH scenarios (optional)",
            },
            "party1_age":             {"type": "integer", "description": "Age of Party 1"},
            "party2_age":             {"type": "integer", "description": "Age of Party 2"},
            "party1_province":        {"type": "string", "description": "Province of Party 1"},
            "party2_province":        {"type": "string", "description": "Province of Party 2"},
            "recipient_age":          {"type": "number", "description": "Recipient age at separation"},
            "date_of_marriage":       {"type": "string", "description": "Date of marriage/cohabitation (YYYY-MM-DD)"},
            "date_of_separation":     {"type": "string", "description": "Date of separation (YYYY-MM-DD)"},
            "tax_year":               {"type": "integer", "description": "Tax year"},
            "party1_claims_dependent": {"type": "string", "description": "Does Party 1 claim dependent credit (Yes/No)"},
            "party2_claims_dependent": {"type": "string", "description": "Does Party 2 claim dependent credit (Yes/No)"},
        }
    }
}


def run_spousal_report_tool(tool_input: dict) -> dict:
    """Generate a spousal support PDF report and return the download URL."""
    try:
        filename = generate_spousal_support_report(tool_input)
        return {
            "status": "success",
            "download_url": f"/download-report/{filename}",
            "message": "PDF report generated successfully.",
        }
    except Exception as e:
        return {"status": "error", "message": str(e)}


def run_spousal_calc_tool(tool_input: dict) -> dict:
    """
    Routes to:
      - calculate_spousal_support_no_children  when children=False  (gross incomes, pct × diff formula)
      - calculate_spousal_support_iterative    when children=True   (gross incomes + deductions, tax-converging)
    """
    has_children = bool(tool_input["children"])
    p1_name = tool_input.get("party1_name", "Party 1")
    p2_name = tool_input.get("party2_name", "Party 2")
    years         = float(tool_input["years"])
    recipient_age = float(tool_input.get("recipient_age", 0))

    # ── PATH A: no children ──────────────────────────────────────────────────
    if not has_children:
        result = calculate_spousal_support_no_children(
            party1_name=p1_name,
            party2_name=p2_name,
            party1_gross_income=float(tool_input["party1_gross_income"]),
            party2_gross_income=float(tool_input["party2_gross_income"]),
            years=years,
            recipient_age=recipient_age,
        )
        calc_result = {
            "formula":        "no_children",
            "party1_name":    p1_name,
            "party2_name":    p2_name,
            "party1_income":  float(tool_input["party1_gross_income"]),
            "party2_income":  float(tool_input["party2_gross_income"]),
            "party1_age":     int(tool_input.get("party1_age", 0)),
            "party2_age":     int(tool_input.get("party2_age", 0)),
            "party1_province": tool_input.get("party1_province", ""),
            "party2_province": tool_input.get("party2_province", ""),
            "payor":          result.payor,
            "recipient":      result.recipient,
            "years_married":  years,
            "recipient_age":  recipient_age,
            "date_of_marriage":   tool_input.get("date_of_marriage", ""),
            "date_of_separation": tool_input.get("date_of_separation", ""),
            "tax_year":       tool_input.get("tax_year", ""),
            "pct_low":        result.pct_low,
            "pct_med":        result.pct_med,
            "pct_high":       result.pct_high,
            "spousal_low_monthly":  result.monthly_low,
            "spousal_mid_monthly":  result.monthly_med,
            "spousal_high_monthly": result.monthly_high,
            "spousal_low_annual":   result.annual_low,
            "spousal_mid_annual":   result.annual_med,
            "spousal_high_annual":  result.annual_high,
            "monthly_low":    result.monthly_low,
            "monthly_med":    result.monthly_med,
            "monthly_high":   result.monthly_high,
            "annual_low":     result.annual_low,
            "annual_med":     result.annual_med,
            "annual_high":    result.annual_high,
            "duration_label": result.duration_label,
            "children":       [],
            "child_support_paid": 0,
        }
        try:
            filename = generate_spousal_support_report(calc_result)
            calc_result["download_url"] = f"/download-report/{filename}"
            pdf_path = os.path.join(REPORTS_DIR, filename)
            if os.path.isfile(pdf_path):
                with open(pdf_path, "rb") as f:
                    calc_result["pdf_base64"] = base64.b64encode(f.read()).decode("ascii")
                calc_result["pdf_filename"] = filename
        except Exception as e:
            print(f"[spousal] PDF generation error: {e}", flush=True)
        return calc_result

    # ── PATH B: with children (iterative) ────────────────────────────────────
    today = date.today()
    children_raw = tool_input.get("children_list", [])

    child_counts = {"party1": 0, "party2": 0, "shared": 0,
                    "party1WithAdultChild": 0, "party2WithAdultChild": 0}
    child_infos = []

    for c in children_raw:
        dob_str = c["date_of_birth"]
        try:
            dob = date.fromisoformat(dob_str)
            age = today.year - dob.year - ((today.month, today.day) < (dob.month, dob.day))
            is_adult = age >= 18
        except (ValueError, KeyError):
            is_adult = False

        arrangement = c["custody_arrangement"]
        if arrangement == "Party 1":
            if is_adult:
                child_counts["party1WithAdultChild"] += 1
            else:
                child_counts["party1"] += 1
        elif arrangement == "Party 2":
            if is_adult:
                child_counts["party2WithAdultChild"] += 1
            else:
                child_counts["party2"] += 1
        elif arrangement == "Shared":
            child_counts["shared"] += 1

        child_infos.append(ChildInfo(
            date_of_birth=dob_str,
            custody_arrangement=arrangement,
            child_has_disability=c.get("child_has_disability", "No"),
        ))

    # ── Safety net: if ALL children are 18+, fall back to no-children formula ──
    minor_total = child_counts["party1"] + child_counts["party2"] + child_counts["shared"]
    if minor_total == 0:
        # All children are adults — use the without-children formula
        p1_gross = float(tool_input["party1_gross_income"])
        p2_gross = float(tool_input["party2_gross_income"])
        p1_age = int(tool_input.get("party1_age", 0))
        p2_age = int(tool_input.get("party2_age", 0))
        # Recipient is the lower-income party
        if p1_gross >= p2_gross:
            r_age = float(p2_age) if p2_age > 0 else recipient_age
        else:
            r_age = float(p1_age) if p1_age > 0 else recipient_age
        result = calculate_spousal_support_no_children(
            party1_name=p1_name,
            party2_name=p2_name,
            party1_gross_income=p1_gross,
            party2_gross_income=p2_gross,
            years=years,
            recipient_age=float(r_age),
        )
        calc_result = {
            "formula":        "no_children",
            "note":           "All children are 18 or older and are considered adults. Spousal support calculated using the without-children formula.",
            "party1_name":    p1_name,
            "party2_name":    p2_name,
            "party1_income":  p1_gross,
            "party2_income":  p2_gross,
            "party1_age":     p1_age,
            "party2_age":     p2_age,
            "party1_province": tool_input.get("party1_province", ""),
            "party2_province": tool_input.get("party2_province", ""),
            "payor":          result.payor,
            "recipient":      result.recipient,
            "years_married":  years,
            "recipient_age":  r_age,
            "date_of_marriage":   tool_input.get("date_of_marriage", ""),
            "date_of_separation": tool_input.get("date_of_separation", ""),
            "tax_year":       tool_input.get("tax_year", ""),
            "pct_low":        result.pct_low,
            "pct_med":        result.pct_med,
            "pct_high":       result.pct_high,
            "spousal_low_monthly":  result.monthly_low,
            "spousal_mid_monthly":  result.monthly_med,
            "spousal_high_monthly": result.monthly_high,
            "spousal_low_annual":   result.annual_low,
            "spousal_mid_annual":   result.annual_med,
            "spousal_high_annual":  result.annual_high,
            "monthly_low":    result.monthly_low,
            "monthly_med":    result.monthly_med,
            "monthly_high":   result.monthly_high,
            "annual_low":     result.annual_low,
            "annual_med":     result.annual_med,
            "annual_high":    result.annual_high,
            "duration_label": result.duration_label,
            "children":       [],
            "child_support_paid": 0,
        }
        try:
            filename = generate_spousal_support_report(calc_result)
            calc_result["download_url"] = f"/download-report/{filename}"
            pdf_path = os.path.join(REPORTS_DIR, filename)
            if os.path.isfile(pdf_path):
                with open(pdf_path, "rb") as f:
                    calc_result["pdf_base64"] = base64.b64encode(f.read()).decode("ascii")
                calc_result["pdf_filename"] = filename
        except Exception as e:
            print(f"[spousal] PDF generation error: {e}", flush=True)
        return calc_result

    # Determine payor/recipient by gross income to label the result
    p1_gross = float(tool_input["party1_gross_income"])
    p2_gross = float(tool_input["party2_gross_income"])
    p1_age   = int(tool_input["party1_age"])
    p2_age   = int(tool_input["party2_age"])

    payor_is_party1 = p1_gross >= p2_gross

    if payor_is_party1:
        payor_gross, payor_age, payor_name = p1_gross, p1_age, p1_name
        recip_gross, recip_age, recip_name = p2_gross, p2_age, p2_name
        payor_deductions = {
            "other_deductions":    float(tool_input.get("party1_other_deductions", 0.0)),
            "child_care_expenses": float(tool_input.get("party1_child_care_expenses", 0.0)),
        }
        recip_deductions = {
            "other_deductions":    float(tool_input.get("party2_other_deductions", 0.0)),
            "child_care_expenses": float(tool_input.get("party2_child_care_expenses", 0.0)),
        }
    else:
        payor_gross, payor_age, payor_name = p2_gross, p2_age, p2_name
        recip_gross, recip_age, recip_name = p1_gross, p1_age, p1_name
        payor_deductions = {
            "other_deductions":    float(tool_input.get("party2_other_deductions", 0.0)),
            "child_care_expenses": float(tool_input.get("party2_child_care_expenses", 0.0)),
        }
        recip_deductions = {
            "other_deductions":    float(tool_input.get("party1_other_deductions", 0.0)),
            "child_care_expenses": float(tool_input.get("party1_child_care_expenses", 0.0)),
        }

    # Compute youngest child age from DOBs
    child_ages = []
    for c in children_raw:
        try:
            dob = date.fromisoformat(c["date_of_birth"])
            age = today.year - dob.year - ((today.month, today.day) < (dob.month, dob.day))
            child_ages.append(age)
        except (ValueError, KeyError):
            pass
    youngest_child_age = min(child_ages) if child_ages else 0.0

    # CS amounts auto-computed from children + incomes (pass -1)
    result = calculate_spousal_support_iterative(
        payor_gross=payor_gross,
        recipient_gross=recip_gross,
        payor_age=payor_age,
        recipient_age=recip_age,
        years=years,
        children=child_infos,
        child_counts=child_counts,
        monthly_cs_paid=-1,
        monthly_notional_cs=-1,
        payor_is_party1=payor_is_party1,
        youngest_child_age=float(youngest_child_age),
        payor_other_deductions=payor_deductions["other_deductions"],
        payor_child_care_expenses=payor_deductions["child_care_expenses"],
        recip_other_deductions=recip_deductions["other_deductions"],
        recip_child_care_expenses=recip_deductions["child_care_expenses"],
    )

    has_approx = any([
        tool_input.get("party2_other_deductions", 0),
        tool_input.get("party2_child_care_expenses", 0),
    ])

    calc_result = {
        "formula":              "iterative_with_children",
        "party1_name":          p1_name,
        "party2_name":          p2_name,
        "party1_income":        p1_gross,
        "party2_income":        p2_gross,
        "party1_age":           int(tool_input.get("party1_age", 0)),
        "party2_age":           int(tool_input.get("party2_age", 0)),
        "party1_province":      tool_input.get("party1_province", ""),
        "party2_province":      tool_input.get("party2_province", ""),
        "party1_claims_dependent": tool_input.get("party1_claims_dependent", ""),
        "party2_claims_dependent": tool_input.get("party2_claims_dependent", ""),
        "payor":                payor_name,
        "recipient":            recip_name,
        "years_married":        years,
        "recipient_age":        recip_age,
        "date_of_marriage":     tool_input.get("date_of_marriage", ""),
        "date_of_separation":   tool_input.get("date_of_separation", ""),
        "tax_year":             tool_input.get("tax_year", ""),
        "child_support_paid":   result.monthly_cs_paid,
        "monthly_cs_paid":      result.monthly_cs_paid,
        "spousal_low_monthly":  result.monthly_low,
        "spousal_mid_monthly":  result.monthly_mid,
        "spousal_high_monthly": result.monthly_high,
        "spousal_low_annual":   result.annual_low,
        "spousal_mid_annual":   result.annual_mid,
        "spousal_high_annual":  result.annual_high,
        "monthly_low":          result.monthly_low,
        "monthly_mid":          result.monthly_mid,
        "monthly_high":         result.monthly_high,
        "annual_low":           result.annual_low,
        "annual_mid":           result.annual_mid,
        "annual_high":          result.annual_high,
        # INDI breakdown for all scenarios
        "payor_indi_low":       result.payor_indi_low,
        "payor_indi_mid":       result.payor_indi_mid,
        "payor_indi_high":      result.payor_indi_high,
        "recipient_indi_low":   result.recipient_indi_low,
        "recipient_indi_mid":   result.recipient_indi_mid,
        "recipient_indi_high":  result.recipient_indi_high,
        # Taxes for all scenarios
        "payor_taxes_low":      result.payor_taxes_low,
        "payor_taxes_mid":      result.payor_taxes_mid,
        "payor_taxes_high":     result.payor_taxes_high,
        "recipient_taxes_low":  result.recipient_taxes_low,
        "recipient_taxes_mid":  result.recipient_taxes_mid,
        "recipient_taxes_high": result.recipient_taxes_high,
        # Benefits for all scenarios
        "payor_benefits_low":   result.payor_benefits_low,
        "payor_benefits_mid":   result.payor_benefits_mid,
        "payor_benefits_high":  result.payor_benefits_high,
        "recipient_benefits_low":  result.recipient_benefits_low,
        "recipient_benefits_mid":  result.recipient_benefits_mid,
        "recipient_benefits_high": result.recipient_benefits_high,
        # Party 1/Party 2 oriented keys (for PDF columns matching frontend)
        "party1_taxes_low":     result.payor_taxes_low if payor_is_party1 else result.recipient_taxes_low,
        "party1_taxes_mid":     result.payor_taxes_mid if payor_is_party1 else result.recipient_taxes_mid,
        "party1_taxes_high":    result.payor_taxes_high if payor_is_party1 else result.recipient_taxes_high,
        "party2_taxes_low":     result.recipient_taxes_low if payor_is_party1 else result.payor_taxes_low,
        "party2_taxes_mid":     result.recipient_taxes_mid if payor_is_party1 else result.payor_taxes_mid,
        "party2_taxes_high":    result.recipient_taxes_high if payor_is_party1 else result.payor_taxes_high,
        "party1_benefits_low":  result.payor_benefits_low if payor_is_party1 else result.recipient_benefits_low,
        "party1_benefits_mid":  result.payor_benefits_mid if payor_is_party1 else result.recipient_benefits_mid,
        "party1_benefits_high": result.payor_benefits_high if payor_is_party1 else result.recipient_benefits_high,
        "party2_benefits_low":  result.recipient_benefits_low if payor_is_party1 else result.payor_benefits_low,
        "party2_benefits_mid":  result.recipient_benefits_mid if payor_is_party1 else result.payor_benefits_mid,
        "party2_benefits_high": result.recipient_benefits_high if payor_is_party1 else result.payor_benefits_high,
        "party1_indi_low":      result.payor_indi_low if payor_is_party1 else result.recipient_indi_low,
        "party1_indi_mid":      result.payor_indi_mid if payor_is_party1 else result.recipient_indi_mid,
        "party1_indi_high":     result.payor_indi_high if payor_is_party1 else result.recipient_indi_high,
        "party2_indi_low":      result.recipient_indi_low if payor_is_party1 else result.payor_indi_low,
        "party2_indi_mid":      result.recipient_indi_mid if payor_is_party1 else result.payor_indi_mid,
        "party2_indi_high":     result.recipient_indi_high if payor_is_party1 else result.payor_indi_high,
        "duration_label":       f"{result.duration_low} – {result.duration_high} years",
        "approximate":          has_approx,
        "children":             [{"name": c.get("name", ""), "dob": c["date_of_birth"], "custody_arrangement": c["custody_arrangement"]} for c in children_raw],
    }

    try:
        filename = generate_spousal_support_report(calc_result)
        calc_result["download_url"] = f"/download-report/{filename}"
        pdf_path = os.path.join(REPORTS_DIR, filename)
        if os.path.isfile(pdf_path):
            with open(pdf_path, "rb") as f:
                calc_result["pdf_base64"] = base64.b64encode(f.read()).decode("ascii")
            calc_result["pdf_filename"] = filename
    except Exception as e:
        print(f"[spousal] PDF generation error: {e}", flush=True)

    return calc_result

@app.route("/spousal-chat", methods=["POST"])
def spousal_chat():
    try:
        body = request.get_json(force=True)
        messages = body.get("messages", [])

        client = anthropic.Anthropic()
        last_calc_result = None

        for _ in range(10):
            response = client.messages.create(
                model=os.getenv("CLAUDE_MODEL", "claude-sonnet-4-6"),
                max_tokens=4096,
                system=SPOUSAL_CHAT_SYSTEM.format(current_year=CURRENT_YEAR),
                tools=[SPOUSAL_CALC_TOOL],
                messages=messages,
            )

            assistant_content = []
            for block in response.content:
                if hasattr(block, "model_dump"):
                    assistant_content.append(block.model_dump())
                else:
                    assistant_content.append(block)

            messages.append({"role": "assistant", "content": assistant_content})

            if response.stop_reason != "tool_use":
                reply = "".join(
                    b["text"] for b in assistant_content if b.get("type") == "text"
                )
                has_download = "/download-report/" in reply
                print(f"[spousal-chat] Final reply has download link: {has_download}", flush=True)
                if not has_download:
                    print(f"[spousal-chat] Reply (last 200 chars): ...{reply[-200:]}", flush=True)
                resp = {"reply": reply, "messages": messages}
                if last_calc_result:
                    has_pdf = isinstance(last_calc_result, dict) and "pdf_base64" in last_calc_result
                    print(f"[spousal-chat] Returning calculationResult to frontend (has_pdf={has_pdf})", flush=True)
                    resp["calculationResult"] = last_calc_result
                else:
                    print("[spousal-chat] No calculation result in this response", flush=True)
                return jsonify(resp)

            tool_results = []
            for block in assistant_content:
                if block.get("type") == "tool_use":
                    print(f"[spousal-chat] Tool called: {block['name']}", flush=True)
                    result = run_spousal_calc_tool(block["input"])
                    last_calc_result = result
                    print(f"[spousal-chat] Calc tool executed, result keys: {list(result.keys()) if isinstance(result, dict) else 'not dict'}", flush=True)
                    tool_content = {k: v for k, v in result.items() if k != "pdf_base64"} if isinstance(result, dict) else result
                    tool_results.append({
                        "type":        "tool_result",
                        "tool_use_id": block["id"],
                        "content":     json.dumps(tool_content),
                    })

            messages.append({"role": "user", "content": tool_results})

        return jsonify({"error": "Reached iteration limit without a final reply."}), 500

    except Exception as e:
        return jsonify({"error": str(e)}), 500

# ── Entry point ───────────────────────────────────────────────────────────────

if __name__ == "__main__":
    print("\n  ✓  Child Support Calculator running at http://localhost:5050\n")
    app.run(host="0.0.0.0", port=5050, debug=True)
