"""The placement guide's checklist, run as measurements over the batch-2 templates.

§7 of FIELD_PLACEMENT_GUIDE.md is the testing checklist for a new form batch and §8
its list of known-fragile spots; §9 is the set of defects the *shipped* Ontario forms
turned out to have, each with the detector that would have caught it. This runs all of
them over the 145 batch-2 forms so the systematic faults are found by measurement, and
the visual pass is left to find what measurement cannot.

    python3 verify_bc2.py                 # read the built templates in _incoming_bc2/out
    python3 verify_bc2.py --export        # read the promoted ones in form-template-export
    python3 verify_bc2.py --only BCSC_F30 [--verbose]

Exit status is non-zero if any *blocking* check fails. Advisory checks (the ones whose
answer depends on reading the page) are printed but do not block; they are the worklist
for the visual pass, and §7.11's rule applies — a rule only becomes settled once a
render has been looked at.
"""
import argparse
import collections
import json
import os
import re
import sys

import fitz

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import bc_pipeline as bp  # noqa: E402
import bc_sources_batch2 as src2  # noqa: E402

EXPORT = ("/Users/lorelaiphinnemore/Documents/CloudAct/Frontend /Calculator-code"
          "/auth-server/form-template-export")
OUT = os.path.join(EXPORT, "_incoming_bc2", "out")

SCALE = bp.SCALE
STD_LINE = 13.3
SLIVER = 22.0
# A shaded row and its field should agree closely; more than this is a real misfit.
SHADE_TOL = 2.0
DOLLAR_PAD = 1.0


def box(field):
    """Stored record -> page rectangle. §9.10: x/y are points, width/height points*1.5."""
    return fitz.Rect(field["x"], field["y"],
                     field["x"] + field["width"] / SCALE,
                     field["y"] + field["height"] / SCALE)


def load(doc_id, root):
    pdf = fitz.open(os.path.join(root, "%s.pdf" % doc_id))
    mapping = json.load(open(os.path.join(root, "%s.json" % doc_id)))
    return pdf, mapping["staticFields"]


# ---------------------------------------------------------------- §7 measurements

def check_ids_and_bounds(doc_id, pdf, fields, blocking, advisory):
    """§7.7: unique ids, in-bounds, positive size, no two controls on one mark."""
    seen = collections.Counter(f["id"] for f in fields)
    for field_id, count in seen.items():
        if count > 1:
            blocking.append(("duplicate-id", doc_id, 0, "%s used %d times" % (field_id, count)))
    positions = collections.defaultdict(list)
    for field in fields:
        page_number = field["page"]
        if not 1 <= page_number <= pdf.page_count:
            blocking.append(("off-page", doc_id, page_number, field["id"]))
            continue
        rect = box(field)
        page_rect = pdf[page_number - 1].rect
        if rect.width <= 0 or rect.height <= 0:
            blocking.append(("degenerate", doc_id, page_number,
                             "%s %.1fx%.1f" % (field["id"], rect.width, rect.height)))
        if (rect.x0 < -1 or rect.y0 < -1
                or rect.x1 > page_rect.width + 1 or rect.y1 > page_rect.height + 1):
            blocking.append(("out-of-bounds", doc_id, page_number, field["id"]))
        positions[(page_number, round(field["x"], 1), round(field["y"], 1))].append(field["id"])
    for (page_number, _x, _y), ids in positions.items():
        if len(ids) > 1:
            # Two controls on one mark means one of them cannot be clicked.
            blocking.append(("shared-position", doc_id, page_number,
                             ", ".join(str(field_id) for field_id in ids)))


def check_overlaps(doc_id, pdf, fields, blocking, advisory):
    """§7.7: no two field boxes may overlap by more than a quarter of the smaller."""
    by_page = collections.defaultdict(list)
    for field in fields:
        by_page[field["page"]].append(field)
    for page_number, page_fields in sorted(by_page.items()):
        for index, first in enumerate(page_fields):
            a = box(first)
            for second in page_fields[index + 1:]:
                b = box(second)
                shared = a & b
                if shared.is_empty:
                    continue
                smaller = min(a.get_area(), b.get_area())
                if smaller > 0 and shared.get_area() > 0.25 * smaller:
                    advisory.append(("field-overlap", doc_id, page_number,
                                     "%s and %s share %.0f%% of the smaller box"
                                     % (first["id"], second["id"],
                                        100 * shared.get_area() / smaller)))


