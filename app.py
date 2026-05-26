"""
app.py
------
Simple localhost web interface for the Ontario Child Support Calculator.
Run with:  python app.py
Then open:  http://localhost:5050
"""

import json
import os
import sys
from datetime import date
from flask import Flask, request, jsonify, render_template_string

# ── Make sure child_support.py is importable ─────────────────────────────────
THIS_DIR = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, THIS_DIR)

from child_support import (
    calculate_child_support,
    determine_type_of_splitting,
)

# ── Load Schedule I table once at startup ────────────────────────────────────
SCHEDULE_I_PATH = os.path.join(THIS_DIR, "schedule_i.json")
with open(SCHEDULE_I_PATH, "r") as f:
    SCHEDULE_I = json.load(f)

app = Flask(__name__)

# ── HTML template ─────────────────────────────────────────────────────────────
HTML = """
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1.0"/>
<title>Child Support Calculator — Ontario</title>
<style>
  *, *::before, *::after { box-sizing: border-box; }
  body {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    background: #f4f5f7;
    color: #1a1a2e;
    margin: 0; padding: 0;
  }
  header {
    background: #1a1a2e;
    color: #fff;
    padding: 18px 32px;
    font-size: 1.1rem;
    font-weight: 600;
    letter-spacing: .3px;
  }
  header span { color: #6c8fdb; }
  .container {
    max-width: 860px;
    margin: 32px auto;
    padding: 0 16px 80px;
  }
  .card {
    background: #fff;
    border-radius: 10px;
    box-shadow: 0 1px 4px rgba(0,0,0,.1);
    padding: 24px 28px;
    margin-bottom: 20px;
  }
  h2 {
    font-size: .8rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 1.2px;
    color: #6c8fdb;
    margin: 0 0 18px;
  }
  .row { display: flex; gap: 16px; flex-wrap: wrap; }
  .field { flex: 1; min-width: 180px; display: flex; flex-direction: column; gap: 6px; }
  label { font-size: .82rem; font-weight: 600; color: #555; }
  input, select {
    border: 1.5px solid #d8dde6;
    border-radius: 7px;
    padding: 9px 12px;
    font-size: .92rem;
    outline: none;
    width: 100%;
    transition: border-color .15s;
  }
  input:focus, select:focus { border-color: #6c8fdb; }

  /* ── Children ─────────────────────────────── */
  #children-list { display: flex; flex-direction: column; gap: 14px; }
  .child-card {
    border: 1.5px solid #e4e8f0;
    border-radius: 8px;
    padding: 16px;
    position: relative;
    background: #fafbfd;
  }
  .child-card .child-title {
    font-size: .78rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 1px;
    color: #888;
    margin-bottom: 14px;
  }
  .remove-btn {
    position: absolute; top: 12px; right: 12px;
    background: none; border: none; cursor: pointer;
    font-size: 1rem; color: #aaa; line-height: 1;
  }
  .remove-btn:hover { color: #e05;  }
  .override-row { display: none; margin-top: 10px; }

  #add-child-btn {
    margin-top: 14px;
    background: none;
    border: 1.5px dashed #6c8fdb;
    color: #6c8fdb;
    border-radius: 8px;
    padding: 9px 20px;
    cursor: pointer;
    font-size: .88rem;
    font-weight: 600;
    width: 100%;
    transition: background .15s;
  }
  #add-child-btn:hover { background: #f0f4ff; }

  /* ── Calculate button ─────────────────────── */
  #calc-btn {
    width: 100%;
    padding: 14px;
    background: #1a1a2e;
    color: #fff;
    border: none;
    border-radius: 10px;
    font-size: 1rem;
    font-weight: 700;
    cursor: pointer;
    letter-spacing: .5px;
    transition: background .15s;
  }
  #calc-btn:hover { background: #2c2c4e; }
  #calc-btn:disabled { background: #aaa; cursor: not-allowed; }

  /* ── Results ──────────────────────────────── */
  #result-card { display: none; }
  .result-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
  .result-item { background: #f4f5f7; border-radius: 8px; padding: 14px 16px; }
  .result-item .label { font-size: .75rem; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: #888; margin-bottom: 4px; }
  .result-item .value { font-size: 1.3rem; font-weight: 700; color: #1a1a2e; }
  .result-item .value.positive { color: #1a7f5a; }
  .result-item .value.negative { color: #c0392b; }
  .verdict {
    background: #eef3ff;
    border-left: 4px solid #6c8fdb;
    border-radius: 0 8px 8px 0;
    padding: 14px 18px;
    margin-top: 16px;
    font-size: .95rem;
  }
  .verdict strong { display: block; font-size: 1rem; margin-bottom: 4px; }
  .tag {
    display: inline-block;
    padding: 3px 10px;
    border-radius: 20px;
    font-size: .75rem;
    font-weight: 700;
    letter-spacing: .5px;
    margin-bottom: 12px;
    background: #e8eeff;
    color: #6c8fdb;
  }
  #error-msg {
    display: none;
    background: #fdecea;
    border-left: 4px solid #e05;
    border-radius: 0 8px 8px 0;
    padding: 12px 16px;
    color: #c0392b;
    font-size: .88rem;
    margin-top: 12px;
  }
</style>
</head>
<body>
<header>CloudAct &nbsp;·&nbsp; <span>Ontario Child Support Calculator</span></header>

<div class="container">

  <!-- Party 1 -->
  <div class="card">
    <h2>Party 1</h2>
    <div class="row">
      <div class="field">
        <label>Name (optional)</label>
        <input type="text" id="p1-name" placeholder="e.g. Alex"/>
      </div>
      <div class="field">
        <label>Guideline Income (annual, $)</label>
        <input type="number" id="p1-income" placeholder="e.g. 85000" min="0" step="1"/>
      </div>
    </div>
  </div>

  <!-- Party 2 -->
  <div class="card">
    <h2>Party 2</h2>
    <div class="row">
      <div class="field">
        <label>Name (optional)</label>
        <input type="text" id="p2-name" placeholder="e.g. Jordan"/>
      </div>
      <div class="field">
        <label>Guideline Income (annual, $)</label>
        <input type="number" id="p2-income" placeholder="e.g. 55000" min="0" step="1"/>
      </div>
    </div>
  </div>

  <!-- Children -->
  <div class="card">
    <h2>Children</h2>
    <div id="children-list"></div>
    <button id="add-child-btn" onclick="addChild()">+ Add Child</button>
  </div>

  <!-- Calculate -->
  <button id="calc-btn" onclick="calculate()">Calculate Child Support</button>
  <div id="error-msg"></div>

  <!-- Results -->
  <div class="card" id="result-card">
    <h2>Result</h2>
    <div id="scenario-tag" class="tag"></div>
    <div class="result-grid" id="result-grid"></div>
    <div id="verdict" class="verdict"></div>
  </div>

</div>

<script>
let childIndex = 0;

function getPartyLabels() {
  const p1 = document.getElementById('p1-name').value.trim();
  const p2 = document.getElementById('p2-name').value.trim();
  return { p1: p1 || 'Party 1', p2: p2 || 'Party 2' };
}

function updateAllCustodyDropdowns() {
  const { p1, p2 } = getPartyLabels();
  document.querySelectorAll('.child-card').forEach(card => {
    const id = card.id.replace('child-', '');
    const sel = document.getElementById('child-custody-' + id);
    if (!sel) return;
    const current = sel.value;
    sel.options[0].text = p1;
    sel.options[1].text = p2;
    // Restore selection
    sel.value = current;
  });
}

// Script is at the bottom of body — DOM is already ready, attach directly.
document.getElementById('p1-name').addEventListener('input', updateAllCustodyDropdowns);
document.getElementById('p2-name').addEventListener('input', updateAllCustodyDropdowns);

function addChild() {
  const { p1, p2 } = getPartyLabels();
  const idx = childIndex++;
  const div = document.createElement('div');
  div.className = 'child-card';
  div.id = 'child-' + idx;
  div.innerHTML = `
    <div class="child-title">Child ${idx + 1}</div>
    <button class="remove-btn" onclick="removeChild(${idx})" title="Remove">✕</button>
    <div class="row">
      <div class="field">
        <label>Name</label>
        <input type="text" id="child-name-${idx}" placeholder="e.g. Sam"/>
      </div>
      <div class="field">
        <label>Date of Birth</label>
        <div style="position:relative; display:flex; align-items:center;">
          <input type="text" id="child-dob-${idx}" placeholder="YYYY-MM-DD" style="padding-right:36px;"/>
          <input type="date" id="child-dob-picker-${idx}" style="position:absolute;opacity:0;width:0;height:0;pointer-events:none;"
            onchange="document.getElementById('child-dob-${idx}').value=this.value"/>
          <button type="button" onclick="document.getElementById('child-dob-picker-${idx}').showPicker()"
            style="position:absolute;right:8px;background:none;border:none;cursor:pointer;font-size:1rem;color:#888;padding:0;line-height:1;"
            title="Open date picker">📅</button>
        </div>
      </div>
      <div class="field">
        <label>Lives with</label>
        <select id="child-custody-${idx}">
          <option value="Party 1">${p1}</option>
          <option value="Party 2">${p2}</option>
          <option value="Shared">Shared (50/50)</option>
        </select>
      </div>
      <div class="field">
        <label>Court-ordered amount?</label>
        <select id="child-csg-${idx}" onchange="toggleOverride(${idx})">
          <option value="No">No — use table</option>
          <option value="Yes">Yes — specify amount</option>
        </select>
      </div>
    </div>
    <div class="override-row" id="override-row-${idx}">
      <div class="field" style="max-width:220px">
        <label>Monthly override amount ($)</label>
        <input type="number" id="child-override-${idx}" placeholder="e.g. 800" min="0" step="0.01"/>
      </div>
    </div>
  `;
  document.getElementById('children-list').appendChild(div);
  renumberChildren();
}

function removeChild(idx) {
  const el = document.getElementById('child-' + idx);
  if (el) el.remove();
  renumberChildren();
}

function renumberChildren() {
  const cards = document.querySelectorAll('.child-card');
  cards.forEach((c, i) => {
    c.querySelector('.child-title').textContent = 'Child ' + (i + 1);
  });
}

function toggleOverride(idx) {
  const val = document.getElementById('child-csg-' + idx).value;
  const row = document.getElementById('override-row-' + idx);
  row.style.display = val === 'Yes' ? 'block' : 'none';
}

function fmt(n) {
  return new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD', maximumFractionDigits: 2 }).format(n);
}

function calculate() {
  const btn = document.getElementById('calc-btn');
  const errEl = document.getElementById('error-msg');
  errEl.style.display = 'none';

  const p1Income = parseFloat(document.getElementById('p1-income').value);
  const p2Income = parseFloat(document.getElementById('p2-income').value);
  const p1Name = document.getElementById('p1-name').value.trim() || 'Party 1';
  const p2Name = document.getElementById('p2-name').value.trim() || 'Party 2';

  if (isNaN(p1Income) || isNaN(p2Income)) {
    showError('Please enter guideline incomes for both parties.');
    return;
  }

  const childCards = document.querySelectorAll('.child-card');
  if (childCards.length === 0) {
    showError('Please add at least one child.');
    return;
  }

  const children = [];
  for (const card of childCards) {
    const id = card.id.replace('child-', '');
    const name = document.getElementById('child-name-' + id).value || ('Child ' + (parseInt(id)+1));
    const dob  = document.getElementById('child-dob-' + id).value;
    const custody = document.getElementById('child-custody-' + id).value;
    const csg = document.getElementById('child-csg-' + id).value;
    const override = parseFloat(document.getElementById('child-override-' + id)?.value) || 0;

    // Determine if adult (18+)
    let isAdult = false;
    if (dob) {
      const birthDate = new Date(dob);
      const today = new Date();
      const age = today.getFullYear() - birthDate.getFullYear() -
        (today < new Date(today.getFullYear(), birthDate.getMonth(), birthDate.getDate()) ? 1 : 0);
      isAdult = age >= 18;
    }

    children.push({ name, dob, custody_arrangement: custody, csg_table: csg, child_support_override: override, is_adult: isAdult });
  }

  btn.disabled = true;
  btn.textContent = 'Calculating…';

  fetch('/calculate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      party1_name: p1Name,
      party2_name: p2Name,
      party1_income: p1Income,
      party2_income: p2Income,
      children: children,
    })
  })
  .then(r => r.json())
  .then(data => {
    btn.disabled = false;
    btn.textContent = 'Calculate Child Support';
    if (data.error) { showError(data.error); return; }
    showResults(data, p1Name, p2Name);
  })
  .catch(err => {
    btn.disabled = false;
    btn.textContent = 'Calculate Child Support';
    showError('Server error: ' + err);
  });
}

function showError(msg) {
  const el = document.getElementById('error-msg');
  el.textContent = msg;
  el.style.display = 'block';
  document.getElementById('result-card').style.display = 'none';
}

function showResults(data, p1Name, p2Name) {
  document.getElementById('result-card').style.display = 'block';
  document.getElementById('error-msg').style.display = 'none';

  document.getElementById('scenario-tag').textContent = data.scenario;

  const p1Annual = data.party1_annual;
  const p2Annual = data.party2_annual;
  const p1Ref = data.child_support_ref.party1;
  const p2Ref = data.child_support_ref.party2;

  document.getElementById('result-grid').innerHTML = `
    <div class="result-item">
      <div class="label">${p1Name} — Gross Annual CS</div>
      <div class="value">${fmt(p1Annual)}</div>
    </div>
    <div class="result-item">
      <div class="label">${p2Name} — Gross Annual CS</div>
      <div class="value">${fmt(p2Annual)}</div>
    </div>
    <div class="result-item">
      <div class="label">${p1Name} pays (annual)</div>
      <div class="value ${p1Ref > 0 ? 'negative' : ''}">${fmt(p1Ref)}</div>
    </div>
    <div class="result-item">
      <div class="label">${p2Name} pays (annual)</div>
      <div class="value ${p2Ref > 0 ? 'negative' : ''}">${fmt(p2Ref)}</div>
    </div>
    <div class="result-item">
      <div class="label">${p1Name} pays (monthly)</div>
      <div class="value ${p1Ref > 0 ? 'negative' : ''}">${fmt(p1Ref / 12)}</div>
    </div>
    <div class="result-item">
      <div class="label">${p2Name} pays (monthly)</div>
      <div class="value ${p2Ref > 0 ? 'negative' : ''}">${fmt(p2Ref / 12)}</div>
    </div>
  `;

  // Net verdict
  const netPayer = data.net_payer;
  const netAmount = data.net_monthly;
  const verdictEl = document.getElementById('verdict');
  if (netPayer && netAmount > 0) {
    verdictEl.innerHTML = `<strong>Net payment</strong>${netPayer} pays <b>${fmt(netAmount)}/month</b> (${fmt(netAmount * 12)}/year)`;
  } else {
    verdictEl.innerHTML = `<strong>No net payment</strong> — amounts offset or both parties have $0 obligation.`;
  }
}

// Start with one child
addChild();
</script>
</body>
</html>
"""


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
    return render_template_string(HTML)


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

        # Determine scenario
        type_of_splitting = determine_type_of_splitting(child_counts, total_children)

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

        # Net payer
        p1_ref = result["child_support_ref"]["party1"]
        p2_ref = result["child_support_ref"]["party2"]

        if p1_ref > 0 and p2_ref <= 0:
            net_payer = data.get("party1_name", "Party 1")
            net_monthly = round(p1_ref / 12, 2)
        elif p2_ref > 0 and p1_ref <= 0:
            net_payer = data.get("party2_name", "Party 2")
            net_monthly = round(p2_ref / 12, 2)
        elif p1_ref > p2_ref:
            net_payer = data.get("party1_name", "Party 1")
            net_monthly = round((p1_ref - p2_ref) / 12, 2)
        elif p2_ref > p1_ref:
            net_payer = data.get("party2_name", "Party 2")
            net_monthly = round((p2_ref - p1_ref) / 12, 2)
        else:
            net_payer = None
            net_monthly = 0.0

        return jsonify({
            "scenario":          type_of_splitting,
            "party1_annual":     round(result["party1"], 2),
            "party2_annual":     round(result["party2"], 2),
            "child_support_ref": {
                "party1": round(result["child_support_ref"]["party1"], 2),
                "party2": round(result["child_support_ref"]["party2"], 2),
            },
            "net_payer":   net_payer,
            "net_monthly": net_monthly,
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 400


# ── Entry point ───────────────────────────────────────────────────────────────

if __name__ == "__main__":
    print("\n  ✓  Child Support Calculator running at http://localhost:5050\n")
    app.run(host="0.0.0.0", port=5050, debug=True)
