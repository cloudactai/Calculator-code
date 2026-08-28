# PEI: putting a real general heading on the 22 forms that only print `(General heading)`

**Status: plan, nothing implemented.** Measurements below are read off the
shipped backgrounds in `form-template-export/`, not estimated.

## The defect

22 of PEI's 34 shipped forms print the bare instruction line

```
(General heading)
(Court seal)          <- on 6 of them
```

and nothing else. On the published form that instruction means *"paste in the
style of cause from the Rule 4 general heading"* — court file number, court,
section, both parties and their roles. We ship it as printed ink with no fields
under it, so a generated PEI petition comes out headless: no file number, no
court, no party names, and the words "(General heading)" still on the page in
the client's copy.

This is also why `pei_binds.py` records only **4 binds across 2 forms**: the only
PEI forms that print a style of cause are 70I(A) and 70I(B), so those are the
only ones with anything to bind. Fixing the heading fixes the bind coverage as a
side effect — 22 forms × (file number + 2 party names) = **66 new bound fields.**

| | today | after |
| --- | --- | --- |
| PEI forms with a style of cause | 2 | 24 |
| PEI bound fields | 4 | ~70 |
| forms printing `(General heading)` at the client | 22 | 0 |

## The template — transcribed from 70I(A), not invented

PEI already prints the heading we need, twice, in this batch. Form 70I(A) page 1,
measured:

| y0–y1 | x0–x1 | font | content |
| --- | --- | --- | --- |
| 83.5–94.6 | 432.1–449.3 | Times 10 | `No. ` (right block, **no rule, no field** — the gap `pei_binds` documents) |
| 95.1–106.2 | 219.3–392.8 | Times **Bold** 10 | `Supreme Court of Prince Edward Island` (centred) |
| 106.6–117.7 | 271.0–341.2 | Times Bold 10 | `(Family Section)` (centred) |
| 118.2–129.3 | 72.1–112.3 | Times 10 | `Between: ` (left margin) |
| 141.3–152.4 | 203.6–408.6 | Times 10 | underscore rule, 205pt |
| 152.8–163.9 | 459.1–540.1 | Times 10 | `Applicant/Petitioner` (right of the rule, **below** it — PEI's third convention) |
| 164.4–175.5 | 298.9–313.3 | Times 10 | `and` |
| 187.5–198.6 | 203.6–408.6 | Times 10 | underscore rule, 205pt |
| 199.0–210.1 | 493.0–540.1 | Times 10 | `Respondent` |

Total height **127pt**. The fields 70I(A) carries on it are the two party rules,
seated flat, bound `applicant.fullLegalName` / `respondent.fullLegalName`.

### What the template adds to the government's own block

Exactly one thing: **a rule after `No.`**, so the court file number has a printed
anchor and can carry `court_info.courtFileNumber`. Right now PEI prints `No.` over
bare white space, and the batch's golden rule ("a blank with no printed anchor
gets no box") correctly refuses it. Drawing the rule is what makes the bind legal
rather than a special case. It matches the `FILE NO. _____` that 70DD already
prints at 436–504.

### Variant A — standard (16 forms)

```
                                                     No. ______________
                    Supreme Court of Prince Edward Island
                              (Family Section)
Between:
                    ______________________________________
                                                   Applicant/Petitioner
                              and
                    ______________________________________
                                                            Respondent
```

Fields: `No.` rule → `court_info.courtFileNumber`; party rule 1 →
`applicant.fullLegalName`; party rule 2 → `respondent.fullLegalName`.

### Variant B — with court seal (6 forms: 70A, 70B, 70DD, 70R, 70U, 70V, 71E)

Same block; the seal ring is drawn **in the left column beside it**, where PEI
already prints `(Court seal)`, so it costs **zero extra vertical space**:

- circle, centre x = left margin + 36, centre y = block top + 40, **r = 34pt**
- 0.6pt grey (0.55) stroke, no fill
- caption `Court seal` centred inside, Times 7 grey — the ring is a *reserved
  area*, not a forgery of a court seal, and carries **no field** (nothing the
  client types goes in it; the registry stamps it).

### Variant C — second title of proceeding (3 forms: 70B, 70F, 70G)

These print `(General heading, including second title of proceeding, if
required)` and 70B additionally prints `(Add a second title of proceeding, as
follows:) AND BETWEEN`. Variant C appends, after the Respondent line:

```
                              AND BETWEEN:
                    ______________________________________
                                    Petitioner by Counterpetition
                              and
                    ______________________________________
                                   Respondent by Counterpetition
```

**Both extra rules stay unbound.** The party on a counterpetition is not
reliably the matter's applicant or respondent, and this repo does not guess
(the same reason Ontario's payor/recipient panels are left blank). +58pt.

### Geometry rules, per page rather than per constant

Nothing is a hardcoded x. Each page's own margins are read fresh, the way round 3
read each page's rightmost printed ink:

- `left` = leftmost printed x on the page (70A is 108.1, 70I(A) is 72.1 — they differ by 36pt)
- `right` = rightmost printed x on the page
- rule width = `min(205, (right - left) * 0.55)`, rules left-aligned at `left + 95`
- role captions right-aligned to `right`, on the line **under** the rule
- fields seated **flat on the rule** (PEI convention — `SEAT_GAP` 0, per `pass_seat_flat`), `fontSize` 9, height 19.95, `compact` off

## Making room: 110pt where there is one 11pt line

The block is ~110pt tall in its compact rendition (46pt of air between the party
rules cut to 28pt; everything else the government's own leading). Replacing the
placeholder line reclaims 11pt, and on the seal forms another 11pt because the
`(Court seal)` line disappears into the ring. Net insertion: **88pt (seal) /
99pt (no seal)**.

Two sources of room, both free:

1. **The top gap.** Most PEI forms start their title at y≈126–135 while the page
   margin is 72 — **43–66pt of empty paper above the title**, because the Word
   source opens with blank paragraphs. Moving the title band up to the margin is
   a whole-block move that touches nothing else.
2. **The bottom slack**, page-1 lowest ink to the 720 margin: 9–44pt on most.

Measured, with the 110pt block:

| Form | pgs | top gain | bottom slack | room | need | result |
| --- | --- | --- | --- | --- | --- | --- |
| 70A | 8 | 54.7 | 39.2 | 93.9 | 87.8 | fits |
| 70AA | 1 | -1.4 | 150.0 | 148.5 | 98.9 | fits |
| 70DD | 1 | 54.7 | 42.1 | 96.9 | 87.8 | fits |
| 70H | 1 | 66.3 | 41.9 | 108.2 | 98.9 | fits |
| 70N | 1 | 66.3 | 33.0 | 99.3 | 98.9 | fits |
| 70P | 1 | 66.3 | 39.0 | 105.3 | 98.9 | fits |
| 70Q | 1 | 66.3 | 39.0 | 105.3 | 98.9 | fits |
| 70R | 3 | 66.3 | 38.1 | 104.4 | 87.8 | fits |
| 70U | 1 | 0.0 | 423.2 | 423.2 | 87.8 | fits |
| 70V | 1 | 11.5 | 434.7 | 446.3 | 87.8 | fits |
| 70EE | 1 | 54.7 | 43.7 | 98.4 | 98.9 | spill 1 |
| 70O | 1 | 54.7 | 38.9 | 93.6 | 98.9 | spill 5 |
| 70E | 1 | 66.3 | 24.5 | 90.8 | 98.9 | spill 8 |
| 70B | 2 | 66.3 | 9.3 | 75.5 | 87.8 (+58 var C) | spill 12 |
| 70G | 1 | 66.3 | 19.7 | 86.0 | 98.9 (+58 var C) | spill 13 |
| 70CC | 1 | 54.7 | 30.5 | 85.2 | 98.9 | spill 14 |
| 70D | 1 | 54.7 | 30.0 | 84.7 | 98.9 | spill 14 |
| 70F | 1 | 54.7 | 24.5 | 79.2 | 98.9 (+58 var C) | spill 20 |
| 70M | 1 | 43.2 | 21.8 | 64.9 | 98.9 | spill 34 |
| 71E | 1 | 43.2 | 9.2 | 52.4 | 87.8 | spill 35 |
| 70J | 1 | 54.7 | -9.0 | 45.8 | 98.9 | spill 53 |
| 71B | 1 | -20.4 | -51.8 | -72.2 | 98.9 | source path, see below |

**10 of 22 need nothing but a band shift.** With the government's full 127pt
block instead, only 3 do — which is why the compact rendition is the
recommendation and the full-height one is a flag, not a rewrite.

### The mechanism already exists

`tools/review/pei_caption_lines.py` and `repair_pei_background.py::reflow_peisc_70a`
already rebuild a PEI page from bands with `show_pdf_page`: the source page is
re-placed as a form XObject clipped to a y-band, so **vector content is copied,
not re-typeset, and nothing drifts** — which is the whole reason the Word-edit
route was ruled out for this province. A general heading is the same operation
with three bands instead of two:

```
band 1  y in [0, title_top)          -> drawn at y - top_gain      (title moves up)
band 2  the placeholder line          -> dropped
NEW     the heading block             -> drawn into the freed space
band 3  y in [placeholder_end, 792]   -> drawn at y + (delta - top_gain)
```

Every field on page 1 moves by the same per-band constant, so the entire
page-by-page review — 240 re-seated checkboxes, the named fields, the signature
drops — survives as an exact translation. **No re-detection, no re-review.**

### Where it spills (12 forms)

The split is taken at a **block boundary from `page.get_text("blocks")`**, never
inside a paragraph, and the tail moves to a continuation page starting at the
72pt margin. For the three multi-page forms the shift cascades page to page by
the same rule. Page-number footers are excluded from "lowest ink" and re-drawn
per page rather than moved.

### 71B is the exception, again

71B has negative room on both ends and is the one form built from a
source-reflowed DOCX (`reflow_pei_71b_source.py`). Its heading belongs in that
tool, as Word paragraphs, where the page flows normally — not in the PDF pass.
Same copy, same binds, one extra function.

## Tooling

New: `tools/pei-forms/pei_general_heading.py` — one module, both halves.

```python
BLOCK   = "standard" | "seal" | "second_title"      # per-form, in a table like TO_NAMED_FIELDS
draw_block(page, left, right, top, variant) -> (ink drawn, [(rect, bind), ...])
reflow_for_block(doc, mapping, page_no, delta)      # bands, cascade, spill
```

Driven by a new pass in `tools/review/repair_pei_fields.py` (`--pass heading`)
plus a background half in `repair_pei_background.py`, because that is where PEI's
band reflows already live. Both halves:

- **assert idempotence** — a page that already carries the block (probe: the
  string `Supreme Court of Prince Edward Island` present *and* `(General
  heading)` absent) is skipped, so `--check` is clean before and after;
- **assert every untouched field is byte-identical** first, the rule the rest of
  `repair_pei_fields.py` follows, since these templates are promoted.

## Gates, in order

```
python3 tools/review/repair_pei_fields.py --pass heading --check   # idempotent
python3 tools/pei-forms/rebind_pei_forms.py --check                # see below
python3 tools/pei-forms/verify_pei.py
python3 tools/review/review_ledger.py --check --province PE
npm run forms:validate-export
```

**`rebind --check` is the real test, not a formality.** The block is drawn to
read like PEI's own heading, so `pei_binds`' caption reader — role word printed
below-right, `Applicant/Petitioner` matched as one label — must independently
rediscover the same 66 binds we set explicitly. If it doesn't, the block doesn't
look like a PEI heading. `CAPTION_LEFT` needs one addition for the file number:
an anchored `^no\.?$` beside `^court file (no|number)$`, because PEI writes it
`No.` and a loose match would eat every numbered item on the page.

Also required:

- `catalog.json` `pageCount` for the 12 spilling forms (`merge_pei_catalog.py`).
- `verify_pei.py` `KNOWN_BINDS` already contains all three binds — no change.
- A `record_pe_round4.py`, following `record_pe_round3.py`, so the ledger carries
  a row per changed page with what was done and what was measured.
- Re-import: the mapping changes on all 22, which the bootstrap watches — but
  **the background changes too**, so confirm the importer keys on the PDF as well
  as the field map before calling this deployed.

## Known costs, recorded rather than hidden

- **The README's "source and shipped background render pixel-identical on all 64
  pages" stops being true** for 22 pages, exactly as it already stopped being
  true for 71B. The claim has to be amended in the same paragraph, or the next
  reviewer will trust a stale invariant.
- **12 forms gain a page.** A one-page notice becoming two pages is a visible
  change to a document lawyers know by sight. It is the price of a heading that
  fits; the alternative is scaling page-1 text, which this batch has refused
  twice already (`reflow_peisc_70a`: "without scaling text").
- **The counterpetition parties stay empty** on 70B/70F/70G.
- **The seal ring is a reserved area, not a seal.** It prints as an empty grey
  outline captioned `Court seal`, which is what the published form asks for.

## Phasing

1. **70A alone, end to end** — variant B, no spill, 8 pages of cascade risk
   already ruled out by the measurement. Render `combined` and read it.
2. **The three variants proven** — 70A (seal), 70D (standard, spills 14), 70B
   (second title + seal + spill + multi-page). Every mechanism exercised on 3 forms.
3. **The remaining 18**, one run, then the full gate list.
4. **71B**, in the DOCX reflow tool.
5. README + `PREFILL_PLAN.md` bind counts + ledger round 4.

## Open questions

1. **Compact 110pt block or the government's full 127pt?** Compact spills 12
   forms, faithful spills 19. Recommendation: compact.
2. **`Applicant/Petitioner` on every form, or the rule's own word** — Rule 70
   forms say *petitioner*, Rule 71 says *applicant*. 70I(A) prints the compound
   on a Rule 70 form, so the compound is defensible everywhere; per-rule wording
   is more correct and costs one lookup in `pei_sources.json`. Recommendation:
   per-rule wording, compound only where the form is used under both.

---

## Pilot: Form 70A, applied

`pei_general_heading.py --only PEISC_70A`. Title lifted **54.7pt** to the
margin, body dropped **40.4pt**, no continuation page, three bound fields added
(`court_info.courtFileNumber`, `applicant.fullLegalName`,
`respondent.fullLegalName`). Page 1's lowest ink lands at 721.2, inside the
sheet's own bottom margin. Pages 2-8 are untouched.

Gates: `verify_pei` 34 templates / 64 pages / **1146 fields / 7 binds**, zero
findings; `review_ledger --check --province PE` complete;
`forms:validate-export` clean; `repair_pei_fields --check` reports **exactly what
it reported before the change** (that output is not empty — the shipped batch was
already non-idempotent on `blanks`, `cells`, `seat_flat` and `70a_layout` before
this work, which is worth its own look).

Three things the pilot found that the plan above had not:

### A clip is not enough — the hidden ink is still readable

`show_pdf_page(..., clip=...)` places the **whole** source page as a form XObject
and hides the rest behind a BBox. It prints correctly, and it fooled a visual
read. But `get_text` and `get_drawings` still return the hidden ink, so every
detector in `repair_pei_fields` saw the body of page 1 a second time 54.7pt
higher — `pass_blanks` immediately wanted a field on a phantom rule — and the
string `(General heading)` was still extractable from a document whose whole
point is that it no longer says that. Bands are now **redacted, not clipped**
(`band()`), so the page holds exactly what it prints.

**This affects `repair_pei_background.reflow_peisc_70a` too**, which uses the
clip form on pages 2 and 3 of this same document. That is a plausible source of
the pre-existing `--check` noise above, and it is not fixed here.

### Coordinate-keyed repairs have to be told the page moved

`NAMED_FIELDS` holds absolute coordinates measured on the shipped page — 70A's
five growable claim slots among them — so a 40pt shift left them looking 40pt
above where the fields now sit, and `pass_named` wanted to add two of them a
second time. The heading pass now records its shift (`heading_shifts.json`) and
`repair_pei_fields` translates its own tables through it at load. The two passes
therefore compose **in either order**, and a template rebuilt from source with no
heading yet reads its own numbers unchanged.

### The shift is exact, the ink is not quite

The band shift is whole points at two decimals, but the ink rides an XObject
matrix and re-extracted rule extents round differently — up to 0.05pt, enough for
`pass_seat_flat` to see a float. `reseat()` corrects that rounding scale only,
using `pass_seat_flat`'s own `rule_under`, and leaves anything larger alone: the
0.95pt and 0.33pt floats on this form are pre-existing and not this pass's to own.

### Still owed before this goes wide

A `record_pe_round4.py` ledger row per headed page, the README's
"pixel-identical" paragraph, and `PREFILL_PLAN.md`'s bind counts.

---

## Revision: label-then-box, not PEI's own rule-with-caption-below

The first pilot draft above transcribed 70I(A)'s layout as well as its
vocabulary — an underscore rule with the role captioned below and to the
right, "Between:" / "and" joining the two parties. On review that layout read
as an odd, unlabelled line when it was the *only* thing on an otherwise bare
page (70I(A) carries it well because the surrounding financial-statement
questions give it context). **Revised to label-then-box**, the way Ontario's
own general heading works (Form 12's and Form 38's Court File Number field is
a bordered box under/after a caption, not a bare rule):

```
Court File No.:    [__________________________]

        Supreme Court of Prince Edward Island
                 (Family Section)

Applicant/Petitioner:  [__________________________]

Respondent:            [__________________________]
```

Every box starts at the same `BOX_INDENT` (145pt from the page's own left
margin) and is the same width — so `Court File No.:`, `Applicant/Petitioner:`
and `Respondent:` line up on one edge and none of the three boxes is longer
than another, satisfied even on the counterpetition variant
("Respondent by Counterpetition:" is the longest label this block ever
prints, at 127.8pt, and still clears the indent by 17pt). Boxes are bordered
rectangles (0.6pt stroke, Ontario's own weight), not underscore rules. The
seal ring moved into the gap between the file-number row and the centred
court name, sized to clear both the label above and the label below it.

The vocabulary is still 70I(A)'s, not invented: `No.`, the court name,
`(Family Section)`, `Applicant/Petitioner`, `Respondent`. Only the layout
changed.

**One measured, accepted cost.** `pass_seat_flat`'s `rule_under` rasterises
the ink around a box to find the rule it sits on. A box that draws its own
complete border (this block, and Ontario's) has that border's stroke centred
on the field's stored edge, so the ink starts half a stroke width above it —
about 0.29pt, on all three new boxes. This is not a real misalignment (the
box's edge and the field's stored coordinate are identical; the discrepancy is
in how an ink-based detector reads a self-bordered field rather than a field
sitting over a separately-drawn rule) and is the same order of magnitude as
four floats the batch already carried before this work (`repair_pei_fields
--check` was non-idempotent on Form 70A before this pilot began — see the
first revision's note above). Recorded rather than silently chased further;
teaching `pass_seat_flat` to recognize a self-bordered field is a
`repair_pei_fields.py` change, not this tool's.

Re-verified after the revision: `rebind_pei_forms.py --check` finds
**0 binds to add** — the caption reader independently rediscovers all three
binds from the new left-side captions (`CAPTION_LEFT` gained the
applicant/respondent patterns, read from the same two patterns `ROLE_RIGHT`
already matched, from the other side). `verify_pei.py`: 34 templates / 64
pages / 1146 fields / 7 binds, zero findings. Ledger and
`forms:validate-export` unchanged.

---

## Revision 2: two columns, seal filling the left one

The label-then-box revision above still squeezed a small seal ring in beside
the file-number row. Redrawn as two columns: the court name and
`(Family Section)` stay centred across the **whole** block width (unchanged
from every prior draft), and below that the block splits — a seal ring filling
the **left** half, sized to the room it actually has, and the three
label-then-box rows (`Court File No.:`, `Applicant/Petitioner:`,
`Respondent:`) starting on the page's own **midline** in the right half, labels
right-aligned into the line and boxes left-aligned out of it.

**The seal's radius is bounded by the widest label, not by the column's raw
width.** "Applicant/Petitioner:" reaches further left than "Respondent:" or
"Court File No.:" do, so a first pass that sized the ring off `(mid - left) /
2` read past that label's own left edge and printed the ring under its text.
The bound is now `min(label_left_x for every row) - 8`, so the ring's right
edge always clears whichever label happens to be widest.

Re-verified after the revision: `rebind_pei_forms.py --check` still finds
**0 binds to add** (the caption side of each row is unchanged), `verify_pei.py`
still 34/64/1146/7 with zero findings, ledger and `forms:validate-export`
unchanged. `repair_pei_fields.py --check` unchanged from the label-then-box
revision (still the same three ~0.29pt self-bordered-box floats, recorded
above).