def check_checkbox_marks(doc_id, pdf, fields, blocking, advisory, offsets):
    """§7.1 + §7.2: re-derive every checkbox's shape and position from the printed mark."""
    for field in fields:
        if field["type"] != "CheckBox":
            continue
        page = pdf[field["page"] - 1]
        rect = box(field)
        found = bp.printed_mark(page, rect)
        if not found:
            advisory.append(("checkbox-no-mark", doc_id, field["page"],
                             "%s has no printed mark under it" % field["id"]))
            continue
        shape = bp.printed_shape(page, found)
        if shape and field.get("shape") and shape != field["shape"]:
            blocking.append(("checkbox-shape", doc_id, field["page"],
                             "%s stored %s but the page prints %s"
                             % (field["id"], field["shape"], shape)))
        offsets.append(max(abs(found.x0 - rect.x0), abs(found.y0 - rect.y0)))


def check_slivers(doc_id, pdf, fields, blocking, advisory):
    """§7.3: any non-checkbox narrower than ~22pt needs a reason to exist."""
    for field in fields:
        if field["type"] == "CheckBox":
            continue
        rect = box(field)
        if rect.width < SLIVER:
            advisory.append(("sliver", doc_id, field["page"],
                             "%s is %.1fpt wide" % (field["id"], rect.width)))


def check_shaded_fit(doc_id, pdf, fields, blocking, advisory):
    """§7.4: where a field has a matching shaded row, the two should agree."""
    by_page = collections.defaultdict(list)
    for field in fields:
        if field["type"] != "CheckBox":
            by_page[field["page"]].append(field)
    for page_number, page_fields in sorted(by_page.items()):
        shaded = bp.shaded_boxes(pdf[page_number - 1])
        if not shaded:
            continue
        for field in page_fields:
            rect = box(field)
            match = None
            for band in shaded:
                shared = rect & band
                if not shared.is_empty and shared.get_area() > 0.6 * rect.get_area():
                    match = band
                    break
            if match is None:
                continue
            # A field legitimately spans several shaded rows; only a field *inside*
            # one row is asserted to fit it.
            if match.height >= rect.height - SHADE_TOL and (
                    abs(rect.y0 - match.y0) > SHADE_TOL or abs(rect.y1 - match.y1) > SHADE_TOL):
                advisory.append(("shade-misfit", doc_id, page_number,
                                 "%s is %.1f..%.1f, its shaded row is %.1f..%.1f"
                                 % (field["id"], rect.y0, rect.y1, match.y0, match.y1)))


def check_dollar_fields(doc_id, pdf, fields, blocking, advisory):
    """§7.5: an amount field must not cover its own `$`, and must share its line."""
    by_page = collections.defaultdict(list)
    for field in fields:
        if field["type"] != "CheckBox":
            by_page[field["page"]].append(field)
    for page_number, page_fields in sorted(by_page.items()):
        page = pdf[page_number - 1]
        dollars = [fitz.Rect(w[:4]) for w in page.get_text("words") if w[4].strip() == "$"]
        if not dollars:
            continue
        for field in page_fields:
            rect = box(field)
            for glyph in dollars:
                shared = rect & glyph
                if shared.is_empty:
                    continue
                if shared.get_area() > 0.5 * glyph.get_area():
                    blocking.append(("box-on-dollar", doc_id, page_number,
                                     "%s covers a printed $ at %.1f,%.1f"
                                     % (field["id"], glyph.x0, glyph.y0)))


def check_signatures(doc_id, pdf, fields, blocking, advisory):
    """§7.6 + §5: no box on a signature line."""
    by_page = collections.defaultdict(list)
    for field in fields:
        by_page[field["page"]].append(field)
    for page_number, page_fields in sorted(by_page.items()):
        captions = bp.signature_captions(pdf[page_number - 1])
        if not captions:
            continue
        for field in page_fields:
            if field["type"] == "CheckBox":
                continue
            rect = box(field)
            if bp.is_signature_box(rect, None, captions):
                blocking.append(("box-on-signature", doc_id, page_number,
                                 "%s sits on a signature line" % field["id"]))


