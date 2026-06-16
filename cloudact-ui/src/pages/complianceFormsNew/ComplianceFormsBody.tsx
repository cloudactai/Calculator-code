import  { useState } from "react";
import Chip from "@mui/material/Chip";
import Stack from "@mui/material/Stack";
import { determineStep, getColorFromPercentage ,nameOfChecklist } from "../../utils/helpers";
import { momentFunction } from "../../utils/moment";
import { Link } from "react-router-dom";
import {ComplianceFormsBodyProps ,  ReportOption , DataProps} from "./inferface/complianceinterface"


const ComplianceFormsBody: React.FC<ComplianceFormsBodyProps> = ({
  data,
  index,
  handleSelectIndividual,
  selectedReports
}) => {
  
  const [reportOptions, setReportOptions] = useState<{
    loading: boolean;
    options: ReportOption[];
  }>({
    loading: false,
    options: [],
  });


   const removeUnnecessaryWords = (text: string) => {
    return text.replace("Enter", "").replace("Show", "");
  };

  const getProgress = (preparerSignoff: string | number, approvererSignoff: string | number) => {
    const progress = (Number(preparerSignoff) + Number(approvererSignoff)) * 50;
    return `${progress}%`;
  };


  const checkwordsofAccount = (data: string | null) => {
    if (data && typeof data === 'string') {
        return data.length > 20 ? data.slice(0, 12) + "..." : data;
    }
    return '';
};




  return (
    <>

      <tr
        key={index}
        className={"highlight_blue text-center"}
      >
        <td className={"tdCheckBox"}>

          <input
            className={`form-check-input`}
            type="checkbox"
            checked={selectedReports.includes(data.id)}
            onChange={() => handleSelectIndividual(data.id)}
          />
          <span>
            <span>
            <Link
              style={{ color: "#333" }}
              to={{
                pathname: data.isComplianceForm === 1 ? `/compliance/form` : `/tasks/form`,
                state: data, search: `step=${determineStep(data.task_type)}&form=1`,
              }}>
              {nameOfChecklist(data.task_type)}
            </Link>
          </span>

          </span>

        </td>

        <td>
          <span>{data.task_month}</span>
        </td>

        <td>
        <span>
        <div className="progressBar">
              <div className="inner " style={{ minWidth: '143px' }}>
                <span
                  style={{
                    width: getProgress(data.task_preparer_signoff, data.task_approverer_signoff),
                    backgroundColor:
                      getColorFromPercentage(
                      getProgress(data.task_preparer_signoff, data.task_approverer_signoff),
                      true)
                  }}
                >
                </span>

              </div>

              {
                getProgress(data.task_preparer_signoff, data.task_approverer_signoff)

              }

            </div>
            </span>


        </td>

        <td>
          <span>       
             {data.task_type_account !== 'undefined'  ? checkwordsofAccount(data.task_type_account) : '-' }
          </span>
        </td>

        <td>
          <span>{
              momentFunction.formatDate(data.task_due_date, "DD-MM-YYYY")
            }
          </span>
        </td>


        <td>
          <span
            className={
              data.task_status === "INPROGRESS" ? "blueColor" : "greenColor"
            }
          >
            {data.task_status === "INPROGRESS" ? "In Progress" : data.task_status === "DONE" ? "Approved" : data.task_status}



          </span>
        </td>


        <td className="actions">
          {data.pdf_url ? (
            <a target="_blank" href={data.pdf_url} download >
              <button className="redColor">
                <i className="fa-solid fa-file-pdf"></i> PDF
              </button>
            </a>
          ) : (
            "Not approved"
          )}
        </td>
      </tr>

      {reportOptions.options.length !== 0 && (
        <tr style={{ width: "10rem", whiteSpace: "nowrap", overflow: "auto" }}>
          <Stack
            className="my-3 mx-5"
            style={{ width: "10rem", whiteSpace: "nowrap" }}
            direction="row"
            spacing={1}
          >
            {(parseFloat(reportOptions.options[0].hasOption1) !== 0 ||
              reportOptions.options[0].hasOption1 === "0.00") && (
                <Chip
                  label={
                    removeUnnecessaryWords(reportOptions.options[0].option1) +
                    ": " +
                    reportOptions.options[0].hasOption1
                  }
                />
              )}
            {parseFloat(reportOptions.options[0].hasOption2) !== 0 && (
              <Chip
                label={
                  removeUnnecessaryWords(reportOptions.options[0].option2) +
                  ": " +
                  reportOptions.options[0].hasOption2
                }
              />
            )}
            {parseFloat(reportOptions.options[0].hasOption3) !== 0 && (
              <Chip
                label={
                  removeUnnecessaryWords(reportOptions.options[0].option3) +
                  ": " +
                  reportOptions.options[0].hasOption3
                }
              />
            )}
            {parseFloat(reportOptions.options[0].hasOption4) !== 0 && (
              <Chip
                label={
                  removeUnnecessaryWords(reportOptions.options[0].option4) +
                  ": " +
                  reportOptions.options[0].hasOption4
                }
              />
            )}
            {parseFloat(reportOptions.options[0].hasOption5) !== 0 && (
              <Chip
                label={
                  removeUnnecessaryWords(reportOptions.options[0].option5) +
                  ": " +
                  reportOptions.options[0].hasOption5
                }
              />
            )}
          </Stack>
        </tr>
      )}
    </>
  );
};

export default ComplianceFormsBody;
