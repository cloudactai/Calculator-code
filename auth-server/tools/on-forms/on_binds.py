"""Auto-bind the standard Ontario heading fields by widget name.

Ontario names its heading widgets consistently across the whole rule set — every
form carries "Court File Number", "Name of court", "Court office address" and,
where the parties are named, the long "…full legal name & address for service…"
captions. The XFA-authored forms use machine names instead, but those are still
semantic (`courtDetails[0].courtFileNumber[0]`), so the leaf is matched too.

Every bind path emitted here is one already in use by a shipped template, so no
new vocabulary is invented and no dead bind can be introduced. Anything not
recognised is left unbound: on a court document a wrong prefill is worse than no
prefill, which is why this file is a list of exact shapes rather than a fuzzy
matcher.
"""
import re

# Some forms split the party panel into four widgets instead of one block, so a
# bind has to be chosen per part; others keep the single combined caption.
PARTS = [
    # The combined caption, including the copies whose punctuation the government's
    # own field name has lost ("name  address  street  number municipality …").
    (re.compile(r"full legal name\s*&?\s*address for service|name\s*&\s*address"
                r"|name\s+address\s+street"), None),
    (re.compile(r"\bfull legal name\b|\bname\b"), "fullLegalName"),
    (re.compile(r"\bmunicipality\b"), "municipality"),
    (re.compile(r"\baddress\b"), "address"),
    (re.compile(r"\bphone\b|\bfax\b|\btelephone\b"), "phoneAndFax"),
    (re.compile(r"\be-?mail\b"), "email"),
]

BLOCK = "%s.fullLegalName,%s.address,%s.municipality,%s.phoneAndFax,%s.email"
PART_CAPTION_MAX = 30

# A box asking for one *part* of a name is not a `fullLegalName` box. Form 36A's
# "Applicant's last name" is the case in hand: the prefill vocabulary holds only
# the whole name, so filling it would print "Dana R. Okonkwo" into a surname-only
# cell. There is nothing correct to put there, so it is left blank and editable.
NAME_PART = re.compile(r"\b(?:last|first|given|middle|maiden|sur)\s*name\b|\bsurname\b|\binitials?\b")

COURT = [
    (re.compile(r"^court file (number|no)\b"), "court_info.courtFileNumber"),
    (re.compile(r"^name of court\b"), "court_info.courtName"),
    (re.compile(r"^court office address\b"), "court_info.courtOfficeAddress"),
]

# "Applicant(s) - ", "Respondent 2's ", "Applicant — " …: the party word, an
# optional plural marker, an optional ordinal, an optional possessive, and an
# optional dash, then whatever the widget actually holds.
PARTY = re.compile(r"^(applicant|respondent)(?:\(s\))?s?\s*(\d+)?\s*(?:'s|s')?\s*[-–—:]?\s*(.*)$")
LAWYER = re.compile(r"^lawyer(?:\(s\))?s?\s*(?:'s|s')?\s*[-–—:]?\s*(.*)$")

# XFA leaf name -> bind path. Only the heading leaves; body leaves are per-form.
XFA_LEAF = {
    "courtfilenumber": "court_info.courtFileNumber",
    "nameofcourt": "court_info.courtName",
    "courtofficeaddress": "court_info.courtOfficeAddress",
}

# `nameOfCourt` is the one leaf above the XFA forms reuse for blanks that are not
# the court's name at all: on Form 31 it is the "Applicant(s)/Recipient(s)"
# strike-out term, on Form 30B the swear/affirm word in "and I ____ that the
# following is true" and again in the page-2 jurat. All of those hang off a body
# subform, so it alone is required to sit in a heading container — enough to keep
# the court's name out of the middle of a sentence, while leaving the unambiguous
# `courtFileNumber` leaf free to match on continuation pages (`Master[0].Page2…`).
XFA_LEAF_HEADING_ONLY = {"nameofcourt"}
XFA_HEADING = re.compile(r"courtdetails|header", re.I)

