"""
Tests for the Draft Agreements Flask endpoints (/agreement-chat,
/agreement-pdf) added in app.py. Mirrors test_intake_chat_guard.py's
convention (plain unittest, no live network/DB). The Anthropic client is
mocked for /agreement-chat so these run without a real API key or network
access; /agreement-pdf needs no mocking since xhtml2pdf runs locally.
"""
import os
import types
import unittest
from unittest.mock import MagicMock, patch

os.environ.setdefault("ANTHROPIC_API_KEY", "test-key")

import app  # noqa: E402  (env vars must be set before import)


def _tool_use_block(section, data, tool_id="toolu_1"):
    return {"type": "tool_use", "id": tool_id, "name": "set_agreement_section", "input": {"section": section, "data": data}}


def _text_block(text):
    return {"type": "text", "text": text}


def _response(content):
    return types.SimpleNamespace(content=content)


class AgreementPdfEndpointTests(unittest.TestCase):
    def setUp(self):
        app.app.testing = True
        self.client = app.app.test_client()
        # These tests exercise validation/rendering, not auth — JWT_SECRET is
        # cleared so require_auth's "not JWT_SECRET" no-op path applies,
        # matching how the other /agreement-pdf tests below isolate auth
        # behaviour separately.
        self._jwt_secret_patch = patch.object(app, "JWT_SECRET", None)
        self._jwt_secret_patch.start()

    def tearDown(self):
        self._jwt_secret_patch.stop()

    def test_valid_html_returns_a_pdf(self):
        resp = self.client.post(
            "/agreement-pdf",
            json={"html": "<html><body><h1>Test</h1></body></html>"},
        )
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(resp.content_type, "application/pdf")
        self.assertTrue(resp.data.startswith(b"%PDF"))

    def test_missing_html_field_is_rejected(self):
        resp = self.client.post("/agreement-pdf", json={})
        self.assertEqual(resp.status_code, 400)
        self.assertIn("html", resp.get_json()["error"])

    def test_blank_html_is_rejected(self):
        resp = self.client.post("/agreement-pdf", json={"html": "   "})
        self.assertEqual(resp.status_code, 400)

    def test_non_string_html_is_rejected_not_crashed(self):
        resp = self.client.post("/agreement-pdf", json={"html": 12345})
        self.assertEqual(resp.status_code, 400)

    def test_oversized_html_is_rejected(self):
        huge = "<p>" + ("x" * (app.MAX_AGREEMENT_HTML_BYTES + 1)) + "</p>"
        resp = self.client.post("/agreement-pdf", json={"html": huge})
        self.assertEqual(resp.status_code, 400)

    def test_malformed_json_body_is_a_handled_error_not_a_crash(self):
        resp = self.client.post(
            "/agreement-pdf",
            data="{not valid json",
            content_type="application/json",
        )
        # Whatever the exact status, it must be a clean JSON error response,
        # never an unhandled server crash (which would 500 with no JSON body
        # at all under Flask's default error handler).
        self.assertGreaterEqual(resp.status_code, 400)
        self.assertIsNotNone(resp.get_json())

    def test_html_with_unicode_and_special_characters_does_not_crash(self):
        html = "<html><body><p>Party 1 &amp; Party 2 — “separated”, café</p></body></html>"
        resp = self.client.post("/agreement-pdf", json={"html": html})
        self.assertEqual(resp.status_code, 200)
        self.assertTrue(resp.data.startswith(b"%PDF"))


