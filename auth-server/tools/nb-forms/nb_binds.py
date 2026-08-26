"""Prefill binds for the New Brunswick templates.

New Brunswick's widget names are far better than Newfoundland's -- the forms
carry real names like `court file number`, `applicant` and `respondent` rather
than Acrobat's guess at the nearest text. **They still lie**, and the way they
lie is the reason nothing here binds on a name alone:

    Form 81A page 6:  widget "APPLICANT",  caption printed to its left: "Age:"
    Form 81A page 7:  widget "RESPONDENT", caption printed to its left: "Age:"

Those two are columns of a parties table, not name lines. Binding them on the
name would print the applicant's full legal name into a box asking for an age,
on a sworn court document. So a party name is bound only when the widget name
**and** the page agree:

* it is in the **heading block** -- page 1, above `HEADING_BOTTOM`, which is
  where every one of these forms sets its style of cause; and
* the caption printed to its left does not disqualify it (age, date of birth,
  occupation, address and the rest of `CAPTION_STOP`).

The court file number needs no such corroboration: `court file number` is
printed in the header on 23 of the 34 forms, means only one thing, and has no
second sense anywhere in the batch.

This is Ontario's "a widget's name can lie ... check the printed page, not the
name", applied as a rule rather than as a patch after the fact -- and it is the
second province in this batch where it caught a real mis-bind before it shipped.
"""
import re

WIDGET_FILE_NUMBER = {"court file number", "court file no", "file number"}

# A widget name that *may* mean a party's name, subject to the heading test.
WIDGET_APPLICANT = {"applicant", "between", "petitioner"}
WIDGET_RESPONDENT = {"respondent"}

# The style of cause sits at the top of page 1 on every form in this batch;
# 81A's Age columns are on pages 6 and 7. Measured against the batch: the
# lowest genuine party line is Form 73A's respondent at y = 298.
HEADING_PAGE = 1
HEADING_BOTTOM = 340.0

# If any of these is printed to the left of the box, the widget's name is not
# describing what the box holds.
CAPTION_STOP = re.compile(
    r"\b(age|date of birth|dob|occupation|address|phone|telephone|fax|email|"
    r"e-mail|postal|city|province|employer|income|amount|lawyer|solicitor|"
    r"counsel|relationship|birth)\b", re.I)


def normalise(text):
    text = re.sub(r"[\[\]]", " ", (text or "").replace("’", "'"))
    return re.sub(r"\s+", " ", text).strip().lower().rstrip(":.")


def bind_for(widget_name, field, left_caption):
    """The bind for one field, or None.

    `field` is the overlay field (for its page and y), `left_caption` the text
    printed immediately to its left.
    """
    name = normalise(widget_name)
    if not name:
        return None
    if name in WIDGET_FILE_NUMBER:
        return "court_info.courtFileNumber"

    if name not in WIDGET_APPLICANT and name not in WIDGET_RESPONDENT:
        return None
    # Party names: only in the heading block, and only if the printed caption
    # does not say the box holds something else.
    if field["page"] != HEADING_PAGE or field["y"] > HEADING_BOTTOM:
        return None
    if CAPTION_STOP.search(left_caption or ""):
        return None
    if name in WIDGET_APPLICANT:
        return "applicant.fullLegalName"
    return "respondent.fullLegalName"
