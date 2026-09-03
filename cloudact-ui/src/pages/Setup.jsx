import React from "react";
import { useHistory } from "react-router-dom";
import Layout from "../components/LayoutComponents/Layout";
import { AUTH_ROUTES } from "../routes/Routes.types";

const Setup = () => {
  const history = useHistory();

  return (
    <Layout title="Settings">
      <div className="panel" style={{ backgroundColor: "#F5F9FF" }}>
        <div className="pHead">
          <span className="h5">Settings</span>
        </div>
        <div className="pBody">
          <div
            onClick={() => history.push(AUTH_ROUTES.SUPERADMINTAXCONSTANTS)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              padding: "16px 20px",
              backgroundColor: "#fff",
              borderRadius: "10px",
              border: "1px solid #e0e7ef",
              cursor: "pointer",
              transition: "box-shadow 0.15s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.08)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.boxShadow = "none";
            }}
          >
            <div
              style={{
                width: "40px",
                height: "40px",
                borderRadius: "8px",
                backgroundColor: "#e8f0fe",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "18px",
                fontWeight: 600,
                color: "#1a73e8",
              }}
            >
              %
            </div>
            <div>
              <div style={{ fontWeight: 600, fontSize: "15px", color: "#171d34" }}>
                Tax Constants
              </div>
              <div style={{ fontSize: "13px", color: "#666", marginTop: "2px" }}>
                View and manage tax brackets, rates, and benefit amounts
              </div>
            </div>
            <div style={{ marginLeft: "auto", color: "#999", fontSize: "20px" }}>
              &rsaquo;
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Setup;
