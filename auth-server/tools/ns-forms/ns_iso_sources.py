"""Nova Scotia's Interjurisdictional Support Orders (ISO) forms.

A second Nova Scotia batch, and a different kind of document from the first.
The 84 forms in `ns_sources.py` are the court's own rule-prescribed forms,
published as Word only and read through the printed-anchor detectors. The ISO
forms are **fillable PDFs carrying the government's own widget rectangles**, so
this batch runs the widget path (`tools/acroform_seat.py`), the same one
Newfoundland and New Brunswick use.

## Why they were missing

They are not on `courts.ns.ca` at all. The ISO forms are published by the
Department of Justice's family law information service on **`nsfamilylaw.ca`**,
under the ISO topic pages rather than under "Court Forms", so the scrape of the
court's two forms pages could not have found them. They are prescribed by the
*Interjurisdictional Support Orders Act*, S.N.S. 2002, c. 9 -- a statute, not a
Civil Procedure Rule -- which is why Nova Scotia turns out to have a second
regulation-side batch after all, like BC, SK, MB and NB.

An ISO application is how a Nova Scotia parent gets support from a payor in
another province or country, and how a claimant abroad gets an order made here.
Without them the catalogue could open a divorce but not a cross-border support
claim.

## The set: 18 forms

The lettered forms A.1 through L are the pan-Canadian ISO forms as Nova Scotia
publishes them (the same lettering every reciprocating jurisdiction uses), plus
three the province adds:

| Form | What it is |
| --- | --- |
| A.1 / A.2 | Support application / variation application, ISO Act |
| A.3 / A.4 | Support application / variation application, Divorce Act |
| B | Parentage |
| C | Child support claim |
| D | Request for a support order where the respondent files nothing |
| E | Request for child support different than the table amount |
| F | Special or extraordinary expense claim |
| G | Request to *pay* child support different than the table amount |
| H | Support for the claimant/applicant |
| I | Financial information |
| J | Child status and financial statement |
| K | Evidence to support variation of a support order |
| L | Respondent's response to application |
| -- | ISO affidavit |
| -- | Additional locate information |
| -- | Notice to set aside registration of an order made outside Canada |

### What is deliberately left out

* **Form 59.13B, Request to Convert, already ships** as `NSSC_59_13B` in the
  Rule 59 set. The ISO pages link it because converting a foreign order is part
  of the ISO process, but it is a Civil Procedure Rule form and this batch must
  not publish a second copy of it under a different docId.
* **The fifteen "Guide for Form ..." PDFs are instructions, not forms.** They
  are prose explaining how to complete a form, with no blanks; the catalogue
  ships documents a filer types into.
* **CPR Form 31.05.16.08, Affidavit of Service**, is linked from the responding
  page. It is the general civil affidavit of service used in every kind of
  proceeding, from a Civil Procedure Rule outside the family rules -- the same
  boundary that keeps the other 30-odd rules out of `ns_sources.py`. It is also
  a Word document, so it would need the other path.
* **Form A.4 is also published as `ISO Form A4.docx`** on the CDN. The fillable
  PDF is used, as for every other form here.

## Source note

Nova Scotia publishes these as real AcroForms -- measured, not assumed: Form I
carries 313 widgets over 9 pages and no XFA. That is the opposite of Prince
Edward Island, whose fillable PDFs are LiveCycle XFA shells with no widget layer
at all. So here the background is **the government's own file**, flattened,
rather than a LibreOffice render of a Word document, which makes this batch
stronger than the 84 beside it.
"""

COURT = "Supreme Court of Nova Scotia (Family Division)"

BASE = "https://www.nsfamilylaw.ca/sites/default/files/editor-uploads/"
FORMS = BASE + "Court%20Forms/"

# Every ISO form lands in one picker category. They are a self-contained
# procedure -- a filer is either running an ISO application or is not -- and
# splitting Form I into "Financial" beside FD3 would scatter a set that is only
# ever used together.
CATEGORY = "Interjurisdictional Support"

