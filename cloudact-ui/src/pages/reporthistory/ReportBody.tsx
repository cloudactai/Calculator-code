import moment from "moment";
import { useState } from "react";
import Chip from "@mui/material/Chip";
import Stack from "@mui/material/Stack";


import axios from "../../utils/axios";
import Pagination from "../../assets/images/pagination.png";
import ProfilePic from "../../assets/images/profile_pic.jpeg";
import CookiesParser from "../../utils/cookieParser/Cookies";
import { decrypt } from "../../utils/Encrypted";
import { ReportBodyProps , ReportOptions} from "./interface/reportInterface"

const ReportBody: React.FC<ReportBodyProps> = ({
  data,
  index,
  handleSelectIndividual,
  selectedReports,
}) => {

  const { filename, from_date, to_date, created_at, user_name, pdf_file, accountName, display_name } = data;

  const [openChild, setOpenChild] = useState<boolean>(false);
  const [reportOptions, setReportOptions] = useState<ReportOptions>({
    loading: false,
    options: [],
  });

  console.log("datareportOptions", reportOptions);

  const currentUserRole = CookiesParser.get("currentUserRole");
  const { short_firmname } = decrypt(currentUserRole);

  const getFileName = (fileName: string, display_name: string|null): string => {
    if (display_name) {
      return display_name;
    }
    return fileName.match(/[A-Z][a-z]+/g)?.join(" ") || "";
  };

const makeDownloadReportObj = (
    fName: string,
    fDate: string,
    tDate: string,
    Sname: string,
    ext: string
  ) => ({
    filename: fName,
    from_date: fDate,
    to_date: tDate,
    short_firmname: Sname,
    ext: ext,
  });

  const getNameOnly = (name: string): string => {
    return name.split(".")[0];
  };

  const downloadReport = (reportInfo: Record<string, string>) => {
    axios
      .post("/download/report", reportInfo)
      .then((res) => {
        if (res.data.data.code === 200) {
          window.location.href = res.data.data.body.download_url;
        } else {
          throw new Error(res.data.data.status);
        }
      })
      .catch((err) => {
        console.error("Error downloading report:", err);
      });
  };

  const emptyReportOptions = () => {
    setReportOptions({ loading: false, options: [] });
  };

  const removeUnnecessaryWords = (text: string): string => {
    return text.replace("Enter", "").replace("Show", "");
  };

  return (
    <>
    
      <tr
        key={index}
        className={"highlight_blue"}
      >
        <td className={"tdCheckBox"}>
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
            className={`form-check-input`}
            type="checkbox"
            checked={selectedReports.includes(data.id)} 
            onChange={() => handleSelectIndividual(data.id)}   
          />

          <span>{getFileName(filename, display_name)}</span>
        </td>
        <td>
        
          <span>{accountName ? accountName : <span style={{marginLeft:"22px"}}> -</span> }</span>
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
        <tr style={{ width: "20rem", whiteSpace: "nowrap", overflow: "auto" }}>
          <Stack
            className="my-3 mx-5"
            style={{ width: "20rem", whiteSpace: "nowrap" }}
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
            {parseFloat(reportOptions.options[0].hasOption2 as string) !== 0 && (
              <Chip
                label={
                  removeUnnecessaryWords(reportOptions.options[0].option2 as string) +
                  ": " +
                  reportOptions.options[0].hasOption2
                }
              />
            )}
            {parseFloat(reportOptions.options[0].hasOption3 as string) !== 0 && (
              <Chip
                label={
                  removeUnnecessaryWords(reportOptions.options[0].option3  as string) +
                  ": " +
                  reportOptions.options[0].hasOption3
                }
              />
            )}
            {parseFloat(reportOptions.options[0].hasOption4 as string) !== 0 && (
              <Chip
                label={
                  removeUnnecessaryWords(reportOptions.options[0].option4  as string) +
                  ": " +
                  reportOptions.options[0].hasOption4
                }
              />
            )}
            {parseFloat(reportOptions.options[0].hasOption5 as string) !== 0 && (
              <Chip
                label={
                  removeUnnecessaryWords(reportOptions.options[0].option5  as string) +
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

export default ReportBody;
