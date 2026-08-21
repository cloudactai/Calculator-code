"""Saskatchewan form sources, batch 3 -- practice directives, ISO, IPV, appeal.

Part 15 of The King's Bench Rules (`sk_sources.py`) is Saskatchewan's general
family-division procedure; the child-protection and adoption regulations
(`sk_sources_cp.py`) carry those two families. This module is the remainder of
what a Saskatchewan family file actually uses: the forms the Court of King's
Bench prescribes by **family practice directive** rather than by rule, the
pan-Canadian interjurisdictional support set, the emergency intervention forms
under The Victims of Interpersonal Violence Regulations, and the Court of
Appeal's civil notice of appeal -- plus the three federal Divorce Act relocation
forms, recorded here as Saskatchewan's copy of them.

Read on 2026-08-20; every URL below was fetched and every page count measured
off the government's own file.

| Family | Forms | Host | How it is sourced |
| --- | --- | --- | --- |
| Family Practice Directive 1 | 2 | sasklawcourts.ca | standalone PDF |
| Family Practice Directives 3-7 | 14 | sasklawcourts.ca | **cut from the directive** |
| Family Practice Directive 8 | 6 | sasklawcourts.ca | standalone PDF |
| Interjurisdictional support (ISO) | 17 | King's Printer | PDF, **AcroForm** |
| Victims of Interpersonal Violence | 2 | King's Printer | PDF, static |
| Court of Appeal, civil | 1 | sasklawcourts.ca | PDF, static |
| Divorce Act relocation (federal) | 3 | Justice Canada | PDF, static |

**Nothing here is shipped yet.** `SHIPPED_CATEGORIES` is empty on purpose: the
forms are fetched and verified on every pass, so a reissued directive surfaces
immediately, but none is built, catalogued or bound until its pages have been
read. Two families need pipeline work that does not exist, recorded below.

## Cutting a form out of its directive

Directives 1 and 8 publish each form as its own PDF. Directives 3 to 7 do not --
the forms are appendices inside the directive, so they are cut out of it, the
same shape as the adoption forms in `sk_sources_cp.py`. Two differences from
that cut, both of which are why the window is recorded as page numbers here
rather than looked up by heading:

- The adoption forms are located by their **own enacting heading** inside a
  consolidation, which is what makes a repagination safe. A practice directive
  has no enacting heading; its appendices are titled inconsistently ("FORM A",
  "APPENDIX B - FORM FAM-PD #7-1", or nothing at all in Directive 4, whose four
  forms open straight onto "INITIAL SUMMARY"), so there is no single anchor to
  find them by.
- A directive is reissued as a whole document under a **new dated URL** rather
  than amended in place -- Directive 8's Forms E and F already sit under a
  different month's directory than its Forms A to D. So the URL going stale is
  the expected failure, and it fails loudly at fetch, which is the check that
  actually matters here.

`expectedPages` for a cut form is therefore the length of its own window and is
a regression guard, not an independent check, exactly as it is for the adoption
forms.

**Deliberately not cut**, and recorded so the decision is not re-derived:

- **Directive 5, Appendix A** ("Explanation to a Self-Represented Person
  Opposing the Application", pages 4-6). Explanatory material addressed to a
  litigant, with nothing to fill in. Appendices B and C are the forms.
- **Directive 7, Appendix A** ("A Guide to Judicial Case Conferences", pages
  6-12, itself numbered FAM-PD #7A). A guide, which the catalogue's scope
  excludes in every province.
- **The French forms.** Every directive is published in both languages, and the
  Court of Appeal serves its Formule 1a from a *later* directory than its
  Form 1a -- `2023/07/CA_Civ_Form1a.pdf` is the **French** form and
  `2022/09/Form-1a-Notice-of-Appeal.pdf` is the English one, which is the trap
  in this family and the reason the English URL here looks like the older of the
  two. French duplicates are out of scope, matching Ontario.
- **The .docx twins.** sasklawcourts.ca serves most forms as both PDF and Word.
  The PDF is what is recorded; unlike Manitoba's courts site, nothing here is
  Word-only.

## AcroForm

The 17 ISO forms carry real widgets -- 104 on Form A.1 -- with meaningful field
names. All 17 classify as AcroForm here, which is worth knowing because
Manitoba's copy of the same national set does **not**: its Forms B, F and H are
XFA. Same forms, same purpose, different production, so neither province's
classification can be assumed from the other's. `sk-forms/` has no widget path: `build_sk_forms.py` reads every box off a
printed anchor and the README's "all 76 sources are static PDFs, no widgets, no
XFA" stops being true with this batch. Running the anchor detectors over Form
A.1 finds far less than the form already declares, so this family should reuse
Ontario's or BC's widget extraction rather than grow a third copy of it. The
same is true of Manitoba's copy of the same forms
(`../mb-forms/mb_sources_batch3.py`).

## The same national forms, twice

The ISO set is pan-Canadian and Manitoba publishes its own copy of it. The two
are **not** byte-identical -- different layout, different page counts on some
forms, and entirely different widget names (`res_first_name` here,
`First Name` there) -- so each province records its own source rather than
sharing one asset. Their titles differ too: the King's Printer names Form L
"Respondent's Answer to Application" where Manitoba's copy prints "Respondent's
Response to Application". The official title of each province's own copy is what
is recorded.

The federal relocation forms are a different case -- one federal document, no
provincial copy -- and `FormTemplate` carries one province per row, so they are
recorded once per province with province-distinct doc IDs (`SKDIV_1` here,
`MBDIV_1` in Manitoba). Sharing a single row would make them reachable from only
one province's picker.

## Titles

Two differ from the working inventory this batch was requested from, and the
form's own printing wins:

- Directive 1's pre-trial brief is headed **"FORM A"**, not "Form 1", although
  the file it is served as is named `Form_1`.
- The federal Form 3 is "Notice of Change **in** Place of Residence: Person with
  Contact".
"""

