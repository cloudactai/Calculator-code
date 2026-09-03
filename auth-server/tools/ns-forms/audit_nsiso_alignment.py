"""Audit all NSISO forms for field alignment issues.

    python3 audit_nsiso_alignment.py [--only NSISO_AFFIDAVIT] [--render]

Checks:
  1. Text fields that overshoot their horizontal rule
  2. Text fields with wrong height (not STD_LINE for single-line)
  3. Text fields not properly seated on their rule
  4. Fields whose left edge overlaps preceding label text
  5. Fields overlapping each other significantly
  6. Checkboxes that are not square
"""
import argparse
import json
import os
import re
import sys

try:
    import fitz
except ImportError:
    import pymupdf as fitz

HERE = os.path.dirname(os.path.abspath(__file__))
TOOLS = os.path.dirname(HERE)
EXPORT = os.path.join(os.path.dirname(TOOLS), "form-template-export")
sys.path.insert(0, os.path.join(TOOLS, "bc-forms"))
sys.path.insert(0, os.path.join(TOOLS, "on-forms"))

import page_geom as G

SCALE = 1.5
STD_LINE = G.STD_LINE      # 13.3
SEAT_GAP = G.SEAT_GAP      # 1.26
BLOCK_MIN = 22.0

UNDERSCORE = re.compile(r"_{3,}")


def find_underscore_runs(page):
    """Return list of (rect, text, full_span_text) for each underscore run."""
    runs = []
    for block in page.get_text("dict")["blocks"]:
        for line in block.get("lines", []):
            for span in line.get("spans", []):
                text = span["text"]
                for match in UNDERSCORE.finditer(text):
                    substr = text[match.start():match.end()]
                    found = page.search_for(substr, clip=fitz.Rect(span["bbox"]))
                    for r in found or []:
                        runs.append((r, substr, text, span["bbox"]))
    return runs


def nearest_underscore(field, runs, max_dist=25.0):
    """Find the underscore run nearest to a field."""
    fx = field["x"]
    fy = field["y"] + field["height"] / SCALE / 2
    best, best_dist = None, max_dist
    for run_rect, substr, full_text, span_bbox in runs:
        ry = (run_rect.y0 + run_rect.y1) / 2
        if abs(ry - fy) > 15:
            continue
        dist = abs(run_rect.x0 - fx) + abs(ry - fy)
        if dist < best_dist:
            best_dist = dist
            best = (run_rect, substr, full_text, span_bbox)
    return best


