/**
 * CSS for the live Separation Agreement preview AND its PDF export — one
 * string, used both places, so the exported PDF is the same HTML/CSS the
 * lawyer already reviewed on screen (report_pdf.py's xhtml2pdf pattern).
 *
 * Every text property below is !important. That's not defensive styling
 * for its own sake — cloudact-ui's global src/index.css resets font-family
 * on literally every element ("*, *::after, *::before { font-family:
 * "Nunito", sans-serif !important; }") and zeroes every <p>'s margin-bottom
 * the same way ("p { margin-bottom: 0 !important; }"). A plain rule here
 * loses to those regardless of selector specificity, so this document has
 * to out-rank !important with !important, not just a more specific selector.
 *
 * Deliberately conservative CSS otherwise: no flexbox/grid and no custom
 * properties. xhtml2pdf (used server-side for the PDF export) renders a
 * CSS2.1-ish subset, so anything fancier would look right in the browser and
 * wrong in the exported PDF. Block layout only, no tables.
 */
export const AGREEMENT_DOCUMENT_CSS = `
.agreement-doc, .agreement-doc * {
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