# Printed characters a field box is *supposed* to cover: the writing line itself.
# An underscore run is the blank, a dotted leader is the blank, an empty-box glyph is
# a checkbox's own mark, and `$` has its own rule (§7.5). Flagging these as "printed
# text under the box" buries the real hits — the first run of this check reported 26
# and 20 of them were boxes sitting correctly on their own `______` rule.
NOT_A_LABEL = set("_.…·-–— \t ") | bp.BOX_GLYPHS | {"$"}


def check_printed_ink(doc_id, pdf, fields, blocking, advisory):
    """§3 / §9.3: a field must not sit on a printed label.

    Read at **character** level, not word level (§2 makes the same point about finding
    checkbox glyphs): BC sets its captions hard against the writing line, so the text
    extractor hands back `available):_____________` and `____________is` as single
    tokens. Testing whole tokens either flags the box for the underscores it is
    supposed to be on, or misses the word welded to them.
    """
    for field in fields:
        if field["type"] == "CheckBox":
            continue
        page = pdf[field["page"] - 1]
        rect = box(field)
        covered = []
        for block in page.get_text("rawdict")["blocks"]:
            for line in block.get("lines", []):
                for span in line.get("spans", []):
                    for char in span.get("chars", []):
                        text = char["c"]
                        if text in NOT_A_LABEL:
                            continue
                        glyph = fitz.Rect(char["bbox"])
                        if glyph.get_area() <= 0:
                            continue
                        shared = rect & glyph
                        if not shared.is_empty and shared.get_area() > 0.55 * glyph.get_area():
                            covered.append(text)
        if covered:
            advisory.append(("box-on-text", doc_id, field["page"],
                             "%s covers %r" % (field["id"], "".join(covered)[:60])))


def printed_lines(page):
    """Printed text lines as (rect, text), skipping the ones that are a blank's rule."""
    out = []
    for block in page.get_text("dict")["blocks"]:
        for line in block.get("lines", []):
            text = "".join(span["text"] for span in line["spans"]).strip()
            if not text or set(text) <= NOT_A_LABEL:
                continue
            out.append((fitz.Rect(line["bbox"]), text))
    return out


# Captions that name who signs. `bp.is_signature_box` only matches a caption starting with
# "Signature", so it does not know that "Registrar", "Judge or Justice of the Peace" or
# "A commissioner for taking affidavits" mark signature rules too. Without this, the boxes
# `drop_signature_boxes.py` correctly removed come straight back as `rule-no-field` and
# `blank-no-field` advisories — a worklist telling us to undo §5.
#
# "signature" is matched anywhere in the caption, not only at its start: F95 p2's rule is
# captioned "authorizing signature (Credit Card)", and a box sat on it until this saw it.
ROLE_CAPTION = re.compile(
    r'^\s*(a\s+)?(commissioner|judge|justice|registrar|clerk|notary|deponent|presiding'
    r'|associate\s+judge)\b|\bsignature\b', re.I)
# What disqualifies a caption from being a signature rule's: "print name or affix stamp of
# commissioner" labels the box *above* it, which §9.8 wants kept, and "Date of signature"
# (BCPC_7 p1) labels a date box beside the rule, not the rule.
NAME_CAPTION = re.compile(r'print|type|affix|stamp|date', re.I)


def on_signature_rule(page, rect, captions):
    """True if `rect` sits on a rule whose caption names who signs (§5)."""
    if bp.is_signature_box(rect, None, captions):
        return True
    for line_rect, text in printed_lines(page):
        if not ROLE_CAPTION.search(text) or NAME_CAPTION.search(text):
            continue
        # The lower bound is negative because a box seated on its rule can land a fraction
        # of a point inside the caption's own line box, as F95 p2's does at -0.2.
        if not -3 <= line_rect.y0 - rect.y1 < 26:
            continue
        if min(rect.x1, line_rect.x1) - max(rect.x0, line_rect.x0) > 8:
            return True
    return False


