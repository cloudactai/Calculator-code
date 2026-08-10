"""Build the reviewer's checklist for the 90 new Ontario templates.

`HANDOFF.md` §5 counts review coverage honestly and asks for it to stay that way.
This writes one row per form — category, pages, field counts, what the refit changed,
and anything `check_seating.py` still reports — so the list a person works through is
generated from the templates rather than typed out and left to drift.

    python3 review_list.py > ../../form-template-export/ON_REVIEW_LIST.md
"""

import collections
import json
import os

import check_seating
import on_scope

CAT = os.path.join(on_scope.EXPORT, "catalog.json")


def source_of(doc_id):
    if doc_id in on_scope.FLAT_SOURCED:
        return "Word"
    if doc_id in on_scope.XFA_SOURCED:
        return "XFA"
    return "AcroForm"


def main():
    catalog = {r["docId"]: r for r in json.load(open(CAT))}
    print("# Ontario forms — review list\n")
    print("The 90 templates added in the 2026-08 batch. **The 45 Ontario templates")
    print("shipped before it and the 43 BC ones are not in this list and were not")
    print("touched** — they are already reviewed and approved.\n")
    print("`Source` is where the field boxes came from. **AcroForm** boxes are the")
    print("government's own widget rectangles and only moved vertically, to sit on")
    print("their printed rule. **Word** and **XFA** boxes were inferred from the")
    print("printed page, so their widths moved too — review those first.\n")
    print("`Flags` is what `check_seating.py` still reports; blank means it is clean.\n")
    print("| ✔ | Form | Title | Category | Source | Pages | Fields | Flags |")
    print("| --- | --- | --- | --- | --- | --- | --- | --- |")

    order = sorted(on_scope.NEW_DOCIDS,
                   key=lambda d: catalog.get(d, {}).get("sortOrder", 9999))
    totals = collections.Counter()
    for doc_id in order:
        row = catalog.get(doc_id, {})
        fields = json.load(open(os.path.join(on_scope.EXPORT, doc_id + ".json")))["staticFields"]
        pages = max((f["page"] for f in fields), default=0)
        kinds = collections.Counter(f["type"] for f in fields)
        issues = check_seating.check_form(doc_id, on_scope.EXPORT)
        flags = collections.Counter(k for k, _p, _d in issues)
        totals.update(flags)
        totals["pages"] += pages
        shape = f"{kinds.get('TextField', 0)}T/{kinds.get('TextArea', 0)}A/{kinds.get('CheckBox', 0)}C"
        note = ", ".join(f"{k} p{sorted({p for kk, p, _ in issues if kk == k})}"
                         for k in flags) or ""
        title = (row.get("title") or doc_id).replace("|", "/")
        print(f"| ☐ | {row.get('shortTitle', doc_id)} | {title} | "
              f"{row.get('category', '?')} | {source_of(doc_id)} | {pages} | "
              f"{len(fields)} ({shape}) | {note} |")

    print(f"\n**{len(order)} forms, {totals['pages']} pages.** "
          "Fields are counted TextField/TextArea/CheckBox.\n")
    print("Flags still open across the batch: "
          + (", ".join(f"{k} x{v}" for k, v in totals.most_common() if k != "pages")
             or "none") + ".")


if __name__ == "__main__":
    main()
