"""Fifth pass on Prince Edward Island, 2026-08-28.

PEISC_70A_JOINT never printed the bare `(General heading)` placeholder --
an earlier pass (recorded in this same ledger's page-1 row) had already
given it a real style of cause: bare underscore rules for the court file
number, the court name, and each spouse's name, captioned below-and-right in
PEI's own convention. None of it was ever bound, because that pass's
caption reader only recognized "Applicant"/"Petitioner"/"Respondent", not
"Spouse One"/"Spouse Two" -- so a generated joint petition came out with no
court file number, no court, and neither spouse's name filled in, the same
defect the other 19 forms had for a different reason.

`convert_70a_joint_heading.py` replaces that block with the same
label-then-box heading `pei_general_heading.py` put on the other 19 forms --
same court name/(Family Section), same seal ring, same box column -- except
the two party rows read "Spouse One:" / "Spouse Two:", the words this
document actually uses, bound to `applicant.fullLegalName` /
`respondent.fullLegalName` since that is the only two-party shape the
matter data model has. This replaces the page-1 row only; every other page
is untouched.
"""
import review_ledger as L

P = "pass"

L.record(
    "PEISC_70A_JOINT", 1, P, P,
    corrections=(
        "Replaced the prior pass's unbound underscore-rule heading (court "
        "file number, court, Spouse One, Spouse Two, none of them bound) "
        "with the batch's label-then-box heading: a seal ring, a Court File "
        "No. box bound to court_info.courtFileNumber, and Spouse One/Spouse "
        "Two boxes bound to applicant.fullLegalName/respondent.fullLegalName. "
        "See convert_70a_joint_heading.py."),
    notes=(
        "The two party rows read 'Spouse One:'/'Spouse Two:' rather than "
        "'Applicant/Petitioner:'/'Respondent:' -- the words this document "
        "actually uses for a joint petition -- so pei_binds.py's caption "
        "reader (which only recognizes the latter) does not independently "
        "confirm these two binds the way it does on every other headed "
        "form; they are set explicitly by convert_70a_joint_heading.py "
        "instead. BARE_RULES' and SIGNATURE_BOXES' page-1 entries for this "
        "doc now translate through heading_shifts.json the same way NAMED_FIELDS "
        "already did."))

print("1 row written")
