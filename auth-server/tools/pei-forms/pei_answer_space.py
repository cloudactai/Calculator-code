"""Make room where a PEI form asks for a written answer and gives it one line.

PEI's narrative prompts -- "set out in separate, consecutively numbered
paragraphs the material facts", "Particulars are as follows:", "If yes, provide
details." -- ship with an answer space of 13.3pt, 10pt, or nothing at all. Seven
of the batch's pleadings ask a party to plead their entire case in numbered
paragraphs and give them at most a single line; four give them no field
whatsoever.

**This revisits a documented decision, because its premise changed.**
`repair_pei_fields.pass_areas` looked at these same bands and deliberately
refused them:

    What the failures were really saying is that **PEI has far less blank paper
    than it looks like it has.** The gap under "If yes, provide details." on
    Form 70A page 7 measures 20.6pt -- one line of leading, not an answer space.
    ... Boxing 20pt of leading would not give anyone room to write; it would
    only put a control where the form has none.

That was right when nothing could add paper to a fixed-geometry PDF: a box is
only as useful as the space under it, and there was no space. `pei_general_heading`
then built the mechanism that changes the premise -- `band()`, `rebuild()`,
`page_lines()` redact a page into bands and re-place them with `show_pdf_page`,
so vector content is copied rather than re-typeset, and a tail that no longer
fits spills to a continuation page spliced in behind. Given that, the answer is
not to detect the blank paper that exists but to **make** the paper the prompt
is asking for. That machinery is reused here rather than reinvented.

**This pass adds no ink at all.** The background is only ever cut into bands and
re-placed lower; the answer space itself is empty paper carrying a `TextArea`,
which is the convention the rest of the batch already follows for an answer band
(`NARRATIVE_AREAS`, `pass_cells`, `pass_subcells` all place a field over paper
and let the app draw its own control). Nothing is scaled -- this batch has
refused that twice.

    python3 pei_answer_space.py --check
    python3 pei_answer_space.py --only PEISC_70E --out-dir /tmp/review

"""
import argparse
import json
import os
import shutil
import sys

import fitz

import pei_general_heading as PGH

HERE = os.path.dirname(os.path.abspath(__file__))
EXPORT = os.path.abspath(os.path.join(HERE, "..", "..", "form-template-export"))
SCALE = 1.5

PAD = 4.0                  # paper between the prompt and the box, and box to
                           # whatever follows -- the box is an answer area, not
                           # a rule flush against the text above it
LINE_HEIGHT = 13.3         # `repair_pei_fields`' own line, so a target height
                           # can be read as a number of writing lines
TICK_ROUNDING = 0.5        # the most an option square may be nudged as a
                           # rounding artefact rather than a real re-fit

# What each page was cut by, written at apply time and read by
# `tools/review/repair_pei_fields.py`, whose repair tables are absolute
# coordinates measured on the shipped page. Composed *after* the heading pass's
# own `heading_shifts.json`: an entry there is keyed to the pre-heading page,
# this one to the page as the heading pass left it.
SHIFTS = os.path.join(HERE, "answer_space_shifts.json")


def load_shifts():
    return json.load(open(SHIFTS)) if os.path.exists(SHIFTS) else {}


def entries_for(doc_id):
    return load_shifts().get(doc_id, [])


def shifted(doc_id, page_no, y):
    """Move one y from the pre-answer-space page onto the shipped page.

    `page_no`/`y` are what the page looked like *after* the general-heading
    pass and before this one, which is the order `repair_pei_fields` composes
    the two translations in.
    """
    for entry in entries_for(doc_id):
        if entry["page"] != page_no:
            continue
        if entry.get("split") is not None and y >= entry["split"] - 0.01:
            return round(y + entry["shift2"], 2)
        return round(y + sum(d for at, d in entry["cuts"] if at <= y + 0.01), 2)
    return y


def page_for(doc_id, page_no, y):
    """The page a measured (page_no, y) now lives on, after the cuts and spills.

    A continuation is spliced in directly behind the page it spilled from, the
    same convention `pei_general_heading.rebuild` follows and for the same
    reason: the spilled tail is the direct continuation of that page, so a
    reader has to meet it before whatever used to come next.
    """
    offset = 0
    for entry in entries_for(doc_id):
        if entry["page"] < page_no:
            if entry.get("contPage") is not None:
                offset += 1
        elif entry["page"] == page_no:
            if entry.get("split") is not None and y >= entry["split"] - 0.01:
                return page_no + offset + 1
    return page_no + offset


