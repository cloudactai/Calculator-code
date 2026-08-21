"""Manitoba form sources, batch 3 -- the six families Rule 70 and the
regulations do not carry.

Batch 1 is the 43 family forms of **Rule 70** of the Court of King's Bench Rules
(`mb_sources.py`). Batch 2 is the 43 child-protection and adoption forms
Manitoba prescribes by regulation (`mb_sources_batch2.py`). Both are King's
Bench. This batch is everything else a Manitoba family file touches: the
*Provincial* Court's own family rules, the relocation notices under The Family
Law Act, the child-protection briefs the Court of King's Bench publishes as
practice material, the FOAEAA packages, the interjurisdictional support set, and
the protection-order applications -- plus the three federal Divorce Act
relocation forms, which are the same document in every province and are recorded
here as Manitoba's copy of them (see "The federal forms" below).

`mb_sources_batch2` already recorded two of these families as deliberately out
of *its* scope and named them "a third batch, not part of this one". This is
that batch.

**Six hosts, three file formats.** Batches 1 and 2 both came from one host in
one format, which is why every URL in them is derived from a form number. That
is not true here, and the difference is the main thing to know before touching
this module:

| Family | Forms | Host | Source format | Classifies as |
| --- | --- | --- | --- | --- |
| Provincial Court Family Rules, M.R. 87/88R | 8 | King's Printer | PDF | 8 static |
| Family Law Regulation, M.R. 50/2023, Sch. A-C | 3 | King's Printer | PDF | 3 static |
| Child-protection court briefs | 4 | Manitoba Courts | **.doc** | 4 static |
| FOAEAA packages | 16 | Manitoba Courts | **.docx** | 16 static |
| Interjurisdictional support (ISO) | 17 | Manitoba Justice | PDF | **14 AcroForm, 3 XFA** |
| Protection orders | 3 | Manitoba Courts | PDF | **2 AcroForm**, 1 static |
| Divorce Act relocation (federal) | 3 | Justice Canada | PDF | **3 AcroForm** |

Read on 2026-08-20; every URL below was fetched and every page count is the one
the government's own file carries, measured rather than copied from an index.
`fetch_mb.py` reports 140 entries and none flagged.

**The "Classifies as" column is measured, not assumed**, and two of its answers
were a surprise: the protection-order applications and all three federal notices
are fillable, and three of the seventeen ISO forms (B, F and H) are not AcroForm
but **XFA** -- the format BC's Supreme forms are, needing the headless flatten in
`../bc-forms/xfa/`, which Manitoba has never needed. So this one batch touches
every source kind the repository knows about.

**Nothing here is shipped yet.** `SHIPPED_CATEGORIES` is empty on purpose, which
is the same switch `mb_sources.FORMS` used while Rule 70's non-financial
categories were recorded but unbuilt: the forms are fetched and verified on every
pass, so a renumbered or withdrawn form surfaces immediately, but none is built,
catalogued or bound until its pages have been read. Three of the seven families
need pipeline work that does not exist yet, recorded under each family below.

## The two formats this pipeline has never had

**Word.** The 20 forms on the Manitoba Courts site (the four briefs and all
sixteen FOAEAA forms) are published *only* as Word documents. There is no
official PDF to ship, so the "background ships byte-identical to the
government's file" property that batches 1 and 2 rest on cannot hold for them --
whatever we ship is a rendering, not the government's file. `sourceFormat`
carries `doc`/`docx` and the fetcher converts through LibreOffice.

The conversion is checked rather than trusted: every FOAEAA form prints its own
pagination in its header ("Form 1A - FOAEAA - page 1/3"), and all sixteen
conversions reproduce the declared page count exactly. The four briefs print no
such marker, so their page counts are the conversion's own and are a regression
guard only. **This is a decision about the form, not about the code**, in the
same sense `caption_under_rule.py` is: a converted prescribed form is not the
prescribed form. It is recorded here rather than made silently.

**AcroForm, and XFA.** The 17 ISO forms carry real widgets -- 112 of them on Form A.1
alone -- with meaningful field names (`res_first_name`, not `Text14`). Every
other Manitoba source is static and has every box read off a printed anchor;
`fetch_mb.py` already anticipates this case ("a source that ever turns fillable
should route to the widget path rather than the detector path") but no such path
exists in `mb-forms/` or `sk-forms/`. Running the anchor detectors over Form A.1
finds 0 rules and 25 underscore runs against 112 government-defined rectangles,
so detection here would be strictly worse than reading what the form already
declares. Ontario and BC have widget extraction; this family should reuse it
rather than grow a third copy.

Forms B, F and H go further and are **XFA**, so they need BC's headless flatten
(`../bc-forms/xfa/`) before anything can read them -- including
`patch_pdfjs_signature.mjs`, whose absence is what drops signature captions. The
protection-order applications and the three federal notices are AcroForm too.

## The federal forms

The three Divorce Act relocation forms are Justice Canada's, identical in every
province, and `FormTemplate` carries one province per row. They are therefore
recorded **once per province** -- here for Manitoba, and in
`../sk-forms/sk_sources_pd.py` for Saskatchewan -- from the same federal URL,
with province-distinct doc IDs (`MBDIV_1` / `SKDIV_1`). Sharing one row would
make them reachable from only one province's picker, which the requesting scope
explicitly forbids; sharing one *asset* between two rows is not something the
current export format supports, and inventing it for three forms would be a
larger change than storing the file twice.

Note the official title of Form 3 is "Notice of Change **in** Place of
Residence: Person with Contact", not "of Place of Residence".

## Titles

Every title below is the one the form itself prints, not an index's paraphrase,
and two differ from the working inventory this batch was requested from:

- Provincial Court Form 3 is "Reply to Answer", not "Reply".
- Manitoba's ISO Form D prints "Request for Support Order (if Respondent Does
  Not Provide Financial Information)" and its Form L prints "Respondent's
  Response to Application" -- where Saskatchewan's King's Printer names the same
  national form "Form L Respondent's Answer to Application". The forms are the
  same document; each province publishes its own copy and they are not
  byte-identical, which is why each province records its own source.
"""

