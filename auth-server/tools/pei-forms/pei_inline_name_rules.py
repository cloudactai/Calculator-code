"""Give the lawyer's name on the Statement of Lawyer a rule it fits on.

Five forms print the same sentence -- "I, ____, lawyer for the petitioner,
certify to this court that I have complied with the requirements of section 7.7
of the Divorce Act" -- and the government's own typesetting gives the name
**28pt**. The mapping honoured that rule exactly, so the shipped field is 28pt
too, and `render_review`'s filled view shows the consequence: a name of ordinary
length overflows in red and prints across the word "lawyer". It is not a
cramped box; it is a collision.

**There is no horizontal room to widen into.** The line is justified to the
right margin: `46. I,` ends at 132.2, the blank runs to 161.9, and the rest of
the sentence fills the measure. Widening the blank in place would print the
field over the court's own words.

So the line is reflowed instead -- the tail moves onto its own line and the
blank takes the whole of line 1:

    46. I, ____, lawyer for the petitioner, certify to this court that I have
        complied with the requirements of section 7.7 ...

    46. I, ______________________________________________ ,
          (name)
        lawyer for the petitioner, certify to this court that I have
        complied with the requirements of section 7.7 ...

**The sentence is copied, not re-typeset.** The tail is lifted as a clipped
form XObject (`show_pdf_page`) and re-placed one line down at the paragraph's
own continuation indent, so its glyphs, justification spacing and font are the
page's own -- the batch has refused re-setting text three times and this does
not do it either. Only two things are drawn: the rule's extension (the same
0.6pt black stroke it already is) and the `(name)` caption, which straddles the
band boundary and so cannot be carried across it as ink. That caption is six
glyphs of Times-Italic 5.6, re-drawn at its own origin -- the same move
`repair_pei_background.COURT_ADDRESS_REFLOWS` makes to widen a 55pt court-office
rule to 135pt, for the same reason.

Room is made by the band reflow `pei_answer_space` uses; none of the four pages
needs to spill.

    python3 pei_inline_name_rules.py --check
    python3 pei_inline_name_rules.py
"""
import argparse
import json
import os
import shutil
import sys

import fitz

import pei_answer_space as PAS
import pei_general_heading as PGH

HERE = os.path.dirname(os.path.abspath(__file__))
EXPORT = os.path.abspath(os.path.join(HERE, "..", "..", "form-template-export"))
SCALE = 1.5

CAPTION = "(name)"
CAPTION_FONT = "tiit"          # Times-Italic, what the source span reports
CAPTION_SIZE = 5.6

# Where each instance is, and the field sitting on its rule. Only the anchor
# and the field are named: everything else -- the comma, the tail, the
# continuation indent, the line pitch, the rule, the caption -- is measured off
# the page, so this cannot drift from what the form actually says.
#   (docId, page, first line's y0, field id)
INSTANCES = [
    ("PEISC_70A", 11, 214.99, 1750805871167),
    ("PEISC_70B", 3, 280.35, 1750081877025),
    ("PEISC_70B_JOINT", 2, 268.35, 1750487331009),
    ("PEISC_70A_JOINT", 8, 306.77, 1750047614166),
    ("PEISC_70A_JOINT", 8, 521.42, 1750047614167),
]

SHIFTS = os.path.join(HERE, "inline_name_shifts.json")


def load_shifts():
    return json.load(open(SHIFTS)) if os.path.exists(SHIFTS) else {}


def shifted(doc_id, page_no, y):
    """Move one y from the pre-reflow page onto the shipped page.

    Third and last in the chain `repair_pei_fields._translate` composes:
    general heading, then answer space, then this.
    """
    for entry in load_shifts().get(doc_id, []):
        if entry["page"] == page_no:
            return round(y + sum(d for at, d in entry["cuts"] if at <= y + 0.01), 2)
    return y


def page_for(doc_id, page_no, _y):
    """Unchanged: no instance of this reflow spills, so no page moves."""
    return page_no


