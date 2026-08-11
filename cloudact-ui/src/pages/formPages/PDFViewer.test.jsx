import React from 'react';
import { render, waitFor } from '@testing-library/react';
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