COURT_PC = "Provincial Court"
COURT_KB = "King's Bench"
COURT_EITHER = "King's Bench / Provincial Court"

KP_FORMS = "https://web2.gov.mb.ca/laws/regs/current/forms/%s/%s"
COURTS_ASSET = "https://www.manitobacourts.mb.ca/site/assets/files/%s/%s"
ISO_BASE = "https://www.gov.mb.ca/familylaw/money/pdf/%s.pdf"
FED_BASE = "https://www.justice.gc.ca/eng/fl-df/divorce/pdf/%s.pdf"

# Nothing in this batch is built, catalogued or bound yet -- see the module
# docstring. Turning a family on is adding its category name here, once its
# pages have been read.
SHIPPED_CATEGORIES = set()

# --- Provincial Court Family Rules, M.R. 87/88R ------------------------------
# Manitoba's equivalent of BC's Provincial Court Family Rules batch. Prescribed
# under The Family Law Act; served from the King's Printer's own forms
# directory, one file per form, so the URL is derived from the number the way
# Rule 70's is. Amended by M.R. 75/2023.
PC_DIR = "087_88r"
PC_CITATION = "Provincial Court Family Rules, M.R. 87/88R"

# (formNo, title, pages)
PC_FORMS = [
    ("1", "Application for Relief", 7),
    ("2", "Answer", 5),
    ("3", "Reply to Answer", 4),
    ("4", "Financial Statement", 8),
    ("5", "Order", 2),
    ("6", "Notice of Application for Guardianship", 6),
    ("7", "Affidavit", 2),
    ("8", "Garnishing Order (Attaching Debts)", 2),
]

# --- Family Law Regulation, M.R. 50/2023, Schedules A-C ----------------------
# The relocation notices under The Family Law Act (C.C.S.M. c. F20). Manitoba
# also mirrors these three on gov.mb.ca/familylaw/parenting/; the King's
# Printer's copy is the prescribed one and is what is recorded here.
RELOC_DIR = "050_2023"
RELOC_CITATION = "Family Law Regulation, M.R. 50/2023"

# (schedule, title, pages)
RELOC_FORMS = [
    ("A", "Notice of Proposed Relocation Form", 5),
    ("B", "Notice of Objection to Proposed Relocation Form", 2),
    ("C", "Notice of Change of Residence Form", 3),
]

# --- Child-protection court briefs -------------------------------------------
# Published by the Court of King's Bench as practice material rather than
# prescribed by regulation, which is why they are not in batch 2 alongside the
# M.R. 16/99 CFS forms. **.doc only** -- see the module docstring.
BRIEF_ASSET_DIR = "1145"

