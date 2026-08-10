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


def normalise(name):
    return re.sub(r"\s+", " ", (name or "").replace("’", "'")).strip().lower().rstrip(":.")


def xfa_leaf(name):
    """'form1[0].page1[0].…courtDetails[0].courtFileNumber[0]' -> 'courtfilenumber'."""
    if "[" not in (name or ""):
        return None
    leaf = name.rsplit(".", 1)[-1]
    return re.sub(r"\[\d+\]", "", leaf).strip().lower()


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
        return XFA_LEAF[leaf]
    return None
