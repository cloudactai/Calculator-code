# Form fixing guide

Everything another session needs to fix field-placement issues on a court form
template in this repo.

---

## Project layout

```
auth-server/
  form-template-export/
    <DOCID>.pdf          ← background PDF (the printed government page)
    <DOCID>.json         ← mapping JSON (field positions, types, binds)
    _review/<DOCID>/     ← gitignored render output for visual checks
    _incoming_<prov>/    ← gitignored staging area per province
  tools/
    <prov>-forms/        ← province-specific build + repair scripts
    review/              ← cross-province review/render tools
    bc-forms/            ← shared modules live here (acroform_seat, bc_pipeline, page_geom)
```

Province directory names: `sk-forms`, `mb-forms`, `bc-forms`, `on-forms`,
`ns-forms`, `pei-forms`, `nb-forms`, `nl-forms`.

---

## Coordinate system

- **x, y** in the JSON are in raw **PDF points** (origin = top-left of page).
- **width, height** in the JSON are **scaled by 1.5×** from PDF points.
  So `width_in_pdf = field["width"] / 1.5`.
- The scale factor (`SCALE = 1.5`) and standard line height (`STD_LINE = 13.3`)
  come from `auth-server/tools/bc-forms/acroform_seat.py`.
- Field IDs come from `bc_pipeline.new_id(doc_id, index)`.

### Field JSON shape

```json
{
  "id": 1750183289019,
  "type": "TextField",       // or "CheckBox" or "TextArea"
  "x": 171.6,                // PDF points
  "y": 437.8,                // PDF points
  "width": 248.85,           // PDF points × 1.5
  "height": 19.95,           // PDF points × 1.5
  "value": "",
  "fontSize": 9,
  "color": [0, 0, 0],
  "background": "none",
  "border": "none",
  "page": 1,
  "bind": "respondent.fullLegalName"   // optional — only some fields
}
```

---

## How to fix a form

### 1. Understand the blank vocabulary

Each province prints its blanks differently. The builder for that province
already detects most of them, but some forms use a style the builder missed.
Common vocabularies and their detectors (in `ns_anchors.py` / province equiv):

| Blank style | Example | Detector |
| --- | --- | --- |
| Bracket tokens | `[name]`, `[date]` | `token_boxes()` |
| Tick glyphs | `☐`, `□`, `☑` | `tick_boxes()` |
| Underscore runs | `________` | `underscore_boxes()` |
| Period/dot runs | `Home..........` | **not detected by default** — needs a repair script |
| Ellipsis chars | `…………………` | **not detected by default** |
| Ruled table cells | empty grid cells | `cell_boxes()` |
| Filled rectangles | thin grey bars | MB-specific |

### 2. Write a repair script, not a hand-edit

**Always write a Python script** that:
- Opens the PDF with PyMuPDF (`import fitz` / `import pymupdf`)
- Measures the printed page to find where fields should go
- Reads the existing JSON, adds/adjusts fields, writes it back
- Has a `--check` flag for dry-run mode
- Is idempotent (running it twice produces no change on the second run)
- Only modifies geometry keys (`x`, `y`, `width`, `height`) or adds new fields
- Asserts that every other key on existing fields is unchanged

Reference scripts (read these first — ~150-350 lines each):
- `auth-server/tools/review/seat_boxes_on_rules.py`
- `auth-server/tools/review/one_line_boxes.py`
- `auth-server/tools/ns-forms/seat_ns_checkboxes.py`
- `auth-server/tools/ns-forms/add_fd1_dotlines.py`
- `auth-server/tools/ns-forms/shift_fd1_fields.py`

### 3. Use search_for() to measure label positions

When placing a field after a label like `"Last Name:........."`, use
PyMuPDF's `page.search_for("Last Name:")` to get the label's bounding box.
The field should start at `label_rect.x1 + GAP` (where GAP ≈ 2pt).

**Do not estimate positions from character counts** — proportional fonts make
character-width interpolation inaccurate, especially when dots/periods
(narrow characters) follow wide label text.

### 4. Column-aware matching

Many forms have two columns (Applicant / Respondent). When matching a label
to a field, filter by column:

```python
COL_BOUNDARY = 340.0  # typical — adjust per form
field_is_left = field_x < COL_BOUNDARY
label_is_left = label_rect.x0 < COL_BOUNDARY
if field_is_left != label_is_left:
    skip  # wrong column
```

