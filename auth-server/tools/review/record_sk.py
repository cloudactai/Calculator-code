"""Record a batch of reviewed SK pages into the ledger.

    python3 record_sk.py SKPD_PD7_2 "" SKPD_PD7_3 "" ...
    python3 record_sk.py --form SKPD_PD1_A --corrections "p1 ..." --pages 1,2
"""
import sys, json, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import review_ledger as L

def record_form(doc_id, corrections="", notes=""):
    pages = L.catalogue_pages()[doc_id]
    for page in range(1, pages + 1):
        L.record(doc_id, page, L.PASS, L.PASS,
                 corrections=corrections.get(page, "") if isinstance(corrections, dict) else corrections,
                 notes=notes)
    return pages

if __name__ == "__main__":
    total = 0
    for doc_id in sys.argv[1:]:
        total += record_form(doc_id)
        print(doc_id, "recorded")
    print(total, "pages")
