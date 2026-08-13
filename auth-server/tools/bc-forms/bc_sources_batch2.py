"""BC form sources, batch 2 — every remaining form on the government's two indexes.

Batch 1 (`bc_sources.py`) shipped the 43 forms highlighted in the original scoping
doc. This module is the rest of the published set, read off the government indexes
on 2026-08-12:

  Supreme Court Family Rules  .../court-forms/sup-family-forms
  Provincial Court family     .../court-forms/prov-family-forms

Both indexes now publish stable per-form asset paths (`supreme-family/f19_3.pdf`,
`family/pfa717.pdf`), so batch 2 addresses forms by name rather than by the opaque
GUIDs batch 1 had to use. Every URL below was fetched successfully; nothing here is
inferred from a pattern.

Deliberately excluded (on the index, but not forms):
  PFA950  Instructions for filing a reply - general  — instruction sheet, no fields
  PFA886  Choose which ISO form to use               — decision guide, no fields
  Federal Registration of divorce proceedings        — HTML form the *registry*
          submits to the Central Registry; no PDF asset exists. Same call as batch 1.
"""

SUP_BASE = ("https://www2.gov.bc.ca/assets/gov/law-crime-and-justice/courthouse-services"
            "/court-files-records/court-forms/supreme-family/%s.pdf")
PROV_BASE = ("https://www2.gov.bc.ca/assets/gov/law-crime-and-justice/courthouse-services"
             "/court-files-records/court-forms/family/%s.pdf")

# formNo | title | category  (category = court + function, per BC_MIGRATION_PLAN §7;
# the picker renders each as its own folder). A form whose title begins "Order" goes
# to Orders, following the batch-1 precedent set by F51.1.
SUPREME = """F1|Notice of joint family claim|Applications
F2|Notice of withdrawal from joint family law case|Notices
F7|Notice of withdrawal in family law case in which a divorce is claimed|Notices
F9|Agreement as to annual income|Financial
F11|Notice of publication|Service
F12|Request|Requisitions
F13|Notice and summary of document|Service
F14|Certificate|Service
F15|Affidavit of personal service|Service
F16|Affidavit of ordinary service|Service
F17.1|Requisition - filing of agreement|Requisitions
F17.2|Requisition - parenting coordinator determination|Requisitions
F17.3|Requisition - arbitration award|Requisitions
F18|Certificate of service by sheriff|Service
F18.1|Requisition - general (application)|Requisitions
F19.1|Requisition - method of attendance|Requisitions
F19.3|Case plan proposal|Conferences
F19.4|Case plan order|Orders
F22|Interrogatories|Discovery
F23|Subpoena to witness|Discovery
F24|Notice to admit|Discovery
F25|Order for examination of persons outside the jurisdiction|Orders
F26|Instructions to examiner|Discovery
F27|Order for issue of a letter of request to judicial authority of another jurisdiction|Orders
F28|Letter of request for examination of witness out of jurisdiction|Discovery
F29|Requisition for consent order or for order without notice|Requisitions
F32.001|Requisition - chambers practice|Requisitions
F32.01|Requisition - short notice|Requisitions
F32.1|Order signing instructions|Filing
F32.2|Cover page|Filing
F35|Requisition - undefended family law case|Divorce
F36|Certificate of pleadings|Divorce
F37|Child support affidavit|Divorce
F39|Notice of discontinuance|Notices
F40|Notice of withdrawal|Notices
F41|Security for receiver|Enforcement
F42|Security of receiver by undertaking|Enforcement
F44|Notice of trial|Trial
F47|Notice to produce|Discovery
F48|Notice of intention to proceed|Trial
F49|Notice of intention to call adverse party as a witness|Discovery
F50|Warrant after subpoena|Enforcement
F54|Protection order|Protection Orders
F54.1|Order terminating a protection order|Protection Orders
F54.2|Restraining order|Protection Orders
F57|Writ of seizure and sale|Enforcement
F58|Writ of sequestration|Enforcement
F59|Writ of possession|Enforcement
F60|Writ of delivery|Enforcement
F61|Writ of delivery or assessed value|Enforcement
F62|Acknowledgment of payment|Enforcement
F62.1|Arrest warrant - failure to comply with order made under Family Law Act|Enforcement
F62.2|Order for imprisonment - Family Law Act|Enforcement
F63|Summons to a default hearing under the Family Maintenance Enforcement Act|Enforcement
F64|Summons to a committal hearing under the Family Maintenance Enforcement Act|Enforcement
F65|Arrest warrant|Enforcement
F66|Subpoena to debtor|Enforcement
F67|Examiner's report|Enforcement
F68|Notice of application for committal|Enforcement
F69|Order of committal|Enforcement
F70|Certificate of result of sale|Enforcement
F71|Bill of costs|Costs
F71.1|List of expenses|Costs
F72|Certificate of costs or expenses|Costs
F73|Petition to the court|Applications
F74|Response to petition|Applications
F76|Notice of order|Notices
F77|Notice of interest|Notices
F78|Jurisdictional response|Applications
F79|Notice of appeal if directions required|Appeals
F80|Notice of appeal - specified appeal from provincial court|Appeals
F81|Notice of hearing of appeal|Appeals
F82|Notice of abandonment of appeal|Appeals
F82.1|Order after appeal|Appeals
F82.2|Appellant's statement of argument - specified appeal from provincial court|Appeals
F82.3|Respondent's statement of argument - specified appeal from provincial court|Appeals
F82.4|Appellant's reply - specified appeal from provincial court|Appeals
F83|Order to register foreign judgment|Orders
F84|Affidavit of attainment of majority|Evidence
F85|Order to waive fees|Orders
F86|Affidavit in support to waive fees|Evidence
F86.1|Language change and confirmation - Official languages|Filing
F86.2|Notice of extension - Official languages|Filing
F87|Notice of appointment or change of lawyer|Representation
F88|Notice of intention to act in person|Representation
F90|Objection|Applications
F92|Warrant - contempt|Enforcement
F93|Undertaking|Enforcement
F94|Release order|Enforcement
F94.1|Requisition - leave (vexatious litigant)|Requisitions
F95|Fax cover sheet|Filing
F97|Declaration|Evidence
F98|Notice of appeal from associate judge, registrar or special referee|Appeals
F98.1|Appellant's statement of argument|Appeals
F98.2|Respondent's statement of argument|Appeals
F99|Demand|Costs
F99.1|Offer to settle costs or expenses|Costs
F100|Certificate of mediation|Trial
F101|Affidavit - section 51|Evidence
F102|Statement of information for corollary relief proceedings|Divorce"""

