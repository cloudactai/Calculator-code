// Some published forms print a block sideways on the page — Form 32B's warrant
// backer is the usual case: the court name and office address sit on lines that
// read bottom-to-top. A normal text box on those lines would be a wide, flat
// sliver of horizontal text across a vertical rule, so those fields are typed as
// VerticalTextField: drawn along the line, edited in a horizontal pop-up.

export const VERTICAL_TEXT_FIELD_TYPE = 'VerticalTextField';

// Text reading bottom-to-top is the common case on these backers, so it is the
// default. 90 is the other direction (top-to-bottom); anything else falls back.
export const DEFAULT_VERTICAL_ROTATION = 270;

export const isVerticalTextField = (field) => field?.type === VERTICAL_TEXT_FIELD_TYPE;

export const normalizeVerticalRotation = (rotation) => (
  Number(rotation) === 90 ? 90 : DEFAULT_VERTICAL_ROTATION
);

// The pop-up editor and the box on the page are two views of one value, so they
// have to agree on how much text fits. Anything that is not a positive whole
// number means "no limit", and both views then leave maxLength unset.
export const getFieldMaxLength = (field) => {
  const limit = Number(field?.maxLength);
  if (!Number.isFinite(limit) || limit <= 0) return undefined;
  return Math.floor(limit);
};

// Some fields are placed at a convenient spot for editing but need to sit at a
// different position / size when burned into the final PDF.  The field JSON can
// carry optional `pdfX`, `pdfY`, `pdfWidth`, `pdfHeight` overrides.  This
// helper returns the set of coordinates that `savePdf` should use: the PDF
// overrides when present, falling back to the regular values otherwise.
export const getPdfOverrides = (field) => ({
  x:      field.pdfX      != null ? field.pdfX      : field.x,
  y:      field.pdfY      != null ? field.pdfY      : field.y,
  width:  field.pdfWidth  != null ? field.pdfWidth  : field.width,
  height: field.pdfHeight != null ? field.pdfHeight : field.height,
});

// Returns true when at least one PDF-override coordinate is set on the field.
export const hasPdfOverrides = (field) =>
  field.pdfX != null || field.pdfY != null ||
  field.pdfWidth != null || field.pdfHeight != null;

// The box keeps the field's own footprint on the page; the control inside it is
// rotated, so it is laid out with the two axes swapped.
export const getVerticalInputStyle = (field) => {
  const rotation = normalizeVerticalRotation(field?.rotation);
  return {
    position: 'absolute',
    left: '50%',
    top: '50%',
    width: field?.height,
    height: field?.width,
    transform: `translate(-50%, -50%) rotate(${rotation === 90 ? 90 : -90}deg)`,
    transformOrigin: 'center center',
  };
};
