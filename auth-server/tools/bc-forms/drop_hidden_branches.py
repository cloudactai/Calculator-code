"""Remove printed content that the government's own XFA scripts hide on a blank form.

A fifth shape of class A, and the first found by reading the *template* rather than the
page. pdf.js renders the static layout and does not run the `layout:ready` scripts Acrobat
runs, so a subform the government hides by default is drawn anyway. Sweeping all 145
sources for `presence = "hidden"` in a ready/initialize script and then checking whether
the guarded text reached our page gives three groups:

**Removed here.**

1. **Six affidavit forms** — F15, F16, F70, F84, F86, F97 — share one guard:

       if (…AffidavitByVideo.CheckBox1.rawValue == "0") { this.presence = "hidden";
                                                          affidavit_2.presence = "hidden"; }
       else { this.presence = "visible"; affidavit_2.presence = "visible"; }

   `CheckBox1` defaults to 0, so on a blank form the two paragraphs it guards —
   "I acknowledge the solemnity of making a sworn statement…" and "I was not physically
   present before the person before whom this affidavit was sworn or affirmed…" — must not
   appear. F84 puts it beyond doubt by guarding the bracketed *instruction* with
   `print_scripts.print_blank_copy_get()=="Y" && CheckBox1.rawValue == "0"`: on the blank
   printed copy the government wants the instruction and not the paragraphs. Ours showed
   both, so each of these forms swore in print that the deponent was not physically
   present — false for an affidavit sworn in person, and nothing the deponent can strike.
   The instruction stays; it is what tells the filer to insert the paragraphs when they do
   apply, and F15, F16, F70 and F97 each carry a free `paragraph_txt` line for exactly that.

2. **F32.001 p1** prints its three "Required:" options **twice** — once as the checkbox
   list at y 420-499 and again as bare text at y 507-547, the second set being `Option1`,
   `Option2` and `Option3`, each guarded by `if (paperCopy.CheckBoxN.rawValue == 1)`. Those
   are the echo a ticked box produces on a paper copy, so a blank form shows none of them.
   The wording differs slightly between the copies ("granting leave to provide application
   record late" against "to permit late filing of application record"), which is why no
   duplicate-line sweep caught it.

3. **F29 p2** prints the signature block **twice**, the second being `subSignatureBlock5`
   guarded by `if (addSignature.ShowYN.rawValue == "1")` — the block Acrobat adds when the
   filer clicks "add signature", hidden until then. A consent-order requisition is filed by
   one party (that every affected party consented is asserted at item 3, and the consents
   are on the attached draft order), so the second Date / filing-party / lawyer / print-name
   set and its four fields go.

**Kept deliberately**, though the same sweep reports them:

* the `[if more space is required - attach page and state "See Attached"]` notes and their
  like, hidden at `ready` and shown again by the template's own
  `print_scripts.print_blank_copy_get()` branch — a blank form is where they belong, and
  the approved batch shows them throughout;
* **F37's supplementary fact sheets A-F** (p5-p8, p10, p11), each guarded by its
  `fact_sheet_x_attached_yn` flag: published pages of the financial statement that the
  filer attaches as applicable, so the blank form carries all of them;
* **F1 p1 and F102 p1's `_______ Registry` rule**, guarded by
  `if (FilingCourtLocationCode.isNull)` — true on a blank form, so the rule is what the
  government wants there;
* **F17.1 p1's list of orders** under "There is no court proceeding involving the parties",
  guarded by a data flag that defaults to "N": the list is the body of a statement the
  filer ticks, and both statements print with their checkboxes.

Run: python3 drop_hidden_branches.py [--apply]
"""
import argparse
import json
import os
import sys

import fitz

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import verify_bc2 as V  # noqa: E402

OUT = V.OUT
EXPORT = V.EXPORT

VIDEO = ["I acknowledge the solemnity", "I was not physically present"]
INSTRUCTION = "The following paragraphs must be included"


def root_for(doc_id):
    """Where this form's artifacts live.

    Batch 2 is repaired in its staging directory, so a rebuild keeps the repair and the
    promote carries it across. Batch 1 has no staging — the promoted template *is* the
    artifact — so its three forms are repaired in the export directly. Same split
    `drop_signature_boxes.py` makes, and decided by what is on disk rather than by a
    hand-kept list.
    """
    return OUT if os.path.exists(os.path.join(OUT, "%s.pdf" % doc_id)) else EXPORT