def check_edge_through_text(doc_id, pdf, fields, blocking, advisory):
    """A box edge that cuts through a printed caption.

    `check_printed_ink` asks how much of a glyph the box covers, which is the right
    question for a box parked *on* a label but the wrong one for a box that merely
    reaches up into the caption above its writing line. On BCSC_SUP916 every field
    crosses its caption's lower half, and because no single character was 55% covered
    the ink check reported only two of them.

    So this asks a different question: does the box's own top or bottom edge run
    *through* a line of printed text that it substantially overlaps horizontally? A
    correctly placed box's edges sit in the whitespace between lines.

    The verdict is then taken from **ink, not from the line's box**. A text line's
    bbox is a font box: it carries ascender and descender space that the glyphs do not
    use, so an edge 1-3 pt inside it is usually still clear of every letter — the same
    font-box-versus-ink distinction §2 makes about `❑` glyphs. Judging on the box alone
    reported 236 hits across 28 forms; requiring the intruding strip to actually
    contain dark pixels is what separates a box crossing a caption from a box sitting
    tidily in the gap below it.
    """
    for field in fields:
        if field["type"] == "CheckBox":
            continue
        rect = box(field)
        page = pdf[field["page"] - 1]
        for line_rect, text in printed_lines(page):
            shared = min(rect.x1, line_rect.x1) - max(rect.x0, line_rect.x0)
            if shared < 0.5 * min(rect.width, line_rect.width):
                continue
            for name, edge in (("top", rect.y0), ("bottom", rect.y1)):
                if not line_rect.y0 + 1.0 < edge < line_rect.y1 - 1.0:
                    continue
                strip = (rect & line_rect) & page.rect
                if strip.is_empty or strip.width <= 0 or strip.height <= 0:
                    continue
                pixels = page.get_pixmap(clip=strip, colorspace=fitz.csGRAY, dpi=300)
                dark = sum(1 for value in pixels.samples if value < 170)
                if dark < 0.004 * max(1, pixels.width * pixels.height):
                    continue
                advisory.append(("edge-cuts-caption", doc_id, field["page"],
                                 "%s %s edge at %.1f runs through %r (%.1f..%.1f), "
                                 "%.1f%% ink in the overlap"
                                 % (field["id"], name, edge, text[:34],
                                    line_rect.y0, line_rect.y1,
                                    100.0 * dark / max(1, pixels.width * pixels.height))))


# ---------------------------------------------------------------- §9 detectors

def dashed_leaders(page):
    """Printed dotted leaders — a blank's writing line — keyed apart from the frame.

    §9.1: `get_drawings()` reports a leader with a `dashes` value and a frame line
    with none, so "on a rule" and "on *its* rule" are distinguishable without guessing.
    """
    out = []
    for drawing in page.get_drawings():
        dashes = drawing.get("dashes")
        dashed = bool(dashes) and dashes not in ("[] 0", "[]0")
        for item in drawing["items"]:
            if item[0] != "l":
                continue
            start, end = item[1], item[2]
            if abs(start.y - end.y) < 0.6 and abs(start.x - end.x) > 8:
                out.append((round(start.y, 2), min(start.x, end.x), max(start.x, end.x), dashed))
    return out


def check_leader_seating(doc_id, pdf, fields, blocking, advisory):
    """§9.1: a single-line box should sit on its *dotted leader*, not the frame below."""
    for field in fields:
        if field["type"] != "TextField":
            continue
        rect = box(field)
        if rect.height > SLIVER:
            continue
        page = pdf[field["page"] - 1]
        leaders = [ln for ln in dashed_leaders(page) if ln[3]]
        mine = [ln for ln in leaders
                if min(rect.x1, ln[2]) - max(rect.x0, ln[1]) > 0.45 * rect.width
                and rect.y1 - 6.0 <= ln[0] <= rect.y1 + 9.0]
        if not mine:
            continue
        nearest = min(mine, key=lambda ln: abs(ln[0] - rect.y1))
        gap = nearest[0] - rect.y1
        if not -0.5 <= gap <= 3.0:
            advisory.append(("wrong-rule", doc_id, field["page"],
                             "%s bottom %.1f but its leader is at %.1f (%.1f off)"
                             % (field["id"], rect.y1, nearest[0], gap)))


