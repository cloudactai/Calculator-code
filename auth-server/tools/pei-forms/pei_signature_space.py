"""Give Spouse Two's signature line back the paper Spouse One's caption took.

Form 70A*(JOINT) page 8 stacks two identical signature blocks: a Date rule and
a signature rule, then a contact block for that spouse's lawyer, then the next
spouse's Date and signature rules underneath. On the published form each block
captions its contact lines with two 11pt lines of bracketed italic and leaves
**23.88pt** of clear paper before the next spouse's signature rule.

`review/pei_caption_lines.py` replaced that caption with what the rest of the
batch uses -- four labelled writing rules (Name:/Address:/Phone:/Email:) with
the caption re-set small underneath -- and opened the page by 12.39pt to fit
it. The block it drew is taller than that: Spouse One's caption now ends
**0.94pt** above Spouse Two's signature rule, so on screen the rule reads as an
underline on the caption and Spouse Two's signature line has no space of its
own. (Spouse Two's block does the same thing to the STATEMENT OF LAWYER
heading below it, with 0.92pt between them, and its own cells interleave the
same way. That one is a heading rather than a writing line -- nobody is being
asked to sign on it -- so it is recorded here and left alone.)

**The page cannot be re-banded, which is why this is its own pass.** Every
reflow in this batch -- `pei_general_heading.rebuild`, `pei_answer_space`,
`pei_caption_lines` -- cuts a page into full-width horizontal bands and
re-places them, and a band is redacted rather than clipped so the moved page
holds exactly what it prints. That needs a cut no character cell straddles,
and there is none here: the caption's second line ("Spouse One)") sits in a
203.27-210.11 cell, and Spouse Two's underscore rule -- whose *ink* is a clean
0.94pt lower -- is set on an 11pt line whose cell runs 200.18-211.25 and so
contains the caption's outright. No rectangle separates them, in y or in x.

So the two bands are cut to overlap, each is redacted down to the block it
owns, and the shared line is redacted out of both and put back afterwards:

* the **upper** band keeps everything down to the bottom of that line and
  redacts the line itself away, which takes the caption with it;
* the **lower** band starts above the line and redacts the right-hand run
  away, which takes the caption's orphaned second line with it.

The upper band is placed 22.94pt higher, which is the printed gap less the
0.94pt already there, and lands the block's first ink at 114.3 -- the top
margin this document's other full pages use. The lower band does not move, so
nothing below Spouse Two's Date rule changes at all: no other page is touched
and the sheet's own page number stays where it is.

Two pieces of ink are therefore restored onto the rebuilt page. The caption is
re-set from the characters it was read off, line by line at their own baselines
less the lift, in the face and size `pei_caption_lines` drew it in -- it was
that pass's own ink to begin with. It is written *before* the bands, which is
not cosmetic: written after them PyMuPDF folds the base-14 face into the one
inside the band's XObject and the line comes back with no font name and its
apostrophe re-coded, so the page stops extracting the words it was read off. Spouse Two's right-hand signature rule is
redrawn as a stroke across the extent its underscores rasterise to, measured
before the rebuild; `repair_pei_fields.strokes` reads a drawn rule exactly as
`underscore_runs` reads a printed one, so it stays a rule to every later pass,
and its Date rule on the left is untouched glyphs.

(Redaction is what forces the round trip rather than a nicety: PyMuPDF drops a
character whose cell the redaction rectangle meaningfully overlaps, and there is
no rectangle that overlaps the run's cell without overlapping the caption's,
because the caption's cell is wholly inside it. Measured on this page, a strip
taken in the 1.14pt below the caption's cell and inside the run's removes
neither.)

    python3 pei_signature_space.py --check
    python3 pei_signature_space.py
"""
import argparse
import json
import os
import sys

import fitz

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
sys.path.insert(0, os.path.join(HERE, "..", "review"))
import pei_general_heading as PGH                               # noqa: E402
import repair_pei_fields as R                                   # noqa: E402

EXPORT = PGH.EXPORT
SCALE = PGH.SCALE

# Round 11 (`pei_repaginate.py`) absorbed this form's old page 5 into page 4,
# which pushed every later page back by one -- the Statement of Lawyer block
# this pass already fixed moved from page 8 to page 7 along with it. This
# module is not wired into `repair_pei_fields._translate` (see the README's
# eleventh pass), so nothing translates the number automatically; it is
# corrected here by hand, the same one-time fix `signature_space_shifts.json`
# needed.
DOC_ID = "PEISC_70A_JOINT"
PAGE_NO = 7

