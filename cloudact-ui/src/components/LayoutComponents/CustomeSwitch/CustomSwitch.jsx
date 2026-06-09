import React from 'react'
import "./customswitch.css"

const CustomSwitch = ({isChecked,handleToggleChange}) => {
    console.log("isChecked,handleToggleChange",isChecked,handleToggleChange)

   
  return (
    <div className='d-flex justify-content-end'>

    
    <div className={`toggle-switch ${isChecked ? 'on' : 'off'}`} onClick={handleToggleChange}>
      <div className="slider"></div>
    </div>
    </div>
  )
}

export default CustomSwitch