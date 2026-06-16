import { useState, useRef } from "react";
import InputCustom from "../../../components/InputCustom";
import ReuseAbleCheckboxLayoutRight from "../../../components/LayoutComponents/ReuseAbleCheckboxLayoutRight/ReuseAbleCheckboxLayoutRight";
import Dropdown from "react-dropdown";
import useTable from "../../../hooks/useTable";
import ModalInputCenter from "../../../components/ModalInputCenter";
import RadioInput from "../../../components/LayoutComponents/RadioInput";
import moment from "moment";
import { getSvg } from "../AssetsFreeCalculator/Svg"

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
  SPOUSAL_SUPPORT_CAL,
  CHILD_SUPPORT_CAL,
  CHILD_AND_SPOUSAL_SUPPORT_CAL,
} from "../Calculator";
import { ReactJSXElement } from "@emotion/react/types/jsx-namespace";
import useQuery from "../../../hooks/useQuery";
import { DatePicker as DatePickerInput } from "@mui/x-date-pickers/DatePicker";

import {
  partyIncomeAndAmount,
} from "../screen2/Screen2";
import Screen2 from "../screen2/Screen2.tsx";

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
  incomeDetails: { party1: partyIncomeAndAmount; party2: partyIncomeAndAmount };
  props: any;
  setSelectedType: any;
  selectedType: any;
  setLoading: any;
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
  incomeDetails,
  props,
  setSelectedType,
  selectedType,
  setLoading,
}: Props) => {
  const headings = ["#", "Name", "Birthdate", "Lives With*"];
  const dateRegex = /^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d\d\d)Z$/g;
  const history = useHistory();
  const calculatorId = useQuery();

  const [showMoreOptions, setShowMoreOptions] = useState<showMoreOptionsState>({
    party1: false,
    party2: false,
    aboutTheChildrenInfo: false,
    aboutTheChildrenNumberInfo: -1,
  });

  const [showAlertFillAllDetails, setShowAlertFillAllDetails] = useState(false);
  const myBtnRef = useRef(null);

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
          {/* <DatePicker
            dayPlaceholder="DD"
            monthPlaceholder="MM"
            yearPlaceholder="YY"
            format="dd/ MM/ yy"
            minDate={new Date("December 17, 1901 00:00:00")}
            maxDate={new Date("December 17, 2300 00:00:00")}
            onChange={(event) => {
              const makeEvent = (val) => {
                return { target: { value: val } };
              };
              const getBirth = new Date(event).getTime();
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
            name={e.name}
            value={
              aboutTheChildren.childrenInfo[index].dateOfBirth
                ? new Date(aboutTheChildren.childrenInfo[index].dateOfBirth)
                : ""
            }
          /> */}

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
        </td>
        <td className="form-group td">
          <Dropdown
            onChange={(event) => {
              const details = aboutTheChildren.childrenInfo;
              details[index]["custodyArrangement"] = event.value;
              setAboutTheChildrenStateByObj({
                childrenInfo: details,
                count: numberOfChildrenLivingWithParties(),
              });
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
        </td>
        {/* <td>
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
        </td> */}
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
      margin: "1.9rem 1rem",
      name: "dateOfMarriage",
      value: aboutTheRelationship.dateOfMarriage,
    },

    {
      type: "date",
      label: "Date of Separation*",
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
      type: "date",
      margin: "0rem 0",
      label: "Date of Birth*",
      value: background.party2DateOfBirth,
      name: "party2DateOfBirth",
    },
  ];

  const typeOfCalculations = [
    {
      value: "Child Support",
      type: CHILD_SUPPORT_CAL,
    },
    {
      value: "Spousal Support",
      type: SPOUSAL_SUPPORT_CAL,
    },
    {
      value: "Child and Spousal Support",
      type: CHILD_AND_SPOUSAL_SUPPORT_CAL,
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
      type: "date",
      margin: "0rem 0",
      label: "Date of Birth*",
      value: background.party1DateOfBirth,
      name: "party1DateOfBirth",
    },
  ];

  const renderAllInputsParty1 = () => {
    return [
      renderInputs(inputValuesParty1, setBackground),
      provinceOfResidence(1),

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


  const renderInputs = (fields: any, state: any): ReactJSXElement[] => {
    return fields.map((e) => {
      if (e.type === "date") {
        return (
          <div className="form-group">

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
              console.log("event--", e);
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
        {/* <label>Province*</label> */}
        <Dropdown
          value={
            partyNumber === 1
              ? background.party1province
              : background.party2province
          }
          onChange={(event) => {


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

  const calculate = () => {

    setLoading(true);

    setTimeout(() => {
      setLoading(false);
    }, 1000);

    myBtnRef?.current?.click();
  };

  return (
    <>
      <div className="panel calculateType">
        <div className="pHead">
          <span className="h5">{
            getSvg('Calculation type')
          }

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
                    setSelectedType({ type: e.value, calculatorType: e.type });
                  }}
                  checked={selectedType.type === e.value}
                  label={e.value}
                ></RadioInput>
              );
            })}
          </div>
        </div>
        <div className="pHead">
          <span className="h5">
            {
              getSvg('Parties information')
            }

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
            </div>
            <div className="col-md-4">
              {/* {background.party1FirstName ? background.party1FirstName : "Party 1"} */}
              {renderAllInputsParty1().map((e) => {
                return e;
              })}
            </div>
            <div className="col-md-4">
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
              handleClick={() => { }}
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
                    heading="Child Has Disability"
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
        </div>
        <Screen2 {...props} setLoading={setLoading} myBtnRef={myBtnRef} />
        <div className="pHead">
          <span className="h5">
            {
              getSvg('About Your Relationship')
            }

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
              {renderInputs(aboutTheRelationshipInput, setAboutTheRelationship)}
            </div>
          </div>
        </div>
        {typeOfCalculatorSelected !== SPOUSAL_SUPPORT_CAL && (
          <>
            <div className="pHead">
              <span className="h5">
                {getSvg('About Your Children')}
                About Your Children
              </span>
            </div>
            <div className="pBody">
              <div className="row">
                <div className="col-md-4">
                  <div className="form-group">
                    <label>Number of Children* </label>
                  </div>
                </div>
                <div className="col-md-4">
                  {renderInputs(aboutYourChildrenInput, setAboutTheChildren)}
                </div>
              </div>
              {aboutTheChildren.numberOfChildrenWithAdultChild > 0 && (
                <div className="tableOuter noScroll secondary">
                  <table className="table customGrid">
                    <thead>
                      <tr>
                        {headers.map((e) => {
                          return e;
                        })}
                      </tr>
                    </thead>
                    <tbody>{rows.map((e) => e)}</tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}
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
          onClick={calculate}
          className="btn btnPrimary blue rounded-pill"
        >
          Calculate
        </button>
      </div>

    </>
  );
};

export default Screen1;
