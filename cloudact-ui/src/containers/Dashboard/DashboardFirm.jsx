import { Link } from "react-router-dom";
import { getSvg } from "./assetsDashboard/getSvg";
import { AUTH_ROUTES } from "../../routes/Routes.types";

// Trimmed down to what a personal account's database actually has (Matter +
// SavedCalculation — see auth-server/prisma/schema.prisma). The firm-wide
// panels this used to show (bank overview, A/R, overdrawn/closed client
// balances, monthly review checklist, overdue tasks, reports) came from the
// legacy /v1 backend, which has no session for personal accounts and always
// failed, leaving the dashboard blank.
const DashboardFirm = ({ FirmDashboardData }) => {
  const Render_Card = (values) => {
    if (!values || !values.body) return null;

    return (
      <>
        {values.body.text && (
          <Link name={values.body.text} className="totalInfo" to={values.body.link}>
            <span className="title">{values.body.text}</span>
            <span className="count">{values.total_count}</span>
          </Link>
        )}

        {values.completed > 0 && (
          <Link
            name={values.completedTitle.text}
            className="totalInfo"
            to={values.completedTitle.link}
          >
            <span className="title">{values.completedTitle.text}</span>
            <span className="count">{values.completed}</span>
          </Link>
        )}
        {values.inprogress > 0 && (
          <Link
            name={values.inprogressTitle.text}
            className="totalInfo"
            to={values.inprogressTitle.link}
          >
            <span className="title">{values.inprogressTitle.text}</span>
            <span className="count">{values.inprogress}</span>
          </Link>
        )}
      </>
    );
  };

  return (
    <div className="newDashboard mb-3">
      <div className="row">
        <div className="col-lg-6">
          <div className="panelRow h-100">
            <div className="pHead">
              <span className="h5" style={{ fontWeight: 700 }}>
                Matters
              </span>
            </div>
            <div className="row firmAnalyticsRow">
              <div className="col-md-12">
                <div className="panel mb-4 panelH-min matterStatusBox">
                  <div className="pHead">
                    <span className="h5">
                      {getSvg("Matter status")}
                      Matter status
                    </span>
                  </div>
                  <div className="pBody pb-0 pt-0">
                    <div className="compliance ar">
                      <span>{FirmDashboardData?.Matters?.total_count || 0}</span>
                      <span className="h5">Total matters</span>
                    </div>
                    <div className="compliance ar">
                      <span>{FirmDashboardData?.Matters?.completed || 0}</span>
                      <span className="h5">Info completed</span>
                    </div>
                    <div className="compliance ar">
                      <span>{FirmDashboardData?.Matters?.inprogress || 0}</span>
                      <span className="h5">Info pending</span>
                    </div>
                  </div>
                  <span className="moreBtn">{getSvg("moreBtn")}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="col-lg-6">
          <div className="panelRow h-100">
            <div className="pHead">
              <span className="h5" style={{ fontWeight: 700 }}>
                Your Analytics
              </span>
            </div>
            <div className="row firmAnalyticsRow">
              <div className="col-md-6">
                <div className="panel panelH-min mb-4">
                  <div className="pHead">
                    <span className="h5">
                      {getSvg("Financial overview")}
                      Total information
                    </span>
                  </div>
                  <div className="pBody countWidgets">
                    {!FirmDashboardData.loading &&
                      [FirmDashboardData?.CalculatorDetails].map((e) => Render_Card(e))}
                  </div>
                  <span className="moreBtn">{getSvg("moreBtn")}</span>
                </div>
              </div>

              <div className="col-md-6">
                <div className="panel panelH-min mb-4">
                  <div className="pHead">
                    <span className="h5">
                      {getSvg("Quick links")}
                      Quick links
                    </span>
                  </div>
                  <div className="pBody pb-0 pt-0">
                    <div className="pHead quickLinks pt-0">
                      <div className="reportLink">
                        <Link to={AUTH_ROUTES.SUPPORT_CALCULATOR}>
                          <span className="h5">
                            {getSvg("Create support calculations")}
                          </span>
                        </Link>
                        <span className="h5">Create support calculations</span>
                      </div>
                      <div className="reportLink">
                        <Link to={AUTH_ROUTES.MATTER_DASHBOARD}>
                          <span className="h5">{getSvg("Monthly review checklist")}</span>
                        </Link>
                        <span className="h5">View matters</span>
                      </div>
                    </div>
                  </div>
                  <span className="moreBtn">{getSvg("moreBtn")}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardFirm;
