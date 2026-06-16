import React, { useState, useEffect, useCallback } from 'react';

const CalculationManager = ({ fields, setFields, selectedFields, currentPage }) => {
  const [calculationQueue, setCalculationQueue] = useState([]);

  // Helper function to safely parse numeric values
  const parseNumericValue = (value) => {
    if (typeof value === 'number') return Number(value.toFixed(2));
    if (!value) return 0;

    const stringValue = value.toString();
    const cleanValue = stringValue.replace(/[^0-9.-]+/g, '');
    return Number(parseFloat(cleanValue || 0).toFixed(2));
  };

    const formatNumberWithCommas = (numberStr) => {
    if (!/^\d+(\.\d{0,2})?$/.test(numberStr)) {
      return numberStr;
    }
    const number = parseFloat(numberStr).toFixed(2);
    const [integerPart, decimalPart] = number.split(".");
    const formattedInteger = Number(integerPart).toLocaleString("en-US");

    return `${formattedInteger}.${decimalPart}`;
  };
  
  // Function to update calculated fields
  const updateCalculatedFields = useCallback(() => {
    if (!fields.length) return;

    let hasUpdates = false;
    const updatedFields = fields.map(field => {
      if (!field.isCalculated) return field;

      // Handle linked fields first
      if (field.calculationType === 'linked' && field.linkedToId) {
        const sourceField = fields.find(f => f.id === field.linkedToId);
        if (sourceField && field.value !== sourceField.value) {
          hasUpdates = true;
          return { ...field, value: parseNumericValue(sourceField.value).toFixed(2) };
        }
        return field;
      }

      const currentValue = parseNumericValue(field.value);
      let newValue = currentValue;

      if (field.calculationType === 'sum') {
        // Calculate sum of source fields
        const sumValues = field.sourceFields.map(sourceId => {
          const sourceField = fields.find(f => f.id === sourceId);
          return parseNumericValue(sourceField?.value);
        }).filter(val => val !== null);

        // Calculate sum of fields to subtract
        const subtractValues = (field.subtractFields || []).map(sourceId => {
          const sourceField = fields.find(f => f.id === sourceId);
          return parseNumericValue(sourceField?.value);
        }).filter(val => val !== null);

        // Calculate final value: sum of sourceFields minus sum of subtractFields
        newValue = sumValues.reduce((acc, val) => acc + val, 0) - 
                  subtractValues.reduce((acc, val) => acc + val, 0);
      } else if (field.calculationType === 'add' || field.calculationType === 'subtract') {
        newValue = field.sourceFields.reduce((acc, sourceId, index) => {
          const sourceField = fields.find(f => f.id === sourceId);
          const sourceValue = parseNumericValue(sourceField?.value);
          
          if (index === 0) return sourceValue;
          return field.calculationType === 'add' ? acc + sourceValue : acc - sourceValue;
        }, 0);
      } else if (field.isDerived) {
        const sourceField = fields.find(f => f.id === field.sourceFields[0]);
        const sourceValue = parseNumericValue(sourceField?.value);
        const operationValue = parseNumericValue(field.calculationValue).toFixed(2);

        switch (field.calculationType) {
          case 'multiply':
            newValue = sourceValue * operationValue;
            break;
          case 'divide':
            newValue = operationValue === 0 ? sourceValue : sourceValue / operationValue;
            break;
          case 'add':
            newValue = sourceValue + operationValue;
            break;
          case 'subtract':
            newValue = sourceValue - operationValue;
            break;
        }
      }

      if (newValue !== currentValue) {
        hasUpdates = true;
        return { ...field, value: formatNumberWithCommas(newValue) };
      }
      return field;
    });

    if (hasUpdates) {
      setCalculationQueue(prev => [...prev, updatedFields]);
    }
  }, [fields]);




  // Process the calculation queue
  useEffect(() => {
    if (calculationQueue.length > 0) {
      const nextCalculation = calculationQueue[0];
      setFields(nextCalculation);
      setCalculationQueue(prev => prev.slice(1));
    }
  }, [calculationQueue, setFields]);

  // Trigger calculations when fields change
  useEffect(() => {
    const timer = setTimeout(() => {
      updateCalculatedFields();
    }, 0);
    return () => clearTimeout(timer);
  }, [fields, updateCalculatedFields]);

  // Add another useEffect to watch for field changes
  useEffect(() => {
    const timer = setTimeout(() => {
      updateCalculatedFields();
    }, 0);
    return () => clearTimeout(timer);
  }, [fields, updateCalculatedFields]);

  // Regular sum calculation UI
  return (
    <></>
  );
};

export default CalculationManager;