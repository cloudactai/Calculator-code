import React, { useState, useEffect } from 'react';
import { Link } from 'lucide-react';
import DataBindingSelector from './DataBindingSelector';

const CustomizationToolbar = ({ selectedField, updateField, sampleData }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredBindings, setFilteredBindings] = useState([]);
  const [selectedBindings, setSelectedBindings] = useState([]);
  const [isBindingSelectorOpen, setIsBindingSelectorOpen] = useState(false);
 
  useEffect(() => {
    if (selectedField?.bind) {
      setSelectedBindings(selectedField.bind.split(', ').map(binding => binding.trim()));
    } else {
      setSelectedBindings([]);
    }
  }, [selectedField]);

  if (!selectedField) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    updateField({ ...selectedField, [name]: value });
  };

  // Helper function to get nested object value using dot notation
  const getBoundValue = (data, path) => {
    if (!path) return undefined;
    return path.split('.').reduce((obj, key) => {
      if (obj && typeof obj === 'object') {
        // Handle array indices in the path
        if (key.includes('[') && key.includes(']')) {
          const arrayName = key.split('[')[0];
          const index = parseInt(key.split('[')[1].split(']')[0]);
          return obj[arrayName]?.[index];
        }
        return obj[key];
      }
      return undefined;
    }, data);
  };


  const handleBindingSelect = (binding) => {
    if (!selectedBindings.includes(binding)) {
      const updatedBindings = [...selectedBindings, binding];
      // Only update the bound value if there's a single binding
      if (updatedBindings.length === 1) {
        const boundValue = getBoundValue(sampleData, binding);
        updateField({ 
          ...selectedField, 
          bind: updatedBindings.join(', '),
          value: boundValue !== undefined ? String(boundValue) : '',
        });
      } else {
        // For multiple bindings, just update the bind field and preserve the existing value
        updateField({ 
          ...selectedField, 
          bind: updatedBindings.join(', '),
        });
      }
      
      setSelectedBindings(updatedBindings);
    }
    setIsBindingSelectorOpen(false);
  };

  const handleBindingRemove = (binding) => {
    const updatedBindings = selectedBindings.filter(item => item !== binding);
    
    if (updatedBindings.length === 0) {
      // Clear binding-related fields when all bindings are removed
      updateField({ 
        ...selectedField, 
        bind: '',
        value: '',
        source: '',
      });
    } else if (updatedBindings.length === 1) {
      // Only update the value automatically if we're down to one binding
      const boundValue = getBoundValue(sampleData, updatedBindings[0]);
      updateField({ 
        ...selectedField, 
        bind: updatedBindings.join(', '),
        value: boundValue !== undefined ? String(boundValue) : '',
      });
    } else {
      // For multiple bindings, just update the bind field and preserve the existing value
      updateField({ 
        ...selectedField, 
        bind: updatedBindings.join(', '),
      });
    }
    
    setSelectedBindings(updatedBindings);
  };

  const formFields = [
    { name: 'id', label: 'Field ID' },
    { name: 'value', label: 'Field Value' },
    { name: 'source', label: 'Field Source', disabled: true },
    { name: 'y', label: 'Position Y' },
    { name: 'x', label: 'Position X' },
    { name: 'width', label: 'Field Width' },
    { name: 'type', label: 'Field Type' },
    { name: 'height', label: 'Field Height' },
    { name: 'page', label: 'Page' },
    { name: 'dateFormat', label: 'Date Format', 
      showIf: field => field.type === 'Date',
      options: ['MM/DD/YYYY', 'DD/MM/YYYY', 'YYYY-MM-DD']
    }
  ];

  return (
    <div className="p-3">
      {selectedBindings.length > 0 && (
        <div className="alert alert-primary d-flex align-items-center mb-3 py-2" style={{ fontSize: '0.9rem' }}>
          <Link size={16} className="me-2" />
          <div className="text-truncate">
            {selectedBindings.join(', ')}
          </div>
        </div>
      )}

      <div className="mb-3">
        <label className="form-label">Field Bind</label>
        <button 
          className="btn btn-outline-secondary w-100"
          onClick={() => setIsBindingSelectorOpen(true)}
        >
          Select Binding
        </button>

        {selectedBindings.length > 1 && (
          <button 
            className="btn btn-primary w-100 mt-2"
            onClick={() => updateField({ ...selectedField, type: 'Calculation' })}
          >
            Create Calculation Field
          </button>
        )}

        <DataBindingSelector
          isOpen={isBindingSelectorOpen}
          onClose={() => setIsBindingSelectorOpen(false)}
          onSelect={handleBindingSelect}
          data={sampleData}
          size='sm'
          dialogClassName={'matterModal'}
        />

        <div className="mt-2">
          {selectedBindings.map((binding, index) => (
            <span key={index} className="badge bg-secondary me-2 mb-2">
              {binding}
              <button
                type="button"
                className="btn-close btn-close-white ms-2"
                style={{ fontSize: '0.65rem' }}
                onClick={() => handleBindingRemove(binding)}
              />
            </span>
          ))}
        </div>
      </div>

      {formFields.map((field) => (
        field.showIf?.(selectedField) !== false && (
          <div key={field.name} className="mb-3">
            <label className="form-label">{field.label}</label>
            {field.options ? (
              <select
                className="form-select"
                name={field.name}
                value={selectedField[field.name] || field.options[0]}
                onChange={handleChange}
                disabled={field.disabled}
              >
                {field.options.map(option => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            ) : (
              <input
                type="text"
                className="form-control"
                name={field.name}
                value={selectedField[field.name] || ''}
                onChange={handleChange}
                disabled={field.disabled}
              />
            )}
          </div>
        )
      ))}
    </div>
  );
};

export default CustomizationToolbar;