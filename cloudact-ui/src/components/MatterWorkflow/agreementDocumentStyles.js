/**
 * CSS for the live Separation Agreement preview AND its PDF export — one
 * string, used both places, so the exported PDF is the same HTML/CSS the
 * lawyer already reviewed on screen (report_pdf.py's xhtml2pdf pattern).
 *
 * Self-contained on purpose: this same string ends up in two very different
 * surroundings. Live, it renders inside the app, whose global src/index.css
 * resets margin/padding/font-family on literally every element ("*, *::after,
 * *::before { margin:0; padding:0; font-family: "Nunito", sans-serif
 * !important; }"). Exported, AgreementChatPanel.jsx serializes only this
 * <style> block plus the rendered markup into a standalone HTML document for
 * Flask's /agreement-pdf — none of the app's global CSS travels with it, so
 * xhtml2pdf falls back to its own default heading/paragraph margins. Without
 * its own zeroing reset here, those defaults would stack on top of this
 * file's explicit margins in the PDF while the live preview (reset by the
 * app's CSS first) looked fine — which is exactly the "huge gaps between
 * every heading" bug this file's first version had. Every text property is
 * also !important so a plain rule here can't lose to the app's own
 * !important resets when this same CSS renders inside the live app.
 *
 * Deliberately conservative CSS otherwise: no flexbox/grid and no custom
 * properties. xhtml2pdf renders a CSS2.1-ish subset, so anything fancier
 * would look right in the browser and wrong in the exported PDF. Block
 * layout only, no tables.
 */
export const AGREEMENT_DOCUMENT_CSS = `
.agreement-doc, .agreement-doc * {
  margin: 0 !important;
  padding: 0 !important;
  font-family: 'Times New Roman', Times, serif !important;
}
.agreement-doc {
  font-size: 14px !important;
  line-height: 1.6 !important;
  color: #000 !important;
  background: #fff !important;
  max-width: 800px;
  margin: 0 auto !important;
  padding: 32px 40px 60px !important;
}
.agreement-doc h1.ad-title {
  text-align: center;
  font-size: 22px !important;
  font-weight: bold !important;
  margin: 0 0 24px !important;
}
.agreement-doc h2.ad-heading {
  font-size: 16px !important;
  font-weight: bold !important;
  margin: 28px 0 12px !important;
}
.agreement-doc h3.ad-subheading {
  font-size: 14px !important;
  font-weight: bold !important;
  margin: 16px 0 8px !important;
}
.agreement-doc p.ad-p {
  margin: 0 0 12px !important;
  text-align: left;
}
.agreement-doc p.ad-party {
  margin: 2px 0 !important;
  text-align: center;
}
.agreement-doc .ad-between {
  text-align: center;
  font-weight: bold !important;
  margin: 16px 0 6px !important;
}
.agreement-doc .ad-party-block {
  margin: 6px 0 16px !important;
}
.agreement-doc .ad-placeholder {
  color: #b45309 !important;
  font-style: italic;
}
.agreement-doc .ad-schedule-label {
  font-weight: bold !important;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}
.agreement-doc .ad-empty-note {
  color: #b45309 !important;
  font-style: italic;
  margin: 0 0 12px !important;
}
.agreement-doc .ad-sig-block {
  margin-top: 20px !important;
}
.agreement-doc .ad-sig-line {
  margin: 3px 0 !important;
}
`;

/** Substitute-or-flag helper: renders a filled value, or a visibly-marked
 * (orange, italic) placeholder when a chat-answerable value has not been
 * collected yet. Never silently prints a blank — an unfilled clause should
 * look unfilled, and every to-be-completed spot in the document uses this
 * one styling so a lawyer scanning the draft can spot all of them at once. */
export function fillOrPlaceholder(value, placeholderText = "[to be completed]") {
  return value === undefined || value === null || value === ""
    ? { text: placeholderText, isPlaceholder: true }
    : { text: String(value), isPlaceholder: false };
}
