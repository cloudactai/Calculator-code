"""BC form sources, batch 3 — child protection (CFCSA) and adoption.

Batches 1 and 2 shipped the Supreme Court Family Rules and the Provincial Court
Family Rules sets. Neither rule book prescribes a child-protection or an adoption
form, so both families were outside that scope and BC's catalogue carried none.
This module is those two families, read off the sources on 2026-08-14.

**Child protection.** The Provincial Court (Child, Family and Community Service
Act) Rules, B.C. Reg. 533/95, prescribe 19 forms in Appendix A. Seventeen are
published by the government as fillable AcroForm PDFs on the Provincial Court
family forms index (the "Child, Family and Community Service Act" block), keyed
by PFA code; those are `CFCSA_PDF` below and take the same AcroForm path as the
batch-1 Provincial forms.

Form 5 (Warrant) and Form 10 (Order) are prescribed but **not published as PDFs**
— they are issued by the court, not filled by a party. pfa894/897/903-908/927/
930/931 were all probed and 404. Their only source is the form as enacted, so
they are cut out of the King's Printer consolidation and built by the BC Laws
path (`CFCSA_LAWS`). Note the consolidation's own Appendix A images for Forms 1,
3.1 and 3.2 carry a broken font encoding — irrelevant here, since those three
come from the government PDFs.

**Adoption.** The Adoption Regulation, B.C. Reg. 291/96, prescribes six forms in
Schedule 3 and there is no separate fillable download for any of them; the
consolidation is the source. Forms 2, 3, 3.1 and 5 are Supreme Court affidavits.
Forms 1 and 4 are not court forms at all — Form 1 goes to the Director of
Adoption or an adoption agency, Form 4 to the Parents' Registry — so they get
their own folder rather than being filed under a court that never sees them.

Deliberately excluded (on the same index block, but not CFCSA forms):
  AGA Forms 1-18   — Adult Guardianship Act, a different statute and client set
  CTL Forms 1-15   — Cowichan (Quw'utsun) Indigenous law forms, likewise
  ISOA Form L      — Interjurisdictional Support Orders, hosted off-site
"""

PROV_BASE = ("https://www2.gov.bc.ca/assets/gov/law-crime-and-justice/courthouse-services"
             "/court-files-records/court-forms/family/%s.pdf?forcedownload=true")

# The King's Printer consolidations, as PDF. Both carry a real text layer.
BCLAWS = "https://www.bclaws.gov.bc.ca/civix/document/id/crbc/crbc/%s"
CFCSA_REG = "533_95"
ADOPTION_REG = "291_96"

# 1-based page window of the schedule of forms inside each consolidation. Forms are
# located inside it by their own enacting heading, not by a page number, so a
# re-consolidation that repaginates is caught by the heading check rather than
# silently shipping the neighbouring form.
SCHEDULE = {CFCSA_REG: (31, 57), ADOPTION_REG: (44, 50)}

# formNo | asset slug | pfaCode | title | folder
CFCSA_PDF = """1|cfcsa-form1-presentation||Presentation|Applications
2|pfa895|PFA895|Application for an order|Applications
3|pfa100|PFA100|Application to change or cancel an order|Applications
3.1|pfa928|PFA928|Application for an order respecting Indigenous law|Applications
3.2|pfa926|PFA926|Application due to a significant change in circumstance|Applications
4|pfa896|PFA896|Subpoena|Evidence
6|pfa898|PFA898|Release|Orders
7|pfa899|PFA899|Affidavit|Evidence
8|pfa900|PFA900|Notice of address for service|Service
9|pfa901|PFA901|Certificate of service|Service
10.1|pfa878|PFA878|Protection order|Orders
10.2|pfa706|PFA706|Consent adjournment|Case Management
10.3|pfa707|PFA707|Notice of lawyer of record for party|Representation
10.4|pfa708|PFA708|Notice of removal of lawyer of record for party|Representation
10.5|pfa771|PFA771|Application to change method of attendance|Case Management
10.6|pfa929|PFA929|Order respecting an Indigenous law|Orders
11|pfa902|PFA902|Written consent|Evidence"""

# formNo | title | folder — located in the consolidation by heading, see SCHEDULE
CFCSA_LAWS = """5|Warrant|Orders
10|Order|Orders"""

ADOPTION = """1|Notice of intent to receive a child by direct placement|Registry
2|Affidavit - consent to adoption by parent or guardian|Court
3|Affidavit - consent to adoption by child twelve or over|Court
3.1|Affidavit - consent to adoption by director of child protection|Court
4|Application for registration of parent|Registry
5|Birth mother, pre-adoption parent or guardian expenses affidavit|Court"""

CFCSA_CATEGORY = "Provincial Court – Child Protection"
ADOPTION_CATEGORY = {
    "Court": "Supreme Court – Adoption",
    "Registry": "Adoption – Director of Adoption",
}

# Folder order inside the child-protection block of the picker.
CFCSA_FOLDER_ORDER = ["Applications", "Orders", "Evidence", "Case Management",
                      "Representation", "Service"]


def cfcsa_doc_id(form_no):
    """Form 10.5 -> BCPC_CFCSA_10_5.

    The CFCSA prefix is not decoration: the Provincial Court Family Rules already
    ship a Form 1 through Form 52, so a bare BCPC_1 is taken.
    """
    return "BCPC_CFCSA_" + form_no.replace(".", "_")


def adoption_doc_id(form_no):
    return "BCAD_" + form_no.replace(".", "_")


def cfcsa_pdf_sources():
    out = []
    for line in CFCSA_PDF.strip().split("\n"):
        form_no, slug, pfa, name, folder = line.split("|")
        out.append({
            "docId": cfcsa_doc_id(form_no),
            "court": "Provincial",
            "family": "CFCSA",
            "formNo": form_no,
            "pfaCode": pfa or None,
            "name": name,
            "folder": folder,
            "category": CFCSA_CATEGORY,
            "url": PROV_BASE % slug,
            "kind": "acroform",
        })
    return out


def cfcsa_laws_sources():
    out = []
    for line in CFCSA_LAWS.strip().split("\n"):
        form_no, name, folder = line.split("|")
        out.append({
            "docId": cfcsa_doc_id(form_no),
            "court": "Provincial",
            "family": "CFCSA",
            "formNo": form_no,
            "pfaCode": None,
            "name": name,
            "folder": folder,
            "category": CFCSA_CATEGORY,
            "url": BCLAWS % CFCSA_REG,
            "reg": CFCSA_REG,
            "kind": "bclaws",
        })
    return out


def adoption_sources():
    out = []
    for line in ADOPTION.strip().split("\n"):
        form_no, name, folder = line.split("|")
        out.append({
            "docId": adoption_doc_id(form_no),
            "court": "Supreme" if folder == "Court" else "Registry",
            "family": "Adoption",
            "formNo": form_no,
            "pfaCode": None,
            "name": name,
            "folder": folder,
            "category": ADOPTION_CATEGORY[folder],
            "url": BCLAWS % ADOPTION_REG,
            "reg": ADOPTION_REG,
            "kind": "bclaws",
        })
    return out


def all_sources():
    return cfcsa_pdf_sources() + cfcsa_laws_sources() + adoption_sources()


def form_key(form_no):
    """Sorts 3.1 after 3 and before 4, and 10.6 after 10.1."""
    parts = form_no.split(".")
    return tuple(int(p) for p in parts) + (0,) * (3 - len(parts))