def record(doc_id, page_no, cuts, spill):
    shifts = load_shifts()
    entry = {"page": page_no, "cuts": [[round(a, 2), round(d, 2)] for a, d in cuts]}
    if spill:
        split_y, shift2, cont_page = spill
        entry["split"] = round(split_y, 2)
        entry["shift2"] = round(shift2, 2)
        entry["contPage"] = cont_page
    rows = [e for e in shifts.get(doc_id, []) if e["page"] != page_no]
    rows.append(entry)
    rows.sort(key=lambda e: e["page"])
    shifts[doc_id] = rows
    with open(SHIFTS, "w") as handle:
        json.dump(shifts, handle, indent=2, sort_keys=True)


def text_lines(page):
    """Every non-blank text line as (y0, y1). Line-level, not block-level.

    A cut is only safe between *lines*: `band()` redacts, and a redaction
    removes any text it intersects, so a line of type straddling the cut would
    be deleted from the band above it and from the band below it both -- the
    content would simply be gone. Block bboxes are too coarse to prove that,
    since PyMuPDF folds unrelated paragraphs into one block wherever they sit
    close together (the reason `pei_general_heading.page_lines` exists).
    """
    out = []
    for block in page.get_text("dict")["blocks"]:
        for line in block.get("lines", []):
            if "".join(s["text"] for s in line["spans"]).strip():
                out.append((line["bbox"][1], line["bbox"][3]))
    return out


def art_extent(drawing):
    """A drawing's inked extent, not its path box.

    `get_drawings` reports the path, but a stroke is centred on it, so a rect
    stroked at 1pt inks half a point past every edge -- and it is the *inked*
    extent a redaction tests when deciding whether it covers the art. Form
    70E's whiteout begins exactly on its own spill split: by the path box it
    sits wholly inside the band below, by its stroke it reaches back into the
    band above, so the redaction kept it in both and it printed twice. Only a
    drawing census showed it; nothing on the page looks different, because the
    rectangle is white on white.
    """
    rect = fitz.Rect(drawing["rect"])
    if drawing.get("type") in ("s", "fs"):
        pad = (drawing.get("width") or 0.0) / 2.0
        rect = fitz.Rect(rect.x0 - pad, rect.y0 - pad, rect.x1 + pad, rect.y1 + pad)
    return rect


def whiteouts_crossing(page, at):
    """White-on-white rectangles straddling `at`, with nothing printed in them.

    LibreOffice leaves these behind all over this batch -- a rect filled and
    stroked pure white, sitting over blank paper, doing nothing a reader can
    see. They matter only here: a band cut through one duplicates it (the
    redaction keeps art it does not wholly cover), and the copy carried into
    the lower band paints white over whatever it lands on. Form 70D's cut has
    one 30pt wide at the left margin and Form 70G's one 26pt wide, and both sit
    exactly where the answer space has to start.

    Returned only when no glyph has the majority of its box inside -- a white
    rect that *is* covering something is hiding it on purpose, and removing it
    would put erased text back on the page.
    """
    out = []
    words = [w for w in page.get_text("words") if w[4].strip()]
    for drawing in page.get_drawings():
        rect = drawing["rect"]
        inked = art_extent(drawing)
        if not (inked.y0 < at - 0.01 < inked.y1) or rect.height <= 0.01:
            continue
        if drawing.get("fill") != (1.0, 1.0, 1.0) or drawing.get("color") != (1.0, 1.0, 1.0):
            continue
        covered = False
        for x0, y0, x1, y1, *_rest in words:
            box = fitz.Rect(x0, y0, x1, y1)
            overlap = box & rect
            if overlap.get_area() > 0.5 * box.get_area():
                covered = True
                break
        if not covered:
            out.append(rect)
    return out


def scrub_whiteouts(doc, page_no, cuts):
    """Drop the invisible rects a cut would otherwise duplicate.

    Text is explicitly preserved (`PDF_REDACT_TEXT_NONE`): Form 70G's rect
    overlaps the top half-point of its own "(Date)" caption, and a redaction
    that took text as well would delete the caption to remove a rectangle that
    was never covering it.

    The redaction is a hairline band on the cut itself rather than the rect's
    own area, so it takes exactly the art that crosses the cut and leaves the
    rest alone -- Form 70G stacks a second whiteout just below the first, that
    one genuinely sitting under its "(Date)" caption, and a redaction over the
    first rect's box would have swept up the second with it.
    """
    page = doc[page_no - 1]
    removed = 0
    for at, _delta in cuts:
        expected = whiteouts_crossing(page, at)
        if not expected:
            continue
        near = [d["rect"] for d in page.get_drawings()
                if art_extent(d).y0 - 0.05 <= at <= art_extent(d).y1 + 0.05]
        unexpected = [r for r in near if not any(r == e for e in expected)]
        if unexpected:
            raise ValueError("cut %.2f would also take %s" % (at, unexpected))
        page.add_redact_annot(fitz.Rect(0, at - 0.01, page.rect.width, at + 0.01))
        removed += len(expected)
    if removed:
        page.apply_redactions(images=fitz.PDF_REDACT_IMAGE_NONE,
                              graphics=fitz.PDF_REDACT_LINE_ART_REMOVE_IF_TOUCHED,
                              text=fitz.PDF_REDACT_TEXT_NONE)
    return removed


