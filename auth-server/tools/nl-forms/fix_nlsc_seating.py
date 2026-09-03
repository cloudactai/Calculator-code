"""Re-seat NLSC fields that hang below the rule, or sit on printed text.

    python3 fix_nlsc_seating.py [--check]

Two findings from the NLSC page-by-page pass (session 4). Both move `y` only --
no `x`, `width` or `height` changes, and no field is added or removed.

## 1. Fields seated below their printed rule (issue class 9)

The class the user reported: the box renders *below* the printed line, so the
rule crosses near the box's top and typed text floats under the line instead of
resting on it. A scan of every NL TextField against the nearest printed rule
under its own x-span (all three rule vocabularies unioned -- underscore runs,
vector rules, and ink-only rules found by `audit_pixel_rules.py`) produced 75
candidates, nearly all of them false positives where the field sits correctly in
a ruled table cell and the "rule" matched was the cell's own top border. Each
was checked at 6x zoom. Five survived, and four of them share a decisive piece
of internal evidence.

**NLSC_F16A_03A / _03B / _04A / _04B, page 2.** These four forms print the same
block of ruled answer lines, and so do NLSC_F16A_03C and _04C. On 03C and 04C
every field sits **1.85pt above** its rule's ink -- and so do all the *other*
fields on 03A/03B/04A/04B. But exactly one field per form sits **4.9pt below**
its rule instead: a 6.7pt error against the form's own convention, unique on
each page, on forms whose siblings get it right.

    NLSC_F16A_03A p2  id 1750092766017   bottom 286.17, rule ink ends 281.30
    NLSC_F16A_03B p2  id 1750058756014   bottom 235.31, rule ink ends 230.40
    NLSC_F16A_04A p2  id 1750199609017   bottom 260.93, rule ink ends 256.00
    NLSC_F16A_04B p2  id 1750714723014   bottom 235.31, rule ink ends 230.40

Rendered at 6x, the printed rule runs straight through the middle of the sample
text on all four.

**NLSC_F35_03A p2 id 1750533582003.** The blank at the end of "...file a
completed Response (Form F6.02A) and Financial Statement (Form F10.02A) with the
Registry of the Supreme Court of Newfoundland and Labrador at ______." The rule's
ink ends at 519.13; the field's bottom is at 529.56, a full 10.4pt lower, with
clear white space between the line and the box. This form has no other field on
an underscore run to take a convention from, so the NLSC-wide median is used
(-2.18, n=729, tightly clustered: 258 of 729 samples round to -2.2).

Each field is moved so its bottom sits at its own document's median offset from
the rule's ink bottom, measured fresh from that document's correctly-seated
fields on every run (or the NLSC-wide median when the document has fewer than
`MIN_SAMPLES` of its own). Idempotent: once a field is within `TOL` of the
target the script reports it as already seated and writes nothing.

## 2. Fields sitting on top of the printed note in the "Email Address" cell

NLSC_F4_04A p4 and NLSC_F5_06A p4 both print, *inside* the "Email Address (if
any)" table cell, the italic note

    Please note that if you provide your email address, the Court may contact
    you by email.

whose ink occupies y 288.79-301.32 -- the bottom of a cell that runs 276.60 to
300.48. The field fills the cell with its bottom at 299.70, i.e. its text
baseline lands in the middle of that printed sentence, so anything typed is
overprinted on the note. (This is what `audit_fields.py` reports as
`COVERS-TEXT` on both forms; the doubled characters in its output --
"PlPleaeasase nonototete" -- are the page drawing the note twice, a
Word-to-PDF artifact, not a second note.)

The fix lifts each field so its bottom clears the top of the note. The free
space above the note is 12.19pt against the 13.3pt standard control, so the
box's top ends up ~1.9pt above the cell's top rule and grazes the "Fax Number"
field above it by ~1.1pt -- an 8% overlap, well inside the band this corpus
already accepts on tight-pitch rows, and a plain improvement on typing into a
printed sentence. The note's position is measured with `search_for` each run.
"""
import argparse
import json
import os
import statistics
import sys

import fitz

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(os.path.dirname(HERE), "bc-forms"))
EXPORT = os.path.join(os.path.dirname(os.path.dirname(HERE)), "form-template-export")

import bc_pipeline as bp  # noqa: E402

SCALE = bp.SCALE
TOL = 0.6                 # already this close to target = nothing to do
MIN_SAMPLES = 6
NLSC_MEDIAN_OFFSET = -2.18
FROZEN = ("id", "type", "value", "fontSize", "color", "background",
          "border", "page", "bind", "x", "width", "height")

# (doc_id, page, field_id, rule ink bottom, note)
BELOW_RULE = [
    ("NLSC_F16A_03A", 2, 1750092766017, 281.30, "answer rule c. (second line)"),
    ("NLSC_F16A_03B", 2, 1750058756014, 230.40, "answer rule (second line)"),
    ("NLSC_F16A_04A", 2, 1750199609017, 256.00, "answer rule c. (second line)"),
    ("NLSC_F16A_04B", 2, 1750714723014, 230.40, "answer rule (second line)"),
    ("NLSC_F35_03A", 2, 1750533582003, 519.13, "Registry ... at ______."),
]

