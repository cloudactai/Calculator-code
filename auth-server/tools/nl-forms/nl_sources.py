"""Newfoundland and Labrador family form sources.

Published by the Supreme Court of Newfoundland and Labrador on its own site,
listed in one HTML table per rule at

    https://www.court.nl.ca/supreme/rules-practice-notes-and-forms/family/general/

`scrape_nl_index.py` turns that table into `nl_sources.json`; this module reads
the JSON and adds the two things the page does not carry -- the docId and the
picker category.

docId scheme: NLSC_<formNo> with the dot turned into an underscore --
"F4.03A" -> NLSC_F4_03A, "F16A.03B" -> NLSC_F16A_03B. The NLSC_ prefix keeps
these clear of Ontario's FormNN, BC's BCSC_/BCPC_, Saskatchewan's SKKB_ and
Manitoba's MBKB_.

## Scope

The **Family Rules** of the Supreme Court, Family Division -- every form the
court's Family Law Forms page publishes, 62 in all. That is the whole page:
45 rule-numbered forms and 17 the court publishes with no number (the order
templates, the three FOAEAA orders, "Affidavit (Family Law)", "Subpoena",
"Settlement Conference Brief" and the representation notices). The unnumbered
ones are ordinary filing documents rather than drafting aids, so they are in
scope on the same footing; they simply get a slug for a docId.

Civil, criminal, probate and guardianship proceedings are out of scope, matching
the Ontario, BC, Saskatchewan and Manitoba catalogues -- the court lists those
under their own "Civil" and "Criminal" tabs.

**Every source is a real AcroForm.** Newfoundland's forms carry the
government's own widget rectangles (Form F10.02A alone has 306), so the overlay
is built by the widget path -- `bc_pipeline.extract` over the government
geometry -- and never by the printed-anchor detectors Saskatchewan and Manitoba
need. There is no XFA and nothing to flatten headlessly.
"""

import json
import os
import re

HERE = os.path.dirname(os.path.abspath(__file__))
SOURCES = os.path.join(HERE, "nl_sources.json")

COURT = "Supreme Court (Family Division)"

# Rule number -> picker folder. Keyed on the rule the form number carries, so a
# new form lands in the right folder without being listed here. Matched longest
# first, which is what keeps "16A" (the FOAEAA affidavits) out of "16".
RULE_CATEGORY = [
    ("4A", "Pleadings"),
    ("4", "Pleadings"),
    ("5", "Pleadings"),
    ("6", "Pleadings"),
    ("7", "Pleadings"),
    ("8", "Service"),
    ("10", "Financial"),
    ("11", "Disclosure"),
    ("14", "Case Management"),
    ("16A", "Interjurisdictional & FOAEAA"),
    ("16", "Applications"),
    ("17", "Applications"),
    ("18", "Applications"),
    ("19", "Applications"),
    ("23", "Settlement"),
    ("25", "Settlement"),
    ("26", "Divorce & Judgment"),
    ("27", "Trial"),
    ("28", "Trial"),
    ("29", "Trial"),
    ("31", "Trial"),
    ("32", "Affidavits"),
    ("34", "Orders & Judgments"),
    ("35", "Interjurisdictional & FOAEAA"),
    ("38", "Return of Child"),
    ("40", "Divorce & Judgment"),
]

# The unnumbered rows, keyed by their slug. Without this they would all land in
# "Other", which would bury the three order templates a lawyer reaches for most.
SLUG_CATEGORY = {
    "ORDER_BLANK": "Orders & Judgments",
    "ORDER_SUPPORT_TEMPLATE": "Orders & Judgments",
    "ORDER_OTHER_THAN_SUPPORT_TEMPLATE": "Orders & Judgments",
    "ORDER_FOAEAA_ENFORCE_PARENTING_OR_CONTACT": "Interjurisdictional & FOAEAA",
    "ORDER_FOAEAA_ESTABLISH_OR_VARY_SUPPORT": "Interjurisdictional & FOAEAA",
    "ORDER_FOAEAA_ENFORCE_SUPPORT": "Interjurisdictional & FOAEAA",
    "AFFIDAVIT_FAMILY_LAW": "Affidavits",
    "AFFIDAVIT_FILING_CONTRACTS_AND_AGREEMENTS": "Affidavits",
    "SETTLEMENT_CONFERENCE_BRIEF": "Settlement",
    "SETTLEMENT_CONFERENCE_SHORT_NOTICE_LIST": "Settlement",
    "REQUEST_FOR_CERTIFICATE_OF_DIVORCE": "Divorce & Judgment",
    "REQUEST_FOR_EARLIER_DATE_OF_EFFECT_FOR_A": "Divorce & Judgment",
    "NOTICE_OF_INTENTION_TO_ACT_IN_PERSON": "Representation",
    "NOTICE_OF_REPRESENTATION_BY_A_LAWYER": "Representation",
    "NOTICE_OF_CHANGE_OF_LAWYER": "Representation",
    "SUBPOENA": "Trial",
    "UNDERTAKING_TO_OBTAIN_ACCESS_TO_COURT_FILE": "Other",
}

CATEGORY_ORDER = [
    "Pleadings",
    "Financial",
    "Disclosure",
    "Service",
    "Applications",
    "Case Management",
    "Settlement",
    "Trial",
    "Affidavits",
    "Orders & Judgments",
    "Divorce & Judgment",
    "Interjurisdictional & FOAEAA",
    "Return of Child",
    "Representation",
    "Other",
]

# Categories built, catalogued and bound right now. Every category ships; the
# set is kept rather than replaced by a boolean because it is the switch a
# future batch (child protection, adoption) would be added through.
SHIPPED_CATEGORIES = set(CATEGORY_ORDER)


def doc_id(form_no):
    return "NLSC_" + form_no.replace(".", "_")


def rule_of(form_no):
    """The rule a numbered form belongs to: "F16A.03B" -> "16A"."""
    match = re.match(r"^F(\d+[A-Z]?)\.", form_no)
    return match.group(1) if match else None


def category_of(form_no, numbered):
    if not numbered:
        return SLUG_CATEGORY.get(form_no, "Other")
    rule = rule_of(form_no)
    for prefix, category in RULE_CATEGORY:
        if rule == prefix:
            return category
    return "Other"


def all_sources():
    """Every family form as a dict, in catalogue order."""
    raw = json.load(open(SOURCES))["forms"]
    out = []
    for row in raw:
        form_no = row["formNo"]
        category = category_of(form_no, row["numbered"])
        out.append({
            "formNo": form_no,
            "docId": doc_id(form_no),
            "title": row["title"],
            "numbered": row["numbered"],
            "category": category,
            "url": row["pdf"] or row["word"],
            "isWord": not row["pdf"],
            "court": COURT,
        })
    out.sort(key=lambda r: (CATEGORY_ORDER.index(r["category"]), sort_key(r)))
    return out


def sort_key(row):
    """Within a folder: numbered forms by rule then sub-number, then the rest."""
    if not row["numbered"]:
        return (1, 0, 0, row["formNo"])
    match = re.match(r"^F(\d+)([A-Z]?)\.(\d+)([A-Z]?)$", row["formNo"])
    if not match:
        return (0, 999, 0, row["formNo"])
    rule, rule_letter, sub, sub_letter = match.groups()
    return (0, int(rule), rule_letter, "%03d%s" % (int(sub), sub_letter))


def shipped_sources():
    return [r for r in all_sources() if r["category"] in SHIPPED_CATEGORIES]