def validate_cut(page, mapping, page_no, at):
    """Refuse a cut that would slice type, line art, or a field.

    Three separate failure modes, each of which produces a page that looks
    plausible in the field table and wrong on the render:

    * **type** -- redacted out of both bands, so the line vanishes;
    * **line art** -- `PDF_REDACT_LINE_ART_REMOVE_IF_COVERED` drops a stroke
      only when the redaction *covers* it, so a rule spanning the cut survives
      whole in both bands and prints twice, once at the wrong offset. This is
      the duplication that only a render shows;
    * **a field** -- its top and bottom would shift by different amounts and
      the box would silently grow by the delta.
    """
    problems = []
    for y0, y1 in text_lines(page):
        if y0 < at - 0.01 < y1:
            problems.append("text line %.2f-%.2f" % (y0, y1))
    scrubbable = whiteouts_crossing(page, at)
    for drawing in page.get_drawings():
        inked = art_extent(drawing)
        if inked.y0 < at - 0.01 < inked.y1 and drawing["rect"].height > 0.01:
            # Identity is the path box, which is what `whiteouts_crossing`
            # returns; the inked extent is only what decides whether the
            # boundary is crossed at all.
            if any(drawing["rect"] == s for s in scrubbable):
                continue          # invisible and empty: `scrub_whiteouts` takes it
            problems.append("line art %.2f-%.2f" % (inked.y0, inked.y1))
    for field in mapping["staticFields"]:
        if field["page"] != page_no:
            continue
        bottom = field["y"] + field["height"] / SCALE
        if field["y"] < at - 0.01 < bottom:
            problems.append("field %d %.2f-%.2f" % (field["id"], field["y"], bottom))
    if problems:
        raise ValueError("cut at %.2f is not in clear paper: %s"
                         % (at, "; ".join(problems)))


def usable_bottom(page, cut):
    """The lowest y a box or a shifted block may reach on this page.

    The sheet's own bottom margin, except where a page-number footer sits
    higher: the footer does not move (it is the sheet's numbering, not flowing
    content), so real content -- and an answer box, which is why this is shared
    with `apply` rather than living inside `rebuild` -- has to stop above it.
    The first render of Form 70E printed its "1" inside the answer box.
    """
    h = page.rect.height
    foot = PGH.footer_top(page, cut, h)
    limit = h - PGH.MARGIN_BOTTOM
    if foot is not None:
        limit = min(limit, foot - PGH.GAP)
    return limit


def refit_ticks(doc_id, mapping, doc, pages):
    """Re-fit option squares this pass moved, to the rounding scale only.

    `reseat` handles a text box that sits on a rule; an option square has no
    rule, so `pass_fit_ticks` sizes it to the ink inside its own glyph cell
    instead, and that ink is rasterised -- so a square carried onto a
    continuation page by an XObject matrix measures 0.09pt from where the
    arithmetic put it. Two of Form 70A*'s squares do exactly that.

    Only moves below `TICK_ROUNDING` are taken, and only on the pages this pass
    rebuilt. Anything larger is a real fit this pass does not own: the batch
    was already carrying eleven of those before this work, and quietly
    absorbing them here would hide them in a diff about answer space.
    """
    sys.path.insert(0, os.path.join(os.path.dirname(HERE), "review"))
    from repair_pei_fields import pass_fit_ticks  # noqa: E402  (late: cycle)

    fixed = 0
    by_id = {f["id"]: f for f in mapping["staticFields"]}
    for field_id, target in pass_fit_ticks(doc_id, mapping, doc, set()).items():
        field = by_id.get(field_id)
        if field is None or field["page"] not in pages:
            continue
        if any(abs(target[key] - field[key]) >= TICK_ROUNDING for key in target):
            continue
        field.update(target)
        fixed += 1
    return fixed


