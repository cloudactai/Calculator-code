"""Add the missing hearing-date/time fields on NBKB_73A and NBKB_73F.

Both forms print the same clause on page 1, in both language columns:

    The Applicant will apply to the Court at ______________________,
    (specific location) on the ____ day of ______________, 20____ at
    __________ a.m./p.m. for an order as set out hereunder:

    Le requérant présentera une requête à la cour à ______________________,
    (lieu précis) le ______________________ 20____, à _______ h_______, en
    vue d'obtenir l'ordonnance décrite ci-dessous :

NBKB_72U prints the near-identical clause and got fields for every blank in it
(built from the government's own AcroForm widgets). 73A and 73F did not --
neither language column has a single field over this paragraph, even though
every other blank on the same page does. Nothing distinguishes this paragraph
from the rest of the page in the source: the blanks are drawn rules (thin
horizontal strokes) with a printed label immediately to their left, on their
own baseline, exactly like every rule elsewhere on the page that did get a
box -- French's minute blank on 73F is the one exception, drawn as literal
underscore characters ("h_____,") rather than a ruled line.

This is squarely filer-entered content -- the applicant states the date,
place and time they are asking the court to hear the application -- so the
blank belongs to the same class as the "TO:", "BETWEEN:" and party-name boxes
already on the page, not to the excluded classes (court-only, judicial,
registry, signature-only).

Geometry was measured directly off the printed PDF (drawn-rule endpoints via
page.get_drawings(), the one underscore run via page.search_for()), not
estimated from character counts. Each entry below is
(field_x, rule_y1, field_width_pt) in PDF points; the field's y and height
follow the same STD_LINE/SEAT_GAP convention every other seated field on this
page uses.

Usage:
    python3 add_nb_hearing_date_fields.py --check     # dry run (default action)
    python3 add_nb_hearing_date_fields.py              # apply
"""
import argparse
import json
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
TOOLS = os.path.dirname(HERE)
sys.path.insert(0, os.path.join(TOOLS, "bc-forms"))
sys.path.insert(0, TOOLS)

import bc_pipeline as bp  # noqa: E402
import acroform_seat as A  # noqa: E402

EXPORT = os.path.abspath(os.path.join(TOOLS, "..", "form-template-export"))

SEAT_GAP = A.SEAT_GAP     # 1.26 pt
STD_LINE = A.STD_LINE     # 13.3 pt
SCALE = A.SCALE           # 1.5

# docId -> list of (x, rule_y1, width) measured off the printed PDF.
TARGETS = {
    "NBKB_73A": [
        # English
        (43.2, 529.9, 235.8),   # location
        (159.7, 545.9, 28.2),   # day
        (43.2, 561.9, 115.8),   # month
        (176.2, 561.9, 21.3),   # year
        (211.4, 561.9, 71.6),   # time
        # French
        (327.6, 529.9, 231.1),  # location
        (397.5, 545.9, 127.4),  # date (day + month)
        (539.2, 545.9, 21.3),   # year
        (335.5, 561.9, 45.5),   # hour
        (392.5, 561.9, 45.5),   # minute
    ],
    "NBKB_73F": [
        # English
        (43.2, 520.9, 220.8),   # location
        (43.2, 536.9, 24.8),    # day
        (99.0, 536.9, 67.1),    # month
        (181.4, 536.9, 17.2),   # year
        (213.7, 536.9, 39.6),   # time
        # French
        (327.6, 518.9, 241.9),  # location
        (338.8, 534.9, 184.2),  # date (day + month)
        (540.2, 534.9, 17.2),   # year
        (327.6, 550.9, 48.8),   # hour
        (385.3, 553.17, 28.75), # minute -- literal underscore run, not a rule
    ],
}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--check", action="store_true",
                        help="dry run: print what would change, write nothing")
    args = parser.parse_args()

    for doc_id in sorted(TARGETS):
        path = os.path.join(EXPORT, "%s.json" % doc_id)
        mapping = json.load(open(path))
        existing = mapping["staticFields"]
        specs = TARGETS[doc_id]
        new_fields = []
        index = 1
        existing_ids = {f["id"] for f in existing}
        skipped = 0
        for x, rule_y1, width in specs:
            y = round(rule_y1 - SEAT_GAP - STD_LINE, 2)
            w = round(width * SCALE, 2)
            h = round(STD_LINE * SCALE, 2)
            already_present = any(
                f["page"] == 1 and abs(f["x"] - x) <= 0.5
                and abs(f["y"] - y) <= 0.5 and abs(f["width"] - w) <= 0.5
                for f in existing)
            if already_present:
                skipped += 1
                continue
            while bp.new_id(doc_id, index) in existing_ids:
                index += 1
            field_id = bp.new_id(doc_id, index)
            index += 1
            new_fields.append({
                "id": field_id,
                "type": "TextField",
                "x": round(x, 2),
                "y": y,
                "width": w,
                "height": h,
                "value": "",
                "fontSize": 9,
                "color": [0, 0, 0],
                "background": "none",
                "border": "none",
                "page": 1,
            })

        if not new_fields:
            print("%s: all %d field(s) already present (no-op)" % (doc_id, skipped))
            continue

        print("%s: %d field(s) to add (%d already present)"
              % (doc_id, len(new_fields), skipped))
        for f in new_fields:
            print("  id=%-14s x=%.1f y=%.1f w=%.1f h=%.1f"
                  % (f["id"], f["x"], f["y"], f["width"] / SCALE, f["height"] / SCALE))

        if not args.check:
            mapping["staticFields"] = existing + new_fields
            with open(path, "w") as fh:
                json.dump(mapping, fh, indent=1)
                fh.write("\n")
            print("  written")


if __name__ == "__main__":
    main()