# (doc_id, page, field_id, note text, note)
ON_PRINTED_NOTE = [
    ("NLSC_F4_04A", 4, 1750033802038,
     "Please note that if you provide your email address",
     "Email Address (if any) cell"),
    ("NLSC_F5_06A", 4, 1750641272045,
     "Please note that if you provide your email address",
     "Email Address (if any) cell"),
]
NOTE_GAP = 0.8


def rule_bottoms(page):
    """(x0, x1, ink_bottom) for every underscore run of 8+ characters."""
    out = []
    for block in page.get_text("rawdict")["blocks"]:
        for line in block.get("lines", []):
            for span in line["spans"]:
                cur = []
                for ch in span["chars"]:
                    if ch["c"] == "_":
                        cur.append(ch)
                    else:
                        if len(cur) >= 8:
                            out.append((min(c["bbox"][0] for c in cur),
                                        max(c["bbox"][2] for c in cur),
                                        max(c["bbox"][3] for c in cur)))
                        cur = []
                if len(cur) >= 8:
                    out.append((min(c["bbox"][0] for c in cur),
                                max(c["bbox"][2] for c in cur),
                                max(c["bbox"][3] for c in cur)))
    return out


def doc_offset(doc_id, fields, doc):
    """This document's own median (field bottom - rule ink bottom)."""
    offsets = []
    cache = {}
    for f in fields:
        if f["type"] != "TextField":
            continue
        page_no = f["page"] - 1
        if page_no not in cache:
            cache[page_no] = rule_bottoms(doc[page_no])
        fx0, fx1 = f["x"], f["x"] + f["width"] / SCALE
        bottom = f["y"] + f["height"] / SCALE
        for rx0, rx1, ry1 in cache[page_no]:
            if min(rx1, fx1) - max(rx0, fx0) < 0.6 * (rx1 - rx0):
                continue
            if abs(bottom - ry1) < 7:
                offsets.append(bottom - ry1)
    if len(offsets) < MIN_SAMPLES:
        return NLSC_MEDIAN_OFFSET, len(offsets), True
    return round(statistics.median(offsets), 2), len(offsets), False


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--check", action="store_true", help="dry run, no writes")
    args = ap.parse_args()

    plans = {}
    for doc_id, page_no, field_id, rule_y1, note in BELOW_RULE:
        plans.setdefault(doc_id, []).append(("rule", page_no, field_id, rule_y1, note))
    for doc_id, page_no, field_id, text, note in ON_PRINTED_NOTE:
        plans.setdefault(doc_id, []).append(("note", page_no, field_id, text, note))

    total = 0
    for doc_id in sorted(plans):
        json_path = os.path.join(EXPORT, doc_id + ".json")
        data = json.load(open(json_path))
        fields = data["staticFields"]
        doc = fitz.open(os.path.join(EXPORT, doc_id + ".pdf"))
        offset, n, fell_back = doc_offset(doc_id, fields, doc)
        changed = False

        for kind, page_no, field_id, arg, note in plans[doc_id]:
            field = next((f for f in fields if f["id"] == field_id), None)
            if field is None:
                raise SystemExit("%s: field %s not found" % (doc_id, field_id))
            frozen = {k: field.get(k) for k in FROZEN}
            height = field["height"] / SCALE
            bottom = field["y"] + height

            if kind == "rule":
                target_bottom = arg + offset
                why = ("offset %.2f from %d of its own samples" % (offset, n)
                       if not fell_back else
                       "NLSC-wide offset %.2f (only %d local samples)" % (offset, n))
            else:
                hits = doc[page_no - 1].search_for(arg)
                if len(hits) < 1:
                    raise SystemExit("%s p%d: note %r not found" % (doc_id, page_no, arg))
                target_bottom = min(h.y0 for h in hits) - NOTE_GAP
                why = "clears the printed note at y=%.2f" % min(h.y0 for h in hits)

            if abs(bottom - target_bottom) <= TOL:
                print("  %-16s p%-2d id=%-14s already seated (bottom %.2f)"
                      % (doc_id, page_no, field_id, bottom))
                continue

            new_y = round(target_bottom - height, 2)
            print("  %-16s p%-2d id=%-14s y %.2f -> %.2f  (bottom %.2f -> %.2f)  %s; %s"
                  % (doc_id, page_no, field_id, field["y"], new_y,
                     bottom, target_bottom, note, why))
            total += 1
            if not args.check:
                field["y"] = new_y
                assert {k: field.get(k) for k in FROZEN} == frozen, \
                    "only y may change"
                changed = True
        doc.close()

        if changed and not args.check:
            indent = 2 if open(json_path).read(4).startswith('{\n  "') else 1
            with open(json_path, "w") as fh:
                json.dump(data, fh, indent=indent)
                fh.write("\n")

    print("\n%d field(s) %s." % (total, "would be re-seated" if args.check
                                 else "re-seated"))


if __name__ == "__main__":
    main()