def rebuild(doc, page_no, cuts, page_fields):
    """Rebuild the page with `cuts` worth of blank paper inserted.

    `cuts` is [(at_y, delta), ...] sorted by y: every band takes the running
    sum of the deltas above it, so one rebuild serves a page that needs room in
    several places at once (Form 70A page 7 asks six questions and answers none
    of them). Returns the spill, `None` or `(split_y, shift2, cont_page)`.

    The split is taken at a block boundary, never inside a paragraph, and is
    also tested against the (y0, y1) of every field on the page: a field can
    run past its own paragraph's reported box, and a split that clears the
    paragraph but not the field leaves a field straddling it.
    """
    source = doc[page_no - 1]
    w, h = source.rect.width, source.rect.height
    first = cuts[0][0]

    # A page-number footer is the sheet's own numbering, not flowing content:
    # it stays where it is, and everything else is measured as if it were not
    # there. Shifting it would walk it off the page on a form whose body ends
    # well above it.
    foot = PGH.footer_top(source, first, h)
    body_end = foot if foot is not None else h

    def shift_at(y):
        return sum(d for at, d in cuts if at <= y + 0.01)

    total = shift_at(h)
    limit = usable_bottom(source, first)

    # Merged into non-overlapping spans before testing: a row of side-by-side
    # columns shares a y-range without overlapping, and testing each separately
    # walks the split forward through the row instead of moving it as one unit.
    spans = sorted({(b[1], b[3]) for b in source.get_text("blocks")
                    if b[6] == 0 and b[4].strip()
                    and first - 0.1 <= b[1] < body_end - 0.1}
                   | {(y0, y1) for y0, y1 in page_fields
                      if first - 0.1 <= y0 < body_end - 0.1})
    merged = []
    for y0, y1 in spans:
        if merged and y0 <= merged[-1][1] + 0.1:
            merged[-1] = (merged[-1][0], max(merged[-1][1], y1))
        else:
            merged.append((y0, y1))
    # **The split is a band edge too, and it is chosen rather than validated.**
    # A cut is refused if any art crosses it (`validate_cut`), but the split
    # falls wherever the first overflowing block starts and line art crosses
    # that freely. `band()` keeps art it does not wholly cover, so a rectangle
    # straddling the split survives whole in the band above it *and* in the
    # tail -- Form 70E's invisible whiteout at 305.70 printed three times, once
    # per band, and only a drawing census showed it.
    #
    # So the first overflowing boundary is a starting point, not the answer:
    # from there the search walks *back* through the earlier boundaries for one
    # nothing crosses. Back, not forward -- an earlier split moves more onto
    # the continuation, which is always safe, where a later one is the overflow
    # this is trying to avoid. Form 70D needs it: its natural split at 317.58
    # runs through a whiteout that genuinely sits under its own "Name:"
    # caption, so that rectangle cannot be scrubbed the way a cut's can.
    def unscrubbable(y):
        scrubbable = whiteouts_crossing(source, y)
        return [d["rect"] for d in source.get_drawings()
                if art_extent(d).y0 < y - 0.01 < art_extent(d).y1
                and d["rect"].height > 0.01
                and not any(d["rect"] == s for s in scrubbable)]

    overflow = next((i for i, (y0, y1) in enumerate(merged)
                     if y1 + shift_at(y0) > limit + 0.01), None)
    split_y = None
    if overflow is not None:
        # The last cut is the final fallback: the paper between it and the
        # first block below it is blank by construction, and the cut has
        # already been proved clear, so splitting there is always available and
        # simply means "everything below this prompt moves". Form 70D needs
        # exactly that -- its one block boundary is fouled and its prompt was
        # asking for the rest of the page anyway.
        floor = cuts[-1][0]
        tries = [merged[i][0] for i in range(overflow, -1, -1)
                 if merged[i][0] > floor + 0.01] + [floor]
        split_y = next((c for c in tries if not unscrubbable(c)), None)
        if split_y is None:
            raise ValueError("no clean spill split at or below %.2f on page %d"
                             % (floor, page_no))
        scrub_whiteouts(doc, page_no, [(split_y, 0.0)])

    # Bands: [0, cut0), [cut0, cut1), ... each dropped by its own running sum,
    # then the tail, then the footer left where it was. A band under a point
    # tall is the sliver between the last cut and a split that follows it
    # closely; it is blank paper by construction and only ever picked up art
    # that overlapped it by a fraction of a point.
    edges = [0.0] + [at for at, _d in cuts] + [split_y if split_y is not None else body_end]
    out = fitz.open()
    page = out.new_page(width=w, height=h)
    for lo, hi in zip(edges, edges[1:]):
        if hi - lo <= 1.0:
            continue
        drop = shift_at(lo + 0.01) if lo > 0 else 0.0
        piece = PGH.band(doc, page_no, fitz.Rect(0, lo, w, hi))
        page.show_pdf_page(fitz.Rect(0, drop, w, h + drop), piece, 0)
        piece.close()
    if foot is not None:
        footer = PGH.band(doc, page_no, fitz.Rect(0, foot, w, h))
        page.show_pdf_page(fitz.Rect(0, 0, w, h), footer, 0)      # unshifted
        footer.close()

    bottom = max((b[3] for b in page.get_text("blocks") if b[6] == 0 and b[4].strip()),
                 default=0)
    if bottom > h - PGH.MARGIN_BOTTOM + 0.01:
        raise ValueError("page %d overflows its bottom margin: %.1f" % (page_no, bottom))

    cont_doc, shift2 = None, None
    if split_y is not None:
        tail = PGH.band(doc, page_no, fitz.Rect(0, split_y, w, body_end))
        shift2 = round(PGH.PAGE_TOP - split_y, 2)
        cont_doc = fitz.open()
        cont_page = cont_doc.new_page(width=w, height=h)
        cont_page.show_pdf_page(fitz.Rect(0, shift2, w, h + shift2), tail, 0)
        tail.close()
        tail_bottom = max((b[3] for b in cont_page.get_text("blocks")
                           if b[6] == 0 and b[4].strip()), default=0)
        if tail_bottom > h - PGH.MARGIN_BOTTOM + 0.01:
            raise ValueError("continuation page overflows: %.1f" % tail_bottom)

    doc.delete_page(page_no - 1)
    doc.insert_pdf(out, from_page=0, to_page=0,
                   start_at=page_no - 1, links=False, annots=False)
    out.close()

    spill = None
    if cont_doc is not None:
        doc.insert_pdf(cont_doc, from_page=0, to_page=0,
                       start_at=page_no, links=False, annots=False)
        cont_doc.close()
        spill = (split_y, shift2, page_no + 1)
    return spill, total


