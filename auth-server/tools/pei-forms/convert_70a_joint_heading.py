"""Convert Form 70A*'s own pre-existing style of cause to the batch's new box format.

Unlike the 19 forms `pei_general_heading.py` heads, PEISC_70A_JOINT never
printed the bare `(General heading)` placeholder -- an earlier pass already
gave it a real style of cause: bare underscore rules for the court file
number, the court name, and each spouse's name, captioned below-and-right in
PEI's own convention, with "(Court seal)" as its own instructional line and
no printed court name (the government leaves that as a blank, same gap
70U/70V had). None of it was ever bound -- the caption reader in
`pei_binds.py` only recognizes "Applicant"/"Petitioner"/"Respondent", not
"Spouse One"/"Spouse Two" -- so a generated joint petition comes out with no
court file number, no court, and neither spouse's name filled in.

This replaces that block with the same label-then-box heading the other 19
forms now carry, reusing `rebuild`/`draw_block` from `pei_general_heading.py`
rather than re-deriving the geometry: same court name/(Family Section)
centring, same seal ring, same box column -- except the two party rows read
"Spouse One:" / "Spouse Two:", the words this document actually uses, still
bound to `applicant.fullLegalName` / `respondent.fullLegalName` since that is
the only two-party shape the matter data model has. The document's own
second title ("JOINT PETITION FOR DIVORCE"), the Date/Issued by rule, and
"Address of court office" are registrar furniture below the heading, not
part of it, and are left alone beyond the uniform shift everything below the
old block gets.

    python3 convert_70a_joint_heading.py
"""
import json
import os
import sys

import fitz

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import pei_general_heading as PGH  # noqa: E402

DOC_ID = "PEISC_70A_JOINT"
EXPORT = PGH.EXPORT

# The old block's own unbound fields -- Court file no., Court, Spouse One,
# Spouse Two -- keyed by id so this stays idempotent: once they're gone
# there is nothing at that id to drop a second time.
OLD_IDS = {1750047614143, 1750047614144, 1750047614145, 1750047614146}

PARTY_ROWS = [("Spouse One:", "applicant.fullLegalName"),
             ("Spouse Two:", "respondent.fullLegalName")]


def main():
    pdf_in = os.path.join(EXPORT, "%s.pdf" % DOC_ID)
    json_in = os.path.join(EXPORT, "%s.json" % DOC_ID)
    doc = fitz.open(pdf_in)
    mapping = json.load(open(json_in))
    page = doc[0]

    if PGH.PROBE in page.get_text():
        print("%-12s already converted, skipped" % DOC_ID)
        return 0

    lines = PGH.page_lines(page)
    words = [w for w in page.get_text("words") if w[4].strip()]
    left = min(w[0] for w in words)
    right = max(w[2] for w in words)
    title_top = min(b[1] for b in page.get_text("blocks"))

    # The old block runs from just under the page's own title (126.7-149.4,
    # "FORM 70 A* / JOINT PETITION FOR DIVORCE") down through "Spouse Two"
    # (263.9-275.0); the document's own second title starts immediately after
    # at 275.4. Read fresh off the page rather than hardcoded, the way every
    # other measurement in this batch is.
    title_bottom = max(y1 for y0, y1, t in lines if "JOINT PETITION" in t
                       and y0 < 200)
    second_title_top = min(y0 for y0, y1, t in lines
                           if "JOINT PETITION" in t and y0 > 200)
    spouse_two_bottom = max(y1 for y0, y1, t in lines if t == "Spouse Two")
    hold_top = title_bottom + PGH.GAP
    hold_bottom = (spouse_two_bottom + second_title_top) / 2.0
    assert hold_top < spouse_two_bottom < hold_bottom, "geometry drifted"

    before = json.dumps(mapping["staticFields"], sort_keys=True)
    page1_fields = [(f["y"], f["y"] + f["height"] / PGH.SCALE)
                   for f in mapping["staticFields"] if f["page"] == 1]

    placed, lift, drop, spill = PGH.rebuild(
        doc, 1, left, right, title_top, hold_top, hold_bottom,
        seal=True, second_title=False, page_fields=page1_fields,
        party_rows=PARTY_ROWS)
    assert spill is None, "70A_JOINT was not expected to need a spill"

    dropped = PGH.shift_fields(mapping, 1, hold_top, hold_bottom, lift, drop)
    extra_drop = [f["id"] for f in mapping["staticFields"] if f["id"] in OLD_IDS]
    mapping["staticFields"] = [f for f in mapping["staticFields"]
                               if f["id"] not in OLD_IDS]
    moved = json.loads(before)
    assert len(moved) == len(mapping["staticFields"]) + len(dropped) + len(extra_drop), (
        "a field went missing that wasn't explicitly dropped")

    PGH.reseat(doc[0], [f for f in mapping["staticFields"] if f["page"] == 1])
    PGH.add_fields(mapping, 1, placed)

    # Recorded so repair_pei_fields.py's own NAMED_FIELDS/SIGNATURE_BOXES/
    # BARE_RULES tables -- several of which name a page-1 coordinate on this
    # form -- translate through the same shift rather than going stale.
    PGH.record_shift(DOC_ID, 1, hold_top, hold_bottom, lift, drop, spill)

    tmp = os.path.join(EXPORT, "%s.pdf.tmp" % DOC_ID)
    doc.save(tmp, deflate=True, garbage=3)
    doc.close()
    os.replace(tmp, os.path.join(EXPORT, "%s.pdf" % DOC_ID))
    with open(os.path.join(EXPORT, "%s.json" % DOC_ID), "w") as handle:
        json.dump(mapping, handle, indent=2)

    bound = sum(1 for _, bind in placed if bind)
    print("%-12s converted: title up %.1f, body %s %.1f, +%d fields (%d bound), "
          "-%d obsolete" % (DOC_ID, lift, "down" if drop >= 0 else "up",
                            abs(drop), len(placed), bound,
                            len(dropped) + len(extra_drop)))
    return 1


if __name__ == "__main__":
    sys.exit(0 if main() else 1)
