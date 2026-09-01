import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Document, Page } from 'react-pdf';
import { Rnd } from 'react-rnd';
import CurrencyFormat from 'react-currency-format';
import {
  VERTICAL_TEXT_FIELD_TYPE,
  getFieldMaxLength,
  getVerticalInputStyle,
} from './verticalTextField';

const PDF_HORIZONTAL_GUTTER = 16;

export const getPageFitRatio = (availableWidth, renderedPageWidth) => {
  if (!Number.isFinite(availableWidth) || !Number.isFinite(renderedPageWidth)
    || availableWidth <= 0 || renderedPageWidth <= 0) {
    return 1;
  }

  return Math.min(1, Math.max(0, (availableWidth - PDF_HORIZONTAL_GUTTER) / renderedPageWidth));
};

const PDFViewer = ({
  pdfUrl,
  onLoadSuccess,
  currentPage,
  scale,
  handleDrop,
  fields,
  handleFieldSelection,
  selectedFields,
  handleEditField,
  handleSort,
  handleCellEdit,
  formatDate,
  setFields,
  getFieldHighlight,
  isEditable = false  // Add this new prop with default value false
}) => {
  const viewerRef = useRef(null);
  const [availableWidth, setAvailableWidth] = useState(0);
  const [renderedPageSize, setRenderedPageSize] = useState(null);
  const [verticalEditorId, setVerticalEditorId] = useState(null);

  const openVerticalEditor = useCallback((field) => setVerticalEditorId(field.id), []);
  const closeVerticalEditor = useCallback(() => setVerticalEditorId(null), []);

  useEffect(() => {
    const viewer = viewerRef.current;
    if (!viewer) return undefined;

    const updateWidth = () => setAvailableWidth(viewer.clientWidth);
    updateWidth();

    if (typeof ResizeObserver === 'undefined') {
      window.addEventListener('resize', updateWidth);
      return () => window.removeEventListener('resize', updateWidth);
    }

    const observer = new ResizeObserver(updateWidth);
    observer.observe(viewer);
    return () => observer.disconnect();
  }, []);

  const currentPageKey = `${pdfUrl}:${currentPage}:${scale}`;
  const handlePageLoadSuccess = useCallback((page) => {
    const viewport = page.getViewport({ scale });
    setRenderedPageSize({
      key: currentPageKey,
      width: viewport.width,
      height: viewport.height,
    });
  }, [currentPageKey, scale]);

  if (!fields) return null;

  const activePageSize = renderedPageSize?.key === currentPageKey ? renderedPageSize : null;
  const fitRatio = activePageSize
    ? getPageFitRatio(availableWidth, activePageSize.width)
    : 1;
  const fittedFrameStyle = activePageSize ? {
    width: Math.floor(activePageSize.width * fitRatio),
    height: Math.floor(activePageSize.height * fitRatio),
  } : undefined;
  const verticalEditorField = verticalEditorId != null
    ? fields.find(field => field.id === verticalEditorId)
    : null;
  const fittedContentStyle = activePageSize ? {
    position: 'absolute',
    left: 0,
    top: 0,
    width: activePageSize.width,
    height: activePageSize.height,
    transform: `scale(${fitRatio})`,
    transformOrigin: 'top left',
  } : undefined;
  return (
    <div ref={viewerRef} className="pdf-fit-viewer">
      <Document file={pdfUrl} onLoadSuccess={onLoadSuccess}>
        <div className="pdf-page-fit-frame" style={fittedFrameStyle}>
          <div className="pdf-page-fit-content" style={fittedContentStyle}>
            <Page
              className="pdf-canvas"
              pageNumber={currentPage}
              scale={scale}
              onLoadSuccess={handlePageLoadSuccess}
              renderTextLayer={false}
              renderAnnotationLayer={false}
            >
              {fields.map(field => (
                field.page === currentPage && (
                  <Rnd
                    key={field.id}
                    size={{ width: field.width, height: field.height }}
                    position={{ x: field.x * scale, y: field.y * scale }}
                    bounds="parent"
                    disableDragging={!isEditable}
                    enableResizing={isEditable}
                    style={{
                      border: field.border,
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'center',
                      background: 'none',
                    }}
                    onClick={(event) => handleFieldSelection(event, field)}
                  >
                    <div
                      style={{
                        position: 'relative',
                        width: '100%',
                        height: '100%',
                        fontSize: field.fontSize,
                        padding: '0',
                        backgroundColor: getFieldHighlight(field),
                      }}
                    >
                      {/* Field Type Rendering */}
                      {renderField(field, handleEditField, handleSort, handleCellEdit, formatDate, setFields, openVerticalEditor)}
                    </div>
                  </Rnd>
                )
              ))}
            </Page>
          </div>
        </div>
      </Document>
      {verticalEditorField && (
        <VerticalTextEditor
          field={verticalEditorField}
          onSave={(value) => {
            handleEditField(verticalEditorField.id, value);
            closeVerticalEditor();
          }}
          onCancel={closeVerticalEditor}
        />
      )}
    </div>
  );
};