def shift_fields(mapping, page_no, cuts, spill):
    """Move every field on the page by its own band's constant."""
    split_y, shift2, cont_page_no = spill if spill else (None, None, None)
    for field in mapping["staticFields"]:
        if field["page"] != page_no:
            # A continuation is spliced in right behind `page_no`, so every
            # field already on a later page moves back one to make room.
            if spill and field["page"] > page_no:
                field["page"] += 1
            continue
        y0 = field["y"]
        y1 = y0 + field["height"] / SCALE
        if split_y is not None and y0 >= split_y - 0.01:
            field["page"] = cont_page_no
            field["y"] = round(y0 + shift2, 2)
            continue
        if split_y is not None and y1 > split_y + 0.01:
            raise ValueError("a field straddles the spill split")
        field["y"] = round(y0 + sum(d for at, d in cuts if at <= y0 + 0.01), 2)


def grow_field(mapping, field_id, x0, x1, bottom):
    """Stretch a prompt's existing one-line rule down into the new paper.

    Where a prompt already carries a field -- 70A's items 29 and 30 each have a
    13.3pt box sitting on a printed rule -- the room made below it belongs to
    that same answer, so the field is stretched into it rather than a second
    control being added underneath. Two boxes for one question is worse than a
    printed rule showing through the top of one, which is what `NARRATIVE_AREAS`
    already accepts wherever its bands cross printed paper.

    The type changes with the size: a `TextField` renders as one line however
    tall its rect is, so a grown box has to become a `TextArea` or the extra
    room is not reachable.
    """
    field = next(f for f in mapping["staticFields"] if f["id"] == field_id)
    if x0 is not None:
        field["x"] = round(x0, 2)
        field["width"] = round((x1 - x0) * SCALE, 2)
    field["height"] = round((bottom - field["y"]) * SCALE, 2)
    field["type"] = "TextArea"


def add_fields(mapping, page_no, boxes):
    base = max(f["id"] for f in mapping["staticFields"])
    for offset, (x0, y0, x1, y1) in enumerate(boxes, start=1):
        mapping["staticFields"].append({
            "id": base + offset,
            "type": "TextArea",
            "x": round(x0, 2),
            "y": round(y0, 2),
            "width": round((x1 - x0) * SCALE, 2),
            "height": round((y1 - y0) * SCALE, 2),
            "value": "",
            "fontSize": 9,
            "color": [0, 0, 0],
            "background": "none",
            "border": "none",
            "page": page_no,
        })


