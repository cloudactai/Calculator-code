"""Find Manitoba's printed option marks and measure them off the page.

Manitoba writes a tickable option in two vocabularies, and neither is a drawn
square, so `build_mb_forms.py`'s checkbox detector (which looks for printed
vector squares, the way BC and Saskatchewan set theirs) finds nothing on any of
the five forms:

  - a **bracket pair** `[ ]` — two ArialMT glyphs with only spaces between them
    (Forms 70D, 70D.1);
  - a **`☐` glyph** in SegoeUISymbol (Form 70W).

Both are text, so the mark's position comes from the glyph, per guide §2: the
printed glyph wins, and the candidate is then refined to the actual rendered
ink, because a text glyph's *font* box is materially taller than the mark it
draws (`☐` measures 8.6 x 12.8 as a font box and 7.0 x 7.0 as ink).

The two false friends this has to refuse, both real on Form 70W p1:

  - `[Note: The Maintenance Enforcement Program cannot register…]` — a bracketed
    *sentence*. Its `[` and `]` are 459pt apart with a paragraph between them.
  - the same shape at a smaller size in `[Please check the box below…]`.

So a bracket pair qualifies only when everything between the brackets is
whitespace **and** the pair is no wider than a line of type is tall.
"""
import fitz

GLYPHS = set("☐☑☒□▢❑❏❒")

# A tick is about as wide as the type is tall; the bracketed sentences on 70W
# p1 span 459pt and 461pt, so there is three decades of clear air in this cut.
MAX_MARK_WIDTH = 20.0
# Render zoom for the ink measurement. 8x puts ~100 device pixels across a 12pt
# mark, so the bounding box of the dark pixels is good to about an eighth of a
# point.
INK_ZOOM = 8.0
INK_DARK = 160


def _spans(page):
    for block in page.get_text("rawdict")["blocks"]:
        if block.get("type", 0) != 0:
            continue
        for line in block.get("lines", []):
            for span in line["spans"]:
                yield span


_CHARS = {}


def _chars(page):
    """Every printed character on the page as (char, Rect), memoised.

    `ink_box` needs this to mask a neighbour's ink out of a mark's font box, and
    it is called once per mark -- 47 of them on Form 70A's pages. Re-parsing
    `rawdict` each time made a full 43-form verify pass take minutes.
    """
    key = (page.parent.name, page.number)
    if key not in _CHARS:
        _CHARS[key] = [(char["c"], fitz.Rect(char["bbox"]))
                       for span in _spans(page)
                       for char in span.get("chars", [])
                       if char["c"].strip()]
    return _CHARS[key]


def candidates(page):
    """Every printed option mark on the page, as (kind, font-box, own glyphs).

    Reading order, which is the order the options are printed in.
    """
    found = []
    for span in _spans(page):
        chars = span.get("chars", [])
        for i, char in enumerate(chars):
            if char["c"] in GLYPHS:
                box = fitz.Rect(char["bbox"])
                found.append(("glyph", box, [box]))
                continue
            if char["c"] != "[":
                continue
            for j in range(i + 1, len(chars)):
                if chars[j]["c"] == "]":
                    own = [fitz.Rect(char["bbox"]), fitz.Rect(chars[j]["bbox"])]
                    box = own[0] | own[1]
                    if box.width <= MAX_MARK_WIDTH:
                        found.append(("bracket", box, own))
                    break
                if chars[j]["c"].strip():
                    break  # printed text between the brackets: a citation, not a tick
    found.sort(key=lambda c: (round(c[1].y0, 1), c[1].x0))
    return found


def _is_own(rect, own):
    return any(abs(rect.x0 - o.x0) < 0.01 and abs(rect.y0 - o.y0) < 0.01 for o in own)


def ink_box(page, box, own):
    """Shrink `box` to the ink the mark's own glyphs print inside it.

    Guide §2.4 lets ink shrink a candidate freely. Growing is what needs the
    care, and nothing here needs to grow: a font box always contains its own
    glyph, so the measurement can only come back smaller.

    Which is why the probe clips to the font box exactly, with no padding —
    Manitoba sets the four Part 1-4 sub-options on Form 70D.1 p2 at a 12.7pt
    pitch around a 12.31pt font box, so even a 1pt pad reaches the brackets of
    the row below and returned those four 0.38pt taller than the eleven
    identical marks around them.

    Padding is not the only way a neighbour gets in, though: on Form 70W p1 the
    `[` that opens `[Please check the box below…]` sits *inside* the font box of
    the `☐` on the line beneath it, and raw ink returned that mark 8.12 x 12.00
    where the square it draws is 8.12 x 8.12. So any character that is not one
    of the mark's own glyphs is masked out before the pixels are read.
    """
    clip = fitz.Rect(box)
    pix = page.get_pixmap(matrix=fitz.Matrix(INK_ZOOM, INK_ZOOM), clip=clip,
                          colorspace=fitz.csGRAY)
    masked = [r for _, r in _chars(page)
              if not _is_own(r, own) and not (r & clip).is_empty]

    def is_neighbour_ink(px, py):
        point = fitz.Point(clip.x0 + (px + 0.5) / INK_ZOOM,
                           clip.y0 + (py + 0.5) / INK_ZOOM)
        return any(r.contains(point) for r in masked)

    data = pix.samples
    x0 = y0 = None
    x1 = y1 = -1
    for row in range(pix.height):
        base = row * pix.stride
        for col in range(pix.width):
            if data[base + col] > INK_DARK:
                continue
            if masked and is_neighbour_ink(col, row):
                continue
            if x0 is None or col < x0:
                x0 = col
            if x1 < col:
                x1 = col
            if y0 is None:
                y0 = row
            y1 = row
    if x0 is None:
        return None
    return fitz.Rect(clip.x0 + x0 / INK_ZOOM, clip.y0 + y0 / INK_ZOOM,
                     clip.x0 + (x1 + 1) / INK_ZOOM, clip.y0 + (y1 + 1) / INK_ZOOM)


def mark_box(page, kind, font_box, own):
    """The square a tick should occupy, measured off the printed mark.

    A `☐` comes out of the ink measurement square already. A `[ ]` does not —
    it is a pair of thin brackets, taller than the air between them — so guide
    §2.5 applies: take the mark's own smaller dimension as the side and centre
    the square on the ink.
    """
    ink = ink_box(page, font_box, own) or font_box
    side = min(ink.width, ink.height)
    cx, cy = (ink.x0 + ink.x1) / 2, (ink.y0 + ink.y1) / 2
    return fitz.Rect(cx - side / 2, cy - side / 2, cx + side / 2, cy + side / 2)


_CACHE = {}


def marks(page):
    """(kind, font_box, square) for every option mark on the page.

    Memoised per (file, page). Measuring a mark renders a pixmap, and both the
    builder and two separate verifier checks ask for the same page's marks, so
    without this a 43-form verify pass re-rendered every mark on every page
    several times over.
    """
    key = (page.parent.name, page.number)
    if key not in _CACHE:
        _CACHE[key] = [(kind, box, mark_box(page, kind, box, own))
                       for kind, box, own in candidates(page)]
    return _CACHE[key]
