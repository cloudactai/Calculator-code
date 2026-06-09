import React, { useState } from "react";
import { Col, Container, Row } from "react-bootstrap";
import InputCustom from "../../../components/InputCustom";
import ReuseAbleCheckboxLayoutRight from "../../../components/LayoutComponents/ReuseAbleCheckboxLayoutRight/ReuseAbleCheckboxLayoutRight";
import Dropdown from "react-dropdown";
import useTable from "../../../hooks/useTable";
import ModalInputCenter from "../../../components/ModalInputCenter";
import InfoIcon from "@mui/icons-material/Info";
import OverlayTrigger from "react-bootstrap/OverlayTrigger";
import Tooltip from "react-bootstrap/Tooltip";
import SettingsIcon from "@mui/icons-material/Settings";
import {getSvg} from "../assets/Svgs"

import {
  aboutTheRelationshipState,
  aboutYourChildrenState,
  findNumberOfYearsOfFinishing,
  findNumberOfYearsOfStarting,
  showMoreOptionsState,
} from "./Screen1";
import { useHistory } from "react-router-dom";
import {
  backgroundState,
  getCalculatorIdFromQuery,
  SPOUSAL_SUPPORT_CAL,
} from "../Calculator";
import { ReactJSXElement } from "@emotion/react/types/jsx-namespace";
import useQuery from "../../../hooks/useQuery";
import DatePicker from "react-date-picker";
import { DatePicker as DatePickerInput } from "@mui/x-date-pickers/DatePicker";
import OverviewCal from "../Overview_Cal";
import {
  mapAmountFieldAndTotal,
  partyIncomeAndAmount,
} from "../screen2/Screen2";
import moment from "moment";
import { AUTH_ROUTES } from "../../../routes/Routes.types";
import CONSTANTS from "../TollTipConstants";
import CustomCheckbox from "../../../components/LayoutComponents/CustomCheckbox/CustomCheckbox";

type Props = {
  background: backgroundState;
  aboutTheChildren: aboutYourChildrenState;
  aboutTheRelationship: aboutTheRelationshipState;
  setAboutTheChildren: any;
  setBackground: any;
  setAboutTheRelationship: any;
  setBackgroundStateByObj: any;
  typeOfCalculatorSelected: string;
  setAboutTheChildrenDetails: any;
  setAboutTheChildrenStateByObj: any;
  // calpercentageRef: any;
  // setCalPercentage: any;
  specificamount: any;
  setspecificamount: any;
  editingPercentage: any;
  setEditingPercentage: any;
  editingSpecificAmount: any;
  setEditingSpecificAmount: any;
  specialExpensePercentage: any;
  setspecialExpensePercentage: any;
  incomeDetails: { party1: partyIncomeAndAmount; party2: partyIncomeAndAmount };
  lumpsum: any;
  setLumpsum: any;
  includeLumpsum: any;
  setIncludeLumpsum: any;
  lifeInsurence: any;
  setLifeInsurence: any;
  includeLifeInsurence: any;
  setIncludeLifeInsurence: any;
  updateCalPercentage:any,
  calpercentageRef:any,
};