// Typing sideways is unreadable, so the box on the page is only a view of the
// value: clicking it dims the form and opens the same field lying flat.
const VerticalTextEditor = ({ field, onSave, onCancel }) => {
  const [draft, setDraft] = useState(field.value ?? '');
  const inputRef = useRef(null);

  useEffect(() => {
    inputRef.current?.focus();
    inputRef.current?.select();
  }, []);

  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.key === 'Escape') onCancel();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [onCancel]);

  const label = field.label || 'Field';
  const maxLength = getFieldMaxLength(field);

  return (
    <div
      className="vertical-field-backdrop"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onCancel();
      }}
    >
      <div
        className="vertical-field-dialog"
        role="dialog"
        aria-modal="true"
        aria-label={`Edit ${label}`}
      >
        <label className="vertical-field-dialog__label" htmlFor={`vertical-editor-${field.id}`}>
          {label}
        </label>
        <input
          id={`vertical-editor-${field.id}`}
          ref={inputRef}
          type="text"
          value={draft}
          maxLength={maxLength}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              onSave(draft);
            }
          }}
          className="vertical-field-dialog__input"
        />
        {maxLength && (
          <p className="vertical-field-dialog__count">{`${draft.length} / ${maxLength}`}</p>
        )}
        <div className="vertical-field-dialog__actions">
          <button type="button" className="vertical-field-dialog__cancel" onClick={onCancel}>
            Cancel
          </button>
          <button type="button" className="vertical-field-dialog__save" onClick={() => onSave(draft)}>
            Save
          </button>
        </div>
      </div>
    </div>
  );
};


// Native <input type="date"> only shows the picked date (and stays
// clickable) when its `value` is a plain ISO "YYYY-MM-DD" string. Field
// values are stored/printed in the form's own dateFormat (MM/DD/YYYY by
// default), so convert back to ISO for display; an already-ISO value (a
// fresh prefill from the backend) passes straight through.
const toIsoDate = (value, format = 'MM/DD/YYYY') => {
  if (!value) return '';
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  const parts = String(value).split('/');
  if (parts.length !== 3) return '';
  const [p1, p2, year] = parts;
  const [month, day] = format === 'DD/MM/YYYY' ? [p2, p1] : [p1, p2];
  if (!/^\d{4}$/.test(year) || !month || !day) return '';
  return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
};

