"""Prefill binds for the Newfoundland templates, read off the printed page.

Newfoundland heads its family forms with a style of cause that names each party
by a word printed to the **right** of the box, not to its left:

    BETWEEN:  [________________]  APPLICANT
    AND:      [________________]  RESPONDENT
    AND:      [________________]  [] NOT APPLICABLE  [] SECOND APPLICANT ...

so the party role is read from the right, which is the opposite of BC (whose
Supreme forms are captioned from the left) and of Saskatchewan (likewise). That
difference is the whole reason this province needs its own binder rather than
BC's.

**Widget names are not trusted here, and the reason is measurable.** Acrobat
auto-named these fields from whatever text sat nearest when the form was built,
so the applicant's box on Form F4.03A is called `between` and the respondent's
is called `and` -- and `and` occurs 41 times across the batch on boxes that have
nothing to do with a party. The word printed beside the box is what a filer
actually reads, so that is what is matched. This is the Ontario lesson ("a
widget's name can lie ... check the printed page, not the name") applied before
it could cost a defect rather than after.

**The court file number is deliberately left alone on most forms.** Newfoundland
prints it inside a panel headed "FOR COURT USE ONLY" and, on the forms we
checked, publishes no widget inside that panel at all -- the registry completes
it. Where a form *does* offer a file-number box outside that panel it is bound,
matched on its own printed caption.

The second-party line ("SECOND APPLICANT" / "SECOND RESPONDENT", offered beside
a "NOT APPLICABLE" tick) is **not** bound: the matter has one applicant and one
respondent, and there is nothing to say which of the two roles a second party
would take. Same position BC's numbered-party lines are in.
"""
import re

# Read to the right of the box: the role word Newfoundland prints there.
# Anchored and exact -- a loose match would catch "APPLICANT'S LAWYER" and the
# "SECOND APPLICANT" option beside it, neither of which is the applicant's name.
ROLE_RIGHT = [
    (re.compile(r"^applicant$"), "applicant.fullLegalName"),
    (re.compile(r"^petitioner$"), "applicant.fullLegalName"),
    (re.compile(r"^respondent$"), "respondent.fullLegalName"),
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


# The emergency-protection set is captioned the other way round -- "Applicant
# _______", with the role to the LEFT of the line and the date of birth to the
# right of it. That is the Provincial Court's own convention on those twelve
# forms and nowhere else in Newfoundland, so it is matched only for them
# (`rebind_nl_forms` gates it on the docId) rather than loosened into
# ROLE_RIGHT, where it would start reading "APPLICANT" off the *previous*
# party's line on every Supreme Court style of cause.
ROLE_LEFT = [
    (re.compile(r"^applicant$"), "applicant.fullLegalName"),
    (re.compile(r"^respondent$"), "respondent.fullLegalName"),
]


def bind_for_role_left(left_text):
    """The bind for a party box captioned on its left (protection orders)."""
    text = normalise(left_text)
    if not text or ROLE_STOP.search(text):
        return None
    for pattern, bind in ROLE_LEFT:
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