def record(doc_id, page_no, cuts):
    shifts = load_shifts()
    rows = [e for e in shifts.get(doc_id, []) if e["page"] != page_no]
    rows.append({"page": page_no,
                 "cuts": [[round(a, 2), round(d, 2)] for a, d in cuts]})
    rows.sort(key=lambda e: e["page"])
    shifts[doc_id] = rows
    with open(SHIFTS, "w") as handle:
        json.dump(shifts, handle, indent=2, sort_keys=True)


def lines_of(page):
    out = []
    for block in page.get_text("dict")["blocks"]:
        for line in block.get("lines", []):
            text = "".join(s["text"] for s in line["spans"]).strip()
            if text:
                out.append((line["bbox"], text))
    out.sort(key=lambda r: (r[0][1], r[0][0]))
    return out


def measure(page, anchor):
    """Everything the reflow needs, read off the page rather than tabulated."""
    lines = lines_of(page)
    same = [(b, t) for b, t in lines if abs(b[1] - anchor) < 1.0]
    tail = next(((b, t) for b, t in same if t.startswith(",")), None)
    if tail is None:
        raise ValueError("no ', lawyer ...' tail on the line at %.2f" % anchor)
    tbox, _ttext = tail

    words = sorted([w for w in page.get_text("words")
                    if abs(w[1] - anchor) < 1.5 and w[0] >= tbox[0] - 0.1],
                   key=lambda w: w[0])
    if not words or words[0][4] != ",":
        raise ValueError("expected a lone comma to open the tail at %.2f" % anchor)
    comma = (words[0][0], words[0][2])
    rest_x0 = words[1][0]
    right = tbox[2]

    caption = next(((b, t) for b, t in lines
                    if b[1] > tbox[1] and t.startswith("(name")), None)
    if caption is None:
        raise ValueError("no (name) caption under the line at %.2f" % anchor)
    cbox, _ctext = caption
    origin = None
    for block in page.get_text("dict")["blocks"]:
        for line in block.get("lines", []):
            if abs(line["bbox"][1] - cbox[1]) < 0.2:
                origin = line["spans"][0]["origin"]
    # The next line of the paragraph -- not the caption, which sits under the
    # rule and overlaps this line's own ascenders by about a point.
    nxt = next((b for b, t in lines
                if b[1] > tbox[3] + 0.5 and not t.startswith("(name")), None)
    if nxt is None:
        raise ValueError("no continuation line under %.2f" % anchor)

    rule = None
    for drawing in page.get_drawings():
        r = drawing["rect"]
        if (drawing["type"] == "s" and abs(r.y1 - r.y0) < 0.01
                and tbox[1] < r.y0 < tbox[3] + 1.0
                and abs(r.x1 - comma[0]) < 1.0):
            rule = drawing
    if rule is None:
        raise ValueError("no writing rule under the blank at %.2f" % anchor)

    lead = round(nxt[1] - tbox[1], 2)             # the paragraph's line pitch
    cut = round((tbox[3] + nxt[1]) / 2.0, 2)
    comma_x0 = round(right - (comma[1] - comma[0]), 2)
    return {
        "tail": fitz.Rect(comma[0] - 0.6, tbox[1] - 1.2, right + 0.6, tbox[3] + 1.2),
        "comma": fitz.Rect(comma[0] - 0.6, tbox[1] - 1.2, rest_x0 - 0.6, tbox[3] + 1.2),
        "rest": fitz.Rect(rest_x0 - 0.6, tbox[1] - 1.2, right + 0.6, tbox[3] + 1.2),
        "caption": fitz.Rect(cbox[0] - 0.8, cbox[1] - 0.8, cbox[2] + 0.8, cbox[3] + 0.8),
        "caption_origin": origin,
        "indent": nxt[0],
        "rest_dx": round(nxt[0] - rest_x0, 2),
        "comma_dx": round(comma_x0 - comma[0], 2),
        "rule_y": rule["rect"].y0,
        "rule_x0": rule["rect"].x0,
        "rule_x1": rule["rect"].x1,
        "rule_width": rule.get("width") or 0.6,
        "new_rule_x1": comma_x0,
        "lead": lead,
        "cut": cut,
        "line_y0": tbox[1],
    }


