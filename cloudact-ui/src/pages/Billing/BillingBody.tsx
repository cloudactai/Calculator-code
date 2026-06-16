import { useState, useEffect } from "react";
import Chip from "@mui/material/Chip";
import Stack from "@mui/material/Stack";
import { determineStep, getColorFromPercentage, nameOfChecklist, getCurrentUserFromCookies } from "../../utils/helpers";
import { momentFunction } from "../../utils/moment";
import { Link } from "react-router-dom";
import { Roles } from "../../routes/Role.types";
import excelImg from "../../../src/assets/images/excel.png"
import inProgressImg from "../../assets/images/inprogress.png";
import axios from "../../utils/axios";
import { RiEditLine } from "react-icons/ri";
import { RxCross1 } from "react-icons/rx";
import { IoMdCheckmark } from "react-icons/io";
import { ComplianceFormsBodyProps, ReportOption, DataProps } from "./inferface/complianceinterface"

interface Comment {
  id: number;
  text: string;
}
const BillingBody: React.FC<ComplianceFormsBodyProps> = ({
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
  const [isPopupVisible, setIsPopupVisible] = useState<boolean>(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [currentText, setCurrentText] = useState<string>("");
  const startEdit = (id: number, text: string) => {
    setEditId(id);
    setCurrentText(text);
  };

  const saveEdit = (id: number) => {

    console.log(currentText)
    handleTaskComment(id, currentText);
    setEditId(null);
  };

  const rejectEdit = (id: number) => {
    setEditId(null);
    setCurrentText("");
    handleTaskComment(id, "");
  };


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


  //Update comment
  const handleTaskComment = async (id: number, currentText: string) => {
    try {
      setIsPopupVisible(false);
      const payload = { id: id, comment: currentText };

      const response = await axios.put('/updatetaskComment', payload);


    } catch (error) {
      console.error("Error handling task click:", error);
    }
  };
  const handleTaskClick = async (taskId: number, taskStatus: string, taskAssignee: string) => {
    try {
      // Check user permissions
      if (getCurrentUserFromCookies().role === taskAssignee) {
        alert("You don't have permission to update this task");
        return;
      }

      setIsPopupVisible(false); // Close popup before making the request

      const payload = { id: taskId, status: taskStatus };

      // Make the API call with Axios
      const response = await axios.put('/updatetaskStatus', payload);

      console.log('Task updated successfully:', response.data);

      // Reload the page to reflect changes
      window.location.reload();
    } catch (error) {
      // Log the error
      console.error('Error updating task status:', error.response?.data || error.message);

      // Optionally show an error message to the user
      alert('Failed to update task. Please try again.');
    }
  };


  // Function to toggle the popup visibility
  const togglePopup = () => {
    setIsPopupVisible(!isPopupVisible);
  };


  // Close popup when clicking outside
  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      const popupElement = document.querySelector(".popup-container");
      if (popupElement && !popupElement.contains(event.target as Node)) {
        setIsPopupVisible(false);
      }
    };

    if (isPopupVisible) {
      document.addEventListener("click", handleOutsideClick);
    }
    return () => {
      document.removeEventListener("click", handleOutsideClick);
    };
  }, [isPopupVisible]);


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
          <span>{data.bill_card}</span>

        </td>


        <td>
          <span>
            {new Date(data.task_from).toLocaleDateString() === new Date(data.task_to).toLocaleDateString()
              ? new Date(data.task_from).toLocaleDateString() // Show only one date if they are the same
              : `${new Date(data.task_from).toLocaleDateString()} - ${new Date(data.task_to).toLocaleDateString()}`} {/* Show range if different */}
          </span>
        </td>


        <td>
          <span>{data.task_due_date}</span>
        </td>
        <td className="actions">
          {data.billing_url ? (
            <a href={data.billing_url} download >
              <button style={{ color: "#4cb528" }}>
                <img src={excelImg} style={{ width: '20px' }} /> Excel
              </button>
            </a>
          ) : (
            "Not approved"
          )}
        </td>
        <td>
          <span>
            {data.task_bill_preparers &&
              JSON.parse(data.task_bill_preparers)[0]?.username}
          </span>
        </td>

        <td>
          <span>
            {data.task_bill_approvers &&
              JSON.parse(data.task_bill_approvers)[0]?.username}
          </span>
        </td>


        {
          (data.task_status !== "DONE" && data.task_status !== "NOT_STARTED") && <td style={{ overflowWrap: "anywhere", paddingRight: "0px", paddingLeft: "0px" }}>
            {editId === data.id ? (
              <>
                <div className="position-relative">
                  <textarea
                    value={currentText}
                    onChange={(e) => setCurrentText(e.target.value)}
                    style={{
                      marginRight: '10px',
                      height: '62px',
                      border: '2px solid #d5edfe',
                      textAlign: 'center',
                      padding: '2px 25px',
                      width: '100%',
                      resize: 'none'
                    }}
                  />
                  <span onClick={() => saveEdit(data.id)} style={{ cursor: "pointer", color: "green", marginLeft: "5px", fontSize: "20px", position: "absolute", right: "12px", top: "7px" }}><IoMdCheckmark /></span>
                  <span onClick={() => rejectEdit(data.id)} style={{ cursor: "pointer", color: "red", fontSize: "20px", position: "absolute", top: "5px", left: "10px" }}><RxCross1 /></span>
                </div>
              </>
            ) : (
              <>
                <div className="d-flex align-items-center justify-content-center">

                  <span>{currentText ? currentText : data.task_description}</span>
                  <span
                    onClick={() => (startEdit(data.id, data.text), setCurrentText(currentText ? currentText : data.task_description))}
                    style={{ cursor: "pointer", marginLeft: "10px" }}
                  >
                    <RiEditLine />
                  </span>
                </div>
              </>
            )}
          </td>
        }


        {data.task_status !== "DONE" && (data.task_status === "NOT_STARTED" ? (
          <td className="text-center">
            <span className="badge m-auto"
              style={{ cursor: "pointer", color: "black", background: "#73C3FD", width: "110px", padding: "8px" }}
              onClick={() => handleTaskClick(data.id, "INPROGRESS", Roles.REVIEWER)}
            >
              In Progress <img src={inProgressImg} alt="in progress" />
            </span>
          </td>
        ) : data.task_status === "INPROGRESS" ? (
          <td>
            <span
              style={{ cursor: "pointer", color: "black", background: "#73C3FD", width: "164px", margin: "auto", padding: "8px", borderRadius: "38px", }}
              onClick={() => handleTaskClick(data.id, "PENDING", Roles.REVIEWER)}
            >
              Send For approval
            </span>
          </td>
        ) : (
          <td style={{ position: "relative" }}>
            <span
              style={{ cursor: "pointer", color: "green" }}
              onClick={togglePopup}
            >
              :
            </span>

            {/* Popup */}
            {isPopupVisible && (
              <div
                className="popup-container"
                style={{
                  position: "absolute",
                  top: "20px",
                  left: "0",
                  background: "#f9f9f9",
                  border: "1px solid #ddd",
                  borderRadius: "8px",
                  boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
                  zIndex: 10,
                  padding: "10px",
                  minWidth: "120px",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    cursor: "pointer",
                    marginBottom: "8px",
                  }}
                  onClick={() => handleTaskClick(data.id, "DONE", Roles.PREPARER)}
                >
                 <span style={{ marginRight: "8px" }}><IoMdCheckmark /></span>
                  <span>Approve</span>
                </div>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    cursor: "pointer",
                  }}
                  onClick={() => handleTaskClick(data.id, "AMEND", Roles.PREPARER)}
                >
                  <span style={{ marginRight: "8px" }}><RiEditLine /></span>
                  <span>To amend</span>
                </div>
              </div>
            )}
          </td>
        ))}



        {/* <td>
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


        </td> */}

        {/* <td>
          <span>       
             {data.task_type_account !== 'undefined'  ? checkwordsofAccount(data.task_type_account) : '-' }
          </span>
        </td> */}

        {/* <td>
          <span>{
              momentFunction.formatDate(data.task_due_date, "DD-MM-YYYY")
            }
          </span>
        </td> */}





        {/* <td className="actions">
          {data.pdf_url ? (
            <a target="_blank" href={data.pdf_url} download >
              <button className="redColor">
                <i className="fa-solid fa-file-pdf"></i> PDF
              </button>
            </a>
          ) : (
            "Not approved"
          )}
        </td> */}
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

export default BillingBody;