# The clear paper the published form leaves between a signature block's caption
# and the next block's signature rule, measured ink-to-ink on
# `_incoming_pei/PEISC_70A_JOINT_source.pdf` page 6: caption bottom 174.48,
# rule top 198.36. Written down rather than read at run time because the
# staging directory is not in the repository.
GAP = 23.88

# A gap this close to `GAP` is the pass having already run: the rebuild lands
# within a raster row of its target and must not walk the block up the page a
# second time.
DONE = 0.5

# The face `review/pei_caption_lines.py` sets these captions in, and the face
# they have to go back in: base-14 Times-Italic, the same `CAP_FONT` it uses.
CAP_FONT = "tiit"

INK_DPI = 600.0                 # the raster the ink extents are read off
INK_DARK = 200                  # grey at or below this counts as ink

SHIFTS = os.path.join(HERE, "signature_space_shifts.json")


# ------------------------------------------------------------------ measuring

def ink_rect(page, clip):
    """The inked extent inside `clip`, or None where the paper is blank.

    Read off a raster rather than from the type, because everything this pass
    lines up is ink: an underscore's cell is 11pt tall and its rule is a third
    of a point of it, and a caption's cell claims a descender it may not use.
    """
    pixmap = page.get_pixmap(dpi=int(INK_DPI), clip=clip, colorspace=fitz.csGRAY)
    step, wide = 72.0 / INK_DPI, pixmap.width
    data = pixmap.samples
    x0, y0, x1, y1 = None, None, None, None
    for row in range(pixmap.height):
        inked = [x for x in range(wide) if data[row * wide + x] <= INK_DARK]
        if not inked:
            continue
        y0 = clip.y0 + row * step if y0 is None else y0
        y1 = clip.y0 + (row + 1) * step
        left, right = clip.x0 + inked[0] * step, clip.x0 + (inked[-1] + 1) * step
        x0 = left if x0 is None else min(x0, left)
        x1 = right if x1 is None else max(x1, right)
    return None if y0 is None else fitz.Rect(x0, y0, x1, y1)


def caption_lines(page):
    """The small italic caption naming Spouse One's lawyer, line by line.

    Found by what it is rather than by where it sits: the only type on the page
    set below body size is the caption `pei_caption_lines` re-set at 5.6pt.
    """
    out = []
    for block in page.get_text("dict")["blocks"]:
        for line in block.get("lines", []):
            for span in line["spans"]:
                if span["size"] < 8.0 and span["text"].strip():
                    out.append((fitz.Rect(span["bbox"]), span["text"]))
    out.sort(key=lambda item: item[0].y0)
    first = next((i for i, (_r, t) in enumerate(out) if t.lstrip().startswith("(")), None)
    if first is None:
        return []
    lines = [out[first]]
    for rect, text in out[first + 1:]:
        if rect.y0 - lines[-1][0].y1 > 4.0:
            break
        lines.append((rect, text))
    return lines


def caption_runs(page, lines):
    """The caption as it was set: one (text, baseline, size) per line.

    Read off the characters rather than the spans so the re-set line starts on
    exactly the baseline point the first glyph was placed on.
    """
    wanted = [rect for rect, _t in lines]
    out = []
    for block in page.get_text("rawdict")["blocks"]:
        for line in block.get("lines", []):
            for span in line["spans"]:
                if not any(fitz.Rect(span["bbox"]) in rect for rect in wanted):
                    continue
                chars = span["chars"]
                if not "".join(c["c"] for c in chars).strip():
                    continue
                out.append(("".join(c["c"] for c in chars),
                            fitz.Point(chars[0]["origin"]), span["size"]))
    out.sort(key=lambda item: item[1].y)
    return out


def runs_below(page, y):
    """The signature line's underscore runs: the first ruled line under `y`.

    The floor is the caption's own cell *top*, not its bottom. These runs are
    set on an 11pt line whose cell begins above the caption's last line and
    ends below it -- that containment is the whole reason this pass exists --
    so a floor taken at the caption's bottom misses the line it is looking for.
    """
    runs = sorted((fitz.Rect(x0, ry0, x1, ry1)
                   for x0, ry0, x1, ry1 in R.underscore_runs(page) if ry0 > y - 0.01),
                  key=lambda r: (r.y0, r.x0))
    if not runs:
        return []
    return [r for r in runs if abs(r.y0 - runs[0].y0) < 1.0]


