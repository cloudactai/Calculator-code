import React from 'react'

const CustomCheckbox = ({ id, label, onChange, checked, docId }) => {

    return (
        <label className='custom-checkbox'>
            {label}
            <input
                type='checkbox'
                id={id}
                docId= {docId}
                checked={checked}
                onChange={e => onChange(id, e.target.checked, docId)}
            />
            <span className='checkmark'></span>
        </label>
    )
}

export default CustomCheckbox