// Helper function to render different field types
const renderField = (field, handleEditField, handleSort, handleCellEdit, formatDate, setFields, openVerticalEditor) => {

  switch (field.type) {
    case VERTICAL_TEXT_FIELD_TYPE:
      return (
        <input
          id={field.id}
          aria-label={field.label || field.id}
          type="text"
          value={field.value}
          readOnly
          data-darkreader-ignore
          maxLength={getFieldMaxLength(field)}
          title="Click to edit this sideways field"
          onFocus={() => openVerticalEditor?.(field)}
          onClick={() => openVerticalEditor?.(field)}
          style={{
            ...getFieldStyle(field),
            ...getVerticalInputStyle(field),
            textAlign: 'left',
            cursor: 'pointer',
          }}
        />
      );
    case 'TextField':
      return (
        <input
          id={field.id}
          aria-label={field.label || field.id}
          type="text"
          value={field.value}
          data-darkreader-ignore
          maxLength={getFieldMaxLength(field)}
          onChange={(e) => handleEditField(field.id, e.target.value)}
          style={getFieldStyle(field)}
        // style={{
        //   width: '100%',
        //   height: '100%',
        //   border: 'none',
        //   background: 'none'
        // }}
        />
      );
    case 'TextArea':
      return (
        <textarea
          id={field.id}
          aria-label={field.label || field.id}
          value={field.value}
          data-darkreader-ignore
          onChange={(e) => handleEditField(field.id, e.target.value)}
          style={{
            ...getFieldStyle(field),
            resize: 'none',
          }}
        />
      );
    case 'Table':
      return renderTable(field, handleSort, handleCellEdit);
    case 'Number':
      return (
        <CurrencyFormat
          style={getFieldStyle(field)}
          // style={{
          //   width: '100%',
          //   height: '100%',
          //   border: 'none',
          //   background: 'none'
          // }}
          id={field.id}
          aria-label={field.label || field.id}
          value={field.value}
          thousandSeparator={true}
          prefix={''}
          onValueChange={(values) => {
            const { formattedValue, value } = values;
          }}
          onChange={(e) => handleEditField(field.id, e.target.value)}
        />
      );
    case 'Date':
      return (
        <input
          id={field.id}
          type="date"
          value={toIsoDate(field.value, field.dateFormat)}
          onChange={(e) => {
            // e.target.value is "YYYY-MM-DD" in local time already.
            // `new Date("YYYY-MM-DD")` parses that as UTC midnight, and
            // formatDate's getMonth/getDate/getFullYear read it back in
            // local time — a day behind in any timezone west of UTC. Build
            // the Date from the local Y/M/D components instead.
            const [year, month, day] = e.target.value.split('-').map(Number);
            const date = year && month && day ? new Date(year, month - 1, day) : null;
            handleEditField(field.id, date ? formatDate(date, field.dateFormat) : '');
          }}
          style={getFieldStyle(field)}
        />
      );
    default: {
      // The control fills its field box, which is snapped to the mark printed on
      // the form, and takes that mark's shape — BC prints circles for radio
      // choices and rounded squares for checkboxes. A fixed-size box could never
      // line up, since these marks run from about 7 to 13 pt.
      const isCircle = field.shape === 'circle';
      const isChecked = field.value === 'checked';
      return (
        <label
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            width: '100%', height: '100%', margin: 0, cursor: 'pointer'
          }}
        >
          <input
            id={field.id}
            aria-label={field.label || field.id}
            type="checkbox"
            checked={isChecked}
            onChange={() => {
              setFields((prevFields) =>
                prevFields.map((f) =>
                  f.id === field.id ? { ...f, value: f.value === 'checked' ? 'unchecked' : 'checked' } : f
                )
              );
            }}
            style={{
              appearance: 'none',
              WebkitAppearance: 'none',
              width: '100%',
              height: '100%',
              margin: 0,
              padding: 0,
              boxSizing: 'border-box',
              cursor: 'pointer',
              border: '1px solid rgba(255, 144, 0, 0.8)',
              borderRadius: isCircle ? '50%' : '2px',
              backgroundColor: isChecked ? 'rgba(255, 144, 0, 0.85)' : 'rgba(255, 144, 0, 0.2)'
            }}
          />
        </label>
      );
    }
  }
};

// Helper function to render table fields
const renderTable = (field, handleSort, handleCellEdit) => (
  <div
    id={`table-${field.id}`}
    style={{
      width: '100%',
      height: '100%',
      overflow: 'auto'
    }}
  >
    <table style={{
      width: '100%',
      borderCollapse: 'collapse',
      fontSize: field.fontSize
    }}>
      <thead>
        <tr>
          {field.data[0].map((header, index) => (
            <th key={index}>
              {header}
              {field.sortable && (
                <button
                  onClick={() => handleSort(field.id, index)}
                  style={{ marginLeft: 4 }}
                >
                  ↕️
                </button>
              )}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {field.data.slice(1).map((row, rowIndex) => (
          <tr key={rowIndex}>
            {row.map((cell, cellIndex) => (
              <td key={cellIndex}>
                {field.isEditable ? (
                  <input
                    type="text"
                    value={cell}
                    onChange={(e) => handleCellEdit(field.id, rowIndex, cellIndex, e.target.value)}
                    style={{ width: '100%', border: 'none', background: 'transparent' }}
                  />
                ) : (
                  cell
                )}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

// Helper function to get common field styles
const getFieldStyle = (field) => ({
  fontSize: field.fontSize,
  color: `rgb(${field.color[0]}, ${field.color[1]}, ${field.color[2]})`,
  width: '100%',
  border: field.rule === 'bottom' ? 'none' : `1px solid rgb(255, 144, 0, 0.5)`,
  borderBottom: field.rule === 'bottom' ? '1px solid #000' : undefined,
  background: field.background,
  height: '100%',
  boxSizing: 'border-box',
  backgroundColor: `rgba(255, 255, 255, 0.85)`,
  // Native form controls get repainted by a browser dark theme. `colorScheme`
  // prevents that browser-level repaint; `data-darkreader-ignore` on the
  // controls below prevents Dark Reader's extension-level repaint. Together
  // they preserve the field surface in an otherwise dark browser.
  colorScheme: 'light',
});

export default PDFViewer;
