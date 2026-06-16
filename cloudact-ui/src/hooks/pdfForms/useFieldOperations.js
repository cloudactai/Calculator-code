import { useState, useCallback, useEffect } from 'react';
import { fieldPosition,fieldValidation } from '../../utils/pdfForms/fieldUtils';

export const useFieldOperations = (initialFields = []) => {
  const [fields, setFields] = useState(initialFields);
  const [selectedField, setSelectedField] = useState(null);
  const [selectedFields, setSelectedFields] = useState([]);
  const [history, setHistory] = useState([initialFields]);
  const [historyIndex, setHistoryIndex] = useState(0);

  // History management
  const addToHistory = useCallback((newFields) => {
    setHistory(prev => {
      const newHistory = prev.slice(0, historyIndex + 1);
      return [...newHistory, newFields];
    });
    setHistoryIndex(prev => prev + 1);
  }, [historyIndex]);

  // Field selection
  const handleFieldSelection = useCallback((event, field) => {
    if (event.shiftKey) {
      setSelectedFields(prev => {
        const isSelected = prev.some(f => f.id === field.id);
        if (isSelected) {
          return prev.filter(f => f.id !== field.id);
        }
        return [...prev, field];
      });
    } else {
      setSelectedFields([field]);
      setSelectedField(field);
    }
  }, []);

  // Field manipulation
  const addField = useCallback((fieldData) => {
    const { isValid, errors } = fieldValidation.validateField(fieldData);
    if (!isValid) {
      console.error('Invalid field data:', errors);
      return null;
    }

    const newField = {
      id: Date.now(),
      ...fieldData
    };

    setFields(prev => {
      const newFields = [...prev, newField];
      addToHistory(newFields);
      return newFields;
    });

    return newField;
  }, [addToHistory]);

  const updateField = useCallback((fieldId, updates) => {
    setFields(prev => {
      const newFields = prev.map(field =>
        field.id === fieldId ? { ...field, ...updates } : field
      );
      addToHistory(newFields);
      return newFields;
    });
  }, [addToHistory]);

  const deleteField = useCallback((fieldId) => {
    setFields(prev => {
      const newFields = prev.filter(field => field.id !== fieldId);
      addToHistory(newFields);
      return newFields;
    });
    setSelectedField(null);
    setSelectedFields([]);
  }, [addToHistory]);

  // Drag operations
  const handleDragStart = useCallback((e, field) => {
    if (selectedFields.length > 1) {
      const positions = selectedFields.map(selectedField => ({
        id: selectedField.id,
        startX: selectedField.x,
        startY: selectedField.y,
      }));
      return positions;
    }
    return null;
  }, [selectedFields]);

  const handleDrag = useCallback((e, d, field, initialPositions, scale) => {
    setFields(prev => {
      let newFields;
      if (selectedFields.length > 1 && initialPositions) {
        newFields = prev.map(f => {
          const pos = initialPositions.find(p => p.id === f.id);
          if (selectedFields.some(selected => selected.id === f.id) && pos) {
            return {
              ...f,
              x: pos.startX + (d.x / scale),
              y: pos.startY + (d.y / scale),
            };
          }
          return f;
        });
      } else {
        newFields = prev.map(f =>
          f.id === field.id ? { ...f, x: d.x / scale, y: d.y / scale } : f
        );
      }
      return newFields;
    });
  }, [selectedFields]);

  // Alignment operations
  const alignFields = useCallback((direction) => {
    if (selectedFields.length < 2) return;

    setFields(prev => {
      const newFields = fieldPosition.alignFields(prev, selectedFields, direction);
      addToHistory(newFields);
      return newFields;
    });
  }, [selectedFields, addToHistory]);

  // Undo/Redo
  const undo = useCallback(() => {
    if (historyIndex > 0) {
      setHistoryIndex(prev => prev - 1);
      setFields(history[historyIndex - 1]);
    }
  }, [history, historyIndex]);

  const redo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(prev => prev + 1);
      setFields(history[historyIndex + 1]);
    }
  }, [history, historyIndex]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'z') {
        e.preventDefault();
        if (e.shiftKey) {
          redo();
        } else {
          undo();
        }
      }
      
      if (e.key === 'Delete' && selectedField) {
        deleteField(selectedField.id);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [selectedField, undo, redo, deleteField]);

  return {
    // State
    fields,
    selectedField,
    selectedFields,
    
    // Field operations
    addField,
    updateField,
    deleteField,
    handleFieldSelection,
    
    // Drag operations
    handleDragStart,
    handleDrag,
    
    // Alignment
    alignFields,
    
    // History
    undo,
    redo,
    
    // Setters
    setFields,
    setSelectedField,
    setSelectedFields,
  };
};