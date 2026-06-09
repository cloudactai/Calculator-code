"""
app.py
------
Simple localhost web interface for the Ontario Child Support Calculator.
Run with:  python app.py
Then open:  http://localhost:5050
"""
from dotenv import load_dotenv
load_dotenv()
import json
import math
import os
import sys
from datetime import date
from flask import Flask, request, jsonify, render_template
from flask_cors import CORS
import anthropic
from spousal_support import calculate_spousal_support
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
        adult = c.get("is_adult", False)
        custody = c.get("custody_arrangement", "")
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

@app.route("/")
def index():
    return render_template("calculator.html")


@app.route("/calculate", methods=["POST"])
def calculate():
    try:
        data = request.get_json(force=True)

        p1_income = float(data["party1_income"])
        p2_income = float(data["party2_income"])
        children  = data.get("children", [])

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
            party1_province="ON",
            party2_province="ON",
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
            "net_payer":    net_payer,
            "net_monthly":  net_monthly,
            "net_annual":   net_monthly * 12,
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 400


# ── /chat ─────────────────────────────────────────────────────────────────────

CHAT_SYSTEM = """
You are a child support intake assistant for CloudAct (Ontario).

Your job is to collect all the information needed to calculate child support
by asking the user questions one at a time, then pass everything to the
calculator tool. Do not do any math yourself — the calculator handles all of that.

Ask questions one at a time — do not dump a list of questions on the user.
But if the user volunteers multiple pieces of information at once, extract
all of it and only ask about what is still missing.

Collect the following through conversation:

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

Ontario child support only. Politely decline spousal support questions.
"""

CALC_TOOL = {
    "name": "calculate_child_support",
    "description": "Calculate Ontario child support once all information has been collected from the user.",
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
    result = calculate_child_support(
        children=children,
        party1_guideline_income=float(tool_input["party1_income"]),
        party2_guideline_income=float(tool_input["party2_income"]),
        party1_province="ON",
        party2_province="ON",
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

    return {
        "scenario":          type_of_splitting,
        "party1_name":       p1_name,
        "party2_name":       p2_name,
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
    }


@app.route("/chat", methods=["POST"])
def chat():
    try:
        body = request.get_json(force=True)
        messages = body.get("messages", [])

        client = anthropic.Anthropic()  # reads ANTHROPIC_API_KEY from env

        # Loop — normally exits after 2 iterations (1 tool call + 1 reply)
        for _ in range(10):

            response = client.messages.create(
                model=os.getenv("CLAUDE_MODEL", "claude-sonnet-4-6"),
                max_tokens=1024,
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
                return jsonify({"reply": reply, "messages": messages})

            # Claude called the tool — run the calculator and feed the result back
            tool_results = []
            for block in assistant_content:
                if block.get("type") == "tool_use":
                    result = run_calc_tool(block["input"])
                    tool_results.append({
                        "type":        "tool_result",
                        "tool_use_id": block["id"],
                        "content":     json.dumps(result),
                    })

            messages.append({"role": "user", "content": tool_results})

        return jsonify({"error": "Reached iteration limit without a final reply."}), 500

    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/spousal-calculate", methods=["POST"])
def spousal_calculate():
    try:
        data = request.get_json(force=True)

        party1_name   = data.get("party1_name", "Party 1")
        party2_name   = data.get("party2_name", "Party 2")
        party1_income = float(data["party1_income"])
        party2_income = float(data["party2_income"])
        years         = float(data["years"])
        recipient_age = float(data["recipient_age"])

        result = calculate_spousal_support(
            party1_name=party1_name,
            party2_name=party2_name,
            party1_income=party1_income,
            party2_income=party2_income,
            years=years,
            recipient_age=recipient_age,
        )

        return jsonify({
            "payor":             result.payor,
            "recipient":         result.recipient,
            "gross_income_diff": result.gross_income_diff,
            "pct_low":           result.pct_low,
            "pct_med":           result.pct_med,
            "pct_high":          result.pct_high,
            "monthly_low":       result.monthly_low,
            "monthly_med":       result.monthly_med,
            "monthly_high":      result.monthly_high,
            "annual_low":        result.annual_low,
            "annual_med":        result.annual_med,
            "annual_high":       result.annual_high,
            "duration_label":    result.duration_label,
        })

    except KeyError as e:
        return jsonify({"error": f"Missing field: {e}"}), 400
    except Exception as e:
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

After you get the result, explain it clearly:
- Gross income and taxable income
- Federal tax and Ontario provincial tax
- Total taxes
- Key benefits received (CCB, GST/HST credit, CWB, Ontario Child Benefit, etc.)
- Net income after tax and benefits

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
                max_tokens=1024,
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


# ── Entry point ───────────────────────────────────────────────────────────────

if __name__ == "__main__":
    print("\n  ✓  Child Support Calculator running at http://localhost:5050\n")
    app.run(host="0.0.0.0", port=5050, debug=True)
