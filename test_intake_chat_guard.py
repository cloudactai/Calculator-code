import unittest

from intake_chat_guard import (
    INTAKE_SECTION_NAMES,
    is_intake_complete_reply,
    saved_intake_section_names,
    should_nudge_intake_reply,
)


class IntakeChatGuardTests(unittest.TestCase):
    def test_nudges_an_actual_toolless_save_promise(self):
        self.assertTrue(
            should_nudge_intake_reply(
                "Let me now save this section before we continue."
            )
        )

    def test_does_not_nudge_a_normal_next_question(self):
        self.assertFalse(
            should_nudge_intake_reply(
                "Let me ask the next question. Does the client have any debts?"
            )
        )

    def test_does_not_nudge_the_reply_seen_in_the_ui(self):
        self.assertFalse(
            should_nudge_intake_reply(
                "I don't have debts or liabilities information yet, so I'll ask "
                "the next question. Does the client have any debts or liabilities?"
            )
        )

    def test_does_not_nudge_a_completed_save(self):
        self.assertFalse(
            should_nudge_intake_reply(
                "The information has been saved and the intake is complete."
            )
        )

    def test_recognises_supported_completion_wording(self):
        self.assertTrue(is_intake_complete_reply("Intake complete and saved."))
        self.assertTrue(
            is_intake_complete_reply("All information has now been captured and saved.")
        )

    def test_recognises_the_required_information_wording(self):
        self.assertTrue(
            is_intake_complete_reply(
                "Required information saved. I have both names, the marriage and "
                "separation dates, employment status and income for each party."
            )
        )
        self.assertFalse(
            is_intake_complete_reply(
                "The required information has not been saved yet."
            )
        )

    def test_does_not_treat_an_incomplete_reply_as_complete(self):
        self.assertFalse(is_intake_complete_reply("The intake is not complete yet."))

    def test_collects_saved_sections_from_conversation_history(self):
        messages = [
            {
                "role": "assistant",
                "content": [
                    {
                        "type": "tool_use",
                        "name": "save_matter_section",
                        "input": {"section": section, "data": {}},
                    }
                    for section in INTAKE_SECTION_NAMES
                ],
            }
        ]
        self.assertEqual(saved_intake_section_names(messages), set(INTAKE_SECTION_NAMES))


if __name__ == "__main__":
    unittest.main()
