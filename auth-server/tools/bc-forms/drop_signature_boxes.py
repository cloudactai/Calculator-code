"""Take the field boxes off signature rules, in both BC batches (§5).

§5 is unconditional: a signature line never gets a box. Batch 1 nevertheless shipped a
box on the **Registrar** rule of four order forms, on the reading that "Registrar" names
who the order issues from rather than who signs — and batch 2 was then made consistent
with it, which propagated the same fault to F19.4 and left BCPC_33/34's "Judge or Justice
of the Peace" rules boxed too. The user has confirmed the Registrar line *is* a signature
line, so §5 governs and every one of these comes off, batch 1 included.

Targets are matched on **page and geometry**, not on field id, so a rebuild that
renumbers fields cannot silently miss one or hit the wrong box; each entry must match
exactly one field or the tool stops.

Deliberately *not* removed, each checked against the page:

* the **print-name box** that sits above a "(print name or affix stamp of commissioner)"
  or "[type or print name]" caption — that caption labels the box above it, and §9.8 wants
  such a box kept, not the signature rule's;
* **BCPC_PFA893 p1**'s full-width 36.6 pt box, which is the "Further court directions"
  writing area; the "Signature" caption 18 pt below it belongs to the rule beneath, which
  carries no box;
* **BCSC_F38 p5**'s box after the printed "on", which is the jurat's date;
* **BCSC_F33** has no box on its Registrar rule at all — its three fields there are the
  BEFORE A JUDGE / ASSOCIATE JUDGE / REGISTRAR checkboxes.

Run: python3 drop_signature_boxes.py [--apply]
"""
import argparse
import json
import os
import sys

import fitz

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import verify_bc2 as V  # noqa: E402

EXPORT = V.EXPORT
OUT = V.OUT     # batch-2 staging, so a rebuild keeps the removal

# docId -> list of (page, y, x0, caption the rule carries). x0 is required as well as y
# because BCPC_34 puts the jurat's Date box on the *same* baseline as the judge's rule,
# and the match assertion below refuses an ambiguous target rather than guessing.
TARGETS = {
    # ---- batch 1 -------------------------------------------------------------
    "BCSC_F1_2": [(1, 369.8, 343.4, "Registrar")],
    "BCSC_F51": [(3, 204.7, 319.5, "Registrar")],
    "BCSC_F51_1": [(2, 206.5, 64.8, "Registrar")],
    "BCSC_F52": [(3, 231.0, 324.0, "Registrar")],
    # ---- batch 2 -------------------------------------------------------------
    "BCSC_F19_4": [(1, 619.9, 306.0, "Registrar")],
    "BCPC_33": [(1, 685.6, 238.2, "Judge or Justice of the Peace")],
    "BCPC_34": [(1, 575.1, 241.2, "Judge or Justice of the Peace")],
    "BCPC_48": [(1, 627.9, 23.9, "A commissioner for taking affidavits")],
    "BCPC_49": [(1, 668.1, 23.9, "A commissioner for taking affidavits")],
    "BCSC_S_51": [(3, 511.4, 37.7, "A commissioner for taking affidavits")],
    # ---- second pass ---------------------------------------------------------
    # F95's fax-filing payment block. The rule at y 530 is captioned "authorizing
    # signature (Credit Card)" — a signature rule, so §5 governs here as much as it does
    # on a jurat. The "print name as it appears on credit card" box above it stays (§9.8).
    # The gate missed this one because ROLE_CAPTION only matched "signature" at the start
    # of a caption; it now matches anywhere, with "date" and the print-name words
    # excluded so "Date of signature (dd/mmm/yyyy)" on BCPC_7 p1 is not swept up.
    "BCSC_F95": [(2, 500.4, 54.0, "authorizing signature (Credit Card)")],
}
BATCH2 = {"BCSC_F19_4", "BCPC_33", "BCPC_34", "BCPC_48", "BCPC_49", "BCSC_S_51",
          "BCSC_F95"}
TOL = 0.6


def drop_from(path, doc_id, targets, note):
    if not os.path.exists(path):
        return 0, []
    mapping = json.load(open(path))
    fields = mapping["staticFields"]
    removed = []
    for page_number, y, x, caption in targets:
        match = [f for f in fields
                 if f["page"] == page_number and abs(f["y"] - y) <= TOL
                 and abs(f["x"] - x) <= TOL]
        if not match:
            continue        # already removed; §7.9 wants a second run to be a no-op
        if len(match) > 1:
            raise SystemExit("%s %s p%d y=%.1f x=%.1f: matched %d fields, expected 1 — "
                             "refusing to guess"
                             % (doc_id, note, page_number, y, x, len(match)))
        field = match[0]
        rect = V.box(field)
        removed.append((field["id"], page_number, rect, caption))
        fields.remove(field)
    return len(removed), removed


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--apply", action="store_true")
    args = parser.parse_args()

    total = 0
    for doc_id in sorted(TARGETS):
        targets = TARGETS[doc_id]
        roots = [(os.path.join(EXPORT, "%s.json" % doc_id), "export")]
        if doc_id in BATCH2:
            roots.append((os.path.join(OUT, "%s.json" % doc_id), "staging"))
        for path, note in roots:
            if not os.path.exists(path):
                continue
            mapping = json.load(open(path))
            before = len(mapping["staticFields"])
            count, removed = drop_from(path, doc_id, targets, note)
            for field_id, page_number, rect, caption in removed:
                print("%-7s %-14s p%-2d drop id=%-14s %.0fx%.0f at %.0f,%.0f  (%s rule)"
                      % (note, doc_id, page_number, field_id, rect.width, rect.height,
                         rect.x0, rect.y0, caption))
            if note == "export":
                total += count
            if args.apply:
                mapping = json.load(open(path))
                fields = mapping["staticFields"]
                for page_number, y, x, _c in targets:
                    for field in list(fields):
                        if (field["page"] == page_number and abs(field["y"] - y) <= TOL
                                and abs(field["x"] - x) <= TOL):
                            fields.remove(field)
                assert len(fields) in (before, before - len(targets))
                with open(path, "w") as fh:
                    json.dump(mapping, fh, indent=1)
                    fh.write("\n")

    print("\n%d signature-rule box(es) removed across %d forms%s"
          % (total, len(TARGETS), "" if args.apply else "  (dry run)"))


if __name__ == "__main__":
    main()
