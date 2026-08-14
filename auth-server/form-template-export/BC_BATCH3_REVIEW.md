# BC batch 3 — child protection (CFCSA) and adoption

_Built 2026-08-14. Companion to `BC_MIGRATION_PLAN.md` and `BC_BATCH2_REVIEW.md`._

Batches 1 and 2 shipped the Supreme Court Family Rules and the Provincial Court
Family Rules sets — 188 templates, every form on the government's two family
indexes. Neither rule book prescribes a child-protection or an adoption form, so
BC's catalogue carried none of either. This batch is those two families:

| Family | Forms | Source | Category |
|---|---|---|---|
| Child protection, Provincial Court (CFCSA) Rules, B.C. Reg. 533/95 | 19 | 17 government fillable PDFs + 2 cut from the consolidation | `Provincial Court – Child Protection` |
| Adoption, Adoption Regulation Sch. 3, B.C. Reg. 291/96 | 6 | all cut from the consolidation | `Supreme Court – Adoption` (4), `Adoption – Director of Adoption` (2) |

**25 templates, 72 pages, 1 339 fields**, catalog rows renumbered so the BC block
runs 101–313. `npm run forms:validate-export` green; no Ontario, Saskatchewan or
Manitoba template touched, and no batch-1 or batch-2 BC template touched beyond
its `sortOrder`.

Rebuild with `python3 fetch_bc3.py && python3 build_bc3.py`, then
`merge_catalog3.py --promote` and `rebind_bc3.py` (in that order — promoting
overwrites the maps the binds live in).

---

## 1. Where the sources came from, and the two that do not exist

The Provincial Court family forms index publishes a "Child, Family and Community
Service Act" block: **17** of the 19 prescribed forms, as ordinary fillable
AcroForm PDFs keyed by PFA code. They take the same path as the batch-1
Provincial forms — strip the widget layer, convert each widget rectangle,
run the shared placement chain. The widget rect is ground truth (§1), so there
is nothing detected on any of them.

**Form 5 (Warrant) and Form 10 (Order) are not published.** They are issued by
the court rather than filled by a party; pfa894, pfa897, pfa903–908, pfa927,
pfa930 and pfa931 were all probed and 404. Their only source is the form as
enacted, which is also the only source for all six adoption forms. Both come out
of the King's Printer consolidation.

The consolidations set their schedules of forms as **continuous copy** — Form 1
ends half way down page 45 and Form 2 starts underneath it — so a page range
ships the neighbouring form as part of this one. `bclaws_cut.py` cuts at the
forms' own enacting headings instead, re-lays the bands onto fresh Letter pages
at 1:1, and drops the running head, the rules around it, the page number and the
"Consolidation current to" line. `fetch_bc3.py` then refuses any cut that carries
a second form's heading.

## 2. Reading blanks off an enacted page