# Supreme entries the index publishes without an "F<n>" number. slug | formNo | title | category
SUP_EXTRA = """pd-58|PD-58|Sealing order|Orders
s-51-consent-child-protection-record-check|S-51|Section 51 - consent for child protection record check|Evidence
sup914|SUP914|Request for protection order registry search|Protection Orders
sup916|SUP916|Request for service of family protection order|Service"""

# formNo | pfaCode | title | category
PROVINCIAL = """1|PFA710|Notice to resolve a family law matter|Notices
2|PFA711|Notice of intention to proceed|Notices
5|PFA733|Guardianship affidavit|Evidence
6|PFA715|Reply to an application about a family law matter|Replies
7|PFA714|Certificate of service|Service
8|PFA716|Reply to a counter application|Replies
9|PFA746|Application for permission and review of family justice manager order or direction|Applications
10|PFA717|Application for case management order|Case Management
11|PFA718|Application for case management order without notice or attendance|Case Management
12|PFA720|Application about a protection order|Protection Orders
15|PFA722|Application about priority parenting matter|Applications
19|PFA731|Written response to application|Replies
20|PFA740|Notice of exemption from parenting education program|Notices
23|PFA748|Subpoena to witness|Evidence
26|PFA736|Request to file an agreement|Agreements
27|PFA744|Request to file a determination of parenting coordinator|Agreements
28|PFA745|Request to file an order|Agreements
29|PFA725|Application about enforcement|Enforcement
30|PFA749|Application for garnishment, summons or warrant|Enforcement
31|PFA750|Summons - general|Enforcement
33|PFA752|Summons to a default hearing|Enforcement
34|PFA753|Summons to a committal hearing|Enforcement
35|PFA754|Application for order under the Family Maintenance Enforcement Act|Enforcement
39|PFA732|Request for scheduling|Case Management
40|PFA758|Notice of lawyer for child|Representation
41|PFA759|Notice of removal of lawyer for child|Representation
46|PFA763|Notice of address change|Notices
47|PFA764|Notice by advertisement|Service
48|PFA765|Affidavit of personal service|Service
49|PFA766|Affidavit of personal service of protection order|Service
50|PFA767|Notice of discontinuance|Notices
52|PFA734|Fax filing cover page|Filing"""

