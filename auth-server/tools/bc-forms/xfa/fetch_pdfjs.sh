#!/bin/sh
# Fetch the pdf.js build render.html loads. Not committed: it is ~5 MB of vendor
# JavaScript plus the font/cmap data, all reproducible from npm.
#
# Run from this directory:  sh fetch_pdfjs.sh
set -eu

VERSION=4.10.38
DIR=$(cd "$(dirname "$0")" && pwd)
WORK=$(mktemp -d)
trap 'rm -rf "$WORK"' EXIT

curl -sSL --fail "https://registry.npmjs.org/pdfjs-dist/-/pdfjs-dist-${VERSION}.tgz" -o "$WORK/pdfjs.tgz"
tar xzf "$WORK/pdfjs.tgz" -C "$WORK"

cp "$WORK/package/build/pdf.mjs" "$WORK/package/build/pdf.worker.mjs" "$DIR/"
cp "$WORK/package/web/pdf_viewer.css" "$DIR/"
rm -rf "$DIR/standard_fonts" "$DIR/cmaps"
cp -R "$WORK/package/standard_fonts" "$WORK/package/cmaps" "$DIR/"
node "$DIR/patch_pdfjs_signature.mjs" "$DIR/pdf.worker.mjs"

echo "pdfjs-dist ${VERSION} installed into $DIR"
