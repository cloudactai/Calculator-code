"""Download the Ontario family-law forms that are not in the catalog yet.

The source of truth is the government's own index page
(https://ontariocourtforms.on.ca/en/family-law-rules-forms/); `on_sources.json`
is that page's table, scraped with `scrape_on_index.py`. Only forms whose docId
is missing from `catalog.json` are fetched, so re-running this never disturbs a
template that has already shipped.

Run: python3 fetch_on.py [--refresh-index]
"""
import json
import os
import subprocess
import sys
import time

HERE = os.path.dirname(os.path.abspath(__file__))
EXPORT = os.path.abspath(os.path.join(HERE, "..", "..", "form-template-export"))
STAGE = os.path.join(EXPORT, "_incoming_on")
BASE = "https://ontariocourtforms.on.ca"
UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 CloudAct-forms-import"


def doc_id(form_number):
    """'13.1' -> 'Form13_1', matching the docIds already in the catalog."""
    return "Form" + form_number.replace(".", "_").replace("-", "_")


def load_sources():
    with open(os.path.join(HERE, "on_sources.json")) as fh:
        return json.load(fh)


def catalog_doc_ids():
    with open(os.path.join(EXPORT, "catalog.json")) as fh:
        return {e["docId"] for e in json.load(fh) if e.get("province") == "ON"}


def download(url, dest):
    # curl rather than urllib: the machine's Python trust store rejects the TLS
    # chain this network presents, and curl uses the system keychain.
    subprocess.run(
        ["curl", "-sSL", "--fail", "-A", UA, "--retry", "3", "--max-time", "120", "-o", dest, url],
        check=True,
    )
    size = os.path.getsize(dest)
    if size < 1000:
        os.remove(dest)
        raise SystemExit("suspiciously small download: %s (%d bytes)" % (url, size))
    return size


def main():
    os.makedirs(STAGE, exist_ok=True)
    have = catalog_doc_ids()
    manifest, unavailable = [], []
    for source in load_sources():
        did = doc_id(source["num"])
        if did in have:
            continue
        # Prefer the PDF; a Word-only form is recorded here and converted separately.
        href = source["pdf"] or source["docx"]
        suffix = ".pdf" if source["pdf"] else os.path.splitext(href)[1]
        dest = os.path.join(STAGE, "%s_source%s" % (did, suffix))
        entry = {
            "docId": did,
            "formNumber": source["num"],
            "title": source["title"],
            "url": BASE + href,
            "file": os.path.basename(dest),
            "wordOnly": not source["pdf"],
        }
        if os.path.exists(dest):
            entry["bytes"] = os.path.getsize(dest)
            manifest.append(entry)
            print("%-12s cached" % did)
            continue
        try:
            entry["bytes"] = download(entry["url"], dest)
        except subprocess.CalledProcessError:
            # A few index rows point at a PDF the site no longer serves (37E is a
            # 404 today). Fall back to the Word version rather than dropping the form.
            if source["pdf"] and source["docx"]:
                dest = os.path.join(STAGE, "%s_source.docx" % did)
                entry.update(url=BASE + source["docx"], file=os.path.basename(dest),
                             wordOnly=True, pdfMissing=True)
                entry["bytes"] = download(entry["url"], dest)
            else:
                unavailable.append(did)
                print("%-12s UNAVAILABLE (%s)" % (did, entry["url"]))
                continue
        manifest.append(entry)
        print("%-12s %8d bytes  %s" % (did, entry["bytes"], entry["file"]))
        time.sleep(0.3)  # the index is a small government host; don't hammer it

    with open(os.path.join(STAGE, "manifest.json"), "w") as fh:
        json.dump(manifest, fh, indent=1)
    word_only = [m["docId"] for m in manifest if m["wordOnly"]]
    print("\n%d staged, %d of them Word-only: %s" % (len(manifest), len(word_only), ", ".join(word_only)))
    if unavailable:
        print("unavailable on the government site: %s" % ", ".join(unavailable))


if __name__ == "__main__":
    sys.exit(main())
