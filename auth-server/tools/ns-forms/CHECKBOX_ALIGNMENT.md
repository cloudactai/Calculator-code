# Nova Scotia checkbox alignment

## The problem

Nova Scotia forms print tick glyphs (□ / ☐) to mark where checkboxes go.
The builder (`ns_anchors.py`) uses PyMuPDF's `search_for()` to find each
glyph, but `search_for()` returns the **character cell** — the bounding box
of the whole character, not just the printed square. The character cell is
taller and wider than the ink, so the mapped checkbox overshoots the printed
tick on all sides.

This is the same defect Saskatchewan had with U+F07E glyphs.

## The fix

A standalone repair script (`seat_ns_checkboxes.py`) measures the ratio
between the character cell and the rendered ink for each font, then writes
corrected x, y, width, height back to the mapping JSON. It does not touch
any other key on any field.

### Measured ink ratios

Each font draws its tick square at a consistent position within the
character cell:

| Font           | Glyph | y offset / cell height | ink width / cell width |
| -------------- | ----- | ---------------------- | ---------------------- |
| TimesNewRoman  | □     | 0.391                  | 0.764                  |
| Apple Symbols  | ☐     | 0.314                  | 0.657                  |
| Menlo          | ☐     | 0.365                  | 0.820                  |

These were measured at 40x zoom on NSSC_59_07 by rendering the character
cell area and measuring where the ink starts and how wide it is.

## Steps to align checkboxes

All commands run from `Calculator-code/auth-server/tools/ns-forms/`.

### 1. Verify the baseline

Run the verifier before making changes so you have a clean baseline:

```
python3 verify_ns.py
```

Expected output: `zero findings`.

### 2. Dry run

See what would change without writing anything:

```
python3 seat_ns_checkboxes.py --check --only NSSC_59_07
```

Replace `NSSC_59_07` with whatever docId you need. Drop `--only` to run
across all NS forms.

Each line shows the checkbox's current position, the corrected position,
and the delta. Check that:
- Deltas are small and consistent (typically 1-4 points)
- Every checkbox on the form is listed
- No "has no nearby tick" warnings appear

### 3. Apply

```
python3 seat_ns_checkboxes.py --only NSSC_59_07
```

Or for all forms at once:

```
python3 seat_ns_checkboxes.py
```

The script asserts that every non-geometry key on every field is unchanged.
If anything else was modified it will error out without writing.

### 4. Verify again

```
python3 verify_ns.py
```

Must still report `zero findings`.

### 5. Confirm idempotent

Run the script a second time:

```
python3 seat_ns_checkboxes.py --only NSSC_59_07
```

Expected output: `all checkboxes already seated on their ink`. If it wants
to change anything on the second run, something is wrong.

### 6. Visual review

Generate combined overlay renders to visually confirm:

```
cd ../review
python3 render_review.py NSSC_59_07 --views combined
```

Output goes to `form-template-export/_review/NSSC_59_07/`. Open the
`_combined.png` files. Each checkbox (blue outline) should sit exactly on
top of its printed tick glyph.

### 7. Commit

The only file that changes per form is its mapping JSON
(`form-template-export/NSSC_59_07.json`). The repair script itself is
committed once.

## What NOT to do

- **Don't hand-edit the mapping JSON.** The script measures the PDF and
  writes the correct values. Manual edits will be overwritten on the next
  run.
- **Don't rebuild and re-promote.** The build's `--promote` replaces the
  JSON file and wipes any binds that were added after the build. The repair
  script writes back only geometry, leaving binds and everything else
  intact.
- **Don't edit through Form Mapper.** That creates a version 2 and marks it
  active. The importer only writes version 1, so any fix in the export
  becomes invisible for that form.