# ---------------------------------------------------------------------------
# The plan, measured off the shipped pages rather than estimated.
#
# Each entry is (at, height, x0, x1, note):
#   at      the cut, in clear paper right below the prompt it answers
#   height  paper inserted there; the box is that less `PAD` top and bottom
#   x0/x1   the box's own column, read from the prompt's indent and the page's
#           own right margin
#
# Sizing follows the prompt's own wording, not the size of the gap it was
# given: a prompt that says "in separate, consecutively numbered paragraphs"
# is asking for a third to half a page, one that says "if yes, provide
# details" is asking for a few lines. LINE_HEIGHT is 13.3, so 40pt is three
# writing lines and 300pt is twenty-two.
PLAN = {
    # -- Form 70E, Reply. Item 4 is the whole pleading and shipped with no
    # field at all. Everything below the cut is the date/signature/TO block,
    # which spills to its own page so the reply gets the rest of this one.
    # ---- the seven pleadings -------------------------------------------
    # Every one of these says "set out in separate, consecutively numbered
    # paragraphs", which is a request for a third to half a page, and every one
    # of them shipped with 13.3pt or nothing. `None` gives the prompt the rest
    # of its page and sends the date/signature/service block -- which is all
    # that follows it -- to a continuation.
    ("PEISC_70B", 2): [
        (212.12, None, 108.1, 506.6, "counterpetition, relief claimed"),
    ],
    ("PEISC_70B_JOINT", 1): [
        (284.42, None, 90.1, 524.7, "counterpetition, relief claimed"),
    ],
    ("PEISC_70D", 1): [
        (305.47, None, 108.1, 506.6, "item 4, answer -- numbered paragraphs"),
    ],
    ("PEISC_70E", 1): [
        (305.47, None, 108.1, 504.1, "item 4, reply -- numbered paragraphs"),
    ],
    ("PEISC_70A", 6): [
        (487.03, None, 108.1, 506.6, "item 35, grounds for relief"),
    ],

    # The last two pleadings are sized instead of given the rest of the page.
    # Both are short forms whose prompt sits low and whose tail -- date, name,
    # address, phone, and the TO: block -- is all that follows: `None` bought
    # them 17 and 21 writing lines and paid a whole extra sheet for it, a sheet
    # carrying nothing but that tail. The height here is what the page has
    # under the tail instead (136.40 and 194.15 of clear paper), rounded down,
    # so the box stops just above the block and the form stays one page. The
    # loss is 17 -> 10 and 21 -> 15 lines, which still answers the prompt; the
    # five above keep `None` because their tails are longer and their prompts
    # sit higher, so sizing them would cost far more than a page is worth.
    ("PEISC_70F", 1): [
        (442.50, 136.0, 108.1, 506.6, "item 4, answer to counterpetition"),
    ],
    ("PEISC_70G", 1): [
        (389.62, 194.0, 108.1, 506.6, "item 4, reply to answer to counterpetition"),
    ],

    # ---- Form 70A, the petition ----------------------------------------
    # Adultery and cruelty are the two grounds a petitioner has to particularise
    # and the only two of the three that shipped with nowhere to do it (the
    # separation ground already carries its cohabitation-dates box). Five lines
    # each; the tail that leaves is "Information about the respondent", a whole
    # section, so the break falls where the form itself already breaks.
    ("PEISC_70A", 2): [
        (236.35, 66.0, 122.5, 506.6, "item 2, adultery particulars"),
        (288.32, 66.0, 122.5, 506.6, "item 2, cruelty particulars"),
    ],
    # 29 and 30 already have a rule and a one-line box, so these grow rather
    # than add. 29pt each is what page 4 can hold without spilling, and takes
    # both from one line to three and a half.
    ("PEISC_70A", 4): [
        (366.58, 29.0, None, None, "item 29, best-interests reasons", 1750805871089),
        (401.23, 29.0, None, None, "item 30, material changes", 1750805871090),
    ],
    # One answer area per numbered item rather than per lettered sub-question:
    # (a)/(b)/(c) are facets of one disclosure, and the gaps between them are
    # 0.48pt, which is leading rather than a place to cut.
    ("PEISC_70A", 7): [
        (166.93, 53.0, 122.5, 506.6, "item 37, family law proceedings"),
        (282.43, 53.0, 122.5, 506.6, "item 38, criminal proceedings"),
        (340.18, 53.0, 122.5, 506.6, "item 39, child protection"),
        (409.48, 53.0, 122.5, 506.6, "item 40, civil protection"),
    ],
    ("PEISC_70A", 8): [
        (272.52, 53.0, 122.5, 506.6, "item 46, lawyer's s.7.7 circumstances"),
    ],

    # ---- Form 70A*, the joint petition ---------------------------------
    # The same petition, so the same prompts get the same treatment; leaving
    # the joint form behind would make the pair inconsistent.
    ("PEISC_70A_JOINT", 1): [
        (536.89, 40.0, 144.1, 496.0, "item 4, efforts to reconcile",
         1750047614005),
    ],
    ("PEISC_70A_JOINT", 3): [
        (459.31, 29.0, None, None, "item 29, best-interests reasons", 1750047614080),
        (490.46, 29.0, None, None, "item 30, material changes", 1750047614081),
    ],
    ("PEISC_70A_JOINT", 5): [
        (317.91, 40.0, 162.1, 503.5, "item 36, family law proceedings"),
        (384.21, 40.0, 162.1, 503.5, "item 37, criminal proceedings"),
        (428.41, 40.0, 162.1, 503.5, "item 38, child protection"),
        (472.53, 40.0, 162.1, 503.5, "item 39, civil protection"),
    ],
    ("PEISC_70A_JOINT", 6): [
        (364.01, 53.0, 151.3, 503.7, "item 42(a), lawyer for Spouse One"),
        (525.66, 53.0, 158.5, 506.6, "item 43(a), lawyer for Spouse Two"),
    ],

    # ---- the two motion-for-judgment affidavits ------------------------
    # Three "(Give particulars.)" prompts each, none with a field. The affiant
    # uses either the first item 1 or the second, so both are given room rather
    # than guessing which. Both pages are two-thirds empty, so nothing spills.
    ("PEISC_70P", 1): [
        (275.46, 53.0, 144.1, 506.6, "item 1, no possibility of reconciliation"),
        (310.11, 53.0, 144.1, 506.6, "item 1 (alternative), not appropriate"),
        (333.21, 53.0, 144.1, 506.6, "item 2, exceptions"),
    ],
    ("PEISC_70Q", 1): [
        (275.46, 53.0, 144.1, 506.6, "item 1, no possibility of reconciliation"),
        (310.11, 53.0, 144.1, 506.6, "item 1 (alternative), not appropriate"),
        (333.21, 53.0, 144.1, 506.6, "item 2, exceptions"),
    ],

    ("PEISC_71E", 1): [
        (423.78, 53.0, 108.1, 506.6, "documents and things to be produced"),
    ],
}

