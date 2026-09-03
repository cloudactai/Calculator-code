"""One-off geometry corrections for NB fields that sit in the wrong place.

Each entry here was found by visual review (rendered filled page) and confirmed
by measuring the printed PDF -- never by character-count estimation. The
correction touches only `x` and `width` on an existing field; `y`, `height`,
`id`, `type`, `value`, `fontSize`, `color`, `background`, `border`, `page` and
`bind` are asserted unchanged.

NBKB_37A field 1750063535014 ("            DIVISION" / "DIVISION DE ____"
header row):
  The English half of this bilingual form prints "DIVISION" as a label with
  the blank *after* it, exactly mirroring the French column's "DIVISION DE
  ____" -- confirmed by the fact that every other field pair on this page
  shares an identical width between its English and French twin (111.5,
  241.2, 241.6, 243.6, 241.6, 243.6pt), and this is the only pair that
  doesn't: French field 1750063535015 measures 139.0pt, English 014 measured
  55.7pt at x=41.7, which a column-darkness scan of the printed PDF shows
  sitting directly on top of the ink of the word "DIVISION" itself (ink runs
  x=42.9-165.3 on that line -- text extraction is lossy on this form's
  English column, same defect the nl-forms README records for NLPC forms, so
  the words never showed up in get_text(); the ink was measured with a pixel
  darkness scan instead). Moving the box to start 2pt after the ink ends and
  giving it the French twin's width both removes the overlap and restores the
  symmetric pattern every other row on the page already has.

Usage:
    python3 fix_nb_field_geometry.py --check     # dry run (default action)
    python3 fix_nb_field_geometry.py              # apply
"""
import argparse
import json
import os

HERE = os.path.dirname(os.path.abspath(__file__))
EXPORT = os.path.abspath(os.path.join(HERE, "..", "..", "form-template-export"))

# docId -> field id -> (old_x, old_width, new_x, new_width, note)
# old_x/old_width are the *raw stored* values (width already x1.5) and are
# asserted before any change is made.
TARGETS = {
    "NBKB_37A": {
        1750063535014: (41.7, 83.55, 167.25, 208.5,
                        "DIVISION row: was overlapping the word \"DIVISION\", "
                        "move to sit after it, French twin's width"),
    },
}
TOL = 0.3


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--check", action="store_true",
                        help="dry run: print what would change, write nothing")
    args = parser.parse_args()

    total = 0
    for doc_id in sorted(TARGETS):
        path = os.path.join(EXPORT, "%s.json" % doc_id)
        mapping = json.load(open(path))
        fields = {f["id"]: f for f in mapping["staticFields"]}
        changed = False
        for field_id, (old_x, old_w, new_x, new_w, note) in TARGETS[doc_id].items():
            field = fields.get(field_id)
            if field is None:
                print("%s: field %s not found, skipping" % (doc_id, field_id))
                continue
            already_done = (abs(field["x"] - new_x) <= TOL
                           and abs(field["width"] - new_w) <= TOL)
            if already_done:
                print("%s: field %s already at target (no-op)" % (doc_id, field_id))
                continue
            if not (abs(field["x"] - old_x) <= TOL and abs(field["width"] - old_w) <= TOL):
                raise SystemExit(
                    "%s field %s: x=%.2f w=%.2f does not match expected old "
                    "value x=%.2f w=%.2f or target x=%.2f w=%.2f -- refusing "
                    "to guess" % (doc_id, field_id, field["x"], field["width"],
                                 old_x, old_w, new_x, new_w))
            print("%-10s id=%-14s x %.2f -> %.2f  width %.2f -> %.2f  (%s)"
                  % (doc_id, field_id, field["x"], new_x, field["width"], new_w, note))
            total += 1
            if not args.check:
                field["x"] = new_x
                field["width"] = new_w
                changed = True
        if changed:
            with open(path, "w") as fh:
                json.dump(mapping, fh, indent=1)
                fh.write("\n")

    print("\n%d field(s) %s" % (total, "would be corrected" if args.check else "corrected"))


if __name__ == "__main__":
    main()
