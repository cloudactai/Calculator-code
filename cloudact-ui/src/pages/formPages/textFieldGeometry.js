// Field widths and heights are stored at the PDF viewer's default 1.5x scale,
// while x/y coordinates stay in PDF points.
export const PDF_FIELD_SCALE = 1.5;

// Matches the comfortable single-line fields used above the
// "full name and date of birth of person prohibited" captions on the BC forms.
export const MIN_SINGLE_LINE_FIELD_HEIGHT = 17.1;

export const ensureMinimumTextFieldHeight = (field) => {
  if (field?.type !== 'TextField') return field;

  const height = Number(field.height);
  const y = Number(field.y);
  if (!Number.isFinite(height) || !Number.isFinite(y)
      || height >= MIN_SINGLE_LINE_FIELD_HEIGHT) {
    return field;
  }

  const addedHeight = MIN_SINGLE_LINE_FIELD_HEIGHT - height;
  return {
    ...field,
    // Keep the bottom edge on the form's rule as the control grows.
    y: Math.max(0, y - (addedHeight / PDF_FIELD_SCALE)),
    height: MIN_SINGLE_LINE_FIELD_HEIGHT,
  };
};

export const ensureMinimumTextFieldHeights = (fields) => (
  Array.isArray(fields) ? fields.map(ensureMinimumTextFieldHeight) : fields
);