# Boxes added on paper a spill freed, keyed to the page number *after* this
# pass has run. A prompt carried onto a continuation page lands near its top
# with the rest of the sheet empty under it -- room it already has and simply
# has no field for -- and a cut cannot reach it, because a cut places its box
# on the page it was taken from. Measured off the reflowed render, so these are
# read literally and never translated.
#   (docId, page): [(x0, y0, x1, y1, note), ...]
EXTRA_BOXES = {
    # Form 71E's affidavit-evidence prompt -- "(specify evidence to be given,
    # questions to be answered or material to be attached as exhibits)" -- has
    # no field of its own anywhere on the form, and the cut above it has just
    # carried it onto a sheet that is otherwise empty. So the room is already
    # there and only a box is missing; no second cut is needed.
    #
    # It is placed *below* the rule at 128.08, which is not this prompt's
    # answer space: `repair_pei_fields.NORMAL_DATE_FIELDS` names that field
    # (1750796887018) a normal date and caps it at `DATE_MAX`. It sits 12pt
    # clear of the paragraph as a standalone rule, and a previous review looked
    # at it and called it a date; growing it into this prompt's answer would
    # overturn that decision on no evidence.
    ("PEISC_71E", 2): [
        (108.1, 145.0, 506.6, 305.0, "affidavit evidence to be specified"),
    ],
}
# ---------------------------------------------------------------------------


