"""Add prefill binds to the batch-3 (CFCSA + adoption) templates.

Same contract as `rebind_bc_forms.py`: only the `bind` key is written, every
other key is asserted byte-identical first, an existing bind is never rewritten,
and a second run is a no-op. Run it after any rebuild, which drops the binds.

    python3 rebind_bc3.py [--check]

**What gets bound, and why so little.** One thing: the court file number.

* The CFCSA forms are AcroForm and name that widget `cfn`, `rfn` or
  `REGISTRY FILE NUMBER`; each was read against the caption printed above it, and
  every one of the seventeen carries exactly one in its heading panel.
* The two BC Laws child-protection forms and the adoption affidavits have no
  widget names, so the caption is read off the page — "Court File No.:" to the
  left on the adoption affidavits, "REGISTRY FILE NUMBER" / "Court File Number"
  above the box on CFCSA Forms 5 and 10.

Everything else on these forms is deliberately left blank:

* **The registry line** — the same call `bc_binds` records for the rest of BC. The
  matter holds the court's *name*, not the registry the case is filed in, and a
  wrong registry on a court document is worse than an empty one.
* **The parties.** A child-protection proceeding is between a *director* and the
  child's parents or guardians, and the forms ask for the child(ren) by name
  (`child1`, `namec1`) and the parent(s) (`namep`). Neither is the matter's
  applicant or respondent, and `buildPrefillData` has no child or director root
  to read, so binding them would be a guess about who is who in someone's file.
  The adoption affidavits are the same shape: the deponent is a consenting
  parent, a child over twelve, or a director, depending on which form it is.
"""
import argparse
import json
import os
import sys

import fitz

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
sys.path.insert(0, os.path.abspath(os.path.join(HERE, "..", "on-forms")))

import bc_binds  # noqa: E402
import bc_sources_batch3 as src3  # noqa: E402
import caption_binds  # noqa: E402
from rebind_bc_forms import FROZEN  # noqa: E402

EXPORT = ("/Users/lorelaiphinnemore/Documents/CloudAct/Frontend /Calculator-code"
          "/auth-server/form-template-export")
STAGE = os.path.join(EXPORT, "_incoming_bc3")

FILE_NUMBER = "court_info.courtFileNumber"

# The government's own name for the heading's file-number widget, in the three
# spellings the seventeen published CFCSA forms use between them.
WIDGET = {"cfn": FILE_NUMBER, "rfn": FILE_NUMBER,
          "registry file number": FILE_NUMBER, "court file number": FILE_NUMBER}

# Read above the box, not left of it: these forms print the heading over the cell.
# Confined to the heading panel, where a bare "file number" can only mean this one.
ABOVE = {"registry file number": FILE_NUMBER, "court file number": FILE_NUMBER}
HEADING_BOTTOM = 200.0
ABOVE_REACH = 15.0


def from_widgets(doc_id):
    """id -> bind, by the government's widget name.

    `bc_pipeline.extract` numbers ids from the widget order and returns
    `widgetNames` positionally aligned, so the id is the widget's index. The
    build's geometry passes move boxes but never renumber them.
    """
    import bc_pipeline as bp

    source = os.path.join(STAGE, "%s_source.pdf" % doc_id)
    if not os.path.exists(source):
        return {}
    fields, audit = bp.extract(source, doc_id)
    out = {}
    for field, name in zip(fields, audit["widgetNames"]):
        bind = WIDGET.get(bc_binds.normalise(name))
        if bind:
            out[field["id"]] = bind
    return out


def from_captions(doc_id):
    """id -> bind, by the caption printed left of or above each box."""
    path = os.path.join(EXPORT, "%s.pdf" % doc_id)
    if not os.path.exists(path):
        return {}
    document = fitz.open(path)
    fields = json.load(open(os.path.join(EXPORT, "%s.json" % doc_id)))["staticFields"]
    out = {}
    for number in range(1, document.page_count + 1):
        page = document[number - 1]
        words = [(w[0], w[1], w[2], w[3], w[4]) for w in page.get_text("words")]
        for field in fields:
            if field["page"] != number or field["type"] == "CheckBox":
                continue
            box = caption_binds.rect(field)
            bind = bc_binds.bind_for_caption(caption_binds.near(words, box, "left"), box)
            if not bind and box[1] < HEADING_BOTTOM:
                overhead = fitz.Rect(box[0] - 4, box[1] - ABOVE_REACH, box[2], box[1] - 0.5)
                bind = ABOVE.get(bc_binds.normalise(page.get_text("text", clip=overhead)))
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
    parser = argparse.ArgumentParser()
    parser.add_argument("--check", action="store_true")
    args = parser.parse_args()

    total, forms = 0, 0
    for src in src3.all_sources():
        added = rebind(src["docId"], not args.check)
        if not added:
            print("%-20s -" % src["docId"])
            continue
        forms += 1
        total += len(added)
        print("%-20s +%d  %s" % (src["docId"], len(added),
                                 ", ".join(sorted({b for _, b in added}))))
    print("\n%s %d binds across %d batch-3 templates"
          % ("would add" if args.check else "added", total, forms))


if __name__ == "__main__":
    main()