def scrubbable(page, cut, drops):
    """Whiteouts crossing `cut` that are provably hiding nothing that survives.

    `pei_answer_space.whiteouts_crossing` refuses a white rectangle that covers
    a glyph, because such a rectangle may be hiding erased text and removing it
    would put the text back. Here one of them covers the `(name)` caption --
    it is drawn *under* the caption, which is why the caption prints -- and the
    caption is already being redacted and re-drawn. So the test is widened by
    exactly that much: a covered glyph is acceptable when it is one this pass
    removes and re-draws anyway, and nothing else. A whiteout hiding anything
    that survives the reflow is still refused.
    """
    out = []
    words = [w for w in page.get_text("words") if w[4].strip()]
    for drawing in page.get_drawings():
        rect, inked = drawing["rect"], PAS.art_extent(drawing)
        if not (inked.y0 < cut - 0.01 < inked.y1) or rect.height <= 0.01:
            continue
        if drawing.get("fill") != (1.0, 1.0, 1.0) or drawing.get("color") != (1.0, 1.0, 1.0):
            continue
        safe = True
        for x0, y0, x1, y1, *_rest in words:
            box = fitz.Rect(x0, y0, x1, y1)
            if (box & rect).get_area() <= 0.5 * box.get_area():
                continue
            if not any((box & drop).get_area() > 0.5 * box.get_area() for drop in drops):
                safe = False
                break
        if safe:
            out.append(rect)
    return out


def scrub(doc, page_no, cuts, redrawn):
    """Remove the whiteouts crossing each cut, before any band is carved.

    Done with a hairline redaction on the cut itself and
    `PDF_REDACT_LINE_ART_REMOVE_IF_TOUCHED`, not by redacting each rectangle's
    own box: a stroke is centred on its path, so the box does not *cover* the
    art it describes and REMOVE_IF_COVERED keeps it -- the first run of this
    pass left a scrubbed whiteout in place and let the band below carry a
    second copy 16pt lower. Text is preserved explicitly, because the hairline
    lands between two lines that are only a few points apart.
    """
    page = doc[page_no - 1]
    width = page.rect.width
    taken = 0
    for cut in cuts:
        rects = scrubbable(page, cut, redrawn)
        if not rects:
            continue
        near = [d["rect"] for d in page.get_drawings()
                if PAS.art_extent(d).y0 - 0.05 <= cut <= PAS.art_extent(d).y1 + 0.05]
        unexpected = [r for r in near if not any(r == s for s in rects)]
        if unexpected:
            raise ValueError("cut %.2f would also take %s" % (cut, unexpected))
        page.add_redact_annot(fitz.Rect(0, cut - 0.01, width, cut + 0.01))
        taken += len(rects)
    if taken:
        page.apply_redactions(images=fitz.PDF_REDACT_IMAGE_NONE,
                              graphics=fitz.PDF_REDACT_LINE_ART_REMOVE_IF_TOUCHED,
                              text=fitz.PDF_REDACT_TEXT_NONE)
    return taken


def carve(doc, page_no, drops, text_only=False):
    """A one-page copy of the page with every rect in `drops` redacted away.

    `text_only` switches line art from REMOVE_IF_COVERED to REMOVE_IF_TOUCHED,
    which is what the tail strips need. A strip keeps a few words by redacting
    everything around them, and the writing rule and the two whiteouts behind
    the blank all reach a fraction of a point into that surround: covered they
    are not, so REMOVE_IF_COVERED keeps them whole and each strip carries its
    own copy of all three. That is +6 drawings per instance and nothing visibly
    wrong -- the census found it, the render could not. The tail is words and
    only words, so removing every stroke the surround touches is safe here and
    is not safe for a band, which is why this is a flag rather than the default.
    """
    out = fitz.open()
    out.insert_pdf(doc, from_page=page_no - 1, to_page=page_no - 1)
    target = out[0]
    for rect in drops:
        if rect.get_area() > 0:
            target.add_redact_annot(rect)
    target.apply_redactions(
        images=fitz.PDF_REDACT_IMAGE_NONE,
        graphics=(fitz.PDF_REDACT_LINE_ART_REMOVE_IF_TOUCHED if text_only
                  else fitz.PDF_REDACT_LINE_ART_REMOVE_IF_COVERED))
    return out


