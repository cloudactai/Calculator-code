import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import PDFViewer, { getPageFitRatio } from './PDFViewer';

jest.mock('react-pdf', () => ({
  Document: ({ children }) => <div className="react-pdf__Document">{children}</div>,
  Page: ({ children, onLoadSuccess }) => {
    const MockReact = require('react');
    MockReact.useEffect(() => {
      onLoadSuccess({
        getViewport: () => ({ width: 1188, height: 918 }),
      });
    }, [onLoadSuccess]);
    return <div>{children}</div>;
  },
}));

jest.mock('react-rnd', () => ({
  Rnd: ({ children }) => <div>{children}</div>,
}));

jest.mock('react-currency-format', () => () => null);

beforeEach(() => {
  Object.defineProperty(HTMLElement.prototype, 'clientWidth', {
    configurable: true,
    get() {
      return this.classList?.contains('pdf-fit-viewer') ? 900 : 0;
    },
  });
});

test('fits an oversized landscape page within the available viewer width', async () => {
  const { container } = render(
    <PDFViewer
      pdfUrl="form-28.pdf"
      currentPage={2}
      scale={1.5}
      fields={[]}
    />
  );

  await waitFor(() => {
    expect(container.querySelector('.pdf-page-fit-frame')).toHaveStyle({ width: '884px' });
  });
  expect(container.querySelector('.pdf-page-fit-content').style.transform)
    .toBe(`scale(${getPageFitRatio(900, 1188)})`);
});

test('does not enlarge a page that already fits', () => {
  expect(getPageFitRatio(1200, 918)).toBe(1);
});

describe('sideways text fields', () => {
  const verticalField = {
    id: 1750031815041,
    type: 'VerticalTextField',
    label: 'Name of court',
    x: 114.71,
    y: 490.38,
    width: 38,
    height: 120,
    value: 'Ontario Court of Justice',
    fontSize: 9,
    color: [0, 0, 0],
    background: 'none',
    border: 'none',
    maxLength: 40,
    page: 2,
  };

  const renderViewer = (props = {}) => {
    const handleEditField = jest.fn();
    const view = render(
      <PDFViewer
        pdfUrl="form-32b.pdf"
        currentPage={2}
        scale={1}
        fields={[verticalField]}
        handleEditField={handleEditField}
        handleFieldSelection={() => {}}
        getFieldHighlight={() => 'transparent'}
        {...props}
      />
    );
    return { ...view, handleEditField };
  };

  const openEditor = async () => {
    await userEvent.click(screen.getByLabelText('Name of court'));
    return screen.getByRole('dialog', { name: 'Edit Name of court' });
  };

  test('draws the value along the line instead of across it', () => {
    renderViewer();
    const box = screen.getByLabelText('Name of court');

    expect(box).toHaveValue('Ontario Court of Justice');
    expect(box).toHaveAttribute('readonly');
    // Axes swapped, so the control runs the length of the printed rule.
    expect(box.style.width).toBe('120px');
    expect(box.style.height).toBe('38px');
    expect(box.style.transform).toContain('rotate(-90deg)');
  });

  test('opens a flat editor over a dimmed page when the box is clicked', async () => {
    const { container } = renderViewer();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

    const dialog = await openEditor();

    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(container.querySelector('.vertical-field-backdrop')).toBeInTheDocument();
    const editor = screen.getByLabelText('Name of court', { selector: 'input:not([readonly])' });
    expect(editor).toHaveValue('Ontario Court of Justice');
    expect(editor.style.transform).toBe('');
  });

  test('applies the same character limit to the box and the editor', async () => {
    renderViewer();
    const box = screen.getByLabelText('Name of court');
    await openEditor();
    const editor = screen.getByLabelText('Name of court', { selector: 'input:not([readonly])' });

    expect(editor).toHaveAttribute('maxlength', '40');
    expect(editor.getAttribute('maxlength')).toBe(box.getAttribute('maxlength'));
    expect(screen.getByText('24 / 40')).toBeInTheDocument();
  });

  test('leaves both unlimited when the field sets no limit', async () => {
    renderViewer({ fields: [{ ...verticalField, maxLength: undefined }] });
    const box = screen.getByLabelText('Name of court');
    await openEditor();
    const editor = screen.getByLabelText('Name of court', { selector: 'input:not([readonly])' });

    expect(box).not.toHaveAttribute('maxlength');
    expect(editor).not.toHaveAttribute('maxlength');
  });

  test('saves the edited value back to the field', async () => {
    const { handleEditField } = renderViewer();
    await openEditor();
    const editor = screen.getByLabelText('Name of court', { selector: 'input:not([readonly])' });

    await userEvent.clear(editor);
    await userEvent.type(editor, 'Superior Court of Justice');
    await userEvent.click(screen.getByRole('button', { name: 'Save' }));

    expect(handleEditField).toHaveBeenCalledWith(verticalField.id, 'Superior Court of Justice');
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  });

  test('discards the edit on Cancel and on Escape', async () => {
    const { handleEditField } = renderViewer();
    await openEditor();
    await userEvent.type(
      screen.getByLabelText('Name of court', { selector: 'input:not([readonly])' }),
      ' — Toronto'
    );
    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(handleEditField).not.toHaveBeenCalled();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

    await openEditor();
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(handleEditField).not.toHaveBeenCalled();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  test('ordinary text fields keep their inline editing', async () => {
    const { handleEditField } = renderViewer({
      fields: [{ ...verticalField, type: 'TextField', value: '' }],
    });

    const box = screen.getByLabelText('Name of court');
    await userEvent.type(box, 'O');

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(handleEditField).toHaveBeenCalledWith(verticalField.id, 'O');
    expect(box).toHaveAttribute('maxlength', '40');
  });
});