# (key, formNo, title, sourceFile, pages)
BRIEF_FORMS = [
    ("intake_agency", "CP Intake Brief (Agency)", "Intake Brief of Agency",
     "cp_intake_brief_of_agency.doc", 4),
    ("intake_parents", "CP Intake Brief (Parents)", "Intake Brief of Parents",
     "cp_intake_brief_of_parents.doc", 3),
    ("prehearing_agency", "CP Pre-Hearing Brief (Agency)", "Pre-Hearing Brief of Agency",
     "cp_pre-hearing_brief_of_agency_final.doc", 5),
    ("prehearing_parents", "CP Pre-Hearing Brief (Parents)", "Pre-Hearing Brief of Parents",
     "cp_pre-hearing_brief_of_parents.doc", 4),
]

# --- FOAEAA packages ----------------------------------------------------------
# Family Orders and Agreements Enforcement Assistance Act (Canada). Four
# packages of four forms each; the package decides which federal information
# bank may be searched and for what purpose, so the four `a`/`b`/`c`/`d` forms
# of one package are only ever filed together.
#
# **.docx only** -- see the module docstring. Every one of these prints its own
# pagination ("page 1/3"), which is what the fetcher checks the conversion
# against. Note the filenames are inconsistent: package 2 was reissued in May
# 2025 under descriptive names while packages 1, 3 and 4 keep the terse `1ae`
# convention, so the filename is recorded per form rather than derived.
FOAEAA_ASSET_DIR = "2128"

FOAEAA_PACKAGES = [
    ("1", "Locate request to establish or vary support"),
    ("2", "Financial request to establish or vary support"),
    ("3", "Locate request to enforce parenting, contact, custody or access"),
    ("4", "Locate/financial request to enforce support"),
]

FOAEAA_PARTS = [
    ("a", "FOAEAA Application"),
    ("b", "FOAEAA Affidavit"),
    ("c", "FOAEAA Order Authorization"),
    ("d", "FOAEAA Order Disclosure"),
]

# (package, part, sourceFile, pages)
FOAEAA_FORMS = [
    ("1", "a", "1ae.docx", 3),
    ("1", "b", "1be.docx", 6),
    ("1", "c", "1ce.docx", 4),
    ("1", "d", "1de.docx", 3),
    ("2", "a", "2a_-_foaeaa_application_-_establish_or_vary_support_may_2025.docx", 8),
    ("2", "b", "2b_-_foaeaa_affidavit_-_establish_or_vary_support_may_2025.docx", 5),
    ("2", "c", "2c_-_foaeaa_order_authorization_-_establish_or_vary_support_may_2025.docx", 8),
    ("2", "d", "2d_-_foaeaa_order_disclosure_-_establish_or_vary_support_may_2025.docx", 4),
    ("3", "a", "3ae.docx", 4),
    ("3", "b", "3be.docx", 6),
    ("3", "c", "3ce.docx", 5),
    ("3", "d", "3de.docx", 4),
    ("4", "a", "4ae.docx", 3),
    ("4", "b", "4be.docx", 6),
    ("4", "c", "4ce.docx", 5),
    ("4", "d", "4de.docx", 3),
]

# --- Interjurisdictional support (ISO) ----------------------------------------
# The pan-Canadian ISO set, published by Manitoba Justice. **AcroForm** -- see
# the module docstring. Saskatchewan publishes its own copy of the same national
# forms (`../sk-forms/sk_sources_pd.py`); the two are not byte-identical and
# their field names differ, so each province records its own source.
ISO_CITATION = "The Inter-jurisdictional Support Orders Act, C.C.S.M. c. I60"

