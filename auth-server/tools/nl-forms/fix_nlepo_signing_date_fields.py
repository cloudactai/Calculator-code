"""Fix oversized signing-date fields (day/month/year blanks in "DATED at
___" / "SWORN/AFFIRMED before me ... this ___ day of ___, 20__." jurat
boilerplate) across the rest of the NLEPO batch: forms 004, 006, 007, 008,
009, 010, 011.

    python3 fix_nlepo_signing_date_fields.py [--check]

Same root cause and same fix methodology as fix_nlepo_jurat_dates.py
(NLEPO_002/003, already applied): this boilerplate clause is reused
verbatim across most of the NLEPO batch, and in every remaining instance
the day/month/year TextFields are wider than their printed underscore runs,
overlapping the next printed caption word (confirmed visually on NLEPO_006
p1 -- "Jordan A. Whit[field] day of[Jordan A. Whitfield]" crowds directly
into "day"/"of"). Evidence for every field below is the exact underscore
run extent, read via get_text('rawdict') character boxes (word-level
extraction merges some runs with the following caption word with no space,
e.g. NLEPO_004's "_________________day", so character-level is used
throughout for precision) against the unmodified base PDF. Only x/width
change; y/height/type/etc. untouched.

NLEPO_004 p1 "DATED at ___ in the Province of NL this ___ day of ___,
20___." (2 wrapped lines):
    at blank:    104.4 -> was field 006 covering 118.92-389.01, true end 299.0
    (fields keyed by id; see FIXES below for exact before/after)

NLEPO_006 p1 / NLEPO_007 p2 / NLEPO_008 p1 / NLEPO_010 p1: identical
"SWORN/AFFIRMED before me at ___ in the Province ... this ___ day of ___
20___." template (same generator, same x offsets each time: day blank
77.9-100.9, month blank 135.5-210.5, year blank 224.9-242.2). NLEPO_008 has
a second, unrelated "Day/Month/Year" triad higher on the page (the
"Publishing it in ___ on ___" clause) already handled by dedupe_nl_fields.py
per the ledger; not touched here.

NLEPO_009 p1 "DATED at ___ in the Province of NL this ___ day / of ___,
20___." (wraps mid-blank, unique to this form).

NLEPO_011 p1 has TWO occurrences: an informational "Order made on the ___
day of ___, 20___," clause (not a signing date, but the same missing-blank
defect) and the usual "this ___ day of ___, 20___." signing line.

Also noted, NOT fixed here (documented, left as-is): NLEPO_006/007/008/010
each have an existing TextField sitting on the printed "Signature of
Applicant"/"Affiant" line (harmless width-wise -- nothing prints to its
right on the page -- but its mere presence runs against the convention
established throughout the NB/NL corpus of leaving signature lines bare).
Repair scripts may only delete a field when it's a confirmed redundant
duplicate (see dedupe_nl_fields.py); this isn't a duplicate, so it is left
untouched and flagged rather than removed.

--check prints without writing; no flag writes. Idempotent: a second run
finds every field already at target geometry and does nothing.
"""
import argparse
import json
import os

HERE = os.path.dirname(os.path.abspath(__file__))
EXPORT = os.path.join(os.path.dirname(os.path.dirname(HERE)), "form-template-export")

# fname -> { field id: (x, width) }
FIXES = {
    "NLEPO_004.json": {
        1750008842006: (118.92, 180.08),   # at blank (true end 299.0)
        1750008842007: (70.56, 85.04),     # day blank (true end 155.6)
        1750008842009: (183.24, 110.06),   # month blank (true end 293.3)
        1750008842012: (308.4, 35.0),      # year blank (true end 343.4)
    },
    "NLEPO_006.json": {
        1750623494065: (77.88, 23.02),     # day blank (true end 100.9)
        1750623494067: (135.48, 75.02),    # month blank (true end 210.5)
        1750623494070: (224.88, 17.32),    # year blank (true end 242.2)
    },
    "NLEPO_007.json": {
        1750470992092: (77.88, 23.02),
        1750470992094: (135.48, 75.02),
        1750470992097: (224.88, 17.32),
    },
    "NLEPO_008.json": {
        1750750881028: (77.88, 23.02),
        1750750881030: (135.48, 75.02),
        1750750881033: (224.88, 17.32),
        # "swear/solemnly affirm that I did on the ___ serve the attached
        # (day)(month)(year)" -- one combined date blank (day/month/year are
        # printed as format hints below a single line, not 3 separate
        # blanks, per the row above them at y=323.5 vs labels at y=335.0).
        # True underscore run 216.8-452.0 (get_text('words')); field was
        # 216.84 w=352.71, overlapping "serve the attached" by ~117pt.
        1750750881008: (216.84, 235.16),
    },
    "NLEPO_009.json": {
        1750335319013: (104.4, 145.0),     # at blank (true end 249.4)
        1750335319015: (460.8, 45.1),      # this-day blank (true end 505.9)
        1750335319016: (69.12, 114.98),    # month blank (true end 184.1)
        1750335319018: (199.2, 40.0),      # year blank (true end 239.2)
    },
    "NLEPO_010.json": {
        1750740466065: (77.88, 23.02),
        1750740466067: (135.48, 75.02),
        1750740466070: (224.88, 17.32),
    },
    "NLEPO_011.json": {
        # "Order made on the ___ day of ___, 20___," (informational, not signing)
        1750250692005: (281.76, 48.64),    # day blank (true end 330.4)
        1750250692006: (359.88, 97.32),    # month blank (true end 457.2)
        1750250692010: (471.72, 34.08),    # year blank (true end 505.8)
        # "this ___ day of ___, 20___." (signing line)
        1750250692012: (75.84, 22.36),     # day blank (true end 98.2)
        1750250692014: (131.88, 73.02),    # month blank (true end 204.9)
        1750250692017: (218.88, 16.92),    # year blank (true end 235.8)
    },
}


def process(fname, check):
    path = os.path.join(EXPORT, fname)
    with open(path) as fh:
        data = json.load(fh)
    fields = data["staticFields"]
    by_id = {f["id"]: f for f in fields}

    changed = False
    for fid, (x, width) in FIXES.get(fname, {}).items():
        f = by_id.get(fid)
        if f is None:
            print(f"{fname}: WARNING field id={fid} not found, skipping")
            continue
        if abs(f["x"] - x) < 0.01 and abs(f["width"] - width) < 0.01:
            continue
        print(f"{fname}: {'would fix' if check else 'fixing'} id={fid} "
              f"x {f['x']}->{x} width {f['width']}->{width}")
        if not check:
            f["x"] = x
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
        print("nothing to fix (already at target geometry)")


if __name__ == "__main__":
    main()
