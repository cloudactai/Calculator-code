const fs = require("fs");
const path = require("path");

const source = path.join(__dirname, "..", "node_modules", "react-pdf", "node_modules", "pdfjs-dist", "build", "pdf.worker.min.mjs");
const destination = path.join(__dirname, "..", "public", "pdf.worker.min.mjs");

if (!fs.existsSync(source)) {
  throw new Error(`PDF.js worker was not found at ${source}`);
}

fs.copyFileSync(source, destination);
