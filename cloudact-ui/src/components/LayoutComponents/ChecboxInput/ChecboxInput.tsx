import React from "react";

type Props = {
  val: string;
  id: string;
  changeClick: (
    input_id: string,
    typeName: string,
    e: React.BaseSyntheticEvent<PointerEvent>
  ) => void;
  checked: boolean;
  typename: string;
  isDisabled: boolean;
  disableAllInputsChecked: boolean;
  addClassName: string;
};

const ChecboxInput: React.FC<Props> = ({
  val,
  id,
  changeClick,
  checked,
  typename,
  isDisabled,
  disableAllInputsChecked,
  addClassName,
}) => {
  const handleChange = (e: React.BaseSyntheticEvent<PointerEvent>): void => {
    console.log("e", e);
    const input_id = e.target.attributes["id"].value;
    const typeName = e.target.attributes["typename"].value;
    changeClick(input_id, typeName, e);
  };

  console.log('checkForbal' ,addClassName , typename ,  id ,val);

  return (<div className="d-flex">
  
    <label className={`customCheck ${addClassName ? addClassName : ""}`}><input checked={checked} onChange={handleChange} type="checkbox" className="form-check-input"  typename={typename} disabled={isDisabled} id={id}/>{val}</label>
    {
      ((val == 'Select Trust account' && id == '2.0' && addClassName == 'show') || (val == 'Select General account' && id == '2.1' && addClassName == 'show') ) ?
      <span style={{
        marginTop: '15px',
        marginLeft: '5px',
        color:'red'
      }}>*</span> : null
    }
   
    </div>);
};

export default ChecboxInput;
