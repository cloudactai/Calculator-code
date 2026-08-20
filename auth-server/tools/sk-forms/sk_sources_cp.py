"""Saskatchewan child-protection and adoption form sources.

Part 15 of The King's Bench Rules (`sk_sources.py`) is Saskatchewan's general
family-division procedure and nothing else -- it prescribes no child-protection
and no adoption form, exactly as BC's two Family Rules books prescribe neither
(see `bc-forms/bc_sources_batch3.py`, this module's counterpart). Saskatchewan
runs those two families under separate statutes with their own regulations, and
each regulation carries an appendix of prescribed forms:

**Child protection.** The Child and Family Services Regulations, c C-7.2 Reg 1,
prescribe 16 forms, Form A through Form P, in the Appendix at pages 20-36 of the
consolidation. All 16 are published by the King's Printer as their own products
on the publications site, with a clean text layer, so they take the identical
path to the Part 15 forms: download by product and format id, verify, detect.
The forms are filed in either court -- each one heads "In the Court of King's
Bench (Family Law Division) (or) The Provincial Court of Saskatchewan" -- so the
court is recorded as both rather than guessed at.

**Adoption.** The Adoption Regulations, 2003, c A-5.2 Reg 1, prescribe 25 forms
in the Appendix at pages 27-50. Five are repealed and are not shipped:

    Form B  Application to Recognize a Simple Adoption Order  repealed SR 114/2017
    Form E  (Consent of birth parent, superseded)             repealed SR  99/2004
    Form J  Order to Recognize a Simple Adoption Order        repealed SR 114/2017
    Form N  Birth Parent Acknowledgment                       repealed SR  11/2016
    Form O  Adoptive Parents' Agreement                       repealed SR  11/2016

leaving **20 live forms**. Forms N and O are a trap: the King's Printer still
serves standalone product PDFs for both (products 9392 and 9393), because the
form products were never retired when the regulation repealed the forms in 2016.
Shipping a repealed consent form is worse than shipping none, so the regulation's
own appendix -- not the product list -- is what decides the scope here.

The adoption forms are **cut out of the consolidation** rather than downloaded
individually, even though 22 of them do have product PDFs. Those PDFs have no
usable text layer: their fonts carry no ToUnicode map, so Form A-1's text is the
running head alone and Form C-5's is mojibake. The Saskatchewan builder reads
every box off a printed anchor, so a source with no text layer builds an empty
form. `sk_reg_cut.py` explains the cut; the consolidation's own text layer is
clean for the identical pages.

One consequence of sourcing from the consolidation: it is current to 2017, so the
adoption forms still print "Court of Queen=s Bench" (with the `=` for an
apostrophe that the King's Printer's own font substitution produces) where the
2024 child-protection consolidation prints "King's Bench". That is the state of
the enacted form and is shipped as published, not silently corrected.

docId scheme: `SKCFS_<letter>` and `SKAD_<form>` with the hyphen turned into an
underscore -- "C-1" -> SKAD_C_1 -- matching Manitoba's `MBCFS_`/`MBAD_` split and
keeping both clear of Part 15's `SKKB_`.
"""

BASE = "https://publications.saskatchewan.ca/api/v1/products/%d/formats/%d/download"

# --- Child and Family Services Regulations, c C-7.2 Reg 1 --------------------
# Each form is its own product. (formNo, title, category, productId, formatId,
# sourceFile, pages) -- `pages` is the page count the publications site itself
# advertises for that format, so a swapped product id is caught at fetch.
CFS_COURT = "King's Bench / Provincial Court"
CFS_REG = "C-7.2 Reg 1"

CFS_FORMS = [
    ("A", "Notice of Child in Need of Protection", "Service & Notice", 8334, 12267, "C7-2R1-A.pdf", 1),
    ("B", "Application for Protective Intervention Order", "Applications", 8335, 12269, "C7-2R1-B.pdf", 1),
    ("C", "Notice for Protective Intervention Order (Ministry Use Only)", "Service & Notice", 8336, 12271, "C7-2R1-C.pdf", 1),
    ("D", "Notice for Protective Intervention Order (Parent or Person)", "Service & Notice", 8337, 12273, "C7-2R1-D.pdf", 1),
    ("E", "Protective Intervention Order", "Orders", 8338, 12275, "C7-2R1-E.pdf", 1),
    ("F", "Notice of Apprehension", "Service & Notice", 8339, 12277, "C7-2R1-F.pdf", 1),
    ("G", "Application for a Protection Hearing", "Applications", 8340, 12279, "C7-2R1-G.pdf", 1),
    ("H", "Notice of Protection Hearing/Notice of Pretrial/Notice of Adjournment", "Service & Notice", 8341, 12281, "C7-2R1-H.pdf", 1),
    ("I", "Notice of Application to Vary or Terminate an Order", "Applications", 8342, 12283, "C7-2R1-I.pdf", 1),
    ("J", "Withdrawal of Application for a Protection Hearing", "Applications", 8348, 12295, "C7-2R1-J.pdf", 1),
    ("K", "Interim Order", "Orders", 8349, 12297, "C7-2R1-K.pdf", 1),
    ("L", "Order Pursuant to Section 37", "Orders", 8350, 12299, "C7-2R1-L.pdf", 2),
    ("M", "Order Pursuant to Section 39", "Orders", 8351, 12301, "C7-2R1-M.pdf", 1),
    ("N", "Affidavit of Personal Service", "Service & Notice", 8352, 12303, "C7-2R1-N.pdf", 1),
    ("O", "Affidavit of Service By Registered or Certified Mail", "Service & Notice", 8353, 12305, "C7-2R1-O.pdf", 1),
    ("P", "Voluntary Committal", "Guardianship", 8354, 12307, "C7-2R1-P.pdf", 1),
]

