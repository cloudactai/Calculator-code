import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { accessPagesAction } from "../actions/accessPagesActions";
import { userProfileInfoAction } from "../actions/userActions";
import FooterDash from "../components/Dashboard/FooterDash/FooterDash";
import Layout from "../components/LayoutComponents/Layout";
import DashboardFirm from "../containers/Dashboard/DashboardFirm";
import { IaccessPagesAuthData, Store } from "../store/store";
import dataAxios from "../utils/dataAxios";
import { getBodyStatusCode, getUserSID } from "../utils/helpers";
import { clearCookieForCalculatorLabel } from "./calculator/Calculator";
import { AUTH_ROUTES } from "../routes/Routes.types";
import { BsCalculator } from "react-icons/bs";
import toast from "react-hot-toast";

// The Dashboard used to pull firm-wide stats (reports, tasks, trust
// balances, monthly review checklist) from the legacy /v1 backend. That
// backend has no session for personal-auth accounts, so those calls always
// failed and the page rendered blank. Personal accounts only have Matters
// and Saved Calculations in the database (auth-server/prisma/schema.prisma),
// so this now pulls exclusively from those two DB-backed endpoints.
const Dashboard = ({ userInfo, currentUserRole }) => {
  const [loaded, setLoaded] = useState(false);
  const userInfoStore = useSelector((state) => state.userProfileInfo.response);
  const [name, setName] = useState(userInfoStore?.username);
  const [FirmDashboardData, setFirmDashboardData] = useState({
    Matters: {},
    CalculatorDetails: {},
    loading: false,
  });
  const dispatch = useDispatch();
  const { loading: accessPagesStateLoading }: IaccessPagesAuthData = useSelector(
    (state: Store) => state?.accessPages
  );

  useEffect(() => {
    clearCookieForCalculatorLabel();
    // Skip API call in dev mode — devBypass.js already seeds access_pages
    if (process.env.NODE_ENV !== "development" && !accessPagesStateLoading) {
      dispatch(accessPagesAction());
    }
    dispatch(userProfileInfoAction());
  }, []);

  useEffect(() => {
    setName(userInfoStore?.username !== undefined ? userInfoStore?.username : "");
  }, [userInfoStore]);

  useEffect(() => {
    const fetchMatters = async () => {
      const res = await dataAxios.get(`get_matters/${getUserSID()}`);
      const { body } = getBodyStatusCode(res);
      const matters = Array.isArray(body) ? body : [];
      const completed = matters.filter((m) => m.information_completed === 1).length;
      return {
        total_count: matters.length,
        completed,
        inprogress: matters.length - completed,
      };
    };

    const fetchCalculations = async () => {
      const res = await dataAxios.get(`calculator/get_values/${getUserSID()}`);
      const { body } = getBodyStatusCode(res);
      const calcs = Array.isArray(body) ? body : [];
      const completed = calcs.filter((c) => c.status === "DONE").length;
      return {
        total_count: calcs.length,
        completed,
        inprogress: calcs.length - completed,
      };
    };

    const load = async () => {
      setFirmDashboardData((prev) => ({ ...prev, loading: true }));
      try {
        const [mattersSummary, calcSummary] = await Promise.all([
          fetchMatters(),
          fetchCalculations(),
        ]);

        setFirmDashboardData((prev) => ({
          ...prev,
          Matters: mattersSummary,
          CalculatorDetails: {
            ...calcSummary,
            color: "rgb(93, 150, 234)",
            title: "Family law calculator",
            body: { text: "Total calculations", link: AUTH_ROUTES.SUPPORT_CALCULATOR },
            icon: <BsCalculator size={32} />,
            completedTitle: {
              text: "Completed calculations",
              link: AUTH_ROUTES.SUPPORT_CALCULATOR,
            },
            inprogressTitle: {
              text: "In progress calculations",
              link: AUTH_ROUTES.SUPPORT_CALCULATOR,
            },
          },
        }));
      } catch (error) {
        console.error("[Dashboard] Failed to load data:", error?.response?.status, error?.response?.data || error?.message);
        const status = error?.response?.status;
        const detail = error?.response?.data?.error || error?.message || "Unknown error";
        toast.error(`Could not load dashboard data: ${status ? `${status} - ` : ""}${detail}`);
      } finally {
        setFirmDashboardData((prev) => ({ ...prev, loading: false }));
        setLoaded(true);
      }
    };

    load();
  }, []);

  return (
    <Layout title={`Welcome ${name}`}>
      {loaded && (
        <>
          <h5 className="calcTitle">Dashboard</h5>
          <div className="row">
            <DashboardFirm FirmDashboardData={FirmDashboardData} />
          </div>
        </>
      )}

      <FooterDash />
    </Layout>
  );
};

export default Dashboard;