def audit_one(doc_id):
    pdf_path = os.path.join(EXPORT, "%s.pdf" % doc_id)
    json_path = os.path.join(EXPORT, "%s.json" % doc_id)

    if not os.path.exists(pdf_path) or not os.path.exists(json_path):
        return []

    fields = json.load(open(json_path))["staticFields"]
    pdf = fitz.open(pdf_path)

    issues = []

    # Cache rules and underscores per page
    rules_cache = {}
    under_cache = {}

    for field in fields:
        page_no = field["page"]
        page = pdf[page_no - 1]

        if page_no not in rules_cache:
            rules_cache[page_no] = G.hrules(page)
        if page_no not in under_cache:
            under_cache[page_no] = find_underscore_runs(page)

        rules = rules_cache[page_no]
        underscores = under_cache[page_no]

        fx = field["x"]
        fy = field["y"]
        fw = field["width"] / SCALE
        fh = field["height"] / SCALE
        fb = fy + fh

        if field["type"] == "CheckBox":
            # Check if square
            if abs(fw - fh) > 0.5:
                issues.append(
                    "CB_NOT_SQUARE p%d id=%s: %.1fx%.1f (diff=%.1f)"
                    % (page_no, field["id"], fw, fh, abs(fw - fh)))
            continue

        if field["type"] == "TextArea":
            continue

        # Single-line text field checks
        if fh >= BLOCK_MIN:
            continue

        # 1. Height check
        if abs(fh - STD_LINE) > 0.5:
            issues.append(
                "WRONG_HEIGHT p%d id=%s: height=%.1f (expected %.1f, diff=%.1f)"
                % (page_no, field["id"], fh, STD_LINE, fh - STD_LINE))

        # 2. Rule seating check
        rule = G.seat_rule(field, rules)
        if rule is not None:
            target_y = round(rule[0] - SEAT_GAP - STD_LINE, 2)
            if abs(target_y - fy) > 1.0:
                issues.append(
                    "NOT_SEATED p%d id=%s: y=%.1f should be %.1f (off by %.1fpt)"
                    % (page_no, field["id"], fy, target_y, fy - target_y))

        # 3. Check right edge vs rule extent
        if rule is not None:
            rule_y, rule_x0, rule_x1 = rule
            right = fx + fw
            if right > rule_x1 + 2:
                issues.append(
                    "PAST_RULE p%d id=%s: right=%.1f rule_end=%.1f (overshoot %.1fpt)"
                    % (page_no, field["id"], right, rule_x1, right - rule_x1))
            if fx < rule_x0 - 2:
                issues.append(
                    "BEFORE_RULE p%d id=%s: left=%.1f rule_start=%.1f (undershoot %.1fpt)"
                    % (page_no, field["id"], fx, rule_x0, rule_x0 - fx))

        # 4. Check field start vs label end (underscore alignment)
        run = nearest_underscore(field, underscores)
        if run:
            run_rect, substr, full_text, span_bbox = run
            # Find the label before the underscores
            label_part = full_text[:full_text.find(substr)].rstrip()
            if label_part:
                label_rects = page.search_for(label_part, clip=fitz.Rect(span_bbox))
                if label_rects:
                    label_end = label_rects[0].x1
                    if fx < label_end - 3:
                        issues.append(
                            "OVERLAPS_LABEL p%d id=%s: x=%.1f label \"%s\" ends at %.1f (overlap %.1fpt)"
                            % (page_no, field["id"], fx,
                               label_part[:30], label_end, label_end - fx))
                    elif fx > run_rect.x0 + 5:
                        issues.append(
                            "FIELD_START_LATE p%d id=%s: x=%.1f but blank starts at %.1f (gap %.1fpt)"
                            % (page_no, field["id"], fx, run_rect.x0, fx - run_rect.x0))

    # 5. Field overlaps
    for i, f1 in enumerate(fields):
        for f2 in fields[i + 1:]:
            if f1["page"] != f2["page"]:
                continue
            x1, y1 = f1["x"], f1["y"]
            w1, h1 = f1["width"] / SCALE, f1["height"] / SCALE
            x2, y2 = f2["x"], f2["y"]
            w2, h2 = f2["width"] / SCALE, f2["height"] / SCALE

            ox = max(0, min(x1 + w1, x2 + w2) - max(x1, x2))
            oy = max(0, min(y1 + h1, y2 + h2) - max(y1, y2))

            if ox > 2 and oy > 2:
                area = ox * oy
                min_area = min(w1 * h1, w2 * h2)
                if min_area > 0 and area / min_area > 0.1:
                    issues.append(
                        "OVERLAP p%d: id=%s vs id=%s (%.0fpt² = %.0f%% of smaller)"
                        % (f1["page"], f1["id"], f2["id"],
                           area, 100 * area / min_area))

    pdf.close()
    return issues


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
    forms_with_issues = 0
    for doc_id in doc_ids:
        issues = audit_one(doc_id)
        if issues:
            forms_with_issues += 1
            print("\n%s: %d issue(s)" % (doc_id, len(issues)))
            for issue in issues:
                print("  %s" % issue)
            total_issues += len(issues)
        else:
            print("%-20s OK" % doc_id)

        if args.render and issues:
            sys.path.insert(0, os.path.join(TOOLS, "review"))
            import render_review
            render_review.render_one(doc_id, views=["combined"])

    print("\n=== Summary ===")
    print("Forms checked: %d" % len(doc_ids))
    print("Forms with issues: %d" % forms_with_issues)
    print("Total issues: %d" % total_issues)


if __name__ == "__main__":
    main()
