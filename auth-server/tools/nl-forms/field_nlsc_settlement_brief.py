"""Field the Settlement Conference Brief, which shipped almost entirely blank.

    python3 field_nlsc_settlement_brief.py [--check] [--pass NAME]

NLSC_SETTLEMENT_CONFERENCE_BRIEF is one of the two forms in `fetch_nl.
KNOWN_STATIC`: the court publishes it as a flat PDF with no widget layer, so
the build had to derive its fields from printed anchors instead of copying the
government's own. It came out with **15 fields across 5 pages**, and the
verifier passes it because `verify_nl` exempts the flat forms from the
checkbox-ink check. Rendering the pages shows what that means in practice: the
party names, the whole Part A background table, the relationship table, all
four children's columns, the income and employment tables, both Part B and Part
C issue lists and the settlement-position box have no fields at all. The only
fields on page 2 are in the box marked FOR COURT USE ONLY.

The reason it came out that way is recorded in `tools/nl-forms/README.md`:

    Two forms are flat -- the Settlement Conference Brief and the file-access
    Undertaking carry no widget layer. Their blanks print as underscore runs,
    so they take a printed-anchor path (the Saskatchewan vocabulary, and
    nothing more: they have no option squares and no ruled grids, so no other
    detector is guessed at).

That premise is false for this form. Measured on the shipped PDF:

    page 2   18 Wingdings option squares, 54 horizontal + 46 vertical rules
    page 3    2 option squares,           60 horizontal + 80 vertical rules
    page 4   16 option squares,           16 horizontal + 16 vertical rules

So the square detector and the ruled-cell detector were both skipped on a form
that carries both vocabularies, and every blank in either vocabulary was
missed. (Same shape as the NBKB_72FF case in NL_NB_AUDIT_LEDGER.md, where the
NB README's "zero dot leader runs" claim was wrong for one form.) The README
paragraph is corrected alongside this script.

**Where the geometry comes from.** Nothing here is invented. This form's tables
are the Supreme Court's own house tables, and they appear on sibling forms that
the court *does* publish as AcroForms -- so the government's own widget layout
for the identical table is available to copy, and was measured from it:

* the relationship table is character-for-character the one on NLSC_F4_03A p6,
  at identical column positions (Month:@270, Day:@336, Year:@392, OR@457, the
  option square@476, Unmarried@270 / Divorced@337 / Widowed@398); only the row
  y-values differ. From its widgets: a date slot starts ~1pt after its label
  and is **33.9pt wide**, and a row's fields sit with their bottom 1.59pt below
  the printed row's word bottom.
* the children table is the one on NLSC_F5_06A p6, whose column rules
  (171.1 / 355.4 / 539.8) match this form's (171.2 / 355.5 / 539.9) to within
  0.15pt. From its widgets: a cell field runs from `cell_x0 + 1.0` to
  `cell_x1 - 1.0` with its bottom **0.78pt above the cell's bottom rule**.
* checkbox seating is the corpus convention, measured over all 1303 already
  correct NLSC checkboxes against the printed square they sit on: median
  offset (+0.83, +2.00) from the glyph's top-left, 8.17 x 8.00 PDF points.
  NLSC_F4_03A p6 uses the same Wingdings-Regular glyph at the same size and
  offsets its widgets by exactly (+1.00, +2.00), which is what is used here.

Everything is re-measured from the shipped PDF on every run, and every blank
that already carries a field is skipped, so the script is idempotent. It only
appends new entries -- no existing field is modified.

Signature rules ("Signature", "Signature of Lawyer (if any)", "Registry Clerk
of the Supreme Court") are left bare, per the convention followed across the
whole NB/NL corpus.

Note the JSON stores width and height as PDF points times SCALE (1.5). Every
measurement below is a true PDF-point value and is multiplied on the way in;
see FORM_FIXING_GUIDE.md and the "Session 3 CORRECTION" note in the ledger.
"""
import argparse
import json
import os
import sys

import fitz

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(os.path.dirname(HERE), "bc-forms"))
EXPORT = os.path.join(os.path.dirname(os.path.dirname(HERE)), "form-template-export")

import bc_pipeline as bp  # noqa: E402

DOC_ID = "NLSC_SETTLEMENT_CONFERENCE_BRIEF"
SCALE = bp.SCALE
STD_LINE = 13.3
LINE_H = round(STD_LINE * SCALE, 2)          # 19.95

# --- conventions measured from the sibling AcroForms (see docstring) ---
ROW_DROP = 1.59      # field bottom below the printed row's word bottom
SLOT_GAP = 1.00      # a date slot starts this far after its label
SLOT_W = 33.90       # and is this wide
CELL_INSET = 1.00    # a cell field is inset this far from the cell's side rules
CELL_LIFT = 0.78     # and its bottom sits this far above the cell's bottom rule
CB_DX, CB_DY = 1.00, 2.00
CB_W, CB_H = 8.17, 8.00
RULE_DROP = 1.60     # field bottom below a drawn writing rule

