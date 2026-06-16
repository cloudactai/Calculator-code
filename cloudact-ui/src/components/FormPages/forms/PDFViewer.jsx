// src/components/PDF/components/PDFViewer.jsx
import React from 'react';
import { Document, Page } from 'react-pdf';
import { Rnd } from 'react-rnd';
import CurrencyFormat from 'react-currency-format';

export const PDFViewer = ({
    pdfUrl,
    currentPage,
    scale,
    fields,
    selectedFields,
    onFieldSelect,
    onFieldEdit,
    onFieldDrag,
    onFieldDragStart,
    onFieldDragStop,
    handleDrop,
    resizeEnabled = false,
    onLoadSuccess,
}) => {
    // Add this function inside your PDFViewer component
    const formatDate = (date, format = 'MM/DD/YYYY') => {
        if (!date) return '';
        const d = new Date(date);
        if (isNaN(d.getTime())) return '';

        const pad = (num) => num.toString().padStart(2, '0');
        const month = pad(d.getMonth() + 1);
        const day = pad(d.getDate());
        const year = d.getFullYear();

        switch (format) {
            case 'MM/DD/YYYY':
                return `${month}/${day}/${year}`;
            case 'DD/MM/YYYY':
                return `${day}/${month}/${year}`;
            case 'YYYY-MM-DD':
                return `${year}-${month}-${day}`;
            default:
                return `${month}/${day}/${year}`;
        }
    };

    const renderField = (field) => {
        const getFieldContent = () => {
            switch (field.type) {
                case 'TextField':
                    return (
                        <input
                            type="text"
                            value={field.value}
                            onChange={(e) => onFieldEdit(field.id, e.target.value)}
                            style={{
                                fontSize: field.fontSize,
                                color: `rgb(${field.color[0]}, ${field.color[1]}, ${field.color[2]})`,
                                width: '100%',
                                border: `1px solid rgb(255, 144, 0, 0.5)`,
                                background: field.background,
                                height: '100%',
                                boxSizing: 'border-box',
                                backgroundColor: `rgb(255, 144, 0, 0.2)`,
                            }}
                        />
                    );
                case 'TextArea':
                    return (
                        <textarea
                            value={field.value}
                            onChange={(e) => onFieldEdit(field.id, e.target.value)}
                            style={{
                                fontSize: field.fontSize,
                                color: `rgb(${field.color[0]}, ${field.color[1]}, ${field.color[2]})`,
                                width: '100%',
                                height: '100%',
                                border: `1px solid rgb(255, 144, 0, 0.5)`,
                                backgroundColor: `rgb(255, 144, 0, 0.2)`,
                                boxSizing: 'border-box',
                            }}
                        />
                    );
                case 'Number':
                    return (
                        <CurrencyFormat
                            style={{
                                fontSize: field.fontSize,
                                color: `rgb(${field.color[0]}, ${field.color[1]}, ${field.color[2]})`,
                                width: '100%',
                                border: `1px solid rgb(255, 144, 0, 0.5)`,
                                background: field.background,
                                height: '100%',
                                boxSizing: 'border-box',
                                backgroundColor: `rgb(255, 144, 0, 0.2)`,
                            }}
                            id={field.id}
                            value={field.value || 0}
                            thousandSeparator={true}
                            prefix={''}
                            onValueChange={(values) => {
                                const { value } = values;
                                onFieldEdit(field.id, value);
                            }}
                        />
                    );
                case 'Date':
                    return (
                        <input
                            type="date"
                            value={field.value}
                            onChange={(e) => {
                                const date = new Date(e.target.value);
                                const formattedDate = formatDate(date, field.dateFormat);
                                onFieldEdit(field.id, formattedDate);
                            }}
                            style={{
                                fontSize: field.fontSize,
                                color: `rgb(${field.color[0]}, ${field.color[1]}, ${field.color[2]})`,
                                width: '100%',
                                border: `1px solid rgb(255, 144, 0, 0.5)`,
                                background: field.background,
                                height: '100%',
                                boxSizing: 'border-box',
                                backgroundColor: `rgb(255, 144, 0, 0.2)`,
                            }}
                        />
                    );
                case 'CheckBox':
                    return (
                        <label style={{ display: 'flex', alignItems: 'center' }}>
                            <input
                                type="checkbox"
                                checked={field.value === 'checked'}
                                onChange={() => onFieldEdit(field.id, field.value === 'checked' ? 'unchecked' : 'checked')}
                                style={{
                                    width: '20px',
                                    height: '20px',
                                    cursor: 'pointer',
                                    marginRight: '5px'
                                }}
                            />
                        </label>
                    );
                default:
                    return null;
            }
        };

        return (
            <Rnd
                key={field.id}
                size={{ width: field.width, height: field.height }}
                position={{ x: field.x * scale, y: field.y * scale }}
                enableResizing={resizeEnabled}
                onDragStart={(e) => onFieldDragStart(e, field)}
                onDrag={(e, d) => onFieldDrag(e, d, field)}
                onDragStop={onFieldDragStop}
                bounds="parent"
                style={{
                    border: field.border,
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    background: 'white',
                }}
                onClick={(event) => onFieldSelect(event, field)}
            >
                <div
                    style={{
                        position: 'relative',
                        width: '100%',
                        height: '100%',
                        fontSize: field.fontSize,
                        padding: '0',
                        backgroundColor: selectedFields.some(selected => selected.id === field.id)
                            ? 'rgba(0, 123, 255, 0.5)'
                            : 'transparent',
                        cursor: selectedFields.length > 0 ? 'move' : 'pointer',
                    }}
                >
                    {getFieldContent()}
                </div>
            </Rnd>
        );
    };

    return (
        <div
            id="pdfContainer"
            style={{ flex: 1, position: 'relative' }}
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
        >
            <Document file={pdfUrl} onLoadSuccess={onLoadSuccess}>
                <Page
                    className="pdf-canvas"
                    pageNumber={currentPage}
                    scale={scale}
                    renderTextLayer={false}
                    renderAnnotationLayer={false}
                >
                    {fields
                        .filter(field => field.page === currentPage)
                        .map(field => renderField(field))}
                </Page>
            </Document>
        </div>
    );
};