import {
  VERTICAL_TEXT_FIELD_TYPE,
  getFieldMaxLength,
  getPdfOverrides,
  getVerticalInputStyle,
  hasPdfOverrides,
  isVerticalTextField,
  normalizeVerticalRotation,
} from './verticalTextField';

describe('isVerticalTextField', () => {
  test('recognises the sideways field type only', () => {
    expect(isVerticalTextField({ type: VERTICAL_TEXT_FIELD_TYPE })).toBe(true);
    expect(isVerticalTextField({ type: 'TextField' })).toBe(false);
    expect(isVerticalTextField(undefined)).toBe(false);
  });
});

describe('normalizeVerticalRotation', () => {
  test('defaults to bottom-to-top and keeps a top-to-bottom request', () => {
    expect(normalizeVerticalRotation(undefined)).toBe(270);
    expect(normalizeVerticalRotation(45)).toBe(270);
    expect(normalizeVerticalRotation(90)).toBe(90);
    expect(normalizeVerticalRotation('90')).toBe(90);
  });
});

describe('getFieldMaxLength', () => {
  test('returns a whole positive limit', () => {
    expect(getFieldMaxLength({ maxLength: 40 })).toBe(40);
    expect(getFieldMaxLength({ maxLength: '40' })).toBe(40);
    expect(getFieldMaxLength({ maxLength: 40.7 })).toBe(40);
  });

  test('treats missing or nonsense limits as no limit', () => {
    expect(getFieldMaxLength({})).toBeUndefined();
    expect(getFieldMaxLength({ maxLength: 0 })).toBeUndefined();
    expect(getFieldMaxLength({ maxLength: -5 })).toBeUndefined();
    expect(getFieldMaxLength({ maxLength: 'many' })).toBeUndefined();
  });
});

describe('getPdfOverrides', () => {
  test('returns regular coordinates when no overrides are set', () => {
    const field = { x: 100, y: 200, width: 50, height: 30 };
    expect(getPdfOverrides(field)).toEqual({ x: 100, y: 200, width: 50, height: 30 });
  });

  test('uses pdf-prefixed values when present', () => {
    const field = { x: 100, y: 200, width: 50, height: 30, pdfY: 50, pdfHeight: 300 };
    expect(getPdfOverrides(field)).toEqual({ x: 100, y: 50, width: 50, height: 300 });
  });

  test('allows overriding all four coordinates', () => {
    const field = { x: 1, y: 2, width: 3, height: 4, pdfX: 10, pdfY: 20, pdfWidth: 30, pdfHeight: 40 };
    expect(getPdfOverrides(field)).toEqual({ x: 10, y: 20, width: 30, height: 40 });
  });
});

describe('hasPdfOverrides', () => {
  test('false when no overrides exist', () => {
    expect(hasPdfOverrides({ x: 1, y: 2 })).toBe(false);
  });

  test('true when any pdf coordinate is set', () => {
    expect(hasPdfOverrides({ pdfHeight: 300 })).toBe(true);
    expect(hasPdfOverrides({ pdfX: 0 })).toBe(true);
  });
});

describe('getVerticalInputStyle', () => {
  test('swaps the axes so the control runs along the line', () => {
    const style = getVerticalInputStyle({ width: 38, height: 120 });
    expect(style.width).toBe(120);
    expect(style.height).toBe(38);
    expect(style.transform).toContain('rotate(-90deg)');
  });

  test('honours a top-to-bottom field', () => {
    expect(getVerticalInputStyle({ width: 38, height: 120, rotation: 90 }).transform)
      .toContain('rotate(90deg)');
  });
});
