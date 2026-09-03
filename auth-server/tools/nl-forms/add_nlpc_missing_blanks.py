"""Add fields to printed NLPC blanks that shipped with none.

    python3 add_nlpc_missing_blanks.py [--only DOCID] [--check]

Findings from the NLPC page-by-page pass (session 4). Three detectors were run
over all 43 NLPC pages and every hit was then read on a rendered page:
`audit_anchors.py` (underscore runs), `audit_drawn_rules.py` (vector rules) and
a new `audit_pixel_rules.py` (rules that survive only as ink -- NLPC_AF003 p2's
jurat is invisible to the other two). Signature, witness, commissioner and
Court-Clerk rules were left bare throughout, per the convention the whole NB/NL
corpus follows; what is added here is only blanks the filer is expected to
complete.

**Jurat place-and-date blanks.** NLPC fields these consistently -- FORM3 p1
("SWORN TO OR AFFIRMED AT:"), SCHEDULE_D p1, SUPPORTING_AFFIDAVIT p7 and
AF004 p2 all carry them, as does every NLEPO and NLSC jurat. Four forms are the
exception and were shipped with the whole block bare; they are the outliers, so
the omission is theirs:

  AF002 p2  "SWORN TO (OR AFFIRMED) at ___ / this ___ day of___, 20___,"
  AF003 p2  "SWORN/AFFIRMED BEFORE ME / at ___, NL / on ___, 2___,"
  AF005 p1  "Dated at ___ in the Province ... this ___ day of ___, 20__"
  FORM7 p1  affidavit of service "on the ___ day of ___, / 20___."

**Other blanks the page prints and no field covers:**

  FORM3 p1       the third rule of the "Address:" block. The block prints three
                 rules at x 286.9-539.6; the first two carry fields (ids
                 ...014 and the Telephone(s) pair), the third does not, while
                 the Telephone(s) column beside it prints only two.
  SCHEDULE_D p2  "(name and address of corporation)" prints two answer rules
                 (baselines 381.24 and 392.34). Only the second is fielded.
  SCHEDULE_D p4  the Transportation "Car payment" amount cell. The cell is
                 fully drawn (x 301.50-386.82, y 450.24-468.12) and empty; the
                 identical cells for "Insurance" and "Licenses" immediately
                 below each carry a field. The government's page omits only the
                 "$" glyph on this one row, not the cell.
  SCHEDULE_D p6  the third entry row of the Part E special-expenses table
                 (y 505.92-547.50, all four columns) has no field at all, while
                 the row above it -- same height to a fifth of a point, same
                 four columns -- carries eight. Item 2(a) tells the filer to
                 "state the name of the child ... in the boxes below", so a
                 printed row with no box is a row they cannot use.

Geometry, all measured fresh from the shipped PDF on every run so the script is
idempotent and self-updating:

* A blank on a printed rule takes `x` = the rule's left end and
  `width` = its length **times SCALE** (the JSON stores width scaled 1.5x from
  PDF points -- see FORM_FIXING_GUIDE.md; getting this wrong silently shipped a
  whole session's undersized fields once already). Its bottom is seated at the
  rule's own baseline plus that document's median seating offset, taken from
  every existing TextField on the form that already sits on an underscore run
  (AF002 1.14, AF003 0.82, AF005 1.14, FORM7 1.73, FORM3 2.41, SCHEDULE_D 2.15)
  -- so a new field matches the form's own convention rather than a global one.
* A blank in a ruled table cell mirrors a named sibling field in the same
  column, keeping the sibling's `x`/`width` and holding the same gap above the
  cell's bottom rule that the sibling holds above its own.
* The empty SCHEDULE_D p6 row mirrors the populated row above it, translated
  down by the measured row pitch.

Rules whose extent no text- or vector-side call can see (AF003 p2's two jurat
rules, and AF005/FORM7's year slots, which are shorter than any detector's
minimum) were measured by a pixel-darkness row scan of the unmodified base PDF
at 600dpi -- the same technique the NLEPO work used for this form family. Those
extents are listed literally below, with the scan that produced them recorded
in `SCAN_EVIDENCE`.

Existing fields are never touched: this script only appends new entries. A
blank that already has a field covering it is skipped, so a second run is a
no-op.
"""
import argparse
import glob
import json
import os
import statistics
import sys

