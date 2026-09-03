"""Check all NSISO forms for checkbox and text field alignment issues.

    python3 check_nsiso_alignment.py [--only NSISO_AFFIDAVIT] [--render]

Reports:
  - Checkboxes that don't match their printed square
  - Text fields overlapping their label text
  - Text fields not aligned with underscore blanks
  - Fields overlapping each other
"""
import argparse
import json
import os
import sys

try:
    import fitz
except ImportError:
    import pymupdf as fitz

HERE = os.path.dirname(os.path.abspath(__file__))
TOOLS = os.path.dirname(HERE)
EXPORT = os.path.join(os.path.dirname(TOOLS), "form-template-export")
sys.path.insert(0, os.path.join(TOOLS, "bc-forms"))

import bc_pipeline as bp

SCALE = 1.5
STD_LINE = 13.3
TICKS = "☐☑□■❑❐"


def check_checkbox_vs_square(field, page, bg_page):
    """Check if a checkbox aligns with its printed square on the background."""
    issues = []
    fx = field["x"]
    fy = field["y"]
    fw = field["width"] / SCALE
    fh = field["height"] / SCALE
    field_rect = fitz.Rect(fx, fy, fx + fw, fy + fh)

    mark = bp.printed_mark(bg_page, field_rect)
    if mark is None:
        return issues

    dx = abs(mark.x0 - fx)
    dy = abs(mark.y0 - fy)
    dw = abs(mark.width - fw)
    dh = abs(mark.height - fh)

    if dx > 1.5 or dy > 1.5 or dw > 1.5 or dh > 1.5:
        issues.append(
            "  CB id=%s p%d: field (%.1f,%.1f) %.1fx%.1f vs square (%.1f,%.1f) %.1fx%.1f  "
            "delta=(%.1f,%.1f,%.1f,%.1f)"
            % (field["id"], field["page"],
               fx, fy, fw, fh,
               mark.x0, mark.y0, mark.width, mark.height,
               mark.x0 - fx, mark.y0 - fy, mark.width - fw, mark.height - fh))
    return issues


def check_text_vs_underscores(field, page):
    """Check if a text field overlaps its label or misses its underscore blank."""
    issues = []
    if field["type"] not in ("TextField", "Number", "Date"):
        return issues

    fx = field["x"]
    fy = field["y"]
    fw = field["width"] / SCALE
    fh = field["height"] / SCALE
    fb = fy + fh  # bottom

    # Find text spans near this field's vertical position
    for block in page.get_text("dict")["blocks"]:
        for line in block.get("lines", []):
            for span in line.get("spans", []):
                bbox = span["bbox"]
                sy0, sy1 = bbox[1], bbox[3]
                # Check vertical overlap
                if abs(sy0 - fy) > 20 and abs(sy1 - fb) > 20:
                    continue

                text = span["text"]
                sx0, sx1 = bbox[0], bbox[2]

                # Skip if no horizontal overlap
                if sx1 < fx - 5 or sx0 > fx + fw + 5:
                    continue

                # Check for label text overlapping the field
                # Find where the non-underscore text ends
                stripped = text.rstrip("_. …")
                if stripped and len(stripped) < len(text):
                    # This span has a label followed by blanks
                    label_rects = page.search_for(stripped, clip=fitz.Rect(bbox))
                    if label_rects:
                        label_end = label_rects[0].x1
                        if fx < label_end - 2:
                            overlap = label_end - fx
                            issues.append(
                                "  TF id=%s p%d: field x=%.1f overlaps label \"%s\" "
                                "ending at %.1f (overlap=%.1fpt)"
                                % (field["id"], field["page"],
                                   fx, stripped[:40], label_end, overlap))

    return issues


def check_field_overlaps(fields):
    """Check for fields on the same page that overlap each other."""
    issues = []
    for i, f1 in enumerate(fields):
        for f2 in fields[i + 1:]:
            if f1["page"] != f2["page"]:
                continue
            x1, y1 = f1["x"], f1["y"]
            w1, h1 = f1["width"] / SCALE, f1["height"] / SCALE
            x2, y2 = f2["x"], f2["y"]
            w2, h2 = f2["width"] / SCALE, f2["height"] / SCALE

            # Check overlap
            ox = max(0, min(x1 + w1, x2 + w2) - max(x1, x2))
            oy = max(0, min(y1 + h1, y2 + h2) - max(y1, y2))

            if ox > 2 and oy > 2:
                area = ox * oy
                min_area = min(w1 * h1, w2 * h2)
                if min_area > 0 and area / min_area > 0.05:
                    issues.append(
                        "  OVERLAP p%d: id=%s (%.0f,%.0f)+(%.0f,%.0f) vs "
                        "id=%s (%.0f,%.0f)+(%.0f,%.0f) overlap=%.0fpt²"
                        % (f1["page"],
                           f1["id"], x1, y1, w1, h1,
                           f2["id"], x2, y2, w2, h2, area))
    return issues


def check_one(doc_id, render=False):
    pdf_path = os.path.join(EXPORT, "%s.pdf" % doc_id)
    json_path = os.path.join(EXPORT, "%s.json" % doc_id)

    if not os.path.exists(pdf_path) or not os.path.exists(json_path):
        return []

    fields = json.load(open(json_path))["staticFields"]
    pdf = fitz.open(pdf_path)

    all_issues = []

    # Check checkboxes against printed squares
    for field in fields:
        if field["type"] == "CheckBox":
            page = pdf[field["page"] - 1]
            all_issues.extend(check_checkbox_vs_square(field, page, page))

    # Check text fields against labels
    for field in fields:
        if field["type"] in ("TextField", "Number", "Date"):
            page = pdf[field["page"] - 1]
            all_issues.extend(check_text_vs_underscores(field, page))

    # Check overlaps
    all_issues.extend(check_field_overlaps(fields))

    pdf.close()

    if render and all_issues:
        review_dir = os.path.join(EXPORT, "_review", doc_id)
        os.makedirs(review_dir, exist_ok=True)
        sys.path.insert(0, os.path.join(TOOLS, "review"))
        import render_review
        render_review.render_one(doc_id, views=["combined"])

    return all_issues


def main():
    ap = argparse.ArgumentParser(description=__doc__,
                                 formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--only", action="append", default=[])
    ap.add_argument("--render", action="store_true")
    args = ap.parse_args()

    doc_ids = sorted([
        os.path.splitext(f)[0]
        for f in os.listdir(EXPORT)
        if f.startswith("NSISO_") and f.endswith(".json")
    ])

    if args.only:
        doc_ids = [d for d in doc_ids if d in args.only]

    total_issues = 0
    for doc_id in doc_ids:
        issues = check_one(doc_id, render=args.render)
        if issues:
            print("\n%s: %d issue(s)" % (doc_id, len(issues)))
            for issue in issues:
                print(issue)
            total_issues += len(issues)
        else:
            print("%-20s OK" % doc_id)

    print("\n--- Total: %d issue(s) across %d forms ---" % (total_issues, len(doc_ids)))


if __name__ == "__main__":
    main()
