import { useState } from "react";
import Chip from "@mui/material/Chip";
import Stack from "@mui/material/Stack";
import {
  determineStep,
  getColorFromPercentage,
  nameOfChecklist,
} from "../../utils/helpers";
import { momentFunction } from "../../utils/moment";
import { Link } from "react-router-dom";
import { WorkflowFormsBodyProps, ReportOption } from "./WorkflowInterface";

const WorkflowFormsBody: React.FC<WorkflowFormsBodyProps> = ({
  data,
  index,
  handleSelectIndividual,
  handleDownloadDocument,
  selectedReports,
  onClick,
}) => {
  const formatStatus = (input: string) => {
    switch (input.toUpperCase()) {
      case "NOT STARTED":
        return "Not started";
      case "IN PROGRESS":
        return "In Progress";
      case "DONE":
        return "Completed";
      default:
        return "Not provided";
    }
  };
  return (
    <>
      <tr key={index} className={"highlight_blue text-center"}>
        <td className={"tdCheckBox"}>
          <input
            className={`form-check-input`}
            type="checkbox"
            checked={selectedReports.includes(data.workflow_id)}
            onChange={() => handleSelectIndividual(data.workflow_id)}
          />
          <span onClick={onClick} style={{ cursor: "pointer" }}>
            <span>{data.workflow_name}</span>
          </span>
        </td>

        <td>
          <span>{data.workflow_type}</span>
        </td>

        <td>
          <span>
            {momentFunction.formatDate(data.start_date, "DD-MM-YYYY")}
          </span>
        </td>

        <td>
          <span>{momentFunction.formatDate(data.due_date, "DD-MM-YYYY")}</span>
        </td>
        <td>
          <span>{data.preparer}</span>
        </td>
        <td>
          <span>{data.approver}</span>
        </td>
        <td>
          <span>{formatStatus(data.workflow_status)}</span>
        </td>
        <td className="actions">
          {data.file_url ? (
            <a
              target="_blank"
              download
              onClick={() => handleDownloadDocument(data.file_url)}
            >
              <button
                className="redColor"
                // onClick={() => handleDownloadDocument(data.file_url)}
              >
                <i className="fa-solid fa-file-pdf"></i> PDF
              </button>
            </a>
          ) : (
            // "Not approved"
            <span>Not approved</span>
          )}
        </td>
      </tr>
    </>
  );
};

export default WorkflowFormsBody;
