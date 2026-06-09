import React, { useState } from 'react';

const CreateChildrensTable = ({ data, onCreateTable, onClose }) => {
  const [selectedFields, setSelectedFields] = useState([]);

  // Define simple field labels
  const fieldLabels = {
    fullLegalName: "Full Name",
    age: "Age",
    birthdate: "Birth Date",
    muncipilityAndProvince: "Municipality & Province",
    nowLivingWith: "Living With",
    representedByLawyer: "Has Lawyer",
    lawyerName: "Lawyer Name",
    lawyerPhone: "Lawyer Phone",
    lawyerAddress: "Lawyer Address",
    lawyerEmail: "Lawyer Email"
  };

  const handleFieldToggle = (field) => {
    setSelectedFields(prev => 
      prev.includes(field)
        ? prev.filter(f => f !== field)
        : [...prev, field]
    );
  };

  const handleCreateTable = () => {
    if (selectedFields.length === 0) return;

    const tableData = {
      headers: selectedFields.map(field => fieldLabels[field]),
      rows: data.map(item => 
        selectedFields.map(field => item[field]?.toString() || '')
      ),
      width: 600,
      height: 200
    };

    onCreateTable(tableData);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
      <div className="bg-white rounded-lg w-96 p-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">Create Table</h2>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            ×
          </button>
        </div>

        <p className="text-sm text-gray-600 mb-3">Select fields to include in the table:</p>

        <div className="max-h-60 overflow-y-auto">
          {Object.entries(fieldLabels).map(([field, label]) => (
            <div key={field} className="flex items-center py-1">
              <input
                type="checkbox"
                id={field}
                checked={selectedFields.includes(field)}
                onChange={() => handleFieldToggle(field)}
                className="mr-2"
              />
              <label htmlFor={field} className="text-sm">
                {label}
              </label>
            </div>
          ))}
        </div>

        <div className="flex justify-end mt-4 space-x-2">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800"
          >
            Cancel
          </button>
          <button
            onClick={handleCreateTable}
            disabled={selectedFields.length === 0}
            className="px-4 py-2 text-sm text-white bg-blue-500 rounded hover:bg-blue-600 disabled:opacity-50"
          >
            Create Table
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreateChildrensTable;