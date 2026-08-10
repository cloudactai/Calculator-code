"""Rebuild on_sources.json from the government's family-law forms index.

The index page is a single table: form number, title, version date, effective
date, HTML/PDF link, MS Word link. Both links are recorded — a handful of forms
are published only as Word documents, and a couple of rows point at a PDF the
site no longer serves, so `fetch_on.py` needs the fallback.

Run: python3 scrape_on_index.py
"""
import html
import json
import os
import re
import subprocess

HERE = os.path.dirname(os.path.abspath(__file__))
INDEX = "https://ontariocourtforms.on.ca/en/family-law-rules-forms/"
UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 CloudAct-forms-import"


def text(cell):
    return html.unescape(re.sub(r"<[^>]+>", " ", cell)).strip()


def main():
    page = subprocess.run(["curl", "-sSL", "--fail", "-A", UA, INDEX],
                          check=True, capture_output=True).stdout.decode("utf-8", "replace")
    rows = []
    for row in re.findall(r"<tr[^>]*>(.*?)</tr>", page, re.S):
        cells = re.findall(r"<td[^>]*>(.*?)</td>", row, re.S)
        if len(cells) < 6:
            continue  # the header row
        pdf = re.search(r'href="([^"]+\.pdf)"', cells[4])
        docx = re.search(r'href="([^"]+\.docx?)"', cells[5])
        rows.append({
            "num": text(cells[0]),
            "title": text(cells[1]),
            "pdf": pdf.group(1) if pdf else None,
            "docx": docx.group(1) if docx else None,
        })
    if len(rows) < 100:
        raise SystemExit("only %d rows parsed — the index layout has changed" % len(rows))
    with open(os.path.join(HERE, "on_sources.json"), "w") as fh:
        json.dump(rows, fh, indent=1)
        fh.write("\n")
    word_only = [row["num"] for row in rows if not row["pdf"]]
    print("%d forms indexed; %d Word-only: %s" % (len(rows), len(word_only), ", ".join(word_only)))


if __name__ == "__main__":
    main()