const Screen1 = ({
  background,
  setBackground,
  aboutTheChildren,
  setAboutTheChildren,
  aboutTheRelationship,
  setAboutTheRelationship,
  setBackgroundStateByObj,
  typeOfCalculatorSelected,
  setAboutTheChildrenDetails,
  setAboutTheChildrenStateByObj,
  // calpercentageRef,
  // setCalPercentage,
  specificamount,
  setspecificamount,
  editingPercentage,
  setEditingPercentage,
  editingSpecificAmount,
  setEditingSpecificAmount,
  specialExpensePercentage,
  setspecialExpensePercentage,
  incomeDetails,
  lumpsum,
  setLumpsum,
  includeLumpsum,
  setIncludeLumpsum,
  lifeInsurence,
  setLifeInsurence,
  includeLifeInsurence,
  setIncludeLifeInsurence,
  updateCalPercentage,
  calpercentageRef,
}: Props) => {
  const headings = ["#", "Name", `Birthdate`, "Lives With*", "More Options"];
  const dateRegex = /^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d\d\d)Z$/g;
  const history = useHistory();
  const calculatorId = useQuery();

  const [showMoreOptions, setShowMoreOptions] = useState<showMoreOptionsState>({
    party1: false,
    party2: false,
    aboutTheChildrenInfo: false,
    aboutTheChildrenNumberInfo: -1,
  });
  console.log("calpercentageupper",calpercentageRef)
  console.log("calpercentageNew",calpercentageRef)
  

  const [showAlertFillAllDetails, setShowAlertFillAllDetails] = useState(false);
  const [showsettingModal, setShowsettingModal] = useState(false);

  const aboutYourChildrenInput = [
    {
      type: "number",
      label: "Number of Children",
      margin: "",
      name: "numberOfChildrenWithAdultChild",
      value: aboutTheChildren.numberOfChildrenWithAdultChild,
    },
  ];

  const types = aboutTheChildren.childrenInfo.map((e, index) => {
    return (
      <tr>
        <td>{index + 1}</td>
        <td className="form-group td">
          <InputCustom
            handleChange={(event) => {
              setAboutTheChildrenDetails(event, index, "name");
            }}
            type="text"
            classNames="form-control"
            value={aboutTheChildren.childrenInfo[index].name}
          />
        </td>
        <td className="form-group td">
          <div className="tooltipInclude">
            <OverlayTrigger
              placement="left"
              overlay={
                <Tooltip id="tooltip-left">{CONSTANTS.birth_date}</Tooltip>
              }
            >
              <InfoIcon fontSize="small" style={{ color: "grey" }} />
            </OverlayTrigger>
            <DatePickerInput
              value={
                aboutTheChildren.childrenInfo[index].dateOfBirth
                  ? moment(aboutTheChildren.childrenInfo[index].dateOfBirth)
                  : null
              }
              onChange={(newValue) => {
                const makeEvent = (val) => {
                  return { target: { value: val } };
                };
                const getBirth = moment(newValue).valueOf();
                setAboutTheChildrenDetails(
                  makeEvent(getBirth),
                  index,
                  "dateOfBirth"
                );
                setAboutTheChildrenDetails(
                  makeEvent(findNumberOfYearsOfStarting(getBirth)),
                  index,
                  "numberOfYearsOfStartingSchool"
                );
                setAboutTheChildrenDetails(
                  makeEvent(findNumberOfYearsOfFinishing(getBirth)),
                  index,
                  "numberOfYearsOfFinishingSchool"
                );
              }}
            />
          </div>
        </td>
        <td className="form-group td">
          <div className="tooltipInclude">
            <OverlayTrigger
              placement="left"
              overlay={
                <Tooltip id="tooltip-left">{CONSTANTS.live_with}</Tooltip>
              }
            >
              <InfoIcon fontSize="small" style={{ color: "grey" }} />
            </OverlayTrigger>

            <Dropdown
              onChange={(event) => {
                const details = aboutTheChildren.childrenInfo;
                details[index]["custodyArrangement"] = event.value;
                setAboutTheChildrenStateByObj({ childrenInfo: details });
              }}
              options={[
                background.party1FirstName
                  ? background.party1FirstName
                  : "Party 1",
                background.party2FirstName
                  ? background.party2FirstName
                  : "Party 2",
                "Shared",
              ]}
              value={aboutTheChildren.childrenInfo[index].custodyArrangement}
            />
          </div>
        </td>
        <td>
          <span>
            <a
              href="javascript:void(0)"
              onClick={() => {
                setShowMoreOptions({
                  ...showMoreOptions,
                  aboutTheChildrenInfo: !showMoreOptions.aboutTheChildrenInfo,
                  aboutTheChildrenNumberInfo: index,
                });
              }}
            >
              + More options
            </a>
          </span>
        </td>
      </tr>
    );
  });

  const { headers, rows } = useTable({
    headings: headings,
    data: aboutTheChildren.childrenInfo,
    isEditable: true,
    typeOfArray: types,
  });

  const aboutTheRelationshipInput = [
    {
      type: "date",
      label: "Date of Marriage/start of cohabitation*",
      tooltip: CONSTANTS.Date_of_marriage,
      margin: "1.9rem 1rem",
      name: "dateOfMarriage",
      value: aboutTheRelationship.dateOfMarriage,
    },

    {
      type: "date",
      label: "Date of Separation*",
      tooltip: CONSTANTS.Date_of_separation,
      margin: "1.9rem 1rem",
      name: "dateOfSeparation",
      value: aboutTheRelationship.dateOfSeparation,
    },
  ];

  const inputValuesParty2 = [
    {
      type: "text",
      name: "party2FirstName",
      label: "First Name",
      value: background.party2FirstName,
      margin: "1.9rem 0",
    },
    {
      type: "checkbox",
      margin: "0rem 0",
      label: "Eligible for disability tax credit",
      name: "party2eligibleForDisability",
      checked: background.party2eligibleForDisability,
    },

    // {
    //   type: "text",
    //   margin: "1.9rem 0",
    //   label: "Last Name",
    //   value: background.party2LastName,
    //   name: "party2LastName",
    // },
    {
      type: "date",
      margin: "0rem 0",
      label: "Date of Birth*",
      value: background.party2DateOfBirth,
      name: "party2DateOfBirth",
    },
  ];

  const inputValuesParty1 = [
    {
      type: "text",
      name: "party1FirstName",
      label: "First Name",
      value: background.party1FirstName,
      margin: "1.9rem 0",
    },
    {
      type: "checkbox",
      margin: "0rem 0",
      label: "Eligible for disability tax credit",
      name: "party1eligibleForDisability",
      checked: background.party1eligibleForDisability,
    },

    // },
    // {
    //   type: "text",
    //   margin: "1.9rem 0",
    //   label: "Last Name",
    //   value: background.party1LastName,
    //   name: "party1LastName",
    // },
    {
      type: "date",
      margin: "0rem 0",
      label: "Date of Birth*",
      value: background.party1DateOfBirth,
      name: "party1DateOfBirth",
    },
  ];

  const inputYesOrNoParty2 = [
    {
      heading: "Do you live in Northern Ontario",
      stateOption: "party2LiveInOntario",
      checked: background.party2LiveInOntario,
    },
    {
      heading: "Do you live in a rural or small community?",
      stateOption: "party2LiveInRural",
      checked: background.party2LiveInRural,
    },
    {
      heading:
        "Are you eligible for disability tax credit and other disability- related benefits or credit ",
      stateOption: "party2eligibleForDisability",
      checked: background.party2eligibleForDisability,
    },
    {
      heading: "Are you exempt from Canada Pension Plan?",
      stateOption: "party2ExemptFromCanadaPension",
      checked: background.party2ExemptFromCanadaPension,
    },

    {
      heading: "Are you exempt from Employment Premium?",
      stateOption: "party2ExemptFromEmploymentPremium",
      checked: background.party2ExemptFromEmploymentPremium,
    },
  ];

  const inputYesOrNoParty1 = [
    {
      heading: "Do you live in Northern Ontario",
      stateOption: "party1LiveInOntario",
      checked: background.party1LiveInOntario,
    },
    {
      heading: "Do you live in a rural or small community?",
      stateOption: "party1LiveInRural",
      checked: background.party1LiveInRural,
    },
    {
      heading:
        "Are you eligible for disability tax credit and other disability- related benefits or credit ",
      stateOption: "party1eligibleForDisability",
      checked: background.party1eligibleForDisability,
    },
    {
      heading: "Are you exempt from Canada Pension Plan?",
      stateOption: "party1ExemptFromCanadaPension",
      checked: background.party1ExemptFromCanadaPension,
    },

    {
      heading: "Are you exempt from Employment Premium?",
      stateOption: "party1ExemptFromEmploymentPremium",
      checked: background.party1ExemptFromEmploymentPremium,
    },
  ];

  const renderAllInputsParty1 = () => {
    return [
      renderInputs(inputValuesParty1, setBackground),
      provinceOfResidence(1),
      // showMoreOptions.party1 && renderYesOrNo(1, inputYesOrNoParty1),

      <p
        className="text-primary-color cursor_pointer"
        onClick={() =>
          setShowMoreOptions({
            ...showMoreOptions,
            party1: !showMoreOptions.party1,
          })
        }
      ></p>,
    ];
  };

  const renderAllInputsParty2 = () => {
    return [
      renderInputs(inputValuesParty2, setBackground),
      provinceOfResidence(2),
      // showMoreOptions.party2 && renderYesOrNo(2, inputYesOrNoParty2),
      <p
        className="text-primary-color cursor_pointer"
        onClick={() => {
          setShowMoreOptions({
            ...showMoreOptions,
            party2: !showMoreOptions.party2,
          });
        }}
      ></p>,
    ];
  };

  const numberOfChildrenLivingWithParties = () => {
    const liveWithDetails: string[] = readDropdownValues();

    const count = {
      party1: 0,
      party2: 0,
      shared: 0,
      party1WithAdultChild: 0,
      party2WithAdultChild: 0,
      sharedWithAdultChild: 0,
    };

    for (let i = 0; i < liveWithDetails.length; i++) {
      if (
        liveWithDetails[i] === "Party 1" ||
        liveWithDetails[i] === background.party1FirstName
      ) {
        count.party1++;
        count.party1WithAdultChild++;
      } else if (
        liveWithDetails[i] === "Party 2" ||
        liveWithDetails[i] === background.party2FirstName
      ) {
        count.party2++;
        count.party2WithAdultChild++;
      } else if (liveWithDetails[i] === "Shared") {
        count.shared++;
        count.sharedWithAdultChild++;
      }
    }

    return count;
  };

  const readDropdownValues = (): string[] => {
    return aboutTheChildren.childrenInfo.map(
      ({ custodyArrangement }) => custodyArrangement
    );
  };

  const areAllParty1DetailsFilled = () => {
    return (
      background.party1DateOfBirth !== "" &&
      background.party1province !== "" &&
      Boolean(background.party1DateOfBirth)
    );
  };

  const areAllParty2DetailsFilled = () => {
    const { party2DateOfBirth, party2province } = background;

    return (
      party2DateOfBirth &&
      party2province &&
      Boolean(background.party2DateOfBirth)
    );
  };

  const isLivingArrangementOfEachChild = () => {
    return aboutTheChildren.childrenInfo.every(
      (e) => e.custodyArrangement !== "" && Boolean(e.dateOfBirth)
    );
  };

  const areAllRelationshipDatesFilled = () => {
    const { dateOfMarriage, dateOfSeparation } = aboutTheRelationship;
    return dateOfMarriage && dateOfSeparation;
  };

  const allMandatoryFields = () => {
    return (
      !areAllParty1DetailsFilled() ||
      !areAllParty2DetailsFilled() ||
      !isLivingArrangementOfEachChild() ||
      !areAllRelationshipDatesFilled()
    );
  };

  const checkIfAllMandatoryValuesAreFilled = () => {
    let areDetailsFilled = true;

    if (allMandatoryFields()) {
      areDetailsFilled = false;
      setShowAlertFillAllDetails(true);
    }

    return areDetailsFilled;
  };

  const determineTypeOfSplittingAndNext = () => {
    setAboutTheChildrenStateByObj({
      count: numberOfChildrenLivingWithParties(),
    });

    if (checkIfAllMandatoryValuesAreFilled()) {
      history.push(
        `${
         AUTH_ROUTES.API_CALCULATOR
        }?id=${getCalculatorIdFromQuery(calculatorId)}&step=2`
      );
    }
  };

  const renderInputs = (fields: any, state: any): ReactJSXElement[] => {
    return fields.map((e) => {
      if (e.type === "checkbox") {
        return (
          <CustomCheckbox
            ChangeFun={ParentDisability}
            label={e.label}
            checked={e.checked === "Yes"}
            name={e.name}
          />
          // <div style={{ margin: "0px 0px 8px 0px" }}>
          //   <label style={{
          //     fontSize: "14px",
          //     fontWeight: 700,
          //     minHeight: "20px"
          //   }}>
          //     <input type={e.type}
          //       checked={e.checked === "Yes"}
          //       onChange={ParentDisability}
          //       name={e.name}
          //       style={{ margin: "0px 5px 0px 0px" }}
          //     />
          //     {" "}
          //     {/* Eligible for Disability */}
          //     {e.label}
          //   </label>
          // </div>
        );
      } else if (e.type === "date") {
        return (
          <div className="form-group">
            {e.tooltip ? (
              // <label data-toggle="tooltip" data-placement="left" title={e.tooltip} style={{cursor:"pointer" , justifyContent:"start"}}><InfoIcon fontSize='small' style={{color:"grey"}} /> {e.label}</label>

              <OverlayTrigger
                placement="left"
                overlay={<Tooltip id="tooltip-left">{e.tooltip}</Tooltip>}
              >
                <p>
                  <InfoIcon fontSize="small" style={{ color: "grey" }} />
                  {e.label}
                </p>
              </OverlayTrigger>
            ) : (
              <label>{e.label}</label>
            )}

            <DatePickerInput
              value={e.value ? moment(e.value) : null}
              onChange={(newValue) => {
                const eventTarget = {
                  target: {
                    value: newValue?.valueOf(),
                    name: e.name,
                  },
                };
                state(eventTarget);
              }}
            />
          </div>
        );
      } else {
        return (
          <InputCustom
            type={e.type}
            label={e.label}
            name={e.name}
            handleChange={(event: any) => {
              state(event);
            }}
            value={e.value}
          />
        );
      }
    });
  };

  const provinceOfResidence = (partyNumber: number) => {
    return (
      <div className="form-group">
        {/* <label data-toggle="tooltip" title={CONSTANTS.province} style={{cursor:"pointer" , justifyContent:"start"}}><InfoIcon customClass='mb-4' fontSize='small' style={{color:"grey"}}/> Province*</label> */}
        <OverlayTrigger
          placement="left"
          overlay={<Tooltip id="tooltip-left">{CONSTANTS.province}</Tooltip>}
        >
          <p>
            <InfoIcon fontSize="small" style={{ color: "grey" }} />
            Province*
          </p>
        </OverlayTrigger>

        <Dropdown
          disabled={partyNumber === 2}
          value={
            partyNumber === 1
              ? background.party1province
              : background.party2province
          }
          onChange={(event) => {
            // if (partyNumber === 1) {
            //   setBackgroundStateByObj({ party1province: event.value });
            // } else {
            //   setBackgroundStateByObj({ party2province: event.value });
            // }

            if (partyNumber === 1) {
              setBackgroundStateByObj({
                party1province: event.value,
                party2province: event.value, // Set the same value for party2province
              });
            } else {
              setBackgroundStateByObj({
                party1province: event.value, // Set the same value for party1province
                party2province: event.value,
              });
            }
          }}
          options={["ON", "AB", "BC"]}
        />
      </div>
    );
  };

  const renderYesOrNo = (
    partyNumber: number,
    fields: any
  ): ReactJSXElement[] => {
    return fields.map((e) => {
      return (
        <ReuseAbleCheckboxLayoutRight
          options={["Yes", "No"]}
          heading={e.heading}
          checked={e.checked}
          handleOnChangeEvent={(e) => setBackground(e)}
          stateOption={e.stateOption}
        />
      );
    });
  };

  const AlertFillAllDetails = () => {
    return (
      <ModalInputCenter
        heading="Please fill all details"
        handleClick={() => {
          setShowAlertFillAllDetails(false);
        }}
        changeShow={() => setShowAlertFillAllDetails(false)}
        show={showAlertFillAllDetails}
        action="Ok"
        cancelOption="Cancel"
      >
        <span className="text">
          Please fill all the details to proceed further!
        </span>
      </ModalInputCenter>
    );
  };

  const calChange = (e: any) => {
    const { name, value } = e.target;
    const value1 = parseFloat(value);

    // setCalPercentage((prev) => ({
    //   ...prev,
    //   [name]: isNaN(value1) ? 0 : value1,
    // }));

    updateCalPercentage({
      [name]: isNaN(value1) ? 0 : value1,
    });




    // const newValue = parseFloat(e.target.value);

    setEditingPercentage((prevEditingPercentage) => ({
      ...prevEditingPercentage,
      [name]: true,
    }));
    setEditingSpecificAmount((prevEditingSpecificAmount) => ({
      ...prevEditingSpecificAmount,
      [name]: false,
    }));
  };

  const calValChange = (e: any) => {
    const { name, value } = e.target;
    const value1 = parseFloat(value);

    setspecificamount((prev) => ({
      ...prev,
      [name]: isNaN(value1) ? 0 : value1,
    }));

    setEditingPercentage((prevEditingPercentage) => ({
      ...prevEditingPercentage,
      [name]: false,
    }));
    setEditingSpecificAmount((prevEditingSpecificAmount) => ({
      ...prevEditingSpecificAmount,
      [name]: true,
    }));
  };

  const SplValChange = (e) => {
    const { name, value } = e.target;

    const value1 = parseFloat(value);

    setspecialExpensePercentage((prev) => ({
      ...prev,
      [name]: isNaN(value1) ? 0 : value1,
    }));
  };

  const resetAllChanges = () => {
    // setCalPercentage({
    //   low: 40,
    //   mid: 43,
    //   high: 46,
    // });

  
    updateCalPercentage({
      low: 40,
      mid: 43,
      high: 46,
    });


    setspecificamount({
      low: 0,
      mid: 0,
      high: 0,
    });

    setspecialExpensePercentage({
      low: 0,
      mid: 0,
      high: 0,
    });

    setEditingPercentage({
      low: false,
      mid: false,
      high: false,
    });

    setEditingSpecificAmount({
      low: false,
      mid: false,
      high: false,
    });
  };

  const handleLumpsumChange = (e: any) => {
    const { name, value } = e.target;

    setLumpsum((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleLumpSumInput = (e: any) => {
    const { checked } = e.target;
    setIncludeLumpsum(checked);
  };

  const handlelifeInsurenceInput = (e: any) => {
    const { checked } = e.target;
    setIncludeLifeInsurence(checked);
  };

  const handlelifeinsurenceChange = (e: any) => {
    const { name, value } = e.target;

    setLifeInsurence((prev: any) => ({
      ...prev,
      [name]: value,
    }));
  };

  const OverWriteValuesModal = () => {
    return (
      <ModalInputCenter
        heading="Settings"
        handleClick={() => {
          setShowsettingModal(false);
        }}
        modalSize="modal-lg"
        changeShow={() => setShowsettingModal(false)}
        show={showsettingModal}
        action="Ok"
        cancelOption="Cancel"
        ResetOption="Reset"
        reset={true}
        resetAll={resetAllChanges}
      >
        <div className="row">
          <div className="tableOuter m-0">
            <table className="table customGrid">
              <thead>
                <tr>
                  <th>Type</th>
                  <th colSpan={1}>Recipient NDI %</th>
                  <th style={{ width: "180px" }} className="text-center">
                    Spousal Support Amount
                  </th>
                  <th style={{ width: "180px" }} className="text-center">
                    Special Expense %
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Low</td>
                  <td>
                    <div className="form-group">
                      <input
                        className="form-control"
                        type="text"
                        value={calpercentageRef.low}
                        onChange={calChange}
                        readOnly={editingSpecificAmount.low}
                        placeholder="low"
                        name="low"
                      />
                      {/* <p style={{color:"red"}}>this is warning</p> */}
                    </div>
                  </td>
                  <td>
                    <div className="form-group">
                      <input
                        type="text"
                        value={specificamount.low}
                        onChange={calValChange}
                        placeholder="enter-amount"
                        readOnly={editingPercentage.low}
                        name="low"
                      />
                    </div>
                  </td>

                  <td>
                    <div className="form-group">
                      <input
                        type="text"
                        value={specialExpensePercentage.low}
                        onChange={SplValChange}
                        placeholder="enter-amount"
                        name="low"
                      />
                    </div>
                  </td>
                </tr>
                <tr>
                  <td>Medium</td>
                  <td>
                    <div className="form-group">
                      <input
                        type="text"
                        readOnly={editingSpecificAmount.mid}
                        value={calpercentageRef.mid}
                        onChange={calChange}
                        placeholder="mid"
                        name="mid"
                      />
                    </div>
                  </td>
                  <td>
                    <div className="form-group">
                      <input
                        type="text"
                        readOnly={editingPercentage.mid}
                        value={specificamount.mid}
                        onChange={calValChange}
                        placeholder="enter-amount"
                        name="mid"
                      />
                    </div>
                  </td>
                  <td>
                    <div className="form-group">
                      <input
                        type="text"
                        value={specialExpensePercentage.mid}
                        onChange={SplValChange}
                        placeholder="enter-amount"
                        name="mid"
                      />
                    </div>
                  </td>
                </tr>
                <tr>
                  <td>High</td>
                  <td>
                    <div className="form-group">
                      <input
                        type="text"
                        readOnly={editingSpecificAmount.high}
                        value={calpercentageRef.high}
                        onChange={calChange}
                        placeholder="high"
                        name="high"
                      />
                    </div>
                  </td>
                  <td>
                    <div className="form-group">
                      <input
                        type="text"
                        value={specificamount.high}
                        onChange={calValChange}
                        placeholder="enter-amount"
                        name="high"
                      />
                    </div>
                  </td>
                  <td>
                    <div className="form-group">
                      <input
                        type="text"
                        readOnly={editingPercentage.high}
                        value={specialExpensePercentage.high}
                        onChange={SplValChange}
                        placeholder="enter-amount"
                        name="high"
                      />
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <div className="col-4">
            <div className="col-4"></div>
          </div>

          <div className="col-4"></div>

          <div className="col-4"></div>

          <div className="row mt-4">
            <div className="col-4 d-flex align-items-center">
              <CustomCheckbox
                checked={includeLumpsum}
                label={"Include Lump Sum(NPV)"}
                ChangeFun={handleLumpSumInput}
              />
              {/* <input type="checkbox"></input> */}
              {/* <h6>Include Lump Sum(NPV)</h6> */}
            </div>
            <div className="col-4">
              <div className="form-group">
                <input
                  className="form-control"
                  value={lumpsum.duration}
                  onChange={handleLumpsumChange}
                  name="duration"
                  type="text"
                  placeholder="Automatic calculated"
                />
              </div>
            </div>

            <div className="col-4">
              <div className="form-group">
                <input
                  className="form-control"
                  value={lumpsum.discount_rate}
                  onChange={handleLumpsumChange}
                  name="discount_rate"
                  type="text"
                  placeholder="Discount rate"
                />
              </div>
            </div>
          </div>

          <div className="row mt-4">
            <div className="col-4 d-flex align-items-center">
              <CustomCheckbox
                checked={includeLifeInsurence}
                label={"Include Life Insurance"}
                ChangeFun={handlelifeInsurenceInput}
              />
              {/* <input type="checkbox"></input> */}
              {/* <h6>Include Lump Sum(NPV)</h6> */}
            </div>
            <div className="col-4">
              <div className="form-group">
                <input
                  className="form-control"
                  value={lifeInsurence.duration}
                  onChange={handlelifeinsurenceChange}
                  name="duration"
                  type="text"
                  placeholder="Automatic calculated"
                />
              </div>
            </div>

            <div className="col-4">
              <div className="form-group">
                <input
                  className="form-control"
                  value={lifeInsurence.discount_rate}
                  onChange={handlelifeinsurenceChange}
                  name="discount_rate"
                  type="text"
                  placeholder="Discount rate"
                />
              </div>
            </div>

            <div className="col-4">
              <div className="form-group">
                <input
                  className="form-control"
                  value={lifeInsurence.age_till_child_support_pay}
                  onChange={handlelifeinsurenceChange}
                  name="age_till_child_support_pay"
                  type="text"
                  placeholder="Age till child support pay"
                />
              </div>
            </div>
          </div>
        </div>
      </ModalInputCenter>
    );
  };

  const ParentDisability = (event: any) => {
    setBackground(event);
  };

  return (
    <>
      <span
        style={{ marginTop: "-30px" }}
        className="text ms-auto d-flex align-items-center cursor-pointer"
        onClick={() => setShowsettingModal(true)}
      >
        <SettingsIcon />
        &nbsp; Setting
        Api Version
      </span>

      {/* overWrite modal is used to overwrite values like specific amount , percentage  and specialexpense percentage . */}
      {showsettingModal && OverWriteValuesModal()}

      <div className="panel">
        {/* <OverviewCal screen1={{background, aboutTheChildren, aboutTheRelationship,}} incomeDetails={{party1: mapAmountFieldAndTotal(incomeDetails.party1), party2: mapAmountFieldAndTotal(incomeDetails.party2), }} taxDetails={{ party1: 0, party2: 0 }}/> */}
        <div className="pHead">
            
          <span className="h5">
            {getSvg('background')}
           
            Background
          </span>
        </div>
        <div className="pBody">
          <div className="row">
            <div className="col-md-6">
              {/* {background.party1FirstName ? background.party1FirstName : "Party 1"} */}
              {renderAllInputsParty1().map((e) => {
                return e;
              })}
            </div>
            <div className="col-md-6">
              {/* {background.party2FirstName ? background.party2FirstName : "Party 2"} */}
              {renderAllInputsParty2().map((e) => {
                return e;
              })}
            </div>
          </div>

          {showAlertFillAllDetails && AlertFillAllDetails()}

          {showMoreOptions.aboutTheChildrenInfo && (
            <ModalInputCenter
              heading="More Options"
              modalSize="modal-lg"
              show={showMoreOptions.aboutTheChildrenInfo}
              handleClick={() => {}}
              changeShow={() =>
                setShowMoreOptions({
                  ...showMoreOptions,
                  aboutTheChildrenInfo: !showMoreOptions.aboutTheChildrenInfo,
                })
              }
              cancelOption="Ok"
            >
              <div className="row">
                <div className="col-md-6">
                  <div className="form-group">
                    <label>Child Income</label>
                    <input
                      className="form-control"
                      onChange={(event) => {
                        setAboutTheChildrenDetails(
                          event,
                          showMoreOptions.aboutTheChildrenNumberInfo,
                          "childIncome"
                        );
                      }}
                      type="number"
                      max="17"
                      value={
                        aboutTheChildren.childrenInfo[
                          showMoreOptions.aboutTheChildrenNumberInfo
                        ].childIncome
                      }
                    />
                  </div>
                  {aboutTheChildren.childrenInfo[
                    showMoreOptions.aboutTheChildrenNumberInfo
                  ].CSGTable === "Yes" && (
                    <div className="form-group">
                      <label>
                        <span>
                          Child Support Override{" "}
                          <span className="fw-bold">(Per Month)</span>
                        </span>
                      </label>
                      <input
                        type="number"
                        onChange={(event) =>
                          setAboutTheChildrenDetails(
                            event,
                            showMoreOptions.aboutTheChildrenNumberInfo,
                            "ChildSupportOverride"
                          )
                        }
                        className="form-control"
                        value={
                          aboutTheChildren.childrenInfo[
                            showMoreOptions.aboutTheChildrenNumberInfo
                          ].ChildSupportOverride
                        }
                      />
                    </div>
                  )}
                  <div className="form-group">
                    <label>Number of years Of Starting School</label>
                    <input
                      type="number"
                      onChange={(event) =>
                        setAboutTheChildrenDetails(
                          event,
                          showMoreOptions.aboutTheChildrenNumberInfo,
                          "numberOfYearsOfStartingSchool"
                        )
                      }
                      value={
                        aboutTheChildren.childrenInfo[
                          showMoreOptions.aboutTheChildrenNumberInfo
                        ].numberOfYearsOfStartingSchool
                      }
                      className="form-control"
                    />
                  </div>
                  <div className="form-group">
                    <label>Number of years Of Finishing School</label>
                    <input
                      onChange={(event) =>
                        setAboutTheChildrenDetails(
                          event,
                          showMoreOptions.aboutTheChildrenNumberInfo,
                          "numberOfYearsOfFinishingSchool"
                        )
                      }
                      type="number"
                      max="17"
                      value={
                        aboutTheChildren.childrenInfo[
                          showMoreOptions.aboutTheChildrenNumberInfo
                        ].numberOfYearsOfFinishingSchool
                      }
                      className="form-control"
                    />
                  </div>
                </div>
                <div className="col-md-6">
                  <ReuseAbleCheckboxLayoutRight
                    handleOnChangeEvent={(e) => {
                      setAboutTheChildrenDetails(
                        e,
                        showMoreOptions.aboutTheChildrenNumberInfo,
                        "childOfRelationship"
                      );
                    }}
                    stateOption="childOfRelationship"
                    options={["Yes", "No"]}
                    heading="Child of relationship"
                    checked={
                      aboutTheChildren.childrenInfo[
                        showMoreOptions.aboutTheChildrenNumberInfo
                      ].childOfRelationship
                    }
                  ></ReuseAbleCheckboxLayoutRight>
                  <ReuseAbleCheckboxLayoutRight
                    options={["Yes", "No"]}
                    handleOnChangeEvent={(e) => {
                      setAboutTheChildrenDetails(
                        e,
                        showMoreOptions.aboutTheChildrenNumberInfo,
                        "childHasDisability"
                      );
                    }}
                    label="childHasDisability"
                    heading="Child is eligible to disability benefit"
                    checked={
                      aboutTheChildren.childrenInfo[
                        showMoreOptions.aboutTheChildrenNumberInfo
                      ].childHasDisability
                    }
                  ></ReuseAbleCheckboxLayoutRight>
                  <ReuseAbleCheckboxLayoutRight
                    options={["Yes", "No"]}
                    label="adultChildStillALegalDependant"
                    handleOnChangeEvent={(e) => {
                      setAboutTheChildrenDetails(
                        e,
                        showMoreOptions.aboutTheChildrenNumberInfo,
                        "adultChildStillALegalDependant"
                      );
                    }}
                    checked={
                      aboutTheChildren.childrenInfo[
                        showMoreOptions.aboutTheChildrenNumberInfo
                      ].adultChildStillALegalDependant
                    }
                    heading="Adult Child is Still a legal Dependant ?"
                  ></ReuseAbleCheckboxLayoutRight>
                  <ReuseAbleCheckboxLayoutRight
                    options={["Yes", "No"]}
                    label="CSGTable"
                    handleOnChangeEvent={(e) => {
                      setAboutTheChildrenDetails(
                        e,
                        showMoreOptions.aboutTheChildrenNumberInfo,
                        "CSGTable"
                      );
                    }}
                    checked={
                      aboutTheChildren.childrenInfo[
                        showMoreOptions.aboutTheChildrenNumberInfo
                      ].CSGTable
                    }
                    heading="Override CSG table for Adult Child"
                  ></ReuseAbleCheckboxLayoutRight>
                </div>
              </div>
            </ModalInputCenter>
          )}
          <div className="pHead">
            <span className="h5">
              {getSvg("About Your Relationship")}
             
              About Your Relationship
            </span>
          </div>
          <div className="doubleForm">
            {/* <p data-toggle="tooltip" data-placement="left" title={CONSTANTS.Date_of_marriage} style={{cursor:"pointer"}}><InfoIcon fontSize='small' style={{color:"grey"}} /></p> */}

            {renderInputs(aboutTheRelationshipInput, setAboutTheRelationship)}
            {/* <p data-toggle="tooltip" data-placement="left" title={CONSTANTS.Date_of_separation} style={{cursor:"pointer"}}><InfoIcon fontSize='small' style={{color:"grey"}}/></p> */}
          </div>
          {typeOfCalculatorSelected !== SPOUSAL_SUPPORT_CAL && (
            <>
              <div className="pHead">
                <span className="h5">
                  {/* <p data-toggle="tooltip" data-placement="left" title={CONSTANTS.About_child} style={{cursor:"pointer"}}><InfoIcon fontSize='small' style={{color:"grey"}}/></p> */}
                  <OverlayTrigger
                    placement="left"
                    overlay={
                      <Tooltip id="tooltip-left">
                        {CONSTANTS.About_child}
                      </Tooltip>
                    }
                  >
                    <InfoIcon fontSize="small" style={{ color: "grey" }} />
                  </OverlayTrigger>
                  {getSvg("About Your Children")}
                  About Your Children
                 
                </span>
              </div>
              <div className="doubleForm">
                {renderInputs(aboutYourChildrenInput, setAboutTheChildren)}
              </div>
              {aboutTheChildren.numberOfChildrenWithAdultChild > 0 && (
                <div className="tableOuter noScroll secondary">
                  <table className="table customGrid">
                    <thead>
                      <tr>
                        {/* <p data-toggle="tooltip" data-placement="left" title={CONSTANTS.birth_date} style={{cursor:"pointer"}}><InfoIcon/></p> */}
                        {headers.map((e) => {
                          return e;
                        })}
                      </tr>
                    </thead>
                    <tbody>{rows.map((e) => e)}</tbody>
                  </table>
                </div>
              )}
            </>
          )}
        </div>
      </div>
      <div className="btnGroup">
        <button
          className="btn btnPrimary rounded-pill"
          onClick={() =>
            history.push(
              AUTH_ROUTES.API_SUPPORT_CALCULATOR
            )
          }
        >
          Back
        </button>
        <button
          onClick={determineTypeOfSplittingAndNext}
          className="btn btnPrimary rounded-pill"
        >
          Next
        </button>
      </div>
    </>
  );
};

export default Screen1;
