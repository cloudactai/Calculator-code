"""Build the batch-2 BC templates (the rest of the published government set).

One driver for both families, because the only thing that differs is where the field
boxes come from (placement guide §1):

  * Provincial Court + a few Supreme admin forms are **AcroForm** — the widget's own
    /Rect is ground truth, read straight off the source (`bc_pipeline.extract`).
  * Supreme Court forms are **XFA** — flattened headlessly by `xfa/print_xfa.mjs`,
    and the boxes come off the rendered DOM (`sc_out2/<docId>.fields.json`).

Everything after that is the shared `bc_pipeline` placement chain, identical to the
one batch 1 shipped, so the two batches are placed by the same rules.

Run: python3 build_bc_batch2.py [--promote] [--only DOCID[,DOCID...]]

Without --promote it writes to _incoming_bc2/out and prints the gate results only.
Nothing in this script reads or writes a batch-1 template: the shipped 43 keep the
geometry the user already reviewed (placement guide, "Change discipline").
"""
import argparse
import json
import os
import shutil
import sys

import fitz

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import bc_pipeline as bp  # noqa: E402
import bc_sources_batch2 as src2  # noqa: E402

EXPORT = ("/Users/lorelaiphinnemore/Documents/CloudAct/Frontend /Calculator-code"
          "/auth-server/form-template-export")
STAGE = os.path.join(EXPORT, "_incoming_bc2")
OUT = os.path.join(STAGE, "out")
QA = os.path.join(STAGE, "qa")
BLANKMAPS = os.path.join(STAGE, "blankmaps")
SC = os.path.join(os.path.dirname(os.path.abspath(__file__)), "xfa", "sc_out2")

TYPE_BY_TAG = {"textarea": "TextArea", "select": "TextField"}


def blank_pages(doc_id, pages):
    """Which rendered pages are the blank court document, 1-based.

    18 batch-2 Supreme forms carry the document several times over — a data-entry
    section, a filled `printed_page`, an `instructional_sheet`, and the blank one a
    lawyer actually files. XFA names the subform, so `xfa/blank_pages.mjs` reads the
    split off the template and this trusts that naming rather than guessing from the
    printed text (BC_MIGRATION_PLAN STATUS: guessing is what misclassified 12 forms
    in batch 1, in both directions).

    A form with no `blank_*` subform is single-variant: every page is the document.
    """
    path = os.path.join(BLANKMAPS, "%s.json" % doc_id)
    if not os.path.exists(path):
        return list(range(1, pages + 1))
    blank = json.load(open(path))["blank"]
    if not blank or len(blank) == pages:
        return list(range(1, pages + 1))
    return blank


def printed_collisions(page):
    """Printed lines drawn on top of each other.

    pdf.js positions a flowed subform without running Adobe's layout engine, so two
    conditional paragraphs can land on the same band. Such a page is not filable.

    Superimposition is judged on the **baseline**, not on bbox area as
    build_bc_wizard.py did. Area alone reports two things that are perfectly correct
    and were confirmed so by reading the page:

      * consecutive wrapped lines of one tight table cell, whose bboxes bleed into
        each other by more than a third of their height (F37 p5 row (c));
      * a right-aligned label hard against the next column's printed value, where the
        two boxes touch but neither covers the other (F95 p2, "confirmation fee" and
        the printed statutory "10").

    Two lines genuinely drawn over each other share a baseline; lines that merely
    crowd each other sit a full line apart. So the test is vertical centres within
    35% of a line height, plus real horizontal overlap.

    Baseline alone is still not enough, because an inline field marker is *supposed*
    to share the sentence's baseline: F37 p6 sets "...in the amount of $____ per
    month", and the lone "$" overlaps the tail of the sentence's line box. So a hit
    also has to be two pieces of real text (>2 characters) overlapping across at
    least half the shorter one — words on words, which is what an unresolved
    conditional paragraph looks like.
    """
    lines = []
    for block in page.get_text("dict")["blocks"]:
        for line in block.get("lines", []):
            text = "".join(span["text"] for span in line["spans"]).strip()
            if text:
                lines.append((fitz.Rect(line["bbox"]), text))
    hits = []
    for index, (rect, text) in enumerate(lines):
        for other, other_text in lines[index + 1:]:
            if len(text) <= 2 or len(other_text) <= 2:
                continue
            span = min(rect.height, other.height)
            if span <= 0:
                continue
            if abs((rect.y0 + rect.y1) / 2 - (other.y0 + other.y1) / 2) > 0.35 * span:
                continue
            shared = min(rect.x1, other.x1) - max(rect.x0, other.x0)
            if shared > 0.5 * min(rect.width, other.width):
                hits.append((text[:40], other_text[:40]))
    return hits


