import React from "react";
import RadioInput from "../LayoutComponents/RadioInput";
import { Autocomplete, TextField } from "@mui/material";

const ComplianceSelector = ({
  name,
  onChangeFunc,
  data,
  isDisabled,
  checked,
  handleInputChange,
  state,
  options,
  options2,
  getInputValue,
}) => {

   console.log("data", {
    name,
    onChangeFunc,
    data,
    isDisabled,
    checked,
    handleInputChange,
    state,
    options,
    options2,
    getInputValue,
  })

  return (
    <>
      <RadioInput onChangeFunc={() => onChangeFunc()} checked={state.taskSelected === data.label} isDisabled={isDisabled} name={name} label={data.label}/>
      <div className={`row mt-2 ${state.taskSelected !== data.label || state.typeOfTask !== "Compliance Form" ? "d-none" : ""}`}>
        <div className="col-md-12">
          <div className="form-group mb-2">
            <Autocomplete id="size-medium-outlined-multi" disabled={state.taskSelected !== data.label || state.typeOfTask !== "Compliance Form"} options={options} value={{ client_id: state.clientId, client_name: state.clientNo }} isOptionEqualToValue={(option, value) => {return option === value;}} onChange={(event, value) => { console.log(JSON.stringify(value));handleInputChange("ClientNo", value);}}getOptionLabel={(e) => (e.client_name ? e.client_name : "")} defaultValue={{client_id: state.clientId,client_name: state.clientNo,}} renderInput={(params) => (<TextField {...params} label="Select Matter Clients" placeholder="Select Matter Clients"/>)}/>
          </div>
          <div className="form-group mb-2">
          <Autocomplete id="size-medium-outlined-multi" disabled={state.taskSelected !== data.label || state.typeOfTask !== "Compliance Form"} options={options2.map(({ matter_display_nbr }) =>  matter_display_nbr)} multiple onChange={(event, value) => {console.log("event, value", event, value);handleInputChange("FileNo", value);}} renderInput={(params) => (<TextField {...params} label="Select File Number" placeholder="Select File Number"/>)}/>
          </div>
          {(data.province === "ON" || data.province === "BC") && (
            <div className="form-group mb-2">
              <Autocomplete id="size-medium-outlined-multi" disabled={state.taskSelected !== data.label || state.typeOfTask !== "Compliance Form"} 
              options={state?.accountsList} 
              value={{account_name: state.clio_trust_account,bank_account_id: state.clio_trust_account_id,}} 
              onChange={(event, value) => {console.log(JSON.stringify(value));handleInputChange("cliotrustAccount", value);}} 
              getOptionLabel={(e) => (e.account_name ? e.account_name : "")}
               renderInput={(params) => (<TextField {...params} 
               label="Select Trust Account" 
               placeholder="Select Trust Account"/>)}/>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default ComplianceSelector;










