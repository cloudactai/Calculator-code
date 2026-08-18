"""Prefill binds for the Manitoba templates, from the printed caption.

Manitoba's style of cause reads differently from every other province in the
catalogue, and that is the whole substance of this file. Ontario, BC and
Saskatchewan all print the caption to the **left** of its blank:

    COURT FILE NUMBER   ______________________
    PETITIONER          ______________________

Manitoba prints the party captions **underneath**, and splits them over two
lines -- the kind of blank it is, then who the party is:

    File # FD _______________          <- captioned from the left, like the others

    BETWEEN:
                    ____________________
                       (full name)
                                             petitioner
                        - and -
                    ____________________
                       (full name)
                                             respondent

So a bind is read from the left caption where there is one, and otherwise from
the pair below: a `(full name)` note immediately under the blank, and the role
word under that. Both parts are required. `(full name)` alone says only that a
person's name goes on the line -- Form 70D's deponent line and Form 70U's
"I, ______ of the ______ of ______" are also captioned that way, and neither is a
party to bind -- and the role word alone is 25pt of blank page away from any
number of other rules.

These map onto the vocabulary `buildPrefillData` already produces
(`auth-server/src/routes/formsRoutes.js`), which is province-agnostic: the
resolver reads bind paths out of the document's own map, so only the data roots
have to be right. Manitoba's petitioner is the party who starts the case, which
is the matter's client, so it binds to `applicant` -- the same assumption the
Ontario, BC and Saskatchewan templates already make.

Deliberately left unbound
-------------------------

**The judicial centre** ("______ Centre"), for the reason BC's registry line and
Saskatchewan's JUDICIAL CENTRE are. It names the centre the proceeding is filed
in ("Winnipeg", "Brandon"); the matter has no such field, and `court_info` holds
the court's *name*. Filling it from `courtName` would print "The King's Bench" on
a line asking which centre, and a wrong answer on a court document is worse than
a blank one.

**Form 70W's two contact tables.** The form collects a full identity -- address,
date of birth, social insurance number, mother's maiden name -- for the "person
required to make payments" and again for the "person entitled to receive
payments". Which of those is the matter's client depends on the support order,
which the matter does not record, and the failure mode is not a blank line: it is
one party's social insurance number printed under the other party's name, on a
form that goes to the Maintenance Enforcement Program.

**Strike-out and role-neutral captions.** Form 70D's "FINANCIAL STATEMENT OF
______ (Petitioner/Respondent)", Form 70U's "the initiating party/responding
party" and Form 70D.1's "(specify full name of the party who is to provide
information)" are all filled in by striking out the part that does not apply.
None of them says which party is the client.
"""
import re

# A caption printed to the left of its blank, as on every other province's forms.
# Manitoba writes the file number three ways across the batch -- "File # FD",
# "File No: FD" and "File #" -- and the "FD" is the Family Division prefix the
# registry stamps, not part of the number, so it is matched and discarded.
CAPTION = [
    (re.compile(r"^file\s*(#|no\.?|number)?\s*:?\s*(fd)?$"), "court_info.courtFileNumber"),
]

# The role word printed under a `(full name)` note. Manitoba pairs the roles
# differently on different forms -- a petition has a petitioner, an application
# has an applicant, and several forms caption the same line "petitioner/applicant"
# because either may have started the case -- but all of them are the party who
# began the proceeding, which is the matter's client.
ROLE = [
    (re.compile(r"^(co-)?petitioners?(/applicants?)?,?$"), "applicant.fullLegalName"),
    (re.compile(r"^applicants?(/petitioners?)?,?$"), "applicant.fullLegalName"),
    (re.compile(r"^respondents?,?$"), "respondent.fullLegalName"),
]

# The note that marks a blank as somebody's name. Required before a role word is
# read, so a role word standing on its own cannot claim an unrelated rule.
FULL_NAME = re.compile(r"^\(\s*full name\s*\)\s*,?$", re.I)

# The child-protection and adoption forms print no `(full name)` note: the style
# of cause is bare paper closed by the role word alone, which is what
# `build_mb_forms.style_of_cause_bands` places its box above. The **trailing
# comma or full stop is required** -- it is the whole difference between the
# style of cause and the signature caption printed with the same word, and
# `build_mb_forms.MB_PARTY_CAPTION` reads it the same way from the other side.
STYLE_ROLE = re.compile(r"^(co-)?(petitioner|applicant|respondent)s?(\(s\))?"
                        r"(/(petitioner|applicant|respondent)s?)?\s*[,.]$", re.I)
# How far above the role word its blank may sit. `style_of_cause_bands` sets a
# 14pt box 2pt clear of the word, and trims the top where "- and -" is close.
STYLE_MAX_GAP = 20.0

# Prefixes whose style of cause is **not** bound, and why.
#
# **Child protection (`MBCFS_`, `MBCA_`).** The petitioner on a Form CFS-19
# petition is the child and family services agency and the respondents are the
# parents -- the reverse of every other form in the catalogue, where the party
# who starts the case is the matter's client. The matter has no field for the
# agency, so binding the style of cause here would print the client's name as
# the agency bringing a protection proceeding against them, and their own name
# would be missing from the respondent line where it belongs. Which side the
# client is on is a fact about the retainer that the matter does not record.
#
# Adoption (`MBAD_`, `MBFA_`) is bound: the applicant is the person seeking to
# adopt, which is the client, on the same assumption Rule 70 already makes.
UNBOUND_STYLE_PREFIXES = ("MBCFS_", "MBCA_")

# How far left of a box its caption may be printed, and how far off the box's own
# line. Measured on the file-number line: the caption ends around x 440 and the
# rule starts at 449, so the gap is small, but Form 70U sets the same line with a
# tab and needs 60pt.
CAPTION_MAX_GAP = 80.0
CAPTION_MAX_DRIFT = 6.0

# The `(full name)` note sits immediately under its blank -- 2 to 4pt across the
# batch. The judicial-centre blank on Form 70D.1 has one 40pt below it, belonging
# to the party line further down the page, so the window is deliberately tight.
NAME_MAX_GAP = 8.0
# The role word then follows within a line or two: 11 to 24pt measured.
ROLE_MAX_GAP = 34.0
# How far the role word may sit to the right. Manitoba sets it against the right
# margin, 130pt clear of a blank that starts at the centre of the page.
ROLE_MAX_OFFSET = 260.0


def normalise(name):
    text = (name or "").replace("’", "'")
    return re.sub(r"\s+", " ", text).strip().lower().rstrip(".")


def bind_for_caption(caption):
    """The bind for a box from the caption printed to its left, or None."""
    text = normalise(caption).rstrip(":")
    for pattern, bind in CAPTION:
        if pattern.match(text):
            return bind
    return None


def bind_for_role(role):
    """The bind for a box from the role word printed below its `(full name)` note."""
    text = normalise(role)
    for pattern, bind in ROLE:
        if pattern.match(text):
            return bind
    return None


def is_full_name_note(text):
    return bool(FULL_NAME.match(normalise(text)))


def is_style_role(text):
    """A style-of-cause role word, which closes a party's line and is punctuated."""
    return bool(STYLE_ROLE.match(re.sub(r"\s+", " ", (text or "").strip())))


def binds_style_of_cause(doc_id):
    """Whether this form's style of cause names the matter's own parties."""
    return not doc_id.startswith(UNBOUND_STYLE_PREFIXES)
