import React, { useState, useEffect } from "react";
import { Link, NavLink } from "react-router-dom";
import { Image } from "react-bootstrap";
import { useHistory, useLocation } from "react-router";
import Logo from "../../../assets/images/Logo.svg";
import CloudActLogo from "../../../assets/images/cloudact-logo.svg";
import { useSelector, useDispatch } from "react-redux";
import {
  LayoutDashboard,
  Calculator,
  Logout,
  Settings,
  SquareCheck,
} from "tabler-icons-react";
import { AUTH_ROUTES } from "../../../routes/Routes.types";
import { FEATURES } from "../../../config/features";
import { Roles } from "../../../routes/Role.types";
import {
  HiOutlineDocumentReport,
  HiOutlineCalculator,
  HiOutlineLogout,
  HiOutlineClipboardList,
} from "react-icons/hi";
import { TbReportSearch } from "react-icons/tb";

import { IoMdArchive } from "react-icons/io";
// import { IoMdArchive } from "react-icons/io5";

import { AiOutlineHistory, AiOutlineLineChart } from "react-icons/ai";
import { CiReceipt } from "react-icons/ci";

import { TbFileReport } from "react-icons/tb";
import {
  BsCalendar2Month,
  BsCalendar3,
  BsCardChecklist,
  BsCalendar2Check,
} from "react-icons/bs";
import { FaWpforms } from "react-icons/fa";
import { BiChevronDown, BiChevronUp } from "react-icons/bi";
import { LuLayoutDashboard } from "react-icons/lu";
import { FiSettings } from "react-icons/fi";
import DotsWithCurvedImage from "../../../assets/images/Dots with curved.svg";
import Dots3 from "../../../assets/images/dots3.svg";
import { IaccessPagesAuthData } from "../../../store/store";
import { toggleSidebar } from "../../../actions/userActions";
import ReportGmailerrorredIcon from "@mui/icons-material/ReportGmailerrorred";
interface InavLinksInfo {
  name: String;
  linkTo: String;
  icon: JSX.Element;
  canAccess?: String;
}

// Trimmed sidebar for the new-domain release: show only Home + Family Law Tools
// (Matter, Calculator, Forms) and the bottom menu (Settings/Logout). Hides
// Dashboard, Reports, Tasks, Archive, and Operational Dashboard. Set to false
// to restore the full sidebar.
const TRIMMED_SIDEBAR = false;

// Hide Reports, Tasks, and Archive from the sidebar. Set to true to restore them.
const SHOW_REPORTS_TASKS_ARCHIVE = false;