# (formNo, slug, title, pages)
ISO_FORMS = [
    ("A.1", "forma1", "Support Application under the Interjurisdictional Support "
     "Orders (ISO) Act", 5),
    ("A.2", "forma2", "Support Variation Application under the Interjurisdictional "
     "Support Orders (ISO) Act", 4),
    ("A.3", "forma3", "Interjurisdictional Support Application under the Divorce Act", 5),
    ("A.4", "forma4", "Interjurisdictional Support Variation Application under the "
     "Divorce Act", 5),
    ("B", "formb", "Parentage", 3),
    ("C", "formc", "Child Support Claim", 2),
    ("D", "formd", "Request for Support Order (if Respondent Does Not Provide "
     "Financial Information)", 3),
    ("E", "forme", "Request for Child Support Different than Child Support Table "
     "Amount", 2),
    ("F", "formf", "Special or Extraordinary Expense Claim", 2),
    ("G", "formg", "Request to Pay Child Support Different than Child Support Table "
     "Amount", 2),
    ("H", "formh", "Support for Claimant/Applicant", 6),
    ("I", "formi", "Financial Information", 9),
    ("J", "formj", "Child Status and Financial Statement", 4),
    ("K", "formk", "Evidence to Support Variation of a Support Order", 5),
    ("L", "forml", "Respondent's Response to Application", 2),
    # Headed "AFFIDAVIT" and nothing else, so it is identified by the sentence
    # that follows rather than by a title generic enough to match any jurat.
    ("AFFIDAVIT", "affidavit", "ISO Affidavit", 2),
    ("LOCATE", "additional_locate_information", "Additional Locate Information Form", 1),
]

# The two ISO forms that print no form number. Neither can be identified by its
# title: one is headed "AFFIDAVIT" alone, which every jurat in the catalogue
# would match.
ISO_TEXT_CHECK = {
    "AFFIDAVIT": "this affidavit is made for the purpose of providing further information",
    "LOCATE": "additional locate information form",
}

# --- Protection orders --------------------------------------------------------
# Applications under The Domestic Violence and Stalking Act, C.C.S.M. c. D93,
# heard by a designated justice of the peace. Indexed from Manitoba Justice's
# victim-services pages but served as court forms with their own CRT/MG numbers.
PO_ASSET_DIR = "1172"

# Identified by the form number printed in the top corner rather than by title:
# the two applications differ only by a parenthesis, and MG-7828 sets the word
# "Confidential" letter-spaced ("C o n f i d e n t i a l"), so no phrase from
# its own heading survives text extraction.
PO_TEXT_CHECK = {
    "po": "crt 20279e",
    "po_behalf": "crt 20280e",
    "cpi": "mg-7828",
}

# (key, formNo, title, sourceFile, pages)
PO_FORMS = [
    ("po", "CRT20279", "Application for a Protection Order",
     "application_for_protection_order_new_en_-_crt20279e_01aug2023.pdf", 9),
    ("po_behalf", "CRT20280", "Application for a Protection Order on Behalf of "
     "Another Person",
     "application_for_protection_order_on_behalf_of_newen_-_crt20280e_01aug2023.pdf", 9),
    ("cpi", "MG7828", "Confidential Personal Information Form",
     "fillable_confidential_personal_information_-_mg7828.pdf", 6),
]

# --- Divorce Act relocation, federal ------------------------------------------
# Justice Canada's, prescribed by the Notice of Relocation Regulations,
# SOR/2020-249, in force 1 March 2021. Recorded once per province -- see the
# module docstring.
FED_CITATION = "Notice of Relocation Regulations, SOR/2020-249 (Divorce Act)"

# (formNo, slug, title, pages)
# Form 2 is headed "OBJECTION TO RELOCATION FORM" -- no leading "Notice of",
# unlike Forms 1 and 3 and unlike the way it is usually cited.
FED_FORMS = [
    ("1", "nrf-fad", "Notice of Relocation", 7),
    ("2", "orf-fod", "Objection to Relocation", 6),
    ("3", "ncpr-aclr", "Notice of Change in Place of Residence: Person with Contact", 5),
]

CATEGORY_ORDER = [
    "Provincial Court - Family Rules",
    "Relocation - Family Law Act",
    "Relocation - Divorce Act",
    "Child Protection - Briefs",
    "FOAEAA",
    "Interjurisdictional Support",
    "Protection Orders",
]


def _row(doc_id, form_no, title, court, category, short_title, source_file,
         pages, url, citation, source_format="pdf", number_check=None,
         text_check=None):
    """One source row.

    `numberCheck` is the form number as the form itself prints it, which is what
    guards against a wrong URL returning somebody else's form. Where a form
    prints no number of its own -- the four briefs, the protection orders, the
    federal notices -- `textCheck` carries a distinctive phrase from its first
    page instead. Exactly one of the two is set on every row.
    """
    return {
        "numberCheck": number_check,
        "textCheck": text_check,
        "docId": doc_id,
        "formNo": form_no,
        "title": title,
        "court": court,
        "citation": citation,
        "category": category,
        "shortCategory": category,
        "shortTitle": short_title,
        "sourceFile": source_file,
        "sourceFormat": source_format,
        "expectedPages": pages,
        "url": url,
        "shipped": category in SHIPPED_CATEGORIES,
    }


