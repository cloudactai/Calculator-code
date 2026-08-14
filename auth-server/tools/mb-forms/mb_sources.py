"""Manitoba King's Bench (Family Division) form sources -- Rule 70.

Published by Manitoba Justice on the province's own legislation site, which
serves each form from a stable slug built out of the form number:

    Form 70D    -> https://web2.gov.mb.ca/laws/rules/70de.pdf
    Form 70D.1  -> https://web2.gov.mb.ca/laws/rules/70d1e.pdf

The slug is the form number lower-cased with the dot removed, plus the language
letter. That is derivable rather than recorded per form -- unlike Saskatchewan,
where the download needs a product and format id out of a database -- so there
is nothing here to go stale except the numbers themselves.

docId scheme: MBKB_<formNo> with the dot turned into an underscore --
"70D" -> MBKB_70D, "70D.1" -> MBKB_70D_1. The MBKB_ prefix keeps these clear of
Ontario's FormNN, BC's BCSC_/BCPC_ and Saskatchewan's SKKB_.

**Scope.** All 43 Rule 70 family forms are recorded here, because the fetcher
verifies the whole published set in one pass and a form that quietly disappears
from the government site is worth finding out about early. Only the categories in
`SHIPPED_CATEGORIES` are built, catalogued and bound; the rest are recorded and
not yet reviewed. Rule 70A (the civil parts) and the probate forms are out of
scope, matching the Ontario, BC and Saskatchewan catalogues.
"""

BASE = "https://web2.gov.mb.ca/laws/rules/%se.pdf"

COURT = "King's Bench"

# Categories built and catalogued right now. Everything else in FORMS is
# recorded, fetched and verified, but not turned into a template.
SHIPPED_CATEGORIES = {"Financial"}

# (formNo, title, category, pages)
# `pages` is what the government's file actually carries, checked on every fetch;
# a change there means the form was amended and the mapping needs re-reviewing.
FORMS = [
    # -- Financial ---------------------------------------------------------
    ("70D", "Financial Statement", "Financial", 8),
    ("70D.1", "Demand for Financial Information", "Financial", 3),
    ("70D.5", "Comparative Family Property Statement", "Financial", 6),
    ("70U", "Summary of Assets and Liabilities", "Financial", 13),
    ("70W", "Recalculation and Enforcement Information Form", "Financial", 1),
    # -- Pleadings ---------------------------------------------------------
    ("70A", "Petition for Divorce", "Pleadings", 11),
    ("70A.1", "Joint Petition for Divorce", "Pleadings", 10),
    ("70B", "Petition", "Pleadings", 11),
    ("70J", "Answer", "Pleadings", 7),
    ("70K", "Reply to Answer and Petition for Divorce", "Pleadings", 5),
    ("70L", "Notice Withdrawing Opposition", "Pleadings", 1),
    # -- Applications ------------------------------------------------------
    ("70E", "Notice of Application", "Applications", 6),
    ("70E.1", "Notice of Application for Exclusive Occupation Order", "Applications", 3),
    ("70E.3", "Notice of Application for Special Relief under the Divorce Act (Canada)",
     "Applications", 6),
    ("70F", "Notice of Application for Guardianship", "Applications", 6),
    ("70G", "Notice of Application to Vary", "Applications", 10),
    ("70H", "Notice of Motion to Vary", "Applications", 10),
    ("70H.1", "Notice of Opposition to Variation", "Applications", 6),
    ("70H.2", "Notice of Motion to Vary Family Arbitration Award", "Applications", 4),
    ("70Q", "Notice of Motion", "Applications", 1),
    ("70BB", "Request for Emergent Hearing", "Applications", 2),
    # -- Case Management ---------------------------------------------------
    ("70D.2", "Request for Triage Conference", "Case Management", 2),
    ("70D.3", "Certificate of Prerequisite Completion", "Case Management", 5),
    ("70D.4", "Triage Brief", "Case Management", 8),
    ("70R", "Motion Brief", "Case Management", 3),
    ("70S.3", "Trial Readiness Certificate", "Case Management", 4),
    ("70T", "Request for Adjournment", "Case Management", 1),
    ("70Z", "Notice of Hearing", "Case Management", 3),
    ("70DD", "Request for Motion or Subsequent Case Conference", "Case Management", 2),
    # -- Service -----------------------------------------------------------
    ("70C", "Acknowledgment of Service", "Service", 1),
    ("70I", "Affidavit of Service", "Service", 2),
    # -- Affidavits --------------------------------------------------------
    ("70E.2", "Affidavit for Exclusive Occupation Order", "Affidavits", 4),
    ("70M", "Affidavit of Petitioner's Evidence", "Affidavits", 4),
    ("70M.1", "Joint Petitioner Affidavit", "Affidavits", 5),
    # -- Orders & Judgments ------------------------------------------------
    ("70N", "Order", "Orders & Judgments", 2),
    ("70O", "Divorce Judgment", "Orders & Judgments", 2),
    ("70O.1", "Divorce Judgment on Joint Petition for Divorce", "Orders & Judgments", 2),
    ("70P", "Certificate of Divorce", "Orders & Judgments", 1),
    ("70CC", "Notice of Appeal from an Associate Judge for a Family Proceeding under "
     "Case Management Process", "Orders & Judgments", 2),
    # -- Enforcement -------------------------------------------------------
    ("70X", "Enforcement Opt-out", "Enforcement", 1),
    ("70Y", "Notice of Satisfaction", "Enforcement", 1),
    # -- Other -------------------------------------------------------------
    ("70V", "Explanatory Note", "Other", 2),
    ("70AA", "Notice of Change of Name", "Other", 1),
]

CATEGORY_ORDER = [
    "Financial",
    "Pleadings",
    "Applications",
    "Case Management",
    "Service",
    "Affidavits",
    "Orders & Judgments",
    "Enforcement",
    "Other",
]


def doc_id(form_no):
    return "MBKB_" + form_no.replace(".", "_")


def slug(form_no):
    """The government's own filename stem: "70D.1" -> "70d1"."""
    return form_no.replace(".", "").lower()


def all_sources():
    """Every Rule 70 form as a dict, in catalogue order."""
    out = []
    for form_no, title, category, pages in FORMS:
        out.append({
            "docId": doc_id(form_no),
            "formNo": form_no,
            "title": title,
            "court": COURT,
            "category": "King's Bench - " + category,
            "shortCategory": category,
            "sourceFile": "%se.pdf" % slug(form_no),
            "expectedPages": pages,
            "url": BASE % slug(form_no),
            "shipped": category in SHIPPED_CATEGORIES,
        })
    return out


def shipped_sources():
    """The forms built, catalogued and bound in this batch."""
    return [s for s in all_sources() if s["shipped"]]