const Navbar = () => {
  const dispatch = useDispatch();
  const { userRole } = useSelector((state) => state.userChange);
  const location = useLocation();

  const handleSidebarClick = () => {
    dispatch(toggleSidebar());
  };

  // const accessPagesState: IaccessPagesAuthData = useSelector((state: Store) => state?.accessPages?.response);

  // const accessPagesStateLoading = useSelector((state: Store) => state?.accessPages?.loading);

  const {
    response: accessPagesState,
    loading: accessPagesStateLoading,
  }: { accessPagesState: IaccessPagesAuthData, loading: Boolean } = useSelector(
    (state: Store) => state?.accessPages
  );

  const r_admin = Roles.ADMIN;
  const r_preparer = Roles.PREPARER;
  const r_reviewer = Roles.REVIEWER;
  const r_all = [r_admin, r_reviewer, r_preparer];

  const navLinksInfoSuperAdmin_1 = [
    {
      name: "Dashboard",
      linkTo: AUTH_ROUTES.SUPERADMINDB,
      icon: <LuLayoutDashboard color="#171d34" size={20} />,
      auth: true,
      accessTo: Roles.SUPERADMIN,
    },
    {
      name: "Tax Constants",
      linkTo: AUTH_ROUTES.SUPERADMINTAXCONSTANTS,
      icon: <LuLayoutDashboard color="#171d34" size={20} />,
      auth: true,
      accessTo: Roles.SUPERADMIN,
    },
    {
      name: "Form Mapper",
      linkTo: AUTH_ROUTES.SUPERADMINFORMMAPPER,
      icon: <LuLayoutDashboard color="#171d34" size={20} />,
      auth: true,
      accessTo: Roles.SUPERADMIN,
    },
  ];

  const navLinkHome = [
    {
      name: "Home",
      linkTo: AUTH_ROUTES.HOME,
      icon: <LuLayoutDashboard color="#171d34" size={20} />,
      auth: true,
      accessTo: r_all,
    },
  ];

  const navLinksInfo_1 = [
    {
      name: "Dashboard",
      linkTo: AUTH_ROUTES.DASHBOARD,
      icon: <LuLayoutDashboard color="#171d34" size={20} />,
      // Always available. accessPages flags aren't populated on first login
      // (they load only after visiting Home), so don't gate on them.
      auth: true,
      accessTo: r_all,
    },
  ];

  const navLinksInfo_2 = [
    {
      name: "Operational Dashboard",
      linkTo: AUTH_ROUTES.OPERATIONAL_DASHBOARD,
      icon: <AiOutlineLineChart size={20} color="#171d34" />,
      auth: 0,
      accessTo: r_all,
    },
  ];

  const navLinksArchive = [
    {
      name: "Archive",
      linkTo: AUTH_ROUTES.ARCHIVE,
      icon: <IoMdArchive size={20} />,
      auth: accessPagesState?.auth_archive,
      accessTo: r_all,
    },
  ];

  const Render_link = (eachLink) => {
    const link = <NavbarLinkCustom eachLink={eachLink} />;

    if (!eachLink?.auth) {
      return <></>;
    }

    if (eachLink.accessTo) {
      return eachLink.accessTo.includes(userRole?.role) ? link : <></>;
    } else if (!eachLink.auth) {
      return <></>;
    }
  };

  const [isTasksOpen, setIsTasksOpen] = useState(
    location.pathname === AUTH_ROUTES.MONTHLY_CHECKLIST_TABLE ||
      location.pathname === AUTH_ROUTES.COMPLIANCE_CHECKLIST_TABLE ||
      location.pathname === AUTH_ROUTES.TRUST_DEPOSIT_SLIP
  );

  const [isToolsOpen, setIsToolsOpen] = useState(
    TRIMMED_SIDEBAR ||
      location.pathname === AUTH_ROUTES.SUPPORT_CALCULATOR ||
      location.pathname === AUTH_ROUTES.MATTER_DASHBOARD ||
      location.pathname === AUTH_ROUTES.FORMS_CREATE_NEW ||
      location.pathname === AUTH_ROUTES.T1_UPLOAD
  );

  const [isReportsOpen, setIsReportsOpen] = useState(
    location.pathname === AUTH_ROUTES.REPORTS ||
      location.pathname === AUTH_ROUTES.RUN_REPORT ||
      location.pathname === AUTH_ROUTES.OPERATIONAL_REPORTS
  );

  const history = useHistory();

  return (
    <>
      <div
        className="sideToggle"
        onClick={() => {
          handleSidebarClick();
        }}
      >
        <svg
          width="24"
          height="73"
          viewBox="0 0 24 73"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {" "}
          <path
            d="M4 0V73V68C4 62.4772 8.75542 58.222 13.5824 55.5383C19.79 52.087 24 45.2934 24 37C24 28.6769 19.7598 21.3909 13.5158 17.656C8.77613 14.8209 4 10.5228 4 5V0Z"
            fill="#171D34"
          />{" "}
          <path
            d="M12 45C12.2652 45 12.5196 44.8946 12.7071 44.7071C12.8946 44.5196 13 44.2652 13 44C13 43.7348 12.8946 43.4804 12.7071 43.2929C12.5196 43.1054 12.2652 43 12 43C11.7348 43 11.4804 43.1054 11.2929 43.2929C11.1054 43.4804 11 43.7348 11 44C11 44.2652 11.1054 44.5196 11.2929 44.7071C11.4804 44.8946 11.7348 45 12 45ZM12 38C12.2652 38 12.5196 37.8946 12.7071 37.7071C12.8946 37.5196 13 37.2652 13 37C13 36.7348 12.8946 36.4804 12.7071 36.2929C12.5196 36.1054 12.2652 36 12 36C11.7348 36 11.4804 36.1054 11.2929 36.2929C11.1054 36.4804 11 36.7348 11 37C11 37.2652 11.1054 37.5196 11.2929 37.7071C11.4804 37.8946 11.7348 38 12 38ZM12 31C12.2652 31 12.5196 30.8946 12.7071 30.7071C12.8946 30.5196 13 30.2652 13 30C13 29.7348 12.8946 29.4804 12.7071 29.2929C12.5196 29.1054 12.2652 29 12 29C11.7348 29 11.4804 29.1054 11.2929 29.2929C11.1054 29.4804 11 29.7348 11 30C11 30.2652 11.1054 30.5196 11.2929 30.7071C11.4804 30.8946 11.7348 31 12 31Z"
            stroke="white"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          />{" "}
        </svg>
      </div>
      <nav className="sidebInner">
        <Link className="logo" to="/">
          <img src={CloudActLogo} alt="CloudAct" className="logoImg" />
        </Link>
        {!accessPagesStateLoading && (
          <div className="sideMenu">
            {userRole?.role == Roles.SUPERADMIN &&
              navLinksInfoSuperAdmin_1.map((e) => Render_link(e))}
            {navLinkHome.map((e) => Render_link(e))}
            {!TRIMMED_SIDEBAR
              ? navLinksInfo_1.map((e) => Render_link(e))
              : null}

            {!TRIMMED_SIDEBAR &&
            SHOW_REPORTS_TASKS_ARCHIVE &&
            accessPagesState?.auth_reports ? (
              <a
                href="javascript:void(0)"
                className="1"
                onClick={() => setIsReportsOpen(!isReportsOpen)}
              >
                <span className="icon">
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 20 20"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M7 19H13M7 19V14M7 19H1.6C1.44087 19 1.28826 18.9368 1.17574 18.8243C1.06321 18.7117 1 18.5591 1 18.4V14.6C1 14.4409 1.06321 14.2883 1.17574 14.1757C1.28826 14.0632 1.44087 14 1.6 14H7M13 19V7M13 19H18.4C18.5591 19 18.7117 18.9368 18.8243 18.8243C18.9368 18.7117 19 18.5591 19 18.4V1.6C19 1.44087 18.9368 1.28826 18.8243 1.17574C18.7117 1.06321 18.5591 1 18.4 1H13.6C13.4409 1 13.2883 1.06321 13.1757 1.17574C13.0632 1.28826 13 1.44087 13 1.6V7M7 14V7.6C7 7.44087 7.06321 7.28826 7.17574 7.17574C7.28826 7.06321 7.44087 7 7.6 7H13"
                      stroke="white"
                      stroke-width="1.5"
                    />
                  </svg>
                </span>{" "}
                Reports <i className="fas fa-angle-down"></i>
              </a>
            ) : null}

            {!TRIMMED_SIDEBAR && SHOW_REPORTS_TASKS_ARCHIVE && isReportsOpen && (
              <>
                {accessPagesState?.auth_run_report ? (
                  <NavbarLinkCustom
                    classes={`inner`}
                    eachLink={{
                      name: "Law Society compliance reports",
                      linkTo: AUTH_ROUTES.RUN_REPORT,
                      type: "CHILD",
                    }}
                  />
                ) : null}

                {accessPagesState?.auth_operational_report ? (
                  <NavbarLinkCustom
                    classes={`inner`}
                    eachLink={{
                      name: "Operational Reports",
                      linkTo: AUTH_ROUTES.OPERATIONAL_REPORTS,
                      type: "CHILD",
                    }}
                  />
                ) : null}

                {accessPagesState?.auth_report_history ? (
                  <NavbarLinkCustom
                    classes={`inner`}
                    eachLink={{
                      name: "Report history",
                      linkTo: AUTH_ROUTES.REPORTS,
                      type: "CHILD",
                    }}
                  />
                ) : null}
              </>
            )}

            {!TRIMMED_SIDEBAR &&
            SHOW_REPORTS_TASKS_ARCHIVE &&
            accessPagesState?.auth_tasks ? (
              <a
                href="javascript:void(0)"
                onClick={() => setIsTasksOpen(!isTasksOpen)}
              >
                <span className="icon">
                  <svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    {" "}
                    <path
                      d="M11.1696 8.27657C11.2903 8.15586 11.3581 7.99214 11.3581 7.82143C11.3581 7.65072 11.2903 7.487 11.1696 7.36629C11.0488 7.24557 10.8851 7.17776 10.7144 7.17776C10.5437 7.17776 10.38 7.24557 10.2593 7.36629L8.44384 9.18171L7.93341 8.71629C7.80658 8.60789 7.64258 8.55304 7.47606 8.56333C7.30954 8.57362 7.15355 8.64825 7.04104 8.77144C6.92853 8.89463 6.86832 9.05674 6.87313 9.22351C6.87795 9.39028 6.94741 9.54865 7.06684 9.66514L8.03112 10.5459C8.1533 10.6571 8.31362 10.717 8.47881 10.7132C8.644 10.7094 8.80137 10.6421 8.91827 10.5253L11.1683 8.27529L11.1696 8.27657ZM11.1696 13.7949C11.2294 13.8546 11.2769 13.9255 11.3093 14.0036C11.3417 14.0817 11.3584 14.1654 11.3584 14.25C11.3584 14.3346 11.3417 14.4183 11.3093 14.4964C11.2769 14.5745 11.2294 14.6454 11.1696 14.7051L8.91955 16.9551C8.80243 17.0721 8.6447 17.1394 8.4792 17.143C8.31371 17.1466 8.15321 17.0862 8.03112 16.9744L7.06684 16.0937C6.94741 15.9772 6.87795 15.8189 6.87313 15.6521C6.86832 15.4853 6.92853 15.3232 7.04104 15.2C7.15355 15.0768 7.30954 15.0022 7.47606 14.9919C7.64258 14.9816 7.80658 15.0365 7.93341 15.1449L8.44384 15.6116L10.2593 13.7949C10.319 13.735 10.3899 13.6875 10.468 13.6551C10.5461 13.6227 10.6298 13.606 10.7144 13.606C10.799 13.606 10.8827 13.6227 10.9608 13.6551C11.0389 13.6875 11.1098 13.735 11.1696 13.7949ZM13.2858 14.5714C13.1153 14.5714 12.9518 14.6392 12.8313 14.7597C12.7107 14.8803 12.643 15.0438 12.643 15.2143C12.643 15.3848 12.7107 15.5483 12.8313 15.6689C12.9518 15.7894 13.1153 15.8571 13.2858 15.8571H16.5001C16.6706 15.8571 16.8341 15.7894 16.9547 15.6689C17.0753 15.5483 17.143 15.3848 17.143 15.2143C17.143 15.0438 17.0753 14.8803 16.9547 14.7597C16.8341 14.6392 16.6706 14.5714 16.5001 14.5714H13.2858ZM12.643 8.78571C12.643 8.61522 12.7107 8.4517 12.8313 8.33115C12.9518 8.21059 13.1153 8.14286 13.2858 8.14286H16.5001C16.6706 8.14286 16.8341 8.21059 16.9547 8.33115C17.0753 8.4517 17.143 8.61522 17.143 8.78571C17.143 8.95621 17.0753 9.11972 16.9547 9.24028C16.8341 9.36084 16.6706 9.42857 16.5001 9.42857H13.2858C13.1153 9.42857 12.9518 9.36084 12.8313 9.24028C12.7107 9.11972 12.643 8.95621 12.643 8.78571ZM6.85726 3C5.83429 3 4.85321 3.40638 4.12985 4.12973C3.4065 4.85309 3.00012 5.83416 3.00012 6.85714V17.1429C3.00012 18.1658 3.4065 19.1469 4.12985 19.8703C4.85321 20.5936 5.83429 21 6.85726 21H17.143C18.166 21 19.147 20.5936 19.8704 19.8703C20.5937 19.1469 21.0001 18.1658 21.0001 17.1429V6.85714C21.0001 5.83416 20.5937 4.85309 19.8704 4.12973C19.147 3.40638 18.166 3 17.143 3H6.85726ZM4.28584 6.85714C4.28584 6.17516 4.55675 5.5211 5.03899 5.03887C5.52123 4.55663 6.17528 4.28571 6.85726 4.28571H17.143C17.825 4.28571 18.479 4.55663 18.9613 5.03887C19.4435 5.5211 19.7144 6.17516 19.7144 6.85714V17.1429C19.7144 17.8248 19.4435 18.4789 18.9613 18.9611C18.479 19.4434 17.825 19.7143 17.143 19.7143H6.85726C6.17528 19.7143 5.52123 19.4434 5.03899 18.9611C4.55675 18.4789 4.28584 17.8248 4.28584 17.1429V6.85714Z"
                      fill="#171D34"
                    />{" "}
                  </svg>
                </span>{" "}
                Tasks <i className="fas fa-angle-down"></i>
              </a>
            ) : null}

            {!TRIMMED_SIDEBAR && SHOW_REPORTS_TASKS_ARCHIVE && isTasksOpen && (
              <>
                {accessPagesState?.auth_monthly_checklists ? (
                  <NavbarLinkCustom
                    classes={`inner`}
                    eachLink={{
                      name: "Monthly Review Checklist",
                      linkTo: AUTH_ROUTES.MONTHLY_CHECKLIST_TABLE,
                      type: "CHILD",
                      auth: accessPagesState?.auth_monthly_checklists,
                    }}
                  />
                ) : null}
                {accessPagesState?.auth_compliance_forms ? (
                  <NavbarLinkCustom
                    eachLink={{
                      name: "Compliance Form",
                      linkTo: AUTH_ROUTES.COMPLIANCE_CHECKLIST_TABLE,
                      type: "CHILD",
                      auth: accessPagesState?.auth_compliance_forms,
                    }}
                    classes={`inner`}
                  />
                ) : null}

                {accessPagesState?.auth_compliance_billing ? (
                  <NavbarLinkCustom
                    eachLink={{
                      name: "Billing",
                      linkTo: AUTH_ROUTES.COMPLIANCE_BILLING,
                      type: "CHILD",
                      auth: accessPagesState?.auth_compliance_billing,
                    }}
                    classes={`inner`}
                  />
                ) : null}

                {accessPagesState?.auth_trust_deposit_slip ? (
                  <NavbarLinkCustom
                    eachLink={{
                      name: "Trust Deposit Slip",
                      linkTo: AUTH_ROUTES.TRUST_DEPOSIT_SLIP,
                      type: "CHILD",
                      auth: accessPagesState?.auth_trust_deposit_slip,
                    }}
                    classes={`inner`}
                  />
                ) : null}
                {accessPagesState?.auth_workflow ? (
                  <NavbarLinkCustom
                    eachLink={{
                      name: "Workflows",
                      linkTo: AUTH_ROUTES.WORKFLOW_LIST,
                      type: "CHILD",
                      auth: accessPagesState?.auth_workflow,
                    }}
                    classes={`inner`}
                  />
                ) : null}
              </>
            )}

            {/* Family Law Tools always visible: accessPages flags load only
                after Home mounts, so gating here hides it on first login. */}
            {true ? (
              <a
                href="javascript:void(0)"
                onClick={() => setIsToolsOpen((prev) => !prev)}
              >
                <span className="icon">
                  <svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M1.32093 11.0729L2.82093 9.57291C3.06323 9.33092 3.39052 9.19322 3.73295 9.18919C4.07537 9.18517 4.40581 9.31513 4.65374 9.55134L9.5503 4.65478C9.31408 4.40685 9.18412 4.07641 9.18815 3.73399C9.19218 3.39157 9.32988 3.06428 9.57187 2.82197L11.0719 1.32197C11.1937 1.20008 11.3384 1.10339 11.4977 1.03742C11.6569 0.971453 11.8276 0.9375 12 0.9375C12.1724 0.9375 12.343 0.971453 12.5023 1.03742C12.6615 1.10339 12.8062 1.20008 12.9281 1.32197L18.9281 7.32197C19.05 7.44385 19.1467 7.58854 19.2127 7.74779C19.2786 7.90704 19.3126 8.07772 19.3126 8.25009C19.3126 8.42247 19.2786 8.59315 19.2127 8.7524C19.1467 8.91165 19.05 9.05634 18.9281 9.17822L17.4281 10.6782C17.1858 10.9202 16.8585 11.0579 16.5161 11.0619C16.1737 11.066 15.8432 10.936 15.5953 10.6998L14.67 11.626L20.9316 17.8876C21.3022 18.2979 21.5012 18.8348 21.4872 19.3876C21.4733 19.9404 21.2475 20.4666 20.8566 20.8577C20.4657 21.2487 19.9395 21.4746 19.3867 21.4887C18.834 21.5029 18.2969 21.3041 17.8866 20.9335L11.625 14.672L10.6997 15.5973C10.9359 15.8452 11.0659 16.1757 11.0618 16.5181C11.0578 16.8605 10.9201 17.1878 10.6781 17.4301L9.17811 18.9301C9.05623 19.052 8.91154 19.1487 8.75229 19.2146C8.59304 19.2806 8.42236 19.3146 8.24999 19.3146C8.07762 19.3146 7.90693 19.2806 7.74769 19.2146C7.58844 19.1487 7.44374 19.052 7.32187 18.9301L1.32187 12.9301C1.19977 12.8083 1.10289 12.6636 1.03676 12.5043C0.970627 12.345 0.936543 12.1742 0.936457 12.0017C0.936369 11.8292 0.97028 11.6584 1.03625 11.499C1.10222 11.3397 1.19896 11.1949 1.32093 11.0729ZM9.90468 14.8004L14.7994 9.90666L10.3444 5.45166L5.45061 10.3454L9.90468 14.8004ZM16.6322 9.88322L18.1322 8.38322C18.1496 8.36581 18.1634 8.34513 18.1729 8.32236C18.1823 8.2996 18.1872 8.2752 18.1872 8.25056C18.1872 8.22592 18.1823 8.20152 18.1729 8.17876C18.1634 8.156 18.1496 8.13532 18.1322 8.11791L12.1322 2.11791C12.1148 2.10047 12.0941 2.08664 12.0713 2.07721C12.0486 2.06777 12.0242 2.06292 11.9995 2.06292C11.9749 2.06292 11.9505 2.06777 11.9277 2.07721C11.905 2.08664 11.8843 2.10047 11.8669 2.11791L10.3669 3.61791C10.3494 3.63532 10.3356 3.656 10.3262 3.67876C10.3167 3.70152 10.3119 3.72592 10.3119 3.75056C10.3119 3.7752 10.3167 3.7996 10.3262 3.82236C10.3356 3.84513 10.3494 3.86581 10.3669 3.88322L16.3669 9.88322C16.3843 9.90065 16.405 9.91448 16.4277 9.92392C16.4505 9.93335 16.4749 9.93821 16.4995 9.93821C16.5242 9.93821 16.5486 9.93335 16.5713 9.92392C16.5941 9.91448 16.6148 9.90065 16.6322 9.88322ZM18.6816 20.1385C18.8785 20.3102 19.1333 20.4008 19.3945 20.3919C19.6556 20.3829 19.9037 20.2752 20.0884 20.0904C20.2732 19.9056 20.3809 19.6576 20.3899 19.3965C20.3988 19.1353 20.3083 18.8805 20.1366 18.6835L13.875 12.422L12.42 13.876L18.6816 20.1385ZM2.11686 12.1342L8.11686 18.1342C8.13428 18.1516 8.15496 18.1654 8.17772 18.1749C8.20048 18.1843 8.22488 18.1891 8.24952 18.1891C8.27416 18.1891 8.29856 18.1843 8.32132 18.1749C8.34408 18.1654 8.36476 18.1516 8.38218 18.1342L9.88218 16.6342C9.89961 16.6167 9.91344 16.5961 9.92287 16.5733C9.93231 16.5505 9.93717 16.5261 9.93717 16.5015C9.93717 16.4769 9.93231 16.4525 9.92287 16.4297C9.91344 16.4069 9.89961 16.3863 9.88218 16.3688L3.88218 10.3688C3.86476 10.3514 3.84408 10.3376 3.82132 10.3281C3.79856 10.3187 3.77416 10.3139 3.74952 10.3139C3.72488 10.3139 3.70048 10.3187 3.67772 10.3281C3.65496 10.3376 3.63428 10.3514 3.61686 10.3688L2.11686 11.8688C2.09943 11.8863 2.0856 11.9069 2.07616 11.9297C2.06673 11.9525 2.06187 11.9769 2.06187 12.0015C2.06187 12.0261 2.06673 12.0505 2.07616 12.0733C2.0856 12.0961 2.09943 12.1167 2.11686 12.1342Z"
                      fill="white"
                    />
                  </svg>
                </span>{" "}
                Family law Tools <i className="fas fa-angle-down"></i>
              </a>
            ) : null}

            {isToolsOpen && (
              <>
                <NavbarLinkCustom
                  classes={`inner`}
                  eachLink={{
                    name: "Matter",
                    linkTo: AUTH_ROUTES.MATTER_DASHBOARD,
                    type: "CHILD",
                    auth: true,
                  }}
                />
                <NavbarLinkCustom
                  classes={`inner`}
                  eachLink={{
                    name: "Calculator",
                    type: "CHILD",
                    linkTo: AUTH_ROUTES.SUPPORT_CALCULATOR,
                    icon: <HiOutlineCalculator color="#171d34" size={24} />,
                    auth: true,
                    accessTo: r_all,
                  }}
                />
                <NavbarLinkCustom
                  classes={`inner`}
                  eachLink={{
                    name: "Forms",
                    type: "CHILD",
                    linkTo: AUTH_ROUTES.FORMS_CREATE_NEW,
                    icon: <HiOutlineClipboardList color="#171d34" size={24} />,
                    auth: true,
                    accessTo: r_all,
                  }}
                />
              </>
            )}

            {!TRIMMED_SIDEBAR &&
            SHOW_REPORTS_TASKS_ARCHIVE &&
            accessPagesState?.auth_archive
              ? navLinksArchive.map((e) => Render_link(e))
              : null}

            {!TRIMMED_SIDEBAR && navLinksInfo_2.map((e) => Render_link(e))}
          </div>
        )}

        <div className="sideMenu">
          {userRole?.role !== Roles.SUPERADMIN && (
            <NavbarLinkCustom
              eachLink={{
                name: "Report issue",
                linkTo: AUTH_ROUTES.REPORT_ISSUE,
                auth: true,
              }}
            />
          )}

          {userRole?.role === Roles.ADMIN && (
            <NavbarLinkCustom
              eachLink={{
                name: "Settings",
                linkTo: AUTH_ROUTES.SETUP,
                auth: true,
              }}
            />
          )}

          <NavbarLinkCustom
            eachLink={{
              name: "Logout",
              linkTo: AUTH_ROUTES.LOGOUT,
              auth: true,
            }}
          />
        </div>
      </nav>
    </>
  );
};

