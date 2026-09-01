"""One-off: add the missing Respondent D.O.B. field on NLEPO_003 p1.

    python3 add_nlepo_003_respondent_dob.py [--check]

Finding: p1 has two "D.O.B (YY/MM/DD)" blanks -- one for the Applicant
(fielded, id 1750798505004, x=393.94 width=193.35) and one for the
Respondent (caption at x=285.5-315.0/y=236.1-248.3, followed by
"(YY/MM/DD)" ending at x=385.3) -- but only the Applicant's has a TextField.
The Respondent's underline is a genuine printed rule with no field at all
(confirmed visually in the render: a bare underscore line where the
Applicant row shows a boxed field), i.e. issue class 7 (missing field on a
genuine blank), found while doing the full page-by-page pass on p1.

get_text('words') finds no underscore/line glyph here (same lossy-line
extraction as the item 2(b) date fields) and get_drawings() finds nothing
either, so confirmed via the same pixel-darkness row scan technique: a solid
dark row at y=~247.0-248.0 runs from x=385.2 to x=520.8 (the true printed
underline, right after the "(YY/MM/DD)" caption which ends at x=385.3). For
comparison, the existing Applicant D.O.B field's own true underline (same
scan technique) is x=394.0-522.5, width 128.5 -- but the shipped field is
193.35pt wide (x=393.94-587.29), well past its own underline into blank
margin with nothing else printed there to collide with.

Rather than invent a second inconsistent width, this mirrors the Applicant
field's already-shipped width (193.35) for visual/functional parity between
the two rows, anchored just after the Respondent caption ends (x=387.3, a
~2pt gap, matching the ~3.4pt gap on the Applicant row) and right edge
580.65 -- confirmed nothing prints to the right of the true underline on
this page (page width 612, right margin ~587 on the Applicant row), so the
extra width is harmless the same way the Applicant field's already is. y and
height match the Respondent Name field on the same row (id 1750798505005,
y=233.62 height=19.95) exactly, the same pattern the Applicant Name/D.O.B
fields use (both at y=177.34).

--check prints without writing; no flag writes. Idempotent: a second run
finds the target id already present and does nothing.
"""
import argparse
import json
import os

HERE = os.path.dirname(os.path.abspath(__file__))
EXPORT = os.path.join(os.path.dirname(os.path.dirname(HERE)), "form-template-export")
JSON_PATH = os.path.join(EXPORT, "NLEPO_003.json")

NEW_FIELD = {
    "id": 1750798505203,
    "type": "TextField",
    "x": 387.3,
    "y": 233.62,
    "width": 193.35,
    "height": 19.95,
    "value": "",
    "fontSize": 9,
    "color": [0, 0, 0],
    "background": "none",
    "border": "none",
    "page": 1,
}


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--check", action="store_true")
    args = ap.parse_args()

    with open(JSON_PATH) as fh:
        data = json.load(fh)
    fields = data["staticFields"]
    existing_ids = {f["id"] for f in fields}

    if NEW_FIELD["id"] in existing_ids:
        print("NLEPO_003: nothing to add (Respondent D.O.B. field already present)")
        return

    print(f"NLEPO_003: {'would add' if args.check else 'adding'} Respondent D.O.B. "
          f"field id={NEW_FIELD['id']} x={NEW_FIELD['x']} y={NEW_FIELD['y']} "
          f"w={NEW_FIELD['width']} h={NEW_FIELD['height']}")

    if args.check:
        return

    fields.append(NEW_FIELD)
    with open(JSON_PATH, "w") as fh:
        json.dump(data, fh, indent=2)
        fh.write("\n")
    print("NLEPO_003: 1 field added")


if __name__ == "__main__":
    main()