def outside(rect, w, h):
    """The four rects that together cover everything but `rect`."""
    return [fitz.Rect(0, 0, w, rect.y0), fitz.Rect(0, rect.y1, w, h),
            fitz.Rect(0, rect.y0, rect.x0, rect.y1),
            fitz.Rect(rect.x1, rect.y0, w, rect.y1)]


def rebuild(doc, page_no, specs):
    """Insert a line per instance and re-place each tail on it."""
    source = doc[page_no - 1]
    w, h = source.rect.width, source.rect.height
    specs = sorted(specs, key=lambda s: s["cut"])
    cuts = [(s["cut"], s["lead"]) for s in specs]

    def shift_at(y):
        return sum(d for at, d in cuts if at <= y + 0.01)

    foot = PGH.footer_top(source, specs[0]["cut"], h)
    body_end = foot if foot is not None else h
    limit = PAS.usable_bottom(source, specs[0]["cut"])

    lowest = max([b[3] for b in source.get_text("blocks")
                  if b[6] == 0 and b[4].strip() and b[1] < body_end - 0.1] or [0])
    if lowest + shift_at(h) > limit + 0.01:
        raise ValueError("page %d would overflow: %.1f" % (page_no, lowest + shift_at(h)))

    # The tail is carried as its own strip, so it comes out of every band.
    #
    # The caption is **not** redacted, only re-drawn. It straddles the cut, so
    # the band edges delete it from both bands on their own -- and a redaction
    # of its own box would reach a point and a half into the line beneath it
    # and take glyphs out of the middle of a word with it. The first render of
    # this pass printed "re    ments of section 7.7"; the caption's box is
    # listed for `scrubbable` to reason about, and for nothing else.
    redrawn = [s["caption"] for s in specs]
    drops = [s["tail"] for s in specs]
    scrub(doc, page_no, [s["cut"] for s in specs], drops + redrawn)
    # A whiteout crossing a cut would survive whole in both bands (see
    # pei_answer_space.whiteouts_crossing) -- the same hazard, the same fix.
    for spec in specs:
        crossing = [d["rect"] for d in source.get_drawings()
                    if PAS.art_extent(d).y0 < spec["cut"] - 0.01 < PAS.art_extent(d).y1
                    and d["rect"].height > 0.01]
        if crossing:
            raise ValueError("cut %.2f still crosses art after scrubbing: %s"
                             % (spec["cut"], crossing))

    edges = [0.0] + [s["cut"] for s in specs] + [body_end]
    out = fitz.open()
    page = out.new_page(width=w, height=h)
    for lo, hi in zip(edges, edges[1:]):
        if hi - lo <= 0.01:
            continue
        piece = carve(doc, page_no,
                      [fitz.Rect(0, 0, w, lo), fitz.Rect(0, hi, w, h)] + drops)
        drop = shift_at(lo + 0.01) if lo > 0 else 0.0
        page.show_pdf_page(fitz.Rect(0, drop, w, h + drop), piece, 0)
        piece.close()
    if foot is not None:
        footer = carve(doc, page_no, [fitz.Rect(0, 0, w, foot)])
        page.show_pdf_page(fitz.Rect(0, 0, w, h), footer, 0)      # unshifted
        footer.close()

    for spec in specs:
        base = shift_at(spec["line_y0"])
        for key, dx, dy in (("comma", spec["comma_dx"], base),
                            ("rest", spec["rest_dx"], base + spec["lead"])):
            strip = carve(doc, page_no, outside(spec[key], w, h), text_only=True)
            page.show_pdf_page(fitz.Rect(dx, dy, w + dx, h + dy), strip, 0)
            strip.close()
        # The rule's extension only -- the rule itself rode across in its band.
        y = spec["rule_y"] + base
        page.draw_line(fitz.Point(spec["rule_x1"], y),
                       fitz.Point(spec["new_rule_x1"], y),
                       color=(0, 0, 0), width=spec["rule_width"])
        origin = spec["caption_origin"]
        page.insert_text(fitz.Point(origin[0], origin[1] + base), CAPTION,
                         fontsize=CAPTION_SIZE, fontname=CAPTION_FONT,
                         color=(0, 0, 0))

    doc.delete_page(page_no - 1)
    doc.insert_pdf(out, from_page=0, to_page=0,
                   start_at=page_no - 1, links=False, annots=False)
    out.close()
    return cuts


