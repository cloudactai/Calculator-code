"""Take the field box off the judge's signature rule on the FSA order/warrant forms.

Ten of the Family Services Act regulation forms (Reg 81-134) are warrants and
orders the court *issues* -- the applicant (always "The Minister of Social
Development", printed) asks for one and a judge signs it. Every one of them
ends the same way:

    . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . .
    Judge of The Court of King's Bench of New Brunswick
    Family Division

The build put a plain TextField on that dotted rule, same as every other blank
on the page. It should not have: this is precedent BC already established in
`tools/bc-forms/drop_signature_boxes.py` for the "Registrar" / "Judge or
Justice of the Peace" rules there -- a signature rule for a judicial officer
never gets a box, because the box invites a self-represented filer to type
their own name where the judge signs. Every other blank on these ten forms
(place, date, the neglected/abused adult's name, conditions) stays: the
Minister's office fills those in before the warrant goes to a judge, so they
are genuinely filer-entered.

Targets are matched on (docId, page, x, y), not on field id, so a rebuild that
renumbers fields cannot silently miss one or hit the wrong box; each entry
must match exactly one field or the tool stops.

Usage:
    python3 drop_nb_judge_signature.py --check     # dry run (default action)
    python3 drop_nb_judge_signature.py              # apply
"""
import argparse
import json
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
EXPORT = os.path.abspath(os.path.join(HERE, "..", "..", "form-template-export"))

# docId -> (page, x, y) of the field that sits on the judge's signature rule.
# x, y are the field's own stored x/y (PDF points, top-left), found by
# locating the field immediately above the "Judge of The Court of King's
# Bench" caption on each form's last page.
TARGETS = {
    "NBFSA_1_01": (1, 336.1, 463.3),
    "NBFSA_1_02": (1, 333.7, 517.3),
    "NBFSA_1_03": (1, 336.1, 562.2),
    "NBFSA_1_04": (1, 333.7, 526.5),
    "NBFSA_1_1":  (1, 333.7, 504.7),
    "NBFSA_1_2":  (2, 333.7, 121.0),
    "NBFSA_1_3":  (1, 333.7, 504.4),
    "NBFSA_1_4":  (1, 333.7, 534.9),
    "NBFSA_1_5":  (1, 333.7, 565.5),
    "NBFSA_22":   (1, 333.7, 576.0),
}
TOL = 0.3


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--check", action="store_true",
                        help="dry run: print what would change, write nothing")
    args = parser.parse_args()

    total = 0
    for doc_id in sorted(TARGETS):
        page, x, y = TARGETS[doc_id]
        path = os.path.join(EXPORT, "%s.json" % doc_id)
        if not os.path.exists(path):
            print("%s: no export json, skipping" % doc_id)
            continue
        mapping = json.load(open(path))
        fields = mapping["staticFields"]
        match = [f for f in fields
                 if f["page"] == page and abs(f["x"] - x) <= TOL
                 and abs(f["y"] - y) <= TOL]
        if not match:
            print("%s: already clear (no-op)" % doc_id)
            continue
        if len(match) > 1:
            sys.exit("%s p%d x=%.1f y=%.1f: matched %d fields, expected 1 -- "
                     "refusing to guess" % (doc_id, page, x, y, len(match)))
        field = match[0]
        print("%-12s p%-2d drop id=%-14s %.0fx%.0f at %.1f,%.1f  (judge signature rule)"
              % (doc_id, page, field["id"], field["width"] / 1.5, field["height"] / 1.5,
                 field["x"], field["y"]))
        total += 1
        if not args.check:
            fields.remove(field)
            with open(path, "w") as fh:
                json.dump(mapping, fh, indent=1)
                fh.write("\n")

    print("\n%d judge-signature box(es) %s across %d forms"
          % (total, "would be dropped" if args.check else "dropped", len(TARGETS)))


if __name__ == "__main__":
    main()
