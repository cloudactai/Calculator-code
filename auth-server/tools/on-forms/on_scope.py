"""Which Ontario templates this batch is allowed to touch.

The 45 Ontario templates shipped before 2026-08 and the 43 BC ones have been
reviewed and approved by the user. Nothing in `tools/on-forms/` may rewrite them —
see `HANDOFF.md` §2. Every tool that edits geometry imports `NEW_DOCIDS` from here
and refuses anything outside it, and `check_scope()` proves after the fact that the
approved files came through byte-identical.
"""

import hashlib
import os

EXPORT = os.path.normpath(
    os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..", "form-template-export")
)

# The 90 templates added by commit 4aa1921 ("forms: add the other 90 Ontario
# family-law forms"). This list is the scope of every geometry pass in this batch.
NEW_DOCIDS = [
    "Form6C", "Form8B_1", "Form8B_2", "Form8C", "Form8D", "Form8D_1", "Form8D_2",
    "Form8D_3", "Form8_01", "Form13C", "Form15D", "Form17B", "Form17D", "Form17F",
    "Form17G", "Form20", "Form20A", "Form20_2", "Form22A", "Form23B", "Form23C",
    "Form25B", "Form25C", "Form25D", "Form25E", "Form26", "Form26A", "Form26C",
    "Form26D", "Form27", "Form27B", "Form27C", "Form28", "Form28A", "Form28B",
    "Form28C", "Form29", "Form29A", "Form29B", "Form29C", "Form29D", "Form29E",
    "Form29F", "Form29H", "Form29I", "Form29J", "Form30", "Form30A", "Form30B",
    "Form32A", "Form32B", "Form32C", "Form32D", "Form32_1A", "Form33", "Form33A",
    "Form33B", "Form33B_1", "Form33B_2", "Form33C", "Form33D", "Form33E", "Form33F",
    "Form34", "Form34A", "Form34B", "Form34C", "Form34D", "Form34E", "Form34F",
    "Form34G", "Form34G_1", "Form34H", "Form34H_1", "Form34I", "Form34J", "Form34K",
    "Form34L", "Form34M", "Form34M_1", "Form34N", "Form35_1", "Form35_1A", "Form38",
    "Form39", "Form43", "Form43A", "Form43B", "Form43C", "FormA_25A",
]

# Built by `place_flat_fields.py` off a LibreOffice export of the government .docx.
# These carry inference, not government geometry, so their box *widths* are suspect
# too — see HANDOFF.md §3.
FLAT_SOURCED = {
    "Form13C", "Form25C", "Form26D", "Form34G_1", "Form34H", "Form34K",
    "Form43", "Form43A", "Form43B", "Form43C",
}

# Flattened out of Adobe LiveCycle; no AcroForm layer either, so same caveat.
XFA_SOURCED = {"Form20"}

# The forms whose type (TextField vs TextArea) came from the government's own
# multiline flag, and is therefore ground truth.
def is_acroform(doc_id):
    return doc_id not in FLAT_SOURCED and doc_id not in XFA_SOURCED


def _digest(path):
    with open(path, "rb") as fh:
        return hashlib.sha256(fh.read()).hexdigest()


def protected_files(export=EXPORT):
    """Every template file this batch must not modify."""
    keep = set(NEW_DOCIDS)
    out = []
    for name in sorted(os.listdir(export)):
        if not name.endswith(".json") or " 2." in name:
            continue
        stem = name[:-5]
        if stem in ("catalog", "audit") or stem in keep:
            continue
        out.append(os.path.join(export, name))
    return out


def snapshot(export=EXPORT):
    """sha256 of every protected template, for a before/after scope check."""
    return {p: _digest(p) for p in protected_files(export)}


def check_scope(before, export=EXPORT):
    """Return the protected files that changed. Must be empty."""
    after = snapshot(export)
    changed = [p for p in before if before[p] != after.get(p)]
    changed += [p for p in after if p not in before]
    return sorted(set(changed))
