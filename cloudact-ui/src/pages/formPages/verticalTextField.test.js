import {
  VERTICAL_TEXT_FIELD_TYPE,
  getFieldMaxLength,
  getVerticalInputStyle,
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