class AgreementPdfAuthTests(unittest.TestCase):
    """require_auth behaviour specifically: /agreement-pdf and /agreement-chat
    are both decorated with it, same as /update-chat."""

    def setUp(self):
        app.app.testing = True
        self.client = app.app.test_client()

    def test_rejects_without_a_token_when_jwt_secret_is_set(self):
        with patch.object(app, "JWT_SECRET", "test-secret"):
            resp = self.client.post("/agreement-pdf", json={"html": "<p>x</p>"})
            self.assertEqual(resp.status_code, 401)

    def test_accepts_a_valid_token_when_jwt_secret_is_set(self):
        import jwt as pyjwt

        with patch.object(app, "JWT_SECRET", "test-secret"):
            token = pyjwt.encode({"userId": "u1"}, "test-secret", algorithm="HS256")
            resp = self.client.post(
                "/agreement-pdf",
                json={"html": "<p>x</p>"},
                headers={"Authorization": f"Bearer {token}"},
            )
            self.assertEqual(resp.status_code, 200)

    def test_rejects_an_expired_token(self):
        import datetime
        import jwt as pyjwt

        with patch.object(app, "JWT_SECRET", "test-secret"):
            token = pyjwt.encode(
                {"userId": "u1", "exp": datetime.datetime.now(datetime.timezone.utc) - datetime.timedelta(hours=1)},
                "test-secret",
                algorithm="HS256",
            )
            resp = self.client.post(
                "/agreement-pdf",
                json={"html": "<p>x</p>"},
                headers={"Authorization": f"Bearer {token}"},
            )
            self.assertEqual(resp.status_code, 401)

    def test_no_token_required_when_jwt_secret_is_unset(self):
        with patch.object(app, "JWT_SECRET", None):
            resp = self.client.post("/agreement-pdf", json={"html": "<p>x</p>"})
            self.assertEqual(resp.status_code, 200)


