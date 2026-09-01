"""One-off: add the six missing fields in NLEPO_001 p1's bottom summary table
(Applicant / Respondent / DOB / DOB / Police File # / Court Location).

    python3 add_nlepo_001_summary_table.py [--check]

Finding: NLEPO_001 (Fax Cover Sheet, Family Violence Protection Rules) has a
drawn 2-column x 3-row table below the TO:/FROM: blocks with six labeled
cells (APPLICANT:, RESPONDENT:, DOB:, DOB:, POLICE FILE # (if known):,
COURT LOCATION:) and genuinely zero fields anywhere in that y-range
(confirmed: nearest existing fields are at y=409 above the table and y=586
below it; nothing between). Unlike NBKB_18A's unfielded block (filled by a
THIRD PARTY -- the served recipient -- after the document leaves the app),
this table is filled by the same sender who fills the TO:/FROM: fields
immediately above it (already fielded, same page), using data the app
already has (applicant/respondent name and D.O.B. are already bound
elsewhere in this same NLEPO form family, e.g. NLEPO_003 p1). This is a
genuine missing-fields case (issue class 7: empty table cells with printed
labels and drawn cell borders), not a third-party-completed block.

Geometry: table cell borders confirmed via get_drawings() --
    columns: x = 88.2 | 307.68 | 527.16
    rows:    y = 464.04 | 497.64 | 531.72 | 565.8
Each field starts 5pt after its caption's own text ends (get_text('words'))
and stops 4pt before its column's right border -- the same inline
label-then-field pattern already used on this exact page for DATE:/TIME:
and Name:/Address: (field x = caption x1 + 5, field y = caption y0 - 1.11,
height 19.95, matching the DATE: field's already-shipped offset from its
own caption exactly). All six fields fit well inside their row's vertical
bounds with margin to spare.

--check prints without writing; no flag writes. Idempotent: a second run
finds all target ids already present and does nothing.
"""
import argparse
import json
import os

HERE = os.path.dirname(os.path.abspath(__file__))
EXPORT = os.path.join(os.path.dirname(os.path.dirname(HERE)), "form-template-export")
JSON_PATH = os.path.join(EXPORT, "NLEPO_001.json")

NEW_FIELDS = [
    # id, x, y, width, label (label is documentation only)
    (1750212133019, 158.6, 472.99, 145.08, "APPLICANT:"),
    (1750212133020, 387.8, 472.99, 135.36, "RESPONDENT:"),
    (1750212133021, 122.9, 506.89, 180.78, "DOB (Applicant):"),
    (1750212133022, 342.4, 506.89, 180.76, "DOB (Respondent):"),
    (1750212133023, 217.1, 540.99, 86.58, "POLICE FILE # (if known):"),
    (1750212133024, 411.9, 540.99, 111.26, "COURT LOCATION:"),
]


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--check", action="store_true")
    args = ap.parse_args()

    with open(JSON_PATH) as fh:
        data = json.load(fh)
    fields = data["staticFields"]
    existing_ids = {f["id"] for f in fields}

    to_add = [f for f in NEW_FIELDS if f[0] not in existing_ids]
    if not to_add:
        print("NLEPO_001: nothing to add (summary table fields already present)")
        return

    for fid, x, y, width, label in to_add:
        print(f"NLEPO_001: {'would add' if args.check else 'adding'} {label} "
              f"field id={fid} x={x} y={y} w={width}")

    if args.check:
        return

    for fid, x, y, width, label in to_add:
        fields.append({
            "id": fid,
            "type": "TextField",
            "x": x,
            "y": y,
            "width": width,
            "height": 19.95,
            "value": "",
            "fontSize": 9,
            "color": [0, 0, 0],
            "background": "none",
            "border": "none",
            "page": 1,
        })

    with open(JSON_PATH, "w") as fh:
        json.dump(data, fh, indent=2)
        fh.write("\n")
    print(f"NLEPO_001: {len(to_add)} field(s) added")


if __name__ == "__main__":
    main()
