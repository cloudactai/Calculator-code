/**
 * CSS for the live Separation Agreement preview AND its PDF export — one
 * string, used both places, so the exported PDF is the same HTML/CSS the
 * lawyer already reviewed on screen (report_pdf.py's xhtml2pdf pattern).
 *
 * Deliberately conservative CSS: no flexbox/grid and no custom properties.
 * xhtml2pdf (used server-side for the PDF export) renders a CSS2.1-ish
 * subset, so anything fancier would look right in the browser and wrong in
 * the exported PDF. Block layout and tables only.
 */
export const AGREEMENT_DOCUMENT_CSS = `
.agreement-doc {
  font-family: 'Times New Roman', Georgia, serif;
  font-size: 12px;
  line-height: 1.55;
  color: #1a1a1a;
  background: #fff;
  max-width: 800px;
  margin: 0 auto;
  padding: 32px 40px 60px;
}
.agreement-doc h1.ad-title {
  text-align: center;
  font-size: 18px;
  letter-spacing: 1px;
  margin: 0 0 22px;
}
.agreement-doc h2.ad-heading {
  font-size: 13px;
  letter-spacing: 0.5px;
  text-transform: uppercase;
  margin: 26px 0 10px;
  padding-bottom: 4px;
  border-bottom: 1px solid #999;
}
.agreement-doc h3.ad-subheading {
  font-size: 12px;
  font-weight: bold;
  margin: 16px 0 6px;
}
.agreement-doc p.ad-p {
  margin: 0 0 10px;
  text-align: justify;
}
.agreement-doc p.ad-party {
  margin: 2px 0;
}
.agreement-doc .ad-between {
  text-align: center;
  font-weight: bold;
  margin: 14px 0 4px;
}
.agreement-doc .ad-party-block {
  margin: 6px 0 14px;
}
.agreement-doc table.ad-table {
  width: 100%;
  border-collapse: collapse;
  margin: 6px 0 14px;
}
.agreement-doc table.ad-table th,
.agreement-doc table.ad-table td {
  border: 1px solid #ccc;
  padding: 5px 8px;
  font-size: 11.5px;
  text-align: left;
}
.agreement-doc table.ad-table th {
  background: #f2f2f2;
}
.agreement-doc .ad-placeholder {
  color: #b45309;
  font-style: italic;
}
.agreement-doc .ad-empty-note {
  color: #6b7280;
  font-style: italic;
  margin: 0 0 10px;
}
.agreement-doc .ad-sig-block {
  margin-top: 18px;
}
.agreement-doc .ad-sig-line {
  margin: 3px 0;
}
`;

/** Substitute-or-flag helper: renders a filled value, or a visibly-marked
 * placeholder when a chat-answerable value has not been collected yet. Never
 * silently prints a blank — an unfilled clause should look unfilled. */
export function fillOrPlaceholder(value, placeholderText = "[to be completed]") {
  return value === undefined || value === null || value === ""
    ? { text: placeholderText, isPlaceholder: true }
    : { text: String(value), isPlaceholder: false };
}
