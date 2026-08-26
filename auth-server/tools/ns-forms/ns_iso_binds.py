"""Which ISO boxes carry a prefill bind, and why almost none of them do.

The answer for this batch is **one field on one form**, and that is the correct
answer rather than a gap. Three things about the ISO forms are unlike every
other family batch in the catalogue:

* **The parties are not an applicant and a respondent in a style of cause.**
  An ISO form is an administrative package that travels between designated
  authorities, so it opens "the **Claimant** (name of the person applying for
  the order)" and "the **Respondent**". There is no "Between: ... Applicant"
  heading to read a role off, which is what `ns_binds` and `nl_binds` do.

* **Party names are split into three boxes** -- (First Name), (Middle Name),
  (Last Name) -- on Forms A.1 through A.4 and on Form L. The bind vocabulary
  carries `applicant.fullLegalName` and nothing finer, so a bind here would
  print the whole name into the box captioned *First Name* and leave the other
  two empty. Refusing is the smaller error, and it is the same judgment the
  Newfoundland and New Brunswick builders make when a name and a page disagree.

* **The court file numbers on these forms are usually not this matter's.** The
  A-series prints "Court File #" twice in a header table marked *(For office
  use only)*, filled by the designated authority in each jurisdiction, and the
  government puts no widget there at all. Form K prints a *Court File Number*
  column listing the **existing orders** being varied, up to five rows, which
  may be from another province entirely -- writing the current file number into
  those rows would be a false statement on a document that goes to a court.

What is left is the Notice to Set Aside Registration, a Nova Scotia pleading in
the ordinary shape: "Court file:" printed at the head of the page with a single
box beside it.

The corroboration rule from New Brunswick still applies -- a widget name is
matched only when the **printed page agrees** -- and it is what keeps Form K's
rows out: their column heading sits above the boxes, not to their left, so the
caption test never fires on them.
"""
import re

# The caption printed to the LEFT of the box, normalised.
COURT_FILE_CAPTION = re.compile(r"court\s*file(\s*(no|number|#))?\s*:?\s*$", re.I)

# The government's own widget name.
COURT_FILE_NAME = re.compile(r"^court\s*file(\s*(no\.?|number|#))?$", re.I)

# A name ending in a row marker belongs to a table of other people's orders, not
# to this proceeding. Kept as an explicit refusal so Form K cannot start binding
# if the court ever moves its column heading to the left of the boxes.
ROW_NAME = re.compile(r"row\s*\d+$", re.I)


def normalise(text):
    return re.sub(r"\s+", " ", text or "").strip()


def bind_for(widget_name, field, left_caption):
    """The bind for one box, or None.

    Both the widget name and the printed caption must agree, and the field must
    be a single line rather than a writing block.
    """
    name = normalise(widget_name)
    if not name or ROW_NAME.search(name):
        return None
    if not COURT_FILE_NAME.match(name):
        return None
    if not COURT_FILE_CAPTION.search(normalise(left_caption)):
        return None
    return "court_info.courtFileNumber"