### 5. Verify before and after

```bash
# Run the province verifier before changes
python3 verify_ns.py   # (or verify_sk.py, verify_mb.py, etc.)

# Dry run
python3 your_script.py --check

# Apply
python3 your_script.py

# Verify again — must still pass
python3 verify_ns.py

# Confirm idempotent
python3 your_script.py --check
# → should report "nothing to change"
```

### 6. Visual review

```bash
cd auth-server/tools/review
python3 render_review.py <DOCID> --views combined
# Output: form-template-export/_review/<DOCID>/<DOCID>_p01_combined.png ...
```

Open the `_combined.png` files. Each field (blue outline) should sit exactly
on its printed blank. The render fills every field with "Jordan A. Whitfield"
so you can see if text overflows or clips.

---

## What NOT to do

### Never hand-edit the mapping JSON directly
The script measures the PDF and writes the correct values. Manual edits will
be overwritten on the next repair run, and they bypass the idempotency and
assertion checks that keep the rest of the form intact.

### Never rebuild and re-promote a form that already has binds
The build's `--promote` flag replaces the JSON file entirely and **wipes any
binds** that were added after the initial build. The repair script writes back
only geometry, leaving `bind` keys and everything else intact.

### Never edit a form through Form Mapper if the export owns it
Editing in Form Mapper creates a **version 2** and marks it active. The
importer only writes version 1, and the app picks the highest active version.
After that, any fix in the export JSON is invisible for that form, and the
deploy bootstrap re-imports it pointlessly. **Pick one owner per form: either
the export (fix in tools → commit → deploy) or Form Mapper (fix in the UI).
Do not mix them on the same form.**

### Never skip the dry run
Always run with `--check` first to see what would change. Check that deltas
are small and consistent, that every expected field is listed, and that no
warnings appear.

### Never skip the verifier
Run `verify_<prov>.py` before AND after. The output must be identical to the
baseline — not just error-free, but byte-identical. If it reports new
findings after your change, something is wrong.

### Never skip the visual review
Type checking and verifiers confirm structural correctness. Only the rendered
overlay confirms that fields actually sit on the right spot on the page.
Always generate `render_review.py` output and inspect it.

### Never modify non-geometry keys on existing fields
A repair script must only touch `x`, `y`, `width`, `height` on existing
fields. It must never change `id`, `type`, `value`, `fontSize`, `color`,
`background`, `border`, `page`, or `bind`. Assert this in the script.

### Never use character-count interpolation for x positions
Dot characters (`.`) and ellipsis (`…`) are much narrower than letters.
Dividing span width by character count gives an x position that's too early,
making the field overlap the label. Use `page.search_for()` instead.

---

## Common fix patterns

### Adding fields on dotted lines (`.....` / `…………`)
The default builders don't detect period runs or ellipsis characters as
blanks. Write a script that:
1. Iterates pages, finds lines matching `[.…]{3,}`
2. Uses `search_for()` to find the label's right edge
3. Creates a TextField from `label_end + GAP` to `line_end`
4. Checks for overlap with existing fields before adding

See `add_fd1_dotlines.py` + `shift_fd1_fields.py` for a worked example.

### Shifting fields left or right
When a field overlaps its label or is too far from it:
1. Use `search_for(label_text)` to find the label's exact right edge
2. Set `new_x = label_end + 2.0`
3. Adjust width to keep the right edge unchanged: `new_width = old_right - new_x`
4. Be column-aware (see above)

### Checkbox alignment
When checkboxes overshoot the printed tick glyph:
1. Measure the ink ratio (character cell vs actual ink) for each font
2. Apply the ratio to shrink the checkbox to match the ink
See `seat_ns_checkboxes.py` and `CHECKBOX_ALIGNMENT.md` in `ns-forms/`.

---

## Dependencies

All scripts run from their province's `tools/<prov>-forms/` directory.

```
pip install pymupdf   # PyMuPDF — imported as `fitz` or `pymupdf`
```

Shared modules (imported from `tools/bc-forms/`):
- `acroform_seat.py` — SCALE, STD_LINE, SEAT_GAP constants
- `bc_pipeline.py` — `new_id()` for generating field IDs
- `page_geom.py` — horizontal/vertical rule detection for table cells
