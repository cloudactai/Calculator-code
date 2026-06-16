import RadioInput from "../../../components/LayoutComponents/RadioInput";
import ChildLogo from "../asssets/childLogo";
import PartiesLogo from "../asssets/PartiesLogo";
import CalculationLogo from "../asssets/CalculationLogo";
import RelationShipLogo from "../asssets/RelationShipLogo";
import React from "react";
import Dropdown from "react-dropdown";
import { DatePicker as DatePickerInput } from "@mui/x-date-pickers/DatePicker";
import InputCustom from "../../../components/InputCustom";
import { default as NumberFormat } from "react-number-format";
import { useHistory } from "react-router";

interface Screen1Props {
  typeOfCalculations: { value: string; type: string }[];
  screen1data: { calulationType: string, child: number },
  setScreen1Data: any
}




const Screen1: React.FC<Screen1Props> = ({ setScreen1Data, screen1data, typeOfCalculations }) => {

const history = useHistory();
const headings = ["#", "Name", "Birthdate", "Lives With*"];


  return (
    <>
      <div className="panel calculateType">
        <div className="pHead">
          <span className="h5">
            <CalculationLogo />
            Calculation type
          </span>
          <div className="control">
            <a className="btn btnPrimary rounded-pill" href="#">
              Upgrade to full version
            </a>
          </div>
        </div>
        <div className="pBody">
          <div className="radioGroup">
            {typeOfCalculations.map((e, index) => {
              return (
                <RadioInput
                  isDisabled={false}
                  name={e.value}
                  onChangeFunc={() => {
                    setScreen1Data({ calulationType: { type: e.value, calculatorType: e.type } })
                  }}
                  checked={screen1data?.calulationType?.type === e.value}
                  label={e.value}
                ></RadioInput>
              );
            })}
          </div>
        </div>
        <div className="pHead">

          <span className="h5">
            <PartiesLogo />
            {" "}
            Parties information
          </span>
        </div>
        <div className="pBody">
          <div className="row">
            <div className="col-md-4">
              <div className="form-group">
                <label>Name</label>
              </div>
              <div className="form-group">
                <label>Date of Birth*</label>
              </div>
              <div className="form-group">
                <label>Province* </label>
              </div>

              <div className="form-group">
                <label>Income Type* </label>
              </div>

              <div className="form-group">
                <label> Amount* </label>
              </div>

            </div>
            <div className="col-md-4">

              <div className="form-group">
                {/* <label>Province*</label> */}
                <div className="form-group">

                  <InputCustom
                    type={"text"}
                  // label={e.label}
                  // name={e.name}
                  // handleChange={(event: any) => {
                  //   state(event);
                  // }}
                  // value={e.value}
                  />


                </div>

                <div className="form-group">

                <DatePickerInput
                  //   value={e.value ? moment(e.value) : null}
                  //   onChange={(newValue) => {
                  // const eventTarget = {
                  //   target: {
                  //     value: newValue?.valueOf(),
                  //     name: e.name,
                  //   },
                  // };
                  // state(eventTarget);
                  //   }}
                  />


                </div>

                <div className="form-group">

                  <Dropdown
                    options={["ON", "AB", "BC"]}
                  />





                </div>

                <div className="form-group" >
                <Dropdown
                            // options={incomeTypeDropdown}
                            placeholder="Select Income Type"
                            // onChange={(event: any) => {
                            //   changeParty1Dropdown(event, index);
                            //   calculateAllOperationsForParty1();
                            // }}
                            // value={e.label}
                          ></Dropdown>
                </div>

                <div className="form-group" >
                <NumberFormat
                            // value={e.amount}
                            className="form-control"
                            inputMode="numeric"
                            thousandSeparator={true}
                            decimalScale={3}
                            defaultValue={0}
                            prefix={"$"}
                            // onChange={(e) => {
                            //   changeParty1Amount(e, index);
                            //   calculateAllOperationsForParty1();
                            //   calculateAllOperationsForParty2();
                            // }}
                            // onBlur={() => {
                            //   calculateChildSupport();
                            // }}
                          />
                </div>


              </div>

              {/* <input type="text" placeholder="name"/>
           <input type="text" placeholder="province"/>
           <input type="text" placeholder="dob"/> */}

            </div>
            <div className="col-md-4">

              <div className="form-group">

              <InputCustom
            type={"text"}
            // label={e.label}
            // name={e.name}
            // handleChange={(event: any) => {
            //   state(event);
            // }}
            // value={e.value}
          />


              </div>

              <div className="form-group">

              <DatePickerInput
                  //   value={e.value ? moment(e.value) : null}
                  //   onChange={(newValue) => {
                  // const eventTarget = {
                  //   target: {
                  //     value: newValue?.valueOf(),
                  //     name: e.name,
                  //   },
                  // };
                  // state(eventTarget);
                  //   }}
                  />


              </div>

              <div className="form-group">

                  <Dropdown
                    options={["ON", "AB", "BC"]}
                  />





                </div>

                <div className="form-group" >
                <Dropdown
                            // options={incomeTypeDropdown}
                            placeholder="Select Income Type"
                            // onChange={(event: any) => {
                            //   changeParty1Dropdown(event, index);
                            //   calculateAllOperationsForParty1();
                            // }}
                            // value={e.label}
                          ></Dropdown>
                </div>


                <div className="form-group" >
                <NumberFormat
                            // value={e.amount}
                            className="form-control"
                            inputMode="numeric"
                            thousandSeparator={true}
                            decimalScale={3}
                            defaultValue={0}
                            prefix={"$"}
                            // onChange={(e) => {
                            //   changeParty1Amount(e, index);
                            //   calculateAllOperationsForParty1();
                            //   calculateAllOperationsForParty2();
                            // }}
                            // onBlur={() => {
                            //   calculateChildSupport();
                            // }}
                          />
                </div>

            </div>
          </div>






         

        </div>
        <div className="pHead">
          <span className="h5">
            {/* paste here */}
            <RelationShipLogo />
            {" "}
            About Your Relationship
          </span>
        </div>
        <div className="pBody">
          <div className="row">
            <div className="col-md-4">
              <div className="form-group">
                <label>Date of Marriage/Cohabitation*</label>
              </div>
              <div className="form-group">
                <label>Date of Separation</label>
              </div>
            </div>
            <div className="col-md-4">
            <div className="form-group">
            <DatePickerInput
                  
                  />
              </div>

              <div className="form-group">
            <DatePickerInput
                  
                  />
              </div>

            


              {/* {renderInputs(aboutTheRelationshipInput, setAboutTheRelationship)} */}
            </div>
          </div>
        </div>
        {/* {typeOfCalculatorSelected !== SPOUSAL_SUPPORT_CAL && ( */}
        <>
          <div className="pHead">
            <ChildLogo />

          </div>
          <div className="pBody">
            <div className="row">
              <div className="col-md-4">
                <div className="form-group">
                  <label>Number of Children* </label>
                </div>
              </div>
              <div className="col-md-4">
              <InputCustom
                    type={"number"}
                  // label={e.label}
                  // name={e.name}
                  // handleChange={(event: any) => {
                  //   state(event);
                  // }}
                  value={1}
                  />

                {/* {renderInputs(aboutYourChildrenInput, setAboutTheChildren)} */}
              </div>
            </div>

            <div className="tableOuter noScroll secondary">
                  <table className="table customGrid">
                    <thead>
                      <tr>
                        {headings.map((e) => {
                          return e;
                        })}
                      </tr>
                    </thead>
                    <tbody>
                      {/* {rows.map((e) => e)} */}
                    </tbody>
                  </table>
                </div>


            {/* <InputCustom
                    type={"number"}
                  // label={e.label}
                  // name={e.name}
                  // handleChange={(event: any) => {
                  //   state(event);
                  // }}
                  value={1}
                  />
                   <InputCustom
                    type={"number"}
                  // label={e.label}
                  // name={e.name}
                  // handleChange={(event: any) => {
                  //   state(event);
                  // }}
                  value={1}
                  /> */}

            

            <div className="tableOuter noScroll secondary">
              <table className="table customGrid">
                <thead>
                  <tr>

                  </tr>
                </thead>
                <tbody>
                  {/* {rows.map((e) => e)} */}
                </tbody>
              </table>
            </div>
            {/* )} */}
          </div>
        </>

      </div>
      <div className="btnGroup justify-content-between">
        <button
            onClick={() => {
              history.push("/signIn");
            }}
          className="btn btnDanger blue rounded-pill"
        >
          Back to Home
        </button>
        <button
          //   onClick={calculate}
          className="btn btnPrimary blue rounded-pill"
        >
          Calculate
        </button>
      </div>
    </>
  )
}

export default Screen1