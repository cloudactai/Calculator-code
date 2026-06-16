/**
 * Formats field values based on their type
 */
export const formatFieldValue = {
    // Format date strings
    formatDate: (date, format = 'MM/DD/YYYY') => {
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
    },
  
    // Format currency values
    formatCurrency: (value, options = {}) => {
      const {
        decimals = 2,
        prefix = '',
        separator = ',',
        decimalPoint = '.'
      } = options;
  
      if (!value) return `${prefix}0.00`;
  
      const num = parseFloat(value);
      if (isNaN(num)) return `${prefix}0.00`;
  
      return num
        .toFixed(decimals)
        .replace(/\B(?=(\d{3})+(?!\d))/g, separator)
        .replace('.', decimalPoint);
    },
  
    // Format table cell values
    formatTableCell: (value, type) => {
      if (value === null || value === undefined) return '';
  
      switch (type) {
        case 'date':
          return new Date(value).toLocaleDateString();
        case 'number':
          return Number(value).toLocaleString();
        case 'boolean':
          return value ? 'Yes' : 'No';
        default:
          return String(value);
      }
    }
  };
  
  /**
   * Field positioning and alignment utilities
   */
  export const fieldPosition = {
    // Calculate field position accounting for scale
    calculateScaledPosition: (x, y, scale) => ({
      x: x * scale,
      y: y * scale
    }),
  
    // Calculate relative position within container
    getRelativePosition: (mouseX, mouseY, containerRect, scale) => ({
      x: (mouseX - containerRect.left) / scale,
      y: (mouseY - containerRect.top) / scale
    }),
  
    // Align fields based on direction
    alignFields: (fields, selectedFields, direction) => {
      if (selectedFields.length < 2) return fields;
  
      const selectedIds = selectedFields.map(f => f.id);
      
      switch (direction) {
        case 'left': {
          const targetX = Math.min(...selectedFields.map(f => f.x));
          return fields.map(field => 
            selectedIds.includes(field.id) ? { ...field, x: targetX } : field
          );
        }
        case 'right': {
          const targetX = Math.max(...selectedFields.map(f => f.x));
          return fields.map(field =>
            selectedIds.includes(field.id) ? { ...field, x: targetX } : field
          );
        }
        case 'top': {
          const targetY = Math.min(...selectedFields.map(f => f.y));
          return fields.map(field =>
            selectedIds.includes(field.id) ? { ...field, y: targetY } : field
          );
        }
        case 'bottom': {
          const targetY = Math.max(...selectedFields.map(f => f.y));
          return fields.map(field =>
            selectedIds.includes(field.id) ? { ...field, y: targetY } : field
          );
        }
        case 'center': {
          const minX = Math.min(...selectedFields.map(f => f.x));
          const maxX = Math.max(...selectedFields.map(f => f.x + f.width));
          const centerX = minX + (maxX - minX) / 2;
          return fields.map(field =>
            selectedIds.includes(field.id) ? 
              { ...field, x: centerX - (field.width / 2) } : field
          );
        }
        default:
          return fields;
      }
    },
  
    // Distribute fields evenly
    distributeFields: (fields, selectedFields, direction) => {
      if (selectedFields.length < 3) return fields;
  
      const selectedIds = selectedFields.map(f => f.id);
      const sortedFields = [...selectedFields].sort((a, b) => 
        direction === 'horizontal' ? a.x - b.x : a.y - b.y
      );
  
      if (direction === 'horizontal') {
        const start = sortedFields[0].x;
        const end = sortedFields[sortedFields.length - 1].x;
        const spacing = (end - start) / (selectedFields.length - 1);
  
        return fields.map(field => {
          if (selectedIds.includes(field.id)) {
            const index = sortedFields.findIndex(f => f.id === field.id);
            return { ...field, x: start + (spacing * index) };
          }
          return field;
        });
      } else {
        const start = sortedFields[0].y;
        const end = sortedFields[sortedFields.length - 1].y;
        const spacing = (end - start) / (selectedFields.length - 1);
  
        return fields.map(field => {
          if (selectedIds.includes(field.id)) {
            const index = sortedFields.findIndex(f => f.id === field.id);
            return { ...field, y: start + (spacing * index) };
          }
          return field;
        });
      }
    }
  };
  
  /**
   * Field validation utilities
   */
  export const fieldValidation = {
    validateField: (field) => {
      const errors = [];
  
      if (!field.id) errors.push('Field must have an ID');
      if (!field.type) errors.push('Field must have a type');
      if (typeof field.x !== 'number') errors.push('X position must be a number');
      if (typeof field.y !== 'number') errors.push('Y position must be a number');
      if (typeof field.width !== 'number') errors.push('Width must be a number');
      if (typeof field.height !== 'number') errors.push('Height must be a number');
      if (!field.page) errors.push('Field must be assigned to a page');
  
      return {
        isValid: errors.length === 0,
        errors
      };
    },
  
    validateFieldValue: (value, type) => {
      switch (type) {
        case 'Number':
          return !isNaN(parseFloat(value));
        case 'Date':
          return !isNaN(Date.parse(value));
        case 'CheckBox':
          return ['checked', 'unchecked'].includes(value);
        default:
          return true;
      }
    }
  };