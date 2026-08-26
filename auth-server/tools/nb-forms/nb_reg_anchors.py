"""The dot leader -- New Brunswick's regulation vocabulary for a blank.

Every other batch in this catalogue prints a blank as one of four things: an
underscore run (Saskatchewan), a drawn rule about 0.8 pt tall (Manitoba), a
bracketed instruction (Nova Scotia), or a widget rectangle (Ontario, BC,
Newfoundland). The King's Printer prints it as a **run of spaced dots**:

    Court File Number  . . . . . . . . . . . . . . . . .
    JUDICIAL DISTRICT OF . . . . . . . . . . . . . . . .
    I, . . . . . . . . . . . . . , of the . . . . . . . of . . . . . . . . .

Nothing else on these pages marks a blank: Form 1.01 carries **no underscore, no
drawing and no widget at all** -- 46 dot runs and nothing else. A detector tuned
on any other province finds zero boxes on the entire batch.

## Spaced dots, which is why BC's leader detector does not fit

`bc-forms/build_bc_laws.py` reads the same idea on BC Laws forms, but matches
`\\.{4,}` -- four or more *consecutive* dots. New Brunswick sets a space between
every dot, so that pattern matches nothing here. The run is matched as a dot
followed by optional spaces, repeated, which also has to be long enough not to
catch an ellipsis or the dots in "s.35(3)".

## The dots stay printed

They are not redacted away, for the reason BC's batch 3 recorded: MuPDF's
redaction drops the whole text-showing operation, and on these forms the leader
usually shares its operation with the words around it -- clearing the dots after
"I," would take the "I," with them. The box sits on the printed leader, exactly
as a Saskatchewan box sits on its underscore run.
"""
import re

import fitz

# A dot, then optional space, repeated. Six is the shortest run that is
# deliberately a blank: "s.35(3)" and an ellipsis never reach it, and the
# shortest real blank measured on the batch (the day in a date line) is eight.
LEADER = re.compile(r"(?:\.[  ]?){6,}")

MIN_WIDTH = 20.0


def _lines(page):
    """Each text line with per-character geometry.

    Character boxes rather than an average width, for the reason BC's builder
    records: estimating a run's start from the average clips real text off the
    end of the label beside it.
    """
    for block in page.get_text("rawdict")["blocks"]:
        for line in block.get("lines", []):
            chars, boxes = [], []
            for span in line["spans"]:
                for char in span["chars"]:
                    chars.append(char["c"])
                    boxes.append(fitz.Rect(char["bbox"]))
            if chars:
                yield "".join(chars), boxes


def leader_boxes(page):
    """Every dot-leader blank on the page, as a rect over the printed dots."""
    out = []
    for text, boxes in _lines(page):
        for match in LEADER.finditer(text):
            rect = fitz.Rect(boxes[match.start()])
            for box in boxes[match.start():match.end()]:
                rect |= box
            if rect.width >= MIN_WIDTH:
                out.append(rect)
    return out
