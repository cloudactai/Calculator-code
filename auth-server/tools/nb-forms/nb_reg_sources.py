"""New Brunswick's *regulation* family forms -- child protection and parentage.

The 34 forms in `nb_sources.py` come from the Rules of Court. They are the whole
of what the Court of King's Bench prescribes for a family proceeding between two
parties, and none of them starts a child-protection case: New Brunswick puts
those forms in a **regulation** instead, the way BC, Saskatchewan and Manitoba
do, and the Rules of Court never mention them.

## Two regulations, 14 forms

| Regulation | What it is | Forms |
| --- | --- | --- |
| 81-134 | Forms Regulation -- Family Services Act | 13 |
| 2021-18 | General Regulation -- Family Law Act | 1 |

Regulation 81-134 is the Minister of Social Development's set: the warrants that
authorise entering a home and removing a child, the orders that follow
(supervisory, protective intervention, consent for treatment, removal), and the
parentage declarations. Regulation 2021-18 turns out to prescribe a single form,
a certificate that files a support agreement as a judgment -- it was carried in
the migration notes as an open batch and it is one form, not a family.

**33 of Regulation 81-134's forms are repealed** -- Forms 0.1, 0.2, 1, 2 through
21 and 26 through 31 went in 2023 (c.36, s.14) -- and they still appear in the
consolidation, each as a heading followed by the word "Repealed". Only the 13
that carry an actual form are listed here. Reading that distinction off the
consolidation is the only way to get it right; the count of "forms in the
regulation" is 46.

## Source format

Each form has its **own PDF** on `laws.gnb.ca`, cut from the consolidation by
the King's Printer, so the background ships as the government's own file and
there is no page-cutting step -- unlike BC's CFCSA forms, which had to be sliced
out of a single consolidation PDF.

The blanks are printed as **dot leaders** -- ". . . . . . . . . ." -- which is a
vocabulary no other batch in this catalogue uses. See `nb_reg_anchors.py`.
"""

COURT = "Court of King's Bench of New Brunswick (Family Division)"

RESOURCE = "https://laws.gnb.ca/en/resource/cr/"

# (form number, King's Printer resource stem, title, category)
#
# The resource stem is the King's Printer's own file name for the form. It
# encodes the form's *position* in the consolidation, not its number, which is
# why Form 22 is `038` -- the 33 repealed forms still occupy their slots.
_FSA = [
    ("1.01", "81-134_en_004_004", "Warrant (subsection 35(3))",
     "Child Protection"),
    ("1.02", "81-134_en_005_005", "Warrant for Removal (subsection 36(1))",
     "Child Protection"),
    ("1.03", "81-134_en_006_004", "Supervisory Order", "Orders & Judgments"),
    ("1.04", "81-134_en_007_004", "Supervisory Order with Trusteeship",
     "Orders & Judgments"),
    ("1.1", "81-134_en_008_005",
     "Warrant for Removal (paragraph 39(1)(b.1))", "Child Protection"),
    ("1.2", "81-134_en_009_005", "Protective Intervention Order",
     "Orders & Judgments"),
    ("1.3", "81-134_en_010_004", "Consent for Treatment Order",
     "Orders & Judgments"),
    ("1.4", "81-134_en_011_004",
     "Order to Vary, Extend or Terminate an Order", "Orders & Judgments"),
    ("1.5", "81-134_en_012_004", "Order for Removal", "Orders & Judgments"),
    ("22", "81-134_en_038_002", "Declaratory Order Respecting Parentage",
     "Parentage"),
    ("23", "81-134_en_039_001",
     "Statutory Declaration of Parentage (by both parents)", "Parentage"),
    ("24", "81-134_en_040_001",
     "Statutory Declaration of Parentage (by the father)", "Parentage"),
    ("25", "81-134_en_041_002",
     "Statement of Finding or Confirmation of Parentage", "Parentage"),
]

_FLA = [
    ("1", "2021-18_en_001_002", "Certificate as Judgment", "Enforcement"),
]


def doc_id(regulation, form_no):
    slug = form_no.replace(".", "_")
    return "NB%s_%s" % (regulation, slug)


def all_sources():
    out = []
    for form_no, stem, title, category in _FSA:
        out.append({
            "docId": doc_id("FSA", form_no),
            "formNo": form_no,
            "title": title,
            "category": category,
            "regulation": "81-134",
            "act": "Family Services Act",
            "url": RESOURCE + stem + ".pdf",
            "court": COURT,
        })
    for form_no, stem, title, category in _FLA:
        out.append({
            "docId": doc_id("FLA", form_no),
            "formNo": form_no,
            "title": title,
            "category": category,
            "regulation": "2021-18",
            "act": "Family Law Act",
            "url": RESOURCE + stem + ".pdf",
            "court": COURT,
        })
    return out


def shipped_sources():
    return all_sources()
