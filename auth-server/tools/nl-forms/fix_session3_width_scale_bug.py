"""Correct a systematic width-scale bug introduced across this session's
NLEPO fixes.

    python3 fix_session3_width_scale_bug.py [--check]

Bug: this codebase stores TextField width/height in the JSON scaled by
SCALE=1.5 relative to true PDF points (documented in FORM_FIXING_GUIDE.md:
"width_in_pdf = field['width'] / 1.5"; render_review.py computes the
on-page rectangle as `x + width / SCALE`). Every width this session
computed from a pixel-darkness scan or get_text('rawdict') character box
(a TRUE PDF-point measurement) was stored directly as the JSON width
without multiplying by 1.5 first. The render tool then divided that
already-unscaled number by 1.5 again, so every field fixed this way
rendered at 2/3 of its intended width.

Worse: reading *existing* fields' widths suffered the same omission, so
most of the "oversized field overlapping the next caption" diagnoses this
session made were false positives. Recomputing with the correct division
shows the original, untouched fields were already correctly sized in
essentially every case (e.g. NLEPO_004's "at" blank: original width 270.09
=> true right edge 118.92 + 270.09/1.5 = 298.98, matching the true blank
end of 299.0 almost exactly -- there was no 90pt overlap with "in the
Province" as this session's docstrings claimed). The narrowing this bug
caused was silent in the renders because a too-narrow invisible-bordered
box never creates visible overlap (the failure mode this session was
watching for) -- it just leaves extra unused blank space, which is easy to
miss next to the same long generic sample text overflowing regardless of
box width.

This script multiplies every width this session set by 1.5, restoring the
originally-intended (correctly measured) sizes. It does NOT touch x/y
(unaffected by this bug) or any field this session left alone. Two
genuinely valid fixes from this session are preserved as-is because they
were not width-scale-dependent: NLEPO_012 field 1750567230006's Y move
(clearing a real intrusion into the line above -- a plain y-coordinate
comparison, not width math) and NLEPO_003's new Respondent D.O.B. field
1750798505203 / new "20__:" year field 1750798505204's *position* (only
their widths need the 1.5x correction here).

--check prints without writing; no flag writes. Idempotent: a second run
finds every field already at the corrected width and does nothing.
"""
import argparse
import json
import os

HERE = os.path.dirname(os.path.abspath(__file__))
EXPORT = os.path.join(os.path.dirname(os.path.dirname(HERE)), "form-template-export")

# fname -> { field id: new_width }  (new_width = this session's buggy value * 1.5)
FIXES = {
    "NLEPO_001.json": {
        1750212133019: 217.62,
        1750212133020: 203.04,
        1750212133021: 271.17,
        1750212133022: 271.14,
        1750212133023: 129.87,
        1750212133024: 166.89,
    },
    "NLEPO_002.json": {
        1750029983023: 75.36,
        1750029983025: 131.31,
        1750029983028: 33.62,
    },
    "NLEPO_003.json": {
        1750798505013: 77.99,
        1750798505201: 143.63,
        1750798505202: 107.63,
        1750798505041: 168.75,
        1750798505042: 56.25,
        1750798505043: 123.57,
        1750798505204: 19.95,
    },
    "NLEPO_004.json": {
        1750008842006: 270.12,
        1750008842007: 127.56,
        1750008842009: 165.09,
        1750008842012: 52.5,
    },
    "NLEPO_006.json": {
        1750623494065: 34.53,
        1750623494067: 112.53,
        1750623494070: 25.98,
    },
    "NLEPO_007.json": {
        1750470992092: 34.53,
        1750470992094: 112.53,
        1750470992097: 25.98,
    },
    "NLEPO_008.json": {
        1750750881028: 34.53,
        1750750881030: 112.53,
        1750750881033: 25.98,
        1750750881008: 352.74,
    },
    "NLEPO_009.json": {
        1750335319013: 217.5,
        1750335319015: 67.65,
        1750335319016: 172.47,
        1750335319018: 60.0,
    },
    "NLEPO_010.json": {
        1750740466065: 34.53,
        1750740466067: 112.53,
        1750740466070: 25.98,
    },
    "NLEPO_011.json": {
        1750250692005: 72.96,
        1750250692006: 145.98,
        1750250692010: 51.12,
        1750250692012: 33.54,
        1750250692014: 109.53,
        1750250692017: 25.38,
    },
    "NLEPO_012.json": {
        1750567230005: 459.84,
        1750567230006: 175.23,
    },
}


def process(fname, check):
    path = os.path.join(EXPORT, fname)
    with open(path) as fh:
        data = json.load(fh)
    fields = data["staticFields"]
    by_id = {f["id"]: f for f in fields}

    changed = False
    for fid, width in FIXES.get(fname, {}).items():
        f = by_id.get(fid)
        if f is None:
            print(f"{fname}: WARNING field id={fid} not found, skipping")
            continue
        if abs(f["width"] - width) < 0.01:
            continue
        print(f"{fname}: {'would fix' if check else 'fixing'} id={fid} "
              f"width {f['width']}->{width}")
        if not check:
            f["width"] = width
        changed = True

    if changed and not check:
        with open(path, "w") as fh:
            json.dump(data, fh, indent=2)
            fh.write("\n")
    return changed


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--check", action="store_true")
    args = ap.parse_args()

    any_changed = False
    for fname in FIXES:
        if process(fname, args.check):
            any_changed = True

    if not any_changed:
        print("nothing to fix (already at corrected width)")


if __name__ == "__main__":
    main()