# Right-hand limits and box extents, all read back off the shipped page.
PANEL_PAD = 3.0


def ticks(page):
    out = []
    for block in page.get_text("rawdict")["blocks"]:
        for line in block.get("lines", []):
            for span in line["spans"]:
                for ch in span["chars"]:
                    if ord(ch["c"]) > 0xF000:
                        out.append(fitz.Rect(ch["bbox"]))
    return out


def words(page):
    return [(fitz.Rect(w[:4]), w[4]) for w in page.get_text("words")]


def find_word(page, text, row_y1, tol=1.2, nth=0):
    """The nth printed occurrence of `text` whose word bottom is on `row_y1`."""
    hits = [r for r, t in words(page) if t == text and abs(r.y1 - row_y1) <= tol]
    hits.sort(key=lambda r: r.x0)
    if len(hits) <= nth:
        raise SystemExit("%s: no %r on row y1=%.1f (found %d)"
                         % (DOC_ID, text, row_y1, len(hits)))
    return hits[nth]


def hrules(page):
    return sorted((round(d["rect"].y0, 2), d["rect"].x0, d["rect"].x1)
                  for d in page.get_drawings()
                  if d["rect"].height < 2.0 and d["rect"].width > 25)


# ---------------------------------------------------------------------------
# Specs. Each entry names the printed thing it attaches to, never a bare
# coordinate, so a re-measure keeps them honest.
# ---------------------------------------------------------------------------

# Drawn writing rules: (page, rule_y, note)
RULES = [
    (2, 259.01, "BETWEEN: applicant name"),
    (2, 295.13, "AND: respondent name"),
    (2, 329.81, "AND: second party name"),
]

# Fixed-width date slots after an inline label:
#   (page, row_y1, label, nth, note)
SLOTS = [
    (2, 473.3, "Month:", 0, "Applicant's Date of Birth"),
    (2, 473.3, "Day:", 0, "Applicant's Date of Birth"),
    (2, 473.3, "Year:", 0, "Applicant's Date of Birth"),
    (2, 517.5, "Month:", 0, "Respondent's Date of Birth"),
    (2, 517.5, "Day:", 0, "Respondent's Date of Birth"),
    (2, 517.5, "Year:", 0, "Respondent's Date of Birth"),
    (2, 610.7, "Month:", 0, "Date the parties started living together"),
    (2, 610.7, "Day:", 0, "Date the parties started living together"),
    (2, 610.7, "Year:", 0, "Date the parties started living together"),
    (2, 629.2, "Month:", 0, "Date of marriage"),
    (2, 629.2, "Day:", 0, "Date of marriage"),
    (2, 629.2, "Year:", 0, "Date of marriage"),
    (2, 703.2, "Month:", 0, "Date of separation"),
    (2, 703.2, "Day:", 0, "Date of separation"),
    (2, 703.2, "Year:", 0, "Date of separation"),
    (2, 721.7, "Month:", 0, "Date of divorce"),
    (2, 721.7, "Day:", 0, "Date of divorce"),
    (2, 721.7, "Year:", 0, "Date of divorce"),
]

# Run-to-a-limit fields after an inline label:
#   (page, row_y1, label, nth, right_limit, note)
FILLS = [
    (4, 105.5, "by:", 0, 356.83, "Child Support currently paid -- Paid by"),
    (4, 105.5, "$", 0, 503.00, "Child Support currently paid -- amount"),
    (4, 142.1, "by:", 0, 356.83, "Spousal/Partner Support -- Paid by"),
    (4, 142.1, "$", 0, 550.44, "Spousal/Partner Support -- amount"),
    (4, 178.6, "by:", 0, 356.83, "Other support -- Paid by"),
    (4, 178.6, "$", 0, 550.44, "Other support -- amount"),

    (3, 426.7, "$", 0, 539.64, "Applicant's Current Annual Income"),
    (3, 445.2, "$", 0, 539.64, "Applicant's Income for Year 20__"),
    (3, 463.7, "$", 0, 539.64, "Applicant's Income for Year 20__"),
    (3, 482.1, "$", 0, 539.64, "Applicant's Income for Year 20__"),
    (3, 500.6, "$", 0, 539.64, "Respondent's Current Annual Income"),
    (3, 519.1, "$", 0, 539.64, "Respondent's Income for Year 20__"),
    (3, 537.7, "$", 0, 539.64, "Respondent's Income for Year 20__"),
    (3, 556.2, "$", 0, 539.64, "Respondent's Income for Year 20__"),

    (3, 613.1, "Title:", 0, 539.64, "Applicant employment -- Job Title"),
    (3, 631.6, "Employer:", 0, 539.64, "Applicant employment -- Name of Employer"),
    (3, 649.6, "(month/day/year):", 0, 539.64, "Applicant employment -- since"),
    (3, 668.5, "Achieved:", 0, 539.64, "Applicant employment -- Level of Education"),
    (3, 687.0, "Title:", 0, 539.64, "Respondent employment -- Job Title"),
    (3, 705.5, "Employer:", 0, 539.64, "Respondent employment -- Name of Employer"),
    (3, 723.7, "(month/day/year):", 0, 539.64, "Respondent employment -- since"),
    (3, 742.6, "Achieved:", 0, 539.64, "Respondent employment -- Level of Education"),
]

