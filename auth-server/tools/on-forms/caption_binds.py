"""Read a field's caption off the printed page, for forms that carry no widget names.

Two sets of templates have boxes but nothing to bind them by: the ten Ontario
forms the government publishes only as Word (their PDFs carry no AcroForm layer,
so `place_flat_fields` drew the boxes from the printed page), and the BC Supreme
forms, whose XFA flatten emits every field with an empty name. For both, the only
description of a box is the caption printed next to it — so that is what is read
here, and then handed to the *same* `on_binds` vocabulary the AcroForm forms use.
Nothing new is invented: a caption has to resolve to a bind path already shipped.

Geometry note: a stored field's `width`/`height` are display units, 1.5x the PDF
points that `x`/`y` are in (`bc_pipeline.SCALE`, and `FillPdf.jsx` divides by the
same 1.5 when it draws). Everything here works in real points, or a two-column
party panel would look like one box spanning the whole page.

Only the general heading is read. It is the block every form shares, its captions
are fixed by the rules, and it is what the matter actually holds; body captions
are per-form and are left to a human.
"""
import collections
import re

import on_binds

SCALE = 1.5

# How far from a box to look for its caption, in points. A caption sits directly
# against its box — the Ontario heading runs ~13pt lines — so these are tight on
# purpose: a wider reach starts picking up the row above or the paragraph below.
ABOVE = 34.0
BELOW = 20.0
LEFT = 70.0
PANEL = 90.0

# "(Name of court)" and "(Court office address)" are printed in parentheses on
# most forms and bare on others; the vocabulary matches the bare form.
STRIP = re.compile(r"^[\s(\[]+|[\s)\].:;,]+$")

# The panel heading naming whose block a party box belongs to. "Applicant(s)",
# "Respondent(s)", and the enforcement forms' "Applicant(s)/Recipient(s)" and
# "Respondent/Payor" — for those the applicant/respondent term is the one the
# government's own widget names use elsewhere, and the form tells the filer to
# strike out whichever does not apply.
# `\b` cannot be used to close this: after "Applicant(s)" the next characters are
# ")" and " ", both non-word, so there is no boundary there at all. A negative
# lookahead for a letter is what actually ends the word — and it still admits
# "Applicant(s)/Recipient(s)" and "Respondent/Payor".
# A comma is excluded along with the letters because the column-scoped look can
# clip a printed sentence mid-way and leave it starting on a party word: Form 34H's
# "(If there is a respondent, the first letter of the respondent's surname may be
# used)" becomes "respondent, the first letter…", which is prose, not a heading.
PARTY_HEADING = re.compile(r"^(applicant|respondent)(?:\(s\)|s)?(?![A-Za-z,])\s*", re.I)

# A grid heading is a label — "Applicant(s)", "Applicant(s) Lawyer" — never a
# sentence. The panel forms' longer headings still reach the block path, which
# does not go through here.
GRID_HEADING_MAX = 40

# The two columns of the general-heading party panel. Matched anywhere in the
# caption rather than at its start, because the 34-series prints an extra
# parenthetical in the same band ("Applicant(s) (The first letter of the
# applicant's surname may be used)") which arrives ahead of the column wording.
# Both phrases are long and specific enough to carry that: Form 13C's body cells
# say "Full legal name:", which is not "full legal name & address for service".
# Which side of its box each heading caption is printed on. The rules put the
# file number's label over its box, and the court's name and office address
# under theirs — inside the ruled heading block, each caption sits beneath the
# line it describes.
COURT_SIDE = {
    "court_info.courtFileNumber": "above",
    "court_info.courtName": "below",
    "court_info.courtOfficeAddress": "below",
}

PANEL_PERSON = re.compile(r"full legal name\s*&\s*address for service", re.I)
PANEL_LAWYER = re.compile(r"lawyer'?s?\s*name\s*&\s*address", re.I)


def rect(field):
    """The field's real PDF-point box: (x0, y0, x1, y1)."""
    return (field["x"], field["y"],
            field["x"] + field["width"] / SCALE,
            field["y"] + field["height"] / SCALE)


def lines(words):
    """Group (x0, y0, x1, y1, text) words into printed lines, top down."""
    rows = collections.defaultdict(list)
    for x0, y0, x1, y1, text in words:
        rows[round(y0 / 3.0)].append((x0, y1, text))
    out = []
    for key in sorted(rows):
        row = sorted(rows[key])
        out.append((max(w[1] for w in row), " ".join(w[2] for w in row)))
    return out


