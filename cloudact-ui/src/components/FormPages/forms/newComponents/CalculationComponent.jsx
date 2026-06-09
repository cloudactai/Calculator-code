import React, { useState } from 'react';

const CalculationComponent = ({ fields, addFieldToPdf }) => {
  const [selectedFields, setSelectedFields] = useState([]);
  const [total, setTotal] = useState(0);
  const [operation, setOperation] = useState('add'); // To store the operation type

  const handleFieldSelection = (fieldId) => {
    setSelectedFields((prev) => {
      if (prev.includes(fieldId)) {
        return prev.filter(id => id !== fieldId); // Deselect field if already selected
      }
      return [...prev, fieldId]; // Add field to selected fields
    });
  };

  const calculateTotal = () => {
    const totalValue = selectedFields.reduce((acc, fieldId) => {
      const field = fields.find(f => f.id === fieldId);
      return acc + (field ? parseFloat(field.value) || 0 : 0); // Add field value to accumulator
    }, 0);
    
    // Adjust total based on operation
    setTotal(operation === 'subtract' ? -totalValue : totalValue); 
  };

  const addTotalFieldToPdf = () => {
    const newField = {
      id: Date.now(), // Generate a unique ID
      type: "TextField", // Specify the field type
      x: 100, // Set position on the PDF
      y: 200, // Adjust as needed
      width: 150,
      height: 25,
      value: total.toString(), // Set the value to the total
      fontSize: 10,
      color: [0, 0, 0],
      background: 'none',
      border: 'none',
      page: 1, // Specify the page where the field will appear
      bind: selectedFields // Bind the selected fields to this new field
    };

    // Call the function passed down from the parent to add this field to the PDF
    addFieldToPdf(newField);
    // Optionally reset selected fields and total
    setSelectedFields([]);
    setTotal(0);
  };

  return (
    <div>
      <h3>Select Fields to Calculate Total</h3>
      <div>
        {fields.map(field => (
          <div key={field.id}>
            <label>
              <input
                type="checkbox"
                checked={selectedFields.includes(field.id)}
                onChange={() => handleFieldSelection(field.id)}
              />
              {field.value}
            </label>
          </div>
        ))}
      </div>
      <div>
        <label>
          Operation:
          <select value={operation} onChange={(e) => setOperation(e.target.value)}>
            <option value="add">Add</option>
            <option value="subtract">Subtract</option>
          </select>
        </label>
      </div>
      <button onClick={calculateTotal}>Calculate Total</button>
      <h4>Total: {total}</h4>
      <button onClick={addTotalFieldToPdf}>Add Total to PDF</button>
    </div>
  );
};

export default CalculationComponent;
