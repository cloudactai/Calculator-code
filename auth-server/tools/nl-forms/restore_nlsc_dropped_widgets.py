"""Restore six government widgets the NLSC build dropped.

    python3 restore_nlsc_dropped_widgets.py [--check]

Sixty of the 62 NLSC forms are built from the Supreme Court's own AcroForm
widgets, and the staged originals are still on disk as
`form-template-export/_incoming_nl/<DOCID>_source.pdf`. Comparing every shipped
field set against those originals (`audit_nlsc_vs_source.py`) turns up ten
source widgets with no corresponding field in the shipped JSON. Six of them are
real losses and are restored here; the other four are correctly absent and are
listed at the bottom so they are not "fixed" by a later session.

## Restored

**NLSC_F10_04A p2 (4 fields).** The whole signing jurat --
"SWORN TO or AFFIRMED at ___, this ___ day of ___, 20___" -- renders with four
bare underscore runs and no boxes at all, while every other NLSC form carrying
this block fields it. The government has four widgets sitting exactly on those
four runs:

    this          (193.40, 688.22, 308.84, 704.41)   run x=193.3-308.9
    day of_2      (330.44, 688.22, 375.56, 704.41)   run x=330.4-375.5
    20_2          (405.20, 688.22, 490.52, 704.41)   run x=405.1-490.5
    undefined_2   (508.04, 688.22, 533.12, 704.41)   run x=508.0-533.1

(the run extents are what `audit_anchors.py` reports as UNCOVERED on that page).

**NLSC_F23_01A p3 (2 fields).** The same block in its "DATED at" spelling. Here
two of the four widgets did survive the build -- "s" (the day) and "20_2" (the
year) -- and the place and month did not, so the row ships half-fielded:

    DATED at      (121.31, 654.96, 286.91, 670.93)   dropped
    s             (308.51, 655.53, 358.67, 671.51)   shipped, y=658.20
    day of_2      (388.31, 655.53, 488.63, 671.51)   dropped
    20_2          (506.15, 655.53, 536.27, 671.51)   shipped, y=658.20

The two survivors give this repair its own check: the restored month field sits
on the same printed rule as them, so it must come out at the same y=658.20.

## Geometry

Nothing here is chosen. Each field is put through the exact transform the build
applied to its siblings, using the build's own shared module
(`tools/acroform_seat.py`, also used by New Brunswick):

    x      = widget.x0
    width  = widget.width * SCALE            (SCALE = 1.5; see FORM_FIXING_GUIDE)
    height = STD_LINE * SCALE = 19.95
    y      = widget.y1 - STD_LINE            then re-seated onto the printed
             rule by `page_geom.seat_rule`:  y = rule_y - SEAT_GAP - STD_LINE

That last step is why the shipped fields' bottoms do not simply equal their
widget bottoms (the measured offset runs -0.5 to -1.4pt across this corpus):
the build seats on the printed rule, not on the government's rectangle.

Only `staticFields` entries are appended -- no existing field is modified, and
every non-geometry key on existing fields is asserted unchanged. Idempotent: a
widget whose blank a field already covers is skipped, so a second run adds none.

## Deliberately NOT restored (evidence in the ledger)

* `NLSC_F4_03A p9 "Check this box to dec_2"` rect y 796.0-802.3 on a 792pt
  page -- the widget lies entirely below the sheet. `acroform_seat.
  drop_offpage_fields` removed it correctly; restoring it would put an
  unreachable control off the printed page.
* `NLSC_F4_03A p19 "the Lawyer for22"`, `NLSC_F4_04A p17 "the Lawyer for22"`,
  `NLSC_F4_04A p18 "the Lawyer for222"` -- each sits on the printed
  "Signature of Applicant" / "Signature of Co-Applicant" rule. Signature rules
  are left bare throughout the whole NB/NL corpus (see NL_NB_AUDIT_LEDGER.md);
  these stay bare too.
"""
import argparse
import json
import os
import sys

import fitz

HERE = os.path.dirname(os.path.abspath(__file__))
TOOLS = os.path.dirname(HERE)
sys.path.insert(0, os.path.join(TOOLS, "bc-forms"))
sys.path.insert(0, os.path.join(TOOLS, "on-forms"))
sys.path.insert(0, TOOLS)
EXPORT = os.path.join(os.path.dirname(TOOLS), "form-template-export")
INCOMING = os.path.join(EXPORT, "_incoming_nl")

import bc_pipeline as bp        # noqa: E402
import page_geom as G           # noqa: E402
import acroform_seat as A       # noqa: E402

SCALE = bp.SCALE
STD_LINE = A.STD_LINE
SEAT_GAP = A.SEAT_GAP

