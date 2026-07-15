import re


INTAKE_SECTION_NAMES = (
    "Background",
    "Relationship",
    "Children",
    "IncomeAndBenefits",
    "EmploymentDetails",
    "Expenses",
    "Assets",
    "DebtsAndLiabilities",
    "Court",
    "OtherPersonsInHousehold",
)

_INTAKE_DONE_PHRASES = (
    "intake is complete",
    "complete and saved",
    "has been saved",
    "have been saved",
    "all sections",
    "everything is saved",
)

_INTAKE_SAVE_STALL_PATTERNS = (
    # Genuine save stalls the guard was created for: the model promises an
    # action but emits no save_matter_section tool call in that turn.
    r"\b(?:i'll|i will|let me|i'm going to|i am going to)\s+"
    r"(?:(?:go ahead|proceed)(?: now)?(?: and)?\s+|now\s+)?"
    r"(?:save|process|record|capture)\b",
    r"\bone moment\s+(?:while|as)\s+i\s+(?:save|process|record|capture)\b",
)


def should_nudge_intake_reply(reply: str) -> bool:
    """Return True only for a tool-less promise to save, never a real question."""
    low = (reply or "").lower()
    if "?" in low or any(phrase in low for phrase in _INTAKE_DONE_PHRASES):
        return False
    return any(re.search(pattern, low) for pattern in _INTAKE_SAVE_STALL_PATTERNS)


def saved_intake_section_names(messages: list) -> set:
    """Collect section names from tool calls already present in chat history."""
    saved = set()
    for message in messages or []:
        content = message.get("content", []) if isinstance(message, dict) else []
        if not isinstance(content, list):
            continue
        for block in content:
            if not isinstance(block, dict):
                continue
            if block.get("type") != "tool_use" or block.get("name") != "save_matter_section":
                continue
            section = block.get("input", {}).get("section")
            if section in INTAKE_SECTION_NAMES:
                saved.add(section)
    return saved


def is_intake_complete_reply(reply: str) -> bool:
    """Recognise final completion wording without depending on one exact sentence."""
    low = " ".join((reply or "").lower().split())
    if not low or re.search(
        r"\b(?:not|isn't|is not|hasn't|has not)\s+(?:yet\s+)?"
        r"(?:complete|completed|saved|been saved)\b",
        low,
    ):
        return False
    return any(
        re.search(pattern, low)
        for pattern in (
            r"\bintake\b.{0,60}\b(?:complete|completed|saved)\b",
            r"\b(?:complete|completed|saved)\b.{0,40}\bintake\b",
            r"\b(?:everything|all (?:sections|information|details))\b.{0,60}"
            r"\b(?:complete|completed|captured|saved)\b",
        )
    )