def measure(page):
    """(caption lines, the runs under them, their ink, the paper between).

    `None` where the page does not present the shape this pass repairs. Once
    the pass has run the right-hand rule is a stroke rather than a run, so one
    run is as valid a reading as two -- both print on the same row, and the
    gap is read off the ink either way.
    """
    lines = caption_lines(page)
    if not lines:
        return None
    cap_cell = lines[0][0]
    for rect, _t in lines[1:]:
        cap_cell |= rect
    runs = runs_below(page, cap_cell.y0 + 0.1)
    cap_ink = ink_rect(page, cap_cell)
    if not runs or cap_ink is None:
        return None
    run_cell = runs[0]
    for rect in runs[1:]:
        run_cell |= rect
    # Probed from below the caption's ink: the runs' own cells start above it
    # and a probe over the whole cell would measure the caption again.
    run_ink = ink_rect(page, fitz.Rect(run_cell.x0, cap_ink.y1 + 0.1,
                                       run_cell.x1, run_cell.y1))
    if run_ink is None:
        return None
    return lines, runs, cap_ink, run_ink, round(run_ink.y0 - cap_ink.y1, 2)


# ------------------------------------------------------------------ rebuilding

def band(doc, page_no, keep, extra=()):
    """`pei_general_heading.band`, plus rectangles redacted inside the band.

    The batch's own `band()` keeps a full-width horizontal strip, which is all
    a page cut on clear paper ever needs. This page is not cut on clear paper
    -- see the module docstring -- so each band also has to drop the block it
    does not own from inside its own keep.
    """
    page = doc[page_no - 1]
    width, height = page.rect.width, page.rect.height
    out = fitz.open()
    out.insert_pdf(doc, from_page=page_no - 1, to_page=page_no - 1)
    target = out[0]
    for rect in ([fitz.Rect(0, 0, width, keep.y0),
                  fitz.Rect(0, keep.y1, width, height)] + list(extra)):
        if rect.get_area() > 0:
            target.add_redact_annot(rect)
    target.apply_redactions(images=fitz.PDF_REDACT_IMAGE_NONE,
                            graphics=fitz.PDF_REDACT_LINE_ART_REMOVE_IF_COVERED)
    return out


def rebuild(doc, page_no, lines, runs, run_ink, lift):
    """Re-place the page with the upper block lifted, and put its ink back."""
    source = doc[page_no - 1]
    w, h = source.rect.width, source.rect.height
    cells = runs[0] | runs[1]
    right = max(runs, key=lambda r: r.x0)
    caption = caption_runs(source, lines)
    assert caption, "the caption's own characters could not be read"

    # The shared line, taken out of both bands: from just inside the runs'
    # cells (so the runs go) down past their bottom (so the caption's second
    # line goes with them).
    shared = fitz.Rect(cells.x0 - 5.0, cells.y0 + 0.5, cells.x1 + 5.0, cells.y1 + 0.35)

    upper = band(doc, page_no, fitz.Rect(0, 0, w, cells.y1 + 0.35), extra=[shared])
    lower = band(doc, page_no, fitz.Rect(0, cells.y0 - 0.3, w, h),
                 extra=[fitz.Rect(right.x0 - 1.0, cells.y0 - 0.1,
                                  right.x1 + 1.0, cells.y1 + 0.35)])

    # `run_ink` spans both rules; the stroke is measured over the right-hand
    # one alone, which is the only one this pass has to put back.
    ruled = ink_rect(source, fitz.Rect(right.x0, run_ink.y0 - 0.5,
                                       right.x1, cells.y1))

    out = fitz.open()
    page = out.new_page(width=w, height=h)

    # **The caption goes down before the bands do, and the order is load
    # bearing.** Written after them, PyMuPDF folds this base-14 Times-Italic
    # into the one already inside the band's XObject, and that font's encoding
    # is not the same: the re-set line came back with no font name at all and
    # with its apostrophe re-coded from U+0027 to U+2019, so the page no longer
    # extracted the words it had been read off. Written first, the font is its
    # own resource and the line round-trips exactly -- same text, same face,
    # same baselines less the lift. Nothing in either band prints over it: the
    # upper band's own whiteouts all sit above the caption once lifted, and the
    # lower band begins below it.
    for text, origin, size in caption:
        page.insert_text(fitz.Point(origin.x, origin.y - lift), text,
                         fontname=CAP_FONT, fontsize=size, color=(0, 0, 0))

    page.show_pdf_page(fitz.Rect(0, -lift, w, h - lift), upper, 0)
    page.show_pdf_page(fitz.Rect(0, 0, w, h), lower, 0)
    upper.close()
    lower.close()
    # `ink_rect` reports the raster rows the run lit, so its rect is one row
    # taller than the rule: the stroke is laid from the top of the first row
    # the run lit to the top of the last, which puts it back on those same four
    # rows and matches the Date rule beside it, which is still glyphs.
    step = 72.0 / INK_DPI
    middle = (ruled.y0 + ruled.y1 - step) / 2
    page.draw_line(fitz.Point(ruled.x0, middle), fitz.Point(ruled.x1, middle),
                   color=(0, 0, 0), width=round(ruled.height - step, 3))

    doc.delete_page(page_no - 1)
    doc.insert_pdf(out, from_page=0, to_page=0,
                   start_at=page_no - 1, links=False, annots=False)
    out.close()


