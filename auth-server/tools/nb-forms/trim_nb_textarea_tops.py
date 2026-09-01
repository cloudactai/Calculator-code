"""Trim TextArea tops off the printed caption above them, across all of NBKB.

Every narrative TextArea on the NBKB batch sits under a caption -- often an
italic instruction that wraps onto a second line, e.g.

    8.  Indicate whether the child(ren) and/or youth is/are Indigenous and to
        which Indigenous governing body the
        child(ren) or youth belong(s) (if applicable):
    [answer box]

The build cut the box to the standard position under the caption's *first*
line without checking whether the caption wrapped further -- Form 73G item 8
is the clearest case: the box's top measurably starts inside the caption's
second line, so "child(ren) or youth belong(s) (if applicable):" gets its
descenders masked by the box's white fill and its rule cuts straight through
the text (confirmed on the rendered page, not just by geometry).

This walks every TextArea in every NBKB template, finds the printed text line
immediately above it, and -- if the field's current top falls inside that
line's own bounding box -- moves the top down to sit just below it. The
bottom edge never moves, so no answer space is lost except the sliver that
was overlapping text no one could have typed into anyway. A field whose top
already clears the text above it is left untouched.

Only `y` and `height` are touched, only on TextArea fields, only when the
measured overlap is real (the printed line's bottom edge is below the
field's current top). Geometry is measured fresh from the shipped PDF each
run, so this is idempotent and self-updating if a form is rebuilt.

Usage:
    python3 trim_nb_textarea_tops.py --check     # dry run (default action)
    python3 trim_nb_textarea_tops.py              # apply
"""
import argparse
import glob
import json
import os

import fitz

HERE = os.path.dirname(os.path.abspath(__file__))
EXPORT = os.path.abspath(os.path.join(HERE, "..", "..", "form-template-export"))

GAP = 2.0          # clearance below the caption's last line
MIN_HEIGHT = 20.0   # never trim a box down to something too small to write in
SCALE = 1.5


def overlapping_line_bottom(page, field):
    """The bottom edge of the printed line whose bbox the field's top sits
    inside, if any -- None if the field's top already clears the text above."""
    fx0 = field["x"]
    fx1 = field["x"] + field["width"] / SCALE
    fy0 = field["y"]
    best = None
    for block in page.get_text("dict")["blocks"]:
        for line in block.get("lines", []):
            text = "".join(s["text"] for s in line.get("spans", []))
            if not text.strip():
                # Some of these pages carry stray whitespace-only "lines"
                # stacked down the left margin (72H p1 y=435-566 is a run of
                # nine single-space lines, an artifact of the original
                # Word-to-PDF conversion) -- nothing is printed there, so
                # they must not count as a caption to trim below.
                continue
            lx0, ly0, lx1, ly1 = line["bbox"]
            if lx1 <= fx0 or lx0 >= fx1:
                continue          # no horizontal overlap with the field
            if ly0 < fy0 < ly1:    # the field's top lands inside this line
                if best is None or ly1 > best:
                    best = ly1
    return best


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--check", action="store_true",
                        help="dry run: print what would change, write nothing")
    args = parser.parse_args()

    docs = sorted(set(os.path.basename(p)[:-4]
                      for p in glob.glob(os.path.join(EXPORT, "NBKB_*.pdf"))))
    total = 0
    for doc_id in docs:
        json_path = os.path.join(EXPORT, "%s.json" % doc_id)
        mapping = json.load(open(json_path))
        fields = mapping["staticFields"]
        tareas = [f for f in fields if f["type"] == "TextArea"]
        if not tareas:
            continue
        doc = fitz.open(os.path.join(EXPORT, "%s.pdf" % doc_id))
        changed = False
        for field in tareas:
            page = doc[field["page"] - 1]
            # A caption can wrap three or more lines; trimming past line 2 can
            # land the new top inside line 3. Loop to a fixed point within
            # this one run rather than requiring a second invocation.
            bottom = field["y"] + field["height"] / SCALE
            cur_y = field["y"]
            moved = False
            for _ in range(8):
                probe = dict(field, y=cur_y)
                line_bottom = overlapping_line_bottom(page, probe)
                if line_bottom is None:
                    break
                cur_y = round(line_bottom + GAP, 2)
                moved = True
            if not moved:
                continue
            old_y = field["y"]
            old_h = field["height"] / SCALE
            new_y = cur_y
            new_h = round(bottom - new_y, 2)
            if new_h < MIN_HEIGHT:
                print("%s p%d field %s: overlap would trim height to %.1f "
                      "(< %.0f) -- skipping, needs a manual look"
                      % (doc_id, field["page"], field["id"], new_h, MIN_HEIGHT))
                continue
            print("%-10s p%-2d id=%-14s y %.1f -> %.1f  height %.1f -> %.1f"
                  % (doc_id, field["page"], field["id"], old_y, new_y, old_h, new_h))
            total += 1
            if not args.check:
                field["y"] = new_y
                field["height"] = round(new_h * SCALE, 2)
                changed = True
        doc.close()
        if changed:
            with open(json_path, "w") as fh:
                json.dump(mapping, fh, indent=1)
                fh.write("\n")

    print("\n%d TextArea top(s) %s" % (total, "would be trimmed" if args.check else "trimmed"))


if __name__ == "__main__":
    main()