def check_heading_strays(doc_id, pdf, fields, blocking, advisory):
    """§9.2: the topmost box of a column whose height differs from the column's mode.

    That is what a row of boxes parked in a table's column-heading cell looks like,
    and a data row does not.
    """
    columns = collections.defaultdict(list)
    for field in fields:
        if field["type"] == "CheckBox":
            continue
        rect = box(field)
        columns[(field["page"], round(rect.x0 / 4), round(rect.width / 4))].append((rect, field))
    for (page_number, _x, _w), members in columns.items():
        if len(members) < 3:
            continue
        members.sort(key=lambda m: m[0].y0)
        heights = collections.Counter(round(m[0].height, 1) for m in members)
        modal, modal_count = heights.most_common(1)[0]
        if modal_count < len(members) - 1:
            continue
        top_rect, top_field = members[0]
        if abs(round(top_rect.height, 1) - modal) > 2.0:
            advisory.append(("heading-stray", doc_id, page_number,
                             "%s is %.1fpt tall against a column mode of %.1f"
                             % (top_field["id"], top_rect.height, modal)))


def check_unit_sanity(doc_id, pdf, fields, blocking, advisory):
    """§9.10: sizes are points x 1.5, so a box written in raw points comes out small."""
    for field in fields:
        if field["type"] == "CheckBox":
            continue
        rect = box(field)
        if rect.height < 6.0:
            blocking.append(("too-short", doc_id, field["page"],
                             "%s is %.1fpt tall — check the x1.5 size convention"
                             % (field["id"], rect.height)))


def check_artwork(doc_id, pdf, fields, blocking, advisory):
    """§9.11: a field covering most of an image is on artwork, not on a blank."""
    for page_number in range(1, pdf.page_count + 1):
        page = pdf[page_number - 1]
        images = [fitz.Rect(info["bbox"]) for info in page.get_image_info()]
        if not images:
            continue
        for field in fields:
            if field["page"] != page_number:
                continue
            rect = box(field)
            for art in images:
                if art.get_area() <= 0:
                    continue
                shared = rect & art
                if not shared.is_empty and shared.get_area() > 0.4 * art.get_area():
                    advisory.append(("box-on-artwork", doc_id, page_number,
                                     "%s covers an image at %.0f,%.0f"
                                     % (field["id"], art.x0, art.y0)))


def check_blank_pages(doc_id, pdf, fields, blocking, advisory):
    """§8: a page with no field at all — genuinely instructions, or lost content?"""
    have = {f["page"] for f in fields}
    for page_number in range(1, pdf.page_count + 1):
        if page_number not in have:
            text = pdf[page_number - 1].get_text().strip()
            advisory.append(("page-no-fields", doc_id, page_number,
                             "%d characters of text" % len(text)))


def underscore_runs(page, min_chars=5):
    """Printed `______` blanks — a writing line set as text rather than drawn."""
    runs = []
    for block in page.get_text("rawdict")["blocks"]:
        for line in block.get("lines", []):
            for span in line.get("spans", []):
                current = None
                for char in span.get("chars", []):
                    if char["c"] == "_":
                        glyph = fitz.Rect(char["bbox"])
                        current = glyph if current is None else (current | glyph)
                    else:
                        if current is not None and current.width >= min_chars * 3.0:
                            runs.append(current)
                        current = None
                if current is not None and current.width >= min_chars * 3.0:
                    runs.append(current)
    return runs


def check_unfilled_blanks(doc_id, pdf, fields, blocking, advisory):
    """§9.6 / §9.7: a printed blank with no field on it.

    "Not every missing field is on a page you were told about" — and an underscore run
    is the least ambiguous anchor there is: the government drew a line for someone to
    write on. BCSC_F101 p3 has two of them and no field at all on the page.
    """
    by_page = collections.defaultdict(list)
    for field in fields:
        by_page[field["page"]].append(box(field))
    for page_number in range(1, pdf.page_count + 1):
        page = pdf[page_number - 1]
        boxes = by_page.get(page_number, [])
        for run in underscore_runs(page):
            probe = fitz.Rect(run.x0, run.y0 - 11.0, run.x1, run.y1 + 1.0)
            if any(not (probe & existing).is_empty
                   and (probe & existing).get_area() > 0.2 * min(probe.get_area(),
                                                                 existing.get_area())
                   for existing in boxes):
                continue
            if on_signature_rule(page, fitz.Rect(run.x0, run.y0 - STD_LINE,
                                                 run.x1, run.y0),
                                 bp.signature_captions(page)):
                continue
            advisory.append(("blank-no-field", doc_id, page_number,
                             "a %.0fpt printed ______ at %.0f,%.0f has no field"
                             % (run.width, run.x0, run.y0)))


