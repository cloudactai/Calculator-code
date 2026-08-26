"""New Brunswick family form sources.

Published by the Court of King's Bench, Family Division, which lists them on one
page and serves them from two hosts: the printed form from `www2.gnb.ca` and the
fillable one from Service New Brunswick's forms repository at `pxw1.snb.ca`.
`scrape_nb_index.py` records both links per form in `nb_sources.json`; this
module reads that and adds the docId and the picker category.

docId scheme: NBKB_<formNo> -- "72D" -> NBKB_72D, "73AA" -> NBKB_73AA. The NBKB_
prefix keeps these clear of Ontario's FormNN, BC's BCSC_/BCPC_, Saskatchewan's
SKKB_, Manitoba's MBKB_ and Newfoundland's NLSC_.

**Neither filename is derivable from the form number** -- 72D is served as
`Form_72D.pdf`, 72C as `CSS-FOL-SNB-45-9048E.pdf`, 72A as
`FORM-fillable-72a-b.pdf`. There is no pattern to reconstruct, which is why the
links are scraped and recorded rather than built. Manitoba's slugs *are*
derivable; New Brunswick's are not, and pretending otherwise silently fetches
the wrong form.

## Scope

The whole of the court's own Family Division forms page -- **34 forms** across
the three family rules plus the five general-procedure forms the court lists
there because a family proceeding uses them:

| Rule | What it is | Forms |
| --- | --- | --- |
| 72 | Divorce Proceedings | 72A-72O, 72U |
| 73 | Family Division | 73A, 73AA, 73F, 73G, 73H, 73I |
| 81 | Family Law Rule (case-management districts) | 81A-81C, 81F-81I |
| 7, 18, 25, 37, 47 | general procedure, listed by the court on its family page | 7A, 18A, 37A, 47B |

The civil rules and the probate forms are out of scope, matching the Ontario,
BC, Saskatchewan, Manitoba and Newfoundland catalogues.

> **What is recorded but not shipped.** The court's page also links two
> *regulations* -- NB Reg 2021-18 (Family Law Act forms) and NB Reg 81-134
> (Family Services Act forms, which is where child protection lives) -- each
> carrying its own schedule of forms as continuous enacted text. Those are a
> separate batch on the pattern BC batch 3, SK adoption and MB batch 2 all
> follow: cut each form out of the consolidation at its own enacting heading.
> They are not excluded by decision, just not built yet.
>
> The page also links six `.docx` drafting aids (a notice of application, a
> notice of motion, two affidavits and four draft orders under the federal
> FOAEAA). Those are Word templates a lawyer edits rather than a prescribed
> form with blanks to fill, so they take the Nova Scotia LibreOffice path if
> they are ever wanted.
"""

import json
import os
import re

HERE = os.path.dirname(os.path.abspath(__file__))
SOURCES = os.path.join(HERE, "nb_sources.json")

COURT = "Court of King's Bench (Family Division)"

# Form number -> picker folder, keyed on the form rather than the rule: Rule 72
# alone runs from the petition through the financial statement to the divorce
# judgment, so grouping by rule would put a Certificate of Divorce in the same
# folder as a Petition.
CATEGORY = {
    "72A": "Pleadings", "72B": "Pleadings", "72C": "Service",
    "72D": "Pleadings", "72E": "Pleadings", "72F": "Pleadings",
    "72G": "Pleadings", "72H": "Pleadings", "72I": "Pleadings",
    "72J": "Financial", "72K": "Divorce & Judgment",
    "72L": "Divorce & Judgment", "72M": "Divorce & Judgment",
    "72N": "Divorce & Judgment", "72O": "Divorce & Judgment",
    "72FF": "Affidavits", "72U": "Applications",
    "73A": "Applications", "73AA": "Applications", "73F": "Applications",
    "73G": "Financial", "73H": "Pleadings", "73I": "Appeals",
    "81A": "Applications", "81B": "Affidavits", "81C": "Pleadings",
    "81F": "Motions to Change", "81G": "Motions to Change",
    "81H": "Motions to Change", "81I": "Motions to Change",
    "7A": "Parties", "18A": "Service", "25A": "Other",
    "37A": "Applications", "47B": "Trial",
}

CATEGORY_ORDER = [
    "Pleadings",
    "Financial",
    "Applications",
    "Motions to Change",
    "Service",
    "Affidavits",
    "Parties",
    "Trial",
    "Divorce & Judgment",
    "Appeals",
    "Other",
]

SHIPPED_CATEGORIES = set(CATEGORY_ORDER)


def doc_id(form_no):
    return "NBKB_" + form_no


def sort_key(form_no):
    match = re.match(r"^(\d{1,2})([A-Z]{1,2})$", form_no)
    if not match:
        return (999, form_no)
    return (int(match.group(1)), match.group(2))


def all_sources():
    """Every family form as a dict, in catalogue order."""
    raw = json.load(open(SOURCES))["forms"]
    out = []
    for row in raw:
        form_no = row["formNo"]
        out.append({
            "formNo": form_no,
            "docId": doc_id(form_no),
            "title": row["title"],
            "rule": row["rule"],
            "category": CATEGORY.get(form_no, "Other"),
            # Prefer the fillable link: it is the AcroForm carrying the
            # government's own widget rectangles. Several rows whose label is
            # just the form number are *already* served from the SNB fillable
            # host, so what actually comes back is classified on fetch rather
            # than assumed from which link was taken.
            "url": row["fillable"] or row["printed"],
            "hasFillable": bool(row["fillable"]),
            "court": COURT,
        })
    out.sort(key=lambda r: (CATEGORY_ORDER.index(r["category"]),
                            sort_key(r["formNo"])))
    return out


def shipped_sources():
    return [r for r in all_sources() if r["category"] in SHIPPED_CATEGORIES]