# docId -> dict(page, band, why, fields, gone, halved, keep)
#
#   band    the flattened page's geometry, not the template's
#   fields  how many of the block's own fields go with it (asserted exactly)
#   gone    phrases that must disappear from the page entirely
#   halved  phrases printed twice before and once after
#   keep    phrases that must survive
BLOCKS = {
    "BCSC_F15": dict(page=3, band=fitz.Rect(36.0, 192.0, 580.0, 257.0),
                     why="video-conference paragraphs 3 and 4",
                     halved=VIDEO, keep=[INSTRUCTION]),
    "BCSC_F16": dict(page=2, band=fitz.Rect(36.0, 185.0, 580.0, 249.0),
                     why="video-conference paragraphs (unnumbered)",
                     halved=VIDEO, keep=[INSTRUCTION]),
    "BCSC_F70": dict(page=2, band=fitz.Rect(70.0, 302.0, 580.0, 367.0),
                     why="video-conference paragraphs 3 and 4",
                     halved=VIDEO, keep=[INSTRUCTION]),
    "BCSC_F84": dict(page=2, band=fitz.Rect(70.0, 269.0, 580.0, 333.0),
                     why="video-conference paragraphs 4 and 5",
                     halved=VIDEO, keep=[INSTRUCTION]),
    "BCSC_F86": dict(page=2, band=fitz.Rect(70.0, 436.0, 580.0, 500.0),
                     why="video-conference paragraphs 11 and 12",
                     halved=VIDEO, keep=[INSTRUCTION]),
    # F97 prints them with the numbers missing — ". I acknowledge …" — the dynamic
    # numbering never running, which is a further sign the block is not meant to show.
    "BCSC_F97": dict(page=2, band=fitz.Rect(70.0, 228.0, 580.0, 293.0),
                     why="video-conference paragraphs (unnumbered)",
                     halved=VIDEO, keep=[INSTRUCTION]),
    "BCSC_F32_001": dict(page=1, band=fitz.Rect(85.0, 503.0, 560.0, 549.0),
                         why="the three ticked-option echoes",
                         gone=["Order to permit late filing of application record",
                               "Order to reinstate an application  to today"],
                         halved=["Order as to costs or other directions"],
                         keep=["Order granting leave to provide application record late",
                               "This order / relief is sought because"]),
    "BCSC_F29": dict(page=2, band=fitz.Rect(70.0, 515.0, 560.0, 620.0),
                     why="the second, script-added signature block", fields=4,
                     # "filing party" is no use as a phrase: it occurs inside
                     # "lawyer for filing party(ies)" as well, so it counts 4 not 2.
                     halved=["lawyer for filing party(ies)", "type or print name",
                             "dd/mmm/yyyy", "Date:"],
                     keep=["is under a legal disability"]),
    # ---- batch 1 -------------------------------------------------------------------
    # Found only because a question about F32's party rows sent the same sweep over
    # batch 1's 43 sources, which it had never been run against. Three of them carry the
    # identical video-conference guard, F8 among them — the Financial Statement, one of
    # the most-filed forms in the set.
    "BCSC_F8": dict(page=2, band=fitz.Rect(70.0, 428.0, 580.0, 493.0),
                    why="video-conference paragraphs 3 and 4",
                    halved=VIDEO, keep=[INSTRUCTION, "SWORN (OR AFFIRMED) BEFORE ME"]),
    "BCSC_F30": dict(page=2, band=fitz.Rect(34.0, 179.0, 580.0, 244.0),
                     why="video-conference paragraphs (unnumbered)",
                     halved=VIDEO, keep=[INSTRUCTION, "SWORN (OR AFFIRMED) BEFORE ME"]),
    # F38 is the one form where the bracketed instruction never reached the flattened
    # page, so both phrases go entirely rather than halving, and the two 14.4 pt
    # paragraph-number slots beside the paragraphs go with them. Its guard reads the
    # record rather than a checkbox — `affidavit_sworn_or_affirmed_by_video_conference`
    # — and that field's default in the source's own datasets is "0", so the paragraphs
    # are hidden on a blank form just the same.
    "BCSC_F38": dict(page=7, band=fitz.Rect(50.0, 308.0, 580.0, 376.0),
                     why="video-conference paragraphs, with their number slots", fields=2,
                     gone=VIDEO, keep=["SWORN (OR AFFIRMED) BEFORE ME"]),
}


