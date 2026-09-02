"""Add the prefill binds to the promoted Newfoundland templates.

    python3 rebind_nl_forms.py [--check]

Runs on templates whose geometry has already been built and promoted, so it is
**not** a rebuild and never touches a box. It writes back only the `bind` key,
asserts every other key (id, type, x, y, width, height, page, value, fontSize,
color) is byte-identical first, and leaves any bind already present alone. A
second run is a no-op; `--check` prints what it would do and writes nothing.

The vocabulary and the reasoning for it are in `nl_binds.py` -- in short, the
party role is read from the word Newfoundland prints to the **right** of each
box, because the government's own widget names were auto-generated and lie
(the applicant's box is named `between`, the respondent's `and`).
"""
import json
import os
import sys

import fitz

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import nl_binds  # noqa: E402

EXPORT = os.path.join(os.path.dirname(os.path.dirname(HERE)), "form-template-export")

# Every key that must survive a rebind untouched.
FROZEN = ("id", "type", "x", "y", "width", "height", "page", "value",
          "fontSize", "color", "background", "border")

# How far to either side of a box to look for its label, in points, and how much
# vertical overlap counts as "on the same line".
REACH = 90.0
LINE_FRAC = 0.5


def indent_of(path):
    """The indent the file on disk already uses, defaulting to 1."""
    with open(path) as fh:
        fh.readline()
        second = fh.readline()
    return (len(second) - len(second.lstrip(" "))) or 1


def rect_of(field):
    return (field["x"], field["y"],
            field["x"] + field["width"] / 1.5,
            field["y"] + field["height"] / 1.5)


def words_beside(words, box, side):
    """The printed words immediately left or right of a box, on its own line."""
    x0, y0, x1, y1 = box
    height = max(y1 - y0, 1.0)
    picked = []
    for wx0, wy0, wx1, wy1, text in words:
        overlap = min(y1, wy1) - max(y0, wy0)
        if overlap < LINE_FRAC * min(height, wy1 - wy0):
            continue
        if side == "right" and 0 <= wx0 - x1 <= REACH:
            picked.append((wx0, text))
        elif side == "left" and 0 <= x0 - wx1 <= REACH:
            picked.append((wx0, text))
    picked.sort()
    if side == "left":
        # Nearest run of words on the left, in reading order.
        return " ".join(t for _, t in picked)
    return " ".join(t for _, t in picked)


# A role word one printed line above the box still labels it. Newfoundland
# stacks the options for a party ("APPLICANT" over "CO-APPLICANT") and hangs
# them off the TOP of the box on five forms, so the word that names the party
# sits about one line-height above the box's centre instead of on it. Party
# rows are ~36pt apart, so a window of one line cannot reach the row above:
# the nearest competing role word on those pages is 33pt away. The window is
# still required to be unambiguous, and the text it finds is passed through
# bind_for_role, so ROLE_STOP keeps blocking "SECOND APPLICANT" and
# "APPLICANT or CO-APPLICANT" exactly as before.
NEAR_LINE = 13.0
AMBIGUOUS = 15.0


def role_line_beside(words, box):
    """The nearest printed line to the right of a box, within one line of it."""
    x0, y0, x1, y1 = box
    middle = (y0 + y1) / 2.0
    lines = {}
    for wx0, wy0, wx1, wy1, text in words:
        if not (0 <= wx0 - x1 <= REACH):
            continue
        lines.setdefault(round((wy0 + wy1) / 2.0, 1), []).append((wx0, text))
    offsets = sorted(lines, key=lambda c: abs(c - middle))
    near = [c for c in offsets if abs(c - middle) <= NEAR_LINE]
    if not near:
        return ""
    rest = [c for c in offsets if c not in near]
    if rest and abs(rest[0] - middle) - abs(near[0] - middle) < AMBIGUOUS:
        # Another printed line is nearly as close; do not guess between them.
        if len(near) > 1:
            return ""
    return " ".join(t for _, t in sorted(lines[near[0]]))


def wanted_binds(doc_id):
    """id -> bind for one template, read off its printed background."""
    pdf = os.path.join(EXPORT, "%s.pdf" % doc_id)
    mapping_path = os.path.join(EXPORT, "%s.json" % doc_id)
    if not (os.path.exists(pdf) and os.path.exists(mapping_path)):
        return {}
    fields = json.load(open(mapping_path))["staticFields"]
    document = fitz.open(pdf)
    out = {}
    try:
        for number in range(1, document.page_count + 1):
            words = [(w[0], w[1], w[2], w[3], w[4])
                     for w in document[number - 1].get_text("words")]
            for field in fields:
                if field["page"] != number or field["type"] == "CheckBox":
                    continue
                box = rect_of(field)
                left = words_beside(words, box, "left")
                # The protection-order set captions its party boxes on the
                # LEFT ("Applicant ______"), so the left word is read first
                # there. Reading right-first on those forms picks up the NEXT
                # column's header: NLEPO_001's summary table prints
                # "APPLICANT: [box] RESPONDENT: [box]" on one row, and the
                # applicant's box would take the respondent's bind.
                bind = None
                if doc_id.startswith("NLEPO_"):
                    bind = nl_binds.bind_for_role_left(left)
                if not bind:
                    bind = nl_binds.bind_for_role(
                        words_beside(words, box, "right"))
                if not bind:
                    bind = nl_binds.bind_for_role(
                        role_line_beside(words, box))
                if not bind:
                    bind = nl_binds.bind_for_caption(left)
                if bind:
                    out[field["id"]] = bind
    finally:
        document.close()
    return out


def rebind(doc_id, apply_changes):
    path = os.path.join(EXPORT, "%s.json" % doc_id)
    mapping = json.load(open(path))
    fields = mapping["staticFields"]
    before = json.dumps(fields, sort_keys=True)

    wanted = wanted_binds(doc_id)
    added = []
    for field in fields:
        bind = wanted.get(field["id"])
        if not bind or field.get("bind"):
            continue
        field["bind"] = bind
        added.append((field["id"], bind))
    if not added:
        return []

    after = json.loads(json.dumps(fields))
    old_fields = json.loads(before)
    assert len(old_fields) == len(after), "%s: field count changed" % doc_id
    for old, new in zip(old_fields, after):
        for key in FROZEN:
            assert old.get(key) == new.get(key), (
                "%s: %s changed on %s" % (doc_id, key, old.get("id")))

    if apply_changes:
        # Keep the file's own indent -- the NL export is a mix of 1- and
        # 2-space files, and imposing either one rewrites every line of the
        # ones that use the other, burying a two-line bind change in a
        # thousand-line reformat.
        with open(path, "w") as fh:
            json.dump(mapping, fh, indent=indent_of(path))
    return added


def main():
    check = "--check" in sys.argv
    total, forms = 0, 0
    for name in sorted(os.listdir(EXPORT)):
        if not name.endswith(".json"):
            continue
        if not name.startswith(("NLSC_", "NLPC_", "NLEPO_")):
            continue
        added = rebind(name[:-5], not check)
        if not added:
            continue
        forms += 1
        total += len(added)
        print("%-46s +%d  %s" % (name[:-5], len(added),
                                 ", ".join(sorted({b for _, b in added}))))
    print("\n%s %d binds across %d NL templates"
          % ("would add" if check else "added", total, forms))


if __name__ == "__main__":
    main()
