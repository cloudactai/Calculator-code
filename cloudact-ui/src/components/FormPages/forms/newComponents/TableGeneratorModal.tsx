import React, { useState } from 'react'
import { X } from 'lucide-react'
import { Modal } from 'react-bootstrap'

const TableGeneratorModal = ({
  isOpen,
  onClose,
  setFields,
  currentPage,
  documentData,
  dialogClassName,
  size
}) => {
  const [selectedTableType, setSelectedTableType] = useState('')
  const [tableConfig, setTableConfig] = useState({
    rows: 3,
    columns: 3,
    fieldWidth: 150,
    fieldHeight: 20,
    initialX: 50,
    initialY: 100,
    source: '',
    sourceType: '',
    bindName: '',
    fieldType: 'TextField',
    assetType: 'land',
    propertyStatus: 'all'
  })

  const handleConfigChange = e => {
    const { name, value } = e.target
    setTableConfig(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleGenerateChildrenTable = () => {
    const childrenData = documentData.theChildren || []
    const numberOfItems =
      tableConfig.rows > 0 ? tableConfig.rows : childrenData.length
    const selectedFields = Object.keys(childrenData[0] || {})

    const newFields = Array.from({ length: numberOfItems }).flatMap(
      (_, childIndex) => {
        const childData = childrenData[childIndex] || {}

        return selectedFields.map((fieldName, fieldIndex) => ({
          id: `child-${childIndex}-${fieldName}`,
          type: tableConfig.fieldType,
          x: tableConfig.initialX + fieldIndex * tableConfig.fieldWidth,
          y: tableConfig.initialY + childIndex * tableConfig.fieldHeight,
          width: tableConfig.fieldWidth,
          height: tableConfig.fieldHeight,
          value: childData[fieldName] || '',
          bind: `theChildren[${childIndex}].${fieldName}`,
          source: 'children',
          sourceType: 'theChildren',
          fontSize: 10,
          color: [0, 0, 0],
          background: 'none',
          border: 'none',
          page: currentPage
        }))
      }
    )

    setFields(prevFields => [...prevFields, ...newFields])
    onClose()
  }

  const handleGenerateCustomTable = () => {
    const newFields = []

    for (let row = 0; row < tableConfig.rows; row++) {
      for (let col = 0; col < tableConfig.columns; col++) {
        const field = {
          id: `table-${row}-${col}-${Date.now()}`,
          type: tableConfig.fieldType,
          x: tableConfig.initialX + col * tableConfig.fieldWidth,
          y: tableConfig.initialY + row * tableConfig.fieldHeight,
          width: tableConfig.fieldWidth,
          height: tableConfig.fieldHeight,
          value: '',
          bind: tableConfig.bindName
            ? `${tableConfig.bindName}[${row}][${col}]`
            : '',
          source: tableConfig.source,
          sourceType: tableConfig.sourceType,
          fontSize: 10,
          color: [0, 0, 0],
          background: 'none',
          border: 'none',
          page: currentPage
        }
        newFields.push(field)
      }
    }

    setFields(prevFields => [...prevFields, ...newFields])
    onClose()
  }

  const handleGenerateAssetsTable = () => {
    const { assetType, propertyStatus } = tableConfig
    let assetData = documentData.assets?.[assetType] || []
    
    if (propertyStatus !== 'all') {
      assetData = assetData.filter(asset => asset.property_status === propertyStatus)
    }

    const numberOfItems = tableConfig.rows > 0 ? tableConfig.rows : assetData.length
    const selectedFields = Object.keys(assetData[0] || {})

    const newFields = Array.from({ length: numberOfItems }).flatMap(
      (_, assetIndex) => {
        const asset = assetData[assetIndex] || {}

        return selectedFields.map((fieldName, fieldIndex) => ({
          id: `asset-${assetType}-${propertyStatus}-${assetIndex}-${fieldName}`,
          type: tableConfig.fieldType,
          x: tableConfig.initialX + fieldIndex * tableConfig.fieldWidth,
          y: tableConfig.initialY + assetIndex * tableConfig.fieldHeight,
          width: tableConfig.fieldWidth,
          height: tableConfig.fieldHeight,
          value: asset[fieldName] || '',
          bind: `assets.${assetType}[${assetIndex}].${fieldName}`,
          source: 'assets',
          sourceType: assetType,
          fontSize: 10,
          color: [0, 0, 0],
          background: 'none',
          border: 'none',
          page: currentPage
        }))
      }
    )

    setFields(prevFields => [...prevFields, ...newFields])
    onClose()
  }

  if (!isOpen) return null

  return (
    <>
      <Modal
        show={isOpen}
        keyboard={true}
        onHide={onClose}
        size={size | 'md'}
        dialogClassName={`customModal ${dialogClassName}`}
        aria-labelledby='contained-modal-title-vcenter'
        centered
        rounded='true'
      >
        <Modal.Header closeButton={true} closeVariant={'white'}>
          <Modal.Title id='contained-modal-title-vcenter'>
            Generate Table
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {!selectedTableType ? (
            <div className='table-type-selection'>
              <div className='d-grid gap-2'>
                <button
                  className='btn btn-outline-primary p-3'
                  onClick={() => setSelectedTableType('children')}
                >
                  Children Table
                  <small className='d-block text-muted mt-1'>
                    Generate table from children data
                  </small>
                </button>

                <button
                  className='btn btn-outline-primary p-3'
                  onClick={() => setSelectedTableType('assets')}
                >
                  Assets Table
                  <small className='d-block text-muted mt-1'>
                    Generate table from assets data
                  </small>
                </button>

                <button
                  className='btn btn-outline-primary p-3'
                  onClick={() => setSelectedTableType('custom')}
                >
                  Custom Table
                  <small className='d-block text-muted mt-1'>
                    Create a custom table with specific dimensions
                  </small>
                </button>
              </div>
            </div>
          ) : (
            <div className='table-configuration'>
              <button
                className='btn btn-sm btn-outline-secondary mb-3'
                onClick={() => setSelectedTableType('')}
              >
                ← Back to Table Types
              </button>

              <div className='row g-3'>
                {selectedTableType === 'assets' && (
                  <>
                    <div className='col-md-6'>
                      <label className='form-label'>Asset Type</label>
                      <select
                        name='assetType'
                        value={tableConfig.assetType}
                        onChange={handleConfigChange}
                        className='form-select'
                      >
                        <option value='land'>Land</option>
                        <option value='household'>Household</option>
                        <option value='bank'>Bank</option>
                        <option value='life'>Life Insurance</option>
                        <option value='interests'>Interests</option>
                        <option value='moneyOwed'>Money Owed</option>
                        <option value='otherProperty'>Other Property</option>
                      </select>
                    </div>

                    <div className='col-md-6'>
                      <label className='form-label'>Property Status</label>
                      <select
                        name='propertyStatus'
                        value={tableConfig.propertyStatus}
                        onChange={handleConfigChange}
                        className='form-select'
                      >
                        <option value='all'>All</option>
                        <option value='owned'>Owned</option>
                        <option value='rented'>Rented</option>
                        <option value='leased'>Leased</option>
                        <option value='mortgaged'>Mortgaged</option>
                        <option value='inherited'>Inherited</option>
                      </select>
                    </div>
                  </>
                )}

                <div className='col-md-6'>
                  <label className='form-label'>Number of Rows</label>
                  <input
                    type='number'
                    name='rows'
                    value={tableConfig.rows}
                    onChange={handleConfigChange}
                    className='form-control'
                    min='1'
                  />
                </div>

                <div className='col-md-6'>
                  <label className='form-label'>Field Width (px)</label>
                  <input
                    type='number'
                    name='fieldWidth'
                    value={tableConfig.fieldWidth}
                    onChange={handleConfigChange}
                    className='form-control'
                    min='1'
                  />
                </div>

                <div className='col-md-6'>
                  <label className='form-label'>Field Height (px)</label>
                  <input
                    type='number'
                    name='fieldHeight'
                    value={tableConfig.fieldHeight}
                    onChange={handleConfigChange}
                    className='form-control'
                    min='1'
                  />
                </div>

                <div className='col-md-6'>
                  <label className='form-label'>Initial X Position</label>
                  <input
                    type='number'
                    name='initialX'
                    value={tableConfig.initialX}
                    onChange={handleConfigChange}
                    className='form-control'
                  />
                </div>

                <div className='col-md-6'>
                  <label className='form-label'>Initial Y Position</label>
                  <input
                    type='number'
                    name='initialY'
                    value={tableConfig.initialY}
                    onChange={handleConfigChange}
                    className='form-control'
                  />
                </div>

                {selectedTableType === 'custom' && (
                  <>
                    <div className='col-md-6'>
                      <label className='form-label'>Number of Columns</label>
                      <input
                        type='number'
                        name='columns'
                        value={tableConfig.columns}
                        onChange={handleConfigChange}
                        className='form-control'
                        min='1'
                      />
                    </div>

                    <div className='col-md-6'>
                      <label className='form-label'>Source</label>
                      <input
                        type='text'
                        name='source'
                        value={tableConfig.source}
                        onChange={handleConfigChange}
                        className='form-control'
                        placeholder='Enter source'
                      />
                    </div>

                    <div className='col-md-6'>
                      <label className='form-label'>Source Type</label>
                      <input
                        type='text'
                        name='sourceType'
                        value={tableConfig.sourceType}
                        onChange={handleConfigChange}
                        className='form-control'
                        placeholder='Enter source type'
                      />
                    </div>

                    <div className='col-md-6'>
                      <label className='form-label'>Bind Name</label>
                      <input
                        type='text'
                        name='bindName'
                        value={tableConfig.bindName}
                        onChange={handleConfigChange}
                        className='form-control'
                        placeholder='Enter bind name'
                      />
                    </div>
                  </>
                )}

                <div className='col-md-6'>
                  <label className='form-label'>Field Type</label>
                  <select
                    name='fieldType'
                    value={tableConfig.fieldType}
                    onChange={handleConfigChange}
                    className='form-select'
                  >
                    <option value='TextField'>Text</option>
                    <option value='Number'>Number</option>
                    <option value='Checkbox'>Checkbox</option>
                    <option value='Date'>Date</option>
                  </select>
                </div>
              </div>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <button type='button' className='btn btn-secondary' onClick={onClose}>
            Cancel
          </button>

          {selectedTableType && (
            <button
              type='button'
              className='btn btn-primary'
              onClick={
                selectedTableType === 'children'
                  ? handleGenerateChildrenTable
                  : selectedTableType === 'assets'
                  ? handleGenerateAssetsTable
                  : handleGenerateCustomTable
              }
            >
              Generate Table
            </button>
          )}
        </Modal.Footer>
      </Modal>
    </>
  )
}

export default TableGeneratorModal
