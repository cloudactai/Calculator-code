import Cookies from "js-cookie";
import React, { useState } from "react";
import { Link } from "react-router-dom";
import ClipLoader from "react-spinners/ClipLoader";
import axios from "../../utils/axios";
import {
  determineColorOfTask,
  determineStep,
  getCurrentUserFromCookies,
  getUserId,
  getUserSID,
} from "../../utils/helpers";
import EachTask from "./EachTask";

const TasksParent = ({ e, index, alignCenter, hasChild }) => {
  const [tasksChildren, setTasksChildren] = useState([]);
  const [elementState, setElementState] = useState({ loading: false });

  const checkIfChildTaskExists = async (e) => {
    const childTasks = await axios.get(
      `/task/list/${
        getCurrentUserFromCookies().role
      }/${getUserId()}/${getUserSID()}/${e.task_batch_id}?page=1`
    );

    const {
      data: {
        data: { body },
      },
    } = childTasks;

    console.log("child tasks", body);
    setTasksChildren(body.data);
    setElementState({ loading: false });
  };

  return (
    <>
      {elementState.loading && (
        <div className="fullScreen_light heading-5 text-black d-flex flex-column justify-content-center align-items-center">
          <ClipLoader
            color={"black"}
            loading={elementState.loading}
            size={100}
          />
          Loading...
        </div>
      )}
      <tr
        key={index}
        className="cursor_pointer"
        style={{
          textDecoration: "underline",
        }}
      >
        <td
          style={{
            whiteSpace: "nowrap",
            textAlign: alignCenter ? "center" : "left",
            textDecoration: "underline",
            padding: "1rem 1rem",
          }}
        >
          <Link
            className="d-inline-block w-100"
            to={{
              pathname: `/tasks/form`,
              state: e,
              search: `step=${determineStep(e.task_type)}&form=1`,
            }}
            onClick={() => {
              Cookies.set("checklistId", JSON.stringify(e));
            }}
          >
            {hasChild &&
              (tasksChildren.length === 0 ? (
                <span
                  className="p-2 cursor_pointer"
                  onClick={(g) => {
                    g.preventDefault();
                    setElementState({ loading: true });
                    checkIfChildTaskExists(e);
                  }}
                >
                  &#10095;
                </span>
              ) : (
                <span
                  className="p-2 cursor_pointer"
                  onClick={(g) => {
                    g.preventDefault();
                    setTasksChildren([]);
                  }}
                >
                  &darr;
                </span>
              ))}

            {e.task_type}
          </Link>
        </td>
        <td
          style={{
            whiteSpace: "nowrap",
            textDecoration: "underline",
            padding: "1rem 0 !important",
            textAlign: alignCenter ? "center" : "left",
          }}
        >
          <Link
            className="d-inline-block w-100"
            to={{
              pathname: `/tasks/form`,
              state: e,
              search: `step=${determineStep(e.task_type)}&form=1`,
            }}
            onClick={() => {
              Cookies.set("checklistId", JSON.stringify(e));
            }}
          >
            {e.task_month}
          </Link>
        </td>
        {/* <td
          style={{
            whiteSpace: "nowrap",
            textAlign: alignCenter ? "center" : "left",
            textDecoration: "underline",
            padding: "1rem 0 !important",
          }}
        >
          <Link
            className="d-inline-block w-100"
            to={{
              pathname: `/tasks/form`,
              state: e,
              search: `step=${determineStep(e.task_type)}&form=1`,
            }}
            onClick={() => {
              Cookies.set("checklistId", JSON.stringify(e));
            }}
          >
            {e.task_description}
          </Link>
        </td> */}
        <td
          style={{
            whiteSpace: "nowrap",
            textAlign: alignCenter ? "center" : "left",
            textDecoration: "underline",
            padding: "1rem 0 !important",
          }}
        >
          <Link
            className={`d-inline-block w-100 ${determineColorOfTask(
              e.task_status
            )}`}
            to={{
              pathname: `/tasks/form`,
              state: e,
              search: `step=${determineStep(e.task_type)}&form=1`,
            }}
            onClick={() => {
              Cookies.set("checklistId", JSON.stringify(e));
            }}
          >
            {e.task_status === "INPROGRESS" ? "IN PROGRESS" : "COMPLETED"}
          </Link>
        </td>
      </tr>

      {tasksChildren.map((task, idx) => {
        return (
          idx !== 0 && (
            <EachTask
              isChild={true}
              e={task}
              index={idx}
              key={idx}
              alignCenter={true}
            />
          )
        );
      })}
    </>
  );
};

export default TasksParent;