def near(words, box, where):
    """Words in the band `where` of `box`, as a single caption string."""
    x0, y0, x1, y1 = box
    picked = []
    for wx0, wy0, wx1, wy1, text in words:
        if where == "above":
            fits = y0 - ABOVE <= wy1 <= y0 + 2 and wx1 > x0 - 6 and wx0 < x1 + 6
        elif where == "below":
            fits = y1 - 2 <= wy0 <= y1 + BELOW and wx1 > x0 - 6 and wx0 < x1 + 6
        else:
            fits = x0 - LEFT <= wx1 <= x0 + 2 and wy1 > y0 and wy0 < y1
        if fits:
            picked.append((wx0, wy0, wx1, wy1, text))
    return " ".join(t for _, t in lines(picked))


def clean(text):
    """Caption text in the same shape the widget-name vocabulary expects.

    `on_binds.normalise` is reused rather than reimplemented — it lowercases,
    collapses whitespace and, importantly here, folds the typographic apostrophe
    the forms actually print, so "Lawyer's name & address" matches.
    """
    return STRIP.sub("", on_binds.normalise(text))


def party_heading(words, box):
    """The panel heading a party box sits under, as (party, heading text).

    Tried column-scoped first, then across the row. Form 13C stacks both headings
    of a row on one printed line — "Applicant(s)" over the left column and
    "Applicant(s) Lawyer" over the right — so only the words above *this* box say
    which of the two it belongs to. The panel forms are the other way round: one
    "Applicant(s)" at the left margin governs both the party and the lawyer
    column, and a scoped look finds nothing above the lawyer box at all.
    """
    x0, y0, x1 = box[0], box[1], box[2]
    band = [w for w in words if y0 - PANEL <= w[3] <= y0 + 2]
    scoped = [w for w in band if w[2] > x0 - 6 and w[0] < x1 + 6]
    for candidates, is_scoped in ((scoped, True), (band, False)):
        for _, text in reversed(lines(candidates)):
            match = PARTY_HEADING.match(clean(text))
            if match:
                return match.group(1), clean(text), is_scoped
    return None, None, False


def grid_bind(words, box, party, heading, scoped):
    """A bind for one cell of a labelled party grid, or None.

    Form 13C sets the panel out as a small table instead of one free block —
    "Full legal name:", "Address:", "Phone & fax:", "Email:" down the side, a
    column for the party and another for their lawyer — so the row label to the
    box's left names the *part* to fill. Composing that with the column heading
    hands the whole thing to the existing vocabulary ("applicant lawyer - full
    legal name" -> `applicantsLawyer.fullLegalName`); `party_bind`'s own length
    guard then throws out any label too long to be a row label.
    """
    # Only when the heading sits over this box's own column. Otherwise the row-wide
    # fallback reaches boxes that merely follow a panel: the 34-series prints "My
    # name is (full legal name)" below its respondent panel, and that deponent is
    # not the respondent.
    if not scoped or len(heading or "") > GRID_HEADING_MAX:
        return None
    label = clean(near(words, box, "left"))
    if not label:
        return None
    lawyer = "lawyer" in (heading or "")
    return on_binds.bind_for("%s%s - %s" % (party, " lawyer" if lawyer else "", label))


def bind_for_field(words, field):
    """The bind for one field from the captions printed around it, or None."""
    box = rect(field)
    if field["type"] == "CheckBox":
        return None

    # The heading's own three boxes, each looked for on the side the rules
    # actually print it. Searching both sides is what goes wrong: "Court office
    # address" is printed *under* its box, which on Forms 15D and 17G leaves it
    # only ~8pt above the party panel's first box, and that box would take it.
    for pattern, bind in on_binds.COURT:
        if pattern.search(clean(near(words, box, COURT_SIDE[bind]))):
            return bind

    # A party panel box: the column caption says whether it is the party's own
    # block or their lawyer's, and the panel heading says which party.
    column = clean(near(words, box, "above"))
    party, heading, scoped = party_heading(words, box)
    if not party:
        return None
    if not column:
        return grid_bind(words, box, party, heading, scoped)
    # The panel heading often shares the caption band with its column ("Applicant(s)
    # Full legal name & address for service — …"), so drop it before matching.
    column = clean(PARTY_HEADING.sub("", column))
    # Only the panel's own two captions are accepted, and only from the start of
    # what is left. A body cell that merely sits under a party heading and happens
    # to mention a name or an address — Form 13C's net-family-property table is
    # full of them, and Form 25C's "Date of Order" box is one — matches neither.
    person, lawyer = PANEL_PERSON.search(column), PANEL_LAWYER.search(column)
    # Both would mean the caption band has caught two columns at once and there is
    # no way to tell which this box belongs to, so nothing is filled.
    if person and lawyer:
        return None
    if person:
        prefix = party.lower()
    elif lawyer:
        prefix = "%ssLawyer" % party.lower()
    else:
        return grid_bind(words, box, party, heading, scoped)
    return on_binds.BLOCK % ((prefix,) * 5)