For the eight consolidation forms there are no widgets, so the blanks are read
from what the page prints (§1's last resort). Four anchors carry all of them:

* **a run of dots** — one box per run, deliberately *not* merged across the
  `[caption]` between two runs;
* **a ruled line with clear space above it** — how the two CFCSA forms write a
  blank where the adoption schedule uses dots;
* **an empty cell of a ruled table** — reconstructed from the horizontal and
  vertical rules, since the regulation draws no rectangle per cell;
* **a printed tick** — a Wingdings `❑` on the CFCSA forms, a drawn 6 pt square on
  Form 10, a literal `[ ]` on adoption Form 1. No mark, no checkbox.

**The background ships exactly as the King's Printer set it.** Batch 1's
`build_bc_laws.py` redacts each leader and rules a clean line in its place, which
reads better but cannot be done safely here: the regulation opens a caption
inside the same text-showing operation that carries the sentence, and MuPDF's
redaction drops the whole operation. Redacting `[Court Location]` on CFCSA Form 5
took "the person did not attend this Court at" with it. So the dots stay printed
and the box sits on them, between the captions rather than over them — which is
how the Ontario templates treat a dotted leader anyway (§9.1).

### Five rules that had to be added, each against a page

1. **A box may not reach into the line above its rule.** Form 10 sets "after
   attendance in court at a ____" 10 pt under the option above it, so a flat
   13 pt box drew a line through "a court appearance is not required".
2. **A filled rectangle is ink, not a frame.** Form 5 paints each section
   separator as an 11 pt fill with the visible hairline drawn separately inside
   it; reading its edges as rules gave every separator three stacked boxes.
3. **A table's side rules run past the row they bound.** Without that, the same
   separators read as one-row tables.
4. **A full-width rule must answer a caption** — a line ending in `:` or a
   bracketed label such as `[Name(s)]` within 40 pt above it. Form 5 uses the
   same full-width rule for the writing space under "[Name(s)]" and for the
   underscore that closes its heading block.
5. **A bare "Court File Number" / "Registry File Number" heading gets the band
   underneath it.** Form 5 prints these two bare where Form 10 draws a panel
   around each, and the caption is the only thing on the page that says where the
   answer goes.

### Signature lines (§5)

A signature caption condemns one thing, and which one depends on where the line's
own blank is:

* `"[Signature] .......... [Name (please print)] ........"` and
  `"Signature of applicant: ................."` put the signature line to the
  caption's *right*, so the run after the caption is dropped and the line above
  is left alone. That line is adoption Form 4's "Phone number", which the plain
  caption-underneath rule was deleting.
* `") [Signature of person consenting]"` — the jurat's caption, printed under the
  rule it labels — condemns the box above it. The leading `)` is why
  `bc_pipeline`'s `^signature` anchor never matched it.
* The commissioner's rule above "A commissioner for taking affidavits for British
  Columbia" is dropped the same way.

**Accepted exception, recorded not fixed:** adoption Form 4 p1's `Date:` box
reports as sitting on a signature line, because "Signature of applicant:" is far
enough left on the same line to condemn both it and the signature rule beside it.
The date box is a real field; the signature rule carries none. Recorded in
`verify_bc3.EXCEPTIONS`, per §5's note on F38.

## 3. Gates

`python3 verify_bc3.py` runs `verify_bc2.py`'s whole battery — §7's checklist and
§9's shipped-Ontario defects, as measurements — plus two checks batch 3 needs:
`check_leader_boxes` (a box on a BC Laws form must cover dots and nothing else)
and `check_idempotence` (§7.9, the build re-run into a scratch directory and
diffed byte for byte).

```
25 forms, 72 pages, 1339 fields
checkbox mark alignment: median 0.00pt, 95th 0.00pt, worst 2.00pt (276 marks)
BLOCKING: 0   (1 accepted exception, above)
```

Two blocking faults were found and fixed rather than accepted:

* **`shared-position` on CFCSA Form 11** — two options on one printed mark, so
  one was unclickable. `bp.assign_marks` declines here: it re-reads candidates
  through `mark_candidates`, which merges two squares that *touch*, and Form 11
  stacks its options 10 pt apart with a 10.5 pt square on each. `build_bc3`
  re-reads the marks with overlap-based clustering and deals them out to the
  colliding controls only (§2).
* **Wingdings `` was invisible to every check** — it is Unicode private use,
  not `❑`, so `bc_pipeline.BOX_GLYPHS` did not contain it. Added there, which
  also fixes the exemptions that keep a checkbox overlay from reporting as a box
  over printed text.

### Advisory (324) — read, not fixed

Proportionally higher than batch 2's 282 over 145 forms, and almost all of it is
the government's own geometry, which §1 says is ground truth:

| Kind | n | Reading |
|---|---|---|
| `edge-cuts-caption` | 164 | BC prints each cell's caption ("City", "Phone", "court location") inside the cell's own bottom-left, so the widget rect always clips it by a point or two. Batch 2 shipped 84 of the same. |
| `checkbox-no-mark` | 36 | Inline options in the "APPLYING FOR" lists (Form 2, Form 10.1) where Acrobat drew the square and the printed background has none. The widget rect is still ground truth; the app draws its own control. |
| `page-no-fields` | 25 | The instruction sheets the government bundles into these PDFs ("TO APPLY FOR AN ORDER … Step 1", "IMPORTANT INFORMATION ABOUT YOUR HEARING"). Correctly fieldless. |
| `sliver` | 24 | Narrow table cells on Forms 3.1, 3.2 and 9 — real cells, not stray boxes. |
| `leader-box-on-type` | 24 | A box whose ends graze the `[caption]` beside its dot run. |
| `box-on-text` | 20 | Mostly a cell caption inside its own box; one real one, below. |
| `field-overlap` | 20 | Adjacent rows of BC's name tables, whose widget rects overlap each other by ~27% in the government's file. |
| `rule-no-field` | 9 | Printed rules that close a section rather than ask for anything. |

**One worth a second look before the next pass:** CFCSA Form 3 p3, the box on
"Since the order was made, circumstances have changed significantly as follows:"
starts on the caption line rather than under it (§3). `bp.nudge_off_hint` leaves
it alone because nudging would leave under 14 pt of writing space — the
documented guard, not a miss.

**Form 3.1's service copy is short two widgets.** Pages 3, 7 and 10 carry 43
widgets and page 13 carries 41: the government's own file omits the two
"is/are Indigenous — Yes / No" ticks from the service copy. §1 says never to
estimate a fillable-form box, so the copy ships as published.

## 4. Prefill binds

`rebind_bc3.py` binds **one thing: the court file number** — 30 boxes across 22
of the 25 forms. The CFCSA forms name that widget `cfn`, `rfn` or
`REGISTRY FILE NUMBER`; the consolidation forms have no names, so the caption is
read off the page ("Court File No.:" to the left on the adoption affidavits,
"REGISTRY FILE NUMBER" above the box on CFCSA Forms 5 and 10).

Everything else is left blank on purpose:

* **the registry line**, for the reason `bc_binds` already records for the rest of
  BC — the matter holds the court's *name*, not the registry the case is filed
  in, and a wrong registry on a court document is worse than an empty one;
* **the parties.** A child-protection proceeding runs between a *director* and
  the child's parents or guardians, and the forms ask for the child(ren)
  (`child1`, `namec1`) and the parent(s) (`namep`). Neither is the matter's
  applicant or respondent, and `buildPrefillData` has no child or director root.
  The adoption affidavits are the same shape — the deponent is a consenting
  parent, a child over twelve, or a director, depending on the form.

The three forms with no bind are adoption Forms 1, 4 and 5: the first two are not
court forms at all and the third prints no file number.

## 5. Deployment

`BC_MIGRATION_PLAN.md` §9 still governs: the bootstrap imports only new or
drifted templates, so this deploy should import 25 and leave the other 368 alone.
Watch for the port binding fast and for exactly 25 "imported" lines, then check
`/forms?province=BC&production_ready=true&mapping_ready=true` returns 213.
