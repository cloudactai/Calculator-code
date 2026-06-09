import { Pagination } from "@mui/material";
import React, { useEffect, useState } from "react";
import { Col } from "react-bootstrap";
import EachTask from "../../components/Tasks/EachTask";
import TasksParent from "../../components/Tasks/TasksParent";
import axios from "../../utils/axios";
import {
  getBodyStatusCode,
  getCurrentUserFromCookies,
  getUserId,
  getUserSID,
  isApiRequestSuccessfully,
} from "../../utils/helpers";

const AllComplianceForms = () => {
  const [pageNumber, setPageNumber] = useState(1);
  const [formsData, setFormsData] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      const data = await axios.get( 
        `/task/list/${
          getCurrentUserFromCookies().role
        }/${getUserId()}/${getUserSID()}?page=${pageNumber}&isComplianceForm=1&status=`
      );

      const { body, status, code } = getBodyStatusCode(data);

      console.log("body", body);

      if (isApiRequestSuccessfully(code, status)) {
        setFormsData(body);
      }
    };

    fetchData();
  }, [pageNumber, getCurrentUserFromCookies().role]);

  return (
    <Col>
      <table className="w-100">
        <thead className="w-100 heading_row">
          <tr>
            {["Task name", "Client / Period", "Status"].map((e, index) => {
              return (
                <th
                  key={index}
                  style={{
                    textAlign: "left",
                    whiteSpace: "nowrap",
                  }}
                >
                  {e}
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody className="w-100">
          {formsData?.data?.map((e, index) => {
            return (
              <>
                {e.task_version === 1 && (
                  <EachTask
                    e={e}
                    index={index}
                    hasChild={false}
                    alignCenter={false}
                  />
                )}

                {e.task_version > 1 && (
                  <TasksParent
                    e={e}
                    index={index}
                    hasChild={true}
                    alignCenter={false}
                  />
                )}
              </>
            );
          })}
        </tbody>
      </table>

      <div className="d-flex justify-content-end mt-5">
        {formsData.pages > 1 && (
          <Pagination
            size={"medium"}
            page={pageNumber}
            count={formsData?.pages}
            onChange={(e, value) => {
              setPageNumber(value);
            }}
            variant="outlined"
            shape="rounded"
          />
        )}
      </div>

      {formsData?.pages?.length === 0 && (
        <div>
          {" "}
          <p className="heading-6 mt-3 text-center">No Tasks Yet</p>{" "}
        </div>
      )}
    </Col>
  );
};

export default AllComplianceForms;
