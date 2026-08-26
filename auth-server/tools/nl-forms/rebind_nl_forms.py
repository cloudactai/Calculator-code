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
                bind = nl_binds.bind_for_role(words_beside(words, box, "right"))
                if not bind:
                    bind = nl_binds.bind_for_caption(
                        words_beside(words, box, "left"))
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
        with open(path, "w") as fh:
            json.dump(mapping, fh, indent=1)
    return added


def main():
    check = "--check" in sys.argv
    total, forms = 0, 0
    for name in sorted(os.listdir(EXPORT)):
        if not name.startswith("NLSC_") or not name.endswith(".json"):
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