COURT_KB = "King's Bench"
COURT_CA = "Court of Appeal"

SK_PUB = "https://publications.saskatchewan.ca/api/v1/products/%d/formats/%d/download"
COURTS = "https://sasklawcourts.ca/wp-content/uploads/%s"
FED_BASE = "https://www.justice.gc.ca/eng/fl-df/divorce/pdf/%s.pdf"

# Nothing in this batch is built, catalogued or bound yet. Turning a family on
# is adding its category name here, once its pages have been read.
SHIPPED_CATEGORIES = set()

# --- Family practice directives ----------------------------------------------
# Each directive is one source document. `path` is the directive's dated URL
# stem; `cut` is the 1-based inclusive page window of the form inside it, or
# None where the form has its own PDF.
#
# (docStem, formNo, title, directivePath, cut, pages)
PD_FORMS = [
    # -- Directive 1: family pre-trial conferences -------------------------
    ("PD1_A", "FAM-PD #1 Form A", "Pre-Trial Brief",
     "2021/04/QBFAM-PD12019Feb1-Form_1.pdf", None, 2),
    ("PD1_SCHA", "FAM-PD #1 Schedule A",
     "Family Property Statement/Proposed Distribution",
     "2021/04/QBFAM-PD12019Feb1-ScheduleA.pdf", None, 6),
    # -- Directive 3: objections to affidavit evidence ---------------------
    ("PD3_A", "FAM-PD #3 Form A", "Notice of Objection to Affidavit Evidence",
     "2021/04/QB_FAM_PD3amended2014.pdf", (3, 3), 1),
    ("PD3_B", "FAM-PD #3 Form B", "Response to Notice of Objection",
     "2021/04/QB_FAM_PD3amended2014.pdf", (4, 4), 1),
    # -- Directive 4: family service proceedings ---------------------------
    ("PD4_A", "FAM-PD #4 Form A", "Initial Summary",
     "2021/04/QB_PD_Family_Law_4.pdf", (3, 3), 1),
    ("PD4_B", "FAM-PD #4 Form B", "Court Appearance Memo",
     "2021/04/QB_PD_Family_Law_4.pdf", (4, 6), 3),
    ("PD4_C", "FAM-PD #4 Form C", "Applicant Pre-Trial Form",
     "2021/04/QB_PD_Family_Law_4.pdf", (7, 7), 1),
    ("PD4_D", "FAM-PD #4 Form D", "Respondent Pre-Trial Form",
     "2021/04/QB_PD_Family_Law_4.pdf", (8, 8), 1),
    # -- Directive 5: summary hearings -------------------------------------
    # Appendix A (pp. 4-6) is explanatory material and is not a form.
    ("PD5_B", "FAM-PD #5 Appendix B",
     "Suggested Terms for a Disclosure of Affidavits Order for a Summary Hearing",
     "2021/04/QB_FAM-PD5SummaryHearings2018July.pdf", (7, 7), 1),
    ("PD5_C", "FAM-PD #5 Appendix C", "Undertaking to Obtain Copies of Affidavits",
     "2021/04/QB_FAM-PD5SummaryHearings2018July.pdf", (8, 8), 1),
    # -- Directive 6: family chambers appearance memo ----------------------
    ("PD6", "FAM-PD #6 Appendix A", "Family Chambers Appearance Memo",
     "2024/08/KB_FAM_PD6_Sept2024.pdf", (2, 5), 4),
    # -- Directive 7: judicial case conferences ----------------------------
    # Appendix A (pp. 6-12) is a guide, not a form.
    ("PD7_1", "FAM-PD #7-1", "Certificate of Compliance with Practice Directive 7",
     "2024/01/KB_FAMILY_PD7-_Revised2024.pdf", (13, 14), 2),
    ("PD7_2", "FAM-PD #7-2", "Request for Judicial Case Conference",
     "2024/01/KB_FAMILY_PD7-_Revised2024.pdf", (15, 19), 5),
    ("PD7_3", "FAM-PD #7-3", "Joint Request for Judicial Case Conference",
     "2024/01/KB_FAMILY_PD7-_Revised2024.pdf", (20, 25), 6),
    ("PD7_4", "FAM-PD #7-4", "Notice of Judicial Case Conference",
     "2024/01/KB_FAMILY_PD7-_Revised2024.pdf", (26, 29), 4),
    ("PD7_5", "FAM-PD #7-5", "Judicial Case Conference Appearance Memo",
     "2024/01/KB_FAMILY_PD7-_Revised2024.pdf", (30, 32), 3),
    # -- Directive 8: FOAEAA -----------------------------------------------
    # Forms E and F were reissued a month after A-D and sit under 2026/01.
    ("PD8_A", "FAM-PD #8 Form A",
     "Application for Information to Establish or Vary Support (FOAEAA)",
     "2025/12/KB_FAM-PD8_Form-A.pdf", None, 4),
    ("PD8_B", "FAM-PD #8 Form B",
     "Order Authorizing a Court Official to Request Information for Support",
     "2025/12/KB_FAM-PD8_Form-B.pdf", None, 2),
    ("PD8_C", "FAM-PD #8 Form C",
     "Order Authorizing Release of Information for Support",
     "2025/12/KB_FAM-PD8_Form-C.pdf", None, 2),
    ("PD8_D", "FAM-PD #8 Form D",
     "Application for Information to Enforce a Family-Law Provision (FOAEAA)",
     "2025/12/KB_FAM-PD8_Form-D.pdf", None, 4),
    ("PD8_E", "FAM-PD #8 Form E",
     "Order Authorizing a Court Official to Request Enforcement Information",
     "2026/01/KB_FAM-PD8_Form-E.pdf", None, 2),
    ("PD8_F", "FAM-PD #8 Form F",
     "Order Authorizing Release of Enforcement Information",
     "2026/01/KB_FAM-PD8_Form-F.pdf", None, 2),
]