# (doc_id, page, source widget field_name)
RESTORE = [
    ("NLSC_F10_04A", 2, "this"),
    ("NLSC_F10_04A", 2, "day of_2"),
    ("NLSC_F10_04A", 2, "20_2"),
    ("NLSC_F10_04A", 2, "undefined_2"),
    ("NLSC_F23_01A", 3, "DATED at"),
    ("NLSC_F23_01A", 3, "day of_2"),
]

GEOM = ("x", "y", "width", "height")
V_TOL, H_FRAC = 14.0, 0.30


def frect(f):
    return fitz.Rect(f["x"], f["y"], f["x"] + f["width"] / SCALE,
                     f["y"] + f["height"] / SCALE)


def near(a, b):
    lo, hi = max(a.x0, b.x0), min(a.x1, b.x1)
    if hi <= lo or (hi - lo) / max(1e-6, min(a.width, b.width)) < H_FRAC:
        return False
    return abs(a.y0 - b.y0) < V_TOL or abs(a.y1 - b.y1) < V_TOL or \
        (a.y0 < b.y0 and a.y1 > b.y1) or (b.y0 < a.y0 and b.y1 > a.y1)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--check", action="store_true", help="dry run, no writes")
    args = ap.parse_args()

    by_doc = {}
    for doc_id, page_no, name in RESTORE:
        by_doc.setdefault(doc_id, []).append((page_no, name))

    total = 0
    for doc_id, wants in sorted(by_doc.items()):
        json_path = os.path.join(EXPORT, doc_id + ".json")
        data = json.load(open(json_path))
        fields = data["staticFields"]
        frozen = {f["id"]: dict(f) for f in fields}

        src = fitz.open(os.path.join(INCOMING, doc_id + "_source.pdf"))
        bg = fitz.open(os.path.join(EXPORT, doc_id + ".pdf"))

        proto = {k: fields[0].get(k, v) for k, v in
                 (("fontSize", 9), ("color", [0, 0, 0]),
                  ("background", "none"), ("border", "none"))}
        base = bp.new_id(doc_id, 0)
        index = max([f["id"] - base for f in fields if f["id"] > base] or [0]) + 1

        added = 0
        for page_no, name in wants:
            hits = [w for w in src[page_no - 1].widgets() if w.field_name == name]
            if len(hits) != 1:
                raise SystemExit("%s p%d: %d widget(s) named %r"
                                 % (doc_id, page_no, len(hits), name))
            r = hits[0].rect

            if any(f["page"] == page_no and near(r, frect(f)) for f in fields):
                print("%s p%d %-14s already covered" % (doc_id, page_no, name))
                continue

            new = dict(proto)
            new.update(id=bp.new_id(doc_id, index), type="TextField", value="",
                       x=round(r.x0, 2), y=round(r.y1 - STD_LINE, 2),
                       width=round(r.width * SCALE, 2),
                       height=round(STD_LINE * SCALE, 2), page=page_no)
            index += 1

            rule = G.seat_rule(new, G.hrules(bg[page_no - 1]))
            note = "widget bottom"
            if rule is not None:
                new["y"] = round(rule[0] - SEAT_GAP - STD_LINE, 2)
                note = "rule %.2f" % rule[0]
            else:
                # These jurat blanks are typed underscore runs, not drawn
                # rules, so seat_rule finds nothing. Where the same printed row
                # already carries fields that survived the build, adopt their y:
                # they sit on the one underscore baseline this row prints, and
                # they are better evidence than the government rectangle, which
                # is not always self-consistent (on F23_01A the "DATED at"
                # widget bottom is 0.58pt above its three row-mates' even
                # though all four blanks share a single baseline).
                row = [f["y"] for f in fields
                       if f["page"] == page_no and f["type"] != "CheckBox"
                       and abs((f["y"] + f["height"] / SCALE) - r.y1) < 3.0]
                if row:
                    new["y"] = round(sorted(row)[len(row) // 2], 2)
                    note = "row-mates (n=%d)" % len(row)

            print("%s p%d %-14s  x=%.2f y=%.2f w=%.2f h=%.2f  (widget %.2f-%.2f, "
                  "seated on %s)" % (doc_id, page_no, name, new["x"], new["y"],
                                     new["width"], new["height"], r.x0, r.x1, note))
            fields.append(new)
            added += 1

        for f in fields:
            if f["id"] in frozen:
                assert f == frozen[f["id"]], "existing field %d modified" % f["id"]

        print("%s: +%d field(s)" % (doc_id, added))
        total += added
        if added and not args.check:
            with open(json_path, "w") as fh:
                json.dump(data, fh, indent=2)
                fh.write("\n")
            print("%s: written" % doc_id)

    print("total added: %d" % total)
    if args.check:
        print("(dry run, nothing written)")


if __name__ == "__main__":
    main()
