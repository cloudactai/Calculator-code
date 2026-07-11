import { useState, useEffect, useRef, useCallback } from "react";

import Accordion from "react-bootstrap/Accordion";
import { useHistory, useLocation, useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";

import Layout from "../../components/LayoutComponents/Layout";

// The *Simple form components pre-fill saved data and emit the exact per-section
// shapes the auth-server accepts — reused here so the intake accordion hydrates
// and saves as you go.
import BackgroundInformationSimple from "./BackgroundInformationSimple";
import CourtInformationSimple from "./CourtInformationSimple";
import ChildrenInformationSimple from "./ChildrenInformationSimple";
import RelationshipInformationSimple from "./RelationshipInformationSimple";
import EmploymentDetailsSimple from "./EmploymentDetailsSimple";
import IncomeAndBenefitsSimple from "./IncomeAndBenefitsSimple";
import ExpensesSimple from "./ExpensesSimple";
import AssetsSimple from "./AssetsSimple";
import DebtsAndLiabilitiesSimple from "./DebtsAndLiabilitiesSimple";
import OtherPersonsInHouseholdSimple from "./OtherPersonsInHouseholdSimple";
import FinancialSummary from "./FinancialSummary";

import background_information from "../../assets/images/background_information.svg";
import court_information from "../../assets/images/court_information.svg";
import children_information from "../../assets/images/children_information.svg";
import relationship_information from "../../assets/images/relationship_information.svg";
import employment_details from "../../assets/images/employment_details.svg";
import income_and_benefits from "../../assets/images/income_and_benefits.svg";
import expenses_icon from "../../assets/images/expenses.svg";
import assets_icon from "../../assets/images/assets.svg";
import debts_and_liabilities from "../../assets/images/debts_and_liabilities.svg";
import other_persons_in_household from "../../assets/images/other_persons_in_household.svg";
import {
  saveMatter,
  saveMatterReset,
} from "../../utils/Apis/matters/saveMatterInformation/saveMattersActions";
import {
  updateMatterData,
  updateMatterReset,
} from "../../utils/Apis/matters/updateMatters/updateMatterDataActions";
import { selectMatterUpdateData } from "../../utils/Apis/matters/updateMatters/updateMatterDataSelectors";
import {
  getSingleMatter,
} from "../../utils/Apis/matters/getSingleMatter/getSingleMattersActions";
import { selectSingleMatterData } from "../../utils/Apis/matters/getSingleMatter/getSingleMattersSelectors";
import {
  requiredFields,
  validateForm,
} from "../../utils/matterValidations/formValidations";
import CustomDrawer from "../../components/Matters/CustomDrawer/CustomDrawer";
import {
  selectSaveMatterData,
  selectSaveMatterDataLoading,
} from "../../utils/Apis/matters/saveMatterInformation/saveMattersSelector";
import Loader from "../../components/Loader";
import toast from "react-hot-toast";

const FiveStepsPage = () => {
  const { id } = useParams();
  const location = useLocation();
  const locationMatterData = location.state;
  const { response } = useSelector((state) => state.userProfileInfo);
  const singleMatterRedux = useSelector(selectSingleMatterData);
  const dispatch = useDispatch();

  // If we arrived without location.state (e.g. from Task List), fetch the matter
  useEffect(() => {
    if (!locationMatterData) {
      dispatch(getSingleMatter(id));
    }
  }, [dispatch, id, locationMatterData]);

  // Build matterData from either location state or the fetched single matter
  const matterData = locationMatterData || (singleMatterRedux?.body?.[0]
    ? {
        province: singleMatterRedux.body[0].province,
        clientName: singleMatterRedux.body[0].client_id,
        matterNumber: singleMatterRedux.body[0].matterNumber,
        clientRole: singleMatterRedux.body[0].clientRole,
        childrenInvolved: singleMatterRedux.body[0].childrenInvolved,
      }
    : null);
  const [progress, setProgress] = useState({});
  const [whichOpen, setWhichOpen] = useState("Background");
  const [formErrors, setFormErrors] = useState({});
  const [isFinishDisabled, setIsFinishDisabled] = useState(true);
  const [formsData, setFormsData] = useState({});

  // --- Save-as-you-go via the *Simple form components ---
  const [sectionData, setSectionData] = useState({}); // latest emitted body, keyed by type
  const [bgInfoActiveTab, setBgInfoActiveTab] = useState("Client");
  const [childActiveTab, setChildActiveTab] = useState(null);
  const [empActiveTab, setEmpActiveTab] = useState("Client");
  const [incomeActiveTab, setIncomeActiveTab] = useState("Client");
  const [expensesActiveTab, setExpensesActiveTab] = useState("Client");
  const touchedRef = useRef(false); // true once the user edits anything
  const saveTimers = useRef({});

  const [loading, setLoading] = useState(false);
  const history = useHistory();
  const fieldRequired = requiredFields();

  const renderRequiredFields = (fields) => {
    return Object.keys(fields).map((category) => {
      const categoryData = fields[category];
      return (
        <div key={category}>
          <h3 className="title">{category}</h3>
          <ul>
            {Object.keys(categoryData).map((subCategoryOrField) => {
              if (typeof categoryData[subCategoryOrField] === "object") {
                // Subcategory
                return (
                  <li key={subCategoryOrField}>
                    <h4 className="subcategory">{subCategoryOrField}</h4>
                    <ul>
                      {Object.entries(categoryData[subCategoryOrField]).map(
                        ([fieldName, isRequired]) => (
                          <li key={fieldName} className="fields">
                            {fieldName}:{" "}
                            {isRequired ? "Required" : "Not Required"}
                          </li>
                        )
                      )}
                    </ul>
                  </li>
                );
              } else {
                // Field
                return (
                  <li key={subCategoryOrField} className="fields">
                    {subCategoryOrField}:{" "}
                    {categoryData[subCategoryOrField]
                      ? "Required"
                      : "Not Required"}
                  </li>
                );
              }
            })}
          </ul>
        </div>
      );
    });
  };

  function RefreshButton() {
    setLoading(true);
    window.location.reload();
  }

  // Each section auto-saves on its own, so Finish just returns to the matter.
  useEffect(() => {
    setIsFinishDisabled(false);
  }, []);

  // Clear the auto-save result after each per-section save so a stale "saved"
  // state doesn't leak back to the matter page (which would toast on return).
  const updateMatterResult = useSelector(selectMatterUpdateData);
  useEffect(() => {
    if (updateMatterResult) {
      dispatch(updateMatterReset());
    }
  }, [updateMatterResult, dispatch]);

  // The sections rendered in the timeline + accordion.
  const SECTIONS = [
    { key: "Background", type: "background", title: "Background information", icon: background_information, Comp: BackgroundInformationSimple, extra: { bgInfoActiveTab, setBgInfoActiveTab } },
    { key: "Court", type: "courtInfo", title: "Court information", icon: court_information, Comp: CourtInformationSimple, extra: {} },
    { key: "Children", type: "children", title: "Children information", icon: children_information, Comp: ChildrenInformationSimple, extra: { activeTab: childActiveTab, setActiveTab: setChildActiveTab } },
    { key: "Relationship", type: "relationship", title: "Relationship information", icon: relationship_information, Comp: RelationshipInformationSimple, extra: {} },
    { key: "EmploymentDetails", type: "employment", title: "Employment details", icon: employment_details, Comp: EmploymentDetailsSimple, extra: { activeTab: empActiveTab, setActiveTab: setEmpActiveTab } },
    { key: "IncomeAndBenefits", type: "incomeBenefits", title: "Income and benefits", icon: income_and_benefits, Comp: IncomeAndBenefitsSimple, extra: { activeTab: incomeActiveTab, setActiveTab: setIncomeActiveTab } },
    { key: "Expenses", type: "expenses", title: "Expenses", icon: expenses_icon, Comp: ExpensesSimple, extra: { activeTab: expensesActiveTab, setActiveTab: setExpensesActiveTab } },
    { key: "Assets", type: "assets", title: "Assets", icon: assets_icon, Comp: AssetsSimple, extra: {} },
    { key: "DebtsAndLiabilities", type: "debtsLiabilities", title: "Debts and Liabilities", icon: debts_and_liabilities, Comp: DebtsAndLiabilitiesSimple, extra: {} },
    { key: "OtherPersonsInHousehold", type: "otherPersons", title: "Other persons in Household", icon: other_persons_in_household, Comp: OtherPersonsInHouseholdSimple, extra: {} },
  ];

  // Whether a section's required fields are filled (drives the "done" bar).
  const partyComplete = (p) =>
    !!p &&
    ["role", "province", "name", "postalCode", "phone", "address", "email"].every(
      (f) => p[f] && String(p[f]).trim()
    );
  const SECTION_COMPLETE = {
    background: (b) =>
      partyComplete(b?.background?.client) && partyComplete(b?.background?.opposingParty),
    courtInfo: (b) => !!(b?.courtInfo?.name && String(b.courtInfo.name).trim()),
    children: (b) =>
      Array.isArray(b?.children) &&
      b.children.some((c) => c?.childName && String(c.childName).trim()),
    relationship: (b) =>
      !!(b?.relationship?.data?.dateOfMarriage || b?.relationship?.data?.startedLivingTogether),
    employment: (b) => !!b?.employment?.data?.client?.employmentStatus,
    incomeBenefits: (b) => !!b?.incomeBenefits?.financialYear,
    expenses: (b) => !!b?.expenses?.data?.financialYear,
    assets: (b) => !!b?.assets?.valuation_date,
    debtsLiabilities: (b) =>
      Array.isArray(b?.debtsLiabilities) &&
      b.debtsLiabilities.some((d) => d?.category && String(d.category).trim()),
    otherPersons: (b) => !!b?.otherPersons?.live_alone,
  };
  const isComplete = (type) => {
    try {
      return !!SECTION_COMPLETE[type]?.(sectionData[type]);
    } catch {
      return false;
    }
  };

  // Each *Simple form reports its section body here. Store it, and once the user
  // has actually interacted, auto-save that section (debounced).
  // Stable identity (useCallback) is essential: several forms list this in their
  // effect deps, so a new reference each render would loop infinitely.
  const onUpdateFormData = useCallback(
    (body) => {
      if (!body?.type) return;
      setSectionData((prev) => ({ ...prev, [body.type]: body }));
      if (!touchedRef.current) return;
      clearTimeout(saveTimers.current[body.type]);
      saveTimers.current[body.type] = setTimeout(() => {
        dispatch(updateMatterData({ type: body.type, matter_id: id, data: body }));
      }, 800);
    },
    [dispatch, id]
  );

  /**
   * Handle Accordion Open
   * This is the function to handle the accordion open
   */
  const handleAccordionOpen = (e) => {
    //
    //
  };

  /**
   * Handle Finish
   * This is the function to handle the finish button
   */
  const handleFinish = () => {
    // Everything is already auto-saved per section; just go back to the matter.
    history.push(`/single-matter/${id}`);
  };

  const selectSavedMatterData = useSelector(selectSaveMatterData);

  const selectSavedMatterDataLoading = useSelector(selectSaveMatterDataLoading);

  useEffect(() => {
    if (selectSavedMatterData) {
      toast.success("Data Successfully Saved", {
        position: "top-right",
        style: {
          borderRadius: "10px",
          background: "#FFF",
          color: "#000",
        },
      });
      setLoading(false);
      dispatch(saveMatterReset());
      history.push(`/single-matter/${id}`);
    }
  }, [selectSavedMatterData, selectSavedMatterDataLoading]);

  return (
    <>
      {loading ? (
        <Loader isLoading={loading} />
      ) : (
        <Layout
          title={`Welcome ${response?.username ? response?.username : ""} `}
        >
          <div className="panel trans pt-4 five-steps-page">
            {/* Action Bar */}
            <div className="row">
              <div className="col-12 col-md-3"></div>
              <div className="col-12 col-md-9 d-flex justify-content-between align-items-center">
                <div
                  className="d-flex justify-content-between align-items-center"
                  style={{ gap: "90px" }}
                >
                  <div
                    style={{
                      fontWeight: "800",
                    }}
                  >
                    Client Name:
                    <span
                      style={{
                        fontWeight: "600",
                        marginLeft: "10px",
                      }}
                    >
                      {matterData?.clientName}
                    </span>
                  </div>
                  <div
                    style={{
                      fontWeight: "800",
                    }}
                  >
                    Matter Number:
                    <span
                      style={{
                        fontWeight: "600",
                        marginLeft: "10px",
                      }}
                    >
                      {id}
                    </span>
                  </div>
                </div>
                <div
                  className="d-flex justify-content-between align-items-center"
                  style={{ gap: "30px" }}
                >
                  <button
                    data-bs-toggle="offcanvas"
                    data-bs-target="#offcanvasRight"
                    aria-controls="offcanvasRight"
                    className="btn btnPrimary rounded-pill"
                  >
                    Required Fields
                  </button>
                  <button
                    to={"/matters/single-matter"}
                    className="btn btnPrimary rounded-pill"
                    disabled
                  >
                    Share
                  </button>
                  <button
                    onClick={RefreshButton}
                    className="btn btnPrimary rounded-pill"
                  >
                    Refresh Information
                  </button>
                </div>
              </div>
            </div>

            <div className="pBody">
              <div className="row matterType">
                <div className="col-12 col-md-3 sidebar">
                  <p className="text">
                    Based on your legal matter, we will require you to fill out
                    the information in below sections:
                  </p>

                  <div className="timeline">
                    <div className="status-line"></div>
                    <div className="items">
                      {SECTIONS.map((s) => (
                        <div
                          key={s.key}
                          className={`item ${isComplete(s.type) ? "done" : ""}`}
                        >
                          <div className="circle" />
                          <div className="text">{s.title}</div>
                        </div>
                      ))}
                      <div className="item">
                        <div className="circle" />
                        <div className="text">Financial summary</div>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => history.push(`/single-matter/${id}`)}
                    className="btn btnPrimary rounded-pill"
                    style={{ marginBottom: "10px", backgroundColor: "#6c757d", borderColor: "#6c757d" }}
                  >
                    Back to Workflow
                  </button>
                  <button
                    onClick={handleFinish}
                    className="btn btnPrimary rounded-pill"
                    disabled={isFinishDisabled}
                  >
                    Finish
                  </button>
                </div>

                {/* Accordion */}
                <div
                  className="col-12 col-md-9"
                  onInput={() => {
                    touchedRef.current = true;
                  }}
                  onClick={() => {
                    touchedRef.current = true;
                  }}
                >
                  <Accordion defaultActiveKey="0">
                    {SECTIONS.map((s, i) => {
                      const done = isComplete(s.type);
                      const SectionForm = s.Comp;
                      return (
                        <Accordion.Item eventKey={String(i)} key={s.key}>
                          <Accordion.Header>
                            <img src={s.icon} alt="" />
                            <div
                              className="w-100 px-2"
                              style={{ marginRight: "8%" }}
                            >
                              <div className="d-flex justify-content-between">
                                <div>{s.title}</div>
                                <div>{done ? "Complete" : ""}</div>
                              </div>
                              <div
                                className={`progress-bar ${done ? "done" : ""}`}
                                style={{ "--progress-width": done ? "100%" : "0%" }}
                              ></div>
                            </div>
                          </Accordion.Header>
                          <Accordion.Body>
                            <SectionForm
                              matterId={id}
                              onUpdateFormData={onUpdateFormData}
                              matterData={matterData || {}}
                              {...s.extra}
                            />
                          </Accordion.Body>
                        </Accordion.Item>
                      );
                    })}
                    <FinancialSummary />
                  </Accordion>
                </div>
                {/* End of Accordion */}
              </div>
            </div>
          </div>
          <CustomDrawer title={"Required Fields"}>
            {renderRequiredFields(fieldRequired)}
          </CustomDrawer>
          {/* <div className="pb-4"></div> */}
        </Layout>
      )}
    </>
  );
};

export default FiveStepsPage;
