"""Build the remaining Ontario templates: printed background PDF + overlay map.

Same recipe the 2026-07 batch of 17 used, which is why it stays deliberately
plain: the government's AcroForm widget rectangle *is* the field box, so the
only work is converting it to the overlay convention, stripping the widget layer
to leave the printed page, and binding the standard heading by field name. The
BC refinement passes (mark snapping, ruled-block expansion, amount sizing) exist
to recover geometry XFA never gave properly; running them over a clean Ontario
AcroForm would move boxes off ground truth, so they are not used here.

Run: python3 build_on_forms.py [--promote]
Without --promote nothing outside _incoming_on/ is written.
"""
import json
import os
import shutil
import sys

import fitz

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "bc-forms")))

import bc_pipeline as bp  # noqa: E402
import on_binds  # noqa: E402
import place_flat_fields as flat  # noqa: E402
from on_catalog import CATEGORY, short_title, title_for  # noqa: E402

HERE = os.path.dirname(os.path.abspath(__file__))
EXPORT = os.path.abspath(os.path.join(HERE, "..", "..", "form-template-export"))
STAGE = os.path.join(EXPORT, "_incoming_on")
OUT = os.path.join(STAGE, "out")
QA = os.path.join(STAGE, "qa")
XFA = os.path.join(STAGE, "xfa")

TYPE_BY_TAG = {"textarea": "TextArea", "select": "TextField"}
# Ontario's XFA signature panels are ~46pt over a single printed rule, taller than
# the 35pt "short box" the AcroForm forms use, so the cutoff is raised on that path.
XFA_SIG_MAX_HEIGHT = 50

# Form 29G's XFA flattens with its Payor and Garnishee panels indented by their
# own row labels, so the right-hand lawyer panel prints past the sheet edge. The
# defect is in the printed background, not in the boxes, so no overlay work fixes
# it — the form needs a hand-laid background before it can ship.
HELD_BACK = {"Form29G": "XFA flatten mislays the Payor/Garnishee panels off the page edge"}

# Forms 37A–37E are the registry's own generation templates — they print
# [[Jurisdiction]]-style merge placeholders and are issued by the court, not
# completed by a party. Excluded from the catalogue by decision, not by defect:
# the placement pass builds them cleanly if that is ever reconsidered.
COURT_ISSUED = {"Form37A", "Form37B", "Form37C", "Form37D", "Form37E"}


def apply_binds(fields, widget_names):
    """Attach a bind path to every heading field whose widget name we recognise."""
    bound = 0
    for field, name in zip(fields, widget_names):
        bind = on_binds.bind_for(name)
        if bind:
            field["bind"] = bind
            bound += 1
    return bound


def xfa_fields(doc_id, background):
    """Overlay fields for a pure-XFA form, from the headless flatten's own boxes.

    Forms 20 and 29G are Adobe LiveCycle documents with no AcroForm layer at all:
    opened outside Adobe they show only the "requires Adobe Reader 8" notice. They
    are rendered to a static page by `render_xfa.sh` (pdf.js + headless Chrome),
    which also writes the government's field boxes read off the rendered DOM.
    """
    raw = json.load(open(os.path.join(XFA, "%s.fields.json" % doc_id)))
    doc = fitz.open(background)
    captions = {n: bp.signature_captions(doc[n - 1]) for n in range(1, doc.page_count + 1)}
    page_sizes = [[round(p.rect.width, 1), round(p.rect.height, 1)] for p in doc]
    doc.close()

    fields, skipped, index = [], 0, 0
    for item in raw:
        kind = "CheckBox" if item["inputType"] in ("checkbox", "radio") \
            else TYPE_BY_TAG.get(item["tag"], "TextField")
        rect = fitz.Rect(item["x"], item["y"], item["x"] + item["width"], item["y"] + item["height"])
        if kind != "CheckBox" and bp.is_signature_box(rect, item.get("name"),
                                                     captions.get(item["page"], []), XFA_SIG_MAX_HEIGHT):
            skipped += 1
            continue
        index += 1
        fields.append({
            "id": bp.new_id(doc_id, index),
            "type": kind,
            "x": round(item["x"], 2),
            "y": round(item["y"], 2),
            "width": round(item["width"] * bp.SCALE, 2),
            "height": round(item["height"] * bp.SCALE, 2),
            "value": "",
            "fontSize": 9,
            "color": [0, 0, 0],
            "background": "none",
            "border": "none",
            "page": item["page"],
        })
    audit = {
        "docId": doc_id,
        "pages": len(page_sizes),
        "fields": len(fields),
        "checkboxes": sum(1 for f in fields if f["type"] == "CheckBox"),
        "textAreas": sum(1 for f in fields if f["type"] == "TextArea"),
        "signaturesSkipped": skipped,
        "pageSizes": page_sizes,
        "source": "xfa",
    }
    # XFA names its widgets machine-side and this pair emits none at all, so there
    # is nothing to bind against; heading prefill for them stays on the PREFILL_PLAN
    # track, to be placed by position.
    return fields, audit, []


