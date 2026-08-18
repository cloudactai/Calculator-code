"""Manitoba form sources, batch 2 -- child protection and adoption.

Batch 1 was the 43 family forms of **Rule 70** of the Court of King's Bench
Rules (`mb_sources.py`). Rule 70 is Manitoba's equivalent of BC's Family Rules
sets only: it prescribes no child-protection form and no adoption form, so the
Manitoba catalogue carried none, exactly as BC's did before batch 3
(`../bc-forms/bc_sources_batch3.py`). This module is those two families, read
off the sources on 2026-08-18.

**Where they are.** Not in a court rule at all -- Manitoba prescribes them by
regulation, and indexes them at
`https://web2.gov.mb.ca/laws/regs/index_forms.php` ("Prescribed forms"), one
block per Act. Four regulations carry the family-law ones:

| Reg | Under | Schedule | Forms |
| --- | --- | --- | --- |
| M.R. 16/99 Child and Family Services Regulation | C.F.S. Act, C.C.S.M. c. C80 | A | 21 (CFS-*) |
| M.R. 14/99 Child Abuse Regulation | C.F.S. Act, C.C.S.M. c. C80 | (the Schedule) | 3 (CA-*) |
| M.R. 19/99 Adoption Regulation | Adoption Act, C.C.S.M. c. A2 | B | 18 (AA-*) |
| M.R. 21/99 Financial Assistance for Adoption Regulation | Adoption Act | A | 1 (FA-1) |

43 forms, 91 pages -- coincidentally the same count as Rule 70.

**The numbering has holes, and they are accounted for rather than assumed.**
Schedule A of M.R. 16/99 runs CFS-1 to CFS-29 but publishes only 21: the
schedule's own table records CFS-1 and CFS-2 repealed by M.R. 180/2003, CFS-4 to
CFS-6 by M.R. 5/2020, CFS-7 to CFS-9 by M.R. 89/2024, and CFS-18 by
M.R. 124/2023. Every remaining row has a PDF, and every PDF has a row. AA-14.1
is an insertion, not a hole.

**One prefix per regulation**, because the prefix is also what makes the
download URL derivable -- each regulation serves its forms out of its own
directory under `/laws/regs/current/forms/`, with its own filename convention
(`form_cfs-22ae.pdf` but `aa14_1e.pdf`). Rule 70's `MBKB_` prefix is not reused:
`MBKB_` names a form the King's Bench prescribes, and a child-protection form is
not one. CFS-11, CFS-12, CFS-17, CFS-19 to CFS-22B and CFS-27 to CFS-29 print
*both* courts in their style of cause -- "THE KING'S BENCH (FAMILY DIVISION) OR
THE PROVINCIAL COURT (FAMILY DIVISION)" -- with the filer striking one out, so
there is no court to name in the id either.

Deliberately **excluded**, found on the same index and recorded here so the next
pass does not have to re-derive the decision:

  Provincial Court Family Rules, M.R. 87/88R, Forms 1-8 -- Application for
      Relief, Answer, Reply, Financial Statement, Order, Notice of Application
      for Guardianship, Affidavit, Garnishing Order. These are Family Law Act
      forms for the *Provincial* Court, i.e. Manitoba's equivalent of BC's
      Provincial Court Family Rules batch, not of its CFCSA batch. They are a
      third batch, not part of this one.
  Family Law Regulation, M.R. 50/2023, Schedules A-C -- the relocation notices
      under The Family Law Act. Same reason: general family division, not child
      protection or adoption.
  Homesteads Regulation, M.R. 121/93, Forms 1-9 -- property, and consented to
      before a commissioner rather than filed.
  The Intercountry Adoption (Hague Convention) Act, C.C.S.M. c. A3 -- prescribes
      no forms of its own; adoptions under it are completed on the AA-* set.
"""

FORMS_BASE = "https://web2.gov.mb.ca/laws/regs/current/forms/%s/%s"

COURT = "King's Bench"

# regulation key -> (directory, filename pattern, docId prefix, citation)
REGULATIONS = {
    "CFS": ("016_99", "form_cfs-%se.pdf", "MBCFS",
            "Child and Family Services Regulation, M.R. 16/99, Schedule A"),
    "CA": ("014_99", "form_ca-%se.pdf", "MBCA",
           "Child Abuse Regulation, M.R. 14/99, Schedule"),
    "AA": ("019_99", "aa%se.pdf", "MBAD",
           "Adoption Regulation, M.R. 19/99, Schedule B"),
    "FA": ("021_99", "form_fa-%se.pdf", "MBFA",
           "Financial Assistance for Adoption Regulation, M.R. 21/99, Schedule A"),
}