# The phrase each directive prints that identifies it. Chosen off the source:
# Directives 1 and 7 label their forms with the directive's own marker, 3 to 6
# name theirs in full, and 8 prints "FORM A" over "FAMILY PRACTICE DIRECTIVE #8"
# on every one of its six.
PD_TEXT_CHECK = {
    "PD1_A": "fam-pd #1",
    "PD1_SCHA": "schedule a",
    "PD3_A": "notice of objection to affidavit evidence",
    "PD3_B": "response to notice of objection",
    "PD4_A": "initial summary",
    "PD4_B": "court appearance memo",
    "PD4_C": "applicant pre-trial form",
    "PD4_D": "respondent pre-trial form",
    "PD5_B": "suggested terms for a disclosure of affidavits order",
    "PD5_C": "undertaking to obtain copies of affidavits",
    "PD6": "family chambers appearance memo",
    "PD7_1": "fam-pd #7-1",
    "PD7_2": "fam-pd #7-2",
    "PD7_3": "fam-pd #7-3",
    "PD7_4": "fam-pd #7-4",
    "PD7_5": "fam-pd #7-5",
    "PD8_A": "form a",
    "PD8_B": "form b",
    "PD8_C": "form c",
    "PD8_D": "form d",
    "PD8_E": "form e",
    "PD8_F": "form f",
}

# Which practice-directive category each doc stem belongs to.
PD_CATEGORY = {
    "PD1": "Practice Directive - Pre-Trial",
    "PD3": "Practice Directive - Affidavit Objections",
    "PD4": "Practice Directive - Family Services",
    "PD5": "Practice Directive - Summary Hearings",
    "PD6": "Practice Directive - Chambers",
    "PD7": "Practice Directive - Case Conferences",
    "PD8": "Practice Directive - FOAEAA",
}

