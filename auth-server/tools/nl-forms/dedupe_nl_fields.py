"""Remove redundant duplicate fields stacked on the same printed blank.

    python3 dedupe_nl_fields.py [--only DOCID] [--check]

Finding: a systematic scan for same-type fields whose boxes overlap by more
than 60% of the smaller box's area turned up 190 such pairs across 14 NL
templates (concentrated in NLEPO -- 8 of its 9 non-empty forms -- plus
NLPC_AF002, NLSC_F26_02A, and the two flat NLSC forms). Confirmed by hand on
NLEPO_008 p1: the "Publishing it in ____ on __ __ ____;" line has 2-4
TextFields stacked exactly on the same blank (e.g. four fields all at
x=160.08 for the one "name of newspaper" blank). Not a placement defect --
each blank the page prints does have a field on it -- but several *redundant*
extra fields sit on top of it. In the running app this means a stray,
invisible extra input box a user could tab into and type in without it going
anywhere useful, or (per the NLPC_AF002 case, where two duplicates share the
identical bind `court_info.courtFileNumber`) two boxes racing to display the
same bound value.

This is a *removal* of whole redundant field entries, not a geometry-only
edit of a kept field, so it sits outside the guide's normal x/y/width/height
convention -- flagged here rather than folded in silently. It's conservative
by construction:

* Fields are clustered per page/type by overlap (area of intersection over
  area of the smaller field > 0.6), using union-find so a chain of 3-4
  mutually-overlapping duplicates collapses into one cluster rather than
  several pairwise ones.
* Within a cluster, if any field carries a `bind`, the kept field is chosen
  from among the bound ones (largest area first) and every OTHER bind in the
  cluster must be identical to it -- the script refuses (prints and skips)
  a cluster where dropping a field would silently lose or change a distinct
  bind, rather than guessing which one is "right".
* Otherwise the largest-area field is kept, on the theory (confirmed by
  measuring against the printed rule on the cases above) that the largest
  candidate is the one actually sized to the full blank and the smaller ones
  are truncated leftovers.
* Every kept field's own keys are left completely untouched -- this script
  only ever deletes whole array entries, never edits x/y/width/height/id/
  type/value/fontSize/color/background/border/page/bind on a survivor.

--check prints every cluster and which id(s) would be dropped, without
writing. No flag drops them and rewrites the JSON. Idempotent: a second run
finds no more clusters (every remaining field is its own singleton cluster).
"""
import argparse
import glob
import json
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
EXPORT = os.path.join(os.path.dirname(os.path.dirname(HERE)), "form-template-export")

OVERLAP_THRESHOLD = 0.6


def area(f):
    return (f["width"] / 1.5) * (f["height"] / 1.5)


def overlap_ratio(a, b):
    ax0, ay0 = a["x"], a["y"]
    ax1, ay1 = ax0 + a["width"] / 1.5, ay0 + a["height"] / 1.5
    bx0, by0 = b["x"], b["y"]
    bx1, by1 = bx0 + b["width"] / 1.5, by0 + b["height"] / 1.5
    ox = max(0.0, min(ax1, bx1) - max(ax0, bx0))
    oy = max(0.0, min(ay1, by1) - max(ay0, by0))
    inter = ox * oy
    smaller = min(area(a), area(b))
    return inter / smaller if smaller > 0 else 0.0


def cluster_fields(fields):
    """Union-find clusters of same-type, heavily-overlapping fields."""
    parent = list(range(len(fields)))

    def find(i):
        while parent[i] != i:
            parent[i] = parent[parent[i]]
            i = parent[i]
        return i

    def union(i, j):
        ri, rj = find(i), find(j)
        if ri != rj:
            parent[ri] = rj

    for i in range(len(fields)):
        for j in range(i + 1, len(fields)):
            if fields[i]["type"] != fields[j]["type"]:
                continue
            if overlap_ratio(fields[i], fields[j]) > OVERLAP_THRESHOLD:
                union(i, j)

    groups = {}
    for i in range(len(fields)):
        groups.setdefault(find(i), []).append(fields[i])
    return [g for g in groups.values() if len(g) > 1]


def choose_keeper(cluster, doc_id, page):
    bound = [f for f in cluster if f.get("bind")]
    if bound:
        binds = {f["bind"] for f in bound}
        if len(binds) > 1:
            print(f"  SKIP {doc_id} p{page}: cluster has conflicting binds "
                  f"{binds} on ids {[f['id'] for f in cluster]} -- refusing to guess")
            return None
        bound.sort(key=lambda f: (-area(f), f["id"]))
        return bound[0]
    ordered = sorted(cluster, key=lambda f: (-area(f), f["id"]))
    return ordered[0]


def process(doc_id, json_path, check):
    with open(json_path) as fh:
        data = json.load(fh)
    fields = data["staticFields"]

    by_page = {}
    for f in fields:
        by_page.setdefault(f["page"], []).append(f)

    drop_ids = set()
    for page, page_fields in sorted(by_page.items()):
        for cluster in cluster_fields(page_fields):
            keeper = choose_keeper(cluster, doc_id, page)
            if keeper is None:
                continue
            losers = [f for f in cluster if f["id"] != keeper["id"]]
            print(f"  {doc_id} p{page}: keep id={keeper['id']} "
                  f"({keeper['type']} x={keeper['x']:.1f} y={keeper['y']:.1f} "
                  f"w={keeper['width']/1.5:.1f} h={keeper['height']/1.5:.1f})"
                  f" drop {[l['id'] for l in losers]}")
            drop_ids.update(l["id"] for l in losers)

    if not drop_ids:
        return 0

    if not check:
        before = len(fields)
        data["staticFields"] = [f for f in fields if f["id"] not in drop_ids]
        after = len(data["staticFields"])
        assert before - after == len(drop_ids)
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
    docs_touched = 0
    for path in sorted(glob.glob(os.path.join(EXPORT, "NL*.json"))):
        doc_id = os.path.splitext(os.path.basename(path))[0]
        if args.only and doc_id != args.only:
            continue
        n = process(doc_id, path, args.check)
        if n:
            docs_touched += 1
            total += n

    verb = "would be dropped" if args.check else "dropped"
    print(f"\nTotal: {total} duplicate field(s) {verb} across {docs_touched} template(s).")


if __name__ == "__main__":
    main()
