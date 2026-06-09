import React, { useState } from "react";
import RadioInput from "../LayoutComponents/RadioInput";
import { Autocomplete, TextField } from "@mui/material";
import { useTheme } from '@mui/material/styles';
import MobileStepper from '@mui/material/MobileStepper';
import Button from '@mui/material/Button';
import KeyboardArrowLeft from '@mui/icons-material/KeyboardArrowLeft';
import KeyboardArrowRight from '@mui/icons-material/KeyboardArrowRight';
import AddCircleIcon from '@mui/icons-material/AddCircle';

const ReasonofPaymentOptions = [
  { label: 'Settlement of invoices', value: 'Settlement of invoices' },
  { label: 'Return of client funds', value: 'Return of client funds' },
  { label: 'Payment to third party', value: 'Payment to third party' },
  { label: 'Other', value: 'Other' },
];

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
  complianceState,
  setcomplianceState,
  reasonofPayment,
  setreasonofPayment,
  complianceFromToDates,
  setcomplianceFromToDates,
  generalAccountList

}) => {
  const theme = useTheme();
  const [activeIndex, setActiveIndex] = useState(0);

  console.log("generalAccountListInne", generalAccountList)


  const handleNext = () => {
    setActiveIndex((prevIndex) => prevIndex + 1);
  };

  const handleBack = () => {
    setActiveIndex((prevIndex) => prevIndex - 1);
  };

  const handleAddNew = () => {
    setcomplianceState([...complianceState, { client: '', fileNumber: [] }]);
    setActiveIndex(complianceState.length);
  };


  const handleInputChangeNow = (index, field, value) => {

    if (field === 'client') {
      const newSelectBoxes = [...complianceState];
      newSelectBoxes[index]['fileNumber'] = [];
      newSelectBoxes[index][field] = value;
      console.log('ClientALlvlar', value);
      setcomplianceState(newSelectBoxes);
    } else {
      let matter_description = options2.filter((item) => {
        return value.includes(item.matter_display_nbr);
      });
      console.log('checkClientAll', matter_description);
      const newSelectBoxes = [...complianceState];
      newSelectBoxes[index][field] = matter_description;
      setcomplianceState(newSelectBoxes);
    }
  };


  return (
    <>
      <RadioInput
        onChangeFunc={() => onChangeFunc()}
        checked={state.taskSelected === data.label}
        isDisabled={isDisabled}
        name={name}
        label={data.label}
      />
      <div className={`row mt-2 ${state.taskSelected !== data.label || state.typeOfTask !== "Compliance Form" ? "d-none" : ""}`}>
        <div className="col-md-12">

          {
            data.trustAccount &&
            <div className="form-group mb-2 mt-2">
              <Autocomplete
                id="trust-account-autocomplete"
                disabled={state.taskSelected !== data.label || state.typeOfTask !== "Compliance Form"}
                options={state?.accountsList}
                value={{ account_name: state.clio_trust_account, bank_account_id: state.clio_trust_account_id }}
                onChange={(event, value) => {
                  handleInputChange("cliotrustAccount", value);
                }}
                getOptionLabel={(e) => (e.account_name ? e.account_name : "")}
                renderInput={(params) => (
                  <TextField {...params} label="Select Trust Account" placeholder="Select Trust Account" />
                )}
              />
            </div>

          }




          {/* instead of choosing reason of payment in form we enhacement this and select at creation time of compliance form */}
          {
            (data.ReasonofPayment && state.clio_trust_account) &&
            <div className="form-group mb-2 mt-2">
              <Autocomplete
                options={ReasonofPaymentOptions}
                value={reasonofPayment}
                onChange={(event, value) => {
                  setreasonofPayment(value);
                }}
                renderInput={(params) => <TextField {...params} label="Reason of Payment" />}
              />

            </div>
          }

          {
            (data.ReasonofPayment && reasonofPayment.value == ReasonofPaymentOptions[0].value) &&
            <div className="form-group mb-2 mt-2">
              <Autocomplete
                getOptionLabel={(option) => option?.label || ""}
                options={generalAccountList.map((e) => { return { label: e.name, value: { account_name: e.name, bank_account_id: e.acc_id } } })}
                // value={state.generalAccountIdINcaseofSettlement}
                onChange={(event, value) => {
                  handleInputChange("generalAccountInCaseofSettlement", value);
                }}
                renderInput={(params) => <TextField {...params} placeholder="Select Destination Account" label="Destination Account" />}
              />
            </div>

          }



          {/* if reason of payment is settlement of invoices then show from and to */}

          {
            (data.dateRange && reasonofPayment?.value) && (
              reasonofPayment?.value == ReasonofPaymentOptions[0].value && (

                <div className="d-flex mt-3 gap-4 mb-3" >
                  <div className="form-group mb-0 ">
                    <label>From</label>

                    <input
                      type="date"
                      name="task_from"
                      value={complianceFromToDates.task_from}
                      onChange={(e) => setcomplianceFromToDates({ ...complianceFromToDates, task_from: e.target.value })}
                    />

                  </div>
                  <div className="form-group mb-0">
                    <label>To</label>
                    <input
                      type="date"
                      name="task_to"
                      value={complianceFromToDates.task_to}
                      onChange={(e) => setcomplianceFromToDates({ ...complianceFromToDates, task_to: e.target.value })}
                    />
                  </div>
                </div>

              )
            )
          }



          {/* if reason of payment is not settlement of invoices then show clients and file number*/}

          {data.MatterDropdown && (
            (data.ReasonofPayment
              ? reasonofPayment?.value !== ReasonofPaymentOptions[0]?.value && reasonofPayment?.value !== "" && reasonofPayment?.value !== undefined
              : state.clio_trust_account
            ) && complianceState.map((item, index) => (
              <div key={index} className={`form-group mb-2 ${index === activeIndex ? "" : "d-none"}`}>
                <Autocomplete
                  id={`client-autocomplete-${index}`}
                  disabled={state.taskSelected !== data.label
                    || state.typeOfTask !== "Compliance Form"
                    || data.multiple === false
                  }
                  options={options}
                  value={complianceState[index].client}
                  isOptionEqualToValue={(option, value) => option === value}
                  onChange={(event, value) => {
                    handleInputChangeNow(index, 'client', value);
                    handleInputChange("ClientNo", value);
                  }}
                  getOptionLabel={(e) => (e.client_name ? e.client_name : "")}
                  renderInput={(params) => (<TextField {...params} label="Select Matter Clients" placeholder="Select Matter Clients" />)}
                />

                <Autocomplete
                  className="mt-2"
                  id={`file-number-autocomplete-${index}`}
                  disabled={state.taskSelected !== data.label
                    || state.typeOfTask !== "Compliance Form"
                    || data.multiple === false
                  }
                  options={options2.map(({ matter_display_nbr }) => matter_display_nbr)}
                  multiple={data.multiplefile}
                  onChange={(event, value) => {
                    handleInputChangeNow(index, 'fileNumber', value);
                    handleInputChange("FileNo", value);
                  }}
                  value={complianceState[index].fileNumber.matter_display_nbr}
                  renderInput={(params) => (<TextField {...params} label="Select File Number" placeholder="Select File Number" />)}
                />
              </div>
            )))
          }


          {data.MatterDropdown && Object.keys(complianceState[0].client).length !== 0 &&
            reasonofPayment?.value !== ReasonofPaymentOptions[0].value && (
              <>
                <div className="d-flex flex-row-reverse">
                  {(data.multiple === true && data.maxSelection > 1 &&
                    !(complianceState.length >= 10 && data.label === "Undisbursable Trust Money – Short Form")) &&
                    <Button size="small" onClick={handleAddNew}> {"Add client"} <AddCircleIcon /> </Button>
                  }  </div>
                <MobileStepper
                  variant="dots"
                  steps={complianceState.length}
                  position="static"
                  activeStep={activeIndex}
                  sx={{ maxWidth: 400, flexGrow: 1 }}
                  nextButton={
                    <Button size="small" onClick={handleNext} disabled={activeIndex === complianceState.length - 1}>
                      Next
                      {theme.direction === 'rtl' ? (
                        <KeyboardArrowLeft />
                      ) : (
                        <KeyboardArrowRight />
                      )}
                    </Button>
                  }
                  backButton={
                    <Button size="small" onClick={handleBack} disabled={activeIndex === 0}>
                      {theme.direction === 'rtl' ? (
                        <KeyboardArrowRight />
                      ) : (
                        <KeyboardArrowLeft />
                      )}
                      Back
                    </Button>
                  }
                />
              </>
            )
          }

        </div>
      </div>
    </>
  );
};

export default ComplianceSelector;











