"""Rebuild `nb_sources.json` from the Court of King's Bench Family Division's forms page.

The page at

    .../kings-bench/content/family-division/court-forms.html

lists one form per `<li>`, and each carries **two** links:

    <li>Answer - <a href=".../FORM-72d-e.pdf">72D</a>
                 - <a href=".../Form_72D.pdf">Fillable</a></li>

The first is the printed form, the second is the fillable one. **We take the
fillable link**: New Brunswick's fillable PDFs are real AcroForms carrying the
government's own widget rectangles, which is what the overlay is built from. The
printed link is recorded as a fallback for the handful of forms published with
no fillable version.

The two URLs live on different hosts and neither filename is derivable from the
form number -- `72D` is served as `Form_72D.pdf`, `72C` as
`CSS-FOL-SNB-45-9048E.pdf`, `72A` as `FORM-fillable-72a-b.pdf`. There is no
pattern to reconstruct, which is exactly why the links are scraped and recorded
rather than built (Manitoba's slugs *are* derivable; New Brunswick's are not).
"""
import html
import json
import os
import re
import subprocess
import sys

INDEX = ("https://www.courtsnb-coursnb.ca/content/cour/en/kings-bench/"
         "content/family-division/court-forms.html")
HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, "nb_sources.json")

ITEM = re.compile(r"<li\b[^>]*>(.*?)</li>", re.I | re.S)
ANCHOR = re.compile(r"""<a\b[^>]*href=["']([^"']+)["'][^>]*>(.*?)</a>""", re.I | re.S)
# "72D", "72FF", "73AA", "81A", "7A", "18A", "37A", "47B", "25A"
FORM_NO = re.compile(r"^\(?(\d{1,2}[A-Z]{1,2})\)?$")
# The rules that make a form a *family* form. 72 is Divorce Proceedings, 73 the
# Family Division and 81 the Family Law Rule for case-management districts. The
# page also links a few general-procedure forms (7A litigation guardian, 18A
# acknowledgement of receipt, 25A discontinuance, 37A notice of motion, 47B
# certificate of readiness) because a family proceeding uses them, so they are in
# scope for the same reason the court lists them here.
FAMILY_RULES = ("72", "73", "81", "7", "18", "25", "37", "47")


def text_of(fragment):
    return html.unescape(
        re.sub(r"\s+", " ", re.sub(r"<[^>]+>", " ", fragment))).strip()


def fetch(url):
    # curl, not urllib: TLS-inspecting proxy, as with every other province.
    return subprocess.run(
        ["curl", "-sSL", "--fail", "--retry", "3", "--retry-delay", "2",
         "-A", "Mozilla/5.0", url],
        check=True, capture_output=True).stdout.decode("utf-8", "replace")


def rule_of(form_no):
    match = re.match(r"^(\d{1,2})", form_no)
    return match.group(1) if match else None


def parse(page):
    rows, seen = [], set()
    for chunk in ITEM.findall(page):
        anchors = ANCHOR.findall(chunk)
        if not anchors:
            continue
        printed = fillable = None
        form_no = None
        for href, label in anchors:
            label_text = text_of(label)
            href = html.unescape(href)
            if not re.search(r"\.pdf$", href, re.I):
                continue
            if re.fullmatch(r"fillable", label_text, re.I):
                fillable = href
                continue
            match = FORM_NO.match(label_text)
            if match:
                form_no = match.group(1)
                printed = href
            elif printed is None:
                printed = href
        # The label may name the form instead of numbering the link, e.g.
        # "Certificate of Solicitor (72FF)" or "Divorce Judgment (72M)".
        whole = text_of(chunk)
        if not form_no:
            trailing = re.search(r"\((\d{1,2}[A-Z]{1,2})\)", whole)
            if trailing:
                form_no = trailing.group(1)
        if not form_no or not (printed or fillable):
            continue
        if rule_of(form_no) not in FAMILY_RULES:
            continue
        if form_no in seen:
            continue
        seen.add(form_no)
        # Title: the item's text with the form number and the link words removed.
        title = re.sub(r"\(?\b%s\b\)?" % re.escape(form_no), "", whole)
        title = re.sub(r"\bFillable\b", "", title, flags=re.I)
        title = re.sub(r"[\s|\-–—]+$", "", re.sub(r"^[\s|\-–—]+", "", title)).strip()
        title = re.sub(r"\s*[|\-–—]\s*$", "", title).strip()
        rows.append({
            "formNo": form_no,
            "rule": rule_of(form_no),
            "title": title or form_no,
            "fillable": fillable,
            "printed": printed,
        })
    return rows


def main():
    rows = parse(fetch(INDEX))
    if not rows:
        sys.exit("no form rows parsed -- the index layout changed")
    with open(OUT, "w") as fh:
        json.dump({"index": INDEX, "forms": rows}, fh, indent=1)
    no_fill = [r["formNo"] for r in rows if not r["fillable"]]
    print("wrote %d forms to %s" % (len(rows), OUT))
    print("with a fillable version: %d" % sum(1 for r in rows if r["fillable"]))
    if no_fill:
        print("printed-only (no fillable published): %s" % ", ".join(no_fill))


if __name__ == "__main__":
    main()
