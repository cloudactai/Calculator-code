"""Saskatchewan King's Bench family-law form sources (Part 15 of The King's Bench Rules).

Published by the Office of the King's Printer through the Saskatchewan Publications
Centre. Every form is fetched from that site's own API; the download URL is built
from the product and format ids recorded here, so a source can be re-fetched
verbatim and checked against the sha256 in the manifest.

docId scheme: SKKB_<formNo> with the hyphen turned into an underscore --
"15-47" -> SKKB_15_47, "15-48A" -> SKKB_15_48A. The SKKB_ prefix keeps these
clear of Ontario's FormNN and BC's BCSC_/BCPC_.

Part 16 (probate and estates) and the civil parts are deliberately out of scope:
this catalogue is family law, matching the Ontario and BC sets.
"""

BASE = "https://publications.saskatchewan.ca/api/v1/products/%d/formats/%d/download"

COURT = "King's Bench"

# (formNo, rule, title, category, productId, formatId, sourceFile, pages)
FORMS = [
    ("15-47", "15-47", "Financial Statement of", "Financial", 114600, 129453, "KBForm15-47.pdf", 21),
    ("15-48A", "15-48", "Waiver of Financial Statement", "Financial", 114601, 129456, "KBForm15-48A.pdf", 1),
    ("15-48B", "15-48", "Agreement as to Child Support", "Financial", 114602, 129457, "KBForm15-48B.pdf", 2),
    ("15-49", "15-49", "Property Statement of", "Financial", 114618, 129479, "KBForm15-49.pdf", 9),
    ("15-50", "15-50", "Waiver of Property Statements", "Financial", 114619, 129480, "KBForm15-50.pdf", 1),
    ("15-51", "15-51", "Notice to file a Financial Statement", "Financial", 114620, 129485, "KBForm15-51.pdf", 3),
    ("15-52", "15-52", "Notice to Disclose", "Financial", 114621, 129484, "KBForm15-52.pdf", 3),
    ("15-53", "15-53", "Notice to Reply to Written Questions", "Financial", 114632, 129496, "KBForm15-53.pdf", 2),
    ("15-16", "15-16", "Petition", "Pleadings", 114412, 129077, "KBForm15-16.pdf", 14),
    ("15-19A", "15-19", "Answer", "Pleadings", 114413, 129080, "KBForm15-19A.pdf", 5),
    ("15-19B", "15-19", "Notice of Intent to Answer", "Pleadings", 114414, 129081, "KBForm15-19B.pdf", 2),
    ("15-20", "15-20", "Answer and Counter-petition", "Pleadings", 114422, 129106, "KBForm15-20.pdf", 15),
    ("15-21", "15-21", "Demand for Notice", "Pleadings", 114423, 129109, "KBForm15-21.pdf", 2),
    ("15-22", "15-22", "Reply", "Pleadings", 114522, 129308, "KBForm15-22.pdf", 2),
    ("15-100A", "15-100", "Joint Petition", "Pleadings", 114638, 129510, "KBForm15-100A.pdf", 12),
    ("15-100B", "15-100", "Notice of Withdrawal of Joint Petition", "Pleadings", 114640, 129511, "KBForm15-100B.pdf", 2),
    ("15-24", "15-24", "Application for Corollary Relief", "Applications", 114527, 129319, "KBForm15-24.pdf", 4),
    ("15-25", "15-25", "Answer to Application for Corollary Relief", "Applications", 114530, 129330, "KBForm15-25.pdf", 4),
    ("15-26", "15-26", "Application for Variation of a Final Order", "Applications", 114537, 129337, "KBForm15-26.pdf", 5),
    ("15-29", "15-29", "Answer to Application for Variation of a Final Order", "Applications", 114539, 129340, "KBForm15-29.pdf", 5),
    ("15-32", "15-32", "Notice of Application", "Applications", 114542, 129347, "KBForm15-32.pdf", 3),
    ("15-34", "15-34", "Application without Notice", "Applications", 114592, 129441, "KBForm15-34.pdf", 2),
    ("15-36", "15-36", "Appearance Day Notice", "Applications", 114593, 129444, "KBForm15-36.pdf", 2),
    ("15-40", "15-40", "Application for Procedural Matter(s)", "Applications", 114594, 129445, "KBForm15-40.pdf", 3),
    ("15-41", "15-41", "Application for Substantive Interim Relief", "Applications", 114595, 129448, "KBForm15-41.pdf", 3),
    ("15-43", "15-43", "Application for Summary Judgment", "Applications", 114597, 129449, "KBForm15-43.pdf", 3),
    ("15-44", "15-44", "Application for Variation of an Interim Order", "Applications", 114599, 129452, "KBForm15-44.pdf", 3),
    ("15-109", "15-109", "Notice of Application", "Applications", 114643, 129518, "KBForm15-109.pdf", 2),
    ("15-110", "15-110", "Request for Conversion", "Applications", 114644, 129519, "KBForm15-110.pdf", 2),
    ("15-111", "15-111", "Notice of Taking of Further Evidence", "Applications", 114645, 129523, "KBForm15-111.pdf", 2),
    ("15-8A", "15-8", "Affidavit of Personal Service", "Service", 114410, 129073, "KBForm15-8A.pdf", 1),
    ("15-8B", "15-8", "Affidavit of Service by Alternate Mode", "Service", 114411, 129076, "KBForm15-8B.pdf", 4),
    ("15-78", "15-78", "Affidavit of Petitioner (or Respondent)", "Affidavits", 114636, 129505, "KBForm15-78.pdf", 7),
    ("15-82", "15-82", "Affidavit or Respondent", "Affidavits", 114637, 129506, "KBForm15-82.pdf", 1),
    ("15-76A", "15-76", "Application for Judgment in an Uncontested Family Law Proceeding/Uncontested Divorce Proceeding", "Divorce & Judgment", 114634, 129500, "KBForm15-76A.pdf", 4),
    ("15-76B", "15-76", "Notice of Application for Judgment in an Uncontested Family Law Proceeding/Uncontested Divorce Proceeding", "Divorce & Judgment", 114635, 129503, "KBForm15-76B.pdf", 4),
    ("15-102", "15-102", "Judgment", "Divorce & Judgment", 114641, 129514, "KBForm15-102.pdf", 1),
    ("15-103", "15-103", "Certificate of Divorce", "Divorce & Judgment", 114642, 129515, "KBForm15-103.pdf", 1),
    ("15-61", "15-61", "Joint request for a Family Law Pre-Trial Conference", "Conferences", 114633, 129499, "KBForm15-61.pdf", 3),
    ("15-138", "15-138", "Warrant of Committal for Contempt for Failure to Comply with a Maintenance Order", "Enforcement", 114647, 129524, "KBForm15-138.pdf", 2),
]

CATEGORY_ORDER = [
    'Financial',
    'Pleadings',
    'Applications',
    'Service',
    'Affidavits',
    'Divorce & Judgment',
    'Conferences',
    'Enforcement',
]


def doc_id(form_no):
    return "SKKB_" + form_no.replace("-", "_")


def all_sources():
    """Every Part 15 form as a dict, in catalogue order."""
    out = []
    for form_no, rule, title, category, product, fmt, src, pages in FORMS:
        out.append({
            "docId": doc_id(form_no),
            "formNo": form_no,
            "rule": rule,
            "title": title,
            "court": COURT,
            "category": "King's Bench - " + category,
            "sourceFile": src,
            "expectedPages": pages,
            "url": BASE % (product, fmt),
        })
    return out