# The XFA-authored forms name the general-heading party panel by its subform path
# instead of by caption: `…applicants[0].appliant[0].textfield[0]` is the
# applicant's own block, `…applicants[0].applicantLawyer[0].textfield[0]` the
# lawyer's. The government's spelling is inconsistent across the rule set
# ("appliant", "respondant", "laywer"), so every observed spelling is listed
# rather than guessed at.
XFA_ROLE = r"appliant|applicants?|respond[ae]nts?"
XFA_PERSON = re.compile(r"^(?:%s)$" % XFA_ROLE, re.I)
XFA_LAWYER = re.compile(r"^(?:%s)(?:la[wy]{2}er)s?$" % XFA_ROLE, re.I)


def normalise(name):
    return re.sub(r"\s+", " ", (name or "").replace("’", "'")).strip().lower().rstrip(":.")


def xfa_leaf(name):
    """'form1[0].page1[0].…courtDetails[0].courtFileNumber[0]' -> 'courtfilenumber'."""
    if "[" not in (name or ""):
        return None
    leaf = name.rsplit(".", 1)[-1]
    return re.sub(r"\[\d+\]", "", leaf).strip().lower()


def xfa_panel_bind(widget_name):
    """Bind for an XFA-named general-heading party panel widget, or None.

    Matches only `<role>[0].textfield[0]`, where `<role>` names the applicant, the
    respondent or either one's lawyer. Two deliberate exclusions, both checked
    against the printed page rather than the widget name:

    * `textfield[1]` is the panel's *second* row — the second applicant or
      respondent, whom a matter does not hold. It stays empty rather than
      repeating the first party, matching the ordinal rule in `party_bind`.
    * Forms 30A and 30B name their container `applicants[0]` but print
      "Recipient(s)" and "Payor" over it, and the support recipient is not
      necessarily the applicant. Their roles (`Recipient`, `Lawyer`, `Payor…`)
      are absent from the tables above, so they resolve to None and stay blank.
    """
    if "[" not in (widget_name or ""):
        return None
    segments = widget_name.split(".")
    if len(segments) < 2:
        return None
    leaf = re.match(r"^(.*?)\[(\d+)\]$", segments[-1].strip())
    if not leaf or leaf.group(1).lower() != "textfield" or leaf.group(2) != "0":
        return None
    role = re.sub(r"\[\d+\]$", "", segments[-2].strip())
    party = "applicant" if re.match(r"^appli", role, re.I) else "respondent"
    if XFA_LAWYER.match(role):
        prefix = "%ssLawyer" % party
    elif XFA_PERSON.match(role):
        prefix = party
    else:
        return None
    return BLOCK % ((prefix,) * 5)


def party_bind(name):
    """Bind for a party/lawyer panel widget, or None."""
    match = PARTY.match(name)
    if not match:
        return None
    party, ordinal, tail = match.group(1), match.group(2), match.group(3)
    # A matter holds one applicant and one respondent, so only the first of a
    # numbered set can be prefilled; "Respondent 2" must stay empty rather than
    # repeat respondent 1's details.
    if ordinal and ordinal != "1":
        return None
    if NAME_PART.search(tail):
        return None
    lawyer = LAWYER.match(tail)
    if lawyer:
        prefix, tail = "%ssLawyer" % party, lawyer.group(1)
    else:
        prefix = party
    for pattern, part in PARTS:
        if not pattern.search(tail):
            continue
        if part is None:
            return BLOCK % ((prefix,) * 5)
        # A single-part caption is short ("phone & fax", "full legal name"). A long
        # one is asking for something else that merely contains the word — Form 33's
        # "name and position within the children's aid society" is not a legal name.
        return "%s.%s" % (prefix, part) if len(tail) <= PART_CAPTION_MAX else None
    return None


def bind_for(widget_name):
    """Return the bind path for a widget name, or None to leave it unbound."""
    name = normalise(widget_name)
    if not name:
        return None
    # A signature is drawn, not typed; the export deliberately leaves those blank.
    if "signature" in name:
        return None
    for pattern, bind in COURT:
        if pattern.search(name):
            return bind
    bind = party_bind(name)
    if bind:
        return bind
    leaf = xfa_leaf(widget_name)
    if leaf in XFA_LEAF:
        if leaf not in XFA_LEAF_HEADING_ONLY or XFA_HEADING.search(widget_name):
            return XFA_LEAF[leaf]
    return xfa_panel_bind(widget_name)
