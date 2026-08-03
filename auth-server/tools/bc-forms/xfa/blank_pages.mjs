/* Which rendered pages are the government's BLANK printed court form.
 *
 * The wizard forms carry the same document several times over: a data-entry
 * section, a filled "printed_page" variant, an "instructional_sheet" variant and
 * a blank one. Only the blank variant is the form a lawyer files, and XFA names
 * the subform, so the split is read off the template rather than guessed.
 *
 * Usage: node blank_pages.mjs <source.pdf>   -> JSON {blank:[1-based pages], groups:{}}
 */
import fs from "fs";

const PDFJS = "/Users/lorelaiphinnemore/Documents/CloudAct/Frontend /Calculator-code/cloudact-ui/node_modules/react-pdf/node_modules/pdfjs-dist/build/pdf.mjs";

// Seen so far: blank_printed_page (F3, F4, F1.1), BlankPage2/blankPage2 (F38),
// blank_page (F51). The words are not adjacent in every name, so both are
// required rather than matched as one token.
const BLANK = /(?=.*blank)(?=.*page)/i;
const OTHER_VARIANT = /instructional|printed_page|generated|data_entry|saveform|returnto/i;

const pdfjs = await import(PDFJS);
const doc = await pdfjs.getDocument({
  data: new Uint8Array(fs.readFileSync(process.argv[2])), enableXfa: true,
}).promise;
const xfa = await doc.allXfaHtml;

const groups = {};
const blank = [];
xfa.children.forEach((page, index) => {
  const names = [];
  const walk = (node) => {
    const name = node.attributes?.xfaName;
    if (name) names.push(name);
    (node.children || []).forEach(walk);
  };
  walk(page);
  const hit = names.find((n) => BLANK.test(n));
  const variant = hit || names.find((n) => OTHER_VARIANT.test(n)) || "wizard";
  groups[index + 1] = variant;
  if (hit) blank.push(index + 1);
});

console.log(JSON.stringify({ pages: doc.numPages, blank, groups }));
