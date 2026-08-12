"""Add missing prefill binds to shipped Ontario templates, without moving a box.

The 2026-08 batch shipped with its geometry reviewed and signed off, so this pass
is deliberately not a rebuild: it re-reads each form's government widget names,
recomputes the bind with `on_binds`, and writes back *only* the `bind` key. Every
other key — id, type, x, y, width, height, page, value, fontSize, colour — is
carried through byte for byte, and `--check` asserts exactly that before anything
is written. A field that already carries a bind is never rewritten, so a bind put
there by hand during review wins over anything computed here.

Fields are matched to widgets by `id`. `bc_pipeline.extract` numbers ids
sequentially from the widget order (`new_id(doc_id, index)`) and returns
`widgetNames` positionally aligned with the fields, so the id *is* the widget's
index. Boxes added or dropped during review simply have no counterpart and are
left alone.

Run: python3 rebind_on_forms.py [--check]
`--check` reports what would change and writes nothing.
"""
import json
import os
import sys

import fitz

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "bc-forms")))

import bc_pipeline as bp  # noqa: E402
import caption_binds  # noqa: E402
import on_binds  # noqa: E402

HERE = os.path.dirname(os.path.abspath(__file__))
EXPORT = os.path.abspath(os.path.join(HERE, "..", "..", "form-template-export"))
STAGE = os.path.join(EXPORT, "_incoming_on")

# Form 20 is Adobe LiveCycle: the headless flatten recovers the government's field
# boxes but XFA emits no widget names at all (every `name` in the export is ""),
# so there is nothing for `on_binds` to read. Its heading is therefore mapped by
# hand, each id checked against the printed caption on the flattened page:
#
#   ...001  x433.5 y48.9   under the "Court File Number" caption (x434.8 y36.9)
#   ...002  x34.3  y49.4   over "(Name of Court)" (y63.9)
#   ...003  x34.3  y78.4   after "at", over "Court office address" (y92.9)
#   ...004  x20.0  y162.5  row 1 under "Applicant(s)" / "Full legal name & …"
#   ...006  x317.0 y162.5  row 1 under the same panel's "Lawyer's name & address"
#   ...008  x20.0  y258.5  row 1 under "Respondent(s)"
#   ...010  x317.0 y258.5  row 1 of the respondent's lawyer column
#
# Ids ...005/007/009/011 are each panel's *second* row — a second applicant or
# respondent — and stay blank for the same reason the AcroForm forms' second rows
# do: a matter holds one of each, and repeating party 1 there would be wrong.
BLOCK = on_binds.BLOCK
XFA_BY_ID = {
    1750177335001: "court_info.courtFileNumber",
    1750177335002: "court_info.courtName",
    1750177335003: "court_info.courtOfficeAddress",
    1750177335004: BLOCK % (("applicant",) * 5),
    1750177335006: BLOCK % (("applicantsLawyer",) * 5),
    1750177335008: BLOCK % (("respondent",) * 5),
    1750177335010: BLOCK % (("respondentsLawyer",) * 5),
}
BY_ID = {"Form20": XFA_BY_ID}

# Every key except `bind`. If a pass ever changes one of these the run aborts:
# the geometry is reviewed and approved, and this tool has no business in it.
FROZEN = ("id", "type", "x", "y", "width", "height", "value", "fontSize",
          "color", "background", "border", "page")


# Binds that are already shipped and are wrong. Both are Form 30B `nameOfCourt`
# widgets that are not the court's name: the page-1 one is the swear/affirm word
# in "and I ____ that the following is true", the page-2 one the same blank in
# the jurat above "before me at". Left alone they print "Ontario Court of
# Justice" into the middle of a sentence. `on_binds` no longer produces either,
# and the geometry is quoted here so the removal is checked, not just trusted.
REMOVE = {
    "Form30B": {
        1: {"page": 1, "y": 361.2, "bind": "court_info.courtName"},
        2: {"page": 2, "y": 609.7, "bind": "court_info.courtName"},
    },
}


