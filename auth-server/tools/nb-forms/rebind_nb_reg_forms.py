"""Add the prefill binds to the promoted New Brunswick regulation templates.

    python3 rebind_nb_reg_forms.py [--check]

A separate tool from `rebind_nb_forms.py` because the two batches have nothing
in common at this stage. The Rules of Court forms are AcroForms, so their binder
matches the government's own widget name against the printed page. These are
cut from a consolidation and carry no widget layer at all, so the printed
caption is the only description a box has.

**Only the court file number is bound, and that is the right answer here.**
These are the Minister of Social Development's forms: the style of cause reads

    BETWEEN:  The Minister of Social Development
                                                    Applicant
              - and -
                                                    Respondent(s)

with the *applicant already printed* and the respondent's name nowhere on the
line -- the role words sit in their own right-aligned block, under the party
area rather than beside a leader. There is no box whose printed neighbourhood
says whose name goes in it, and a party bind guessed from position would write a
name onto a warrant. The same is true of Form 1 under the Family Law Act, whose
three applicant leaders and three respondent leaders are captioned only
"(name)".

Writes back the `bind` key alone, asserts every other key byte-identical first,
and is a no-op on a second run.
"""
import json
import os
import re
import sys

import fitz

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from nb_reg_sources import all_sources  # noqa: E402

EXPORT = os.path.join(os.path.dirname(os.path.dirname(HERE)), "form-template-export")

FROZEN = ("id", "type", "x", "y", "width", "height", "page", "value",
          "fontSize", "color", "background", "border")

REACH = 90.0
LINE_FRAC = 0.5

CAPTION = re.compile(r"court file (no\.?|number)$", re.I)


def rect_of(field):
    return (field["x"], field["y"],
            field["x"] + field["width"] / 1.5,
            field["y"] + field["height"] / 1.5)


def caption_left(words, box):
    """The printed words immediately left of a box, on its own line."""
    x0, y0, x1, y1 = box
    height = max(y1 - y0, 1.0)
    picked = []
    for wx0, wy0, wx1, wy1, text, *_ in words:
        overlap = min(y1, wy1) - max(y0, wy0)
        if overlap < LINE_FRAC * min(height, wy1 - wy0):
            continue
        if 0 <= x0 - wx1 <= REACH:
            picked.append((wx0, text))
    picked.sort()
    return re.sub(r"\s+", " ", " ".join(t for _, t in picked)).strip()


def wanted_binds(doc_id):
    pdf = os.path.join(EXPORT, "%s.pdf" % doc_id)
    mapping_path = os.path.join(EXPORT, "%s.json" % doc_id)
    if not (os.path.exists(pdf) and os.path.exists(mapping_path)):
        return {}
    fields = json.load(open(mapping_path))["staticFields"]
    document = fitz.open(pdf)
    out = {}
    try:
        for number in range(1, document.page_count + 1):
            words = document[number - 1].get_text("words")
            for field in fields:
                if field["page"] != number or field["type"] == "CheckBox":
                    continue
                if CAPTION.search(caption_left(words, rect_of(field))):
                    out[field["id"]] = "court_info.courtFileNumber"
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

    old_fields = json.loads(before)
    after = json.loads(json.dumps(fields))
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
        print("%-14s +%d  %s" % (src["docId"], len(added),
                                 ", ".join(sorted({b for _, b in added}))))
    print("\n%s %d binds across %d NB regulation templates"
          % ("would add" if check else "added", total, forms))


if __name__ == "__main__":
    main()