def apply(doc_id, out_dir, check):
    pages = sorted({p for (d, p) in PLAN if d == doc_id})
    if not pages and not any(d == doc_id for d, _p in EXTRA_BOXES):
        return 0
    pdf_in = os.path.join(EXPORT, "%s.pdf" % doc_id)
    json_in = os.path.join(EXPORT, "%s.json" % doc_id)
    doc = fitz.open(pdf_in)
    mapping = json.load(open(json_in))

    if entries_for(doc_id):
        print("%-16s already spaced, skipped" % doc_id)
        doc.close()
        return 0

    if check:
        for page_no in pages:
            for row in PLAN[(doc_id, page_no)]:
                validate_cut(doc[page_no - 1], mapping, page_no, row[0])
        print("%-16s would space: pages %s"
              % (doc_id, ", ".join(str(p) for p in pages)))
        doc.close()
        return 1

    # Bottom page up, so a page number recorded in the plan still means the
    # page the measurement was taken on: a spill on an earlier page renumbers
    # every later one, and doing the later pages first sidesteps that entirely.
    added = 0
    for page_no in sorted(pages, reverse=True):
        rows = sorted(PLAN[(doc_id, page_no)], key=lambda r: r[0])
        page = doc[page_no - 1]
        for row in rows:
            validate_cut(page, mapping, page_no, row[0])
        # `height` None means "this prompt gets the rest of the page": the
        # delta is whatever paper is left below the cut, which is also what
        # pushes every following block onto the continuation.
        limit = usable_bottom(page, rows[0][0])
        cuts = [(row[0], limit - row[0] if row[1] is None else row[1])
                for row in rows]
        page_fields = [(f["y"], f["y"] + f["height"] / SCALE)
                       for f in mapping["staticFields"] if f["page"] == page_no]
        scrub_whiteouts(doc, page_no, cuts)
        spill, _total = rebuild(doc, page_no, cuts, page_fields)
        shift_fields(mapping, page_no, cuts, spill)

        # The shift is exact at two decimals, but the ink rides an XObject
        # matrix and re-extracted rule extents round differently -- 0.04pt on
        # the fields Form 70E carries onto its continuation, enough for
        # `pass_seat_flat` to see a float. `reseat` corrects that rounding
        # scale only, with that pass's own `rule_under`, and is run before this
        # pass's own boxes exist: they sit on blank paper with no rule under
        # them and are not seating candidates.
        PGH.reseat(doc[page_no - 1],
                   [f for f in mapping["staticFields"] if f["page"] == page_no])
        if spill:
            PGH.reseat(doc[spill[2] - 1],
                       [f for f in mapping["staticFields"] if f["page"] == spill[2]])
        refit_ticks(doc_id, mapping, doc,
                    {page_no} | ({spill[2]} if spill else set()))

        boxes = []
        for row, (_a, delta) in zip(rows, cuts):
            at, _height, x0, x1, _note = row[:5]
            grow = row[5] if len(row) > 5 else None
            drop = sum(d for a, d in cuts if a < at - 0.01)
            # Strictly past, not at: a split taken *on* the last cut is the
            # "everything below this prompt moves" case, and the box then sits
            # in the paper that freed, on the page its prompt is still on.
            if spill and at > spill[0] + 0.01:
                raise ValueError("an answer box landed past its own page's split")
            top = at + drop + PAD
            # Clamped, not trusted: a box sized past the footer prints over the
            # page number, which is what the first 70E render showed.
            bottom = min(at + drop + delta - PAD, limit)
            if grow is not None:
                grow_field(mapping, grow, x0, x1, bottom)
                continue
            if bottom - top < LINE_HEIGHT:
                raise ValueError("answer box at %.1f is under one line tall" % at)
            boxes.append((x0, top, x1, bottom))
        add_fields(mapping, page_no, boxes)
        added += len(rows)
        record(doc_id, page_no, cuts, spill)
        note = ", spilled onto page %d" % spill[2] if spill else ""
        print("%-16s p%-2d +%d box(es), +%.1fpt%s"
              % (doc_id, page_no, len(rows), sum(c[1] for c in cuts), note))

    # Last, on final page numbers: these name paper a spill above them already
    # freed, so they are only meaningful once every cut on the document is in.
    for (did, page_no), rows in sorted(EXTRA_BOXES.items()):
        if did != doc_id:
            continue
        if page_no > doc.page_count:
            raise ValueError("%s has no page %d for an extra box" % (did, page_no))
        boxes = [(x0, y0, x1, y1) for x0, y0, x1, y1, _note in rows]
        for x0, y0, x1, y1 in boxes:
            if y1 > doc[page_no - 1].rect.height - PGH.MARGIN_BOTTOM + 0.01:
                raise ValueError("extra box on %s p%d runs past the margin"
                                 % (did, page_no))
        add_fields(mapping, page_no, boxes)
        added += len(boxes)
        print("%-16s p%-2d +%d box(es) on spilled paper" % (doc_id, page_no, len(boxes)))

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
    return added


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--only")
    parser.add_argument("--out-dir")
    parser.add_argument("--check", action="store_true")
    args = parser.parse_args()
    total = 0
    for doc_id in sorted({d for (d, _p) in PLAN} | {d for (d, _p) in EXTRA_BOXES}):
        if args.only and doc_id != args.only:
            continue
        total += apply(doc_id, args.out_dir, args.check)
    print("%d %s" % (total, "form(s) to change" if args.check else "box(es) added"))
    return 0


if __name__ == "__main__":
    sys.exit(main())
