"""Redraw the two instruction boxes pdf.js cannot lay out (F4 p5, F5 p3).

pdf.js renders those blocks as a bare <ol>: it numbers the items 1..8 instead of
the form's (a)..(h), positions the markers outside the text flow so they print on
top of their own item, and overflows the box into the notice beneath. The text
itself is fine — only the layout is wrong — so the box is cleared and the same
wording is typeset back into it from the enacted text (BC Reg 188/2024).

Run: python3 repair_notice_pages.py [--promote]
"""
import os
import sys

import fitz

EXPORT = "/Users/lorelaiphinnemore/Documents/CloudAct/Frontend /Calculator-code/auth-server/form-template-export"
OUT = os.path.join(EXPORT, "_incoming_bc", "out")

CSS = """
body { font-family: sans-serif; font-size: 7.2pt; line-height: 1.18; margin: 0; }
p { margin: 0 0 3pt 0; }
ul, ol { margin: 2pt 0 2pt 0; padding-left: 13pt; }
li { margin: 0 0 1pt 0; }
ol.alpha { list-style-type: lower-alpha; }
blockquote { margin: 2pt 0 3pt 14pt; }
"""

FINANCIAL_NOTE = """
<p><b>Note to Claimant AND Respondent:</b> You must file <b>financial information</b>
(Form F8) if any of the following apply:</p>
<ul>
<li>there is a claim against you for spousal support or you are claiming spousal support;</li>
<li>there is a claim by either party for the division of property and/or debts under Part 5
or 6 of the <i>Family Law Act</i>;</li>
<li>there is a claim against you for the support of a child, OR</li>
<li>you are claiming child support <b>unless all</b> of the following conditions apply:
<ol class="alpha">
<li>you are making no claim for any other kind of support;</li>
<li>the child support is for children who are not stepchildren;</li>
<li>none of the children for whom child support is claimed is 19 years of age or older;</li>
<li>the income of the person being asked to pay child support is under $150 000 per year;</li>
<li>you are not applying for special expenses under section 7 of the child support guidelines;</li>
<li>you are not applying for an order under section 8 of the child support guidelines;</li>
<li>you are not applying for an order under section 9 of the child support guidelines;</li>
<li>you are not making a claim based on undue hardship under section 10 of the child
support guidelines.</li>
</ol></li>
</ul>
<p>If you do not file the financial information that is required, the court may attribute an
amount of income to you, and make a support award against you, based on that amount.</p>
"""

LANGUAGE_NOTICE = """
<p><b>Notice to Respondent:</b> under <b>section 23.2 of the <i>Divorce Act</i></b>, you may
choose to file pleadings or other documents, including this form, give evidence or make
submissions in any <i>Divorce Act</i> proceeding in either of the two official languages of
Canada (English or French).</p>
<p>Rule 1-1(1) of the Supreme Court Family Rules defines &ldquo;<i>Divorce Act</i>
proceeding&rdquo; as follows:</p>
<blockquote>&ldquo;<i>Divorce Act</i> proceeding&rdquo; means a family law case in which an
order is sought under the <i>Divorce Act</i>.</blockquote>
<p>You may file a Notice of Extension &ndash; Official Languages in Form F86.2 and receive an
additional 10 days to file this %s in accordance with Rule 20-7 (8) of the Supreme Court
Family Rules.</p>
"""

PAGES = {
    "BCSC_F4": (5, [FINANCIAL_NOTE, LANGUAGE_NOTICE % "response to family claim (Form F4)"]),
    "BCSC_F5": (3, [FINANCIAL_NOTE, LANGUAGE_NOTICE % "counterclaim (Form F5)"]),
}


def notice_boxes(page, min_width=380.0, min_height=40.0):
    """The two printed bordered boxes that hold the instruction blocks."""
    rects = []
    for drawing in page.get_drawings():
        rect = drawing["rect"]
        if rect.width >= min_width and rect.height >= min_height and rect.y1 < page.rect.height - 20:
            rects.append(rect)
    rects.sort(key=lambda r: (r.y0, -r.get_area()))
    keep = []
    for rect in rects:
        if any(other.contains(rect) or rect.contains(other) for other in keep):
            continue
        keep.append(rect)
    return keep


def repair(doc_id, page_number, blocks, fields_on_page):
    path = os.path.join(OUT, "%s.pdf" % doc_id)
    doc = fitz.open(path)
    page = doc[page_number - 1]
    boxes = notice_boxes(page)
    if len(boxes) != len(blocks):
        raise SystemExit("%s p%d: found %d bordered boxes, expected %d"
                         % (doc_id, page_number, len(boxes), len(blocks)))
    for box in boxes:
        for field in fields_on_page:
            if fitz.Rect(field).intersects(box):
                raise SystemExit("%s p%d: a field box sits inside a notice box" % (doc_id, page_number))

    # Clear the whole band the boxes occupy, not just their interiors: the
    # overflow spilled past a border, so a stray line can sit in the gap between
    # two boxes. Line art is preserved so the printed borders survive.
    band = fitz.Rect(min(b.x0 for b in boxes) - 6, min(b.y0 for b in boxes) - 2,
                     max(b.x1 for b in boxes) + 6, max(b.y1 for b in boxes) + 2)
    page.add_redact_annot(band)
    # The old bullets are vector art, not text, so line art has to go too — and
    # the box borders are line art as well, so they are drawn back afterwards.
    page.apply_redactions(graphics=fitz.PDF_REDACT_LINE_ART_REMOVE_IF_TOUCHED)
    for box in boxes:
        page.draw_rect(box, color=(0, 0, 0), width=0.7)

    for box, html in zip(boxes, blocks):
        inner = box + (4, 3, -4, -3)
        spare, _ = page.insert_htmlbox(inner, html, css=CSS, scale_low=0.55)
        if spare < 0:
            raise SystemExit("%s p%d: text does not fit its box" % (doc_id, page_number))
        print("    box %.0fx%.0f pt, %.0f pt spare" % (box.width, box.height, spare))

    tmp = path + ".tmp"
    doc.save(tmp, garbage=4, deflate=True)
    doc.close()
    os.replace(tmp, path)


def main():
    import json
    from build_bc_wizard import collisions

    promote = "--promote" in sys.argv
    for doc_id, (page_number, blocks) in PAGES.items():
        mapping = json.load(open(os.path.join(OUT, "%s.json" % doc_id)))["staticFields"]
        on_page = [(f["x"], f["y"], f["x"] + f["width"] / 1.5, f["y"] + f["height"] / 1.5)
                   for f in mapping if f["page"] == page_number]
        print("%s page %d (%d field boxes on the page)" % (doc_id, page_number, len(on_page)))
        repair(doc_id, page_number, blocks, on_page)

        doc = fitz.open(os.path.join(OUT, "%s.pdf" % doc_id))
        hits = collisions(doc[page_number - 1])
        print("    collisions after repair: %d" % len(hits))
        doc.close()
        if hits:
            raise SystemExit("%s: still colliding" % doc_id)

    if promote:
        for doc_id in PAGES:
            for extension in ("pdf", "json"):
                src = os.path.join(OUT, "%s.%s" % (doc_id, extension))
                if os.path.exists(src):
                    import shutil
                    shutil.copy(src, os.path.join(EXPORT, "%s.%s" % (doc_id, extension)))
        print("promoted %s" % ", ".join(PAGES))


if __name__ == "__main__":
    sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
    main()
