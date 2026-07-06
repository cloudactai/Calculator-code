import { useState, useEffect } from "react";

import Accordion from "react-bootstrap/Accordion";
import { useHistory, useLocation, useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";

import Layout from "../../components/LayoutComponents/Layout";

import BackgroundInformation from "./BackgroundInformation";
import CourtInformation from "./CourtInformation";
import ChildrenInformation from "./ChildrenInformation";
import RelationshipInformation from "./RelationshipInformation";
import EmploymentDetails from "./EmploymentDetails";
import IncomeAndBenefits from "./IncomeAndBenefits";
import Expenses from "./Expenses";
import Assets from "./Assets";
import DebtsAndLiabilities from "./DebtsAndLiabilities";
import OtherPersonsInHousehold from "./OtherPersonsInHousehold";
import FinancialSummary from "./FinancialSummary";
import {
  saveMatter,
  saveMatterReset,
} from "../../utils/Apis/matters/saveMatterInformation/saveMattersActions";
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
  const dispatch = useDispatch();
  const [formErrors, setFormErrors] = useState({});
  const [isFinishDisabled, setIsFinishDisabled] = useState(true);
  const [formsData, setFormsData] = useState({});

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

  useEffect(() => {
    const { errors, isValid } = validateForm(formsData);
    setFormErrors(errors);
    setIsFinishDisabled(!isValid);
  }, [formsData]);

  const BackgroundInformationData = (data) => {
    setProgress({ ...progress, Background: data.progress });

    //
    setFormsData({ ...formsData, Background: data.data });

    setWhichOpen("Background");
    //
  };

  const CourtInformationData = (data) => {
    setProgress({ ...progress, Court: data.progress });
    //
    setFormsData({ ...formsData, Court: data.data });

    setWhichOpen("Court");
  };

  const ChildrenInformationData = (data) => {
    setProgress({ ...progress, Children: data.progress });
    //
    setFormsData({ ...formsData, Children: data.data });

    setWhichOpen("Children");
  };

  const RelationshipInformationData = (data) => {
    setProgress({ ...progress, Relationship: data.progress });
    //
    setFormsData({ ...formsData, Relationship: data.data });

    setWhichOpen("Relationship");
  };

  const EmploymentDetailsData = (data) => {
    setProgress({ ...progress, EmploymentDetails: data.progress });
    //
    setFormsData({ ...formsData, EmploymentDetails: data.data });

    setWhichOpen("EmploymentDetails");
  };

  /**
   * Income And Benefits Data
   * This is the function to handle the income and benefits data
   */
  const IncomeAndBenefitsData = (data) => {
    setProgress({ ...progress, IncomeAndBenefits: data.progress });
    //
    setFormsData({ ...formsData, IncomeAndBenefits: data.data });

    setWhichOpen("IncomeAndBenefits");
  };

  /**
   * Expenses Data
   * This is the function to handle the expenses data
   */
  const ExpensesData = (data) => {
    setProgress({ ...progress, Expenses: data.progress });
    //
    setFormsData({ ...formsData, Expenses: data.data });

    setWhichOpen("Expenses");
  };

  /**
   * Assets Data
   * This is the function to handle the assets data
   */
  const AssetsData = (data) => {
    setProgress({ ...progress, Assets: data.progress });
    //
    setFormsData({ ...formsData, Assets: data.data });

    setWhichOpen("Assets");
  };

  /**
   * Debts And Liabilities Data
   * This is the function to handle the debts and liabilities data
   */
  const DebtsAndLiabilitiesData = (data) => {
    setProgress({ ...progress, DebtsAndLiabilities: data.progress });
    //
    setFormsData({ ...formsData, DebtsAndLiabilities: data.data });

    setWhichOpen("DebtsAndLiabilities");
  };

  /**
   * Other Persons In Household Data
   * This is the function to handle the other persons in household data
   */
  const OtherPersonsInHouseholdData = (data) => {
    setProgress({ ...progress, OtherPersonsInHousehold: data.progress });
    //
    setFormsData({ ...formsData, OtherPersonsInHousehold: data.data });

    setWhichOpen("OtherPersonsInHousehold");
  };

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
    const data = {
      matter_id: id,
      data: formsData,
    };

    dispatch(saveMatter(data));
    setLoading(true);
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
                      <div
                        className={`item ${
                          progress.Background === 100 ? "done" : ""
                        } ${whichOpen === "Background" ? "active" : ""}`}
                        onClick={handleAccordionOpen("Background")}
                      >
                        <div className="circle" />
                        <div className="text">Background</div>
                      </div>
                      <div
                        className={`item ${
                          progress.Court === 100 ? "done" : ""
                        } 
                    ${whichOpen === "Court" ? "active" : ""}`}
                        onClick={handleAccordionOpen("Court")}
                      >
                        <div className="circle" />
                        <div className="text">Court</div>
                      </div>
                      <div
                        className={`item ${
                          progress.Children === 100 ? "done" : ""
                        }
                    ${whichOpen === "Children" ? "active" : ""}`}
                        onClick={handleAccordionOpen("Children")}
                      >
                        <div className="circle" />
                        <div className="text">Children</div>
                      </div>
                      <div
                        className={`item ${
                          progress.Relationship === 100 ? "done" : ""
                        }
                    ${whichOpen === "Relationship" ? "active" : ""}`}
                        onClick={handleAccordionOpen("Relationship")}
                      >
                        <div className="circle" />
                        <div className="text">Relationship</div>
                      </div>
                      <div
                        className={`item ${
                          progress.EmploymentDetails === 100 ? "done" : ""
                        }
                    ${whichOpen === "EmploymentDetails" ? "active" : ""}`}
                        onClick={handleAccordionOpen("EmploymentDetails")}
                      >
                        <div className="circle" />
                        <div className="text">Employment details</div>
                      </div>
                      <div
                        className={`item ${
                          progress.IncomeAndBenefits === 100 ? "done" : ""
                        } ${whichOpen === "IncomeAndBenefits" ? "active" : ""}`}
                        onClick={handleAccordionOpen("IncomeAndBenefits")}
                      >
                        <div className="circle" />
                        <div className="text">Income and benefits</div>
                      </div>
                      <div
                        className={`item ${
                          progress.Expenses === 100 ? "done" : ""
                        } ${whichOpen === "Expenses" ? "active" : ""}`}
                        onClick={handleAccordionOpen("Expenses")}
                      >
                        <div className="circle" />
                        <div className="text">Expenses</div>
                      </div>
                      <div
                        className={`item ${
                          progress.Assets === 100 ? "done" : ""
                        }
                        ${whichOpen === "Assets" ? "active" : ""}`}
                        onClick={handleAccordionOpen("Assets")}
                      >
                        <div className="circle" />
                        <div className="text">Assets</div>
                      </div>
                      <div
                        className={`item ${
                          progress.DebtsAndLiabilities === 100 ? "done" : ""
                        } ${
                          whichOpen === "DebtsAndLiabilities" ? "active" : ""
                        }`}
                        onClick={handleAccordionOpen("DebtsAndLiabilities")}
                      >
                        <div className="circle" />
                        <div className="text">Debts and Liabilities</div>
                      </div>
                      <div
                        className={`item ${
                          progress.OtherPersonsInHousehold === 100 ? "done" : ""
                        } ${
                          whichOpen === "OtherPersonsInHousehold"
                            ? "active"
                            : ""
                        }`}
                        onClick={handleAccordionOpen("OtherPersonsInHousehold")}
                      >
                        <div className="circle" />
                        <div className="text">Other persons in Household</div>
                      </div>
                      <div
                        className={`item ${
                          progress.FinancialSummary === 100 ? "done" : ""
                        } ${whichOpen === "FinancialSummary" ? "active" : ""}`}
                        onClick={handleAccordionOpen("FinancialSummary")}
                      >
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
                <Accordion defaultActiveKey="0" className="col-12 col-md-9">
                  <BackgroundInformation
                    BackgroundInformationData={BackgroundInformationData}
                    MatterData={matterData}
                    formErrors={formErrors.Background}
                  />

                  <CourtInformation
                    CourtInformationData={CourtInformationData}
                    MatterData={matterData}
                  />

                  <ChildrenInformation
                    ChildrenInformationData={ChildrenInformationData}
                  />

                  <RelationshipInformation
                    RelationshipInformationData={RelationshipInformationData}
                  />

                  <EmploymentDetails
                    EmploymentDetailsData={EmploymentDetailsData}
                  />

                  <IncomeAndBenefits
                    IncomeAndBenefitsData={IncomeAndBenefitsData}
                  />

                  <Expenses ExpensesData={ExpensesData} />

                  <Assets AssetsData={AssetsData} />

                  <DebtsAndLiabilities
                    DebtsAndLiabilitiesData={DebtsAndLiabilitiesData}
                  />

                  <OtherPersonsInHousehold
                    OtherPersonsInHouseholdData={OtherPersonsInHouseholdData}
                  />

                  <FinancialSummary />
                </Accordion>
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
