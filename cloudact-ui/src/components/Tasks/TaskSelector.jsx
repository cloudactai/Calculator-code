import React, { useState } from "react";
import RadioInput from "../LayoutComponents/RadioInput";
import PropTypes from "prop-types";
import Dropdown from "react-dropdown";
import { last12Months } from "../../utils/helpers";

const TaskSelector = ({
  checked,
  onChangeFunc,
  taskType,
  account,
  onChangeDropFunc,
  value,
  isDisabled,
  onChangeFromToDate,
  FromTovalue,
  onChangeGetAccountId,
}) => {
  const monthDropdown = last12Months();
  const filterAccountValues = account.map(option => ({
    value: option.name,
    account_id: option.account_id
}));


const handleGetid = (element)=>{

  onChangeDropFunc("account", element.value, taskType)

  const selectedAccount = account.find(option => option.name === element.value);
        if (selectedAccount) {
          onChangeGetAccountId(selectedAccount.account_id);
        }


}


  return (
    <>
      <RadioInput isDisabled={isDisabled} name="TypeOfAccount" onChangeFunc={() => onChangeFunc()} checked={checked} label={taskType} />
      <div className={`row mt-2 ${isDisabled || !checked ? "d-none" : ""}`}>
        <div className="col-md-6">
          <div className="form-group mb-2">

          

            <label>Month</label>
            <Dropdown placeholder="Month"
              onChange={(e) => onChangeDropFunc("month", e.value, taskType)}
              value={value("month", taskType)}
              disabled={isDisabled || !checked}
              options={monthDropdown}
            />


          <div className="d-flex mt-3 gap-4" >
          <div className="form-group mb-0 ">
          <label>From</label>
          <input
            type="date"
            name="task_from"
            onChange={(e) => onChangeFromToDate(e)}
            value={FromTovalue.task_from}

           
          />
        </div>
        <div className="form-group mb-0">
          <label>To</label>
          <input
            type="date"
            name="task_to"
            onChange={(e) => onChangeFromToDate(e)}
            value={FromTovalue.task_to}
          />
        </div>
          </div>
          
          </div>
        </div>
        <div className="col-md-6">
          <div className="form-group mb-2">
            <label>Account</label>
            <Dropdown
              placeholder="Account"
              options={filterAccountValues}
              onChange={(e) => handleGetid(e)}
              // value={amountValue}
              disabled={isDisabled || !checked}
            />
          </div>
        </div>
      </div>
    </>
  );
};

TaskSelector.propTypes = {
  account: PropTypes.array.isRequired,
  taskType: PropTypes.string.isRequired,
};

export default TaskSelector;