def xfa_overlay_fields(doc_id, raw, pdf_path):
    """XFA field boxes -> overlay fields. Same rules as build_bc_supreme.py.

    Two classes are deliberately dropped:
      * a box whose default the flatten printed into the background — an editable box
        on top would let typing collide with the printed word (§6);
      * a signature box (§5 — never place a box on a signature line).
    """
    doc = fitz.open(pdf_path)
    captions = {n: bp.signature_captions(doc[n - 1]) for n in range(1, doc.page_count + 1)}
    doc.close()

    fields, skipped, baked = [], [], []
    index = 0
    for item in raw:
        if item["inputType"] in ("checkbox", "radio"):
            kind = "CheckBox"
        else:
            kind = TYPE_BY_TAG.get(item["tag"], "TextField")
        if kind != "CheckBox" and item.get("printedValue"):
            baked.append({"page": item["page"], "value": item["printedValue"][:40]})
            continue
        rect = fitz.Rect(item["x"], item["y"],
                         item["x"] + item["width"], item["y"] + item["height"])
        if kind != "CheckBox" and bp.is_signature_box(rect, item.get("name"),
                                                      captions.get(item["page"], [])):
            skipped.append({"page": item["page"], "name": item.get("name", ""),
                            "why": "signature"})
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
    return fields, skipped, baked


def footer_text(pdf_path, fallback):
    doc = fitz.open(pdf_path)
    try:
        for line in doc[0].get_text().splitlines():
            if line.strip().lower().startswith("last updated"):
                return line.strip()[:120]
    finally:
        doc.close()
    return fallback


def place(background, fields):
    """The shared placement chain — the same calls, in the same order, as batch 1."""
    bp.nudge_off_hint(background, fields)
    bp.snap_checkboxes(background, fields)
    bp.assign_marks(background, fields)
    bp.stamp_shapes(background, fields)
    bp.snap_text_fields(background, fields)
    bp.expand_ruled_blocks(fields, background)
    bp.clear_printed_labels(background, fields)
    bp.merge_sliver_fields(background, fields)
    bp.size_amounts_to_dollar(background, fields)


def build_one(src, manifest_entry):
    doc_id = src["docId"]
    background = os.path.join(OUT, "%s.pdf" % doc_id)
    kind = manifest_entry["kind"]

    if kind == "acroform":
        source = os.path.join(STAGE, "%s_source.pdf" % doc_id)
        pages = bp.flatten_background(source, background)
        fields, audit = bp.extract(source, doc_id)
        doc = fitz.open(background)
        page_sizes = [[round(p.rect.width, 1), round(p.rect.height, 1)] for p in doc]
        doc.close()
        skipped = audit.get("signatureDetail", [])
        baked = []
    else:
        doc = fitz.open(os.path.join(SC, "%s.pdf" % doc_id))
        keep = blank_pages(doc_id, doc.page_count)
        source_pages = None if len(keep) == doc.page_count else list(keep)
        doc.select([p - 1 for p in keep])
        doc.save(background, garbage=4, deflate=True, clean=True)
        page_sizes = [[round(p.rect.width, 1), round(p.rect.height, 1)] for p in doc]
        pages = doc.page_count
        collisions = {i + 1: printed_collisions(p) for i, p in enumerate(doc)}
        collisions = {k: v for k, v in collisions.items() if v}
        doc.close()

        # Keep only the boxes that sit on the pages we kept, renumbered to match.
        renumber = {old: new for new, old in enumerate(keep, start=1)}
        raw = [dict(f, page=renumber[f["page"]])
               for f in json.load(open(os.path.join(SC, "%s.fields.json" % doc_id)))
               if f["page"] in renumber]
        fields, skipped, baked = xfa_overlay_fields(doc_id, raw, background)
        audit = {"docId": doc_id, "sourcePages": source_pages,
                 "collisionPages": {str(k): v for k, v in collisions.items()}}

    doc = fitz.open(background)
    widgets = sum(len(list(p.widgets())) for p in doc)
    doc.close()

    bp.clamp_to_page(fields, page_sizes)
    place(background, fields)
    geometry = bp.check_geometry(fields, page_sizes)
    overlaps = bp.check_overlap(background, fields)
    bp.qa_render(background, fields, os.path.join(QA, "%s_qa.pdf" % doc_id))
    bp.write_mapping(os.path.join(OUT, "%s.json" % doc_id), fields)

    audit.update(docId=doc_id, kind=kind, pages=pages, fields=len(fields),
                 checkboxes=sum(1 for f in fields if f["type"] == "CheckBox"),
                 signaturesSkipped=len(skipped), signatureDetail=skipped,
                 printedDefaults=len(baked), printedDefaultDetail=baked,
                 geometryProblems=geometry, overlapFlags=len(overlaps),
                 overlapDetail=overlaps[:20], nativeWidgets=widgets)

    row = row_for(src, background, pages, manifest_entry)
    return row, audit, geometry, widgets


