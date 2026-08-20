"""Move a caption printed *inside* a rule down underneath it, set very small.

Manitoba draws its blanks as line art and some forms print the instruction on the
rule itself:

    On ________(date)________, 20___, at ____(time)____, I personally served

`split_caption_rules.py` dealt with that by boxing the rule either side of the
caption, which leaves the caption sitting between two controls and the writing
space cut in half. This instead takes the caption off the line: the glyphs are
redacted out of the background and redrawn underneath the rule at a fraction of
the size, and the rule -- now clear end to end -- gets **one** box across the
whole of it.

**This is the one place the Manitoba pipeline rewrites the government's page.**
Everywhere else the background ships byte-identical to the King's Printer's file,
which is the property that lets a re-fetch be diffed against what we ship. That
is not true of a form this has touched, and the change is a layout change to a
prescribed court form -- the instruction still reads, in the same words, in the
same place in the sentence, but smaller and below the line rather than on it.

Because `build_mb_forms.py` copies the source PDF over the promoted one, a
rebuild reverts this. Re-run it afterwards; it is idempotent (a caption already
moved is no longer on its rule, so there is nothing left to find).

    python3 caption_under_rule.py --only MBCFS_22A [--check]
"""
import argparse
import json
import os
import re
import sys

import fitz

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
sys.path.insert(0, os.path.join(os.path.dirname(HERE), "bc-forms"))

import build_mb_forms as B  # noqa: E402
import split_caption_rules as S  # noqa: E402

EXPORT = B.EXPORT
SCALE = B.SCALE
MIN_W = B.MIN_BLANK_WIDTH

CAPTION = re.compile(r"^\(.+\)$")
# "Very tiny", but bounded: never larger than this, never smaller than this, and
# otherwise as large as the clear space under the rule allows.
SIZE_MAX, SIZE_MIN = 5.5, 3.4
# Times' ascent and descent as a fraction of point size, and the clearance kept
# between the rule and the top of the moved caption.
ASCENT, DESCENT, BELOW_RULE = 0.683, 0.217, 0.6
FONT = "tiro"  # Times-Roman, the face the forms are set in
# Glyphs further apart than this on one rule are separate runs, not one caption.
GLYPH_GAP = 3.0


def captions_on(page, key, start, end):
    """[(rect, text)] for each parenthesised caption printed inside this rule.

    Grouped by the gap between glyphs, not by whitespace: "(identify person
    served)" has spaces in it, and splitting on those yields "(identify",
    "person", "served)" -- none of which reads as a caption, which is why the
    first run of this found only the single-word ones on page 1.
    """
    glyphs = []
    for text, boxes, _sizes in B.line_chars(page):
        for index, char in enumerate(text):
            box = boxes[index]
            if (key - S.GLYPH_ABOVE <= box.y1 <= key + S.GLYPH_BELOW
                    and box.x1 > start and box.x0 < end):
                glyphs.append((box, char))
    glyphs.sort(key=lambda pair: pair[0].x0)
    runs, current, previous = [], [], None
    for box, char in glyphs:
        if previous is not None and box.x0 - previous > GLYPH_GAP:
            if current:
                runs.append(current)
            current = []
        current.append((box, char))
        previous = box.x1
    if current:
        runs.append(current)
    out = []
    for run in runs:
        text = "".join(char for _box, char in run)
        # Search rather than match: the run picks up the punctuation the form
        # sets against the caption ("(date)," on the date rules), and it is the
        # parenthesised part alone that is the caption and gets moved.
        found = re.search(r"\([^()]*\)", text)
        if not found:
            continue
        boxes = [box for box, _char in run[found.start():found.end()]]
        rect = boxes[0]
        for box in boxes:
            rect = rect | box
        if rect.x0 <= start + S.PAD or rect.x1 >= end - S.PAD:
            continue  # not interior: a label at the end of the rule, not on it
        out.append((rect, found.group()))
    return out


def gap_below(page, rect, key):
    """Clear vertical space under the rule, directly beneath this caption."""
    lows = []
    for text, boxes, _sizes in B.line_chars(page):
        for index, char in enumerate(text):
            if not char.strip():
                continue
            box = boxes[index]
            if box.y0 > key + 0.6 and box.x1 > rect.x0 and box.x0 < rect.x1:
                lows.append(box.y0)
    return (min(lows) - key) if lows else 99.0


def size_for(gap):
    room = (gap - BELOW_RULE) / (ASCENT + DESCENT)
    return max(SIZE_MIN, min(SIZE_MAX, round(room, 1)))


def runs_on(page, key, start, end):
    """[(rect, text)] for every glyph run printed on this rule, in x order."""
    glyphs = []
    for text, boxes, _sizes in B.line_chars(page):
        for index, char in enumerate(text):
            box = boxes[index]
            if (key - S.GLYPH_ABOVE <= box.y1 <= key + S.GLYPH_BELOW
                    and box.x1 > start and box.x0 < end):
                glyphs.append((box, char))
    glyphs.sort(key=lambda pair: pair[0].x0)
    out, current, previous = [], [], None
    for box, char in glyphs:
        if previous is not None and box.x0 - previous > GLYPH_GAP:
            if current:
                out.append(current)
            current = []
        current.append((box, char))
        previous = box.x1
    if current:
        out.append(current)
    packed = []
    for run in out:
        text = "".join(char for _b, char in run)
        if text.strip():
            packed.append((_bounds(run), text, run))
    return packed