def build(entry):
    did = entry["docId"]
    source = os.path.join(STAGE, entry["file"])
    background = os.path.join(OUT, "%s.pdf" % did)

    if os.path.exists(os.path.join(XFA, "%s.fields.json" % did)):
        shutil.copy(os.path.join(XFA, "%s.pdf" % did), background)
        fields, audit, widget_names = xfa_fields(did, background)
        pages = audit["pages"]
    else:
        pages = bp.flatten_background(source, background)
        fields, audit = bp.extract(source, did)
        widget_names = audit.pop("widgetNames")
    if not fields:
        # A PDF exported from Word carries no AcroForm layer, so the boxes are
        # read off the printed page instead — shading, ☐ glyphs, ruled cells and
        # writing lines. Nothing to bind against: these sources carry no field
        # names, so heading prefill for them stays on the PREFILL_PLAN track.
        fields, report = flat.place(source, did, background)
        widget_names = []
        pages = report["pages"]
        audit = {"docId": did, "pages": pages, "fields": len(fields),
                 "checkboxes": sum(1 for f in fields if f["type"] == "CheckBox"),
                 "textAreas": sum(1 for f in fields if f["type"] == "TextArea"),
                 "signaturesSkipped": 0, "pageSizes": report["pageSizes"], "source": "flat"}
    if not fields:
        return None, audit, ["no field anchors found on the printed page"]

    bp.clamp_to_page(fields, audit["pageSizes"])
    bound = apply_binds(fields, widget_names)
    geometry = bp.check_geometry(fields, audit["pageSizes"])
    # A Word-exported page is checked character by character: its amount cells are
    # one "word" of `$` plus five en-spaces, which the word-level gate reads as a
    # box covering a label even when the box correctly starts after the symbol.
    overlaps = (flat.covers_printed_text(background, fields) if audit.get("source") == "flat"
                else bp.check_overlap(background, fields))

    bp.qa_render(background, fields, os.path.join(QA, "%s_qa.pdf" % did))
    bp.write_mapping(os.path.join(OUT, "%s.json" % did), fields)

    audit.update(pageCount=pages, bound=bound, geometryProblems=geometry,
                 overlapFlags=len(overlaps), overlapDetail=overlaps[:20])
    return fields, audit, geometry


def main():
    promote = "--promote" in sys.argv
    os.makedirs(OUT, exist_ok=True)
    os.makedirs(QA, exist_ok=True)
    manifest = json.load(open(os.path.join(STAGE, "manifest.json")))
    order = {row["num"]: i for i, row in enumerate(json.load(open(os.path.join(HERE, "on_sources.json"))))}

    rows, audits, failures, deferred = [], [], [], []
    for entry in manifest:
        did, form_no = entry["docId"], entry["formNumber"]
        if entry["wordOnly"]:
            # A Word-only form becomes buildable the moment someone drops
            # <docId>_source.pdf next to the .docx — see the README. Nothing else
            # about the form changes: the PDF is read exactly like a downloaded one.
            supplied = os.path.join(STAGE, "%s_source.pdf" % did)
            if not os.path.exists(supplied):
                deferred.append((did, "Word-only source; needs a hand-made PDF"))
                continue
            entry = dict(entry, file=os.path.basename(supplied))
        if did in HELD_BACK:
            deferred.append((did, HELD_BACK[did]))
            continue
        if did in COURT_ISSUED:
            deferred.append((did, "court-issued generation template; excluded by decision"))
            continue
        fields, audit, geometry = build(entry)
        if fields is None:
            deferred.append((did, geometry[0]))
            continue
        audits.append(audit)
        if geometry:
            failures.append((did, geometry[:3]))
        rows.append({
            "title": title_for(form_no, entry["title"]),
            "shortTitle": short_title(form_no),
            "footerText": None,
            "status": "active",
            "fileName": "%s.pdf" % did,
            "docId": did,
            "province": "ON",
            "category": CATEGORY[form_no],
            "version": 1,
            "_indexOrder": order[form_no],
        })
        print("%-12s pages=%-2d fields=%-4d cb=%-3d bound=%-3d sig-skipped=%-3d geom=%-2d overlap=%d"
              % (did, audit["pageCount"], audit["fields"], audit["checkboxes"], audit["bound"],
                 audit["signaturesSkipped"], len(geometry), audit["overlapFlags"]))

    with open(os.path.join(OUT, "on_rows.json"), "w") as fh:
        json.dump(rows, fh, indent=1)
    with open(os.path.join(OUT, "on_audit.json"), "w") as fh:
        json.dump(audits, fh, indent=1)

    print("\nbuilt %d templates, %d fields, %d bound"
          % (len(rows), sum(a["fields"] for a in audits), sum(a["bound"] for a in audits)))
    print("geometry failures: %s" % (failures or "none"))
    for did, why in deferred:
        print("deferred  %-12s %s" % (did, why))

    if promote and not failures:
        for row in rows:
            did = row["docId"]
            shutil.copy(os.path.join(OUT, "%s.pdf" % did), os.path.join(EXPORT, "%s.pdf" % did))
            shutil.copy(os.path.join(OUT, "%s.json" % did), os.path.join(EXPORT, "%s.json" % did))
        print("promoted %d templates into form-template-export/" % len(rows))


if __name__ == "__main__":
    main()
