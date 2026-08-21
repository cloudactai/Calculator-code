"""The per-page review ledger, and the check that says whether it is complete.

Automated gates are necessary and not sufficient: both province READMEs record
batches where most of the defects found by reading the pages were invisible to
every gate, because no gate was asking the question. So every page of every new
template is read twice --

  **pass 1** the overlay against the government's own source page: is there a
            field on everything that can be written on, is anything on printed
            text or on a signature line, is each field the right type and
            extent;
  **pass 2** the *filled* render, from the regenerated final output: does a real
            value land on the line, fit its box, wrap where it should, and does
            a tick land inside its square.

-- and the result of each is written down here, per page, with whatever was
corrected in between.

`ledger.json` is the artifact. `--check` is the gate over it:

  * every page of every template in scope has exactly one row;
  * no row is missing, duplicated, or out of range;
  * every row records both passes as `pass`;
  * the ledger's page total equals the catalogue's page total for those
    templates.

A row cannot be marked reviewed by this tool. It is written by
`record(...)` from the reviewer's own notes after the renders in
`_review/<docId>/` have actually been opened, which is the one part of this
that no script can do.

    python3 review_ledger.py --check
    python3 review_ledger.py --status
"""
import argparse
import collections
import json
import os
import subprocess

HERE = os.path.dirname(os.path.abspath(__file__))
EXPORT = os.path.abspath(os.path.join(HERE, "..", "..", "form-template-export"))
LEDGER = os.path.join(HERE, "ledger.json")

PASS = "pass"


def build_id():
    """The commit the review was carried out against, for the row stamp."""
    try:
        return subprocess.run(["git", "rev-parse", "--short", "HEAD"],
                              cwd=HERE, capture_output=True, text=True,
                              check=True).stdout.strip()
    except Exception:  # noqa: BLE001
        return "unknown"


def scope():
    """The templates this ledger covers: the batch-3 rows of both provinces."""
    import sys
    sys.path.insert(0, os.path.join(HERE, "..", "mb-forms"))
    sys.path.insert(0, os.path.join(HERE, "..", "sk-forms"))
    import mb_sources_batch3
    import sk_sources_pd
    rows = []
    for src in mb_sources_batch3.all_sources():
        rows.append(("MB", src))
    for src in sk_sources_pd.all_pd_sources():
        rows.append(("SK", src))
    return rows


def catalogue_pages():
    """docId -> pageCount, from the catalogue that will actually be served."""
    catalog = json.load(open(os.path.join(EXPORT, "catalog.json")))
    return {row["docId"]: row.get("pageCount") for row in catalog}


def load():
    if not os.path.exists(LEDGER):
        return []
    return json.load(open(LEDGER))


def save(rows):
    rows.sort(key=lambda r: (r["province"], r["docId"], r["page"]))
    with open(LEDGER, "w") as fh:
        json.dump(rows, fh, indent=1)
        fh.write("\n")


def record(doc_id, page, first_pass, final_pass, corrections="",
           source_reviewed=True, overlay_reviewed=True, notes=""):
    """Write (or replace) one page's row."""
    rows = [r for r in load() if not (r["docId"] == doc_id and r["page"] == page)]
    meta = {src["docId"]: (province, src) for province, src in scope()}
    province, src = meta[doc_id]
    rows.append({
        "province": province,
        "docId": doc_id,
        "formNo": src["formNo"],
        "title": src["title"],
        "category": src["category"],
        "page": page,
        "sourceReviewed": bool(source_reviewed),
        "overlayReviewed": bool(overlay_reviewed),
        "firstPass": first_pass,
        "corrections": corrections,
        "finalPass": final_pass,
        "notes": notes,
        "build": build_id(),
    })
    save(rows)
    return rows


def check():
    """Gate: is the ledger complete and does every page pass both reads?"""
    rows = load()
    pages = catalogue_pages()
    problems = []
    seen = collections.Counter((r["docId"], r["page"]) for r in rows)

    for _province, src in scope():
        doc_id = src["docId"]
        expected = pages.get(doc_id)
        if expected is None:
            problems.append("%s is not in the catalogue" % doc_id)
            continue
        for page in range(1, expected + 1):
            count = seen.get((doc_id, page), 0)
            if count == 0:
                problems.append("%s p%d has no ledger row" % (doc_id, page))
            elif count > 1:
                problems.append("%s p%d has %d ledger rows" % (doc_id, page, count))

    in_scope = {src["docId"] for _p, src in scope()}
    for row in rows:
        if row["docId"] not in in_scope:
            problems.append("%s is not in scope" % row["docId"])
            continue
        expected = pages.get(row["docId"]) or 0
        if not 1 <= row["page"] <= expected:
            problems.append("%s p%d is out of range (1-%d)"
                            % (row["docId"], row["page"], expected))
        if not row.get("sourceReviewed"):
            problems.append("%s p%d: source not reviewed" % (row["docId"], row["page"]))
        if not row.get("overlayReviewed"):
            problems.append("%s p%d: overlay not reviewed" % (row["docId"], row["page"]))
        if row.get("firstPass") != PASS:
            problems.append("%s p%d: first pass is %r"
                            % (row["docId"], row["page"], row.get("firstPass")))
        if row.get("finalPass") != PASS:
            problems.append("%s p%d: final pass is %r"
                            % (row["docId"], row["page"], row.get("finalPass")))

    expected_total = sum((pages.get(src["docId"]) or 0) for _p, src in scope())
    if len(rows) != expected_total:
        problems.append("ledger has %d rows; the templates have %d pages"
                        % (len(rows), expected_total))
    return problems, len(rows), expected_total


def status():
    rows = load()
    pages = catalogue_pages()
    by_form = collections.Counter(r["docId"] for r in rows)
    done = corrected = 0
    for _province, src in scope():
        doc_id = src["docId"]
        expected = pages.get(doc_id) or 0
        have = by_form.get(doc_id, 0)
        mark = "OK " if have == expected and expected else "%2d/%-2d" % (have, expected)
        if have == expected and expected:
            done += 1
        print("%-24s %s" % (doc_id, mark))
    corrected = sum(1 for r in rows if r.get("corrections"))
    print("\n%d of %d forms fully recorded, %d pages, %d pages corrected"
          % (done, len(scope()), len(rows), corrected))


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--check", action="store_true")
    parser.add_argument("--status", action="store_true")
    args = parser.parse_args()
    if args.status:
        status()
        return 0
    problems, have, expected = check()
    print("%d ledger rows, %d template pages in scope" % (have, expected))
    if problems:
        print("\n%d problem(s):" % len(problems))
        for problem in problems[:40]:
            print("   %s" % problem)
        if len(problems) > 40:
            print("   ... and %d more" % (len(problems) - 40))
        return 1
    print("Ledger complete: every page reviewed against source and overlay, "
          "and re-read from the final output.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
