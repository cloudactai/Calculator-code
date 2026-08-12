"""Prefill binds for the BC templates, from widget names or printed captions.

BC does not share Ontario's heading vocabulary, so it does not share Ontario's
binder. The Supreme Court forms head with

    No.  ________            (the court file number)
    Registry  ________       (the registry the case is filed in)
    Claimant:  ________
    Respondent:  ________

and the Provincial Court forms ask the same things in the first person — "My
full name is", "The other party's full name is" — which is what their widget
names say (`full name of party`, `full name of other party`).

The two families are read differently because only one of them has names to
read: the Provincial forms are AcroForm, while the Supreme forms are XFA and
their flatten emits every field with an empty name, leaving the printed caption
as the only description of a box.

Both map onto the vocabulary `buildPrefillData` already produces. BC's claimant
is the party who starts the case, which is the matter's own client — the same
assumption the Ontario templates already make when they bind `applicant` to it.

**The registry line is deliberately left blank.** It names the registry the case
is filed in ("Vancouver"), and the matter has no such field: `court_info` holds
the court's name, its file number and its office address, and the reference list
the court is chosen from is served empty. Filling it from `courtName` would print
"Supreme Court of British Columbia" onto a line asking where the registry is, and
a wrong answer on a court document is worse than a blank one.
"""
import re

# --- Provincial Court: the government's own widget names ---------------------
#
# Every one of these was read against the printed page it sits on (Forms 3 and
# 16, "Part 1 | About the parties"), which is also what fixes the two dates:
# "My full name is" is followed by "My date of birth is", and "The other party's
# full name is" by "Their date of birth". Numbered variants (`full name of
# party 1`, `dob of party 2`) are left out — a numbered list of parties does not
# say which is the applicant.
WIDGET = {
    "court file number": "court_info.courtFileNumber",
    "full name of party": "applicant.fullLegalName",
    "full name of other party": "respondent.fullLegalName",
    "date of birth1": "applicant.dateOfBirth",
    "date of birth2": "respondent.dateOfBirth",
}

# `date of birth1` only means the applicant's when it is the date beside "My full
# name is", so it is taken only on a form that names the parties that way.
DOB = {"date of birth1", "date of birth2"}
DOB_REQUIRES = "full name of party"

# --- Supreme Court: the caption printed to the left of the box ---------------
#
# Left only, and exactly. "No." sits directly above the registry box on every one
# of these forms, so reading captions from above would fill the registry with the
# file number; and a loose match would catch "Court file no. of the other case".
# "Petitioner" is the claimant's name in a petition proceeding — the party who
# starts the case either way, so it maps where the claimant maps.
CAPTION = [
    (re.compile(r"^(court )?file (no|number)$"), "court_info.courtFileNumber"),
    (re.compile(r"^no$"), "court_info.courtFileNumber"),
    (re.compile(r"^(claimant|petitioner)$"), "applicant.fullLegalName"),
    (re.compile(r"^respondent$"), "respondent.fullLegalName"),
]

# A bare "No." is only the court file number up in the heading block, where BC
# prints it on the right. Lower down the same word numbers a list item.
HEADING_BOTTOM = 230.0
HEADING_LEFT = 300.0


def normalise(name):
    # Square brackets go with the whitespace: Forms F51 and F52 head their file
    # number "[File] Number:", the rules' convention for a blank to be filled in.
    text = re.sub(r"[\[\]]", "", (name or "").replace("’", "'"))
    return re.sub(r"\s+", " ", text).strip().lower().rstrip(":.")


def bind_for_widget(widget_name, names_on_form):
    """The bind for a Provincial Court widget name, or None."""
    name = normalise(widget_name)
    if name in DOB and DOB_REQUIRES not in names_on_form:
        return None
    return WIDGET.get(name)


def bind_for_caption(caption, box):
    """The bind for a Supreme Court box from the caption printed to its left."""
    text = normalise(caption)
    for pattern, bind in CAPTION:
        if not pattern.match(text):
            continue
        if text == "no" and not (box[1] < HEADING_BOTTOM and box[0] > HEADING_LEFT):
            return None
        return bind
    return None
