import React from "react";
import { useSelector } from "react-redux";
import { clioConnectedOrNot, intuitConnectedOrNot } from "../../utils/helpers";
import { momentFunction } from "../../utils/moment";
import Connection from "./Connection";

const Status = () => {
  const { userInfo } = useSelector((state) => state.userLogin);

  return (
    <div className="status info_container">
      <h4 className="heading-3">Status</h4>

      <div className="connect mt-4">
        <small className="heading-6 fw-bold">Connectivity</small>
        <Connection
          admin1={clioConnectedOrNot()}
          admin2={intuitConnectedOrNot()}
          updated_at={
            userInfo.updated_at !== null
              ? momentFunction.formatDate(userInfo.updated_at)
              : null
          }
          date_refresh={
            userInfo.last_refreshed_at !== null
              ? momentFunction.formatDate(userInfo.last_refreshed_at)
              : null
          }
        ></Connection>
      </div>
    </div>
  );
};

export default Status;