def older_batch(doc_id):
    """id -> bind, for the 2026-07 batch, which staged widgets not sources.

    That batch kept `<docId>.fields.json` (the government's widget name plus its
    already-converted box) rather than the source PDF, so ids cannot be recomputed
    and the two sets are matched on geometry instead. `x`, `width`, `type` and
    `page` are required to agree exactly — review only ever nudged boxes
    vertically — and the nearest remaining `y` breaks the tie between the stacked
    rows of a party panel. A stacked row is ~26pt away, so a candidate further
    than 12pt is treated as no match at all rather than risking the neighbour.
    """
    staged = os.path.join(EXPORT, "_incoming", "%s.fields.json" % doc_id)
    if not os.path.exists(staged):
        return {}
    key = lambda f: (f["page"], round(f["x"], 2), round(f["width"], 2), f["type"])
    buckets = {}
    for widget in json.load(open(staged)):
        buckets.setdefault(key(widget), []).append(widget)
    out, taken = {}, set()
    for field in json.load(open(os.path.join(EXPORT, "%s.json" % doc_id)))["staticFields"]:
        options = [w for w in buckets.get(key(field), []) if id(w) not in taken]
        if not options:
            continue
        widget = min(options, key=lambda w: abs(w["y"] - field["y"]))
        if abs(widget["y"] - field["y"]) > 12:
            continue
        taken.add(id(widget))
        bind = on_binds.bind_for(widget["name"])
        if bind:
            out[field["id"]] = bind
    return out


def from_captions(doc_id):
    """id -> bind, read off the printed page — for templates with no widget names.

    The ten Word-only Ontario forms have no AcroForm layer at all, so their boxes
    were drawn from the printed page and there is no name to bind by. The captions
    are, and `caption_binds` reads them with the same vocabulary. Checked against
    the 671 shipped binds that *do* come from widget names, it reproduces 670.

    Used only where the widget paths yield nothing. The single case it gets wrong
    is a body-table cell on a form that has widget names anyway, and letting the
    names win everywhere they exist keeps that class of error out entirely.
    """
    path = os.path.join(EXPORT, "%s.pdf" % doc_id)
    if not os.path.exists(path):
        return {}
    document = fitz.open(path)
    fields = json.load(open(os.path.join(EXPORT, "%s.json" % doc_id)))["staticFields"]
    out = {}
    for number in range(1, document.page_count + 1):
        words = [(w[0], w[1], w[2], w[3], w[4]) for w in document[number - 1].get_text("words")]
        for field in fields:
            if field["page"] != number:
                continue
            bind = caption_binds.bind_for_field(words, field)
            if bind:
                out[field["id"]] = bind
    document.close()
    return out


def proposals(doc_id):
    """id -> bind path, from the government's widget names or the hand map."""
    if doc_id in BY_ID:
        return dict(BY_ID[doc_id])
    source = os.path.join(STAGE, "%s_source.pdf" % doc_id)
    out = {}
    if os.path.exists(source):
        fields, audit = bp.extract(source, doc_id)
        for field, name in zip(fields, audit["widgetNames"]):
            bind = on_binds.bind_for(name)
            if bind:
                out[field["id"]] = bind
    else:
        out = older_batch(doc_id)
    return out or from_captions(doc_id)


def rebind(doc_id, apply_changes):
    path = os.path.join(EXPORT, "%s.json" % doc_id)
    mapping = json.load(open(path))
    fields = mapping["staticFields"]
    before = json.dumps(fields, sort_keys=True)
    wanted = proposals(doc_id)

    added = []
    for field in fields:
        bind = wanted.get(field["id"])
        # An existing bind is a reviewed decision; only a blank one is filled in.
        if not bind or field.get("bind"):
            continue
        field["bind"] = bind
        added.append((field["id"], bind))

    for expected in REMOVE.get(doc_id, {}).values():
        matches = [f for f in fields if f["page"] == expected["page"]
                   and abs(f["y"] - expected["y"]) < 0.5 and f.get("bind") == expected["bind"]]
        assert len(matches) <= 1, "%s: %s is ambiguous" % (doc_id, expected)
        for field in matches:
            del field["bind"]
            added.append((field["id"], "REMOVED %s" % expected["bind"]))

    if not added:
        return []

    # Prove nothing but `bind` moved, on every field, before touching the file.
    after = json.loads(json.dumps(fields))
    for old, new in zip(json.loads(before), after):
        for key in FROZEN:
            assert old.get(key) == new.get(key), "%s: %s changed on %s" % (doc_id, key, old.get("id"))
    assert len(json.loads(before)) == len(after), "%s: field count changed" % doc_id

    if apply_changes:
        with open(path, "w") as fh:
            json.dump(mapping, fh, indent=1)
    return added


def main():
    check = "--check" in sys.argv
    total, forms = 0, 0
    for name in sorted(os.listdir(EXPORT)):
        if not name.startswith("Form") or not name.endswith(".json"):
            continue
        doc_id = name[:-5]
        added = rebind(doc_id, not check)
        if not added:
            continue
        forms += 1
        total += len(added)
        print("%-12s +%d" % (doc_id, len(added)))
        for field_id, bind in added:
            print("    %s  %s" % (field_id, bind[:88]))
    print("\n%s %d binds across %d forms" % ("would add" if check else "added", total, forms))


if __name__ == "__main__":
    main()
