"""Shift NSFD_FD1 text fields so they start right after the printed label.

Measures each label's right edge from the PDF and rewrites x (and width)
on the matching field. Only touches fields added by add_fd1_dotlines.py —
leaves pre-existing fields (header names, birth-date cells, checkboxes)
alone.

Usage:
    python3 shift_fd1_fields.py --check     # dry run
    python3 shift_fd1_fields.py             # apply
"""
import argparse
import json
import os
import sys

import fitz

HERE = os.path.dirname(os.path.abspath(__file__))
EXPORT = os.path.join(os.path.dirname(os.path.dirname(HERE)),
                      "form-template-export")
MAP = os.path.join(EXPORT, "NSFD_FD1.json")
PDF = os.path.join(EXPORT, "NSFD_FD1.pdf")

SCALE = 1.5
GAP = 2.0  # points between label end and field start


COL_BOUNDARY = 340.0  # left column < 340, right column >= 340


def _label_end(page, label_text, near_y, near_x=None, tol=5.0, x_tol=None):
    """Return the x-coordinate where `label_text` ends on `page`,
    restricted to the line at `near_y` and the same column as `near_x`."""
    best = None
    best_dist = float("inf")
    for r in page.search_for(label_text):
        if abs(r.y0 - near_y) > tol:
            continue
        if near_x is not None:
            # Same column check: both below or both above the boundary
            field_col = near_x < COL_BOUNDARY
            label_col = r.x0 < COL_BOUNDARY
            if field_col != label_col:
                continue
            dist = abs(r.x0 - near_x)
            if dist < best_dist:
                best = r.x1
                best_dist = dist
        else:
            return r.x1
    return best


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--check", action="store_true")
    args = parser.parse_args()

    with open(MAP) as f:
        data = json.load(f)

    doc = fitz.open(PDF)
    fields = data["staticFields"]
    changed = 0

    for fld in fields:
        if fld["type"] != "TextField":
            continue
        page_no = fld["page"]
        if page_no not in (1, 2, 3, 4):
            continue

        page = doc[page_no - 1]
        fx = fld["x"]
        fy = fld["y"]
        fw = fld["width"] / SCALE  # PDF-space width
        fh = fld["height"] / SCALE
        old_right = fx + fw

        # --- Identify which label this field belongs to ---
        # We search for known labels near this field's y position
        # and pick the one that the field is clearly associated with.

        label = None
        new_x = None

        # Helper: search with column awareness
        def find_label(text, tol=5.0):
            return _label_end(page, text, fy, near_x=fx, tol=tol)

        # Page 1: Name table fields
        if page_no == 1:
            for lbl in ["Last Name:", "First Name:", "Middle Name:",
                        "Previous Names:"]:
                end = find_label(lbl)
                if end is not None:
                    label = lbl
                    new_x = end + GAP
                    break

            if label is None:
                end = find_label("Other Names, Alias, etc.:")
                if end is not None:
                    label = "Other Names"
                    new_x = end + GAP

            if label is None and abs(fy - 566.1) < 3:
                label = "(continuation p1)"
                if fx < 250:
                    new_x = 114.1
                else:
                    new_x = 348.1

            if label is None:
                end = find_label("Other:", tol=8.0)
                if end is not None:
                    label = "Prefix Other:"
                    new_x = end + GAP

        # Page 2: All fields shift right to clear labels
        elif page_no == 2:
            search_labels = [
                "Home", "Business", "Message",
                "P.O. Box", "Apt. No", "Street", "City/Town",
                "Province", "Postal Code", "of Documents:",
                "Firm Name:", "Address:", "Phone:", "Fax:",
            ]

            for lbl in search_labels:
                end = find_label(lbl)
                if end is not None:
                    label = lbl
                    new_x = end + GAP
                    break

            if label is None:
                end = find_label("Other", tol=3.0)
                if end is not None:
                    label = "Other"
                    new_x = end + GAP

            if label is None:
                for lbl in ["Email:", "Email"]:
                    end = find_label(lbl, tol=3.0)
                    if end is not None:
                        label = lbl
                        new_x = end + GAP
                        break

            if label is None:
                end = find_label("Fax", tol=3.0)
                if end is not None:
                    label = "Fax"
                    new_x = end + GAP

            if label is None:
                end = find_label("’s Name:")
                if end is not None:
                    label = "Lawyer’s Name:"
                    new_x = end + GAP

            if label is None:
                end = find_label("Explain:")
                if end is not None:
                    label = "Explain:"
                    new_x = end + GAP

            if label is None and abs(fy - 276.4) < 3:
                label = "(continuation p2 addr)"
                if fx < 250:
                    new_x = 114.1
                else:
                    new_x = 348.1

            if label is None and abs(fy - 390.6) < 3:
                label = "(continuation p2 counsel)"
                if fx < 250:
                    new_x = 114.1
                else:
                    new_x = 348.1

        # Page 3
        elif page_no == 3:
            for lbl in ["Date of Marriage:", "Date of Separation:",
                        "Date spousal or common law relationship began:",
                        "Date of Divorce Order:"]:
                end = find_label(lbl)
                if end is not None:
                    label = lbl
                    new_x = end + GAP
                    break

            if label is None:
                end = find_label("Explain:", tol=5.0)
                if end is not None:
                    label = "Explain: (p3)"
                    new_x = end + GAP

            if label is None:
                for lbl in ["Phone Number:", "Name:", "Address:",
                            "Email:", "Fax:"]:
                    end = find_label(lbl, tol=3.0)
                    if end is not None:
                        label = lbl
                        new_x = end + GAP
                        break

            if label is None:
                end = find_label("Occupation", tol=3.0)
                if end is not None:
                    label = "Occupation"
                    new_x = end + GAP

            if label is None:
                for check_y in [57.9, 132.4, 236.7]:
                    if abs(fy - check_y) < 3:
                        label = "(continuation p3)"
                        if fx < 250:
                            new_x = 114.1
                        else:
                            new_x = 348.1
                        break

        # Page 4: Section D
        elif page_no == 4:
            for lbl in ["Date Issued:", "File Number:", "File number:"]:
                end = find_label(lbl)
                if end is not None:
                    label = lbl
                    new_x = end + GAP
                    break

            if label is None:
                for lbl in ["Court:", "Date:", "Type:"]:
                    end = find_label(lbl, tol=3.0)
                    if end is not None:
                        label = lbl
                        new_x = end + GAP
                        break

        if label is None or new_x is None:
            continue

        # Don't touch pre-existing fields (header names, birth dates, table cells)
        # Those have specific IDs that were created before add_fd1_dotlines.py
        # We can identify dotline fields by their specific characteristics
        if fld["id"] < 1750183289092:
            # This is a pre-existing field from the original build
            # (IDs below 1750183289092 are original fields)
            continue

        delta = new_x - fx
        if abs(delta) < 0.5:
            continue

        new_w = old_right - new_x
        if new_w < 10:
            # Don't shrink a field below minimum usable width
            new_w = max(old_right - new_x, 20.0)

        if args.check:
            direction = "RIGHT" if delta > 0 else "LEFT"
            print(f"  p{page_no} {label:50s} shift {direction} {abs(delta):.1f}pt "
                  f"(x: {fx:.1f} -> {new_x:.1f})")
        else:
            fld["x"] = round(new_x, 2)
            fld["width"] = round(new_w * SCALE, 2)

        changed += 1

    doc.close()

    if changed == 0:
        print("nothing to adjust")
        return

    print(f"{changed} fields adjusted")

    if args.check:
        print("(dry run — pass without --check to apply)")
        return

    with open(MAP, "w") as f:
        json.dump(data, f, indent=1)
    print(f"wrote {MAP}")


if __name__ == "__main__":
    main()