# --- Interjurisdictional support (ISO) ----------------------------------------
# Each form is its own product on the publications site, so the download URL is
# built from a product and format id the same way Part 15's is.
ISO_REG = "The Inter-jurisdictional Support Orders Act, I-10.03"

# (formNo, title, productId, formatId, sourceFile, pages)
# `title` is the King's Printer's own product name.
ISO_FORMS = [
    ("A.1", "Support Application under The Interjurisdictional Support Orders Act",
     87465, 104125, "ISO-FormA1.pdf", 5),
    ("A.2", "Support Variation Application under The Interjurisdictional Support "
     "Orders Act", 87466, 104126, "ISO-FormA2.pdf", 4),
    ("A.3", "Support Application under the Divorce Act",
     112266, 126196, "ISO-FormA3.pdf", 5),
    ("A.4", "Support Variation Application under the Divorce Act",
     112267, 126197, "ISO-FormA4.pdf", 5),
    ("B", "Parentage", 87467, 104127, "ISO-FormB.pdf", 3),
    ("C", "Child Support Claim", 87468, 104128, "ISO-FormC.pdf", 2),
    ("D", "Request for Support Order", 87469, 104129, "ISO-FormD.pdf", 3),
    ("E", "Request for Child Support Order, Different than Child Support Guidelines "
     "Table Amount", 87470, 104130, "ISO-FormE.pdf", 2),
    ("F", "Special or Extraordinary Expense Claim", 87471, 104131, "ISO-FormF.pdf", 2),
    ("G", "Request to Pay Child Support, Different than the Child Support Guidelines "
     "Table Amount", 87472, 104132, "ISO-FormG.pdf", 2),
    ("H", "Support for Claimant/Applicant", 87473, 104133, "ISO-FormH.pdf", 6),
    ("I", "Financial Information", 87474, 104134, "ISO-FormI.pdf", 9),
    ("J", "Child Status and Financial Statement", 87475, 104135, "ISO-FormJ.pdf", 4),
    ("K", "Evidence to Support Variation of a Support Order", 87476, 104136,
     "ISO-FormK.pdf", 5),
    ("L", "Respondent's Answer to Application", 87477, 104137, "ISO-FormL.pdf", 2),
    ("AFFIDAVIT", "ISO Affidavit", 87478, 104138, "ISO-Affidavit.pdf", 2),
    ("LOCATE", "Additional Locate Information Form", 112292, 126225,
     "ISO-AdditionalLocate.pdf", 1),
]

# The two ISO forms that print no form number. The affidavit is headed
# "AFFIDAVIT" alone, which every jurat in the catalogue would match, so it is
# identified by the sentence that follows.
ISO_TEXT_CHECK = {
    "AFFIDAVIT": "this affidavit is made for the purpose of providing further information",
    "LOCATE": "additional locate information form",
}

# --- Victims of Interpersonal Violence ----------------------------------------
# V-6.02 Reg 1, the Appendix. Each form is its own King's Printer product.
# Form A is eight pages because the order is printed in four parts -- the
# appendix copy plus a court, respondent and victim copy of the same order.
IPV_REG = "The Victims of Interpersonal Violence Regulations, V-6.02 Reg 1"

# (formNo, title, productId, formatId, sourceFile, pages)
IPV_FORMS = [
    ("A", "Emergency Intervention Order", 8910, 13374, "V6-02R1-A.pdf", 8),
    ("B", "Summons for Rehearing of Emergency Intervention Order", 8911, 13376,
     "V6-02R1-B.pdf", 1),
]

# --- Court of Appeal ----------------------------------------------------------
# The English Form 1a. See the module docstring: the *later* URL is the French
# Formule 1a, which is the trap here.
CA_RULES = "The Court of Appeal Rules, Appendix"

CA_FORMS = [
    ("1a", "Notice of Appeal", "2022/09/Form-1a-Notice-of-Appeal.pdf", 2),
]

# --- Divorce Act relocation, federal ------------------------------------------
FED_CITATION = "Notice of Relocation Regulations, SOR/2020-249 (Divorce Act)"

# (formNo, slug, title, pages)
# Form 2 is headed "OBJECTION TO RELOCATION FORM" -- no leading "Notice of",
# unlike Forms 1 and 3 and unlike the way it is usually cited.
FED_FORMS = [
    ("1", "nrf-fad", "Notice of Relocation", 7),
    ("2", "orf-fod", "Objection to Relocation", 6),
    ("3", "ncpr-aclr", "Notice of Change in Place of Residence: Person with Contact", 5),
]

