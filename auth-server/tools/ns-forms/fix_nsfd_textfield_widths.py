"""Clip NSFD inline bracket-token text fields to their actual token width.

Many NSFD text fields start at a bracket token like [name] or [date] but
extend past the closing bracket into adjacent text. This script finds
fields that sit on inline bracket tokens (text before AND after them on
the same line) and clips the field width to the token boundary + small pad.

Fields that span full line widths (e.g. header fields, signature lines)
are left alone — they don't have text after them on the same line.

Usage:
    python3 fix_nsfd_textfield_widths.py --check         # dry run
    python3 fix_nsfd_textfield_widths.py                 # apply
    python3 fix_nsfd_textfield_widths.py --only NSFD_FD12A --check
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
EXPORT = os.path.join(os.path.dirname(os.path.dirname(HERE)), "form-template-export")
SCALE = 1.5
PAD = 2.0  # padding after closing bracket


def _find_bracket_token(page, tf_x, tf_y, tol_x=3.0, tol_y=5.0):
    """Find a bracket token [text] starting near (tf_x, tf_y).

    Returns (open_x, close_x, token_text, has_text_after) or None.
    """
    for block in page.get_text("rawdict")["blocks"]:
        for line in block.get("lines", []):
            for span in line.get("spans", []):
                chars = span.get("chars", [])
                for i, ch in enumerate(chars):
                    if ch["c"] != "[":
                        continue
                    if abs(ch["bbox"][0] - tf_x) > tol_x:
                        continue
                    if abs(ch["bbox"][1] - tf_y) > tol_y:
                        continue

                    # Found opening bracket near field start. Find closing.
                    close_x = None
                    token_text = None
                    for j in range(i + 1, len(chars)):
                        if chars[j]["c"] == "]":
                            close_x = chars[j]["bbox"][2]
                            token_text = "".join(c["c"] for c in chars[i:j + 1])
                            break

                    if close_x is None:
                        continue

                    # Check if there is text AFTER the closing bracket on the
                    # same line (meaning this is an inline token, not a
                    # standalone field).
                    has_text_after = False
                    # Look in the rest of this span
                    rest_in_span = "".join(
                        c["c"] for c in chars[j + 1:]
                    ).strip().lstrip(".,;: ")
                    if rest_in_span:
                        has_text_after = True
                    else:
                        # Check subsequent spans in the same line
                        found_this_span = False
                        for span2 in line["spans"]:
                            if span2 is span:
                                found_this_span = True
                                continue
                            if found_this_span:
                                t = "".join(
                                    c["c"] for c in span2.get("chars", [])
                                ).strip()
                                if t and t not in (".", ","):
                                    has_text_after = True
                                    break

                    return (ch["bbox"][0], close_x, token_text, has_text_after)
    return None


def repair_one(doc_id, check=False):
    mapping_path = os.path.join(EXPORT, "%s.json" % doc_id)
    with open(mapping_path) as f:
        data = json.load(f)
    fields = data["staticFields"]
    pdf = fitz.open(os.path.join(EXPORT, "%s.pdf" % doc_id))

    changes = 0
    for tf in fields:
        if tf["type"] != "TextField":
            continue
        page_idx = tf["page"] - 1
        if page_idx >= len(pdf):
            continue
        page = pdf[page_idx]

        tf_right = tf["x"] + tf["width"] / SCALE
        result = _find_bracket_token(page, tf["x"], tf["y"])
        if result is None:
            continue

        open_x, close_x, token_text, has_text_after = result

        if not has_text_after:
            # Standalone or end-of-line token — leave width as is
            continue

        # Only clip if field extends past the closing bracket + pad
        target_right = close_x + PAD
        if tf_right <= target_right + 1:
            continue

        new_w = round((target_right - tf["x"]) * SCALE, 2)
        if new_w < 15:
            # Too narrow — skip
            continue

        old_w = tf["width"]
        trim = tf_right - target_right

        if check:
            print("  %s p%d id=%s: %s  w=%.1f -> %.1f (trim %.1fpt)"
                  % (doc_id, tf["page"], tf["id"], token_text,
                     old_w, new_w, trim))
        else:
            tf["width"] = new_w
        changes += 1

    pdf.close()

    if changes and not check:
        data["staticFields"] = fields
        with open(mapping_path, "w") as fh:
            json.dump(data, fh, indent=1)
        print("  wrote %s" % mapping_path)

    return changes


def main():
    ap = argparse.ArgumentParser(description=__doc__,
                                 formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--check", action="store_true")
    ap.add_argument("--only", action="append", default=[])
    args = ap.parse_args()

    all_nsfd = sorted([
        f.replace(".json", "")
        for f in os.listdir(EXPORT)
        if f.startswith("NSFD_FD") and f.endswith(".json")
    ])

    if args.only:
        all_nsfd = [d for d in all_nsfd if d in args.only]

    total = 0
    for doc_id in all_nsfd:
        n = repair_one(doc_id, check=args.check)
        if n:
            print("%-26s %d field(s) %s"
                  % (doc_id, n, "would clip" if args.check else "clipped"))
            total += n

    if not total:
        print("all NSFD text fields already match their token widths")
    else:
        print("\ntotal: %d field(s) %s"
              % (total, "would clip" if args.check else "clipped"))


if __name__ == "__main__":
    main()
