"""Newfoundland's *Provincial Court* family forms -- a second court, not a second rule.

The 62 forms in `nl_sources.py` are all Supreme Court (`NLSC_*`). That is only
half of Newfoundland's family practice: **outside the Avalon Peninsula and the
west coast, a family application is filed in the Provincial Court instead**,
under its own Family Rules and its own forms. A matter in Labrador or central
Newfoundland cannot be started on any form the catalogue held before this batch.

The Provincial Court Family Rules govern proceedings under the Adoption Act,
Change of Name Act, Children's Law Act, **Children, Youth and Families Act**,
Family Law Act, Interjurisdictional Support Orders Act, Adult Protection Act,
Marriage Act and Support Orders Enforcement Act -- which also answers the
question the migration notes left open about where Newfoundland's
child-protection forms live. They live here, in the general application set: the
same Form 1 and Supporting Affidavit start a protection proceeding as start a
support one, which is why there is no separate protection form family to find.

## The set: 34 forms

| Group | Forms | docId |
| --- | --- | --- |
| Family application | 16 | `NLPC_*` |
| Adult adoption | 6 | `NLPC_AF*` |
| Emergency protection orders | 12 | `NLEPO_*` |

The **emergency protection order** forms are the Provincial Court's own set
under the *Family Violence Protection Act* -- an EPO is a family remedy heard by
a judge on an ex parte basis, and BC (6), Manitoba (3) and Saskatchewan (2)
already ship their equivalents. They are published on their own page rather than
the family forms page, which is why the first pass did not see them.

Out of scope on those same pages, and for the reason every province applies:
peace bonds (criminal), small claims, and the duty-judge schedule (a court
timetable, not a form).

## Source format

Everything is a PDF published by the court itself, so the background ships as
the government's own file. The batch is **mixed**, which the fetch gate records
per form rather than assuming:

* most of the family set carries the court's own AcroForm widgets -- the widget
  path, as for the Supreme Court set;
* the Financial Information Sheet and the whole EPO set carry **no widget layer
  at all** and take the printed-anchor path, over three vocabularies at once --
  underscore runs, drawn rules and drawn squares, and the U+2610 tick glyph.
  See `nl_pc_anchors.py`.
"""

COURT = "Provincial Court of Newfoundland and Labrador (Family)"

FILES = "https://www.court.nl.ca/provincial/files/"

# (docId, file stem, title, category)
#
# Order is the court's own order on its page: an application, what supports it,
# what answers it, then the orders that come out of it.
_FAMILY = [
    ("NLPC_FORM1", "Com_FORM1", "Application", "Pleadings"),
    ("NLPC_SUPPORTING_AFFIDAVIT", "SupportingAFFIDAVIT",
     "Supporting Affidavit", "Affidavits"),
    ("NLPC_SCHEDULE_A", "COM_SCHEDULEA", "Schedule A", "Pleadings"),
    ("NLPC_SCHEDULE_B", "COM_SCHEDULEB", "Schedule B", "Pleadings"),
    ("NLPC_SCHEDULE_C", "COM_SCHEDULEC", "Schedule C", "Pleadings"),
    ("NLPC_SCHEDULE_D", "COM_SCHEDULED", "Schedule D", "Pleadings"),
    ("NLPC_FORM2", "Com_FORM2", "Notice to Respondent", "Service"),
    ("NLPC_FORM3", "COM_FORM3",
     "Acknowledgement and Affidavit of Service", "Service"),
    ("NLPC_FORM4", "Com_FORM4", "Response", "Pleadings"),
    ("NLPC_FORM5", "Com_FORM5", "Reply to Response", "Pleadings"),
    ("NLPC_FORM6", "Com_FORM6",
     "Notice of Conference or Hearing", "Case Management"),
    ("NLPC_FORM7", "Com_FORM7",
     "Notice of Discontinuance or Withdrawal", "Pleadings"),
    ("NLPC_FORM8A", "Com_FORM8A",
     "Consent Order for Child Support (Without Recalculation)",
     "Orders & Judgments"),
    ("NLPC_FORM8B", "Com_FORM8B",
     "Consent Order for Child Support (With Recalculation)",
     "Orders & Judgments"),
    # The one form that prints neither the court's name nor "Labrador": it is a
    # clause to paste into an order, not a document filed on its own, so the
    # fetch gate identifies it by its own heading instead.
    ("NLPC_RECALCULATION_CLAUSE", "Recalculation-Clause",
     "Recalculation Clause", "Orders & Judgments"),
    ("NLPC_FINANCIAL_INFORMATION_SHEET", "fin-info-sheet",
     "Financial Information Sheet", "Financial"),
]