def _bounds(run):
    rect = run[0][0]
    for box, _char in run:
        rect = rect | box
    return rect


def _upto_close(run):
    """The run cut after its closing parenthesis, with its own bounds.

    The form sets the sentence's comma hard against the caption -- "...agency
    served) ," -- so it falls inside the same glyph run. Carried along, it is
    redacted off the line it punctuates and reappears inside the caption. The
    caption ends at its bracket; everything after it stays where the form put it.
    """
    text = "".join(char for _box, char in run)
    end = text.rfind(")")
    cut = run[:end + 1] if end >= 0 else run
    return _bounds(cut), "".join(char for _b, char in cut).strip()


def spanning(doc_id):
    """Captions that open on one rule and close on the next line's rule.

    22A sets "(name of person served/ name of person and agency served)" across a
    line break: the opening half sits on the rule at the end of one line and the
    closing half on the rule that starts the next. Neither half reads as a caption
    on its own, so `captions_on` skips both and both rules stay unfillable. The
    whole caption goes under the *first* of the two rules -- at this size it fits
    on one line -- and both rules are then cleared and boxed.
    """
    doc = fitz.open(os.path.join(EXPORT, "%s.pdf" % doc_id))
    jobs = []
    for number in range(1, doc.page_count + 1):
        page = doc[number - 1]
        rules = sorted(S.rules_on(page))
        opens = []
        for key, start, end in rules:
            for rect, text, run in runs_on(page, key, start, end):
                if "(" in text and ")" not in text:
                    opens.append((key, start, end, rect, text.strip()))
                elif ")" in text and "(" not in text and opens:
                    rect, text = _upto_close(run)
                    okey, ostart, oend, orect, otext = opens.pop()
                    jobs.append({
                        "page": number,
                        "first": (okey, ostart, oend, orect),
                        "second": (key, start, end, rect),
                        "text": ("%s %s" % (otext, text)).strip(),
                    })
    doc.close()
    return jobs


def rewrite_spanning(doc_id, jobs):
    pdf = os.path.join(EXPORT, "%s.pdf" % doc_id)
    doc = fitz.open(pdf)
    placed = []
    for job in jobs:
        page = doc[job["page"] - 1]
        for key, _s, _e, rect in (job["first"], job["second"]):
            page.add_redact_annot(fitz.Rect(rect.x0 - 0.3, rect.y0 - 0.3,
                                            rect.x1 + 0.3, key - 0.4))
    for number in {job["page"] for job in jobs}:
        doc[number - 1].apply_redactions(graphics=fitz.PDF_REDACT_LINE_ART_NONE)
    for job in jobs:
        page = doc[job["page"] - 1]
        key, start, end, rect = job["first"]
        # Sized to fit the rule it goes under, as well as the room beneath it:
        # the joined caption is long, and at 5.5pt it would run past the right
        # margin of the 122pt rule it belongs to.
        size = size_for(gap_below(page, fitz.Rect(start, rect.y0, end, rect.y1), key))
        while size > SIZE_MIN and fitz.get_text_length(
                job["text"], fontname=FONT, fontsize=size) > end - start:
            size = round(size - 0.1, 1)
        width = fitz.get_text_length(job["text"], fontname=FONT, fontsize=size)
        page.insert_text(fitz.Point((start + end) / 2 - width / 2,
                                    key + BELOW_RULE + size * ASCENT),
                         job["text"], fontname=FONT, fontsize=size)
        placed.append((job["page"], job["text"], size))
    doc.saveIncr()
    doc.close()

    doc = fitz.open(pdf)
    path = os.path.join(EXPORT, "%s.json" % doc_id)
    mapping = json.load(open(path))
    fields = mapping["staticFields"]
    next_id = max(f["id"] for f in fields) + 1
    for job in jobs:
        page = doc[job["page"] - 1]
        for key, start, end, _rect in (job["first"], job["second"]):
            stretches = S.clear_stretches(page, key, start, end)
            if not stretches:
                continue
            lo, hi = max(stretches, key=lambda p: p[1] - p[0])
            existing = [f for f in fields
                        if f["page"] == job["page"] and f["type"] != "CheckBox"
                        and abs(f["y"] + f["height"] / SCALE - key) < 4.0
                        and f["x"] + f["width"] / SCALE > start and f["x"] < end]
            template = next(f for f in fields if f["type"] == "TextField")
            if existing:
                keep = max(existing, key=lambda f: f["width"])
                for f in existing:
                    if f is not keep:
                        fields.remove(f)
            else:
                keep = {k: v for k, v in template.items() if k != "bind"}
                keep["id"] = next_id
                keep["page"] = job["page"]
                next_id += 1
                fields.append(keep)
            keep["x"] = round(lo, 2)
            keep["width"] = round((hi - lo) * SCALE, 2)
            keep["y"] = round(key + 0.3 - keep["height"] / SCALE, 2)
    doc.close()
    fields.sort(key=lambda f: (f["page"], f["y"], f["x"]))
    with open(path, "w") as fh:
        json.dump(mapping, fh, indent=2)
        fh.write("\n")
    return placed


