import React from "react";
import { Link } from "react-router-dom";
import Tick from "../../assets/images/whiteTickSvg.svg";
import { clioConnectedOrNot, intuitConnectedOrNot } from "../../utils/helpers";

const Connection = ({ admin1, admin2, date_refresh, updated_at }) => {
  return (
    <div className="connection">
      <div className="connected">
        {admin1 ? (
          <Link to="/setupwizard?step=3" className="connection_details">
            <img src={Tick} style={{ width: "3rem" }} alt="" />
            <span className="heading-5 fw-bold">
              Connected to Clio
              <p className="heading-6">{updated_at}</p>
            </span>
          </Link>
        ) : (
          <Link to="/setupwizard?step=3" className="connection_details">
            <img src="/images/cross.jpg" alt="" />
            <span className="heading-5 fw-bold">
              Not Connected to Clio
              <p className="heading-6">
                {clioConnectedOrNot() ? (
                  updated_at
                ) : (
                  <Link to="/setupwizard?step=3" className="link_lightblue">
                    Connect your admin
                  </Link>
                )}
              </p>
            </span>
          </Link>
        )}
        {admin2 ? (
          <Link to="/setupwizard?step=3" className="connection_details">
            <img style={{ width: "3rem" }} src={Tick} alt="" />
            <span className="heading-5 fw-bold">
              Connected to QBO
              <p className="heading-6">
                {intuitConnectedOrNot() ? updated_at : "Connect your admin"}
              </p>
            </span>
          </Link>
        ) : (
          <Link to="/setupwizard?step=3" className="connection_details">
            <img src="/images/cross.jpg" alt="" />
            <span className="heading-5 fw-bold">
              Not Connected to QBO
              <p className="heading-6">
                {" "}
                {intuitConnectedOrNot() ? (
                  updated_at
                ) : (
                  <Link to="/setupwizard?step=3" className="link_lightblue">
                    Connect your admin
                  </Link>
                )}
              </p>
            </span>
          </Link>
        )}
      </div>
      <hr className="line" />

      <div className="refresh">
        <p>
          <small className="heading-6">
            {" "}
            <b>Data Refresh</b>
          </small>
        </p>
        <b className="heading-5 fw-bold ">Last refreshed at: </b>
        <span className="heading-5">{date_refresh}</span>
      </div>
    </div>
  );
};

export default Connection;
