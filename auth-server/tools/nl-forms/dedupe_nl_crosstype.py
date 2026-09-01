"""Remove redundant TextArea duplicates stacked on a single-line TextField blank.

    python3 dedupe_nl_crosstype.py [--only DOCID] [--check]

Finding (session 4, NLPC page-by-page pass). `dedupe_nl_fields.py` deliberately
clusters only *same-type* fields -- it skips any pair whose `type` differs. That
left a second, narrower duplicate class untouched: a `TextArea` sitting on the
exact same printed blank as a `TextField`.

A corpus-wide scan of every NL and NB template for cross-type pairs overlapping
by more than 60% of the smaller box found exactly four, all on NLPC_AF002 p1:

    TextField 1750630925004  x  TextArea 1750630925013   ("AND AN APPLICATION BY")
    TextField 1750630925008  x  TextArea 1750630925017   ("2. My address is")
    TextField 1750630925009  x  TextArea 1750630925018   ("3. I know that")
    TextField 1750630925010  x  TextArea 1750630925019   ("whose address is")

Each pair is the same blank beyond argument: **identical width to the
hundredth of a point** and an **identical bottom edge** (both boxes rest on the
same printed rule). They differ only in box height -- the TextArea is 4.2pt
taller and so is drawn on top in the viewer, hiding the TextField underneath
(in the QA render the pair shows as an empty green box: the TextArea's long
sample value does not fit, and it covers the TextField that does).

The TextField is kept and the TextArea dropped, on the page's own evidence:

* Every blank here is a single printed rule with its caption underneath
  ("Name of Applicant", "Adult's mailing address"), not a narrative area.
* The page's own convention for exactly this kind of blank is a TextField at
  the standard single-line height (19.95 = STD_LINE * SCALE). The clinching
  case is "1. My name is" (id ...007) -- same 582.12 width as "3. I know that"
  (id ...009), same kind of one-line blank -- which has a TextField and *no*
  TextArea twin. The twins are the anomaly, not the TextFields.
* The TextFields carry the lower id in every pair, i.e. they were generated
  first and the TextAreas appended afterwards.

Like `dedupe_nl_fields.py` this deletes whole redundant field entries rather
than editing geometry, so it sits outside the guide's normal x/y/width/height
convention and is conservative by construction. A pair is only ever dropped
when ALL of these hold:

* one is a TextField at the standard single-line height, the other a TextArea;
* their widths match within 0.01pt and their bottom edges match within 0.01pt
  (same blank, same extent -- not merely "close");
* they overlap by more than 60% of the smaller box;
* the TextArea carries no `bind` that the surviving TextField lacks (a cluster
  that would silently lose a bind is printed and skipped, never guessed at).

Anything failing any test is reported and left alone. Survivors are never
edited -- this script only ever removes array entries. Idempotent: a second run
finds no qualifying pair, because the dropped side no longer exists.
"""
import argparse
import glob
import json
import os

HERE = os.path.dirname(os.path.abspath(__file__))
EXPORT = os.path.join(os.path.dirname(os.path.dirname(HERE)), "form-template-export")

SCALE = 1.5
STD_HEIGHT = 19.95          # STD_LINE (13.3) * SCALE -- the one-line control
HEIGHT_TOL = 0.01
EDGE_TOL = 0.01
OVERLAP_THRESHOLD = 0.6


def area(f):
    return (f["width"] / SCALE) * (f["height"] / SCALE)


def bottom(f):
    return f["y"] + f["height"] / SCALE


def overlap_ratio(a, b):
    ax1, ay1 = a["x"] + a["width"] / SCALE, bottom(a)
    bx1, by1 = b["x"] + b["width"] / SCALE, bottom(b)
    ox = max(0.0, min(ax1, bx1) - max(a["x"], b["x"]))
    oy = max(0.0, min(ay1, by1) - max(a["y"], b["y"]))
    smaller = min(area(a), area(b))
    return (ox * oy) / smaller if smaller > 0 else 0.0


