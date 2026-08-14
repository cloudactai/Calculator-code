"""Make the Saskatchewan templates fill themselves from the matter.

Writes back **only** the `bind` key, and asserts every other key is byte-identical
first, so it is safe to run on templates whose geometry has already been
reviewed. A second run is a no-op. Run it after any rebuild, which drops binds.

    python3 rebind_sk_forms.py --check     # report what would change
    python3 rebind_sk_forms.py             # apply

The vocabulary and the reasoning for what is deliberately left unbound are in
`sk_binds.py`.
"""
import argparse
import collections
import json
import os
import sys

import fitz

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
sys.path.insert(0, os.path.join(os.path.dirname(HERE), "bc-forms"))

import bc_pipeline as bp  # noqa: E402
import sk_binds  # noqa: E402
from sk_sources import all_sources  # noqa: E402

SCALE = bp.SCALE
EXPORT = os.path.join(os.path.dirname(os.path.dirname(HERE)), "form-template-export")


def captions_left_of(page):
    """Printed lines, as (text, rect), for matching against a box's left side."""
    out = []
    for block in page.get_text("dict")["blocks"]:
        for line in block.get("lines", []):
            text = "".join(span["text"] for span in line["spans"]).strip()
            if text and len(text) <= 44:
                out.append((text, fitz.Rect(line["bbox"])))
    return out


def bind_for_field(field, captions):
    """The bind for one field, from the caption printed to its left."""
    if field["type"] != "TextField":
        return None
    box = fitz.Rect(field["x"], field["y"],
                    field["x"] + field["width"] / SCALE,
                    field["y"] + field["height"] / SCALE)
    best, best_gap = None, None
    for text, rect in captions:
        gap = box.x0 - rect.x1
        if not 0 <= gap <= sk_binds.CAPTION_MAX_GAP:
            continue
        # The caption sits on the box's own line. The box is placed a shade above
        # its rule, so compare mid-lines rather than tops.
        if abs((rect.y0 + rect.y1) / 2 - (box.y0 + box.y1) / 2) > sk_binds.CAPTION_MAX_DRIFT * 2:
            continue
        bind = sk_binds.bind_for_caption(text)
        if bind is None:
            continue
        if best_gap is None or gap < best_gap:
            best, best_gap = bind, gap
    return best


NON_GEOMETRY_GUARD = ("id", "type", "x", "y", "width", "height", "page",
                      "value", "fontSize", "color", "background", "border")


def rebind(doc_id, apply_changes):
    pdf = os.path.join(EXPORT, "%s.pdf" % doc_id)
    mapping = os.path.join(EXPORT, "%s.json" % doc_id)
    fields = json.load(open(mapping))["staticFields"]
    before = json.dumps(
        [{k: v for k, v in f.items() if k != "bind"} for f in fields], sort_keys=True)

    doc = fitz.open(pdf)
    captions = {n: captions_left_of(doc[n - 1]) for n in range(1, doc.page_count + 1)}
    doc.close()

    added = collections.Counter()
    for field in fields:
        bind = bind_for_field(field, captions[field["page"]])
        if bind is None:
            field.pop("bind", None)
            continue
        if field.get("bind") != bind:
            added[bind] += 1
        field["bind"] = bind

    after = json.dumps(
        [{k: v for k, v in f.items() if k != "bind"} for f in fields], sort_keys=True)
    if before != after:
        raise SystemExit("%s: a non-bind key changed -- refusing to write" % doc_id)

    bound = sum(1 for f in fields if f.get("bind"))
    if apply_changes:
        bp.write_mapping(mapping, fields)
    return bound, added


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--check", action="store_true", help="report without writing")
    args = parser.parse_args()

    totals = collections.Counter()
    bound_total = 0
    for src in all_sources():
        bound, added = rebind(src["docId"], not args.check)
        totals.update(added)
        bound_total += bound
        print("%-13s bound=%-3d %s" % (src["docId"], bound, dict(added) if added else ""))
    print("\n%d fields bound. New/changed this run: %s"
          % (bound_total, dict(totals) or "none (already bound)"))


if __name__ == "__main__":
    main()
