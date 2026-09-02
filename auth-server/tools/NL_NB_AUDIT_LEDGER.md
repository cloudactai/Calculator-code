# NL/NB form audit ledger (working notes)

Legend: OK = reviewed, no issue. FIX = reviewed, repaired. LEFT = reviewed, issue found, left unchanged with evidence.

## NBFSA (14 forms, 18 pages) — DONE
- NBFSA_1_01 p1: FIX judge-signature box dropped (drop_nb_judge_signature.py)
- NBFSA_1_02 p1: FIX judge-signature box dropped
- NBFSA_1_03 p1: FIX judge-signature box dropped
- NBFSA_1_04 p1: FIX judge-signature box dropped
- NBFSA_1_1  p1: FIX judge-signature box dropped
- NBFSA_1_2  p1: OK; p2: FIX judge-signature box dropped
- NBFSA_1_3  p1: FIX judge-signature box dropped
- NBFSA_1_4  p1: FIX judge-signature box dropped
- NBFSA_1_5  p1: FIX judge-signature box dropped
- NBFSA_22   p1: FIX judge-signature box dropped; LEFT "...DECLARED under [gap] of the Family
  Services Act..." — plain whitespace gap (~35pt), no dot leader/underline/drawn rule anywhere
  near it (contrast: "Birth registration number ......." on the line above IS a dot leader and
  correctly has a field). No printed anchor = no field invented, per guide. Documented, unchanged.
- NBFSA_23   p1,p2: OK (declarant/commissioner jurat blocks, no judge signature — this is a
  statutory declaration, not a court order)
- NBFSA_24   p1: OK (same jurat pattern as 23)
- NBFSA_25   p1,p2: OK (registrar/clerk certificate form, no judge signature; "Sex" field width
  44pt butts against "Birth date" label at <1pt gap — verified NOT an overlap, sample text
  "Jordan A. Whitfield" simply overflows a field sized correctly for "M"/"Female"; false positive)

Repair script: auth-server/tools/nb-forms/drop_nb_judge_signature.py (10 fields dropped,
verify_nb zero findings before/after, idempotent confirmed)

## NBKB (34 forms, 224 pages) — IN PROGRESS
- NBKB_18A p1: OK. Blank space below "documents received" numbered-paragraph prompt and
  signature line are correctly unfielded — this card is completed by hand by the SERVED
  recipient after mailing, not by the filer in-app (day/month/year blanks and doc list are
  plain underscores with no box in source, consistent with that).
- NBKB_47B p1: OK. TextArea "Firm address" generously tall (99.8pt) but doesn't overlap
  anything below (blank rest of page); not a defect.
- NBKB_72C p1: OK. Same "Business address" TextArea pattern, fine.
- NBKB_72E p1: OK. Narrative TextArea for paragraph 4 correctly sized/placed.
- NBKB_72FF p1: FIX — was 0 fields despite genuine dot-leader blanks (solicitor's name,
  DATED at/day/month/year). README's "zero dot leader runs" claim was wrong for this form
  (confirmed via regex on extracted text). Added 4 TextFields via new
  add_nb_dotline_fields.py; left trailing signature leader ("solicitor for petitioner")
  unboxed per §5.
- NBKB_72H p1: OK, narrative TextArea correct.
- NBKB_72I p1: OK, narrative TextArea correct.
- NBKB_72L p1: OK, correctly zero fields on both spouses' own signature lines.
- NBKB_72M, 72N, 72O p1 each: OK — genuine dot leaders present but correctly left
  unboxed: registrar/court-issued documents, not filer-entered (matches README rationale).
- NBKB_7A p1: FIX — was 0 fields despite ~11 genuine English-column dot-leader blanks
  (TO:, DATED at/day/month/year, solicitor/firm/address x2-line, plaintiff name). Added
  via add_nb_dotline_fields.py, English column only (x<310); French column deliberately
  left blank (app is English-medium, matches how a monolingual filer would leave it by
  hand); signature leader excluded per §5.
- NBKB_72K p1,p2: OK — item2 date-row visual jumble is generic-sample overflow noise on
  correctly-sized day/month/year fields, not a real defect (verified via geometry).
- NBKB_72G p1,p2: OK, same pattern, all fields/TextAreas correctly placed.
- NBKB_37A p1-3: FIX — field for the English "DIVISION" header row (bilingual form) sat
  directly on top of the printed word "DIVISION" (measured via pixel-darkness scan since
  text-extraction is lossy for this form's English column, same font/ToUnicode defect NL's
  README records for NLPC forms). Confirmed via the bilingual symmetry: every other
  English/French field pair on the page shares an identical width; this was the only
  mismatched pair (55.7pt vs French twin's 139.0pt). Moved to sit after "DIVISION" (mirroring
  "DIVISION DE ___" on the French side) with the French twin's width, via new
  fix_nb_field_geometry.py. Pages 2-3 unaffected (fields elsewhere untouched, confirmed by re-render).
- NBKB_72D p1: OK (same Answer-form pattern as 72G/72H, correct).
- NBKB_73I p1-3: OK. TextAreas correctly sized/placed; signature line correctly left unboxed.

Repair script: auth-server/tools/nb-forms/fix_nb_field_geometry.py (1 field corrected,
verify_nb zero findings before/after (still 4027 fields, geometry-only move), idempotent
confirmed, visual render confirmed clean)

- NBKB_72U p1-7: OK, all fields correctly placed (used as reference template for 73A/73F fix).
- NBKB_73A p1: FIX — "The Applicant will apply to the Court at..." hearing-date/location/time
  clause (5 blanks EN + 5 FR) had zero fields on either language column despite drawn-rule
  blanks with printed labels, while the near-identical clause on 72U was correctly fielded.
  Added via new add_nb_hearing_date_fields.py (geometry measured off drawn rules + one
  underscore run). p2-5: OK.
- NBKB_73AA p1-5: OK (no hearing-date clause on this variant; rest of page fine).
- NBKB_73F p1: FIX — same hearing-date clause defect as 73A, same fix script. p2-7: OK.
- NBKB_73G p1: OK. p2: FIX (via trim script, see below). p3: FIX (item 8 caption 2nd line
  was covered by TextArea top — this was the finding that prompted the general trim script).
  p4: OK.
- NBKB_73H p1-4: OK (post-trim).
- NBKB_37A p1-3: FIX documented above (DIVISION field). Also caught by trim script (0 TextArea
  changes needed there beyond the DIVISION fix).

