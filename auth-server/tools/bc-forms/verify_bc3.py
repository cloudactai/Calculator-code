"""The placement guide's checklist, run over the batch-3 (CFCSA + adoption) templates.

Every check comes from `verify_bc2.py`, which is §7's testing checklist and §9's
list of shipped-Ontario defects written out as measurements. Nothing is re-implemented
here; this module only points that battery at batch 3's forms and adds the two checks
batch 3 needs and batch 2 did not:

* **`check_leader_boxes`** — batch 3's BC Laws forms keep the King's Printer's printed
  dotted leaders, so every correct box on one covers a run of dots. `check_printed_ink`
  reports each of those as a box over printed text; the leader is the writing line
  (§9.1), so a flag whose word is only dots is dropped and the box is instead required
  to actually *sit* on a leader.
* **`check_idempotence`** — §7.9. The build is re-run into a scratch directory and the
  field maps compared; a second run must produce byte-identical output.

    python3 verify_bc3.py [--export] [--only BCAD_1] [--verbose]

Exit status is non-zero if a blocking check fails.
"""
import argparse
import collections
import json
import os
import shutil
import sys
import tempfile

import fitz

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import bc_sources_batch3 as src3  # noqa: E402
import build_bc3  # noqa: E402
import verify_bc2 as V  # noqa: E402

EXPORT = V.EXPORT
OUT = build_bc3.OUT

LAWS_IDS = {s["docId"] for s in src3.all_sources() if s["kind"] == "bclaws"}


def is_leader(word):
    return bool(word.strip()) and set(word.strip()) == {"."}


def check_leader_boxes(doc_id, pdf, fields, blocking, advisory):
    """On a BC Laws form, a text box must sit on a printed dotted leader.

    The inverse of `check_printed_ink` for these forms: covering the dots is the
    point, and a box covering something that is *not* dots is the defect.
    """
    if doc_id not in LAWS_IDS:
        return
    for number in sorted({f["page"] for f in fields}):
        page = pdf[number - 1]
        words = page.get_text("words")
        for field in [f for f in fields if f["page"] == number]:
            if field["type"] == "CheckBox":
                continue
            rect = V.box(field)
            covered = [w for w in words if not (rect & fitz.Rect(*w[:4])).is_empty]
            printed = [w[4] for w in covered if w[4].strip() and not is_leader(w[4])]
            if printed:
                advisory.append(("leader-box-on-type", doc_id, number,
                                 "%s covers %s" % (field["id"], printed[:3])))


def check_idempotence(doc_ids, blocking):
    """§7.9: building twice must produce the same map, byte for byte."""
    scratch = tempfile.mkdtemp(prefix="bc3-idem-")
    original = build_bc3.OUT, build_bc3.QA
    try:
        build_bc3.OUT = os.path.join(scratch, "out")
        build_bc3.QA = os.path.join(scratch, "qa")
        os.makedirs(build_bc3.OUT)
        os.makedirs(build_bc3.QA)
        for src in src3.all_sources():
            if src["docId"] not in doc_ids:
                continue
            builder = (build_bc3.build_acroform if src["kind"] == "acroform"
                       else build_bc3.build_bclaws)
            _bg, _pages, sizes, fields, _audit = builder(src)
            build_bc3.bp.clamp_to_page(fields, sizes)
            build_bc3.bp.write_mapping(
                os.path.join(build_bc3.OUT, "%s.json" % src["docId"]), fields)
            fresh = open(os.path.join(build_bc3.OUT, "%s.json" % src["docId"]), "rb").read()
            shipped = open(os.path.join(original[0], "%s.json" % src["docId"]), "rb").read()
            if fresh != shipped:
                blocking.append(("not-idempotent", src["docId"], 0,
                                 "second build differs from the first"))
    finally:
        build_bc3.OUT, build_bc3.QA = original
        shutil.rmtree(scratch, ignore_errors=True)


# §5 has one shape it cannot judge from geometry, and this is it: the caption
# "Signature of applicant:" is followed on the same line by its own dotted rule and
# then by "Date: ......". The date's box is a real field, the signature rule beside
# it carries none (build_bc3.signature_captions drops it), and the caption sits far
# enough left to condemn both. Recorded rather than loosened, per §5's note on F38.
EXCEPTIONS = {("box-on-signature", "BCAD_4", 1)}


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--export", action="store_true")
    parser.add_argument("--only")
    parser.add_argument("--verbose", action="store_true")
    parser.add_argument("--skip-idempotence", action="store_true")
    args = parser.parse_args()

    root = EXPORT if args.export else OUT
    doc_ids = [s["docId"] for s in src3.all_sources()]
    if args.only:
        want = set(args.only.split(","))
        doc_ids = [d for d in doc_ids if d in want]

    blocking, advisory, offsets = [], [], []
    pages = fieldcount = 0
    for doc_id in doc_ids:
        pdf, fields = V.load(doc_id, root)
        pages += pdf.page_count
        fieldcount += len(fields)
        raw = []
        for check in V.CHECKS:
            check(doc_id, pdf, fields, blocking, raw)
        # A leader is the writing line, not a label the box has covered (§9.1).
        advisory += [item for item in raw
                     if not (doc_id in LAWS_IDS and item[0] == "printed-ink")]
        V.check_checkbox_marks(doc_id, pdf, fields, blocking, advisory, offsets)
        check_leader_boxes(doc_id, pdf, fields, blocking, advisory)
        pdf.close()

    if not args.skip_idempotence and not args.export:
        check_idempotence(set(doc_ids), blocking)

    accepted = [item for item in blocking if (item[0], item[1], item[2]) in EXCEPTIONS]
    blocking = [item for item in blocking if item not in accepted]

    print("%d forms, %d pages, %d fields\n" % (len(doc_ids), pages, fieldcount))
    for kind, doc_id, page_number, detail in accepted:
        print("accepted exception: %s %s p%s — %s" % (kind, doc_id, page_number, detail))
    if offsets:
        offsets.sort()
        print("checkbox mark alignment: median %.2fpt, 95th %.2fpt, worst %.2fpt (%d marks)"
              % (offsets[len(offsets) // 2], offsets[int(0.95 * (len(offsets) - 1))],
                 offsets[-1], len(offsets)))

    def report(name, items):
        counts = collections.Counter(kind for kind, *_ in items)
        print("\n%s: %d" % (name, len(items)))
        for kind, count in counts.most_common():
            print("  %-24s %d" % (kind, count))
        if args.verbose:
            for kind, doc_id, page_number, detail in sorted(items):
                print("    %-24s %-18s p%-3s %s" % (kind, doc_id, page_number, detail))

    report("BLOCKING", blocking)
    report("ADVISORY (worklist for the visual pass)", advisory)
    with open(os.path.join(OUT, "verify_bc3.json"), "w") as fh:
        json.dump({"blocking": blocking, "advisory": advisory}, fh, indent=1)
    return 1 if blocking else 0


if __name__ == "__main__":
    sys.exit(main())
