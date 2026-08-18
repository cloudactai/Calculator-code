"""Make the Manitoba templates fill themselves from the matter.

Writes back **only** the `bind` key, and asserts every other key is byte-identical
first, so it is safe to run on templates whose geometry has already been
reviewed. A second run is a no-op. Run it after any rebuild, which drops binds.

    python3 rebind_mb_forms.py --check     # report what would change
    python3 rebind_mb_forms.py             # apply

The vocabulary, and the reasoning for what is deliberately left unbound, is in
`mb_binds.py`.
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
import build_mb_forms as B  # noqa: E402
import mb_binds  # noqa: E402
from mb_sources import all_sources, shipped_sources  # noqa: E402

SCALE = bp.SCALE
EXPORT = os.path.join(os.path.dirname(os.path.dirname(HERE)), "form-template-export")


def page_lines(page):
    """Printed lines as (caption text, rect, caption_right).

    `caption_right` is where the line's last real glyph ends, and it is
    deliberately not the line's bounding box. Manitoba pads its header line out
    to the tab stop with spaces, and on Form 70D.5 runs the blank's underscores
    inside the very same text line, so the bbox of "File No: FD_______________"
    reaches 130pt past the caption the form actually prints and the bbox of
    "File No.  FD" on Form 70U reaches 57pt past it. Measuring the caption's own
    ink is what lets one rule read the file number on all four layouts.

    The text is returned with those trailing underscores and spaces stripped, for
    the same reason: the caption is "File No: FD", not the rule after it.
    """
    out = []
    for text, boxes, _sizes in B.line_chars(page):
        caption = text.rstrip().rstrip("_").rstrip()
        if not caption or len(caption) > 64:
            continue
        out.append((caption, fitz.Rect(boxes[0]) | fitz.Rect(boxes[-1]),
                    boxes[len(caption) - 1].x1))
    return out


def bind_from_left(box, lines):
    """The bind from a caption printed to the box's left, on its own line."""
    best, best_gap = None, None
    for text, rect, right in lines:
        gap = box.x0 - right
        # A small negative gap is normal, not a miss: Manitoba sets the rule hard
        # against its caption, so the box's left edge can land a couple of points
        # inside the caption's last glyph.
        if not -6.0 <= gap <= mb_binds.CAPTION_MAX_GAP:
            continue
        # The box is placed a shade above its rule, so compare mid-lines.
        if abs((rect.y0 + rect.y1) / 2 - (box.y0 + box.y1) / 2) > mb_binds.CAPTION_MAX_DRIFT * 2:
            continue
        bind = mb_binds.bind_for_caption(text)
        if bind is None:
            continue
        if best_gap is None or gap < best_gap:
            best, best_gap = bind, gap
    return best


def bind_from_below(box, lines):
    """The bind from the `(full name)` note under the box and the role under that.

    Both parts are required, and the note has to be the box's own: it is matched
    on a tight vertical window and on sharing the blank's horizontal span, so the
    note belonging to the party line further down the page cannot claim the
    judicial-centre blank above it.
    """
    note = None
    for text, rect, _right in lines:
        if not mb_binds.is_full_name_note(text):
            continue
        if not 0 <= rect.y0 - box.y1 <= mb_binds.NAME_MAX_GAP:
            continue
        if rect.x1 < box.x0 - 20 or rect.x0 > box.x1 + 20:
            continue
        note = rect
        break
    if note is None:
        return None

    best, best_gap = None, None
    for text, rect, _right in lines:
        gap = rect.y0 - box.y1
        if not 0 < gap <= mb_binds.ROLE_MAX_GAP:
            continue
        if rect.x0 > box.x1 + mb_binds.ROLE_MAX_OFFSET or rect.x1 < box.x0 - 20:
            continue
        bind = mb_binds.bind_for_role(text)
        if bind is None:
            continue
        if best_gap is None or gap < best_gap:
            best, best_gap = bind, gap
    return best


def bind_from_role_above(box, lines):
    """The bind from a style-of-cause role word printed under the box, alone.

    Rule 70 always sets a `(full name)` note between the party's blank and the
    role word, and `bind_from_below` requires it. The child-protection and
    adoption forms print no note at all -- bare paper closed by "Applicant," or
    "Respondent(s)." -- which is the layout `style_of_cause_bands` places its box
    for. The punctuation carries the whole weight: a bare role word with no
    comma is a signature caption, and binding one would put the client's name on
    somebody's signature line.
    """
    best, best_gap = None, None
    for text, rect, _right in lines:
        gap = rect.y0 - box.y1
        if not 0 <= gap <= mb_binds.STYLE_MAX_GAP:
            continue
        if rect.x1 < box.x0 or rect.x0 > box.x1 + mb_binds.ROLE_MAX_OFFSET:
            continue
        if not mb_binds.is_style_role(text):
            continue
        bind = mb_binds.bind_for_role(text)
        if bind is None:
            continue
        if best_gap is None or gap < best_gap:
            best, best_gap = bind, gap
    return best


def bind_for_field(field, lines, style_of_cause=True):
    if field["type"] != "TextField":
        return None
    box = fitz.Rect(field["x"], field["y"],
                    field["x"] + field["width"] / SCALE,
                    field["y"] + field["height"] / SCALE)
    found = bind_from_left(box, lines) or bind_from_below(box, lines)
    if found is None and style_of_cause:
        found = bind_from_role_above(box, lines)
    return found


def rebind(doc_id, apply_changes):
    style_of_cause = mb_binds.binds_style_of_cause(doc_id)
    pdf = os.path.join(EXPORT, "%s.pdf" % doc_id)
    mapping = os.path.join(EXPORT, "%s.json" % doc_id)
    fields = json.load(open(mapping))["staticFields"]
    before = json.dumps(
        [{k: v for k, v in f.items() if k != "bind"} for f in fields], sort_keys=True)

    doc = fitz.open(pdf)
    lines = {n: page_lines(doc[n - 1]) for n in range(1, doc.page_count + 1)}
    doc.close()

    added = collections.Counter()
    for field in fields:
        bind = bind_for_field(field, lines[field["page"]], style_of_cause)
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
    parser.add_argument("--all", action="store_true")
    args = parser.parse_args()

    totals = collections.Counter()
    bound_total = 0
    for src in (all_sources() if args.all else shipped_sources()):
        bound, added = rebind(src["docId"], not args.check)
        totals.update(added)
        bound_total += bound
        print("%-13s bound=%-3d %s" % (src["docId"], bound, dict(added) if added else ""))
    print("\n%d fields bound. New/changed this run: %s"
          % (bound_total, dict(totals) or "none (already bound)"))


if __name__ == "__main__":
    main()