### General fix: TextArea caption-overlap, whole NBKB batch
Found via systematic scan (not just 73G): many NBKB TextAreas were cut to the standard
single-line-caption offset without checking whether the caption wrapped to 2-3 lines, so the
box top oversat the last line(s) of italic instruction text. Built
auth-server/tools/nb-forms/trim_nb_textarea_tops.py — measures the actual printed line above
each TextArea every run (not cached), iterates per field until no more overlap (handles 3-line
captions), only moves y/height, bottom edge fixed, MIN_HEIGHT=20pt guard skips anything that
would trim unsafely small (flags for manual look instead of forcing it).
- Had to add a filter for whitespace-only "ghost" text lines (NBKB_72H p1 had 9 stacked
  single-space lines from y=435-566, a Word-to-PDF artifact) that were falsely treated as
  caption text and walked one field down through all of them (437.8 -> 553.8) before the fix.
- 311 fields trimmed (310 in pass 1 covering most docs + NBKB_72A p4 needing a second pass
  before the ghost-line fix; after the fix, exactly the same 311 total, idempotent, zero
  ghost-line false positives).
- 1 field left unchanged with documented reason: NBKB_81F p4 id=1750047115066 ("(Name of party
  bringing motion.)", a single full-width EN+FR-shared field mirroring the page's "TO:" field
  in the same shape) — already only 18pt tall; the caption overlap is real but trimming would
  drop it to 15pt, below the safety floor. Left as-is; flagged, not forced. Genuinely marginal,
  not a clear win either way — documented rather than guessed at.
- verify_nb zero findings before/after (4047 fields unchanged, geometry-only), idempotent
  confirmed, visually spot-checked across 73G/81H/81I/72A/72B/47B — all clean, no regressions,
  answer space preserved (bottom edge never moved).

### General fix: TextField caption-overlap (wrapped inline blanks), whole NBKB batch
Same root cause class as the TextArea fix but for single-line TextFields, found while
reviewing NBKB_72A p3: "(b) the petitioner intends to proceed in the ____ language;" doesn't
fit on one line in the narrow two-column bilingual layout, wraps, and the field sat on the
wrapped caption's own baseline instead of the row its trailing text ("language;") sits on —
confirmed visually (descenders of "petitioner"/"proceed" clipped by the field's top border).
Built auth-server/tools/nb-forms/shift_nb_textfields_off_captions.py — a TextField can't be
trimmed (already at the one approved line height), so this SHIFTS it down instead, single
pass only, capped at 10pt, refuses (skips + reports) anything needing a second pass or a
larger jump. That safety cap mattered: an early uncapped/iterating version walked adjacent
single-line rows (e.g. "Work:"/"Home:" phone fields sitting close together) two whole rows
down onto the wrong row entirely — caught by spot-checking before applying broadly, fixed by
capping to one short pass and refusing the rest. Also had to compare word-level boxes, not
line bboxes, after a leading-space-in-bbox artifact produced a 0.2pt false "still overlapping"
result that blocked the very case (72A p3) the script was written for.
- 414 fields shifted total (279 + 135 after the word-box fix), zero verify_nb findings,
  idempotent, field count unchanged (4047, geometry-only).
- ~28 fields left unchanged (flagged "needs a manual look" — either >10pt or still-overlap
  after one pass). Spot-checked several via render (NBKB_81H p14, NBKB_81F p15): both already
  render cleanly with no visible defect, confirming these are detector false-positives (near
  numbered-paragraph markers), not real issues. Left as-is; documented rather than forced.
- Visually confirmed fix on NBKB_72A p3 (the original finding) — clean on both language
  columns after the shift.

### NBKB_72A — FULL 21-page pass complete (post-fix re-render). All pages clean after the
DIVISION-style fix (n/a here), TextArea trim, and TextField shift fixes. Note: page 8 initially
looked defective (4(b)/4(c) captions clipped) but that was a STALE pre-fix render I was viewing
by mistake — re-rendering after the TextField shift fix confirmed it's clean. Lesson: always
re-render after applying a fix before judging a page. No further issues found on 72A.
Signature lines (p20 "X ___ SIGNATURE OF PETITIONER", p21 "X ___ SIGNATURE OF SOLICITOR")
correctly left unboxed both languages. Table pages (10, 16) correctly zero-pre-filled (blank
table rows for children/expenses, no printed content to clip). 72A: DONE, no unresolved items.

### NBKB_72B — FULL 14-page pass complete (fresh post-fix renders). All clean. Noted rendering
artifact (documented once, applies repo-wide): a handful of fields are typed TextArea instead
of TextField (e.g. "PETITIONER" name p1, "Telephone number" p12-14) and render as an empty box
in the QA tool because the generic long-paragraph SAMPLE text doesn't fit their narrow/short
box — verified with a realistic short value (a name, a phone number) that it fits fine with
room to spare. This is a render-tool sample-mismatch, NOT a form defect — the field itself
works correctly for its real content. Cannot fix the type mismatch anyway (repair scripts may
only touch x/y/width/height per the guide). Documented so it isn't re-investigated per
instance; only worth flagging again if a REALISTIC short value also fails to fit. 72B: DONE.

### NBKB_72F — FULL 14-page pass complete. All clean, no new issues, same known TextArea
sample-mismatch non-issue seen throughout. DONE.

### NBKB_72J — FULL 13-page pass complete. Large, dense financial-statement/appendix form
(income, expenses, property, debts tables) — all table cells and totals correctly placed.
Page 13's checkbox next to "IMPORTANT: Calculations will not work properly unless this box is
checked" confirmed present/checked — this is the documented INK_EXEMPT case from the nb-forms
README (widget with no printed square of its own). Minor cosmetic note, not fixed: TOTALS (j)/
(k) and (a)/(b) column labels on pages 12-13 sit ~1-1.5pt from their field's edge — touching
but not overlapping/clipping any character, well under the threshold that indicated a real
defect elsewhere (5-6pt+ with visible letter clipping). Left as-is. DONE.

### NBKB_81A — FULL 15-page pass complete. All clean. Checked closely and ruled out as
false positives (documented so not re-investigated): p5/p15 "DATED at/on the day of/20"
clause — narrow day/month/year TextFields correctly non-overlapping by geometry
(search_for()-verified), messy-looking render is the generic 19-char sample overflowing
short fields, same pattern as NBFSA_25's "Sex" field. p7/p8 "Resident in" and "Given
name(s)" TextAreas render empty — too narrow for the canned paragraph but confirmed via
one-off insert_textbox() with realistic values (city/province, a name) that they fit with
room to spare. No fixes needed. DONE.

### NBKB_81B — FULL 10-page pass complete. All clean. Same false-positive patterns as 81A
(day/month/year fields on p10's jurat clause, empty-looking narrow TextAreas on p3/p4
tables all confirmed fit realistic content via insert_textbox spot-check). One thing
checked and ruled out: a single-line TextField at the standard STD_LINE=13.3 height always
reports ~-1.76pt "overflow" from PyMuPDF's insert_textbox() regardless of text length —
verified this is a fixed artifact of the function's internal line-height padding (confirmed
on an unrelated already-clean field for comparison), not a real defect; every single-line
TextField in the whole NB/NL corpus uses this same height, so this is not diagnostic and
should not be used to flag pages going forward. DONE.

