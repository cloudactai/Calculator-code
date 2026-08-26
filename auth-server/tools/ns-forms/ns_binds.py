"""Prefill binds for the Nova Scotia templates, read off the printed page.

Nova Scotia heads its forms the same way Newfoundland does -- the party role is
printed to the **right** of the box, not to its left:

    Between: [copy standard heading]
             [name]                      Applicant
       and
             [name]                      Respondent[s]

so the same reading rule applies, and for the same reason: there is no widget
name to read here at all. Every Nova Scotia source is a Word document rendered
through LibreOffice, so the only description of a box is the text printed
around it.

**"Respondent[s]" is why the role match tolerates a trailing plural bracket.**
Nova Scotia prints the plural marker as its own token, so the text to the right
of the respondent's box reads "Respondent[s]" rather than "Respondent" -- and
`ns_anchors` deliberately does not treat `[s]` as a blank, so it stays part of
the printed caption.

**The court file number is not bound.** Nova Scotia prints "20___  No. ____" at
the head of every form with no token, no underscore run and no rule under it --
bare white space. Per the golden rule the batch follows everywhere, a blank with
no printed anchor gets no box, so there is no field there to bind.
"""
import re

# Read to the right of the box: the role word Nova Scotia prints there.
# Anchored and exact -- a loose match would catch "APPLICANT'S LAWYER" and the
# "SECOND APPLICANT" option beside it, neither of which is the applicant's name.
ROLE_RIGHT = [
    # The "( s)?" tail is the plural marker, and the space belongs *inside* the
    # optional group: Nova Scotia prints "Respondent[s]", which normalises to
    # "respondent s", while the applicant line is a bare "Applicant". Writing
    # this as "respondent s?" makes the space mandatory and silently matches
    # only the plural -- which is exactly what happened, binding 13 respondents
    # and not one applicant.
    (re.compile(r"^applicant( s)?$"), "applicant.fullLegalName"),
    (re.compile(r"^petitioner( s)?$"), "applicant.fullLegalName"),
    (re.compile(r"^respondent( s)?$"), "respondent.fullLegalName"),
]

# Read to the left of the box: the only caption worth taking from that side.
CAPTION_LEFT = [
    (re.compile(r"^court file (no|number)$"), "court_info.courtFileNumber"),
]

# "SECOND APPLICANT"/"SECOND RESPONDENT" and the possessive forms must never
# reach ROLE_RIGHT. Checked before matching rather than folded into the patterns
# so the reason stays visible.
ROLE_STOP = re.compile(r"\b(second|co-?applicant|co-?respondent|lawyer|solicitor|"
                       r"counsel|applicant's|respondent's)\b")


def normalise(text):
    text = re.sub(r"[\[\]]", " ", (text or "").replace("’", "'"))
    return re.sub(r"\s+", " ", text).strip().lower().rstrip(":.")


def bind_for_role(right_text):
    """The bind for a party box, from the role word printed to its right."""
    text = normalise(right_text)
    if not text or ROLE_STOP.search(text):
        return None
    for pattern, bind in ROLE_RIGHT:
        if pattern.match(text):
            return bind
    return None


def bind_for_caption(left_text):
    """The bind for a box from the caption printed to its left."""
    text = normalise(left_text)
    for pattern, bind in CAPTION_LEFT:
        if pattern.match(text):
            return bind
    return None
