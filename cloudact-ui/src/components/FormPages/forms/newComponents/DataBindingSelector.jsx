import React, { useState } from 'react';
import { Search, ChevronRight, ChevronDown, X } from 'lucide-react';
import { Modal } from 'react-bootstrap';

const DataBindingSelector = ({ isOpen, onClose, onSelect, data, size, dialogClassName }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedNodes, setExpandedNodes] = useState(new Set());

  // Flatten the nested object into paths for searching
  const flattenObject = (obj, parentKey = '') => {
    return Object.entries(obj).reduce((acc, [key, value]) => {
      const newKey = parentKey ? `${parentKey}.${key}` : key;
      
      if (value && typeof value === 'object' && !Array.isArray(value)) {
        return { ...acc, ...flattenObject(value, newKey) };
      } else if (Array.isArray(value)) {
        const arrayPaths = value.reduce((arrayAcc, item, index) => {
          if (typeof item === 'object') {
            return { ...arrayAcc, ...flattenObject(item, `${newKey}[${index}]`) };
          }
          return { ...arrayAcc, [`${newKey}[${index}]`]: item };
        }, {});
        return { ...acc, ...arrayPaths };
      }
      
      return { ...acc, [newKey]: value };
    }, {});
  };

  // Toggle node expansion
  const toggleNode = (path) => {
    setExpandedNodes(prev => {
      const newSet = new Set(prev);
      if (newSet.has(path)) {
        newSet.delete(path);
      } else {
        newSet.add(path);
      }
      return newSet;
    });
  };

  // Recursive component to render the data tree
  const RenderNode = ({ data, path = '', level = 0 }) => {
    if (typeof data !== 'object' || data === null) {
      return (
        <div 
          className="d-flex align-items-center py-1 px-3 cursor-pointer hover-bg-light"
          onClick={() => onSelect(path)}
          role="button"
        >
          <div style={{ marginLeft: `${level * 20}px` }} className="small">
            {path.split('.').pop()}: <span className="text-muted">{String(data)}</span>
          </div>
        </div>
      );
    }

    const isExpanded = expandedNodes.has(path);
    const hasChildren = Object.keys(data).length > 0;

    return (
      <div>
        <div 
          className="d-flex align-items-center py-1 px-3 cursor-pointer hover-bg-light"
          onClick={() => hasChildren && toggleNode(path)}
          role="button"
        >
          <div style={{ marginLeft: `${level * 20}px` }} className="d-flex align-items-center">
            {hasChildren && (
              isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />
            )}
            <span className="small fw-medium ms-1">
              {path ? path.split('.').pop() : 'Root'}
            </span>
          </div>
        </div>
        
        {isExpanded && hasChildren && (
          <div>
            {Object.entries(data).map(([key, value]) => (
              <RenderNode 
                key={key} 
                data={value} 
                path={path ? `${path}.${key}` : key}
                level={level + 1}
              />
            ))}
          </div>
        )}
      </div>
    );
  };

  // Filter data based on search term
  const getFilteredData = () => {
    if (!searchTerm) return data;

    const flatData = flattenObject(data);
    const filteredPaths = Object.entries(flatData)
      .filter(([path, value]) => 
        path.toLowerCase().includes(searchTerm.toLowerCase()) ||
        String(value).toLowerCase().includes(searchTerm.toLowerCase())
      )
      .map(([path]) => path);

    // Reconstruct the filtered object structure
    const filteredData = {};
    filteredPaths.forEach(path => {
      const parts = path.split('.');
      let current = filteredData;
      parts.forEach((part, index) => {
        if (index === parts.length - 1) {
          current[part] = flatData[path];
        } else {
          current[part] = current[part] || {};
          current = current[part];
        }
      });
    });

    return filteredData;
  };

  if (!isOpen) return null;

  return (
    <>
    <Modal
            show={isOpen}
            keyboard={true}
            onHide={onClose}
            size={size | "md"}
            dialogClassName={`customModal ${dialogClassName}`}
            aria-labelledby="contained-modal-title-vcenter"
            centered
            rounded="true"
        >
              <Modal.Header closeButton={true} closeVariant={"white"}>
                <Modal.Title id="contained-modal-title-vcenter">Select Data Binding</Modal.Title>
            </Modal.Header>

            <Modal.Body>
            <div className="position-relative mb-3">
                <div className="position-absolute top-50 start-0 translate-middle-y ps-3">
                  <Search size={16} className="text-muted" />
                </div>
                <input
                  type="text"
                  className="form-control ps-5"
                  placeholder="Search fields..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              <div className="border rounded" style={{ maxHeight: '60vh', overflowY: 'auto' }}>
                <RenderNode data={getFilteredData()} />
              </div>
            </Modal.Body>

            <Modal.Footer>
            <button 
                type="button" 
                className="btn btn-secondary" 
                onClick={onClose}
              >
                Close
              </button>
            </Modal.Footer>

        </Modal>
      {/* <div className="modal fade show d-block">
        <div className="modal-dialog modal-lg modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">Select Data Binding</h5>
              <button 
                type="button" 
                className="btn-close" 
                onClick={onClose}
                aria-label="Close"
              />
            </div>
            <div className="modal-body">
              <div className="position-relative mb-3">
                <div className="position-absolute top-50 start-0 translate-middle-y ps-3">
                  <Search size={16} className="text-muted" />
                </div>
                <input
                  type="text"
                  className="form-control ps-5"
                  placeholder="Search fields..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              <div className="border rounded" style={{ maxHeight: '60vh', overflowY: 'auto' }}>
                <RenderNode data={getFilteredData()} />
              </div>
            </div>
            <div className="modal-footer">
              <button 
                type="button" 
                className="btn btn-secondary" 
                onClick={onClose}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
      <div className="modal-backdrop fade show"></div> */}
    </>
  );
};

export default DataBindingSelector;