import fitz

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(os.path.dirname(HERE), "bc-forms"))
EXPORT = os.path.join(os.path.dirname(os.path.dirname(HERE)), "form-template-export")

import bc_pipeline as bp  # noqa: E402

SCALE = bp.SCALE          # 1.5
STD_LINE = 13.3           # the one approved single-line control height
HEIGHT = round(STD_LINE * SCALE, 2)   # 19.95

# Pixel-darkness scans of the unmodified base PDF, 600dpi, recorded so the
# numbers below can be re-derived rather than taken on trust.
SCAN_EVIDENCE = """
NLPC_AF003 p2  rows y 320-332 and 332-344, x 60-300:
    at-line   rule y=326.18  one segment x 85.44-225.12
    on-line   rule y=338.30  segments  x 87.84-183.00 (date) and 196.68-222.00 (year)
NLPC_AF002 p2  underscore runs, char boxes: 75.18-229.74 (at, base 175.86),
    91.59-120.16 / 151.47-231.58 / 249.52-266.67 (day/month/year, base 219.60)
NLPC_AF005 p1  118.90-290.64 (base 596.16); 93.77-176.47, 214.79-386.55,
    406.46-419.20 (base 620.46)
NLPC_FORM7 p1  132.42-159.11, 185.34-318.74 (base 565.20); 116.88-152.45 (base 574.38)
NLPC_FORM3 p1  286.90-539.60 (base 235.20)
NLPC_SCHEDULE_D p2  237.60-540.10 (base 381.24)

"""

# (doc_id, page, x0, x1, baseline, note)
RULE_BLANKS = [
    ("NLPC_AF002", 2, 75.18, 229.74, 175.86, "jurat: SWORN TO (OR AFFIRMED) at"),
    ("NLPC_AF002", 2, 91.59, 120.16, 219.60, "jurat: this __ day"),
    ("NLPC_AF002", 2, 151.47, 231.58, 219.60, "jurat: day of __"),
    ("NLPC_AF002", 2, 249.52, 266.67, 219.60, "jurat: 20__"),

    ("NLPC_AF003", 2, 85.44, 225.12, 326.18, "jurat: at __, NL"),
    ("NLPC_AF003", 2, 87.84, 183.00, 338.30, "jurat: on __"),
    ("NLPC_AF003", 2, 196.68, 222.00, 338.30, "jurat: 2___"),

    ("NLPC_AF005", 1, 118.90, 290.64, 596.16, "Dated at __ in the Province"),
    ("NLPC_AF005", 1, 93.77, 176.47, 620.46, "this __ day"),
    ("NLPC_AF005", 1, 214.79, 386.55, 620.46, "day of __"),
    ("NLPC_AF005", 1, 406.46, 419.20, 620.46, "20__"),

    ("NLPC_FORM7", 1, 132.42, 159.11, 565.20, "service: on the __ day"),
    ("NLPC_FORM7", 1, 185.34, 318.74, 565.20, "service: day of __"),
    ("NLPC_FORM7", 1, 116.88, 152.45, 574.38, "service: 20___"),

    ("NLPC_FORM3", 1, 286.90, 539.60, 235.20, "Address block, third rule"),

    ("NLPC_SCHEDULE_D", 2, 237.60, 540.10, 381.24,
     "(name and address of corporation), first answer rule"),
]