def apply(doc_id, out_dir, check):
    rows = [i for i in INSTANCES if i[0] == doc_id]
    pdf_in = os.path.join(EXPORT, "%s.pdf" % doc_id)
    json_in = os.path.join(EXPORT, "%s.json" % doc_id)
    doc = fitz.open(pdf_in)
    mapping = json.load(open(json_in))

    if load_shifts().get(doc_id):
        print("%-16s already reflowed, skipped" % doc_id)
        doc.close()
        return 0

    pages = sorted({r[1] for r in rows})
    specs = {}
    for page_no in pages:
        specs[page_no] = [measure(doc[page_no - 1], anchor)
                          for _d, p, anchor, _f in rows if p == page_no]
    if check:
        for page_no in pages:
            for spec in specs[page_no]:
                print("%-16s p%-2d rule %.1f -> %.1fpt, tail down %.2f"
                      % (doc_id, page_no, spec["rule_x1"] - spec["rule_x0"],
                         spec["new_rule_x1"] - spec["rule_x0"], spec["lead"]))
        doc.close()
        return len(rows)

    for page_no in pages:
        cuts = rebuild(doc, page_no, specs[page_no])
        for field in mapping["staticFields"]:
            if field["page"] == page_no:
                field["y"] = round(field["y"] + sum(
                    d for at, d in cuts if at <= field["y"] + 0.01), 2)
        # Same rounding correction the other two reflows make: the shift is
        # exact but the ink rides an XObject matrix, and re-extracted rule
        # extents land up to 0.07pt out -- enough for `pass_seat_flat` to see a
        # float on three of Form 70A's boxes. Run before the widened rule is
        # measured, and it only ever corrects the rounding scale.
        PGH.reseat(doc[page_no - 1],
                   [f for f in mapping["staticFields"] if f["page"] == page_no])
        record(doc_id, page_no, cuts)

    for _d, page_no, anchor, field_id in rows:
        spec = next(s for s in specs[page_no] if abs(s["line_y0"] - anchor) < 1.0)
        field = next(f for f in mapping["staticFields"] if f["id"] == field_id)
        field["width"] = round((spec["new_rule_x1"] - field["x"]) * SCALE, 2)
        print("%-16s p%-2d field %d widened to %.1fpt"
              % (doc_id, page_no, field_id, field["width"] / SCALE))

    target = out_dir or EXPORT
    os.makedirs(target, exist_ok=True)
    if target != EXPORT:
        for name in ("%s.pdf" % doc_id, "%s.json" % doc_id):
            if not os.path.exists(os.path.join(target, name)):
                shutil.copy(os.path.join(EXPORT, name), os.path.join(target, name))
    tmp = os.path.join(target, "%s.pdf.tmp" % doc_id)
    doc.save(tmp, deflate=True, garbage=3)
    doc.close()
    os.replace(tmp, os.path.join(target, "%s.pdf" % doc_id))
    with open(os.path.join(target, "%s.json" % doc_id), "w") as handle:
        json.dump(mapping, handle, indent=2)
    return len(rows)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--only")
    parser.add_argument("--out-dir")
    parser.add_argument("--check", action="store_true")
    args = parser.parse_args()
    total = 0
    for doc_id in sorted({i[0] for i in INSTANCES}):
        if args.only and doc_id != args.only:
            continue
        total += apply(doc_id, args.out_dir, args.check)
    print("%d instance(s) %s" % (total, "to reflow" if args.check else "reflowed"))
    return 0


if __name__ == "__main__":
    sys.exit(main())
