// ── State ─────────────────────────────────────────────────────────────────────
let childIndex = 0;

// ── Party label helpers ───────────────────────────────────────────────────────
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
    sel.value = current;
  });
}

document.getElementById('p1-name').addEventListener('input', updateAllCustodyDropdowns);
document.getElementById('p2-name').addEventListener('input', updateAllCustodyDropdowns);

// ── Child management ──────────────────────────────────────────────────────────
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

// ── Formatting ────────────────────────────────────────────────────────────────
function fmt(n) {
  return new Intl.NumberFormat('en-CA', {
    style: 'currency', currency: 'CAD', maximumFractionDigits: 2
  }).format(n);
}

// ── Calculate ─────────────────────────────────────────────────────────────────
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
    const name = document.getElementById('child-name-' + id).value || ('Child ' + (parseInt(id) + 1));
    const dob  = document.getElementById('child-dob-' + id).value;
    const custody = document.getElementById('child-custody-' + id).value;
    const csg = document.getElementById('child-csg-' + id).value;
    const override = parseFloat(document.getElementById('child-override-' + id)?.value) || 0;

    let isAdult = false;
    if (dob) {
      const birthDate = new Date(dob);
      const today = new Date();
      const age = today.getFullYear() - birthDate.getFullYear() -
        (today < new Date(today.getFullYear(), birthDate.getMonth(), birthDate.getDate()) ? 1 : 0);
      isAdult = age >= 18;
    }

    children.push({
      name, dob,
      custody_arrangement: custody,
      csg_table: csg,
      child_support_override: override,
      is_adult: isAdult
    });
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

// ── Results rendering ─────────────────────────────────────────────────────────
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

  const netPayer = data.net_payer;
  const netAmount = data.net_monthly;
  const verdictEl = document.getElementById('verdict');
  if (netPayer && netAmount > 0) {
    verdictEl.innerHTML = `<strong>Net payment</strong>${netPayer} pays <b>${fmt(netAmount)}/month</b> (${fmt(netAmount * 12)}/year)`;
  } else {
    verdictEl.innerHTML = `<strong>No net payment</strong> — amounts offset or both parties have $0 obligation.`;
  }
}

// ── Init ──────────────────────────────────────────────────────────────────────
addChild();
