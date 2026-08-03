"""Take the live form controls out of Form 8A's background.

Form 8A is the one Ontario background still carrying its original AcroForm: 151
widgets, including three pushbuttons -- Save Form, Print Form, Clear Form -- that
draw themselves on page 6 and do nothing here. The overlay is what the app fills
in, so the widgets are a second, competing set of fields on the same page.

Only the widgets go. The printed page is untouched, and the overlay is not
edited at all.

Run: python3 strip_form8a_widgets.py [--write]
"""
import os
import sys

import fitz

EXPORT = ("/Users/lorelaiphinnemore/Documents/CloudAct/Frontend "
          "/Calculator-code/auth-server/form-template-export")
DOC_ID = "Form8A"


def main():
    write = "--write" in sys.argv
    path = os.path.join(EXPORT, "%s.pdf" % DOC_ID)
    doc = fitz.open(path)

    count = 0
    for page in doc:
        for widget in list(page.widgets()):
            count += 1
            if write:
                page.delete_widget(widget)
    print("%d widgets%s" % (count, " removed" if write else " found (dry run, pass --write)"))

    if write:
        doc.save(path, incremental=True, encryption=fitz.PDF_ENCRYPT_KEEP)
        doc.close()
        check = fitz.open(path)
        left = sum(1 for page in check for _ in page.widgets())
        print("widgets left: %d" % left)
        check.close()
    else:
        doc.close()


if __name__ == "__main__":
    main()
