"""Restore F97's missing registrar signature rule on page 3.

The XFA source defines a 101.6 mm signature field beside the date field, but
pdf.js flattened its hidden border without applying the source's print event.
The official form prints that bottom edge as the registrar's signature rule.

Run: python3 repair_f97_registrar_line.py [--write]
"""
import os
import sys

import fitz


EXPORT = ("/Users/lorelaiphinnemore/Documents/CloudAct/Frontend /Calculator-code"
          "/auth-server/form-template-export")
PDF = os.path.join(EXPORT, "BCSC_F97.pdf")
PAGE = 3

# Source geometry: SignatureField1 starts 63.5 mm into the 177.8 mm content
# area and is 101.6 mm wide. The page content begins at x=72 pt.
RULE = fitz.Rect(252.0, 117.0, 540.0, 118.0)


def matching_rules(page):
    return [drawing["rect"] for drawing in page.get_drawings()
            if abs(drawing["rect"].x0 - RULE.x0) < 0.6
            and abs(drawing["rect"].x1 - RULE.x1) < 0.6
            and abs(drawing["rect"].y0 - RULE.y0) < 0.6]


def main():
    write = "--write" in sys.argv
    doc = fitz.open(PDF)
    if doc.page_count < PAGE:
        raise SystemExit("F97 no longer has page 3")
    page = doc[PAGE - 1]

    if matching_rules(page):
        print("F97 p3 registrar signature rule already present")
        doc.close()
        return

    print("F97 p3 add registrar signature rule at "
          "x=%.0f-%.0f y=%.0f" % (RULE.x0, RULE.x1, RULE.y0))
    if not write:
        doc.close()
        print("(dry run, pass --write)")
        return

    page.draw_rect(RULE, color=(0, 0, 0), fill=(0, 0, 0), width=0,
                   overlay=True)
    temp = PDF + ".tmp"
    doc.save(temp, garbage=4, deflate=True)
    doc.close()
    os.replace(temp, PDF)

    check = fitz.open(PDF)
    if len(matching_rules(check[PAGE - 1])) != 1:
        raise SystemExit("registrar signature rule verification failed")
    check.close()
    print("F97 p3 registrar signature rule restored")


if __name__ == "__main__":
    main()
