#!/bin/sh
# Convert the Word-only Ontario forms staged in _incoming_on/ to PDF, so
# build_on_forms.py can pick them up.
#
# Run from this directory:  sh convert_docx.sh
#
# Routes, best first:
#   1. LibreOffice — silent, batch, and its Writer layout matches Word closely.
#   2. Pages — scriptable, but it re-flows a complex Word table often enough that
#      the result must be eyeballed against the government page before it ships.
#
# Microsoft Word is deliberately not used. Word 16.76 still *compiles*
# `save as … file format format PDF`, but the running app rejects it
# ("active document doesn't understand the save as message", -1708), so the
# route looks fine until it fails. Word's own File > Save As > PDF menu item
# works and gives the best fidelity of the three — see the README.
set -eu

HERE=$(cd "$(dirname "$0")" && pwd)
STAGE="$HERE/../../form-template-export/_incoming_on"
SOFFICE="/Applications/LibreOffice.app/Contents/MacOS/soffice"

if [ -x "$SOFFICE" ]; then
  ENGINE=libreoffice
elif [ -d "/Applications/Pages.app" ]; then
  ENGINE=pages
  echo "LibreOffice not installed — falling back to Pages."
  echo "Check each PDF against the form on ontariocourtforms.on.ca before it ships:"
  echo "Pages can re-flow a Word table."
  echo
else
  echo "Neither LibreOffice nor Pages is installed."
  echo "Export each .docx in $STAGE by hand: open it in Word, then"
  echo "File > Save As > File Format: PDF, saving as <docId>_source.pdf in that folder."
  exit 1
fi

converted=0
skipped=0
for docx in "$STAGE"/*_source.docx; do
  [ -e "$docx" ] || { echo "no .docx files staged in $STAGE"; exit 0; }
  base=$(basename "$docx" .docx)
  # Word drops a "~$name.docx" owner-lock file beside any document it has open.
  # It is not a document — feeding it to a converter just fails.
  case "$base" in '~$'*) continue ;; esac
  pdf="$STAGE/$base.pdf"
  if [ -f "$pdf" ]; then
    skipped=$((skipped + 1))
    continue
  fi

  if [ "$ENGINE" = libreoffice ]; then
    "$SOFFICE" --headless --convert-to pdf --outdir "$STAGE" "$docx" >/dev/null
  else
    # The first run raises the macOS automation prompt for Pages; approve it.
    osascript - "$docx" "$pdf" <<'APPLESCRIPT'
on run argv
  tell application "Pages"
    set theDoc to open (POSIX file (item 1 of argv))
    export theDoc to (POSIX file (item 2 of argv)) as PDF
    close theDoc saving no
  end tell
end run
APPLESCRIPT
  fi

  [ -f "$pdf" ] || { echo "FAILED: $base — export it by hand from Word"; exit 1; }
  converted=$((converted + 1))
  echo "converted $base"
done

echo
echo "$converted converted, $skipped already present ($ENGINE)."
echo "Now run:  python3 build_on_forms.py"
