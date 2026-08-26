"""The printed-blank vocabulary of Newfoundland's flat Provincial Court forms.

Thirteen forms in this batch carry no widget layer, and they do not all print a
blank the same way. The emergency-protection set mixes three vocabularies on one
page -- Form 003 prints its party lines as **drawn rules**, its options as
**drawn squares**, and nothing at all as an underscore, which is why the
Saskatchewan detector alone found zero blanks on a page full of them.

So three detectors run over a flat form here:

* **underscore runs** -- `acroform_seat.underscore_fields`, unchanged;
* **drawn writing rules** -- this module;
* **drawn option squares** -- this module.

## What separates a writing rule from every other line on the page

These pages are full of horizontal lines that are not blanks: the border of the
"What is family violence?" quotation box, the rule under a heading, the
separator above a footer. The test that sorts them is the golden rule every
province's builder follows -- **a blank has a printed anchor, and here the
anchor is a label to the left of the line on the line's own baseline**:

    Police File #_________________        <- label "Police File #", a blank
    Applicant ____________ D.O.B ______   <- labels "Applicant", "D.O.B"
    I, ______________, of ______________  <- "I," and ", of" are the labels
    ______________________________        <- a frame border, not a blank

That single test rejects frame borders, heading rules and separators without
having to enumerate them, and it costs nothing when the court adds a line.
"""
import fitz

# A writing rule is thin. Anything thicker is a bar or a shaded block.
MAX_RULE_HEIGHT = 2.2
MIN_RULE_WIDTH = 34.0

# How far left of the rule a label may sit, and how far the rule may sit below
# the label's baseline and still belong to it.
LABEL_REACH = 26.0
BASELINE_DROP = 12.0

# A drawn option square, measured on the emergency-protection set: 10.6 pt.
SQUARE_MIN = 6.5
SQUARE_MAX = 17.0
SQUARE_RATIO = 1.45


def _segments(page):
    """Every drawn line and thin rectangle, as fitz.Rect."""
    out = []
    for drawing in page.get_drawings():
        for item in drawing["items"]:
            if item[0] == "l":
                start, end = item[1], item[2]
                out.append(fitz.Rect(min(start.x, end.x), min(start.y, end.y),
                                     max(start.x, end.x), max(start.y, end.y)))
            elif item[0] == "re":
                out.append(fitz.Rect(item[1]))
    return out


def _merge(rules, gap=3.0, tol=1.2):
    """Join rules drawn as several touching segments into one line."""
    rules.sort(key=lambda r: (round(r.y1, 1), r.x0))
    merged = []
    for rect in rules:
        if merged:
            last = merged[-1]
            if abs(last.y1 - rect.y1) <= tol and rect.x0 - last.x1 <= gap:
                merged[-1] = last | rect
                continue
        merged.append(fitz.Rect(rect))
    return merged


def rule_boxes(page):
    """Every drawn writing line that has a printed label to its left."""
    candidates = [r for r in _segments(page)
                  if r.height <= MAX_RULE_HEIGHT and r.width >= MIN_RULE_WIDTH]
    rules = _merge(candidates)
    words = page.get_text("words")
    out = []
    for rule in rules:
        if not _labelled(rule, words):
            continue
        out.append(rule)
    return out


def _labelled(rule, words):
    """Is there printed text immediately left of this line, on its own line?

    The word must end close to where the rule starts and sit on the rule rather
    than well above it -- a caption printed under the *previous* line would
    otherwise adopt every frame border on the page.
    """
    for x0, y0, x1, y1, text, *_ in words:
        if not text.strip():
            continue
        if not (0 <= rule.x0 - x1 <= LABEL_REACH):
            continue
        if -BASELINE_DROP <= rule.y1 - y1 <= BASELINE_DROP:
            return True
    return False


def square_boxes(page):
    """Every drawn option square: small, near-square, and nothing inside it."""
    out = []
    for rect in _segments(page):
        side = max(rect.width, rect.height)
        short = min(rect.width, rect.height)
        if not (SQUARE_MIN <= short and side <= SQUARE_MAX):
            continue
        if short <= 0 or side / short > SQUARE_RATIO:
            continue
        if page.get_text("text", clip=rect).strip():
            continue
        if any(abs(rect.x0 - kept.x0) < 1.5 and abs(rect.y0 - kept.y0) < 1.5
               for kept in out):
            continue
        out.append(fitz.Rect(rect))
    return out