# Left deliberately unfielded, recorded here so it is not "found" again:
#
# SCHEDULE_D p7, the "legal duty to support a child ... give details" answer.
# The page prints four rules (baselines 498.06, 507.24, 516.48, 525.66) and
# fields sit on the first and third only. That alternation is not an oversight
# to correct: the rules are on a 9.2pt pitch and the one approved control is
# 13.3pt tall, so a field on every rule would put four boxes on top of one
# another, each overlapping its neighbours by about 4pt -- the stacked-box
# defect this audit removes elsewhere, introduced deliberately. The filer can
# already enter a narrative answer in the two boxes that exist, so the gain
# would be extra space, not access. Contrast the jurat and service-date blanks
# added above, which are on equally tight pitches but where NO field exists at
# all -- there the choice is between an unavoidable box overlap and a date the
# filer simply cannot type.

# (doc_id, page, sibling_field_id, sibling_cell_bottom, target_cell_bottom, note)
CELL_BLANKS = [
    ("NLPC_SCHEDULE_D", 4, 1750500050127, 486.42, 468.12,
     "Transportation 'Car payment' amount cell"),
]

# (doc_id, page, [sibling ids of the populated row], row_pitch, note)
ROW_BLANKS = [
    ("NLPC_SCHEDULE_D", 6,
     [1750500050173, 1750500050176, 1750500050180, 1750500050184,
      1750500050201, 1750500050177, 1750500050181, 1750500050185],
     42.54, "Part E special-expenses table, third entry row"),
]

FIELD_KEYS_FROM_SIBLING = ("fontSize", "color", "background", "border")


def seating_offset(doc_id, fields, doc):
    """Median gap between a field's bottom and the baseline of the underscore
    run it sits on, measured over this document's own existing TextFields."""
    offsets = []
    for f in fields:
        if f["type"] != "TextField":
            continue
        page = doc[f["page"] - 1]
        bottom = f["y"] + f["height"] / SCALE
        fx0, fx1 = f["x"], f["x"] + f["width"] / SCALE
        for block in page.get_text("rawdict")["blocks"]:
            for line in block.get("lines", []):
                for span in line["spans"]:
                    base = span["origin"][1]
                    if not (bottom - 6 < base < bottom + 1):
                        continue
                    runs, cur = [], []
                    for ch in span["chars"]:
                        if ch["c"] == "_":
                            cur.append(ch)
                        else:
                            if len(cur) >= 3:
                                runs.append(cur)
                            cur = []
                    if len(cur) >= 3:
                        runs.append(cur)
                    for run in runs:
                        rx0 = min(c["bbox"][0] for c in run)
                        rx1 = max(c["bbox"][2] for c in run)
                        if min(rx1, fx1) - max(rx0, fx0) > 0.6 * (rx1 - rx0):
                            offsets.append(bottom - base)
    if len(offsets) < 3:
        raise SystemExit("%s: only %d seating samples -- refusing to guess an "
                         "offset" % (doc_id, len(offsets)))
    return round(statistics.median(offsets), 2)


def covered(fields, page_no, x0, x1, y0, y1):
    """Is this blank already carrying a field?"""
    target = fitz.Rect(x0, y0, x1, y1)
    for f in fields:
        if f["page"] != page_no:
            continue
        r = fitz.Rect(f["x"], f["y"], f["x"] + f["width"] / SCALE,
                      f["y"] + f["height"] / SCALE)
        if (r & target).get_area() > 0.35 * target.get_area():
            return True
    return False


def template(fields):
    """Non-geometry keys copied from an existing field on the same form."""
    src = fields[0]
    out = {k: src[k] for k in FIELD_KEYS_FROM_SIBLING if k in src}
    out.setdefault("fontSize", 9)
    out.setdefault("color", [0, 0, 0])
    out.setdefault("background", "none")
    out.setdefault("border", "none")
    return out


def next_index(doc_id, fields):
    base = bp.new_id(doc_id, 0)
    used = [f["id"] - base for f in fields if f["id"] > base]
    return (max(used) + 1) if used else 1