def shift_fields(mapping, page_no, above, lift):
    """Lift every field that belongs to the block that moved.

    Measured at the field's *bottom*: these boxes are seated flush on their own
    rule, so the bottom edge is the one that has to stay on it, and Spouse
    Two's own Date box starts above the cut while its rule is below it.
    """
    moved = 0
    for field in mapping["staticFields"]:
        if field["page"] != page_no:
            continue
        if field["y"] + field["height"] / SCALE <= above + 0.01:
            field["y"] = round(field["y"] - lift, 2)
            moved += 1
    return moved


def record(page_no, above, lift):
    shifts = json.load(open(SHIFTS)) if os.path.exists(SHIFTS) else {}
    entries = [e for e in shifts.get(DOC_ID, []) if e["page"] != page_no]
    entries.append({"page": page_no, "above": round(above, 2), "lift": round(lift, 2)})
    shifts[DOC_ID] = sorted(entries, key=lambda e: e["page"])
    json.dump(shifts, open(SHIFTS, "w"), indent=1, sort_keys=True)


def shifted(doc_id, page_no, y):
    """Move one y measured before this pass onto the shipped page."""
    shifts = json.load(open(SHIFTS)) if os.path.exists(SHIFTS) else {}
    for entry in shifts.get(doc_id, []):
        if entry["page"] == page_no and y <= entry["above"] + 0.01:
            return round(y - entry["lift"], 2)
    return y


# ----------------------------------------------------------------------- main

def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--check", action="store_true",
                        help="measure and report, write nothing")
    args = parser.parse_args()

    pdf_path = os.path.join(EXPORT, "%s.pdf" % DOC_ID)
    json_path = os.path.join(EXPORT, "%s.json" % DOC_ID)
    doc = fitz.open(pdf_path)
    mapping = json.load(open(json_path))
    page = doc[PAGE_NO - 1]

    found = measure(page)
    if found is None:
        sys.exit("%s page %d: the two-block signature shape is not there"
                 % (DOC_ID, PAGE_NO))
    _lines, runs, cap_ink, run_ink, have = found
    lift = round(GAP - have, 2)
    print("%s page %d: caption ends %.2f, rule starts %.2f, gap %.2f, wants %.2f"
          % (DOC_ID, PAGE_NO, cap_ink.y1, run_ink.y0, have, GAP))
    if lift <= DONE:
        print("  already has its space -- nothing to do")
        return 0
    if len(runs) != 2:
        sys.exit("  expected a Date rule and a signature rule, found %d" % len(runs))
    cells = runs[0] | runs[1]
    above = round(cells.y0 - 0.3, 2)
    print("  lifting everything above %.2f by %.2f" % (above, lift))
    if args.check:
        return 0

    rebuild(doc, PAGE_NO, _lines, runs, run_ink, lift)
    moved = shift_fields(mapping, PAGE_NO, above, lift)

    # The lift is exact at two decimals, but the rebuilt ink rides an XObject
    # matrix and a re-extracted rule extent rounds differently -- 0.03pt on the
    # four Name/Address/Phone/Email boxes this page carries, which is under a
    # twentieth of a point on the page and still enough for `pass_seat_flat`
    # (SEAT_SETTLED 0.02) to see a float and report them. Every other reflow in
    # this batch closes with the same call for the same reason; without it
    # `repair_pei_fields --check` stops matching the output it had before the
    # pass ran, which is this batch's standing proof that a reflow disturbed no
    # seat. `reseat` corrects the rounding scale only (under 0.1pt) and leaves
    # a genuine float alone.
    PGH.reseat(doc[PAGE_NO - 1],
               [f for f in mapping["staticFields"] if f["page"] == PAGE_NO])

    after = measure(doc[PAGE_NO - 1])
    if after is None or abs(after[4] - GAP) > 1.0:
        sys.exit("  rebuild did not land: %s"
                 % ("nothing found" if after is None else "gap %.2f" % after[4]))
    print("  gap is now %.2f, %d fields moved" % (after[4], moved))

    tmp = pdf_path + ".tmp"
    doc.save(tmp, deflate=True, garbage=3)
    doc.close()
    os.replace(tmp, pdf_path)
    with open(json_path, "w") as handle:
        json.dump(mapping, handle, indent=2)
    record(PAGE_NO, above, lift)
    return 0


if __name__ == "__main__":
    sys.exit(main())
