import moment from "moment";
import React from "react";
import Layout from "../../components/LayoutComponents/Layout";
import SignOffButton from "../../components/Tasks/SignOffButton";
import { Task } from "../../components/Tasks/Task";
import axios from "../../utils/axios";
import {
  getBodyStatusCode,
  getUserId,
  isApiRequestSuccessfully,
} from "../../utils/helpers";
import { momentFunction } from "../../utils/moment";

type Props = {
  title: string;
  children: React.ReactChild | React.ReactChild[];
  saveDocument: () => void;
  printDocument: () => void;
  formState: Object;
  taskStatus: Task;
  setFormState: (obj: Object) => void;
  setTaskStatus: (obj: Object) => void;
};

const ComplianceFormLayout: React.FC<Props> = ({
  title,
  children,
  formState,
  saveDocument,
  printDocument,
  setFormState,
  taskStatus,
  setTaskStatus,
}) => {
  const signOff = async (type: string) => {
    const signOff = await axios.post(`/signoff/task/${type}`, {
      task_id: taskStatus.id,
    });

    console.log("sign off", signOff);

    const { body, status, code } = getBodyStatusCode(signOff);

    console.log("body", body);
    if (isApiRequestSuccessfully(code, status)) {
      console.log("sign off done");
      if (type === "PREPARER") {
        setTaskStatus({
          task_preparer_signoff: 1,
          task_preparer_signoff_date: new Date(),
        });
      } else {
        setTaskStatus({
          task_approverer_signoff: 1,
          task_approverer_signoff_date: new Date(),
        });
      }
    } else {
      alert("Sign off Failed");
    }
  };

  return (
    <Layout title={title}>
      <div
        className="d-flex justify-content-between align-items-center"
        style={{ height: "88%", width: "100%" }}
      >
        {children}

        <div className="mx-5 px-5">
          <div className="d-flex">
            <button
              onClick={saveDocument}
              className="btn_primary_colored heading-5 py-3 px-4 my-4 me-3"
            >
              {" "}
              Save Document{" "}
            </button>
            {/* {taskStatus.task_status === "DONE" && (
              <button
                onClick={printDocument}
                className="btn_primary_colored heading-5 py-3 px-4 my-4"
              >
                {" "}
                Print/Download{" "}
              </button>
            )} */}
            <button
              onClick={printDocument}
              className="btn_primary_colored heading-5 py-3 px-4 my-4"
            >
              {" "}
              Print/Download{" "}
            </button>
          </div>
          <SignOffButton
            styles={`heading-5 d-block cursor_pointer btn_primary_empty  py-3 px-4 mx-2  mt-3 ${
              taskStatus.task_preparer_signoff
                ? "disabled"
                : taskStatus.task_preparer !== getUserId() && "disabled"
            }`}
            onClickFunc={(e: any) => {
              console.log("e", e);
              signOff("PREPARER");
            }}
            disabledVal={
              taskStatus.task_preparer_signoff === 1
                ? "disabled"
                : taskStatus.task_preparer !== getUserId() && "disabled"
            }
          >
            Sign Off - Preparer
          </SignOffButton>

          {taskStatus.task_preparer_signoff !== 1 &&
            taskStatus.task_preparer !== getUserId() && (
              <span
                className="heading-5 mx-4 text-primary-color"
                style={{ whiteSpace: "nowrap" }}
              >
                Log in preparer to Sign Off
              </span>
            )}
          {taskStatus.task_preparer_signoff === 1 && (
            <span
              className="heading-5 mx-4 text-success"
              style={{ whiteSpace: "nowrap" }}
            >
              Preparer Sign Off Done at{" "}
              {momentFunction.formatDate(taskStatus.task_preparer_signoff_date)}
            </span>
          )}

          <SignOffButton
            disabledVal={
              taskStatus.task_approverer_signoff ||
              taskStatus.task_preparer_signoff === 0
                ? "disabled"
                : taskStatus.task_approverer !== getUserId() && "disabled"
            }
            onClickFunc={(e: any) => {
              console.log("e", e);
              signOff("REVIEWER");
            }}
            styles={`heading-5 d-block cursor_pointer btn_primary_empty py-3 px-4 mx-2 mt-3 ${
              taskStatus.task_approverer_signoff ||
              taskStatus.task_preparer_signoff === 0
                ? "disabled"
                : taskStatus.task_approverer !== getUserId() && "disabled"
            }`}
          >
            Sign Off - Approver
          </SignOffButton>
          {taskStatus.task_approverer_signoff === 0 &&
            taskStatus.task_preparer_signoff === 1 &&
            taskStatus.task_approverer !== getUserId() && (
              <span
                className="heading-5 mx-4 text-primary-color"
                style={{ whiteSpace: "nowrap" }}
              >
                Log in approver to Sign Off
              </span>
            )}
          {taskStatus.task_approverer_signoff === 0 &&
            taskStatus.task_approverer !== getUserId() &&
            taskStatus.task_preparer_signoff === 0 && (
              <span
                className="heading-5 mx-4 text-primary-color"
                style={{ whiteSpace: "nowrap" }}
              >
                Preparer Sign Off needed first
              </span>
            )}
          {taskStatus.task_approverer_signoff === 0 &&
            taskStatus.task_approverer === getUserId() &&
            taskStatus.task_preparer_signoff === 0 && (
              <span
                className="heading-5 mx-4 text-primary-color"
                style={{ whiteSpace: "nowrap" }}
              >
                Preparer Sign Off needed first
              </span>
            )}
          {taskStatus.task_approverer_signoff === 1 && (
            <span
              className="heading-5 mx-4 text-success"
              style={{ whiteSpace: "nowrap" }}
            >
              Approver Sign Off Done at{" "}
              {momentFunction.formatDate(
                taskStatus.task_approverer_signoff_date
              )}
            </span>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default ComplianceFormLayout;