def counts(page, phrases):
    return {p: len(page.search_for(p)) for p in phrases}


def repair(doc_id, apply_it):
    spec = BLOCKS[doc_id]
    page_number, band = spec["page"], spec["band"]
    halved = spec.get("halved", [])
    gone = spec.get("gone", [])
    keep = spec.get("keep", [])
    expected_fields = spec.get("fields", 0)

    root = root_for(doc_id)
    pdf_path = os.path.join(root, "%s.pdf" % doc_id)
    json_path = os.path.join(root, "%s.json" % doc_id)
    mapping = json.load(open(json_path))
    doc = fitz.open(pdf_path)
    page = doc[page_number - 1]

    # The text test comes first so a second run is a no-op (§7.9): once the block's own
    # fields are gone the count below no longer matches, and asserting on it first would
    # turn re-running this into an error.
    before = counts(page, halved + gone + keep)
    if all(before[p] <= 1 for p in halved) and all(before[p] == 0 for p in gone):
        print("%-12s p%-2d already repaired" % (doc_id, page_number))
        doc.close()
        return False

    inside, straddling = [], []
    for field in mapping["staticFields"]:
        if field["page"] != page_number:
            continue
        rect = V.box(field)
        if band.contains(rect):
            inside.append(field)
        elif rect.intersects(band):
            straddling.append(field)
    if straddling:
        raise SystemExit("%s p%d: field %s straddles the band edge — the band is wrong"
                         % (doc_id, page_number, straddling[0]["id"]))
    if len(inside) != expected_fields:
        raise SystemExit("%s p%d: %d field(s) in the band, expected %d"
                         % (doc_id, page_number, len(inside), expected_fields))

    for phrase in halved:
        if before[phrase] != 2:
            raise SystemExit("%s p%d: %r appears %d times, expected 2"
                             % (doc_id, page_number, phrase, before[phrase]))

    page.add_redact_annot(band, fill=False)
    page.apply_redactions(graphics=fitz.PDF_REDACT_LINE_ART_NONE)
    # Redaction takes the text; the block's rules and checkbox outlines are line art and
    # are painted, because REMOVE_IF_TOUCHED would also take the full-page frame every one
    # of these pages carries. Nothing else lies in the band, so the whole band is painted.
    if any(dr["rect"].intersects(band) and dr["rect"].width < band.width
           for dr in page.get_drawings()):
        page.draw_rect(band, color=None, fill=(1, 1, 1), width=0)

    after = counts(page, halved + gone + keep)
    for phrase in halved:
        if after[phrase] != 1:
            raise SystemExit("%s p%d: %r left %d copies, expected 1"
                             % (doc_id, page_number, phrase, after[phrase]))
    for phrase in gone:
        if after[phrase] != 0:
            raise SystemExit("%s p%d: %r survived" % (doc_id, page_number, phrase))
    for phrase in keep:
        if after[phrase] < 1:
            raise SystemExit("%s p%d: %r was removed" % (doc_id, page_number, phrase))

    print("%-12s p%-2d %-8s %-42s %s"
          % (doc_id, page_number,
             "staging" if root == OUT else "export", spec["why"],
             ", ".join("%s %d->%d" % (p[:22], before[p], after[p])
                       for p in halved + gone)))
    if apply_it:
        tmp = pdf_path + ".tmp"
        doc.save(tmp, garbage=4, deflate=True)
        doc.close()
        os.replace(tmp, pdf_path)
        if inside:
            drop = {int(f["id"]) for f in inside}
            mapping["staticFields"] = [f for f in mapping["staticFields"]
                                       if int(f["id"]) not in drop]
            with open(json_path, "w") as fh:
                json.dump(mapping, fh, indent=1)
                fh.write("\n")
            print("%18s %d field(s) dropped with it" % ("", len(drop)))
    else:
        doc.close()
        if inside:
            print("%18s would drop %d field(s): %s"
                  % ("", len(inside), ", ".join(str(f["id"]) for f in inside)))
    return True


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--apply", action="store_true")
    args = parser.parse_args()
    changed = sum(repair(doc_id, args.apply) for doc_id in sorted(BLOCKS))
    print("\n%d block(s) removed%s" % (changed, "" if args.apply else "  (dry run)"))


if __name__ == "__main__":
    main()