### NBKB_81C — FULL 9-page pass complete. All clean, same established false-positive
patterns (day/month/year clauses on p6/p8/p9 jurats). DONE.

### NBKB_81F — FULL 16-page pass complete. All clean. Re-confirmed the pre-existing
documented item (p4 id=1750047115066, marginal 18pt field, left as-is) is still correctly
untouched. Same false-positive patterns throughout (day/month/year jurats p1/p15/p16,
narrow "ext:"/"at (time)" fields p2/p4, empty-looking TextAreas on p10/p11 tables confirmed
fit realistic content via insert_textbox spot-check, e.g. p11 "Terms of payment" column).
DONE.

### NBKB_81G — FULL 22-page pass complete. All clean. Same established false-positive
patterns throughout (narrow "ext:" fields p1/p2, narrow "Birth Date" table columns p5/p8/p9
confirmed fit realistic dates via insert_textbox spot-check, "Type of Expense" column p12
confirmed fits, day/month/year jurats pp3/19/20/21/22). DONE.

### NBKB_81H — FULL 22-page pass complete. All clean. Structurally near-identical to 81G
(Response mirrors Change Information Form layout) — same false-positive patterns throughout.
Checked closely: p15/p18/p22 "(name of recipient)" full-width TextField sitting directly
below its own caption looked tight in the render but matches 81G's identical, already-
confirmed-clean layout; no real clipping. DONE.

### NBKB_81I — FULL 11-page pass complete. All clean. Same false-positive patterns
(narrow Age/Sex columns p5 confirmed non-overlapping by geometry, day/month/year jurats).
DONE.

## NBKB (34 forms, 224 pages) — COMPLETE. Every page reviewed with fresh renders. Fixes:
drop_nb_judge_signature.py, add_nb_dotline_fields.py, fix_nb_field_geometry.py,
add_nb_hearing_date_fields.py, trim_nb_textarea_tops.py, shift_nb_textfields_off_captions.py
(all documented above with before/after counts). One item left intentionally unfixed with
evidence: NBKB_81F p4 id=1750047115066 (marginal 18pt field, trimming would go below the
20pt safety floor). No other unresolved items in NBKB.


Repair script: auth-server/tools/nb-forms/add_nb_dotline_fields.py (15 fields added across
2 forms, verify_nb zero findings before/after 4012->4027, idempotent confirmed, visual
render confirmed clean on both)

## NLEPO (12 forms, 19 pages) — COMPLETE, see "Session 3" below for full detail
## NLPC (34 forms, 61 pages) — NOT STARTED (two forms spot-checked only, see Session 3)
## NLSC (62 forms, 352 pages) — NOT STARTED
## NBFSA reg check: resolved. Directory scan (`ls NB*.json`) turned up NBFLA_1.json/.pdf —
a 14th NB regulation form outside the NBFSA_/NBKB_ prefixes the ledger had been tracking
(Family Law Act "Form 1" default/arrears certificate, S.N.B. 2020 c.23 s.31(1)). Not a
duplicate of anything already reviewed. `verify_nb.py` already treats it like NBFSA_ (static
exemption list), confirming it's meant to be part of this same regulation-forms family and
in scope per "NBFSA_ forms (including regulation forms)". Rendered and reviewed both pages
fresh: p1 (style block) clean; p2 (certificate) — day/month dot-leader TextFields sit right
at the edge of the printed "day" word (field right edge 437.8 vs "day" glyph start 437.6,
~0.2-2pt over) but confirmed via insert_textbox with realistic short values ("15th") this is
the same fixed STD_LINE-height artifact (-1.76pt) seen everywhere else in the corpus, not a
real overlap — the dot-leader itself sizes the field, and real day/month content is short
enough to sit clear of "day"/"of". No fix needed. NBFLA: DONE, 1 form, 2 pages, no changes.

Baseline verify_nl.py: 96 templates, 413 pages, 5889 fields, 107 binds, zero findings
Baseline verify_nb.py (before NBFSA fix): 48 templates, 242 pages, 4022 fields, 79 binds, zero findings
verify_nb.py (after NBFSA fix): 48 templates, 242 pages, 4012 fields, 79 binds, zero findings

## Session 3 (2026-08-31): NL systemic fixes + NLEPO batch COMPLETE

Picked up mid-NLEPO-batch per handoff. Baseline confirmed exact on pickup:
verify_nb.py 48/242/4047/79 zero findings (unchanged from session 2's end
state); verify_nl.py 96/413/5715/106 zero findings (5889 baseline minus
174 dedup drops from session 2). NB required no further work this session.

### Finished the carried-over NLEPO_003 fix, but the script needed a
correction first
The handoff's add_nlepo_003_datefields.py (Month/Year fields for item 2(b))
had never been run. Ran --check, then rendered before applying broadly --
caught that its 1.5x width-padding factor (back-derived from the shipped
Day field's own width/segment ratio) made the new Month field visually
overlap the Day field by ~14.8pt (confirmed in a render: sample text ran
together with no gap). Rather than ship a known-bad width, wrote
fix_nlepo_003_datefields.py to correct all three fields (Day included, the
root cause) to the exact pixel-scanned underline widths with no padding:
Day 52.0pt, Month 95.75pt, Year 71.75pt, leaving real printed gaps between
them. Applied, verified, re-rendered -- clean (geometry-only, 5715->5717
fields for the 2 additions, then a same-count geometry fix).

### New finding on NLEPO_003 p1 during the full read-through: missing
Respondent D.O.B. field
Applicant D.O.B. is fielded (id 1750798505004); the identical Respondent
D.O.B. blank two rows below has no field at all (bare underscore line in
the render). get_text('words') and get_drawings() find nothing (same
lossy-extraction pattern as item 2(b)); confirmed via pixel-darkness row
scan: true underline x=385.2-520.8 at y=247-248. Added a new field
(add_nlepo_003_respondent_dob.py) mirroring the Applicant field's width
(193.35, anchored just after the caption) since nothing prints to its
right on the page. 5717->5718 fields. Re-rendered p1 clean.
NLEPO_003: DONE, all 4 pages reviewed and clean (p1 FIX, p2 FIX, p3 OK, p4
FIX -- see jurat-dates finding below).

### Systemic finding #3: "day of ___, 20__" signing-date fields oversized
across most of the NLEPO batch
Found while reviewing NLEPO_002 p1: the "Dated this ___ day of ___, 20___."
row's 3 fields overlapped each other and the "day"/"20" captions (confirmed
by geometry: field for the month blank alone overlapped the year field by
27pt). Grepped every NLEPO PDF for 'SWORN TO'/'Dated this' text and found
the same defect, in every single instance it appears: NLEPO_002 p1,
NLEPO_003 p4 (the "SWORN TO (OR AFFIRMED) ... this ___ day of ___, 20__:"
jurat -- this is what caused the "line struck through 'Province'" look
noted in the prior handoff; turned out to be the oversized "at" field's
right edge running under "in the Province", not a y-axis intrusion),
NLEPO_004 p1, NLEPO_006 p1, NLEPO_007 p2, NLEPO_008 p1 (plus a second,
unique single-field date blank on the same page, see below), NLEPO_009 p1,
NLEPO_010 p1, NLEPO_011 p1 (two occurrences: an informational "Order made
on the ___ day of ___" clause and the usual signing line).

Root cause: the day/month/year TextFields were all generated wider than
their printed underscore runs, overlapping the next caption word (and, in
NLEPO_004 and NLEPO_009's "DATED at ___ in the Province..." lines,
overlapping "in the Province..." by 55-90pt). Every true blank extent was
read via get_text('rawdict') character-level boxes against the
*unmodified* base PDF (word-level extraction merges some runs into the
next caption word with no space, e.g. NLEPO_004's literal token
"_________________day") -- exact evidence for all 25 fields is in the
script's docstring. Two scripts: fix_nlepo_jurat_dates.py (NLEPO_002/003,
6 fields + 1 addition for a second genuinely-missing year blank on
NLEPO_003 p4 that the old oversized field 043 had been silently swallowing
whole, next to "20") and fix_nlepo_signing_date_fields.py (the other 7
forms, 25 fields, extended once more for NLEPO_008's unique single-field
"(day)(month)(year)" format-hint blank at item... "swear/solemnly affirm
... on the ___ serve the attached (day)(month)(year)" -- confirmed via
text extraction that day/month/year are printed BELOW a single blank line
as format hints, not 3 separate blanks, so this is correctly one field,
just also oversized, fixed the same way).