def plan(doc_id):
    """[(page, key, start, end, rect, text, size)] for every caption to move."""
    doc = fitz.open(os.path.join(EXPORT, "%s.pdf" % doc_id))
    jobs = []
    for number in range(1, doc.page_count + 1):
        page = doc[number - 1]
        for key, start, end in S.rules_on(page):
            for rect, text in captions_on(page, key, start, end):
                jobs.append((number, key, start, end, rect, text,
                             size_for(gap_below(page, rect, key))))
    doc.close()
    return jobs


def rewrite(doc_id, jobs):
    """Redact each caption, redraw it small underneath, and re-box each rule."""
    pdf = os.path.join(EXPORT, "%s.pdf" % doc_id)
    doc = fitz.open(pdf)
    by_page = {}
    for number, key, start, end, rect, text, size in jobs:
        by_page.setdefault(number, []).append((key, start, end, rect, text, size))
    for number, items in by_page.items():
        page = doc[number - 1]
        for key, _s, _e, rect, _t, _size in items:
            # Stop short of the rule so the redaction cannot take it, and keep
            # line art regardless -- the rule is the thing we are clearing *for*.
            page.add_redact_annot(fitz.Rect(rect.x0 - 0.3, rect.y0 - 0.3,
                                            rect.x1 + 0.3, key - 0.4))
        page.apply_redactions(graphics=fitz.PDF_REDACT_LINE_ART_NONE)
        for key, _s, _e, rect, text, size in items:
            width = fitz.get_text_length(text, fontname=FONT, fontsize=size)
            page.insert_text(
                fitz.Point((rect.x0 + rect.x1) / 2 - width / 2,
                           key + BELOW_RULE + size * ASCENT),
                text, fontname=FONT, fontsize=size)
    doc.saveIncr()
    doc.close()

    # The rules are clear now, so re-read them and give each one box.
    doc = fitz.open(pdf)
    path = os.path.join(EXPORT, "%s.json" % doc_id)
    mapping = json.load(open(path))
    fields = mapping["staticFields"]
    next_id = max(f["id"] for f in fields) + 1
    for number, items in by_page.items():
        page = doc[number - 1]
        for key, start, end in dict.fromkeys((k, s, e) for k, s, e, _r, _t, _z in items):
            on_rule = [f for f in fields
                       if f["page"] == number and f["type"] != "CheckBox"
                       and abs(f["y"] + f["height"] / SCALE - key) < 4.0
                       and f["x"] + f["width"] / SCALE > start
                       and f["x"] < end]
            stretches = S.clear_stretches(page, key, start, end)
            if not stretches:
                continue
            widest = max(stretches, key=lambda p: p[1] - p[0])
            if on_rule:
                keep = max(on_rule, key=lambda f: f["width"])
                for f in on_rule:
                    if f is not keep:
                        fields.remove(f)
            else:
                # The rule had no box at all, because before the caption moved
                # both stubs either side of it were under MIN_BLANK_WIDTH -- 22A's
                # "which ___(is/are)___ returnable on" leaves 3.5pt and 4.7pt.
                # Clearing the caption makes the whole 41.8pt rule writable, so
                # this is the moment it becomes fillable.
                template = next(f for f in fields if f["type"] == "TextField")
                keep = {k: v for k, v in template.items() if k != "bind"}
                keep["id"] = next_id
                keep["page"] = number
                next_id += 1
                fields.append(keep)
            height = keep["height"]
            keep["x"] = round(widest[0], 2)
            keep["width"] = round((widest[1] - widest[0]) * SCALE, 2)
            keep["y"] = round(key + 0.3 - height / SCALE, 2)
    doc.close()
    fields.sort(key=lambda f: (f["page"], f["y"], f["x"]))
    with open(path, "w") as fh:
        json.dump(mapping, fh, indent=2)
        fh.write("\n")
    return next_id


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--only", action="append", required=True)
    parser.add_argument("--check", action="store_true")
    args = parser.parse_args()
    for doc_id in args.only:
        jobs = plan(doc_id)
        print("%-13s captions=%d" % (doc_id, len(jobs)))
        for number, key, _s, _e, rect, text, size in jobs:
            print("     p%d y%.1f x%.1f-%.1f  %-30r -> %.1fpt"
                  % (number, key, rect.x0, rect.x1, text[:28], size))
        if jobs and not args.check:
            rewrite(doc_id, jobs)
            print("     rewritten")
        crossing = spanning(doc_id)
        for job in crossing:
            print("     spanning p%d %r" % (job["page"], job["text"][:60]))
        if crossing and not args.check:
            for _page, text, size in rewrite_spanning(doc_id, crossing):
                print("     placed %r at %.1fpt" % (text[:48], size))


if __name__ == "__main__":
    main()