def check_answer_spaces(doc_id, pdf, fields, blocking, advisory):
    """§9.5: a narrative item whose answer space is bare paper with no field in it.

    The page prints an instruction ending in a colon and then leaves the sheet empty.
    There is no rule, no shading and no cell to measure, so a build that only reads
    printed anchors leaves no box and a lawyer cannot type the answer.

    A caption that **already has its own field on its own line** is excluded. Where a
    schedule simply ends, its last labelled row ("Email:", "Telephone:", "Respondent:")
    is followed by the rest of a blank sheet, which looks identical to an unanswered
    narrative item until you notice the label is already answered to its right. That
    was 8 of the first 19 hits, and BCPC_11 p13 — flagged twice — is fully correct.
    """
    by_page = collections.defaultdict(list)
    for field in fields:
        by_page[field["page"]].append(box(field))
    for page_number in range(1, pdf.page_count + 1):
        page = pdf[page_number - 1]
        boxes = by_page.get(page_number, [])
        lines = sorted(printed_lines(page), key=lambda item: item[0].y0)
        floor = page.rect.height - 60.0     # keep clear of the footer band
        for index, (rect, text) in enumerate(lines):
            if not text.rstrip().endswith(":"):
                continue
            if any(existing.x0 >= rect.x1 - 2
                   and existing.y1 > rect.y0 and existing.y0 < rect.y1
                   for existing in boxes):
                continue
            below = [other for other, _t in lines[index + 1:] if other.y0 > rect.y1 + 2]
            bottom = min([other.y0 for other in below] + [floor])
            gap = bottom - rect.y1
            if gap < 40.0:
                continue
            space = fitz.Rect(rect.x0, rect.y1 + 2, page.rect.width - 60.0, bottom - 2)
            if any(not (space & existing).is_empty for existing in boxes):
                continue
            advisory.append(("answer-space-no-field", doc_id, page_number,
                             "%.0fpt of bare space under %r has no field"
                             % (gap, text[:44])))


def rules_and_frames(page, min_len=45.0):
    """Long thin horizontal rules, and the drawn boxes whose edges some of them are."""
    rules, frames = [], []
    for drawing in page.get_drawings():
        for item in drawing["items"]:
            if item[0] == "l":
                start, end = item[1], item[2]
                if abs(start.y - end.y) < 0.7 and abs(start.x - end.x) >= min_len:
                    rules.append(fitz.Rect(min(start.x, end.x), start.y - 0.5,
                                           max(start.x, end.x), start.y + 0.5))
            elif item[0] == "re":
                rect = item[1]
                if rect.width >= min_len and rect.height <= 1.6:
                    rules.append(fitz.Rect(rect.x0, rect.y0, rect.x1, rect.y1))
                elif rect.width >= min_len and rect.height > 2.0:
                    frames.append(+rect)
    return rules, frames