All fixes: only x/width changed on existing fields (one narrow exception:
the new NLEPO_003 p4 year field, a genuine addition). Zero verify_nl
findings before/after both scripts, idempotent confirmed (both, twice),
field count moved only for the two additions (5718->5725 total across
Respondent D.O.B. + jurat-dates additions). Visually re-rendered and
re-inspected every affected page/row: NLEPO_002 p1, NLEPO_003 p4, NLEPO_004
p1, NLEPO_006 p1, NLEPO_007 p2, NLEPO_008 p1, NLEPO_009 p1, NLEPO_010 p1,
NLEPO_011 p1 (both occurrences) -- all clean, fields now stop before the
next caption with a real gap. Remaining visual "crowding" in these renders
is exclusively the QA tool's oversized generic sample text ("Jordan A.
Whitfield") in narrow day/month-name/year fields overflowing past the
(now correctly-sized) box border -- the established false-positive pattern
documented throughout this ledger; a realistic value ("15"/"August"/"2026")
fits with room to spare.

One item deliberately left unfixed, documented: NLEPO_006/007/008/010 each
have a pre-existing TextField sitting on the printed "Signature of
Applicant"/"Affiant" line (harmless width-wise, page-bounded, nothing
prints to its right) but its mere presence runs against the
signature-lines-stay-bare convention established throughout the whole
NB/NL corpus. Repair scripts may only delete a field when it's a confirmed
redundant duplicate (dedupe_nl_fields.py's narrow exception); this isn't a
duplicate of anything, so it's left untouched and flagged rather than
forced.

### New finding: NLEPO_012 p1 -- oversized field ran off the page edge, and
a second field intruded into the line above it
Full first-time review of NLEPO_012 (never touched by either session-2
script). "I hereby withdraw my application to ___," field's right edge
(661.03pt) exceeded the page's own width (595pt) -- fixed to the true
blank end (507.8, before the comma). The very next field ("which was filed
on ___.") had its top edge (y=326.44) sitting 3.96pt *above* the bottom of
the line above it (330.4) with a horizontal range coincident with "my
application to" -- confirmed visually as a stray line struck through that
phrase. Row spacing on this page (11.2pt between the two printed lines) is
tighter than the standard 19.95pt field height, so no y-offset following
the usual "-1 to -3pt above own caption" convention could avoid intruding
upward; fixed by setting y flush with the line above's own bottom edge
(330.4, zero overlap) rather than relative to its own caption. Also
tightened its width (was overshooting its own blank by 58pt). Script:
fix_nlepo_012_withdrawal_fields.py, 2 fields, x/y/width only, zero
verify_nl findings before/after, idempotent, re-rendered clean (no more
stray line, both fields on-page).
NLEPO_012: DONE, FIX.

### Full page-by-page pass, remaining forms
- NLEPO_001 (1 page, never touched by session-2 scripts): FIX. Bottom
  summary table (APPLICANT:/RESPONDENT:/DOB:/DOB:/POLICE FILE #/COURT
  LOCATION:) had a drawn 6-cell grid with printed labels and genuinely zero
  fields anywhere in that y-range -- unlike NBKB_18A's precedent (filled by
  a THIRD PARTY after the document leaves the app), this table sits
  directly below the already-fielded TO:/FROM: fax-sender blocks on the
  same page, filled by the same app user, using data (applicant/respondent
  name + DOB) the app already captures elsewhere in this same form family.
  Added 6 TextFields (add_nlepo_001_summary_table.py) sized from the
  table's drawn cell borders (get_drawings()) and each caption's own text
  extent, using the same inline label-then-field offset already used
  elsewhere on this exact page (DATE:/TIME:, Name:/Address:). 5718->5724
  fields (this ran before the jurat-dates fix). Zero findings, idempotent,
  re-rendered clean.
- NLEPO_002 (2 pages): FIX (jurat-dates, above), p2 (Appendix A conditions)
  OK, all checkboxes/fields correctly placed.
- NLEPO_003 (4 pages): FIX (Month/Year fields, Respondent D.O.B., jurat
  widths -- all above). DONE.
- NLEPO_004 (2 pages): FIX (jurat-dates + "at" blank overlapping "in the
  Province" by 90pt, above). p2 (Appendix A) OK.
- NLEPO_005 (1 page, 6 checkboxes reseated by session 2, never rendered):
  OK. Rendered and reviewed fresh -- all fields/checkboxes correctly
  placed, no further issues.
- NLEPO_006 (1 page): FIX (jurat-dates, above). Signature-line field
  observation documented above, left unfixed.
- NLEPO_007 (2 pages): FIX (jurat-dates on p2, above; p2's 30-duplicate
  dedup from session 2 re-confirmed clean). p1 (Application) OK, re-opened
  per the prior handoff's flag -- clean.
- NLEPO_008 (1 page): FIX (jurat-dates + the unique single-field
  "(day)(month)(year)" blank, above). "Publishing it in ___ on Day/Month/
  Year" clause's session-2 dedup re-confirmed clean (exactly 4 distinct
  fields, no stacking).
- NLEPO_009 (1 page): FIX (jurat-dates, above -- this form's variant wraps
  "this ___ day" mid-blank across two text runs, same defect either way).
- NLEPO_010 (1 page): FIX (jurat-dates, above). Session-2 dedup (~26
  duplicate narrative lines) re-confirmed clean.
- NLEPO_011 (1 page): FIX (jurat-dates, both occurrences, above). DATE:/
  TIME:/PLACE: table correctly left unfielded -- this info (the review
  hearing's actual date/time/place) is set by the court/clerk after
  scheduling, not known to the app user drafting the Notice of Hearing;
  same rationale as NBKB_18A.
- NLEPO_012 (1 page): FIX (above). DONE.

## NLEPO (12 forms, 19 pages) -- COMPLETE. Every page reviewed with fresh
renders this session. Repair scripts (all --check/apply, all verified
zero-findings + idempotent + re-rendered clean): fix_nlepo_003_datefields.py,
add_nlepo_003_respondent_dob.py, add_nlepo_001_summary_table.py,
fix_nlepo_jurat_dates.py, fix_nlepo_signing_date_fields.py,
fix_nlepo_012_withdrawal_fields.py (plus session 2's seat_nl_checkboxes.py
and dedupe_nl_fields.py, both re-confirmed by this session's fresh renders
on every page they touched: NLEPO_002, 003, 004, 005, 006, 007, 008, 009,
010, 011 checkboxes/dedups all visually clean). One item left
intentionally unfixed with evidence: pre-existing TextFields on the
Applicant/Affiant signature line in NLEPO_006/007/008/010 (harmless,
flagged, not a confirmed duplicate so not eligible for deletion under the
project's rules). No other unresolved items in NLEPO.

verify_nl.py end-of-session: 96 templates, 413 pages, 5725 fields, 106
binds, zero findings (5715 session-2 baseline + 10 net field additions:
+2 NLEPO_003 dates, +1 NLEPO_003 Respondent DOB, +6 NLEPO_001 summary
table, +1 NLEPO_003 p4 year field; jurat-width fixes were geometry-only).
verify_nb.py end-of-session: unchanged, 48 templates, 242 pages, 4047
fields, 79 binds, zero findings. `npm run forms:validate-export` (from
auth-server/) passes.

### NLPC spot-check (NOT a substitute for NLPC's own full pass)
Per the handoff, cleared the two specific carryover items:
- NLPC_AF002 p2: rendered and read (previously unread). SWORN TO block is
  almost entirely unfielded (bare "at ___", "day of ___, 20__," lines) --
  plausibly a witness/notary-completed jurat rather than app-user-entered;
  not investigated further, this is NLPC-phase work. "Print adult's name"
  is fielded. p1 re-confirmed: the session-2 duplicate-Court-File-Number
  dedup renders clean (exactly one field now).
- NLPC_SUPPORTING_AFFIDAVIT (7 pages, 7 checkboxes reseated by session 2,
  never rendered): rendered all 7 pages, read pp1-3 and p7 closely, skimmed
  pp4-6. No severe structural defects found (nothing off-page, no
  caption-strikethrough artifacts) -- same established narrow-inline-field
  sample-text-overflow pattern seen throughout NB/NL, not a new class.
  Reseated checkboxes render correctly seated. This is a spot-check only,
  NOT the full page-by-page treatment (narrow inline date fields on pp1-2
  were not individually geometry-checked the way NLEPO's were) -- do that
  properly when NLPC's turn comes, don't treat this as done.

Both forms belong to NLPC (34 forms, 61 pages), still NOT STARTED as a
batch -- only these two carryover items were cleared. NLPC's real
page-by-page pass, watching for all the defect classes found this session
(oversized fields running off the page or into the next caption/line, both
now added to what to check for on every remaining form) starts next.

## Session 3 CORRECTION (same day, before handoff): width-scale bug in the
above NLEPO fixes -- found, fixed, re-verified, re-pushed

While drafting the next handoff, re-checked FORM_FIXING_GUIDE.md's
coordinate-system section and found it explicitly states width/height are
stored in the JSON scaled by 1.5x relative to true PDF points
(`width_in_pdf = field["width"] / 1.5`; render_review.py computes the
on-page rect as `x + width / SCALE`, SCALE = 1.5). Every width this session
set from a pixel/character-level measurement (a TRUE PDF-point value) was
stored directly as the JSON width, omitting the required *1.5 -- so every
one of those fields rendered at 2/3 of the intended width. Worse, reading
*existing* fields' widths during diagnosis made the same omission, so most
of this session's "field overlaps the next caption by Npt" findings were
false positives caused by the math error, not real defects -- e.g.
NLEPO_004's original "at" field (before this session touched it) already
had its true right edge at 298.98pt against a true blank end of 299.0pt:
already correct, no 90pt overlap ever existed. The width-narrowing this
bug introduced was silent in renders because a too-narrow field can't
create the overlap this session was watching for, and the same long
generic sample text overflows a narrow OR correctly-sized invisible box
about the same way, so the visual check didn't catch it either.

Two things from this session's fixes remained genuinely valid regardless
of the width bug (kept as-is): NLEPO_012 field 1750567230006's Y move
(clearing a real intrusion into the printed line above it -- pure
y-coordinate comparison, unaffected by width scale) and the *existence* of
every genuinely-missing field this session added (NLEPO_001's 6-field
table, NLEPO_003's Month/Year/Respondent-D.O.B./p4-year fields) -- those
blanks were still genuinely unfielded before this session; only their
stored widths needed the correction.

Fix: `fix_session3_width_scale_bug.py` -- multiplies every width this
session set by 1.5 (43 fields across NLEPO_001/002/003/004/006/007/008/
009/010/011/012). x/y untouched. verify_nl.py zero findings before/after
(5725 fields unchanged, geometry-only), idempotent confirmed, re-rendered
and re-inspected NLEPO_001, 003 p2, 004, 012 -- all now correctly fill
their printed blanks (previously-narrow boxes now span the full line with
appropriate small gaps before the next caption, matching the target
measurements this session actually derived from evidence -- the
*measurements* were right all along, only the storage was wrong).

Already-pushed branch `nl-nb-form-push-20260901` was corrected with this
fix and re-pushed (force-with-lease after amending, or a follow-up commit
-- see git log). **Lesson for future sessions**: when computing a NEW
width from any pixel scan, get_text() bbox, or get_drawings() geometry,
always multiply by 1.5 (SCALE) before storing it in the JSON -- the true
PDF-point measurement is never the value that belongs in the width field.
Re-verify this by spot-checking one already-correct existing field's
width against its own printed blank (divide by 1.5, compare) before
trusting any new geometry math on a form you haven't touched before.

## User feedback, same session: fields floating below their printed line
A user-provided screenshot (an NB "Name of solicitor:" dot-leader field,
underscore-run pattern) showed the TextField's visible box sitting
noticeably *below* the printed rule -- the printed line crosses near the
TOP of the box instead of the box's text baseline sitting on/just above
the line, so entered text would appear to float under the line rather
than resting on it the way handwriting on a line normally reads. This is
a distinct usability defect from the overlap/duplicate/narrow classes
already tracked -- add it as **issue class 9: field vertically
mis-seated relative to its printed line** (the box's own baseline, not
just its horizontal extent, should coincide with the printed rule -- check
this alongside class 2's checkbox-seating logic, same principle applied to
text-line blanks). Not yet root-caused or fixed anywhere in this repo;
flagging here so the next NB or NL session watches for it explicitly on
every dot-leader/underscore-run field and fixes it via the same
--check/apply, geometry-only convention (adjust y so the field's bottom
sits at/near the printed rule's y, not straddling or hanging below it).


## Session 4 (2026-09-01): NLPC batch COMPLETE

Baseline confirmed exact on pickup: verify_nb 48/242/4047/79 zero findings;
verify_nl 96/413/5725/106 zero findings. Working tree clean on branch
nl-nb-form-push-20260901.

### Count correction to the handoff
The handoff described NLPC as "34 forms, 61 pages". It is **22 forms, 43
pages, 900 fields**. 12 NLEPO + 22 NLPC + 62 NLSC = 96, which is exactly the
template count both the verifier and the catalogue report, so the totals were
never wrong -- only the NLPC line of the handoff was. NLSC's 62/352 is correct.

### New instrument: pixel-based rule detection
`audit_anchors.py` finds blanks typed as underscore runs; `audit_drawn_rules.py`
finds blanks emitted as vector geometry. NLPC_AF003 p2 prints a jurat
("at ______, NL / on ______, 2____,") that **neither** can see: `get_text`
returns only the words with a whitespace gap between them, and
`get_drawings()` returns three rectangles, none of them these rules. They exist
only as ink in the content stream. Confirmed by a 600dpi pixel-darkness row
scan: rules at y=326.18 (x 85.44-225.12) and y=338.30 (x 87.84-183.00 and
196.68-222.00).

Built `auth-server/tools/review/audit_pixel_rules.py` -- renders each page
greyscale, finds horizontal dark runs, drops those that underline text (same
INKED=0.34 test as the drawn-rule audit), those longer than a writing rule,
those thicker than a rule, those forming a ruled table cell, and those a field
already covers. 6.5s for all 43 NLPC pages. It reproduced every hit the
underscore audit found *and* the invisible AF003 rules. **Use all three
detectors on NLSC and on any future province** -- a text-side audit alone
would have shipped AF003's jurat unfielded.

### Systemic check: caption overlap (issue class 1) -- NO fixes needed in NL
NB needed two general fixes for fields whose top oversat the caption above
(trim_nb_textarea_tops.py, shift_nb_textfields_off_captions.py); NL never had
that treatment, so it was measured properly. Three passes were needed to get a
trustworthy number:
- field top inside any printed line's bbox: 2766 hits -- meaningless, 1744 are
  CheckBoxes whose top legitimately sits inside the text line carrying their
  printed square.
- excluding checkboxes and comparing against line bboxes: still dominated by
  each field's OWN line (a line's bbox spans the full width including the part
  under the field, so text sitting to the LEFT of a field counts as overlap).
- the correct test, and the one the NB session had already learned: **word-level
  boxes measured against the printed BASELINE**, not the line bbox (a bbox
  bottom includes descender space below the visible ink), excluding words on
  the field's own line.
Result: across the whole NL corpus (NLEPO + NLPC + NLSC), the deepest intrusion
into printed letter bodies is **3.88pt**, and only **7 fields** exceed 2pt --
all on NLPC FORM4/5/7/8A/8B page 1. Each was measured individually and each is
**geometrically unavoidable**: the field is correctly seated on its own printed
rule (verified against drawn rules for 8B, underscore runs for the others), and
the printed line pitch on those rows is 9.2-11.5pt while the one approved
control is 13.3pt tall. A box seated on its rule MUST rise into the line above.
Moving any of them down would unseat it from its own rule -- issue class 9, the
defect the user actually reported. Left unchanged, documented. This also
retro-validates NLEPO and NB, whose equivalents sit at 0.04-0.36pt.

### FIX: cross-type stacked duplicates (issue class 8)
`dedupe_nl_fields.py` clusters only *same-type* fields -- it explicitly skips
any pair whose `type` differs. A corpus-wide scan for cross-type pairs
overlapping >60% of the smaller box found exactly four, all NLPC_AF002 p1:
TextAreas ...013/...017/...018/...019 sitting on the same blanks as TextFields
...004/...008/...009/...010, with **identical width to the hundredth of a point
and identical bottom edge** (same printed rule). The TextArea is 4.2pt taller,
so it draws on top and hides the TextField -- in the render the pair showed as
an empty green box (the TextArea's long sample does not fit, and it covers the
TextField that does).
The TextField was kept on the page's own evidence: these are single ruled
blanks with captions underneath, the page's convention for them is a TextField
at the standard 19.95 height, and the clinching case is "1. My name is"
(...007) -- same 582.12 width as "3. I know that" (...009), same kind of blank
-- which has a TextField and no TextArea twin. The twins are the anomaly.
Script: `dedupe_nl_crosstype.py` (refuses any pair whose widths or bottom edges
differ, or where the TextArea carries a bind the TextField lacks).
5725 -> 5721. Zero findings before/after, idempotent, re-rendered clean.

### FIX: 25 missing fields on printed blanks (issue class 7)
`add_nlpc_missing_blanks.py`. Every hit from all three detectors was read on a
rendered page; signature, witness, commissioner and Court-Clerk rules were left
bare throughout per the corpus convention.
- **Jurat place-and-date blanks, 4 forms (14 fields).** NLPC fields these
  consistently -- FORM3 p1, SCHEDULE_D p1, SUPPORTING_AFFIDAVIT p7 and AF004 p2
  all carry them, as does every NLEPO and NLSC jurat -- but AF002 p2, AF003 p2,
  AF005 p1 and FORM7 p1 shipped with the whole block bare. They are the
  outliers, so the omission is theirs.
- **FORM3 p1** (1): the Address block prints three rules; only two were fielded,
  while the Telephone(s) column beside it prints only two.
- **SCHEDULE_D p2** (1): "(name and address of corporation)" prints two answer
  rules; only the second was fielded.
- **SCHEDULE_D p4** (1): the Transportation "Car payment" amount cell is a fully
  drawn, empty ruled cell (x 301.50-386.82, y 450.24-468.12) with no field,
  while the identical cells for "Insurance" and "Licenses" below it each have
  one. The government's page omits only the "$" glyph on that row, not the cell.
  Confirmed at 6x zoom before adding.
- **SCHEDULE_D p6** (8): the third entry row of the Part E special-expenses
  table (y 505.92-547.50, all four columns) had no field at all, while the row
  above -- same height to a fifth of a point, same four columns -- carries
  eight. Item 2(a) tells the filer to use "the boxes below", so a printed row
  with no box is a row they cannot use. Added by mirroring the populated row,
  translated down by the measured 42.54pt row pitch.
Geometry is measured fresh from the PDF each run (per-document median seating
offset taken from that form's own existing fields: AF002 1.14, AF003 0.82,
AF005 1.14, FORM7 1.73, FORM3 2.41, SCHEDULE_D 2.15), so the script is
idempotent. **Widths are stored as measured PDF points x 1.5** -- the session-3
lesson, applied deliberately here.
5721 -> 5746. Zero findings before/after, idempotent (second --check adds 0),
every changed page re-rendered and re-inspected.

### FIX: one field far too narrow for its blank (issue class 4)
A scan of every NLPC field sitting on an underscore run, comparing right edges,
found exactly one outlier: NLPC_AF002 p2 id ...020 ("Print adult's name") ended
59.4pt before its rule (field 306.55-456.55, rule 306.00-515.98); every other
NLPC field reaches within 18pt of its rule's end. `fix_nlpc_af002_name_width.py`
widens it to the rule (width only; x, y, height untouched). Idempotent by
construction -- once the right edge is within 2pt of the rule there is nothing
to do.

### Deliberately left unchanged, with evidence
- **SCHEDULE_D p7**, "legal duty to support a child ... give details": four
  printed answer rules (baselines 498.06, 507.24, 516.48, 525.66), fields on the
  first and third only. Not corrected: the rules are on a 9.2pt pitch against a
  13.3pt control, so fielding every rule would stack four boxes each overlapping
  its neighbours by ~4pt -- the stacked-box defect this audit removes elsewhere.
  The filer can already answer in the two boxes that exist, so the gain would be
  space, not access. (Contrast the jurat/service-date additions above, on
  equally tight pitches, where NO field existed at all.)
- **AF006 p1** (Adoption Order) and the "Court Clerk" rules on AF001, FORM3 and
  FORM4: judge/registry-completed blanks, left bare per the NBKB_18A and
  NLEPO_011 precedent. Noted: NLPC is internally inconsistent here -- FORM1,
  FORM6, FORM7 and FORM8A/8B DO field their Court Clerk / Judge-Clerk lines.
  Not resolved either way; changing it needs a decision, not a measurement.
- **FORM6 p1** three wide CheckBoxes on underscore runs: the documented
  INK_EXEMPT case (verify_nl lists ("NLPC_FORM6",1)); the Provincial Court marks
  those options with a line, not a square.
- The 7 unavoidable caption intrusions described above.

### NLPC page-by-page ledger (22 forms, 43 pages) -- all reviewed with fresh renders
- AF001 p1: OK (Court Clerk rule correctly bare).
- AF002 p1: FIX (4 cross-type duplicates dropped). p2: FIX (4 jurat fields
  added, "Print adult's name" widened).
- AF003 p1: OK. p2: FIX (3 jurat fields added, rules found only by pixel scan).
- AF004 p1, p2: OK (jurat already fielded; signature rules bare).
- AF005 p1: FIX (4 date fields added).
- AF006 p1: OK/LEFT (judge-completed blanks, see above).
- FINANCIAL_INFORMATION_SHEET p1: OK -- a pure instruction page with no blanks;
  zero fields is correct, not a gap.
- FORM1 p1: OK. FORM2 p1: OK.
- FORM3 p1: FIX (Address third rule).
- FORM4 p1: OK. FORM5 p1: OK. FORM6 p1: OK.
- FORM7 p1: FIX (3 service-date fields).
- FORM8A p1, p2: OK. FORM8B p1-p4: OK.
- RECALCULATION_CLAUSE p1: OK. p2: OK -- substantive printed notice text, not a
  reclaimable blank page.
- SCHEDULE_A p1, SCHEDULE_B p1, SCHEDULE_C p1: OK. (SCHEDULE_C's 28
  "empty ruled cells" are cross-column blanks in shared table rows whose label
  lives in another column -- checked and ruled out.)
- SCHEDULE_D p1: OK. p2: FIX. p3: OK. p4: FIX. p5: OK. p6: FIX. p7: OK/LEFT.
  p8: OK.
- SUPPORTING_AFFIDAVIT p1-p7: OK (jurat on p7 already fielded).

## NLPC (22 forms, 43 pages) -- COMPLETE. Repair scripts, all --check/apply, all
verified zero-findings + idempotent + re-rendered: dedupe_nl_crosstype.py,
add_nlpc_missing_blanks.py, fix_nlpc_af002_name_width.py.
verify_nl end of NLPC batch: 96 templates, 413 pages, 5746 fields, 106 binds,
zero findings (5725 - 4 cross-type duplicates + 25 additions).
verify_nb: unchanged, 48/242/4047/79, zero findings.
`npm run forms:validate-export` passes.

## Session 5 (2026-09-01): NLSC batch

Baseline confirmed exact on pickup: verify_nl 96/413/5861/106 zero findings;
verify_nb 48/242/4047/79 zero findings. The seven modified NLSC JSONs and the
two untracked scripts from session 4 (`fix_nlsc_seating.py`,
`drop_nlsc_f4_04a_stray.py`) were present, applied and idempotent, and are
committed with this session's work.

### FIX: the carried-over open item -- two Settlement Brief fields covering caption
`field_nlsc_settlement_brief.py` placed "Relationship of the parties" and
"Place of marriage" with its FILLS rule (start just after the label word, run to
a right-hand limit). That rule suits the inline "Month:/Day:/Year:" and "$"
blanks it was written for, but both of these rows are two-column ruled table
rows whose answer belongs in the right-hand cell. The relationship field started
at 192.43, one point after the word "parties", and ran straight over the printed
parenthetical "(eg. married)" (193.49-235.64), hiding it -- `audit_fields.py`
reported it as `p2 f44 COVERS-TEXT ' (egeg. mamarried)d) '`. The marriage-place
field started at 154.37, inside the label column, crossing the cell's own left
rule at 264.41.
Corrected to the CELLS convention the same script already uses for the
"Applicant's/Respondent's Full Name" rows on that page (inset 1.0pt from the
side rules, bottom 0.78pt above the cell's bottom rule). Cross-checked against
the sibling AcroForm NLSC_F4_03A p6, which prints this identical relationship
table and whose government widgets sit at x=265.85 w=284.40 and x=265.63
w=182.49; the cell-derived values land at x=265.89 w=283.55 and x=265.89
w=184.77 -- within 0.26pt and 2.3pt of the government's own boxes.
`fix_nlsc_settlement_brief_cells.py` re-seats the two shipped fields; the two
FILLS entries were moved to CELLS in the main script so a fresh run places them
correctly too. Zero findings before/after, idempotent, re-rendered: "(eg.
married)" is visible again and both fields sit inside their value cells.
`audit_fields.py` over all 62 NLSC forms now reports **0**.

### New instrument: compare every form against the government's own AcroForm
The decisive fact for this province, which the earlier sessions did not use:
**sixty of the 62 NLSC forms are built from the Supreme Court's own AcroForm
widgets, and the staged originals are still on disk** as
`form-template-export/_incoming_nl/<DOCID>_source.pdf`. (The shipped background
is that same PDF flattened, so it has no widget layer of its own -- which is why
this was easy to miss.) That makes the government's widget list ground truth: a
blank the government fields is one the app should field, and a blank it leaves
bare is a deliberate omission, not a gap.

This distinction is **not one the eye can make from a render**, and getting it
wrong in either direction is expensive. Worked example from this session:
NLSC_F25_03A p4's Part B "Divorce:" row prints a colon and every sibling row in
the same table carries a description box, so it reads as an obvious omission --
but the government's widget list has only a checkbox ("DivorceB") on that row
and no text field. Adding one would have been inventing. It was only the source
comparison that settled it.

`auth-server/tools/nl-forms/audit_nlsc_vs_source.py` reports both directions
(DROPPED = a source widget with no field near it; EXTRA = a shipped field with
no source widget). Matching is positional, not by name, because the build
reseats every widget and does not carry names into the JSON.

Result over all 62 forms: **10 DROPPED, 136 EXTRA**. All 136 EXTRA are the two
flat forms (Settlement Brief 131, Undertaking 5), which have no source widgets
by definition -- so **zero invented fields anywhere in the 60 widget forms**.

### Two more systematic instruments, both derived from the same source widgets
- **Horizontal geometry (issue class 4, and class 1 horizontally).** Every
  shipped text field's left and right edge compared against its matched source
  widget: **0 fields deviate by more than 6pt**, corpus-wide. Class 4 is clear
  for NLSC; there is no "too narrow for its blank" case to find.
- **Vertical seating (issue class 9).** Same comparison on the box bottom:
  n=2601, median 0.00, and 2547 of 2601 within +/-2pt of the government's own
  widget bottom. The handful of outliers were each adjudicated:
  * NLSC_F35_03A p2 (-12.61) and the two "Email Address" fields on F4_04A p4 /
    F5_06A p4 (-4.0/-4.3) are session 4's own deliberate, evidence-backed
    re-seats (moving a field onto its printed rule, and off a printed note it
    was overprinting). The government widget was the mis-seated one there.
  * The eight +5 to +7.6 cases (F17_03A p4, F28_02A p4, F27_02A p4, F31_02A p5,
    F5_06A p3, F6_02A p5, F34_02A p11/p12, ORDER_SUPPORT_TEMPLATE p9) were
    measured against their printed rules: every one sits **0.74-0.82pt above its
    rule**, i.e. correctly seated. The government's widget was simply taller
    (15-19pt against the 13.3pt standard) and the build's re-seat improved on
    it. Not defects.
  Class 9 is clear for the 60 widget forms.
- **Checkbox seating (issue class 2)** is already gated: `verify_nl.py` fails any
  checkbox covering no printed ink, NLSC has no `INK_EXEMPT` entries (only
  NLPC_FORM4/FORM6), and it reports zero findings.

### FIX: six government widgets the build dropped
`restore_nlsc_dropped_widgets.py`. Of the 10 DROPPED, six are real losses:
- **NLSC_F10_04A p2 (4).** The entire signing jurat -- "SWORN TO or AFFIRMED at
  ___, this ___ day of ___, 20___" -- rendered with four bare underscore runs
  and no boxes, while every other NLSC form carrying this block fields it. The
  government has four widgets sitting exactly on those four runs (their rects
  match the four UNCOVERED runs `audit_anchors.py` reports on that page to
  within 0.2pt).
- **NLSC_F23_01A p3 (2).** The same block in its "DATED at" spelling, shipped
  half-fielded: the day and year survived the build, the place and month did
  not. The two survivors give the repair its own check -- the restored fields
  sit on the same printed rule, so they must come out at the same y=658.20, and
  they do.
Geometry is not chosen: each field goes through the exact transform the build
applied to its siblings, using the build's own shared module
(`tools/acroform_seat.py`): x = widget.x0, width = widget.width * SCALE,
height = STD_LINE * SCALE = 19.95, y = widget.y1 - STD_LINE, then re-seated by
`page_geom.seat_rule`. These particular blanks are typed underscore runs rather
than drawn rules, so `seat_rule` finds nothing; where the row already carries
surviving fields the script adopts their y, because they sit on the one
underscore baseline the row prints and are better evidence than the government
rectangle -- which is not always self-consistent (F23_01A's "DATED at" widget
bottom is 0.58pt above its three row-mates' even though all four blanks share a
single baseline).
5861 -> 5867. Zero findings before/after, idempotent (second run adds 0), both
pages re-rendered and re-inspected: the jurats now match their correct sibling
forms (F23_02A p5, F23_05A p5) exactly.

### Deliberately NOT restored, with evidence (the other 4 DROPPED)
- `NLSC_F4_03A p9 "Check this box to dec_2"`, rect y 796.0-802.3 on a 792pt
  page: the widget lies **entirely below the sheet**.
  `acroform_seat.drop_offpage_fields` removed it correctly; restoring it would
  put an unreachable control off the printed page.
- `NLSC_F4_03A p19 "the Lawyer for22"`, `NLSC_F4_04A p17 "the Lawyer for22"`,
  `NLSC_F4_04A p18 "the Lawyer for222"`: each sits on the printed "Signature of
  Applicant" / "Signature of Co-Applicant" rule. Signature rules are left bare
  throughout the whole NB/NL corpus, so these stay bare. (Note this is the same
  judgement as the NLEPO_006/007/008/010 item, inverted: there, pre-existing
  signature fields were left in place rather than deleted; here, absent ones are
  left absent. Both times: do not churn signature lines.)

### FOR COURT USE ONLY triage (carried over from the session-4 handoff, confirmed)
Of 326 uncovered underscore runs, 256 are the "Filed at ___, Newfoundland and
Labrador, this ___ day of ___, 20___" box plus its Registry Clerk rule, repeated
on every form's first page, and ~25 more are the HEARING DATE / Location /
Address / Date / Time panels. Every one of these panels is headed **FOR COURT
USE ONLY**, so they are correctly bare (same rationale as NLEPO_011: the court
fills them after filing/scheduling). Spot-confirmed by reading the panels on
F16_03A p2, F17_03A p3, F18_03A p3/p4, F19_02A p3, F23_01A p3, F26_03A p2.
The remaining non-panel runs were each opened; the only two real gaps in the set
were F10_04A p2 and F23_01A p3, both fixed above.

## NLSC (62 forms, 352 pages) -- IN PROGRESS -- page-by-page ledger below.