# Provincial entries the index publishes with no PCFR form number — keyed by PFA code.
PROV_EXTRA = """PFA110|Request for service of documents|Service
PFA709|Consent to an informal trial|Trial
PFA876|Order for attendance of a prisoner in a civil or family matter|Orders
PFA893|Request to be heard by teleconference or videoconference|Case Management
PFA907|Requisition|Requisitions
PFA914|Request for protection order registry search|Protection Orders
PFA916|Request for service of family protection order|Service
PFA920|Consent adjournment|Case Management
PFA923|Information form for appointment of lawyer for child|Representation"""

# Folder order inside each court's block of the picker.
SUP_CATEGORY_ORDER = [
    "Applications", "Pleadings", "Financial", "Orders", "Protection Orders",
    "Evidence", "Discovery", "Conferences", "Trial", "Divorce", "Enforcement",
    "Costs", "Appeals", "Notices", "Service", "Representation", "Requisitions",
    "Filing",
]
PROV_CATEGORY_ORDER = [
    "Applications", "Replies", "Financial", "Orders", "Protection Orders",
    "Agreements", "Evidence", "Case Management", "Trial", "Enforcement",
    "Notices", "Service", "Representation", "Requisitions", "Filing",
]


def sup_slug(form_no):
    """F19.3 -> f19_3 (the government's own asset filename)."""
    return "f" + form_no[1:].replace(".", "_")


def sup_doc_id(form_no):
    return "BCSC_" + form_no.replace(".", "_").replace("-", "_")


def prov_doc_id(form_no):
    return "BCPC_" + form_no.replace(".", "_")


def sort_key(src):
    """Numbered forms sort numerically inside their folder; lettered codes go last."""
    order = SUP_CATEGORY_ORDER if src["court"] == "Supreme" else PROV_CATEGORY_ORDER
    raw = src["formNo"].lstrip("F") if src["court"] == "Supreme" else src["formNo"]
    try:
        num = (0, float(raw))
    except ValueError:
        num = (1, 0.0)
    return (order.index(src["category"]), num, src["formNo"])


def all_sources():
    out = []
    for line in SUPREME.strip().splitlines():
        form_no, name, category = line.split("|")
        out.append(dict(docId=sup_doc_id(form_no), court="Supreme", formNo=form_no,
                        pfaCode=None, name=name, category=category,
                        url=SUP_BASE % sup_slug(form_no)))
    for line in SUP_EXTRA.strip().splitlines():
        slug, form_no, name, category = line.split("|")
        out.append(dict(docId=sup_doc_id(form_no), court="Supreme", formNo=form_no,
                        pfaCode=None, name=name, category=category,
                        url=SUP_BASE % slug))
    for line in PROVINCIAL.strip().splitlines():
        form_no, pfa, name, category = line.split("|")
        out.append(dict(docId=prov_doc_id(form_no), court="Provincial", formNo=form_no,
                        pfaCode=pfa, name=name, category=category,
                        url=PROV_BASE % pfa.lower()))
    for line in PROV_EXTRA.strip().splitlines():
        pfa, name, category = line.split("|")
        out.append(dict(docId=prov_doc_id(pfa), court="Provincial", formNo=pfa,
                        pfaCode=pfa, name=name, category=category,
                        url=PROV_BASE % pfa.lower()))
    return out


def _self_check():
    from bc_sources import all_sources as batch1

    srcs = all_sources()
    ids = [s["docId"] for s in srcs]
    assert len(ids) == len(set(ids)), "duplicate docId in batch 2"
    shipped = {s["docId"] for s in batch1()}
    clash = shipped & set(ids)
    assert not clash, "batch 2 re-declares shipped forms: %s" % sorted(clash)
    for src in srcs:
        order = SUP_CATEGORY_ORDER if src["court"] == "Supreme" else PROV_CATEGORY_ORDER
        assert src["category"] in order, (src["docId"], src["category"])
    return srcs


if __name__ == "__main__":
    s = _self_check()
    print("%d batch-2 sources (%d Supreme, %d Provincial)" % (
        len(s), sum(1 for x in s if x["court"] == "Supreme"),
        sum(1 for x in s if x["court"] == "Provincial")))


_BY_DOC_ID = None


def sort_key_for_doc_id(row):
    """`sort_key` for a catalog row (which carries docId, not the source record)."""
    global _BY_DOC_ID
    if _BY_DOC_ID is None:
        _BY_DOC_ID = {s["docId"]: s for s in all_sources()}
    return sort_key(_BY_DOC_ID[row["docId"]])