def check_unboxed_rules(doc_id, pdf, fields, blocking, advisory):
    """§9.6 again, for a blank the form *drew* instead of typing as `______`.

    `check_unfilled_blanks` only sees underscore characters, so a writing line drawn as
    line art is invisible to it. F85 p1 is the case that showed it up: "THIS COURT ORDERS
    that no fees are payable by" is followed by a drawn 252 pt rule with no field on it,
    and every gate passed the form.

    Two exclusions, both calibrated against BCPC_19 — a form confirmed clean by reading
    all six of its pages, which the first version of this check reported 8 times:

      * a rule that is the top or bottom **edge of a drawn box** is a panel border
        (BCPC_19 p2's online-filing panel and its QR-code panel);
      * a rule **doubled within about 2 pt** of another is a decorative double border.

    With those, BCPC_19 goes to zero and F85's real one survives.
    """
    by_page = collections.defaultdict(list)
    for field in fields:
        by_page[field["page"]].append(box(field))
    for page_number in range(1, pdf.page_count + 1):
        page = pdf[page_number - 1]
        boxes = by_page.get(page_number, [])
        captions = bp.signature_captions(page)
        rules, frames = rules_and_frames(page)
        for index, rule in enumerate(rules):
            if any(abs(rule.y0 - frame.y0) < 1.6 or abs(rule.y0 - frame.y1) < 1.6
                   for frame in frames
                   if frame.x0 - 2 <= rule.x0 and frame.x1 + 2 >= rule.x1):
                continue
            if any(other is not rule and abs(other.y0 - rule.y0) < 2.2
                   and abs(other.x0 - rule.x0) < 3 and abs(other.x1 - rule.x1) < 3
                   for other in rules):
                continue
            probe = fitz.Rect(rule.x0, rule.y0 - 14.0, rule.x1, rule.y1 + 1.5)
            if any(not (probe & existing).is_empty
                   and (probe & existing).get_area() > 0.2 * min(probe.get_area(),
                                                                 existing.get_area())
                   for existing in boxes):
                continue
            # §5: a signature rule is not a blank to be filled.
            if on_signature_rule(page, fitz.Rect(rule.x0, rule.y0 - STD_LINE,
                                                 rule.x1, rule.y0), captions):
                continue
            if page.get_text(clip=probe).strip():
                continue
            advisory.append(("rule-no-field", doc_id, page_number,
                             "a %.0fpt drawn rule at %.0f,%.0f has no field"
                             % (rule.width, rule.x0, rule.y0)))


def check_widgets(doc_id, pdf, fields, blocking, advisory):
    """The app draws its own overlay; a leftover AcroForm layer would double up."""
    left = sum(len(list(page.widgets())) for page in pdf)
    if left:
        blocking.append(("native-widgets", doc_id, 0, "%d widgets survived the flatten" % left))


CHECKS = [
    check_ids_and_bounds, check_overlaps, check_slivers, check_shaded_fit,
    check_dollar_fields, check_signatures, check_printed_ink, check_edge_through_text,
    check_leader_seating,
    check_heading_strays, check_unit_sanity, check_artwork, check_blank_pages,
    check_unfilled_blanks, check_answer_spaces, check_unboxed_rules,
    check_widgets,
]
BLOCKING_ONLY = {"check_checkbox_marks"}


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--export", action="store_true",
                        help="read the promoted templates instead of the build output")
    parser.add_argument("--only")
    parser.add_argument("--verbose", action="store_true")
    args = parser.parse_args()

    root = EXPORT if args.export else OUT
    doc_ids = [s["docId"] for s in src2.all_sources()]
    if args.only:
        want = set(args.only.split(","))
        doc_ids = [d for d in doc_ids if d in want]

    blocking, advisory, offsets = [], [], []
    pages = fieldcount = 0
    for doc_id in doc_ids:
        pdf, fields = load(doc_id, root)
        pages += pdf.page_count
        fieldcount += len(fields)
        for check in CHECKS:
            check(doc_id, pdf, fields, blocking, advisory)
        check_checkbox_marks(doc_id, pdf, fields, blocking, advisory, offsets)
        pdf.close()

    print("%d forms, %d pages, %d fields\n" % (len(doc_ids), pages, fieldcount))
    if offsets:
        offsets.sort()
        print("checkbox mark alignment: median %.2fpt, 95th %.2fpt, worst %.2fpt (%d marks)"
              % (offsets[len(offsets) // 2], offsets[int(0.95 * (len(offsets) - 1))],
                 offsets[-1], len(offsets)))

    def report(name, items):
        counts = collections.Counter(kind for kind, *_ in items)
        print("\n%s: %d" % (name, len(items)))
        for kind, count in counts.most_common():
            print("  %-20s %d" % (kind, count))
        if args.verbose:
            for kind, doc_id, page_number, detail in sorted(items):
                print("    %-20s %-14s p%-3s %s" % (kind, doc_id, page_number, detail))

    report("BLOCKING", blocking)
    report("ADVISORY (worklist for the visual pass)", advisory)
    with open(os.path.join(OUT, "verify_bc2.json"), "w") as fh:
        json.dump({"blocking": blocking, "advisory": advisory}, fh, indent=1)
    return 1 if blocking else 0


if __name__ == "__main__":
    sys.exit(main())
