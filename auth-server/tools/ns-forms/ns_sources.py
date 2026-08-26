"""Nova Scotia family form sources.

`scrape_ns_index.py` writes `ns_sources.json` from the two pages the Courts of
Nova Scotia publish family forms on; this module reads it and adds the docId and
the picker category.

docId scheme: `NSSC_<formNo>` with the dot turned into an underscore for the
prescribed forms -- "59.07" -> NSSC_59_07, "60A.20A" -> NSSC_60A_20A -- and
`NSFD_<formNo>` for the practice-memorandum series (FD3 -> NSFD_FD3). Two
prefixes because the two families number independently: there is a Form 60A.3
and an FD 3.

## Scope

**84 forms**, the whole of what the court publishes for family proceedings:

| Rule | What it is | Forms |
| --- | --- | --- |
| 59 | Family Division Rules | 24 |
| 60A | Child and Adult Protection | 35 |
| 61 | Adoption | 4 |
| FD | Family Division Practice Memorandum | 21 |

Nova Scotia is the only province in this catalogue whose child-protection and
adoption forms are prescribed by the **court's own rules** rather than by a
regulation -- Rules 60A and 61 are part of the Civil Procedure Rules. So unlike
BC, SK and MB, there is no second batch to go and find: this is the complete
family set in one pass.

The other 30-odd Civil Procedure Rules are general civil and criminal
procedure and are out of scope, matching every other province here. Rule 82
(Administration of Civil Proceedings) is the one worth naming, because the
family forms *reference* it -- "complete the heading as required by Rule 82" --
but it is the standard-heading rule for all civil proceedings, not a family
form.

**Every source is a Word document.** No PDF edition exists, so each is rendered
through LibreOffice by `fetch_ns.py`. That makes the background ours rather than
the government's, which is worth remembering when a page looks wrong.
"""

import json
import os
import re

HERE = os.path.dirname(os.path.abspath(__file__))
SOURCES = os.path.join(HERE, "ns_sources.json")

COURT = "Supreme Court of Nova Scotia (Family Division)"

# Rule 59's forms, by function. Keyed on the form number because Rule 59 runs
# from the originating application through to the divorce order.
R59_CATEGORY = {
    "59.07": "Pleadings", "59.08": "Pleadings", "59.09": "Pleadings",
    "59.10": "Pleadings", "59.11": "Pleadings", "59.12": "Applications",
    "59.13": "Applications", "59.14": "Applications", "59.15": "Applications",
}

# The FD series is mostly financial: the Statements of Income, Property,
# Expenses, Special Expenses and Undue Hardship are the forms a matter's
# financial data actually fills.
FD_CATEGORY = {
    "FD1": "Parties", "FD2A": "Parenting", "FD2B": "Parenting",
    "FD3": "Financial", "FD4": "Financial", "FD5": "Financial",
    "FD6": "Financial", "FD7": "Financial", "FD11": "Financial",
    "FD8": "Applications", "FD9": "Affidavits",
    "FD10": "Case Management", "FD12": "Divorce & Judgment",
    "FD12A": "Divorce & Judgment", "FD12B": "Divorce & Judgment",
    "FD13": "Applications", "FD14": "Applications",
}

CATEGORY_ORDER = [
    "Pleadings",
    "Financial",
    "Parenting",
    "Parties",
    "Applications",
    "Case Management",
    "Affidavits",
    "Divorce & Judgment",
    "Child & Adult Protection",
    "Adoption",
    "Orders & Judgments",
    "Other",
]

SHIPPED_CATEGORIES = set(CATEGORY_ORDER)

# A Rule 60A or FDO form whose filename says it is an order goes to the orders
# folder rather than its rule's folder: a lawyer looks for "Supervision Order"
# under orders, not under child protection procedure.
ORDER_WORDS = re.compile(r"\border\b", re.I)


def doc_id(row):
    if row["family"] == "FD":
        return "NSFD_" + row["formNo"]
    return "NSSC_" + row["formNo"].replace(".", "_")


def category_of(row):
    rule, form_no = row["rule"], row["formNo"]
    if rule == "FD":
        if form_no.startswith("FDO"):
            return "Orders & Judgments"
        return FD_CATEGORY.get(form_no, "Other")
    if rule == "61":
        return "Adoption"
    if rule == "60A":
        return ("Orders & Judgments" if ORDER_WORDS.search(row["title"])
                else "Child & Adult Protection")
    return R59_CATEGORY.get(form_no, "Applications")


def sort_key(row):
    """Numeric where the number is numeric, so 60A.3 sorts before 60A.20."""
    match = re.match(r"^(?:FDO?)?(\d+)([A-Z]*)(?:\.(\d+)([A-Z]*))?$",
                     row["formNo"])
    if not match:
        return (999, "", 0, "")
    major, major_letter, minor, minor_letter = match.groups()
    return (int(major), major_letter or "", int(minor or 0), minor_letter or "")


def all_sources():
    raw = json.load(open(SOURCES))["forms"]
    out = []
    for row in raw:
        out.append({
            "formNo": row["formNo"],
            "docId": doc_id(row),
            "title": row["title"] or row["formNo"],
            "rule": row["rule"],
            "family": row["family"],
            "category": category_of(row),
            "url": row["url"],
            "court": COURT,
        })
    out.sort(key=lambda r: (CATEGORY_ORDER.index(r["category"]), sort_key(r)))
    return out


def shipped_sources():
    return [r for r in all_sources() if r["category"] in SHIPPED_CATEGORIES]