# The adult adoption set. Newfoundland numbers these AF001-AF006 in the
# filenames and prints no number on the page, so the docId keeps the court's
# own file number -- it is the only identifier the set has.
_ADOPTION = [
    ("NLPC_AF001", "AF001_Notice_of_Hearing_2014", "Notice of Hearing"),
    ("NLPC_AF002", "AF002_Consent_of_Adult_2014", "Consent of Adult"),
    ("NLPC_AF003", "AF003_Affidavit_of_Applicant", "Affidavit of Applicant"),
    ("NLPC_AF004", "AF004_Dispense_with_Consent_of_Adult_2014",
     "Dispense with Consent of Adult"),
    ("NLPC_AF005", "AF005_-_Application_for_Adult_Adoption_2014",
     "Application for Adult Adoption"),
    ("NLPC_AF006", "AF006_Adoption_Order", "Adoption Order"),
]

# Emergency protection orders, Family Violence Protection Act. Numbered 001-012
# by the court; the fax cover sheet is included because the court prescribes it
# as part of the filing (an EPO application is filed by fax out of hours).
_EPO = [
    ("NLEPO_001", "form001f", "Fax Cover Sheet"),
    ("NLEPO_002", "form002f", "Application for Emergency Protection Order"),
    ("NLEPO_003", "form003f",
     "Evidence in Support of Application for a Protection Order"),
    ("NLEPO_004", "form004f", "Emergency Protection Order"),
    ("NLEPO_005", "form005f",
     "Application for Substitute Service or to Dispense with Service"),
    ("NLEPO_006", "form006f",
     "Sworn Statement in Support of Application for Substituted Service or "
     "Dispensing with Service"),
    ("NLEPO_007", "form007f", "Application"),
    ("NLEPO_008", "form008f", "Affidavit of Service"),
    ("NLEPO_009", "form009f", "Application for Leave to Call Witnesses"),
    ("NLEPO_010", "form010f", "Reply"),
    ("NLEPO_011", "form011f", "Notice of Hearing"),
    ("NLEPO_012", "form012f", "Notice of Abandonment"),
]

# Two categories the Supreme Court set does not use. `nl_sources.CATEGORY_ORDER`
# carries both so the picker orders them with the rest rather than dropping them
# into "Other".
CATEGORY_ADOPTION = "Adoption"
CATEGORY_EPO = "Protection Orders"

# A phrase off the form's own face, for the one form that prints neither the
# court's name nor the province.
IDENTIFY = {"NLPC_RECALCULATION_CLAUSE": "recalculation clause"}


def all_sources():
    out = []
    for doc_id, stem, title, category in _FAMILY:
        out.append({"docId": doc_id, "stem": stem, "title": title,
                    "category": category, "group": "family"})
    for doc_id, stem, title in _ADOPTION:
        out.append({"docId": doc_id, "stem": stem, "title": title,
                    "category": CATEGORY_ADOPTION, "group": "adoption"})
    for doc_id, stem, title in _EPO:
        out.append({"docId": doc_id, "stem": stem, "title": title,
                    "category": CATEGORY_EPO, "group": "epo"})
    for row in out:
        row["url"] = FILES + row["stem"] + ".pdf"
        row["court"] = COURT
        row["identify"] = IDENTIFY.get(row["docId"])
    return out


def shipped_sources():
    return all_sources()
