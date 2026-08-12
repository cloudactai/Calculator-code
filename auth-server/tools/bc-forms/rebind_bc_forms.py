"""Add prefill binds to the shipped BC templates, without moving a box.

The BC templates shipped with no binds at all, so nothing on a BC form fills from
the matter today. This adds them the same way `tools/on-forms/rebind_on_forms.py`
does for Ontario: it writes back *only* the `bind` key, asserts every other key is
unchanged first, and never rewrites a bind that is already there.

Provincial Court forms are matched to the government's widgets by `id` —
`bc_pipeline.extract` numbers ids from the widget order and returns `widgetNames`
positionally aligned, so the id is the widget's index. The build's later geometry
passes move boxes but never renumber them, which is why the ids still line up.

Supreme Court forms have no widget names to match: their XFA flatten emits every
field with an empty name, so their captions are read off the printed page.

Run: python3 rebind_bc_forms.py [--check]
"""
import json
import os
import sys

import fitz

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
sys.path.insert(0, os.path.abspath(os.path.join(HERE, "..", "on-forms")))

import bc_binds  # noqa: E402
import bc_pipeline as bp  # noqa: E402
import caption_binds  # noqa: E402

EXPORT = os.path.abspath(os.path.join(HERE, "..", "..", "form-template-export"))
STAGE = os.path.join(EXPORT, "_incoming_bc")

FROZEN = ("id", "type", "x", "y", "width", "height", "value", "fontSize",
          "color", "background", "border", "page")


def from_widgets(doc_id):
    """id -> bind, for a Provincial Court form, by the government's widget name."""
    source = os.path.join(STAGE, "%s_source.pdf" % doc_id)
    if not os.path.exists(source):
        return {}
    fields, audit = bp.extract(source, doc_id)
    names = {bc_binds.normalise(n) for n in audit["widgetNames"]}
    out = {}
    for field, name in zip(fields, audit["widgetNames"]):
        bind = bc_binds.bind_for_widget(name, names)
        if bind:
            out[field["id"]] = bind
    return out


def from_captions(doc_id):
    """id -> bind, for a Supreme Court form, by the caption left of each box."""
    path = os.path.join(EXPORT, "%s.pdf" % doc_id)
    if not os.path.exists(path):
        return {}
    document = fitz.open(path)
    fields = json.load(open(os.path.join(EXPORT, "%s.json" % doc_id)))["staticFields"]
    out = {}
    for number in range(1, document.page_count + 1):
        words = [(w[0], w[1], w[2], w[3], w[4]) for w in document[number - 1].get_text("words")]
        for field in fields:
            if field["page"] != number or field["type"] == "CheckBox":
                continue
            box = caption_binds.rect(field)
            bind = bc_binds.bind_for_caption(caption_binds.near(words, box, "left"), box)
            if bind:
                out[field["id"]] = bind
    document.close()
    return out


def rebind(doc_id, apply_changes):
    path = os.path.join(EXPORT, "%s.json" % doc_id)
    mapping = json.load(open(path))
    fields = mapping["staticFields"]
    before = json.dumps(fields, sort_keys=True)

    wanted = from_widgets(doc_id) or from_captions(doc_id)
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
            assert old.get(key) == new.get(key), "%s: %s changed on %s" % (doc_id, key, old.get("id"))

    if apply_changes:
        with open(path, "w") as fh:
            json.dump(mapping, fh, indent=1)
    return added


def main():
    check = "--check" in sys.argv
    total, forms = 0, 0
    for name in sorted(os.listdir(EXPORT)):
        if not name.startswith("BC") or not name.endswith(".json"):
            continue
        added = rebind(name[:-5], not check)
        if not added:
            print("%-12s -" % name[:-5])
            continue
        forms += 1
        total += len(added)
        print("%-12s +%d  %s" % (name[:-5], len(added),
                                 ", ".join(sorted({b.split(".")[0] for _, b in added}))))
    print("\n%s %d binds across %d BC templates" % ("would add" if check else "added", total, forms))


if __name__ == "__main__":
    main()
