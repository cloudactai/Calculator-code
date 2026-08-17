"""Re-seat four blanks on the CFCSA protection/consolidation orders.

Four boxes on Forms 10.1 and 10.6 came out of the geometric passes too short to hold
their own 9 pt type, and two of them off the rule they belong to:

  10.1  "... that ____ owns or has a right to occupy."   8.1 pt tall
        The blank is boxed in above by the caption belonging to the *previous* line
        ("full name(s) of child(ren))", bottom 585.9) and below by its own rule at
        595.5, so type_ceiling left it 9.6 pt of clean air and clear_printed_labels
        took another 1.5. Nothing is misplaced here, it is only starved.

  10.1  the recognizance "in an amount of $ ____"        x 526.9, rule x 502.0
        Seated 25 pt right of the dollar sign, because the only anchor within reach
        on that line was the caption above it ("full name and date of birth of person
        restrained", x 449.0-573.5) rather than the short rule after the "$".

  10.6  both "(law identified by Indigenous authority)"  x 113.3 / 109.7, rule x 93.9
        Seated off the left end of their rules and, on the second one, 6.3 pt tall.
        The first also overruns its rule's right end (328.2 against 305.2) far enough
        to sit under the "Indigenous" that starts the sentence at 330.1.

Every number below is read off the form: each box is hung from the rule it fills
(bottom on the rule, x spanning it exactly), and given a height that clears the
printed line above where there is room. Where there is not — 10.1's "owns" blank and
10.6's second blank are both wedged under a caption — the box crosses into the
descender band above by at most 1.7 pt, which is what "taller" costs on these two
lines and is invisible behind a translucent input.

This edits the *promoted* map in `form-template-export/` in place, and only the four
boxes' x/y/width/height: every other key in the file is asserted byte-identical before
it is written, and a second run is a no-op. It deliberately does not promote by copying
its staged output over the top, the way the build does. Staging carries no `bind`, so a
copy silently drops the prefill the rebind pass wrote — which is what happened in
c183814, taking `court_info.courtFileNumber` off both of these forms. Repair passes run
after the build, on the file the build produced; only `build_bc3.py --promote` may
overwrite a promoted map wholesale.

Run: python3 repair_cfcsa_prohibition_blanks.py [--promote]   (without it, reports only)
"""
import copy
import json
import os
import sys

import fitz

EXPORT = ("/Users/lorelaiphinnemore/Documents/CloudAct/Frontend /Calculator-code"
          "/auth-server/form-template-export")

SCALE = 1.5  # field width/height are stored pre-divided by the viewer's zoom

# doc -> field id -> (x, y, width, height), i.e. the stored form of the box.
REPAIRS = {
    "BCPC_CFCSA_10_1": {
        # rule x 66.0-272.5 y 595.5; caption above ends 585.9
        1750816350046: (66.0, 584.5, 309.77, 16.5),
        # rule x 502.0-550.5 y 630.5; caption above ends 621.9
        1750816350052: (502.0, 620.5, 72.75, 15.0),
    },
    "BCPC_CFCSA_10_6": {
        # rule x 93.9-305.2 y 441.0; line above ends 431.6
        1750380861039: (93.9, 431.6, 316.95, 14.1),
        # rule x 93.9-302.2 y 543.0; line above ends 535.3
        1750380861040: (93.9, 533.6, 312.45, 14.1),
    },
}
# The rule each box must land on: doc -> field id -> (x0, x1, y).
RULES = {
    "BCPC_CFCSA_10_1": {1750816350046: (66.0, 272.5, 595.5),
                        1750816350052: (502.0, 550.5, 630.5)},
    "BCPC_CFCSA_10_6": {1750380861039: (93.9, 305.2, 441.0),
                        1750380861040: (93.9, 302.2, 543.0)},
}
TOLERANCE = 0.6


def box(field):
    return fitz.Rect(field["x"], field["y"],
                     field["x"] + field["width"] / SCALE,
                     field["y"] + field["height"] / SCALE)


GEOMETRY = ("x", "y", "width", "height")


def main():
    promote = "--promote" in sys.argv

    for doc_id, repairs in REPAIRS.items():
        path = os.path.join(EXPORT, "%s.json" % doc_id)
        mapping = json.load(open(path))
        fields = {field["id"]: field for field in mapping["staticFields"]}
        missing = set(repairs) - set(fields)
        if missing:
            raise SystemExit("%s: no such field(s): %s" % (doc_id, sorted(missing)))

        # Everything the pass is not allowed to touch, captured before it runs.
        untouched = copy.deepcopy(mapping)
        page = fitz.open(os.path.join(EXPORT, "%s.pdf" % doc_id))[0]
        rules = {(round(d["rect"].x0, 1), round(d["rect"].x1, 1), round(d["rect"].y0, 1))
                 for d in page.get_drawings()
                 if d["rect"].height < 2.0 and d["rect"].width > 20.0}

        changed = 0
        for field_id, (x, y, width, height) in repairs.items():
            field = fields[field_id]
            # The rule is the whole justification for these numbers, so refuse to
            # write them if the form no longer draws it where we read it.
            if RULES[doc_id][field_id] not in rules:
                raise SystemExit("%s: field %d's rule %s is gone from the page"
                                 % (doc_id, field_id, RULES[doc_id][field_id]))
            seated = tuple(field[key] for key in GEOMETRY) == (x, y, width, height)
            before = box(field)
            field.update(dict(zip(GEOMETRY, (x, y, width, height))))
            after = box(field)
            x0, x1, rule_y = RULES[doc_id][field_id]
            if (abs(after.x0 - x0) > TOLERANCE or abs(after.x1 - x1) > TOLERANCE
                    or abs(after.y1 - rule_y) > TOLERANCE):
                raise SystemExit("%s: field %d does not sit on its rule: %s"
                                 % (doc_id, field_id, after))
            # Only meaningful the first time. On a re-run the box is already the
            # repaired one, so "no taller than before" is the no-op, not a failure.
            if seated:
                print("%s %d  already seated, %.1f x %.1f at (%.1f, %.1f)"
                      % (doc_id, field_id, after.width, after.height, after.x0, after.y0))
                continue
            if after.height <= before.height:
                raise SystemExit("%s: field %d got shorter (%.1f -> %.1f)"
                                 % (doc_id, field_id, before.height, after.height))
            changed += 1
            print("%s %d  %.1f x %.1f at (%.1f, %.1f)  ->  %.1f x %.1f at (%.1f, %.1f)"
                  % (doc_id, field_id, before.width, before.height, before.x0, before.y0,
                     after.width, after.height, after.x0, after.y0))

        # The four boxes' geometry is the whole of the diff. Put the old numbers
        # back on a copy; anything else that moved shows up here as a mismatch.
        check = copy.deepcopy(mapping)
        for field in check["staticFields"]:
            if field["id"] in repairs:
                original = next(f for f in untouched["staticFields"] if f["id"] == field["id"])
                field.update({key: original[key] for key in GEOMETRY})
        if json.dumps(check, sort_keys=True) != json.dumps(untouched, sort_keys=True):
            raise SystemExit("%s: the pass changed something other than the four boxes"
                             % doc_id)

        if not promote:
            print("%s: %d box(es) would change (--promote to write)" % (doc_id, changed))
            continue
        if not changed:
            print("%s: unchanged" % doc_id)
            continue
        tmp = path + ".tmp"
        with open(tmp, "w") as handle:
            json.dump(mapping, handle, indent=1)
        os.replace(tmp, path)
        print("wrote %s" % doc_id)


if __name__ == "__main__":
    main()
