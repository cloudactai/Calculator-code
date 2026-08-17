import {
  MIN_SINGLE_LINE_FIELD_HEIGHT,
  ensureMinimumTextFieldHeight,
  ensureMinimumTextFieldHeights,
} from './textFieldGeometry';

describe('ensureMinimumTextFieldHeight', () => {
  test('grows a short one-line field while keeping its bottom edge fixed', () => {
    const field = { id: 1, type: 'TextField', y: 100, height: 9 };
    const result = ensureMinimumTextFieldHeight(field);

    expect(result.height).toBe(MIN_SINGLE_LINE_FIELD_HEIGHT);
    expect(result.y + (result.height / 1.5)).toBeCloseTo(
      field.y + (field.height / 1.5)
    );
  });

  test('leaves fields at or above the minimum unchanged', () => {
    const field = {
      id: 2,
      type: 'TextField',
      y: 100,
      height: MIN_SINGLE_LINE_FIELD_HEIGHT,
    };

    expect(ensureMinimumTextFieldHeight(field)).toBe(field);
  });

  test('does not resize text areas, checkboxes, or vertical text fields', () => {
    ['TextArea', 'CheckBox', 'VerticalTextField'].forEach((type) => {
      const field = { type, y: 100, height: 4 };
      expect(ensureMinimumTextFieldHeight(field)).toBe(field);
    });
  });
});

describe('ensureMinimumTextFieldHeights', () => {
  test('normalizes every short one-line field in a mapping', () => {
    const fields = [
      { id: 1, type: 'TextField', y: 100, height: 8 },
      { id: 2, type: 'TextField', y: 120, height: 20 },
    ];

    const result = ensureMinimumTextFieldHeights(fields);
    expect(result[0].height).toBe(MIN_SINGLE_LINE_FIELD_HEIGHT);
    expect(result[1]).toBe(fields[1]);
  });
});