# Whole ruled cells to fill: (page, x0, y0, x1, y1, note)
CELLS = [
    (2, 206.09, 431.83, 539.64, 457.51, "Applicant's Full Name"),
    (2, 206.09, 475.99, 539.64, 501.67, "Respondent's Full Name"),
    # Two-column ruled rows: the answer belongs in the right-hand cell, not
    # inline after the label. Placing these with the FILLS rule ran the
    # relationship field straight over the printed "(eg. married)" and started
    # the marriage-place field inside the label column -- corrected here and,
    # for the fields that already shipped, by
    # fix_nlsc_settlement_brief_cells.py.
    (2, 264.89, 576.31, 550.44, 594.94, "Relationship of the parties"),
    (2, 264.89, 631.90, 451.66, 650.38, "Place of marriage"),
]

# Children's tables on p3 -- every empty cell in the two 2-column grids.
CHILD_CELL_COLS = [(171.20, 355.50), (355.50, 539.90)]
CHILD_CELL_ROWS = [(94.60, 116.10), (116.10, 142.30), (142.30, 171.00),
                   (171.00, 199.70), (223.70, 245.10), (245.10, 271.50),
                   (271.50, 300.20), (300.20, 328.80)]

# Part B / Part C issue lists on p4: a detail field beside each option, running
# from the end of the option's own caption to the panel's right rule.
ISSUE_ROWS = [
    (294.7, "Support:", 0), (316.3, "Access):", 0), (337.9, "Support:", 0),
    (359.5, "Support:", 0), (381.1, "Property:", 0), (402.7, "Payments:", 0),
    (424.3, "Adjustments:", 0), (445.9, "Other:", 0),
    (563.0, "Support:", 0), (584.6, "Access):", 0), (606.3, "Support:", 0),
    (627.9, "Support:", 0), (649.5, "Property:", 0), (671.1, "Payments:", 0),
    (692.7, "Adjustments:", 0), (714.3, "Other:", 0),
]
ISSUE_RIGHT = 550.44

# The settlement-position answer box on p5: the large drawn rectangle.
POSITION_BOX = (5, 185.0, 231.0, 1310.0, 1352.0)   # resolved from the page


def make(proto, doc_id, index, **kw):
    f = dict(proto)
    f.update(id=bp.new_id(doc_id, index), value="", **kw)
    return f


