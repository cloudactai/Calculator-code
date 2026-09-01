"""Seat Form 70BB's income-chart fields on the printed line, not beside it.

`repair_pei_background.py`'s `reflow_70bb_income_chart()` rebuilt the printed
table (commit "Rebuild PEI 70BB income chart") but wrote the two "20__" year
fields well to the right of where "20__" actually prints -- past the end of
the row's own text, in blank paper the row doesn't use. It also stamped
"rule": "bottom" and "compact": true onto all six income fields (the two
amount fields, the two year fields, the two employer fields), which are the
only six fields in the whole document carrying those keys. Four of those six
already sit on printed ink (the employer lines, the "__" underscores) --
adding the app's own rule there draws a second line on top of the first.

    python3 fix_70bb_income_fields.py --check
    python3 fix_70bb_income_fields.py
"""
import argparse
import json
import os

HERE = os.path.dirname(os.path.abspath(__file__))
EXPORT = os.path.abspath(os.path.join(HERE, "..", "..", "form-template-export"))
MAPPING_PATH = os.path.join(EXPORT, "PEISC_70BB.json")

# The "20__" underscores print at x=392.93..403.93 (page.get_text rawdict,
# page index 1) on both the Moving Party and Responding Party rows.
YEAR_FIELD_GEOMETRY = {
    1750127377139: {"x": 391.0, "width": 14.0},
    1750127377140: {"x": 391.0, "width": 14.0},
}

# Amount fields already sit in the blank between "$" and "per year..."; the
# employer fields already sit on the printed employer rule. All six just need
# their app-drawn rule removed so it stops doubling the printed line.
DROP_RULE_IDS = {
    1750127377063, 1750127377066,   # amount fields
    1750127377139, 1750127377140,   # year fields
    1750127377141, 1750127377142,   # employer fields
}


def repair(apply_changes):
    with open(MAPPING_PATH) as handle:
        mapping = json.load(handle)

    changes = []
    for field in mapping["staticFields"]:
        fid = field.get("id")
        if fid in YEAR_FIELD_GEOMETRY:
            new_geo = YEAR_FIELD_GEOMETRY[fid]
            if field.get("x") != new_geo["x"] or field.get("width") != new_geo["width"]:
                changes.append("field %s: x %s->%s, width %s->%s" % (
                    fid, field.get("x"), new_geo["x"], field.get("width"), new_geo["width"]))
                if apply_changes:
                    field["x"] = new_geo["x"]
                    field["width"] = new_geo["width"]
        if fid in DROP_RULE_IDS and ("rule" in field or "compact" in field):
            changes.append("field %s: drop rule/compact" % fid)
            if apply_changes:
                field.pop("rule", None)
                field.pop("compact", None)

    if not changes:
        print("nothing to change")
        return

    for change in changes:
        print(("would change: " if not apply_changes else "changed: ") + change)

    if apply_changes:
        with open(MAPPING_PATH, "w") as handle:
            json.dump(mapping, handle, indent=2)
            handle.write("\n")


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--check", action="store_true")
    args = parser.parse_args()
    repair(apply_changes=not args.check)


if __name__ == "__main__":
    main()