def qualifies(a, b, doc_id, page):
    """Return (textfield, textarea) if this pair is a confirmed duplicate."""
    types = {a["type"], b["type"]}
    if types != {"TextField", "TextArea"}:
        return None
    tf, ta = (a, b) if a["type"] == "TextField" else (b, a)

    if overlap_ratio(tf, ta) <= OVERLAP_THRESHOLD:
        return None

    if abs(tf["height"] - STD_HEIGHT) > HEIGHT_TOL:
        print(f"  SKIP {doc_id} p{page}: TextField {tf['id']} height "
              f"{tf['height']} is not the standard single-line {STD_HEIGHT} "
              f"-- refusing to assume which box owns the blank")
        return None
    if abs(tf["width"] - ta["width"]) > EDGE_TOL:
        print(f"  SKIP {doc_id} p{page}: ids {tf['id']}/{ta['id']} overlap but "
              f"widths differ ({tf['width']} vs {ta['width']}) -- not the same extent")
        return None
    if abs(bottom(tf) - bottom(ta)) > EDGE_TOL:
        print(f"  SKIP {doc_id} p{page}: ids {tf['id']}/{ta['id']} overlap but "
              f"bottom edges differ ({bottom(tf):.2f} vs {bottom(ta):.2f}) "
              f"-- not seated on the same rule")
        return None
    if ta.get("bind") and ta.get("bind") != tf.get("bind"):
        print(f"  SKIP {doc_id} p{page}: TextArea {ta['id']} carries bind "
              f"{ta['bind']!r} the TextField does not -- refusing to lose a bind")
        return None
    return tf, ta


def process(doc_id, json_path, check):
    with open(json_path) as fh:
        data = json.load(fh)
    fields = data["staticFields"]
    before_keys = {f["id"]: dict(f) for f in fields}

    by_page = {}
    for f in fields:
        by_page.setdefault(f["page"], []).append(f)

    drop_ids = set()
    for page, page_fields in sorted(by_page.items()):
        for i in range(len(page_fields)):
            for j in range(i + 1, len(page_fields)):
                hit = qualifies(page_fields[i], page_fields[j], doc_id, page)
                if not hit:
                    continue
                tf, ta = hit
                print(f"  {doc_id} p{page}: keep TextField id={tf['id']} "
                      f"(x={tf['x']:.1f} y={tf['y']:.1f} w={tf['width'] / SCALE:.1f} "
                      f"h={tf['height'] / SCALE:.1f}) drop TextArea id={ta['id']} "
                      f"(y={ta['y']:.1f} h={ta['height'] / SCALE:.1f}, same width, "
                      f"same bottom {bottom(tf):.2f})")
                drop_ids.add(ta["id"])

    if not drop_ids or check:
        return len(drop_ids)

    kept = [f for f in fields if f["id"] not in drop_ids]
    assert len(fields) - len(kept) == len(drop_ids)
    for f in kept:
        assert f == before_keys[f["id"]], f"survivor {f['id']} was modified"
    data["staticFields"] = kept
    with open(json_path, "w") as fh:
        json.dump(data, fh, indent=2)
        fh.write("\n")
    return len(drop_ids)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--only", help="limit to a single docId")
    ap.add_argument("--check", action="store_true", help="dry run, no writes")
    args = ap.parse_args()

    total = 0
    docs = 0
    for path in sorted(glob.glob(os.path.join(EXPORT, "NL*.json"))):
        doc_id = os.path.splitext(os.path.basename(path))[0]
        if args.only and doc_id != args.only:
            continue
        n = process(doc_id, path, args.check)
        if n:
            docs += 1
            total += n

    verb = "would be dropped" if args.check else "dropped"
    print(f"\nTotal: {total} cross-type duplicate field(s) {verb} "
          f"across {docs} template(s).")


if __name__ == "__main__":
    main()