def provincial_court_sources():
    out = []
    for form_no, title, pages in PC_FORMS:
        src = "form_%se.pdf" % form_no
        out.append(_row(
            "MBPC_%s" % form_no, "Form %s" % form_no, title, COURT_PC,
            "Provincial Court - Family Rules", "MB PC %s" % form_no, src, pages,
            KP_FORMS % (PC_DIR, src), PC_CITATION, number_check=form_no))
    return out


def relocation_sources():
    out = []
    for sched, title, pages in RELOC_FORMS:
        src = "sched_%se.pdf" % sched.lower()
        out.append(_row(
            "MBREL_%s" % sched, "Schedule %s" % sched, title, COURT_KB,
            "Relocation - Family Law Act", "MB Reloc %s" % sched, src, pages,
            KP_FORMS % (RELOC_DIR, src), RELOC_CITATION,
            text_check=title.replace(" Form", "").lower()))
    return out


def brief_sources():
    out = []
    for key, form_no, title, src, pages in BRIEF_FORMS:
        out.append(_row(
            "MBCPB_%s" % key.upper(), form_no, title, COURT_EITHER,
            "Child Protection - Briefs", "MB CP Brief", src, pages,
            COURTS_ASSET % (BRIEF_ASSET_DIR, src),
            "Court of King's Bench child-protection practice material",
            source_format="doc", text_check=title.lower()))
    return out


def foaeaa_sources():
    packages = dict(FOAEAA_PACKAGES)
    parts = dict(FOAEAA_PARTS)
    out = []
    for package, part, src, pages in FOAEAA_FORMS:
        form_no = "%s%s" % (package, part)
        out.append(_row(
            "MBFOA_%s%s" % (package, part.upper()), "Form %s" % form_no,
            "%s -- %s" % (parts[part], packages[package]), COURT_KB, "FOAEAA",
            "MB FOAEAA %s" % form_no, src, pages,
            COURTS_ASSET % (FOAEAA_ASSET_DIR, src),
            "Family Orders and Agreements Enforcement Assistance Act (Canada)",
            source_format="docx", number_check=form_no.upper()))
    return out


def iso_sources():
    out = []
    for form_no, slug, title, pages in ISO_FORMS:
        doc_stem = form_no.replace(".", "_")
        label = form_no if form_no not in ("AFFIDAVIT", "LOCATE") else ""
        out.append(_row(
            "MBISO_%s" % doc_stem,
            ("Form %s" % form_no) if label else title, title, COURT_KB,
            "Interjurisdictional Support",
            ("MB ISO %s" % form_no) if label else "MB ISO",
            "%s.pdf" % slug, pages, ISO_BASE % slug, ISO_CITATION,
            number_check=form_no if label else None,
            text_check=None if label else ISO_TEXT_CHECK[form_no]))
    return out


def protection_order_sources():
    out = []
    for key, form_no, title, src, pages in PO_FORMS:
        out.append(_row(
            "MBPO_%s" % key.upper(), form_no, title, COURT_PC,
            "Protection Orders", "MB %s" % form_no, src, pages,
            COURTS_ASSET % (PO_ASSET_DIR, src),
            "The Domestic Violence and Stalking Act, C.C.S.M. c. D93",
            text_check=PO_TEXT_CHECK[key]))
    return out


def federal_relocation_sources():
    """The three Divorce Act relocation forms, as Manitoba's copy of them."""
    out = []
    for form_no, slug, title, pages in FED_FORMS:
        out.append(_row(
            "MBDIV_%s" % form_no, "Form %s" % form_no, title, COURT_KB,
            "Relocation - Divorce Act", "MB Divorce Act %s" % form_no,
            "%s.pdf" % slug, pages, FED_BASE % slug, FED_CITATION,
            text_check=title.split(":")[0].lower()))
    return out


def all_sources():
    return (provincial_court_sources()
            + relocation_sources()
            + federal_relocation_sources()
            + brief_sources()
            + foaeaa_sources()
            + iso_sources()
            + protection_order_sources())


def shipped_sources():
    return [s for s in all_sources() if s["shipped"]]
