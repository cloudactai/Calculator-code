import Cookies from "js-cookie";
import moment from "moment";
import React, { useEffect, useState } from "react";
import axios from "../../utils/axios";
import Pagination from "../../assets/images/pagination.png";
import ProfilePic from "../../assets/images/profile_pic.jpeg";
import Chip from "@mui/material/Chip";
import Stack from "@mui/material/Stack";
import CookiesParser from "../../utils/cookieParser/Cookies";
import { decrypt } from "../../utils/Encrypted";
import { determineStep, getColorFromPercentage } from "../../utils/helpers";
import { momentFunction } from "../../utils/moment";
import { Link } from "react-router-dom";
import monthlyChecklistTrustDetailsById from "../../utils/Apis/monthlyChecklist/monthlyChecklistTrustDetailsById";
import monthlyChecklistGeneralById from "../../utils/Apis/monthlyChecklist/MonthlyChecklistGeneralById";
import monthlyChecklistCardDetailsById from "../../utils/Apis/monthlyChecklist/MonthlyChecklistCardById";

const MonthlyChecklistBody = ({
  data,
  allInputChecked,
  index,
  changeCheckedInput,
  showCheckbox,
  checked,
  handleSelectIndividual,
  selectedReports
}) => {
  const {
    filename,
    from_date,
    to_date,
    created_at,
    user_name,
    xlsx_file,
    pdf_file,
    accountName
  } = data;

  console.log('selectedReportsgfjdatadata', data)

  const [openChild, setOpenChild] = useState(false);
  const [reportOptions, setReportOptions] = useState({
    loading: false,
    options: [],
  });

  const [formsDataWithProgress, setFormsDataWithProgress] = useState([]);

  console.log('formsDataWithProgressECCC', formsDataWithProgress)

  let currentUserRole = CookiesParser.get("currentUserRole")
  const { short_firmname } = decrypt(currentUserRole)

  const getFileName = (fileName) => {
    return fileName.match(/[A-Z][a-z]+/g).join(" ");
  };


  const makeDownloadReportObj = (fName, fDate, tDate, Sname, ext) => {
    return {
      filename: fName,
      from_date: fDate,
      to_date: tDate,
      short_firmname: Sname,
      ext: ext,
    };
  };

  const getNameOnly = (name) => {
    const subName = name.substr(0, name.indexOf("."));
    return subName;
  };

  const downloadReport = (reportInfo) => {
    console.log("reportInfo", reportInfo);
    axios
      .post("/download/report", reportInfo)
      .then((res) => {
        console.log("res", res);
        if (res.data.data.code === 200) {
          window.location.href = res.data.data.body.download_url;
        } else {
          throw res.data.data.status;
        }
      })
      .catch((err) => {
        console.log("err", err);
      });

    return null;
  };

  const emptyReportOptions = () => {
    setReportOptions({ loading: false, options: [] });
  };

  const removeUnnessaryWords = (e) => {
    let newTitle = e.replace("Enter", "");
    newTitle = newTitle.replace("Show", "");

    return newTitle;
  };

  function calculateProgress(data) {

    const subForm1 = data.subForm1;
    const subForm2 = data.subForm2;
    const subForm3 = data.subForm3;

    let filledCount = 0;
    let totalCount = 0;

    // Helper function to count filled values in a subform
    function countFilledValues(subform) {
      for (const key in subform) {
        if (subform[key] !== "") {
          filledCount++;
        }
        totalCount++;
      }
    }

    // Count filled values in subForm1
    countFilledValues(subForm1);

    // Check if subForm2 exists and count filled values
    if (subForm2) {
      countFilledValues(subForm2);
    }

    // Check if subForm3 exists and count filled values
    if (subForm3) {
      countFilledValues(subForm3);
    }

    // Calculate the progress in percentage
    const progress = Math.ceil((filledCount / totalCount) * 100);
    return progress;
  }

  const getProgressFun = async () => {

    const updatedDataArray = [];
    if (data.task_type === "Trust A/C checklist") {
      const body = await monthlyChecklistTrustDetailsById(data.id);
      if (body && body?.trust_account && Object.keys(JSON.parse(body?.trust_account)).length !== 0) {
        const formData1 = JSON.parse(body.trust_account);
        const form1Data = {
          subForm1: { ...formData1.options.subForm1 },
          subForm2: { ...formData1.options.subForm2 },
          subForm3: { ...formData1.options.subForm3 },
        };

        let calTrust = calculateProgress(form1Data)
        updatedDataArray.push({
          ...data,
          progress: calculateProgress(form1Data),
        });
      }
    } else if (data.task_type === "General A/C checklist") {
      const body = await monthlyChecklistGeneralById(data.id);
      if (body && body !== null && body?.general_account !== null && body?.general_account !== '' && body?.general_account !== undefined) {
        console.log("checkbyeee after", body?.general_account)

        const formData2 = JSON?.parse(body?.general_account);
        let calGeneral = calculateProgress(formData2)
        console.log('GeneralProgress', calGeneral)
        updatedDataArray.push({
          ...data,
          progress: calculateProgress(formData2.options),
        });
      }
    } else {
      const body = await monthlyChecklistCardDetailsById(data.id);
      console.log('bodyERRor', body)
      if (body && body !== null) {
        const formData3 = body?.credit_cards ? JSON.parse(body?.credit_cards) : "";
        const form3Data = {
          subForm1: { ...formData3.options?.subForm1 },
        };

        let calCard = calculateProgress(form3Data)
        console.log('cardProgress', calCard)

        updatedDataArray.push({
          ...data,
          progress: calculateProgress(form3Data),
        });
      }
    }

    setFormsDataWithProgress(updatedDataArray);


  }

  useEffect(() => {
    getProgressFun()
  }, [data])

  const checkwordsofAccount = (data) => {
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
            <Link
              style={{ color: "#333" }}
              to={{
                pathname:
                  data.isComplianceForm === 1 ? `/compliance/form` : `/tasks/form`,
                state: data,
                search: `step=${determineStep(data.task_type)}&form=1`,
              }}
              onClick={() => {
                Cookies.set("checklistId", JSON.stringify(data));
              }}
            >
              {data.task_type}
            </Link>
          </span>


          {/* <span>{getFileName(filename)}</span> */}
        </td>

        <td>
          <span>{data.task_month}</span>
        </td>

        <td>
        <span>
          <div className="progressBar">
            <div className="inner">
              <span
                style={{
                  width:
                    formsDataWithProgress &&
                    formsDataWithProgress.length &&
                    formsDataWithProgress.find((element) => element.id === data.id)
                      ?.progress
                      ? formsDataWithProgress &&
                        formsDataWithProgress.length &&
                        formsDataWithProgress.find((element) => element.id === data.id)
                          ?.progress + "%"
                      : "0%",
                  backgroundColor:
                    formsDataWithProgress &&
                    formsDataWithProgress.length &&
                    formsDataWithProgress.find((element) => element.id === data.id)
                      ?.progress
                      ? getColorFromPercentage(
                          formsDataWithProgress.find((element) => element.id === data.id)
                            ?.progress
                        )
                      : 0,
                }}
              ></span>
            </div>
            {formsDataWithProgress &&
            formsDataWithProgress.length &&
            formsDataWithProgress.find((element) => element.id === data.id)?.progress
              ? formsDataWithProgress &&
                formsDataWithProgress.length &&
                formsDataWithProgress.find((element) => element.id === data.id)
                  ?.progress + "%"
              : "0%"}
          </div>
        </span>

        </td>

        <td>
          <span>       
             {checkwordsofAccount(data.task_type_account)}
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
                    removeUnnessaryWords(reportOptions.options[0].option1) +
                    ": " +
                    reportOptions.options[0].hasOption1
                  }
                />
              )}
            {parseFloat(reportOptions.options[0].hasOption2) !== 0 && (
              <Chip
                label={
                  removeUnnessaryWords(reportOptions.options[0].option2) +
                  ": " +
                  reportOptions.options[0].hasOption2
                }
              />
            )}
            {parseFloat(reportOptions.options[0].hasOption3) !== 0 && (
              <Chip
                label={
                  removeUnnessaryWords(reportOptions.options[0].option3) +
                  ": " +
                  reportOptions.options[0].hasOption3
                }
              />
            )}
            {parseFloat(reportOptions.options[0].hasOption4) !== 0 && (
              <Chip
                label={
                  removeUnnessaryWords(reportOptions.options[0].option4) +
                  ": " +
                  reportOptions.options[0].hasOption4
                }
              />
            )}
            {parseFloat(reportOptions.options[0].hasOption5) !== 0 && (
              <Chip
                label={
                  removeUnnessaryWords(reportOptions.options[0].option5) +
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

export default MonthlyChecklistBody;