def row_for(src, background, pages, manifest_entry):
    """The catalog row for a form, from the form's own numbering and its built PDF."""
    doc_id = src["docId"]
    court = "SC" if src["court"] == "Supreme" else "PC"
    lettered = src["formNo"].startswith(("PFA", "SUP", "PD-", "S-"))
    label = src["formNo"] if lettered or src["formNo"].startswith("F") else "Form " + src["formNo"]
    title = ("%s - %s" if lettered else "Form %s - %s") % (src["formNo"], src["name"])
    return {
        "title": title,
        "shortTitle": "BC %s %s" % (court, label),
        "footerText": footer_text(background, manifest_entry.get("footerText") or src["formNo"]),
        "status": "active",
        "fileName": "%s.pdf" % doc_id,
        "docId": doc_id,
        "province": "BC",
        "category": "%s Court – %s" % (src["court"], src["category"]),
        "version": 1,
        "pageCount": pages,
    }


def manifest_entry_for(doc_id):
    for entry in json.load(open(os.path.join(STAGE, "manifest.json"))):
        if entry["docId"] == doc_id:
            return entry
    raise KeyError(doc_id)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--promote", action="store_true")
    ap.add_argument("--only")
    ap.add_argument("--rows-only", action="store_true",
                    help="rewrite bc2_rows.json from the templates already built, "
                         "without rebuilding them")
    args = ap.parse_args()

    if args.rows_only:
        # A rebuild would discard the repairs and placements applied after it
        # (repair_f19_4_header, trim_label_overlap, place_missing_bc2), so the catalog
        # rows are regenerated from the built files instead. Everything a row needs —
        # page count, footer stamp, title, category — is readable off them.
        rows = []
        for src in src2.all_sources():
            doc_id = src["docId"]
            background = os.path.join(OUT, "%s.pdf" % doc_id)
            doc = fitz.open(background)
            pages = doc.page_count
            doc.close()
            entry = manifest_entry_for(doc_id)
            rows.append(row_for(src, background, pages, entry))
        rows.sort(key=src2.sort_key_for_doc_id)
        with open(os.path.join(OUT, "bc2_rows.json"), "w") as fh:
            json.dump(rows, fh, indent=1)
        print("rewrote bc2_rows.json with %d rows from the built templates" % len(rows))
        return

    os.makedirs(OUT, exist_ok=True)
    os.makedirs(QA, exist_ok=True)
    manifest = {m["docId"]: m for m in json.load(open(os.path.join(STAGE, "manifest.json")))}
    sources = src2.all_sources()
    if args.only:
        want = set(args.only.split(","))
        sources = [s for s in sources if s["docId"] in want]

    rows, audits, failures = [], [], []
    for src in sources:
        entry = manifest[src["docId"]]
        row, audit, geometry, widgets = build_one(src, entry)
        rows.append(row)
        audits.append(audit)
        if geometry:
            failures.append((src["docId"], "geometry", geometry[:3]))
        if widgets:
            failures.append((src["docId"], "flatten left %d widgets" % widgets))
        # Printed text drawn over itself makes a page unfilable, not merely ugly, so
        # it blocks the form the same way bad geometry does.
        if audit.get("collisionPages"):
            failures.append((src["docId"], "printed text collides on pages %s"
                             % sorted(audit["collisionPages"], key=int)))
        print("%-14s %-8s pages=%-3d fields=%-4d cb=%-4d sig-skip=%-3d baked=%-3d geom=%-2d overlap=%-2d collide=%d"
              % (src["docId"], audit["kind"], audit["pages"], audit["fields"],
                 audit["checkboxes"], audit["signaturesSkipped"], audit["printedDefaults"],
                 len(geometry), audit["overlapFlags"], len(audit.get("collisionPages") or {})))

    # A filtered build must not shrink the row and audit files to the forms it happened
    # to rebuild. An earlier `--only` run on four forms did exactly that, and the next
    # promote shipped 4 templates instead of 145 — caught by the row count it printed.
    rows_path = os.path.join(OUT, "bc2_rows.json")
    audit_path = os.path.join(OUT, "bc2_audit.json")
    if args.only:
        rebuilt = {row["docId"] for row in rows}
        if os.path.exists(rows_path):
            rows = [row for row in json.load(open(rows_path))
                    if row["docId"] not in rebuilt] + rows
        if os.path.exists(audit_path):
            audits = [item for item in json.load(open(audit_path))
                      if item["docId"] not in rebuilt] + audits
    rows.sort(key=src2.sort_key_for_doc_id)
    with open(rows_path, "w") as fh:
        json.dump(rows, fh, indent=1)
    with open(audit_path, "w") as fh:
        json.dump(audits, fh, indent=1)

    print("\nfailures: %s" % (failures or "none"))
    print("total fields: %d across %d forms, %d pages" % (
        sum(a["fields"] for a in audits), len(audits), sum(a["pages"] for a in audits)))
    if args.promote and not failures:
        for row in rows:
            doc_id = row["docId"]
            shutil.copy(os.path.join(OUT, "%s.pdf" % doc_id), os.path.join(EXPORT, "%s.pdf" % doc_id))
            shutil.copy(os.path.join(OUT, "%s.json" % doc_id), os.path.join(EXPORT, "%s.json" % doc_id))
        print("promoted %d templates into form-template-export/" % len(rows))
    elif args.promote:
        print("NOT promoted — fix the failures first")


if __name__ == "__main__":
    main()