class AgreementChatEndpointTests(unittest.TestCase):
    def setUp(self):
        app.app.testing = True
        self.client = app.app.test_client()
        self._jwt_secret_patch = patch.object(app, "JWT_SECRET", None)
        self._jwt_secret_patch.start()

    def tearDown(self):
        self._jwt_secret_patch.stop()

    def test_missing_body_is_a_handled_error(self):
        resp = self.client.post("/agreement-chat", data="", content_type="application/json")
        self.assertGreaterEqual(resp.status_code, 400)

    @patch("app.anthropic.Anthropic")
    def test_a_tool_call_turn_is_returned_as_a_saved_section_patch(self, mock_anthropic_cls):
        mock_client = MagicMock()
        mock_anthropic_cls.return_value = mock_client
        mock_client.messages.create.side_effect = [
            _response([_tool_use_block("DecisionMaking", {"responsibility": "joint"})]),
            _response([_text_block("Saved. Anything else?")]),
        ]

        resp = self.client.post(
            "/agreement-chat",
            json={"messages": [{"role": "user", "content": "Decision-making is joint."}]},
        )
        self.assertEqual(resp.status_code, 200)
        body = resp.get_json()
        self.assertEqual(body["reply"], "Saved. Anything else?")
        self.assertEqual(
            body["saved_sections"],
            [{"section": "DecisionMaking", "data": {"responsibility": "joint"}}],
        )
        # Two full round trips to the model: the tool-call turn, then the
        # follow-up turn answering the tool_result.
        self.assertEqual(mock_client.messages.create.call_count, 2)

    @patch("app.anthropic.Anthropic")
    def test_multiple_tool_calls_in_one_turn_are_all_captured(self, mock_anthropic_cls):
        mock_client = MagicMock()
        mock_anthropic_cls.return_value = mock_client
        mock_client.messages.create.side_effect = [
            _response([
                _tool_use_block("ChildSupport", {"paymentDay": "1st"}, tool_id="toolu_1"),
                _tool_use_block("Equalization", {"include": False}, tool_id="toolu_2"),
            ]),
            _response([_text_block("Got both.")]),
        ]

        resp = self.client.post(
            "/agreement-chat",
            json={"messages": [{"role": "user", "content": "..."}]},
        )
        body = resp.get_json()
        self.assertEqual(len(body["saved_sections"]), 2)
        sections = {p["section"] for p in body["saved_sections"]}
        self.assertEqual(sections, {"ChildSupport", "Equalization"})

    @patch("app.anthropic.Anthropic")
    def test_a_stalled_toolless_save_promise_is_nudged_then_recovers(self, mock_anthropic_cls):
        mock_client = MagicMock()
        mock_anthropic_cls.return_value = mock_client
        mock_client.messages.create.side_effect = [
            _response([_text_block("Let me now save this section before we continue.")]),
            _response([_text_block("Saved. What else?")]),
        ]

        resp = self.client.post(
            "/agreement-chat",
            json={"messages": [{"role": "user", "content": "It's joint."}]},
        )
        self.assertEqual(resp.status_code, 200)
        body = resp.get_json()
        self.assertEqual(body["reply"], "Saved. What else?")
        # The nudge consumed one extra turn beyond the model's two replies.
        self.assertEqual(mock_client.messages.create.call_count, 2)

    @patch("app.anthropic.Anthropic")
    def test_a_plain_question_returns_immediately_with_no_saved_sections(self, mock_anthropic_cls):
        mock_client = MagicMock()
        mock_anthropic_cls.return_value = mock_client
        mock_client.messages.create.return_value = _response(
            [_text_block("What would you like to cover first?")]
        )

        resp = self.client.post("/agreement-chat", json={"messages": []})
        body = resp.get_json()
        self.assertEqual(body["saved_sections"], [])
        self.assertEqual(mock_client.messages.create.call_count, 1)

    @patch("app.anthropic.Anthropic")
    def test_a_model_that_never_stops_calling_tools_hits_the_bounded_loop_limit(self, mock_anthropic_cls):
        mock_client = MagicMock()
        mock_anthropic_cls.return_value = mock_client
        # Always returns a tool call, never a final text-only reply — the
        # loop must not run forever.
        mock_client.messages.create.return_value = _response(
            [_tool_use_block("ChildSupport", {"paymentDay": "1st"})]
        )

        resp = self.client.post(
            "/agreement-chat",
            json={"messages": [{"role": "user", "content": "..."}]},
        )
        self.assertEqual(resp.status_code, 500)
        self.assertIn("iteration limit", resp.get_json()["error"])
        # Bounded at 16 iterations per the loop's own range(16).
        self.assertEqual(mock_client.messages.create.call_count, 16)

    @patch("app.anthropic.Anthropic")
    def test_an_unknown_section_name_from_the_model_is_still_returned_as_is(self, mock_anthropic_cls):
        # The Flask endpoint itself never validates section names against
        # AGREEMENT_SECTION_NAMES (the frontend's applyAgreementPatch does
        # that) — this documents that boundary rather than assuming
        # validation happens twice.
        mock_client = MagicMock()
        mock_anthropic_cls.return_value = mock_client
        mock_client.messages.create.side_effect = [
            _response([_tool_use_block("NotARealSection", {"foo": "bar"})]),
            _response([_text_block("Done.")]),
        ]

        resp = self.client.post("/agreement-chat", json={"messages": []})
        body = resp.get_json()
        self.assertEqual(body["saved_sections"][0]["section"], "NotARealSection")


class AgreementSectionToolSchemaTests(unittest.TestCase):
    """The tool schema is what constrains the model's output shape — worth
    pinning down explicitly so a future edit can't silently narrow/widen it
    (e.g. dropping a section from the enum) without a test noticing."""

    def test_section_enum_matches_the_documented_section_names(self):
        enum = app.AGREEMENT_SECTION_TOOL["input_schema"]["properties"]["section"]["enum"]
        self.assertEqual(set(enum), set(app.AGREEMENT_SECTION_NAMES))

    def test_every_ledger_child_and_spousal_fallback_section_is_present(self):
        # These two exist specifically so Marc's in-flight save-after-
        # calculation work is never duplicated into — losing either one
        # silently would mean the chat has nowhere safe to put an answer
        # when no saved calculation is found.
        self.assertIn("ChildSupportFallback", app.AGREEMENT_SECTION_NAMES)
        self.assertIn("SpousalSupportFallback", app.AGREEMENT_SECTION_NAMES)

    def test_tool_requires_both_section_and_data(self):
        self.assertEqual(
            set(app.AGREEMENT_SECTION_TOOL["input_schema"]["required"]),
            {"section", "data"},
        )


if __name__ == "__main__":
    unittest.main()