# --- Adoption Regulations, 2003, c A-5.2 Reg 1 -------------------------------
# The consolidation, as one product; the forms are cut out of it by heading.
ADOPTION_REG = "A-5.2 Reg 1"
ADOPTION_PRODUCT = 989
ADOPTION_FORMAT = 1615
ADOPTION_SOURCE = "A-5.2-Reg-1-consolidation.pdf"
# 1-based page window of the Appendix inside the consolidation. A form is located
# inside it by its own enacting heading, never by page number, so a re-consolidation
# that repaginates is caught by the heading lookup rather than silently shipping the
# neighbouring form.
ADOPTION_WINDOW = (27, 50)
ADOPTION_COURT = "King's Bench"

# (formNo, title, category, pages) -- `pages` is the page count the cut produces.
# Unlike the CFS forms there is no advertised count to check against, so this is a
# regression guard: if the King's Printer re-issues the consolidation and the copy
# reflows, the cut changes length and the fetcher stops.
ADOPTION_FORMS = [
    ("A-1", "Application for Order of Adoption", "Applications", 1),
    ("A-2", "Application for Order of Adoption (Step-parent Adoption)", "Applications", 1),
    ("A-3", "Application for Order of Adoption (Adoption of an Adult)", "Applications", 1),
    ("C-1", "Consent of Birth Parent or Guardian", "Consents", 1),
    ("C-2", "Consent of Birth Parent or Guardian (Step-parent Adoption)", "Consents", 1),
    ("C-3", "Consent of Birth Parent (Spouse of Applicant) (Step-parent Adoption)", "Consents", 1),
    ("C-4", "Consent of the Minister", "Consents", 1),
    ("C-5", "Consent of Child over 12 Years of Age", "Consents", 1),
    ("C-6", "Consent of an Agency", "Consents", 1),
    ("C-7", "Consent of Person 18 Years of Age and More", "Consents", 1),
    ("D", "Transfer of Guardianship", "Guardianship", 2),
    ("F", "Certificate of Counselling", "Certificates", 2),
    ("G", "Certificate of Independent Advice", "Certificates", 2),
    ("H", "Notice of Fiat or Decision", "Court", 1),
    ("I-1", "Order of Adoption", "Orders", 1),
    ("I-2", "Order of Adoption (Step-parent Adoption)", "Orders", 1),
    ("I-3", "Order of Adoption (Adoption of an Adult)", "Orders", 1),
    ("K", "Financial Statement", "Financial", 2),
    ("L", "Particulars of Adoption", "Registry", 1),
    ("M", "Information for the Registrar Pursuant to the Indian Act (Canada)", "Registry", 1),
]

# Prescribed but repealed, so deliberately not shipped. Kept here because the
# product list still advertises N and O and the next person to diff this module
# against the publications site needs to know that is expected, not an omission.
ADOPTION_REPEALED = {
    "B": "repealed 17 Nov 2017 SR 114/2017 s16",
    "E": "repealed 5 Nov 2004 SR 99/2004 s13",
    "J": "repealed 17 Nov 2017 SR 114/2017 s16",
    "N": "repealed 4 Mar 2016 SR 11/2016 s23 (product 9392 still served)",
    "O": "repealed 4 Mar 2016 SR 11/2016 s23 (product 9393 still served)",
}

CP_CATEGORY_ORDER = [
    "Child Protection - Applications",
    "Child Protection - Orders",
    "Child Protection - Service & Notice",
    "Child Protection - Guardianship",
    "Adoption - Applications",
    "Adoption - Consents",
    "Adoption - Orders",
    "Adoption - Certificates",
    "Adoption - Guardianship",
    "Adoption - Financial",
    "Adoption - Registry",
    "Adoption - Court",
]


def cfs_doc_id(form_no):
    return "SKCFS_" + form_no.replace("-", "_")


def adoption_doc_id(form_no):
    return "SKAD_" + form_no.replace("-", "_")


def cfs_sources():
    """The 16 child-protection forms, each downloaded whole."""
    out = []
    for form_no, title, category, product, fmt, src, pages in CFS_FORMS:
        out.append({
            "docId": cfs_doc_id(form_no),
            "formNo": form_no,
            "rule": CFS_REG,
            "title": title,
            "court": CFS_COURT,
            "category": "Child Protection - " + category,
            "shortTitle": "SK CFS %s" % form_no,
            "sourceFile": src,
            "expectedPages": pages,
            "url": BASE % (product, fmt),
        })
    return out


def adoption_sources():
    """The 20 live adoption forms, each cut out of the consolidation."""
    out = []
    for form_no, title, category, pages in ADOPTION_FORMS:
        out.append({
            "docId": adoption_doc_id(form_no),
            "formNo": form_no,
            "rule": ADOPTION_REG,
            "title": title,
            "court": ADOPTION_COURT,
            "category": "Adoption - " + category,
            "shortTitle": "SK Adopt %s" % form_no,
            "sourceFile": ADOPTION_SOURCE,
            "expectedPages": pages,
            "url": BASE % (ADOPTION_PRODUCT, ADOPTION_FORMAT),
            # Present only on a form that has to be cut; the fetcher branches on it.
            "cut": {"formNo": form_no, "window": ADOPTION_WINDOW},
        })
    return out


def all_cp_sources():
    return cfs_sources() + adoption_sources()
