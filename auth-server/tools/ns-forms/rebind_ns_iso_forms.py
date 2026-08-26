"""Add the prefill binds to the promoted Nova Scotia ISO templates.

    python3 rebind_ns_iso_forms.py [--check]

Runs on templates whose geometry has already been built and promoted, so it is
**not** a rebuild and never touches a box: it writes back only the `bind` key,
asserts every other key is byte-identical first, and leaves an existing bind
alone. A second run is a no-op; `--check` writes nothing.

Binds come from the government's widget name **corroborated against the printed
page**, the rule New Brunswick's Form 81A forced. `ns_iso_binds` explains why
this batch binds one field on one form and why that is the right answer.

This is a separate tool from `rebind_ns_forms.py` because the two Nova Scotia
batches have nothing in common at this stage: the 84 rule forms are Word renders
with no widget name to read, so their binder works entirely off printed
captions, and the ISO forms are AcroForms whose names carry real information.
"""
import json
import os
import sys

import fitz

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
sys.path.insert(0, os.path.join(os.path.dirname(HERE), "bc-forms"))

import bc_pipeline as bp  # noqa: E402
import ns_iso_binds  # noqa: E402
from ns_iso_sources import all_sources  # noqa: E402

EXPORT = os.path.join(os.path.dirname(os.path.dirname(HERE)), "form-template-export")
STAGE = os.path.join(EXPORT, "_incoming_ns_iso")

# Every key that must survive a rebind untouched.
FROZEN = ("id", "type", "x", "y", "width", "height", "page", "value",
          "fontSize", "color", "background", "border")

REACH = 90.0
LINE_FRAC = 0.5


def rect_of(field):
    return (field["x"], field["y"],
            field["x"] + field["width"] / 1.5,
            field["y"] + field["height"] / 1.5)


def words_left(words, box):
    """The printed words immediately left of a box, on its own line."""
    x0, y0, x1, y1 = box
    height = max(y1 - y0, 1.0)
    picked = []
    for wx0, wy0, wx1, wy1, text in words:
        overlap = min(y1, wy1) - max(y0, wy0)
        if overlap < LINE_FRAC * min(height, wy1 - wy0):
            continue
        if 0 <= x0 - wx1 <= REACH:
            picked.append((wx0, text))
    picked.sort()
    return " ".join(text for _, text in picked)


def wanted_binds(doc_id):
    """id -> bind for one template, read off its printed background."""
    pdf = os.path.join(EXPORT, "%s.pdf" % doc_id)
    mapping_path = os.path.join(EXPORT, "%s.json" % doc_id)
    source = os.path.join(STAGE, "%s_source.pdf" % doc_id)
    if not (os.path.exists(pdf) and os.path.exists(mapping_path)
            and os.path.exists(source)):
        return {}
    fields = json.load(open(mapping_path))["staticFields"]
    # The widget names come from the *source*, positionally aligned with the
    # fields `bc_pipeline.extract` returns, so they are re-read here rather than
    # stored in the mapping.
    extracted, audit = bp.extract(source, doc_id)
    names = {f["id"]: n for f, n in zip(extracted, audit["widgetNames"])}

    document = fitz.open(pdf)
    out = {}
    try:
        for number in range(1, document.page_count + 1):
            words = [(w[0], w[1], w[2], w[3], w[4])
                     for w in document[number - 1].get_text("words")]
            for field in fields:
                if field["page"] != number or field["type"] == "CheckBox":
                    continue
                name = names.get(field["id"])
                if not name:
                    continue
                bind = ns_iso_binds.bind_for(
                    name, field, words_left(words, rect_of(field)))
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
    for src in all_sources():
        added = rebind(src["docId"], not check)
        if not added:
            continue
        forms += 1
        total += len(added)
        print("%-20s +%d  %s" % (src["docId"], len(added),
                                 ", ".join(sorted({b for _, b in added}))))
    print("\n%s %d binds across %d NS ISO templates"
          % ("would add" if check else "added", total, forms))


if __name__ == "__main__":
    main()