# (docId, formNo, title, url, identify)
#
# `identify` is the text the file must print for the fetch gate to accept it as
# the form we asked for. For a numbered form that is its own number. The three
# unnumbered forms print no number at all, so each names a phrase off its own
# face instead -- and the set-aside notice's phrase is taken from the body
# rather than its heading, because the heading carries the court's own typo
# ("REGISTRATIO").
_ROWS = [
    ("NSISO_A1", "A.1", "Support Application (Interjurisdictional Support Orders Act)",
     FORMS + "IJ-FormA1-SupportApplication%20(NS%20March%202021).pdf", None),
    ("NSISO_A2", "A.2", "Support Variation Application (Interjurisdictional Support Orders Act)",
     FORMS + "IJ-FormA2-SupportVariationApplication%20(NS%20March%202021).pdf", None),
    ("NSISO_A3", "A.3", "Support Application (Divorce Act)",
     FORMS + "IJ-FormA3-SupportApplication%20(NS%20March%202021).pdf", None),
    ("NSISO_A4", "A.4", "Support Variation Application (Divorce Act)",
     FORMS + "IJ-FormA4-SupportVariationApplication%20(NS%20March%202021).pdf", None),
    ("NSISO_B", "B", "Parentage",
     FORMS + "IJ-FormB-Parentage%20(NS%20March%202021).pdf", None),
    ("NSISO_C", "C", "Child Support Claim",
     FORMS + "IJ-FormC-ChildSupportClaim%20(NS%20March%202021).pdf", None),
    ("NSISO_D", "D", "Request for a Support Order",
     FORMS + "IJ-FormD-RequestForASupportOrder%20(NS%20March%202021).pdf", None),
    ("NSISO_E", "E", "Request for Child Support Different than the Child Support Guidelines Table Amount",
     FORMS + "IJ-FormE-RequestForChildSupportDifferentThanChildSupportGuidelinesTableAmount.pdf", None),
    ("NSISO_F", "F", "Special or Extraordinary Expense Claim",
     FORMS + "IJ-FormF-SpecialOrExtraordinaryExpenseClaim%20(NS%20March%202021).pdf", None),
    ("NSISO_G", "G", "Request to Pay Child Support Different than the Child Support Guidelines Table Amount",
     FORMS + "IJ-FormG-RequestToPayChildSupportDifferentThanChildSupportGuidelinesTableAmount.pdf", None),
    ("NSISO_H", "H", "Support for the Claimant or Applicant",
     FORMS + "IJ-FormH-SupportForClaimantApplicant%20(NS%20March%202021).pdf", None),
    ("NSISO_I", "I", "Financial Information",
     FORMS + "IJ-FormI-FinancialStatement%20(NS%20March%202021).pdf", None),
    ("NSISO_J", "J", "Child Status and Financial Statement",
     FORMS + "IJ-FormJ-ChildStatusAndFinancialStatement%20(NS%20March%202021).pdf", None),
    ("NSISO_K", "K", "Evidence to Support Variation of a Support Order",
     FORMS + "IJ-FormK-EvidenceToSupportVariationOfASupportOrder%20(NS%20Mar%202021).pdf", None),
    ("NSISO_L", "L", "Respondent's Response to Application",
     FORMS + "IJ-FormL-RespondentsResponseToApplication%20(NS%20March%202021).pdf", None),
    ("NSISO_AFFIDAVIT", None, "ISO Affidavit",
     FORMS + "IJ%20-%20ISO%20Affidavit%20(NS%20March%202021).pdf",
     "this affidavit is made for the purpose of providing further"),
    ("NSISO_LOCATE", None, "Additional Locate Information",
     FORMS + "IJ-AdditionalLocateInformation%20(NS%20March%202021).pdf",
     "additional locate information form"),
    ("NSISO_SET_ASIDE", None,
     "Notice to Set Aside Registration of a Support Order Made Outside of Canada",
     BASE + "Notice%20to%20set%20aside%20Registration%20-%20Fillable%20form(2025).pdf",
     "set aside registration"),
]


def title_of(form_no, title):
    """How the catalogue names the form.

    Three of the eighteen carry no number, so the "Form X - Title" shape every
    other province uses would print a dangling "Form  - ". They are named by
    their title alone.
    """
    return "Form %s - %s" % (form_no, title) if form_no else title


def all_sources():
    out = []
    for doc_id, form_no, title, url, identify in _ROWS:
        out.append({
            "docId": doc_id,
            "formNo": form_no,
            "title": title,
            "shortTitle": "NS ISO %s" % form_no if form_no else "NS %s" % title,
            "catalogTitle": title_of(form_no, title),
            "identify": identify or ("form %s" % form_no.lower()),
            "category": CATEGORY,
            "url": url,
            "court": COURT,
        })
    return out


def shipped_sources():
    return all_sources()