# Categories built, catalogued and bound right now. Same switch as Rule 70's
# SHIPPED_CATEGORIES, kept separate so a batch-2 category cannot be turned on by
# a name collision with a Rule 70 one.
SHIPPED_CATEGORIES = set([
    "Child Protection - Applications",
    "Child Protection - Guardianship",
    "Child Protection - Warrants",
    "Child Protection - Orders",
    "Child Protection - Service & Notice",
    "Child Protection - Financial",
    "Child Abuse Registry",
    "Adoption - Placement",
    "Adoption - Consents",
    "Adoption - Court",
    "Adoption - Financial",
])

# (regulation, formNo, title, category, pages)
# `title` is the schedule's own title for the form, not the PDF's cover line;
# `pages` is what the government's file carries, checked on every fetch.
FORMS = [
    # -- Child Protection - Applications -----------------------------------
    ("CFS", "CFS-11", "Notice of Application",
     "Child Protection - Applications", 2),
    ("CFS", "CFS-12", "Notice of Motion to Vary",
     "Child Protection - Applications", 2),
    ("CFS", "CFS-17", "Backer for CFS-19, CFS-20",
     "Child Protection - Applications", 1),
    ("CFS", "CFS-19", "Petition and Notice of Hearing",
     "Child Protection - Applications", 3),
    ("CFS", "CFS-20", "Petition and Notice of Further Hearing",
     "Child Protection - Applications", 2),
    # -- Child Protection - Guardianship -----------------------------------
    ("CFS", "CFS-13", "Voluntary Surrender of Guardianship Agreement by Parents",
     "Child Protection - Guardianship", 4),
    ("CFS", "CFS-14", "Voluntary Surrender of Guardianship Agreement by Guardian(s)",
     "Child Protection - Guardianship", 3),
    ("CFS", "CFS-15", "Voluntary Surrender of Guardianship Agreement by Mother",
     "Child Protection - Guardianship", 4),
    ("CFS", "CFS-16", "Certificate of Interpreter for Voluntary Surrender of "
     "Guardianship Agreement Forms", "Child Protection - Guardianship", 1),
    # -- Child Protection - Warrants ---------------------------------------
    ("CFS", "CFS-23", "Information and Application for a Warrant to Search for a Child",
     "Child Protection - Warrants", 1),
    ("CFS", "CFS-24", "Warrant to Search for a Child",
     "Child Protection - Warrants", 1),
    ("CFS", "CFS-25", "Information and Application to Obtain a Warrant to Apprehend "
     "an Absconded Child", "Child Protection - Warrants", 1),
    ("CFS", "CFS-26", "Warrant to Apprehend an Absconded Child",
     "Child Protection - Warrants", 1),
    # -- Child Protection - Orders -----------------------------------------
    ("CFS", "CFS-27", "Order (by Evidence)", "Child Protection - Orders", 1),
    ("CFS", "CFS-28", "Order (by Consent)", "Child Protection - Orders", 1),
    # -- Child Protection - Service & Notice -------------------------------
    ("CFS", "CFS-3", "Notice of Maternity", "Child Protection - Service & Notice", 2),
    ("CFS", "CFS-21", "Notice of Hearing as Adjourned",
     "Child Protection - Service & Notice", 2),
    ("CFS", "CFS-22A", "Affidavit of Personal Service",
     "Child Protection - Service & Notice", 2),
    ("CFS", "CFS-22B", "Affidavit of Service by Registered Mail on Agency",
     "Child Protection - Service & Notice", 2),
    ("CFS", "CFS-29", "Consent and Waiver of Notice",
     "Child Protection - Service & Notice", 2),
    # -- Child Protection - Financial --------------------------------------
    ("CFS", "CFS-10", "Declaration of Family Income",
     "Child Protection - Financial", 4),
    # -- Child Abuse Registry ----------------------------------------------
    ("CA", "CA-1", "Notice of Opportunity to Provide Information",
     "Child Abuse Registry", 2),
    ("CA", "CA-2", "Affidavit of Service of Notice", "Child Abuse Registry", 2),
    ("CA", "CA-3", "Notice of Intended Entry on Child Abuse Registry",
     "Child Abuse Registry", 2),
    # -- Adoption - Placement ----------------------------------------------
    ("AA", "AA-1", "Notice to Birth Father", "Adoption - Placement", 2),
    ("AA", "AA-2", "Affidavit of Service", "Adoption - Placement", 1),
    ("AA", "AA-3", "Notice of Intent to Receive a Child for Adoption and Request "
     "for Approval of an Agency", "Adoption - Placement", 2),
    ("AA", "AA-4", "Notice of Intent to Place a Child for Adoption and Request "
     "for Approval of an Agency", "Adoption - Placement", 2),
    ("AA", "AA-5", "Notice of Receiving a Child for Adoption",
     "Adoption - Placement", 2),
    ("AA", "AA-6", "Adoption Placement Agreement", "Adoption - Placement", 3),
    ("AA", "AA-13", "Approval of Agency of Placement for Adoption",
     "Adoption - Placement", 1),
    # -- Adoption - Consents -----------------------------------------------
    ("AA", "AA-8", "Consent of Director or Child and Family Services Agency to "
     "Adoption", "Adoption - Consents", 1),
    ("AA", "AA-9", "Consent of Parent to Adoption", "Adoption - Consents", 4),
    ("AA", "AA-10", "Consent of Guardian(s) to Adoption", "Adoption - Consents", 3),
    ("AA", "AA-11", "Consent of Child to Adoption", "Adoption - Consents", 2),
    ("AA", "AA-12", "Certificate of Interpreter", "Adoption - Consents", 1),
    # -- Adoption - Court --------------------------------------------------
    ("AA", "AA-14", "Declaration of Commitment", "Adoption - Court", 2),
    ("AA", "AA-14.1", "Declaration of Commitment to the Child", "Adoption - Court", 2),
    ("AA", "AA-15", "Notice of Application and Application", "Adoption - Court", 3),
    ("AA", "AA-16", "Order of Adoption (Material filed)", "Adoption - Court", 2),
    ("AA", "AA-17", "Order of Adoption (Oral evidence)", "Adoption - Court", 2),
    # -- Adoption - Financial ----------------------------------------------
    ("AA", "AA-7", "Declaration of Family Income", "Adoption - Financial", 4),
    ("FA", "FA-1", "Declaration of Family Income", "Adoption - Financial", 4),
]