def build(doc_id, check):
    json_path = os.path.join(EXPORT, doc_id + ".json")
    data = json.load(open(json_path))
    fields = data["staticFields"]
    doc = fitz.open(os.path.join(EXPORT, doc_id + ".pdf"))
    before = json.dumps(fields, sort_keys=True)

    additions = []
    index = next_index(doc_id, fields)
    proto = template(fields)

    rules = [r for r in RULE_BLANKS if r[0] == doc_id]
    if rules:
        offset = seating_offset(doc_id, fields, doc)
        for _, page_no, x0, x1, base, note in rules:
            bottom = base + offset
            y = round(bottom - STD_LINE, 2)
            if covered(fields, page_no, x0, x1, y, bottom):
                continue
            additions.append((dict(proto,
                                   id=bp.new_id(doc_id, index),
                                   type="TextField",
                                   x=round(x0, 2),
                                   y=y,
                                   width=round((x1 - x0) * SCALE, 2),
                                   height=HEIGHT,
                                   value="",
                                   page=page_no), note))
            index += 1

    for _, page_no, sib_id, sib_cell_bottom, cell_bottom, note in \
            [c for c in CELL_BLANKS if c[0] == doc_id]:
        sib = next((f for f in fields if f["id"] == sib_id), None)
        if sib is None:
            raise SystemExit("%s: sibling %s not found" % (doc_id, sib_id))
        gap = sib_cell_bottom - (sib["y"] + sib["height"] / SCALE)
        y = round(cell_bottom - gap - sib["height"] / SCALE, 2)
        x1 = sib["x"] + sib["width"] / SCALE
        if covered(fields, page_no, sib["x"], x1, y, y + sib["height"] / SCALE):
            continue
        additions.append((dict(proto,
                               id=bp.new_id(doc_id, index),
                               type=sib["type"],
                               x=sib["x"],
                               y=y,
                               width=sib["width"],
                               height=sib["height"],
                               value="",
                               page=page_no), note))
        index += 1

    for _, page_no, sib_ids, pitch, note in \
            [r for r in ROW_BLANKS if r[0] == doc_id]:
        for sib_id in sib_ids:
            sib = next((f for f in fields if f["id"] == sib_id), None)
            if sib is None:
                raise SystemExit("%s: sibling %s not found" % (doc_id, sib_id))
            y = round(sib["y"] + pitch, 2)
            x1 = sib["x"] + sib["width"] / SCALE
            if covered(fields, page_no, sib["x"], x1,
                       y, y + sib["height"] / SCALE):
                continue
            additions.append((dict(proto,
                                   id=bp.new_id(doc_id, index),
                                   type=sib["type"],
                                   x=sib["x"],
                                   y=y,
                                   width=sib["width"],
                                   height=sib["height"],
                                   value="",
                                   page=page_no), note))
            index += 1
    doc.close()

    for field, note in additions:
        print("  %-22s p%-2d + %-9s x=%7.2f y=%7.2f w=%7.2f  %s"
              % (doc_id, field["page"], field["type"], field["x"], field["y"],
                 field["width"], note))

    if additions and not check:
        assert json.dumps(fields, sort_keys=True) == before, \
            "existing fields must not be modified"
        fields.extend(f for f, _ in additions)
        indent = 2 if open(json_path).read(4).startswith('{\n  "') else 1
        with open(json_path, "w") as fh:
            json.dump(data, fh, indent=indent)
            fh.write("\n")
    return len(additions)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--only", help="limit to a single docId")
    ap.add_argument("--check", action="store_true", help="dry run, no writes")
    ap.add_argument("--evidence", action="store_true",
                    help="print the pixel scans behind the hard-coded extents")
    args = ap.parse_args()

    if args.evidence:
        print(SCAN_EVIDENCE)
        return

    docs = sorted({r[0] for r in RULE_BLANKS}
                  | {c[0] for c in CELL_BLANKS}
                  | {r[0] for r in ROW_BLANKS})
    total = 0
    for doc_id in docs:
        if args.only and doc_id != args.only:
            continue
        if not os.path.exists(os.path.join(EXPORT, doc_id + ".json")):
            raise SystemExit("missing %s.json" % doc_id)
        total += build(doc_id, args.check)

    verb = "would be added" if args.check else "added"
    print("\nTotal: %d field(s) %s." % (total, verb))


if __name__ == "__main__":
    main()
