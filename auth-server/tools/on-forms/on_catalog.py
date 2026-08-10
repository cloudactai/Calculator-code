"""Catalogue metadata for the Ontario family-law forms.

CATEGORY is the picker's folder for each form number. The names reuse the
folders the shipped 45 already create wherever one fits; Adoption, Affidavits,
Appeals and Case Management are new folders for form families that had no
representative in the original set.

Order comes from the government index itself (`on_sources.json` row order), so
the folders list in the same sequence a lawyer sees on ontariocourtforms.on.ca.
"""

CATEGORY = {
    "6C": "Service",
    "8.01": "Orders",
    "8B.1": "Child Protection",
    "8B.2": "Child Protection",
    "8C": "Child Protection",
    "8D": "Adoption",
    "8D.1": "Adoption",
    "8D.2": "Adoption",
    "8D.3": "Adoption",
    "13C": "Financial Disclosure",
    "15D": "Motion to Change",
    "17B": "Conferences",
    "17D": "Conferences",
    "17F": "Conferences",
    "17G": "Conferences",
    "20": "Evidence & Discovery",
    "20A": "Evidence & Discovery",
    "20.2": "Evidence & Discovery",
    "22A": "Evidence & Discovery",
    "23B": "Evidence & Discovery",
    "23C": "Evidence & Discovery",
    "A-25A": "Divorce",
    "25B": "Orders",
    "25C": "Adoption",
    "25D": "Orders",
    "25E": "Orders",
    "26": "Enforcement",
    "26A": "Enforcement",
    "26C": "Enforcement",
    "26D": "Enforcement",
    "27": "Financial Disclosure",
    "27B": "Financial Disclosure",
    "27C": "Financial Disclosure",
    "28": "Enforcement",
    "28A": "Enforcement",
    "28B": "Enforcement",
    "28C": "Enforcement",
    "29": "Enforcement",
    "29A": "Enforcement",
    "29B": "Enforcement",
    "29C": "Enforcement",
    "29D": "Enforcement",
    "29E": "Enforcement",
    "29F": "Enforcement",
    "29G": "Enforcement",
    "29H": "Enforcement",
    "29I": "Enforcement",
    "29J": "Enforcement",
    "30": "Enforcement",
    "30A": "Enforcement",
    "30B": "Enforcement",
    "32A": "Enforcement",
    "32B": "Enforcement",
    "32C": "Enforcement",
    "32D": "Enforcement",
    "32.1A": "Enforcement",
    "33": "Child Protection",
    "33A": "Child Protection",
    "33B": "Child Protection",
    "33B.1": "Child Protection",
    "33B.2": "Child Protection",
    "33C": "Child Protection",
    "33D": "Child Protection",
    "33E": "Child Protection",
    "33F": "Child Protection",
    "34": "Adoption",
    "34A": "Adoption",
    "34B": "Adoption",
    "34C": "Adoption",
    "34D": "Adoption",
    "34E": "Adoption",
    "34F": "Adoption",
    "34G": "Adoption",
    "34G.1": "Adoption",
    "34H": "Adoption",
    "34H.1": "Adoption",
    "34I": "Adoption",
    "34J": "Adoption",
    "34K": "Adoption",
    "34L": "Adoption",
    "34M": "Adoption",
    "34M.1": "Adoption",
    "34N": "Adoption",
    "35.1": "Affidavits",
    "35.1A": "Child Protection",
    # Form 37 shipped in an earlier batch under Child Protection; it is filed with
    # the interjurisdictional-support set, so it was moved to sit with 37A–37E.
    "37": "Interjurisdictional Support",
    "37A": "Interjurisdictional Support",
    "37B": "Interjurisdictional Support",
    "37C": "Interjurisdictional Support",
    "37D": "Interjurisdictional Support",
    "37E": "Interjurisdictional Support",
    "38": "Appeals",
    "39": "Case Management",
    "43": "Dispute Resolution",
    "43A": "Dispute Resolution",
    "43B": "Dispute Resolution",
    "43C": "Dispute Resolution",
}


def title_for(form_number, form_title):
    """'Form 6C - Lawyer or Paralegal's Certificate of Service'.

    Matches the punctuation the 2026-07 Ontario batch used ("Form 4 - ..."),
    not the older colon style some of the original 25 carry.
    """
    return "Form %s - %s" % (form_number, form_title)


def short_title(form_number):
    return "Form %s" % form_number
