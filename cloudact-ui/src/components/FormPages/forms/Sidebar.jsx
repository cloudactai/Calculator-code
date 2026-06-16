// src/components/PDF/components/Sidebar/Sidebar.jsx
import React from 'react';
// import { FormList } from './FormList';
import CustomizationToolbar from './newComponents/CustomizationToolbar';
import CalculationManager from './newComponents/CalculationManager';

export const Sidebar = ({
    isOpen,
    documentData,
    selectedField,
    selectedFields,
    forms,
    activeForm,
    onUpdateField,
    onFormSelect,
    onClose,
    fields,
    setFields,
    currentPage,
    onAddNewPage
}) => {
    return (
        <div className={`col-md-3 sidebar-container ${isOpen ? 'open' : 'closed'}`}>
            <div className={`page-sidebar`}>
                <div className="head">List of Forms</div>

                <div className="body">
                    <div className="content">
                        <FormList
                            forms={forms}
                            activeForm={activeForm}
                            onFormSelect={onFormSelect}
                        />
                        {selectedField && (
                            <div className="sidebar-section">
                                <h4>Field Properties</h4>
                                <CustomizationToolbar
                                    selectedField={selectedField}
                                    updateField={onUpdateField}
                                    documentData={documentData}
                                />
                            </div>
                        )}
                    </div></div>
                <div className="sidebar-content">
                    <div className="sidebar-section">
                        <h4>Selected Forms</h4>
                        <FormList
                            forms={forms}
                            activeForm={activeForm}
                            onFormSelect={onFormSelect}
                        />
                    </div>

                    {selectedField && (
                        <div className="sidebar-section">
                            <h4>Field Properties</h4>
                            <CustomizationToolbar
                                selectedField={selectedField}
                                updateField={onUpdateField}
                                documentData={documentData}
                            />
                        </div>
                    )}

                    <div className="sidebar-section">
                        <h4>Calculations</h4>
                        <CalculationManager
                            fields={fields}
                            setFields={setFields}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

// FormList Component
const FormList = ({ forms, activeForm, onFormSelect }) => (
    <div className="form-list">
        {forms.map((form, index) => (
            <button  onClick={() => onFormSelect(form)} className={`btn btnPrimary mb-2 w-100 ${activeForm.shortTitle === form.shortTitle ? 'button-active' : ''}`}>{form.shortTitle}</button>
        ))}
    </div>
);