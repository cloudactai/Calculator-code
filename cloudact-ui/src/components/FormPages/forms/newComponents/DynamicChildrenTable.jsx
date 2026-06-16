import React, { useState, useEffect } from 'react';

const DynamicChildrenTable = ({ documentData, fields, setFields, currentPage }) => {
    const [fieldTypes, setFieldTypes] = useState({});
    const [selectedFields, setSelectedFields] = useState([]);
    const [isGenerating, setIsGenerating] = useState(false);
    const [limit, setLimit] = useState(0); // Limit for number of fields to generate

    const handleFieldSelection = (fieldName) => {
        setSelectedFields((prevSelectedFields) =>
            prevSelectedFields.includes(fieldName)
                ? prevSelectedFields.filter((field) => field !== fieldName)
                : [...prevSelectedFields, fieldName]
        );
    };

    const handleFieldTypeChange = (fieldName, type) => {
        setFieldTypes((prevTypes) => ({ ...prevTypes, [fieldName]: type }));
    };

    const handleGenerateTable = () => {
        const childrenData = documentData.theChildren || [];
        const numberOfItems = limit > 0 ? limit : childrenData.length;

        // Constants for field positioning
        const fieldWidth = 150; // Width of each field
        const fieldHeight = 40; // Height gap between each field
        const initialX = 50; // Starting X position
        const initialY = 100; // Starting Y position

        // Loop to create fields, filling with data from children or empty fields up to the limit
        const newFields = Array.from({ length: numberOfItems }).flatMap((_, childIndex) => {
            const childData = childrenData[childIndex] || {}; // Use data if available, otherwise create empty fields

            return selectedFields.map((fieldName, fieldIndex) => ({
                id: `child-${childIndex}-${fieldName}`,
                type: fieldTypes[fieldName] || 'TextField',
                x: initialX + (fieldIndex * fieldWidth), // Calculate X position based on column index
                y: initialY + (childIndex * 20), // Calculate Y position based on row index
                width: fieldWidth,
                height: 20,
                value: childData[fieldName] || '',
                bind: `theChildren[${childIndex}].${fieldName}`,
                source: 'children',
                sourceType: 'theChildren',
                fontSize: 10,
                color: [0, 0, 0],
                background: 'none',
                border: 'none',
                page: currentPage, // Assign to current page
            }));
        });

        setFields((prevFields) => [...prevFields, ...newFields]);
        setIsGenerating(false); // Hide the generation options after generating fields
    };

    return (
        <div className="dynamic-children-table">
            {!isGenerating ? (
                <div className="generate-button-container">
                    <button onClick={() => setIsGenerating(true)} className="btn btn-primary">
                        Create Children Table
                    </button>
                </div>
            ) : (
                <div className="field-selection">
                    <button onClick={() => setIsGenerating(false)} className="btn btn-secondary back-btn">
                        ← Back
                    </button>
                    <span className='h5'>Select Fields for Children Table</span>
                    <div className="limit-input">
                        <label>
                            Limit (0 for all):
                            <input
                                type="number"
                                value={limit}
                                onChange={(e) => setLimit(parseInt(e.target.value, 10))}
                                min="0"
                                className="limit-input-field"
                            />
                        </label>
                    </div>
                    <div className="field-options mt-2">
                        {Object.keys(documentData.theChildren[0] || {}).map((field) => (
                              <div key={field} className="form-group w-100">
                                <label className="field-label">
                                    <input
                                     className='form-check-input'
                                        type="checkbox"
                                        checked={selectedFields.includes(field)}
                                        onChange={() => handleFieldSelection(field)}
                                    />
                                    {field}
                                </label>
                                <select
                                    value={fieldTypes[field] || 'TextField'}
                                    onChange={(e) => handleFieldTypeChange(field, e.target.value)}
                                    className="form-select"
                                >
                                    <option value="TextField">Text</option>
                                    <option value="Number">Number</option>
                                    <option value="Checkbox">Checkbox</option>
                                    <option value="Date">Date</option>
                                </select>
                            </div>
                        ))}
                    </div>
                    <button onClick={handleGenerateTable} className="btn btn-success mt-2 generate-btn">
                        Generate Table
                    </button>
                </div>
            )}
        </div>
    );
};

export default DynamicChildrenTable;