const NavbarLinkCustom = ({
  eachLink,
  classes,
  leftPos,
}: InavLinksInfo): FC<any> => {
  const location = useLocation();
  return (
    <NavLink
      activeClassName="active"
      className={`${classes ? classes : ""} `}
      to={eachLink.linkTo}
    >
      {eachLink.name == "Settings" && (
        <span className="icon">
          <svg
            width="18"
            height="20"
            viewBox="0 0 18 20"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            {" "}
            <path
              d="M9.19761 1H8.80161C8.32422 1 7.86638 1.18964 7.52882 1.52721C7.19125 1.86477 7.00161 2.32261 7.00161 2.8V2.962C7.00129 3.27765 6.91796 3.58767 6.75999 3.86095C6.60203 4.13424 6.37497 4.36117 6.10161 4.519L5.71461 4.744C5.44098 4.90198 5.13058 4.98515 4.81461 4.98515C4.49864 4.98515 4.18824 4.90198 3.91461 4.744L3.77961 4.672C3.36657 4.43374 2.87586 4.3691 2.41521 4.49228C1.95456 4.61546 1.56161 4.91638 1.32261 5.329L1.12461 5.671C0.886348 6.08404 0.82171 6.57475 0.944888 7.0354C1.06807 7.49605 1.36899 7.889 1.78161 8.128L1.91661 8.218C2.18866 8.37506 2.41487 8.60058 2.57276 8.87215C2.73064 9.14372 2.81471 9.45187 2.81661 9.766V10.225C2.81787 10.5422 2.7353 10.8541 2.57725 11.1291C2.4192 11.4041 2.1913 11.6324 1.91661 11.791L1.78161 11.872C1.36899 12.111 1.06807 12.5039 0.944888 12.9646C0.82171 13.4253 0.886348 13.916 1.12461 14.329L1.32261 14.671C1.56161 15.0836 1.95456 15.3845 2.41521 15.5077C2.87586 15.6309 3.36657 15.5663 3.77961 15.328L3.91461 15.256C4.18824 15.098 4.49864 15.0148 4.81461 15.0148C5.13058 15.0148 5.44098 15.098 5.71461 15.256L6.10161 15.481C6.37497 15.6388 6.60203 15.8658 6.75999 16.139C6.91796 16.4123 7.00129 16.7223 7.00161 17.038V17.2C7.00161 17.6774 7.19125 18.1352 7.52882 18.4728C7.86638 18.8104 8.32422 19 8.80161 19H9.19761C9.675 19 10.1328 18.8104 10.4704 18.4728C10.808 18.1352 10.9976 17.6774 10.9976 17.2V17.038C10.9979 16.7223 11.0813 16.4123 11.2392 16.139C11.3972 15.8658 11.6242 15.6388 11.8976 15.481L12.2846 15.256C12.5582 15.098 12.8686 15.0148 13.1846 15.0148C13.5006 15.0148 13.811 15.098 14.0846 15.256L14.2196 15.328C14.6326 15.5663 15.1234 15.6309 15.584 15.5077C16.0447 15.3845 16.4376 15.0836 16.6766 14.671L16.8746 14.32C17.1129 13.907 17.1775 13.4163 17.0543 12.9556C16.9312 12.4949 16.6302 12.102 16.2176 11.863L16.0826 11.791C15.8079 11.6324 15.58 11.4041 15.422 11.1291C15.2639 10.8541 15.1813 10.5422 15.1826 10.225V9.775C15.1813 9.45782 15.2639 9.14594 15.422 8.87094C15.58 8.59594 15.8079 8.36759 16.0826 8.209L16.2176 8.128C16.6302 7.889 16.9312 7.49605 17.0543 7.0354C17.1775 6.57475 17.1129 6.08404 16.8746 5.671L16.6766 5.329C16.4376 4.91638 16.0447 4.61546 15.584 4.49228C15.1234 4.3691 14.6326 4.43374 14.2196 4.672L14.0846 4.744C13.811 4.90198 13.5006 4.98515 13.1846 4.98515C12.8686 4.98515 12.5582 4.90198 12.2846 4.744L11.8976 4.519C11.6242 4.36117 11.3972 4.13424 11.2392 3.86095C11.0813 3.58767 10.9979 3.27765 10.9976 2.962V2.8C10.9976 2.32261 10.808 1.86477 10.4704 1.52721C10.1328 1.18964 9.675 1 9.19761 1Z"
              stroke-width="1.35"
              stroke-linecap="round"
              stroke-linejoin="round"
            />{" "}
            <path
              d="M8.9998 12.6998C10.491 12.6998 11.6998 11.491 11.6998 9.9998C11.6998 8.50864 10.491 7.2998 8.9998 7.2998C7.50864 7.2998 6.2998 8.50864 6.2998 9.9998C6.2998 11.491 7.50864 12.6998 8.9998 12.6998Z"
              stroke-width="1.35"
              stroke-linecap="round"
              stroke-linejoin="round"
            />{" "}
          </svg>
        </span>
      )}
      {eachLink.name == "Logout" && (
        <span className="icon">
          <svg
            width="22"
            height="20"
            viewBox="0 0 22 20"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            {" "}
            <path
              d="M16.625 14.5L21.125 10M21.125 10L16.625 5.5M21.125 10H5.375M12.125 14.5V15.625C12.125 16.5201 11.7694 17.3786 11.1365 18.0115C10.5036 18.6444 9.64511 19 8.75 19H4.25C3.35489 19 2.49645 18.6444 1.86351 18.0115C1.23058 17.3786 0.875 16.5201 0.875 15.625V4.375C0.875 3.47989 1.23058 2.62145 1.86351 1.98851C2.49645 1.35558 3.35489 1 4.25 1H8.75C9.64511 1 10.5036 1.35558 11.1365 1.98851C11.7694 2.62145 12.125 3.47989 12.125 4.375V5.5"
              stroke-width="1.6875"
              stroke-linecap="round"
              stroke-linejoin="round"
            />{" "}
          </svg>
        </span>
      )}
      {(eachLink.name === "Home" ||
        eachLink.name == "Dashboard" ||
        eachLink.name == "Super Dashboard") && (
        <span className="icon">
          <svg
            width="20"
            height="20"
            viewBox="0 0 20 20"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            {" "}
            <path
              d="M7 1H2C1.44772 1 1 1.44772 1 2V9C1 9.55229 1.44772 10 2 10H7C7.55228 10 8 9.55229 8 9V2C8 1.44772 7.55228 1 7 1Z"
              stroke="white"
              stroke-width="1.5"
              stroke-linecap="round"
              stroke-linejoin="round"
            />{" "}
            <path
              d="M18 1H13C12.4477 1 12 1.44772 12 2V5C12 5.55228 12.4477 6 13 6H18C18.5523 6 19 5.55228 19 5V2C19 1.44772 18.5523 1 18 1Z"
              stroke="white"
              stroke-width="1.5"
              stroke-linecap="round"
              stroke-linejoin="round"
            />{" "}
            <path
              d="M18 10H13C12.4477 10 12 10.4477 12 11V18C12 18.5523 12.4477 19 13 19H18C18.5523 19 19 18.5523 19 18V11C19 10.4477 18.5523 10 18 10Z"
              stroke="white"
              stroke-width="1.5"
              stroke-linecap="round"
              stroke-linejoin="round"
            />{" "}
            <path
              d="M7 14H2C1.44772 14 1 14.4477 1 15V18C1 18.5523 1.44772 19 2 19H7C7.55228 19 8 18.5523 8 18V15C8 14.4477 7.55228 14 7 14Z"
              stroke="white"
              stroke-width="1.5"
              stroke-linecap="round"
              stroke-linejoin="round"
            />{" "}
          </svg>
        </span>
      )}

      {eachLink.name == "Form Mapper" && (
        <span className="icon">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            x="0px"
            y="0px"
            width="24"
            height="24"
            viewBox="0 0 50 50"
            fill="none"
          >
            <path d="M 7 2 L 7 48 L 43 48 L 43 14.59375 L 42.71875 14.28125 L 30.71875 2.28125 L 30.40625 2 Z M 9 4 L 29 4 L 29 16 L 41 16 L 41 46 L 9 46 Z M 31 5.4375 L 39.5625 14 L 31 14 Z"></path>
          </svg>
        </span>
      )}

      {eachLink.name == "Law Society compliance reports" && (
        <span className="icon">
          <svg
            width="18"
            height="22"
            viewBox="0 0 18 22"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            {" "}
            <path
              d="M11.9539 1.42446L11.9538 1.42437C11.6024 1.07292 11.1259 0.875326 10.629 0.875L11.9539 1.42446ZM11.9539 1.42446L16.3262 5.79533C16.3263 5.79534 16.3263 5.79536 16.3263 5.79537C16.3263 5.7954 16.3264 5.79543 16.3264 5.79546C16.6777 6.1471 16.8751 6.62387 16.875 7.12096V7.121M11.9539 1.42446L16.875 7.121M16.875 7.121V19.25C16.875 19.7473 16.6775 20.2242 16.3258 20.5758C15.9742 20.9275 15.4973 21.125 15 21.125H3C2.50272 21.125 2.02581 20.9275 1.67417 20.5758C1.32254 20.2242 1.125 19.7473 1.125 19.25V2.75C1.125 2.25272 1.32254 1.77581 1.67417 1.42417M16.875 7.121L1.67417 1.42417M1.67417 1.42417C2.02581 1.07254 2.50272 0.875 3 0.875M1.67417 1.42417L3 0.875M3 0.875H10.6289H3ZM16.125 8V7.625H15.75H12C11.5027 7.625 11.0258 7.42746 10.6742 7.07583C10.3225 6.72419 10.125 6.24728 10.125 5.75V2V1.625H9.75H3C2.70163 1.625 2.41548 1.74353 2.2045 1.9545C1.99353 2.16548 1.875 2.45163 1.875 2.75V19.25C1.875 19.5484 1.99353 19.8345 2.20451 20.0455C2.41548 20.2565 2.70163 20.375 3 20.375H15C15.2984 20.375 15.5845 20.2565 15.7955 20.0455C16.0065 19.8345 16.125 19.5484 16.125 19.25V8ZM15.4395 6.875H16.3448L15.7047 6.23484L11.5152 2.04533L10.875 1.40517V2.3105V5.75C10.875 6.04837 10.9935 6.33452 11.2045 6.5455C11.4155 6.75647 11.7016 6.875 12 6.875H15.4395ZM6.26516 15.2348C6.33549 15.3052 6.375 15.4005 6.375 15.5V17.75C6.375 17.8495 6.33549 17.9448 6.26517 18.0152C6.19484 18.0855 6.09946 18.125 6 18.125C5.90054 18.125 5.80516 18.0855 5.73483 18.0152C5.66451 17.9448 5.625 17.8495 5.625 17.75V15.5C5.625 15.4005 5.66451 15.3052 5.73484 15.2348C5.80516 15.1645 5.90054 15.125 6 15.125C6.09946 15.125 6.19484 15.1645 6.26516 15.2348ZM9 10.625C9.09946 10.625 9.19484 10.6645 9.26517 10.7348C9.33549 10.8052 9.375 10.9005 9.375 11V17.75C9.375 17.8495 9.33549 17.9448 9.26517 18.0152C9.19484 18.0855 9.09946 18.125 9 18.125C8.90054 18.125 8.80516 18.0855 8.73483 18.0152C8.66451 17.9448 8.625 17.8495 8.625 17.75V11C8.625 10.9005 8.66451 10.8052 8.73483 10.7348L8.46967 10.4697L8.73484 10.7348C8.80516 10.6645 8.90054 10.625 9 10.625ZM12.2652 12.9848C12.3355 13.0552 12.375 13.1505 12.375 13.25V17.75C12.375 17.8495 12.3355 17.9448 12.2652 18.0152C12.1948 18.0855 12.0995 18.125 12 18.125C11.9005 18.125 11.8052 18.0855 11.7348 18.0152C11.6645 17.9448 11.625 17.8495 11.625 17.75V13.25C11.625 13.1505 11.6645 13.0552 11.7348 12.9848C11.8052 12.9145 11.9005 12.875 12 12.875C12.0995 12.875 12.1948 12.9145 12.2652 12.9848Z"
              fill="#171D34"
              stroke="white"
              stroke-width="0.75"
            />{" "}
          </svg>
        </span>
      )}
      {eachLink.name == "Report history" && (
        <span className="icon">
          <svg
            width="20"
            height="20"
            viewBox="0 0 20 20"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            {" "}
            <path
              d="M1.3986 9.35109L1.3985 9.35236C1.38282 9.56638 1.375 9.78252 1.375 10C1.375 14.7634 5.23664 18.625 10 18.625C14.7634 18.625 18.625 14.7634 18.625 10C18.625 5.23665 14.7634 1.37501 10 1.37501C7.70829 1.37501 5.62441 2.26922 4.08006 3.72734L3.39408 4.37501H4.3375H6.25C6.34946 4.37501 6.44484 4.41452 6.51516 4.48484C6.58549 4.55517 6.625 4.65055 6.625 4.75001C6.625 4.84946 6.58549 4.94485 6.51517 5.01517C6.44484 5.0855 6.34946 5.12501 6.25 5.12501H2.5C2.40054 5.12501 2.30516 5.0855 2.23484 5.01517C2.16451 4.94485 2.125 4.84946 2.125 4.75001V1.37501C2.125 1.27555 2.16451 1.18017 2.23484 1.10984C2.30516 1.03952 2.40054 1.00001 2.5 1.00001C2.59946 1.00001 2.69484 1.03952 2.76516 1.10984C2.83549 1.18017 2.875 1.27555 2.875 1.37501V2.96501V3.84624L3.51001 3.23523C5.25353 1.5576 7.57994 0.621864 9.99951 0.625008H10C15.1779 0.625008 19.375 4.82211 19.375 10C19.375 15.1779 15.1779 19.375 10 19.375C4.82211 19.375 0.625 15.1779 0.625 10C0.625 9.71754 0.637285 9.43726 0.66243 9.16356L0.662535 9.16237C0.676273 9.00742 0.81329 8.87501 0.99925 8.87501C1.21681 8.87501 1.41921 9.08226 1.3986 9.35109ZM10.375 9.25001V9.62501H10.75H13C13.0995 9.62501 13.1948 9.66452 13.2652 9.73484C13.3355 9.80517 13.375 9.90055 13.375 10C13.375 10.0995 13.3355 10.1948 13.2652 10.2652C13.1948 10.3355 13.0995 10.375 13 10.375H10C9.90054 10.375 9.80516 10.3355 9.73484 10.2652L9.46967 10.5303L9.73483 10.2652C9.66451 10.1948 9.625 10.0995 9.625 10V4.75001C9.625 4.65055 9.66451 4.55517 9.73483 4.48484C9.80516 4.41452 9.90054 4.37501 10 4.37501C10.0995 4.37501 10.1948 4.41452 10.2652 4.48484C10.3355 4.55517 10.375 4.65055 10.375 4.75001V9.25001Z"
              fill="#171D34"
              stroke="white"
              stroke-width="0.75"
            />{" "}
          </svg>
        </span>
      )}
      {eachLink.name == "Monthly Review Checklist" && (
        <span className="icon">
          <svg
            width="18"
            height="18"
            viewBox="0 0 18 18"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            {" "}
            <path
              d="M3.5 7.75C3.5 7.52019 3.54526 7.29262 3.63321 7.0803C3.72116 6.86798 3.85006 6.67507 4.01256 6.51256C4.17507 6.35006 4.36798 6.22116 4.5803 6.13321C4.79262 6.04527 5.02019 6 5.25 6C5.47981 6 5.70738 6.04527 5.9197 6.13321C6.13202 6.22116 6.32493 6.35006 6.48744 6.51256C6.64994 6.67507 6.77884 6.86798 6.86679 7.0803C6.95473 7.29262 7 7.52019 7 7.75C7 8.21413 6.81563 8.65925 6.48744 8.98744C6.15925 9.31563 5.71413 9.5 5.25 9.5C4.78587 9.5 4.34075 9.31563 4.01256 8.98744C3.68437 8.65925 3.5 8.21413 3.5 7.75ZM5.25 6.5C4.91848 6.5 4.60054 6.6317 4.36612 6.86612C4.1317 7.10054 4 7.41848 4 7.75C4 8.08152 4.1317 8.39946 4.36612 8.63388C4.60054 8.8683 4.91848 9 5.25 9C5.58152 9 5.89946 8.8683 6.13388 8.63388C6.3683 8.39946 6.5 8.08152 6.5 7.75C6.5 7.41848 6.3683 7.10054 6.13388 6.86612C5.89946 6.6317 5.58152 6.5 5.25 6.5ZM4.01256 12.0126C4.34075 11.6844 4.78587 11.5 5.25 11.5C5.71413 11.5 6.15925 11.6844 6.48744 12.0126C6.81563 12.3408 7 12.7859 7 13.25C7 13.7141 6.81563 14.1592 6.48744 14.4874C6.15925 14.8156 5.71413 15 5.25 15C4.78587 15 4.34075 14.8156 4.01256 14.4874C3.68437 14.1592 3.5 13.7141 3.5 13.25C3.5 12.7859 3.68437 12.3408 4.01256 12.0126ZM4.36612 12.3661C4.1317 12.6005 4 12.9185 4 13.25C4 13.5815 4.1317 13.8995 4.36612 14.1339C4.60054 14.3683 4.91848 14.5 5.25 14.5C5.58152 14.5 5.89946 14.3683 6.13388 14.1339C6.3683 13.8995 6.5 13.5815 6.5 13.25C6.5 12.9185 6.3683 12.6005 6.13388 12.3661C5.89946 12.1317 5.58152 12 5.25 12C4.91848 12 4.60054 12.1317 4.36612 12.3661ZM9.5 7.75C9.5 7.6837 9.52634 7.62011 9.57322 7.57322C9.62011 7.52634 9.6837 7.5 9.75 7.5H14.25C14.3163 7.5 14.3799 7.52634 14.4268 7.57322C14.4737 7.62011 14.5 7.68369 14.5 7.75C14.5 7.8163 14.4737 7.87989 14.4268 7.92678C14.3799 7.97366 14.3163 8 14.25 8H9.75C9.6837 8 9.62011 7.97366 9.57322 7.92678C9.52634 7.87989 9.5 7.8163 9.5 7.75ZM9.57322 13.0732C9.62011 13.0263 9.6837 13 9.75 13H14.25C14.3163 13 14.3799 13.0263 14.4268 13.0732C14.4737 13.1201 14.5 13.1837 14.5 13.25C14.5 13.3163 14.4737 13.3799 14.4268 13.4268C14.3799 13.4737 14.3163 13.5 14.25 13.5H9.75C9.68369 13.5 9.62011 13.4737 9.57322 13.4268C9.52634 13.3799 9.5 13.3163 9.5 13.25C9.5 13.1837 9.52634 13.1201 9.57322 13.0732ZM3.5 3.75C3.5 3.6837 3.52634 3.62011 3.57322 3.57322C3.62011 3.52634 3.6837 3.5 3.75 3.5H14.25C14.3163 3.5 14.3799 3.52634 14.4268 3.57322C14.4737 3.62011 14.5 3.68369 14.5 3.75C14.5 3.81631 14.4737 3.87989 14.4268 3.92678C14.3799 3.97366 14.3163 4 14.25 4H3.75C3.6837 4 3.62011 3.97366 3.57322 3.92678C3.52634 3.87989 3.5 3.8163 3.5 3.75ZM1.30546 1.30546C1.82118 0.789731 2.52065 0.5 3.25 0.5H14.75C15.4793 0.5 16.1788 0.789731 16.6945 1.30546C17.2103 1.82118 17.5 2.52065 17.5 3.25V14.75C17.5 15.4793 17.2103 16.1788 16.6945 16.6945C16.1788 17.2103 15.4793 17.5 14.75 17.5H3.25C2.52065 17.5 1.82118 17.2103 1.30546 16.6945C0.789731 16.1788 0.5 15.4793 0.5 14.75V3.25C0.5 2.52065 0.789731 1.82118 1.30546 1.30546ZM3.25 1C2.00786 1 1 2.00786 1 3.25V14.75C1 15.3467 1.23705 15.919 1.65901 16.341C2.08097 16.7629 2.65326 17 3.25 17H14.75C15.3467 17 15.919 16.7629 16.341 16.341C16.7629 15.919 17 15.3467 17 14.75V3.25C17 2.00786 15.9921 1 14.75 1H3.25Z"
              fill="#171D34"
              stroke="white"
            />{" "}
          </svg>
        </span>
      )}
      {eachLink.name == "Compliance Form" && (
        <span className="icon">
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            {" "}
            <path
              d="M18.9231 4.38477H5.07692C3.92987 4.38477 3 5.31464 3 6.46169V18.9232C3 20.0703 3.92987 21.0002 5.07692 21.0002H18.9231C20.0701 21.0002 21 20.0703 21 18.9232V6.46169C21 5.31464 20.0701 4.38477 18.9231 4.38477Z"
              stroke="white"
              stroke-width="1.5"
              stroke-linejoin="round"
            />{" "}
            <path
              d="M13.7308 11.9998C14.3044 11.9998 14.7693 11.5348 14.7693 10.9613C14.7693 10.3878 14.3044 9.92285 13.7308 9.92285C13.1573 9.92285 12.6924 10.3878 12.6924 10.9613C12.6924 11.5348 13.1573 11.9998 13.7308 11.9998Z"
              fill="white"
            />{" "}
            <path
              d="M17.1928 11.9998C17.7663 11.9998 18.2312 11.5348 18.2312 10.9613C18.2312 10.3878 17.7663 9.92285 17.1928 9.92285C16.6192 9.92285 16.1543 10.3878 16.1543 10.9613C16.1543 11.5348 16.6192 11.9998 17.1928 11.9998Z"
              fill="white"
            />{" "}
            <path
              d="M13.7308 15.4617C14.3044 15.4617 14.7693 14.9968 14.7693 14.4232C14.7693 13.8497 14.3044 13.3848 13.7308 13.3848C13.1573 13.3848 12.6924 13.8497 12.6924 14.4232C12.6924 14.9968 13.1573 15.4617 13.7308 15.4617Z"
              fill="white"
            />{" "}
            <path
              d="M17.1928 15.4617C17.7663 15.4617 18.2312 14.9968 18.2312 14.4232C18.2312 13.8497 17.7663 13.3848 17.1928 13.3848C16.6192 13.3848 16.1543 13.8497 16.1543 14.4232C16.1543 14.9968 16.6192 15.4617 17.1928 15.4617Z"
              fill="white"
            />{" "}
            <path
              d="M6.80799 15.4617C7.38152 15.4617 7.84645 14.9968 7.84645 14.4232C7.84645 13.8497 7.38152 13.3848 6.80799 13.3848C6.23447 13.3848 5.76953 13.8497 5.76953 14.4232C5.76953 14.9968 6.23447 15.4617 6.80799 15.4617Z"
              fill="white"
            />{" "}
            <path
              d="M10.2689 15.4617C10.8425 15.4617 11.3074 14.9968 11.3074 14.4232C11.3074 13.8497 10.8425 13.3848 10.2689 13.3848C9.6954 13.3848 9.23047 13.8497 9.23047 14.4232C9.23047 14.9968 9.6954 15.4617 10.2689 15.4617Z"
              fill="white"
            />{" "}
            <path
              d="M6.80799 18.9236C7.38152 18.9236 7.84645 18.4587 7.84645 17.8851C7.84645 17.3116 7.38152 16.8467 6.80799 16.8467C6.23447 16.8467 5.76953 17.3116 5.76953 17.8851C5.76953 18.4587 6.23447 18.9236 6.80799 18.9236Z"
              fill="white"
            />{" "}
            <path
              d="M10.2689 18.9236C10.8425 18.9236 11.3074 18.4587 11.3074 17.8851C11.3074 17.3116 10.8425 16.8467 10.2689 16.8467C9.6954 16.8467 9.23047 17.3116 9.23047 17.8851C9.23047 18.4587 9.6954 18.9236 10.2689 18.9236Z"
              fill="white"
            />{" "}
            <path
              d="M13.7308 18.9236C14.3044 18.9236 14.7693 18.4587 14.7693 17.8851C14.7693 17.3116 14.3044 16.8467 13.7308 16.8467C13.1573 16.8467 12.6924 17.3116 12.6924 17.8851C12.6924 18.4587 13.1573 18.9236 13.7308 18.9236Z"
              fill="white"
            />{" "}
            <path
              d="M6.46094 3V4.38462M17.5379 3V4.38462"
              stroke="white"
              stroke-width="1.5"
              stroke-linecap="round"
              stroke-linejoin="round"
            />{" "}
            <path
              d="M21 7.84668H3"
              stroke="white"
              stroke-width="1.5"
              stroke-linejoin="round"
            />{" "}
          </svg>
        </span>
      )}

      {eachLink.name == "Billing" && (
        <span className="icon">
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M20.016 2C18.903 2 18 4.686 18 8H20.016C20.988 8 21.473 8 21.774 7.665C22.074 7.329 22.022 6.887 21.918 6.004C21.64 3.67 20.894 2 20.016 2Z"
              stroke="white"
              stroke-width="1.5"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
            <path
              d="M18 8.054V18.646C18 20.157 18 20.913 17.538 21.211C16.783 21.697 15.616 20.677 15.029 20.307C14.544 20.001 14.302 19.849 14.033 19.84C13.742 19.83 13.495 19.977 12.971 20.307L11.06 21.512C10.544 21.837 10.287 22 10 22C9.713 22 9.455 21.837 8.94 21.512L7.03 20.307C6.544 20.001 6.302 19.849 6.033 19.84C5.742 19.83 5.495 19.977 4.971 20.307C4.384 20.677 3.217 21.697 2.461 21.211C2 20.913 2 20.158 2 18.646V8.054C2 5.2 2 3.774 2.879 2.887C3.757 2 5.172 2 8 2H20M6 6H14M8 10H6"
              stroke="white"
              stroke-width="1.5"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
            <path
              d="M12.5 10.875C11.672 10.875 11 11.463 11 12.188C11 12.912 11.672 13.5 12.5 13.5C13.328 13.5 14 14.088 14 14.813C14 15.537 13.328 16.125 12.5 16.125M12.5 10.875C13.153 10.875 13.709 11.24 13.915 11.75L12.5 10.875ZM12.5 10.875V10V10.875ZM12.5 16.125C11.847 16.125 11.291 15.76 11.085 15.25L12.5 16.125ZM12.5 16.125V17V16.125Z"
              fill="white"
            />
            <path
              d="M12.5 10.875C11.672 10.875 11 11.463 11 12.188C11 12.912 11.672 13.5 12.5 13.5C13.328 13.5 14 14.088 14 14.813C14 15.537 13.328 16.125 12.5 16.125M12.5 10.875C13.153 10.875 13.709 11.24 13.915 11.75M12.5 10.875V10M12.5 16.125C11.847 16.125 11.291 15.76 11.085 15.25M12.5 16.125V17"
              stroke="white"
              stroke-width="1.5"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
        </span>
      )}

      {eachLink.name == "Workflows" && (
        <span className="icon">
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M14 5C13.4696 5 12.9609 5.21071 12.5858 5.58579C12.2107 5.96086 12 6.46957 12 7V17C12 17.5304 11.7893 18.0391 11.4142 18.4142C11.0391 18.7893 10.5304 19 10 19M3 19C3 19.5304 3.21071 20.0391 3.58579 20.4142C3.96086 20.7893 4.46957 21 5 21C5.53043 21 6.03914 20.7893 6.41421 20.4142C6.78929 20.0391 7 19.5304 7 19C7 18.4696 6.78929 17.9609 6.41421 17.5858C6.03914 17.2107 5.53043 17 5 17C4.46957 17 3.96086 17.2107 3.58579 17.5858C3.21071 17.9609 3 18.4696 3 19ZM19 7C19.5304 7 20.0391 6.78929 20.4142 6.41421C20.7893 6.03914 21 5.53043 21 5C21 4.46957 20.7893 3.96086 20.4142 3.58579C20.0391 3.21071 19.5304 3 19 3C18.4696 3 17.9609 3.21071 17.5858 3.58579C17.2107 3.96086 17 4.46957 17 5C17 5.53043 17.2107 6.03914 17.5858 6.41421C17.9609 6.78929 18.4696 7 19 7Z"
              stroke="white"
              stroke-width="1.5"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
        </span>
      )}

      {eachLink.name == "Calculator" && (
        <span className="icon">
          <svg
            width="18"
            height="20"
            viewBox="0 0 18 20"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            {" "}
            <path
              d="M2.08659 17.6815C3.27279 19 5.18259 19 9.00039 19C12.8191 19 14.728 19 15.9142 17.6815C17.1004 16.3648 17.1004 14.2426 17.1004 10C17.1004 5.7574 17.1004 3.6361 15.9142 2.3176C14.728 1 12.8182 1 9.00039 1C5.18169 1 3.27279 1 2.08659 2.3176C0.900391 3.637 0.900391 5.7574 0.900391 10C0.900391 14.2426 0.900391 16.3639 2.08659 17.6815Z"
              stroke="white"
              stroke-width="1.35"
            />{" "}
            <path
              d="M4.5 6.39961C4.5 5.98111 4.5 5.77231 4.5459 5.60041C4.60727 5.37169 4.72773 5.16314 4.89518 4.99569C5.06263 4.82824 5.27118 4.70778 5.4999 4.64641C5.6736 4.59961 5.8824 4.59961 6.3 4.59961H11.7C12.1185 4.59961 12.3273 4.59961 12.4992 4.64551C12.7279 4.70688 12.9365 4.82734 13.1039 4.99479C13.2714 5.16224 13.3918 5.37079 13.4532 5.59951C13.5 5.77321 13.5 5.98201 13.5 6.39961C13.5 6.81721 13.5 7.02691 13.4541 7.19881C13.3927 7.42753 13.2723 7.63608 13.1048 7.80353C12.9374 7.97098 12.7288 8.09144 12.5001 8.15281C12.3273 8.19961 12.1176 8.19961 11.7 8.19961H6.3C5.8815 8.19961 5.6727 8.19961 5.5008 8.15371C5.27208 8.09234 5.06353 7.97188 4.89608 7.80443C4.72863 7.63698 4.60817 7.42843 4.5468 7.19971C4.5 7.02601 4.5 6.81721 4.5 6.39961Z"
              stroke="white"
              stroke-width="1.35"
            />{" "}
            <path
              d="M5.4 12.7004C5.89706 12.7004 6.3 12.2974 6.3 11.8004C6.3 11.3033 5.89706 10.9004 5.4 10.9004C4.90294 10.9004 4.5 11.3033 4.5 11.8004C4.5 12.2974 4.90294 12.7004 5.4 12.7004Z"
              fill="white"
            />{" "}
            <path
              d="M5.4 16.3C5.89706 16.3 6.3 15.8971 6.3 15.4C6.3 14.9029 5.89706 14.5 5.4 14.5C4.90294 14.5 4.5 14.9029 4.5 15.4C4.5 15.8971 4.90294 16.3 5.4 16.3Z"
              fill="white"
            />{" "}
            <path
              d="M9.00059 12.7004C9.49764 12.7004 9.90059 12.2974 9.90059 11.8004C9.90059 11.3033 9.49764 10.9004 9.00059 10.9004C8.50353 10.9004 8.10059 11.3033 8.10059 11.8004C8.10059 12.2974 8.50353 12.7004 9.00059 12.7004Z"
              fill="white"
            />{" "}
            <path
              d="M9.00059 16.3C9.49764 16.3 9.90059 15.8971 9.90059 15.4C9.90059 14.9029 9.49764 14.5 9.00059 14.5C8.50353 14.5 8.10059 14.9029 8.10059 15.4C8.10059 15.8971 8.50353 16.3 9.00059 16.3Z"
              fill="white"
            />{" "}
            <path
              d="M12.6002 12.7004C13.0973 12.7004 13.5002 12.2974 13.5002 11.8004C13.5002 11.3033 13.0973 10.9004 12.6002 10.9004C12.1031 10.9004 11.7002 11.3033 11.7002 11.8004C11.7002 12.2974 12.1031 12.7004 12.6002 12.7004Z"
              fill="white"
            />{" "}
            <path
              d="M12.6002 16.3C13.0973 16.3 13.5002 15.8971 13.5002 15.4C13.5002 14.9029 13.0973 14.5 12.6002 14.5C12.1031 14.5 11.7002 14.9029 11.7002 15.4C11.7002 15.8971 12.1031 16.3 12.6002 16.3Z"
              fill="white"
            />{" "}
          </svg>
        </span>
      )}
      {eachLink.name == "Forms" && (
        <span className="icon">{eachLink.icon}</span>
      )}
      {eachLink.name == "Operational Dashboard" && (
        <span className="icon">
          <svg
            width="20"
            height="20"
            viewBox="0 0 20 20"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            {" "}
            <path
              d="M7 1H2C1.44772 1 1 1.44772 1 2V9C1 9.55229 1.44772 10 2 10H7C7.55228 10 8 9.55229 8 9V2C8 1.44772 7.55228 1 7 1Z"
              stroke="white"
              stroke-width="1.5"
              stroke-linecap="round"
              stroke-linejoin="round"
            />{" "}
            <path
              d="M18 1H13C12.4477 1 12 1.44772 12 2V5C12 5.55228 12.4477 6 13 6H18C18.5523 6 19 5.55228 19 5V2C19 1.44772 18.5523 1 18 1Z"
              stroke="white"
              stroke-width="1.5"
              stroke-linecap="round"
              stroke-linejoin="round"
            />{" "}
            <path
              d="M18 10H13C12.4477 10 12 10.4477 12 11V18C12 18.5523 12.4477 19 13 19H18C18.5523 19 19 18.5523 19 18V11C19 10.4477 18.5523 10 18 10Z"
              stroke="white"
              stroke-width="1.5"
              stroke-linecap="round"
              stroke-linejoin="round"
            />{" "}
            <path
              d="M7 14H2C1.44772 14 1 14.4477 1 15V18C1 18.5523 1.44772 19 2 19H7C7.55228 19 8 18.5523 8 18V15C8 14.4477 7.55228 14 7 14Z"
              stroke="white"
              stroke-width="1.5"
              stroke-linecap="round"
              stroke-linejoin="round"
            />{" "}
          </svg>
        </span>
      )}
      {eachLink.name == "Matter" && (
        <span className="icon">
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M14.9539 2.42446L14.9538 2.42437C14.6024 2.07292 14.1259 1.87533 13.629 1.875L14.9539 2.42446ZM14.9539 2.42446L19.3262 6.79533C19.3263 6.79534 19.3263 6.79536 19.3263 6.79537C19.3263 6.7954 19.3264 6.79543 19.3264 6.79546C19.6777 7.1471 19.8751 7.62387 19.875 8.12096V8.121M14.9539 2.42446L19.875 8.121M19.875 8.121V20.25C19.875 20.7473 19.6775 21.2242 19.3258 21.5758C18.9742 21.9275 18.4973 22.125 18 22.125H6C5.50272 22.125 5.02581 21.9275 4.67417 21.5758C4.32254 21.2242 4.125 20.7473 4.125 20.25V3.75C4.125 3.25272 4.32254 2.77581 4.67417 2.42417M19.875 8.121L4.67417 2.42417M4.67417 2.42417C5.02581 2.07254 5.50272 1.875 6 1.875M4.67417 2.42417L6 1.875M6 1.875H13.6289H6ZM19.125 9V8.625H18.75H15C14.5027 8.625 14.0258 8.42746 13.6742 8.07583C13.3225 7.72419 13.125 7.24728 13.125 6.75V3V2.625H12.75H6C5.70163 2.625 5.41548 2.74353 5.2045 2.9545C4.99353 3.16548 4.875 3.45163 4.875 3.75V20.25C4.875 20.5484 4.99353 20.8345 5.20451 21.0455C5.41548 21.2565 5.70163 21.375 6 21.375H18C18.2984 21.375 18.5845 21.2565 18.7955 21.0455C19.0065 20.8345 19.125 20.5484 19.125 20.25V9ZM18.4395 7.875H19.3448L18.7047 7.23484L14.5152 3.04533L13.875 2.40517V3.3105V6.75C13.875 7.04837 13.9935 7.33452 14.2045 7.5455C14.4155 7.75647 14.7016 7.875 15 7.875H18.4395ZM9.26516 16.2348C9.33549 16.3052 9.375 16.4005 9.375 16.5V18.75C9.375 18.8495 9.33549 18.9448 9.26517 19.0152C9.19484 19.0855 9.09946 19.125 9 19.125C8.90054 19.125 8.80516 19.0855 8.73483 19.0152C8.66451 18.9448 8.625 18.8495 8.625 18.75V16.5C8.625 16.4005 8.66451 16.3052 8.73484 16.2348C8.80516 16.1645 8.90054 16.125 9 16.125C9.09946 16.125 9.19484 16.1645 9.26516 16.2348ZM12 11.625C12.0995 11.625 12.1948 11.6645 12.2652 11.7348C12.3355 11.8052 12.375 11.9005 12.375 12V18.75C12.375 18.8495 12.3355 18.9448 12.2652 19.0152C12.1948 19.0855 12.0995 19.125 12 19.125C11.9005 19.125 11.8052 19.0855 11.7348 19.0152C11.6645 18.9448 11.625 18.8495 11.625 18.75V12C11.625 11.9005 11.6645 11.8052 11.7348 11.7348L11.4697 11.4697L11.7348 11.7348C11.8052 11.6645 11.9005 11.625 12 11.625ZM15.2652 13.9848C15.3355 14.0552 15.375 14.1505 15.375 14.25V18.75C15.375 18.8495 15.3355 18.9448 15.2652 19.0152C15.1948 19.0855 15.0995 19.125 15 19.125C14.9005 19.125 14.8052 19.0855 14.7348 19.0152C14.6645 18.9448 14.625 18.8495 14.625 18.75V14.25C14.625 14.1505 14.6645 14.0552 14.7348 13.9848C14.8052 13.9145 14.9005 13.875 15 13.875C15.0995 13.875 15.1948 13.9145 15.2652 13.9848Z"
              fill="#171D34"
              stroke="#73C3FD"
              stroke-width="0.75"
            />
          </svg>
        </span>
      )}
      {eachLink.name == "Report issue" && (
        <span className="icon">
          <ReportGmailerrorredIcon />
        </span>
      )}

      {eachLink.name == "Archive" && (
        <span className="icon">
          <IoMdArchive size={20} />
        </span>
      )}

      {eachLink.name == "Trust Deposit Slip" && (
        <span className="icon">
          <CiReceipt size={30} />
        </span>
      )}

      {eachLink.name == "Operational Reports" && (
        <span className="icon">
          <TbReportSearch size={20} />
        </span>
      )}

      {eachLink.name}
    </NavLink>
  );
};

export default Navbar;