CATEGORY_ORDER = [
    "Child Protection - Applications",
    "Child Protection - Guardianship",
    "Child Protection - Warrants",
    "Child Protection - Orders",
    "Child Protection - Service & Notice",
    "Child Protection - Financial",
    "Child Abuse Registry",
    "Adoption - Placement",
    "Adoption - Consents",
    "Adoption - Court",
    "Adoption - Financial",
]


def doc_id(regulation, form_no):
    """CFS-22A -> MBCFS_22A, AA-14.1 -> MBAD_14_1, FA-1 -> MBFA_1."""
    prefix = REGULATIONS[regulation][2]
    stem = form_no.split("-", 1)[1].replace(".", "_")
    return "%s_%s" % (prefix, stem)


def slug(regulation, form_no):
    """The stem the government's filename is built from.

    Each regulation has its own convention, which is why the regulation is
    carried on every row rather than guessed from the form number: M.R. 16/99
    lower-cases the whole number into `form_cfs-22ae.pdf`, M.R. 19/99 drops the
    letters and turns the dot into an underscore for `aa14_1e.pdf`.
    """
    stem = form_no.split("-", 1)[1]
    if regulation == "AA":
        return stem.replace(".", "_")
    return stem.lower()


def source_url(regulation, form_no):
    directory, pattern, _prefix, _cite = REGULATIONS[regulation]
    return FORMS_BASE % (directory, pattern % slug(regulation, form_no))


def all_sources():
    out = []
    for regulation, form_no, title, category, pages in FORMS:
        out.append({
            "docId": doc_id(regulation, form_no),
            "formNo": form_no,
            "title": title,
            "court": COURT,
            "regulation": regulation,
            "citation": REGULATIONS[regulation][3],
            "category": category,
            "shortCategory": category,
            "shortTitle": "MB %s" % form_no,
            "sourceFile": REGULATIONS[regulation][1] % slug(regulation, form_no),
            "expectedPages": pages,
            "url": source_url(regulation, form_no),
            "shipped": category in SHIPPED_CATEGORIES,
        })
    return out


def shipped_sources():
    return [s for s in all_sources() if s["shipped"]]