PD_CATEGORY_ORDER = [
    "Practice Directive - Pre-Trial",
    "Practice Directive - Affidavit Objections",
    "Practice Directive - Family Services",
    "Practice Directive - Summary Hearings",
    "Practice Directive - Chambers",
    "Practice Directive - Case Conferences",
    "Practice Directive - FOAEAA",
    "Interjurisdictional Support",
    "Interpersonal Violence",
    "Relocation - Divorce Act",
    "Court of Appeal",
]


def _row(doc_id, form_no, title, court, category, short_title, source_file,
         pages, url, rule, cut=None, text_check=None):
    """One source row.

    `textCheck` is a phrase the source document itself prints, and is what
    guards against a URL that has been reissued under a new date returning a
    different document. For a cut form it is checked against the **whole**
    directive rather than the window: a directive names its appendices on its
    own contents page but not always inside them -- Directive 6's memo is titled
    on page 1 and its form starts on page 2 with nothing but "APPENDIX A" -- so
    the window is validated by its bounds instead.
    """
    row = {
        "textCheck": text_check,
        "docId": doc_id,
        "formNo": form_no,
        "rule": rule,
        "title": title,
        "court": court,
        "category": category,
        "shortCategory": category,
        "shortTitle": short_title,
        "sourceFile": source_file,
        "expectedPages": pages,
        "url": url,
        "shipped": category in SHIPPED_CATEGORIES,
    }
    if cut:
        # Present only on a form that has to be cut out of its directive; the
        # fetcher branches on it, the same way it does for the adoption forms.
        row["cut"] = {"window": cut}
    return row


def practice_directive_sources():
    out = []
    for stem, form_no, title, path, cut, pages in PD_FORMS:
        family = stem.split("_")[0]
        # The directive's own filename. A cut form shares it with its siblings,
        # which is what lets the fetcher download the directive once.
        src = path.rsplit("/", 1)[-1]
        out.append(_row(
            "SKPD_%s" % stem, form_no, title, COURT_KB, PD_CATEGORY[family],
            "SK %s" % form_no, src, pages, COURTS % path,
            "Family Practice Directive %s" % family[2:], cut,
            text_check=PD_TEXT_CHECK[stem]))
    return out


def iso_sources():
    out = []
    for form_no, title, product, fmt, src, pages in ISO_FORMS:
        stem = form_no.replace(".", "_")
        label = form_no not in ("AFFIDAVIT", "LOCATE")
        out.append(_row(
            "SKISO_%s" % stem, ("Form %s" % form_no) if label else title, title,
            COURT_KB, "Interjurisdictional Support",
            ("SK ISO %s" % form_no) if label else "SK ISO", src, pages,
            SK_PUB % (product, fmt), ISO_REG,
            text_check=("form %s" % form_no).lower() if label
            else ISO_TEXT_CHECK[form_no]))
    return out


def ipv_sources():
    out = []
    for form_no, title, product, fmt, src, pages in IPV_FORMS:
        out.append(_row(
            "SKIPV_%s" % form_no, "Form %s" % form_no, title, COURT_KB,
            "Interpersonal Violence", "SK IPV %s" % form_no, src, pages,
            SK_PUB % (product, fmt), IPV_REG,
            text_check="form %s" % form_no.lower()))
    return out


def court_of_appeal_sources():
    out = []
    for form_no, title, path, pages in CA_FORMS:
        out.append(_row(
            "SKCA_%s" % form_no.upper(), "Form %s" % form_no, title, COURT_CA,
            "Court of Appeal", "SK CA %s" % form_no, path.rsplit("/", 1)[-1],
            pages, COURTS % path, CA_RULES,
            text_check="form %s" % form_no.lower()))
    return out


def federal_relocation_sources():
    """The three Divorce Act relocation forms, as Saskatchewan's copy of them."""
    out = []
    for form_no, slug, title, pages in FED_FORMS:
        out.append(_row(
            "SKDIV_%s" % form_no, "Form %s" % form_no, title, COURT_KB,
            "Relocation - Divorce Act", "SK Divorce Act %s" % form_no,
            "%s.pdf" % slug, pages, FED_BASE % slug, FED_CITATION,
            text_check=title.split(":")[0].lower()))
    return out


def all_pd_sources():
    return (practice_directive_sources()
            + iso_sources()
            + ipv_sources()
            + federal_relocation_sources()
            + court_of_appeal_sources())


def shipped_sources():
    return [s for s in all_pd_sources() if s["shipped"]]
