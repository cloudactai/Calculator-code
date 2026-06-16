import React from "react";
import { currencyFormat, formatNumber } from '../utils/helpers/Formatting'
interface IinputCustom {
  type: String,
  label: String,
  placeholder?: String,
  handleChange: (e: React.ChangeEvent<HTMLInputElement>) => void,
  margin?: String,
  value: String | number,
  hide?: Boolean,
  name?: String,
  disabled?: Boolean,
  classNames?: String,
  formGroupClassNames?: String,
  labelClassNames?: String
}


const InputCustom = ({
  type,
  label,
  placeholder,
  handleChange,
  margin,
  value,
  hide,
  name,
  disabled,
  classNames,
  formGroupClassNames,
  labelClassNames
}: IinputCustom) => {

  placeholder = placeholder ? placeholder : label;

  

  if(type === 'currency'){
    return (
      <div className={`form-group ${hide ? "d-none" : ""} ${formGroupClassNames ? formGroupClassNames : ""}`}>
      {label && <label className={`form-label ${labelClassNames ? labelClassNames : ""}`} htmlFor={label}>{label}</label>}
      <input required type="text" placeholder={placeholder} label={label} className={`form-control ${disabled ? "disabled" : ""} ${classNames}`} name={name ? name : label} disabled={disabled || false} id={label} value={value} onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange(e)} />
    </div>
    )
  }

  return (
    <div className={`form-group ${hide ? "d-none" : ""} ${formGroupClassNames ? formGroupClassNames : ""}`}>
      {label && <label className={`form-label ${labelClassNames ? labelClassNames : ""}`} htmlFor={label}>{label}</label>}
      <input required type={type} placeholder={placeholder} label={label} className={`form-control ${disabled ? "disabled" : ""} ${classNames}`} name={name ? name : label} disabled={disabled || false} id={label} value={value} onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange(e)} />
    </div>
  );
};
export default InputCustom;