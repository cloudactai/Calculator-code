"""Render a close crop around one field box, with the box drawn, for eyeballing.

The measurement gates say *where* to look; this is how a specific hit gets looked at
without reading a whole page at thumbnail size. Orange = TextField, green = TextArea,
red = CheckBox, matching contact_sheets.py.

    python3 crop_field.py <docId> <fieldId> [more fieldIds...] [--pad 40] [--export]
    python3 crop_field.py <docId> --page 3 [--export]      # whole page
"""
import argparse
import json
import os

import fitz

EXPORT = ("/Users/lorelaiphinnemore/Documents/CloudAct/Frontend /Calculator-code"
          "/auth-server/form-template-export")
OUT = os.path.join(EXPORT, "_incoming_bc2", "out")
SHOTS = ("/private/tmp/claude-501/-Users-lorelaiphinnemore-Documents-CloudAct-Frontend-"
         "-Calculator-code/697197f6-4dcb-4998-a724-dd1665837fb6/scratchpad/shots")
SCALE = 1.5
COLORS = {"CheckBox": (1, 0, 0), "TextArea": (0, 0.5, 0), "TextField": (1, 0.5, 0)}


def draw(page, fields):
    for field in fields:
        rect = fitz.Rect(field["x"], field["y"],
                         field["x"] + field["width"] / SCALE,
                         field["y"] + field["height"] / SCALE)
        page.draw_rect(rect, color=COLORS.get(field["type"], (0, 0, 1)), width=0.7)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("doc_id")
    parser.add_argument("field_ids", nargs="*")
    parser.add_argument("--page", type=int)
    parser.add_argument("--pad", type=float, default=40.0)
    parser.add_argument("--dpi", type=int, default=200)
    parser.add_argument("--export", action="store_true")
    args = parser.parse_args()

    root = EXPORT if args.export else OUT
    os.makedirs(SHOTS, exist_ok=True)
    fields = json.load(open(os.path.join(root, "%s.json" % args.doc_id)))["staticFields"]
    doc = fitz.open(os.path.join(root, "%s.pdf" % args.doc_id))

    if args.page:
        page = doc[args.page - 1]
        draw(page, [f for f in fields if f["page"] == args.page])
        out = os.path.join(SHOTS, "%s_p%d.png" % (args.doc_id, args.page))
        page.get_pixmap(dpi=130).save(out)
        print(out)
        return

    # Ids are stored as integers; compare as text so they can be pasted from a report.
    wanted = [f for f in fields if str(f["id"]) in set(args.field_ids)]
    if not wanted:
        raise SystemExit("no such field on %s" % args.doc_id)
    page_number = wanted[0]["page"]
    page = doc[page_number - 1]
    draw(page, [f for f in fields if f["page"] == page_number])
    clip = fitz.Rect(min(f["x"] for f in wanted) - args.pad,
                     min(f["y"] for f in wanted) - args.pad,
                     max(f["x"] + f["width"] / SCALE for f in wanted) + args.pad,
                     max(f["y"] + f["height"] / SCALE for f in wanted) + args.pad) & page.rect
    out = os.path.join(SHOTS, "%s_%s.png" % (args.doc_id, "_".join(args.field_ids)[:40]))
    page.get_pixmap(dpi=args.dpi, clip=clip).save(out)
    print("%s  page %d  clip %s" % (out, page_number, [round(v) for v in clip]))


if __name__ == "__main__":
    main()
