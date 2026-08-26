"""Rebuild `nl_sources.json` from the Supreme Court's own Family Law Forms page.

The page at

    https://www.court.nl.ca/supreme/rules-practice-notes-and-forms/family/general/

lists every family form in a plain HTML table, one row per form:

    <td>F4.03A &#8211; Originating Application</td>
    <td><a href=".../F4.03A-Originating-Application-2022-07.pdf">PDF Version</a></td>
    <td><a href=".../F4.03A-Originating-Application-2022-07.docx">Word Version</a></td>

so the form number, its title and both download links come out of one row and
there is no per-form id to record (unlike Saskatchewan, whose downloads need a
product and format id out of a database).

We take the **PDF** link. Newfoundland publishes its family forms as real
AcroForm documents -- the government's own widget rectangles are the ground
truth the overlay is built from -- so the Word copy is only a fallback for a row
whose PDF is missing.

Run it when the court publishes a new edition; otherwise the committed
`nl_sources.json` is enough.
"""
import html
import json
import os
import re
import subprocess
import sys

INDEX = ("https://www.court.nl.ca/supreme/rules-practice-notes-and-forms/"
         "family/general/")
HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, "nl_sources.json")

# A row's first cell reads "F4.03A – Originating Application". The dash is an
# en dash on every row we have seen, but a hyphen is accepted too so a hand
# edit on the court's side does not silently drop a form.
ROW = re.compile(
    r"<tr[^>]*>(.*?)</tr>", re.I | re.S)
CELL = re.compile(r"<td[^>]*>(.*?)</td>", re.I | re.S)
LINK = re.compile(r"""href=["']([^"']+)["']""", re.I)
# "F4.03A", "F16A.03B", "F10.02A" -- letter F, a rule number that may carry its
# own letter (16A), a dot, a sub-number and a trailing letter. The optional
# "Form " prefix is not decoration: the six FOAEAA affidavits are the only rows
# that carry it, and requiring the bare number silently dropped all six.
FORM_NO = re.compile(r"^(?:Form\s+)?(F\d+[A-Z]?\.\d+[A-Z]?)\b")

# Rows the court publishes with no rule number at all -- "Order (Blank)",
# "Affidavit (Family Law)", "Subpoena", the three FOAEAA order templates. They
# are ordinary filing documents, not drafting aids, so they are in scope; they
# just have no number to key on and get a slug built from the title instead.
SLUG_STRIP = re.compile(r"[^a-z0-9]+")


def slug_of(title):
    words = [w for w in SLUG_STRIP.split(title.lower()) if w]
    # Trim on a word boundary, not mid-word: a docId is read by people.
    slug, out = "", []
    for word in words:
        if len(slug) + len(word) + 1 > 44:
            break
        out.append(word)
        slug = "_".join(out)
    return (slug or words[0][:44]).upper()


def text_of(fragment):
    return html.unescape(re.sub(r"\s+", " ", re.sub(r"<[^>]+>", " ", fragment))).strip()


def fetch(url):
    # curl, not urllib: this box sits behind a TLS-inspecting proxy whose root is
    # in the system trust store but not in certifi. Every other province's
    # fetcher shells out for the same reason.
    return subprocess.run(
        ["curl", "-sSL", "--fail", "--retry", "3", "--retry-delay", "2",
         "-A", "Mozilla/5.0", url],
        check=True, capture_output=True).stdout.decode("utf-8", "replace")


def parse(page):
    rows = []
    for chunk in ROW.findall(page):
        cells = CELL.findall(chunk)
        if len(cells) < 2:
            continue
        label = text_of(cells[0])
        match = FORM_NO.match(label)
        if match:
            form_no = match.group(1)
            numbered = True
            # Everything after the dash is the title; the FOAEAA rows separate
            # number from title with a space rather than a dash.
            title = label[match.end():].strip()
            # One row publishes three forms in a single PDF ("F38.04A, F38.04B,
            # F38.06A - Return of Child ..."). Keep the first number as the id
            # and let the sibling numbers stay in the title, so the picker still
            # shows what the file actually contains.
            siblings = re.match(r"^((?:\s*,\s*F\d+[A-Z]?\.\d+[A-Z]?)+)", title)
            extra = ""
            if siblings:
                extra = ", ".join(
                    re.findall(r"F\d+[A-Z]?\.\d+[A-Z]?", siblings.group(1)))
                title = title[siblings.end():].strip()
            title = re.sub(r"^[‐-―-]\s*", "", title).strip()
            if extra:
                title = "%s (with %s)" % (title, extra)
        else:
            # Unnumbered: keep the printed name as the title and slug it.
            form_no = slug_of(label)
            numbered = False
            title = label
            if not form_no:
                continue
        pdf = word = None
        for cell in cells[1:]:
            link = LINK.search(cell)
            if not link:
                continue
            href = html.unescape(link.group(1))
            if href.lower().endswith(".pdf"):
                pdf = href
            elif re.search(r"\.docx?$", href, re.I):
                word = href
        if not pdf and not word:
            continue
        rows.append({
            "formNo": form_no,
            "numbered": numbered,
            "title": title or form_no,
            "pdf": pdf,
            "word": word,
        })
    return rows


def main():
    page = fetch(INDEX)
    rows = parse(page)
    if not rows:
        sys.exit("no form rows parsed -- the index layout changed")

    # The court lists a handful of forms twice (once in a "how to" block and
    # again in its rule's table). Keep the first occurrence of each number.
    seen, unique = set(), []
    for row in rows:
        if row["formNo"] in seen:
            continue
        seen.add(row["formNo"])
        unique.append(row)

    with open(OUT, "w") as fh:
        json.dump({"index": INDEX, "forms": unique}, fh, indent=1)
    no_pdf = [r["formNo"] for r in unique if not r["pdf"]]
    print("wrote %d forms to %s" % (len(unique), OUT))
    if no_pdf:
        print("Word-only (no PDF published): %s" % ", ".join(no_pdf))


if __name__ == "__main__":
    main()
