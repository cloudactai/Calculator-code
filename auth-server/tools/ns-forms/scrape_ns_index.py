"""Rebuild `ns_sources.json` from the Courts of Nova Scotia's own forms pages.

Two pages, because Nova Scotia publishes its family forms in two places:

* **Civil Procedure Rules Forms** -- the prescribed forms, under Rule 59 (Family
  Division), Rule 60A (Child and Adult Protection) and Rule 61 (Adoption).
* **Family Division Practice Memorandum Forms** -- the FD series (FD1-FD14 and
  the FDO order templates), which carry the Statements of Income, Property,
  Expenses and Undue Hardship that a financial prefill actually fills.

**Every Nova Scotia form is a Word document.** There is no PDF edition at all --
not an AcroForm, not a flattened one -- so each is rendered through LibreOffice
before anything can be read off it. That is the whole reason this province has
its own builder.

The links on the CPR page are wrapped in Microsoft's Office web viewer:

    https://view.officeapps.live.com/op/view.aspx?src=<the real url>

so the real URL is the percent-decoded `src` parameter. Scraping the wrapper
verbatim downloads Microsoft's HTML viewer instead of the form.

Which rule a form belongs to is taken from **its own URL folder**
(`/Rule 59 Forms/`), not from the page heading it sits under: the headings and
the folders disagree on the CPR page, and the folder is what the court files
the form in.
"""
import html
import json
import os
import re
import subprocess
import sys
import urllib.parse as up

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, "ns_sources.json")

CPR_INDEX = ("https://www.courts.ns.ca/operations/forms-documents/"
             "civil-procedure-rules-forms")
FD_INDEX = ("https://www.courts.ns.ca/operations/forms-documents/"
            "family-division-practice-memorandum-forms")

# The three Civil Procedure Rules that carry family forms. Rule 82
# (Administration of Civil Proceedings) is referenced *by* them for the standard
# heading but is general civil procedure, so it is out of scope -- as are the
# other 30-odd rules on that page.
FAMILY_RULES = ("59", "60A", "61")

RULE_FOLDER = re.compile(r"/Rule (59|60A|61) Forms/")
DOC = re.compile(r"\.(docx?)$", re.I)
LINK = re.compile(r"""href=["']([^"']+)["'][^>]*>(.*?)</a>""", re.I | re.S)


def fetch(url):
    # curl, not urllib: TLS-inspecting proxy, as with every other province.
    return subprocess.run(
        ["curl", "-sSL", "--fail", "--retry", "3", "--retry-delay", "2",
         "-A", "Mozilla/5.0", url],
        check=True, capture_output=True).stdout.decode("utf-8", "replace")


def unwrap(url):
    """The real document URL behind Microsoft's Office web viewer wrapper."""
    url = html.unescape(url)
    if "src=" in url:
        url = up.unquote(url.split("src=", 1)[1])
    return url


def text_of(fragment):
    return html.unescape(
        re.sub(r"\s+", " ", re.sub(r"<[^>]+>", " ", fragment))).strip()


def title_from_filename(url):
    """Nova Scotia names its files descriptively; the page label is often just
    the form number ("Form 59.07"), so the title comes off the filename.

        CPR_Form_59.07_Notice_of_Application.docx -> Notice of Application
        NSSC_Form_60A.20A_Customary_Care_Order_June_2024.docx
            -> Customary Care Order
    """
    stem = re.sub(DOC, "", up.unquote(url).rsplit("/", 1)[-1])
    stem = re.sub(r"^(CPR|NSSC|NSCA)[_ ]+", "", stem)
    stem = re.sub(r"^Form[_ ]+", "", stem)
    stem = re.sub(r"^[0-9]+[A-Za-z]*(\.[0-9]+[A-Za-z]*)?[_ ]+", "", stem)
    # Drop a trailing revision stamp: "_June_2024", "_Dec_2025".
    stem = re.sub(r"[_ ]+(Jan|Feb|Mar|Apr|May|June?|July?|Aug|Sept?|Oct|Nov|Dec)"
                  r"[a-z]*[_ ]+\d{4}$", "", stem, flags=re.I)
    return re.sub(r"[_]+", " ", stem).strip()


FORM_NO_CPR = re.compile(r"Form[_ ]+((?:59|60A|61)\.[0-9]+[A-Z]?)", re.I)
FORM_NO_FD = re.compile(r"^(FDO?\s?\d+[A-Z]?)\b", re.I)


def parse_cpr(page):
    rows, seen = [], set()
    for href, label in LINK.findall(page):
        url = unwrap(href)
        folder = RULE_FOLDER.search(url)
        if not folder or not DOC.search(url) or url in seen:
            continue
        name = up.unquote(url).rsplit("/", 1)[-1]
        match = FORM_NO_CPR.search(name)
        if not match:
            # Fall back to the printed label ("Form 59.07").
            match = re.search(r"((?:59|60A|61)\.[0-9]+[A-Z]?)", text_of(label))
            if not match:
                continue
        seen.add(url)
        rows.append({
            "formNo": match.group(1),
            "rule": folder.group(1),
            "title": title_from_filename(url),
            "url": url,
            "family": "CPR",
        })
    return rows


def parse_fd(page):
    rows, seen = [], set()
    for href, label in LINK.findall(page):
        url = unwrap(href)
        if not DOC.search(url) or url in seen:
            continue
        text = text_of(label)
        match = FORM_NO_FD.match(text)
        if not match:
            # The FD page labels every form "FD 3" / "FD 01"; a link that does
            # not is the consolidated rulebook or a personal-representation
            # sheet, neither of which is a form.
            continue
        seen.add(url)
        # **The filename wins over the page label**, because the label is wrong
        # for the order templates: the court lists them as "FD 01" ... "FD 06",
        # but the files are `FDO1_Interim_Order_...` and the forms themselves
        # print "Form FDO1" -- letter O, for Order, not a zero. Taking the label
        # produced four docIds no form identifies itself by.
        name = up.unquote(url).rsplit("/", 1)[-1]
        from_file = re.match(r"(FDO?\d+[A-Z]?)", name, re.I)
        form_no = re.sub(r"\s+", "",
                         (from_file.group(1) if from_file else match.group(1))).upper()
        rows.append({
            "formNo": form_no,
            "rule": "FD",
            "title": title_from_filename(url),
            "url": url,
            "family": "FD",
        })
    return rows


def main():
    rows = parse_cpr(fetch(CPR_INDEX)) + parse_fd(fetch(FD_INDEX))
    if not rows:
        sys.exit("no form rows parsed -- an index layout changed")
    # A form number can repeat across families (there is an FD 3 and a Form
    # 60A.3); the docId is prefixed per family, so only a clash *within* a
    # family is a problem.
    keys = [(r["family"], r["formNo"]) for r in rows]
    dupes = {k for k in keys if keys.count(k) > 1}
    if dupes:
        sys.exit("duplicate form numbers within a family: %s" % sorted(dupes))

    with open(OUT, "w") as fh:
        json.dump({"cprIndex": CPR_INDEX, "fdIndex": FD_INDEX, "forms": rows},
                  fh, indent=1)
    counts = {}
    for row in rows:
        counts[row["rule"]] = counts.get(row["rule"], 0) + 1
    print("wrote %d forms to %s" % (len(rows), OUT))
    for rule in sorted(counts):
        print("  Rule %-4s %d" % (rule, counts[rule]))


if __name__ == "__main__":
    main()
