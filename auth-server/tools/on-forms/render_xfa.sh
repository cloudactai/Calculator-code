#!/bin/sh
# Flatten the Ontario forms that are pure XFA (no AcroForm layer at all — opened
# outside Adobe they show only the "requires Adobe Reader 8" notice), using the
# same headless pdf.js + Chrome route the BC Supreme batch uses.
#
# Writes <docId>.pdf (static background) and <docId>.fields.json (the
# government's own field boxes, in PDF points) into _incoming_on/xfa/, where
# build_on_forms.py picks them up.
#
# Run from this directory:  sh render_xfa.sh
set -eu

HERE=$(cd "$(dirname "$0")" && pwd)
XFA="$HERE/../bc-forms/xfa"
STAGE="$HERE/../../form-template-export/_incoming_on"
FORMS="Form20 Form29G"

[ -f "$XFA/pdf.mjs" ] || sh "$XFA/fetch_pdfjs.sh"

mkdir -p "$XFA/srcs" "$STAGE/xfa"
JOBS=""
for form in $FORMS; do
  cp "$STAGE/${form}_source.pdf" "$XFA/srcs/${form}.pdf"
  JOBS="$JOBS ${form}::srcs/${form}.pdf"
done

# render.html loads pdf.js over http, so the staging directory is served locally.
(cd "$XFA" && python3 -m http.server 8899 >/dev/null 2>&1) &
SERVER=$!
trap 'kill $SERVER 2>/dev/null || true' EXIT
sleep 2

(cd "$XFA" && node print_xfa.mjs "$STAGE/xfa" $JOBS)
