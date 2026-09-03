/**
 * CSS for the live Separation Agreement preview AND its PDF export — one
 * string, used both places, so the exported PDF is the same HTML/CSS the
 * lawyer already reviewed on screen (report_pdf.py's xhtml2pdf pattern).
 *
 * Page size, margins, and font sizes are read directly out of the source
 * docx (python-docx against Agreements tool /Separation Agreement (1).docx),
 * not eyeballed:
 *   - Page: Letter (8.5in x 11in). Margins: top 0.935in, bottom 0.935in,
 *     left 0.753in, right 0.765in (section.page_width/margins).
 *   - Title ("SEPARATION AGREEMENT"): 24pt bold.
 *   - Top-level ALL-CAPS headings (BACKGROUND, TERMS OF AGREEMENT, CHILDREN,
 *     ...) and "BETWEEN:": 18pt bold — same run size in the source.
 *   - Body text and the "A./B./C./D." subheadings: 12pt (subheadings bold).
 *   - "AND" is genuinely 12pt regular in the source, not 18pt bold like
 *     "BETWEEN:" — an inconsistency in the template itself, reproduced
 *     rather than smoothed over (see .ad-and below).
 * Units are pt/in throughout to match Word's own units exactly, rather than
 * an approximate px conversion — both the browser and xhtml2pdf render pt/in
 * unambiguously.
 *
 * Self-contained on purpose: this same string ends up in two very different
 * surroundings. Live, it renders inside the app, whose global src/index.css
 * resets font-family on every element and zeroes every <p>'s margin-bottom,
 * both via !important ("*, *::after, *::before { font-family: "Nunito",
 * sans-serif !important; }", "p { margin-bottom: 0 !important; }"), so a
 * plain rule here would lose regardless of specificity. Exported,
 * AgreementChatPanel.jsx serializes only this <style> block plus the
 * rendered markup into a standalone HTML document for Flask's
 * /agreement-pdf — none of the app's global CSS travels with it, so a
 * matching reset lives here too (the ".agreement-doc, .agreement-doc *"
 * rule below): without it xhtml2pdf's own default block margins would stack
 * on top of this file's explicit ones.
 *
 * One xhtml2pdf quirk this relies on, found by rendering real output through
 * it and inspecting the PDF's actual text positions (pdfplumber), not by
 * eyeballing a preview: .agreement-doc's OWN padding (set after the
 * ".agreement-doc, .agreement-doc *" reset, same as every other override in
 * this file) never actually takes effect in the exported PDF, no matter how
 * it's written — verified by varying its value from 40px to 200px to 2in
 * with zero change in the rendered output. Every other override in this
 * file (headings, paragraphs, the between/party blocks) DOES take effect
 * correctly the same way; only this one specific case doesn't, and no
 * combination tried (selector form, units, specificity, dropping padding
 * from the reset entirely) made it reliable without breaking something
 * else. So the page's real margins are set via @page below instead — a
 * different CSS construct entirely, already proven reliable in this exact
 * xhtml2pdf setup by report_pdf.py's spousal-support report — and
 * .agreement-doc's own padding is kept only for what it actually still
 * does: the on-screen "page" look in the live browser preview, which has
 * none of xhtml2pdf's quirks. The two never double up, because @page only
 * applies to the export and .agreement-doc's padding is inert there.
 *
 * Otherwise deliberately conservative: no flexbox/grid, no custom
 * properties, no box-sizing (xhtml2pdf doesn't support border-box), no
 * tables. xhtml2pdf renders a CSS2.1-ish subset, so anything fancier would
 * look right in the browser and wrong in the exported PDF.
 */
export const AGREEMENT_DOCUMENT_CSS = `
/* xhtml2pdf defaults to A4 without this — the source docx is US Letter.
   The margin here is what actually positions content on the exported page
   (see the file header note on why .agreement-doc's own padding can't be
   relied on for that in the PDF). Has no effect on the live browser
   preview — @page only applies when printing/exporting. */
@page {
  size: letter;
  margin: 0.935in 0.765in 0.935in 0.753in;
}
.agreement-doc, .agreement-doc * {
  margin: 0 !important;
  padding: 0 !important;
  font-family: 'Times New Roman', Times, serif !important;
}
.agreement-doc {
  max-width: 8.5in;
  margin: 0 auto !important;
  padding: 0.935in 0.765in 0.935in 0.753in !important;
  background: #fff !important;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.15);
  font-size: 12pt !important;
  line-height: 1.2 !important;
  color: #000 !important;
}
.agreement-doc h1.ad-title {
  text-align: center;
  font-size: 24pt !important;
  font-weight: bold !important;
  margin: 0 0 16pt !important;
}
.agreement-doc h2.ad-heading {
  font-size: 18pt !important;
  font-weight: bold !important;
  margin: 20pt 0 10pt !important;
}
.agreement-doc h3.ad-subheading {
  font-size: 12pt !important;
  font-weight: bold !important;
  margin: 12pt 0 6pt !important;
}
.agreement-doc p.ad-p {
  margin: 0 0 10pt !important;
  text-align: left;
}
.agreement-doc p.ad-party {
  margin: 2pt 0 !important;
  text-align: center;
}
/* "BETWEEN:" — 18pt bold in the source, same size as the top-level headings. */
.agreement-doc .ad-between {
  text-align: center;
  font-size: 18pt !important;
  font-weight: bold !important;
  margin: 16pt 0 6pt !important;
}
/* "AND" — genuinely 12pt regular in the source, not styled like "BETWEEN:".
   Reproduced as-is rather than made consistent with it. */
.agreement-doc .ad-and {
  text-align: center;
  font-size: 12pt !important;
  font-weight: normal !important;
  margin: 16pt 0 6pt !important;
}
.agreement-doc .ad-party-block {
  margin: 6pt 0 16pt !important;
}
.agreement-doc .ad-placeholder {
  color: #b45309 !important;
  font-style: italic;
}
.agreement-doc .ad-schedule-label {
  font-weight: bold !important;
  text-transform: uppercase;
  letter-spacing: 0.5pt;
}
.agreement-doc .ad-empty-note {
  color: #b45309 !important;
  font-style: italic;
  margin: 0 0 10pt !important;
}
.agreement-doc .ad-sig-block {
  margin-top: 16pt !important;
}
.agreement-doc .ad-sig-line {
  margin: 3pt 0 !important;
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
