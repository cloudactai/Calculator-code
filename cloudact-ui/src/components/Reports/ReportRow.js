import Cookies from "js-cookie";
import moment from "moment";
import React, { useState } from "react";
import axios from "../../utils/axios";
import Pagination from "../../assets/images/pagination.png";
import ProfilePic from "../../assets/images/profile_pic.jpeg";
import Chip from "@mui/material/Chip";
import Stack from "@mui/material/Stack";
import CookiesParser from "../../utils/cookieParser/Cookies";
import { decrypt } from "../../utils/Encrypted";

const ReportRow = ({
  data,
  allInputChecked,
  index,
  changeCheckedInput,
  showCheckbox,
  checked,
  hasChild,
  account_name,
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

  console.log('filenameChagesssfhfgdh',data)

  const [openChild, setOpenChild] = useState(false);
  const [reportOptions, setReportOptions] = useState({
    loading: false,
    options: [],
  });

  let currentUserRole  = CookiesParser.get("currentUserRole")
  const { short_firmname } =  decrypt(currentUserRole) 

  const getFileName = (fileName) => {
    return fileName.match(/[A-Z][a-z]+/g).join(" ");
  };

  const getAccountType = (fileName) => {
    if (fileName.includes("Trust")) {
      return "Trust account";
    } else if (fileName.includes("General")) {
      return "General account";
    } else if (fileName.includes("Credit")) {
      return "Credit account";
    } else {
      return "-";
    }
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

    console.log("subName", subName);
    return subName;
  };

  const getAccountName = (pdf_file_name) => {
    let result;
    result = pdf_file_name.substr(pdf_file_name.lastIndexOf("_") + 1);
    result = result.replace("-", " ");
    result = result.substr(0, result.indexOf("."));

    return result;
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

  return (
    <>
    
      <tr
        key={index}
        className={`${checked || allInputChecked ? "highlight_blue" : ""}`}
      >
        <td className={`${showCheckbox ? "tdCheckBox" : ""}`}>
          {data.hasChild === "Y" && (
            <img
              onClick={async (e) => {
                setOpenChild(!openChild);
                if (!openChild) {
                  const {
                    data: {
                      data: { body },
                    },
                  } = await axios.get(
                    `/reportsOptions/map?report_id=${data.report_id}&batch_id=${data.batch_id}`
                  );

                  if (body) {
                    console.log("body ", body);
                    setReportOptions({
                      loading: true,
                      options: body,
                    });
                  }
                } else {
                  emptyReportOptions();
                }
              }}
              src={Pagination}
              className="cursor_pointer"
              alt="Arrow Down"
              style={{
                transform: !openChild ? "rotate(-90deg)" : "rotate(90deg)",
                transition: "all .2s",
                marginLeft: "-1.5rem",
                marginRight: "0.7rem",
              }}
            />
          )}
          <input
            className={`form-check-input ${showCheckbox ? "" : "d-none"}`}
            type="checkbox"
            checked={checked || allInputChecked}
            onChange={() => changeCheckedInput(index , data.id)}
            data-index={index}
          />
          <span>{getFileName(filename)}</span>
        </td>
        <td>
          {/* <span>
            {getAccountName(pdf_file).length === 0 ||
            getAccountName(pdf_file) === "Others"
              ? "-"
              : getAccountName(pdf_file)}
          </span> */}
          <span>{accountName}</span>
        </td>
        <td>
          <span>{from_date}</span>
        </td>
        <td>
          <span>{to_date}</span>
        </td>
        <td>
          <span>{moment(created_at).format("DD-MM-yy")}</span>
        </td>
        <td>
          <span>
            <img
              style={{
                width: "1.5rem",
                height: "1.5rem",
                borderRadius: "10rem",
                objectFit: "cover",
              }}
              src={data.profile_pic ? data.profile_pic : ProfilePic}
              className=""
              alt="Unknown Person"
            />{" "}
            &nbsp;{user_name}
          </span>
        </td>
        <td className="actions">
          <button
            className="redColor"
            onClick={() =>
              downloadReport(
                makeDownloadReportObj(
                  getNameOnly(pdf_file),
                  from_date,
                  to_date,
                  short_firmname,
                  "pdf"
                )
              )
            }
          >
            <i className="fa-solid fa-file-pdf"></i> PDF
          </button>
          <button
            className="greenColor"
            onClick={() =>
              downloadReport(
                makeDownloadReportObj(
                  getNameOnly(pdf_file),
                  from_date,
                  to_date,
                  short_firmname,
                  "xlsx"
                )
              )
            }
          >
            <i className="fa-regular fa-file-excel"></i> EXCEL
          </button>
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

export default ReportRow;