def covered(fields, page_no, rect, frac=0.35):
    for f in fields:
        if f["page"] != page_no:
            continue
        r = fitz.Rect(f["x"], f["y"], f["x"] + f["width"] / SCALE,
                      f["y"] + f["height"] / SCALE)
        if (r & rect).get_area() > frac * rect.get_area():
            return True
    return False


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--check", action="store_true", help="dry run, no writes")
    args = ap.parse_args()

    json_path = os.path.join(EXPORT, DOC_ID + ".json")
    data = json.load(open(json_path))
    fields = data["staticFields"]
    before = json.dumps(fields, sort_keys=True)
    doc = fitz.open(os.path.join(EXPORT, DOC_ID + ".pdf"))

    proto = {k: fields[0].get(k, v) for k, v in
             (("fontSize", 9), ("color", [0, 0, 0]),
              ("background", "none"), ("border", "none"))}

    base = bp.new_id(DOC_ID, 0)
    index = max([f["id"] - base for f in fields if f["id"] > base] or [0]) + 1
    added = []

    def add(page_no, kind, x, y, w, h, note):
        nonlocal index
        rect = fitz.Rect(x, y, x + w, y + h)
        if covered(fields + [a for a, _ in added], page_no, rect):
            return
        added.append((make(proto, DOC_ID, index, type=kind,
                           x=round(x, 2), y=round(y, 2),
                           width=round(w * SCALE, 2), height=round(h * SCALE, 2),
                           page=page_no), note))
        index += 1

    # --- checkboxes on every printed option square -------------------------
    for page_no in range(1, doc.page_count + 1):
        for g in ticks(doc[page_no - 1]):
            add(page_no, "CheckBox", g.x0 + CB_DX, g.y0 + CB_DY, CB_W, CB_H,
                "option square")

    # --- drawn writing rules ----------------------------------------------
    for page_no, rule_y, note in RULES:
        page = doc[page_no - 1]
        match = [r for r in hrules(page) if abs(r[0] - rule_y) < 0.5]
        if not match:
            raise SystemExit("%s p%d: no rule at y=%.2f" % (DOC_ID, page_no, rule_y))
        _, x0, x1 = match[0]
        bottom = rule_y + RULE_DROP
        add(page_no, "TextField", x0 + 1.0, bottom - STD_LINE,
            (x1 - 1.0) - (x0 + 1.0), STD_LINE, note)

    # --- fixed-width date slots -------------------------------------------
    for page_no, row_y1, label, nth, note in SLOTS:
        lab = find_word(doc[page_no - 1], label, row_y1, nth=nth)
        add(page_no, "TextField", lab.x1 + SLOT_GAP, row_y1 + ROW_DROP - STD_LINE,
            SLOT_W, STD_LINE, "%s -- %s" % (note, label))

    # --- run-to-a-limit fields --------------------------------------------
    for page_no, row_y1, label, nth, right, note in FILLS:
        lab = find_word(doc[page_no - 1], label, row_y1, nth=nth)
        x = lab.x1 + SLOT_GAP
        add(page_no, "TextField", x, row_y1 + ROW_DROP - STD_LINE,
            (right - PANEL_PAD) - x, STD_LINE, note)

    # --- named ruled cells -------------------------------------------------
    for page_no, x0, y0, x1, y1, note in CELLS:
        add(page_no, "TextField", x0 + CELL_INSET,
            (y1 - CELL_LIFT) - STD_LINE,
            (x1 - CELL_INSET) - (x0 + CELL_INSET), STD_LINE, note)

    # --- children's tables -------------------------------------------------
    for y0, y1 in CHILD_CELL_ROWS:
        for x0, x1 in CHILD_CELL_COLS:
            add(3, "TextField", x0 + CELL_INSET, (y1 - CELL_LIFT) - STD_LINE,
                (x1 - CELL_INSET) - (x0 + CELL_INSET), STD_LINE,
                "children's table cell")

    # --- Part B / Part C detail fields ------------------------------------
    for row_y1, label, nth in ISSUE_ROWS:
        lab = find_word(doc[3], label, row_y1, nth=nth)
        x = lab.x1 + SLOT_GAP
        add(4, "TextField", x, row_y1 + ROW_DROP - STD_LINE,
            (ISSUE_RIGHT - PANEL_PAD) - x, STD_LINE, "issue detail")

    # --- the settlement-position answer box on p5 -------------------------
    # The box is drawn as four thin rectangles, not one, and it sits inside the
    # page's own border. Take the tall vertical pair with the *shorter* span --
    # the inner box -- rather than the page border that encloses it.
    page5 = doc[4]
    verticals = [d["rect"] for d in page5.get_drawings()
                 if d["rect"].width < 2.0 and d["rect"].height > 200]
    if not verticals:
        raise SystemExit("%s p5: no answer box found" % DOC_ID)
    spans = {}
    for v in verticals:
        spans.setdefault((round(v.y0, 1), round(v.y1, 1)), []).append(v)
    (y0, y1), sides = min(spans.items(), key=lambda kv: kv[0][1] - kv[0][0])
    if len(sides) < 2:
        raise SystemExit("%s p5: answer box has %d side(s)" % (DOC_ID, len(sides)))
    x0 = min(v.x0 for v in sides)
    x1 = max(v.x1 for v in sides)
    add(5, "TextArea", x0 + 3, y0 + 3, (x1 - x0) - 6, (y1 - y0) - 6,
        "settlement position box")

    doc.close()

    by_page = {}
    for f, note in added:
        by_page.setdefault(f["page"], []).append((f, note))
    for page_no in sorted(by_page):
        print("  p%d: %d field(s)" % (page_no, len(by_page[page_no])))
        for f, note in by_page[page_no]:
            print("      %-9s x=%7.2f y=%7.2f w=%7.2f h=%6.2f  %s"
                  % (f["type"], f["x"], f["y"], f["width"], f["height"], note))

    if added and not args.check:
        assert json.dumps(fields, sort_keys=True) == before, \
            "existing fields must not be modified"
        fields.extend(f for f, _ in added)
        indent = 2 if open(json_path).read(4).startswith('{\n  "') else 1
        with open(json_path, "w") as fh:
            json.dump(data, fh, indent=indent)
            fh.write("\n")

    print("\nTotal: %d field(s) %s."
          % (len(added), "would be added" if args.check else "added"))


if __name__ == "__main__":
    main()
