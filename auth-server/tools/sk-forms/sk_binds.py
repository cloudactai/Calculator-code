"""Prefill binds for the Saskatchewan templates, from the printed caption.

Every Part 15 form opens with the same four-line heading, and 39 of the 40 print
it identically:

    COURT FILE NUMBER   ______________________
    COURT OF KING'S BENCH FOR SASKATCHEWAN
    (FAMILY LAW DIVISION)
    JUDICIAL CENTRE     ______________________
    PETITIONER          ______________________
    RESPONDENT          ______________________

The caption is printed to the **left** of its blank, so that is where it is read
from -- and only from there. Reading captions from above would bind the wrong
box, exactly as it would on the BC Supreme forms.

These map onto the vocabulary `buildPrefillData` already produces
(`auth-server/src/routes/formsRoutes.js`), which is province-agnostic: the
resolver reads bind paths out of the document's own map, so only the data roots
have to be right. Saskatchewan's petitioner is the party who starts the case,
which is the matter's client, so it binds to `applicant` -- the same assumption
the Ontario and BC templates already make.

**JUDICIAL CENTRE is deliberately left blank**, for the reason BC's registry
line is. It names the judicial centre the proceeding is filed in ("Regina",
"Saskatoon"); the matter has no such field, and `court_info` holds the court's
*name*. Filling it from `courtName` would print "Court of King's Bench for
Saskatchewan" onto a line asking which centre, and a wrong answer on a court
document is worse than a blank one.

**Numbered and plural parties are skipped**: Form 15-100A heads a joint petition
"CO-PETITIONERS", and "PETITIONER (1)" / "PETITIONER (2)", none of which say
which party is the matter's client. Form 15-82's "PETITIONER/RESPONDENT" is
ambiguous by construction -- the filer strikes out the one that does not apply.

**The child-protection and adoption forms bind nothing, and that is the expected
result rather than a gap waiting to be filled.** All 105 binds are on Part 15.
Neither of the other two families prints that heading block at all: they open
"Judicial Centre of______" -- the one line Part 15 also refuses -- and then name
their parties in running prose ("In the matter of an application for the adoption
of______", "I,______, an officer pursuant to The Child and Family Services Act").

Where those forms do label a party, the label is printed *underneath* the rule,
as "(name(s) of applicant(s))" or "(name of birth parent or guardian)", and this
module reads captions from the left only -- deliberately, see above. Binding off
an underneath-caption would be a new rule with its own failure mode, on documents
where a wrong name is worse than a blank one: the "applicant" on an adoption
application is the prospective adoptive parent, and a child-protection proceeding
is brought by the ministry against a parent, so neither maps onto the matter's
applicant/respondent the way a petitioner does.
"""
import re

CAPTION = [
    (re.compile(r"^court file (no|number)$"), "court_info.courtFileNumber"),
    (re.compile(r"^petitioner$"), "applicant.fullLegalName"),
    (re.compile(r"^applicant$"), "applicant.fullLegalName"),
    (re.compile(r"^respondent$"), "respondent.fullLegalName"),
]

# How far left of a box its caption may be printed, and how far off the box's own
# line. Measured on the heading block: the caption ends around x 250 and the rule
# starts at 345, so the gap runs to about 100pt on the widest of them.
CAPTION_MAX_GAP = 110.0
CAPTION_MAX_DRIFT = 6.0


def normalise(name):
    text = (name or "").replace("’", "'")
    return re.sub(r"\s+", " ", text).strip().lower().rstrip(":.")


def bind_for_caption(caption):
    """The bind for a box from the caption printed to its left, or None."""
    text = normalise(caption)
    for pattern, bind in CAPTION:
        if pattern.match(text):
            return bind
    return None
