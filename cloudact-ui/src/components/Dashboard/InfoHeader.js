import { useState, useEffect, useRef } from "react";
import Cookies from "js-cookie";
import { useDispatch, useSelector } from "react-redux";
import { useLocation } from "react-router-dom";
import {
  fullRefreshAction,
  fullRefreshActionFromDashboard,
  userChangeAction,
} from "../../actions/userActions";
import ProfilePic from "../../assets/images/profile_pic.jpeg";
import Bills from "../../assets/images/Bills.png";
import PendingState from "../../assets/images/PendingState.png";
import Done from "../../assets/images/Done.png";
import Amend from "../../assets/images/Amend.png";
import Compliance_Created from "../../assets/images/Compliance_Created.png";
import Compliance_SignOff_Preparer from "../../assets/images/Compliance_SignOff_Preparer.png";
import Compliance_SignOff_Reviewer from "../../assets/images/Compliance_SignOff_Reviewer.png";
import Monthly_Form_Created from "../../assets/images/Monthly_Form_Created.png";
import Monthly_SignOff_Preparer from "../../assets/images/Monthly_SignOff_Preparer.png";
import Monthly_SignOff_Reviewer from "../../assets/images/Monthly_SignOff_Reviewer.png";
import { changeInfoInUserInfo } from "../../actions/userActions";
import {
  clioConnectedOrNot,
  getCurrentUserFromCookies,
  getRegionOfUser,
  getUserId,
  getUserSID,
  updateCookiesInfo,
  updateInfoInCurrentUser,
} from "../../utils/helpers";
import { momentFunction } from "../../utils/moment";
import axios from "../../utils/axios";
import Dropdown from "../Dropdown";
import Menu from "../Menu";
import { Roles } from "../../routes/Role.types";
import { CgBell } from "react-icons/cg";
import { TiTick } from "react-icons/ti";
import { TiDeleteOutline } from "react-icons/ti";
import { BiCheckDouble, BiUndo } from "react-icons/bi";
import { RiMore2Line } from "react-icons/ri";
import "./infoHeader.css";
import { Pointer } from "tabler-icons-react";
import PendingTaskIcon from "../../assets/images/Workflow-icons/workflow_almost_missed.svg";
import MissedDueDateIcon from "../../assets/images/Workflow-icons/workflow_missed.svg";
import NewStepAddedIcon from "../../assets/images/Workflow-icons/workflow_plus.svg";
import { getSvg } from "../../containers/Dashboard/assetsDashboard/getSvg";
import { LuRefreshCcw } from "react-icons/lu";
import ModalInputCenter from "../ModalInputCenter";
import dataLoadApi from "../../utils/Apis/setup/data_load_status";

const InfoHeader = ({ title }) => {
  const location = useLocation();
  const dispatch = useDispatch();
  const [showLoading, setShowLoading] = useState(false);
  const [openMenu, setOpenMenu] = useState(false);

  const { userRole } = useSelector((state) => state.userChange);
  const { userInfo } = useSelector((state) => state.userLogin);

  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [modalMessage, setModalMessage] = useState({});
  const [selectedNotification, setSelectedNotification] = useState(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);
  const [showDataEraseAlert, setshowDataEraseAlert] = useState(false);

  const handleClickOutside = (event) => {
    if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
      setShowDropdown(false);
    }
  };

  useEffect(() => {
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleDeleteClick = (notificationId) => {
    setSelectedNotification(notificationId);
    setModalMessage({
      message: "Are you sure you want to delete this notification?",
      type: "delete",
    });
    setShowModal(true);
  };

  const handleAllAsUnread = () => {
    setModalMessage({
      message: "Are you sure you want to mark all notifications as unread?",
      type: "unread",
    });
    setShowModal(true);
  };

  const clearAllNotifications = () => {
    setModalMessage({
      message: "Are you sure you want to delete all notifications?",
      type: "clear",
    });
    setShowModal(true);
  };

  const markNotificationAsUnread = async (notificationId) => {
    try {
      // API call to mark the notification as unread
      await axios.patch(`/notifications/markAsUnread/${notificationId}`);

      // Update the state locally to reflect the unread status
      setNotifications((prevNotifications) =>
        prevNotifications.map((notification) =>
          notification.id === notificationId
            ? { ...notification, isRead: false } // Mark as unread
            : notification
        )
      );

      // Increase the unread count
      setUnreadCount((prevCount) => prevCount + 1);
    } catch (error) {
      // Log error for debugging
      console.error("Error marking notification as unread:", error);
    }
  };

  const markAllNotificationAsUnread = async () => {
    try {
      // API call to mark all notifications as unread
      const userId = getUserId();
      await axios.patch(`/notifications/markAllAsUnread/${userId}`);

      // Update the state locally to reflect the unread status
      setNotifications((prevNotifications) =>
        prevNotifications.map((notification) => ({
          ...notification,
          isRead: false, // Mark all as unread
        }))
      );

      // Reset read count to total
      setUnreadCount(notifications.length);
    } catch (error) {
      // Log error for debugging
      console.error("Error marking all notifications as unread:", error);
    }
  };

  const clearNotifications = async () => {
    try {
      // API call to clear notifications
      const userId = getUserId();
      await axios.delete(`/notifications/clear/${userId}`);

      // Update the state locally to reflect the unread status
      setNotifications([]);
      setUnreadCount(0);
    } catch (error) {
      // Log error for debugging
      console.error("Error clearing notifications:", error);
    }
  };

  const handleDataLoad = () => {
    setshowDataEraseAlert(true);
  };

  const deleteDataLoad = () => {
    dispatch(fullRefreshActionFromDashboard());
  };

  // Function to confirm deletion
  const confirmDelete = () => {
    if (selectedNotification) {
      deleteNotification(selectedNotification);
    }
    setShowModal(false);
    setSelectedNotification(null);
  };

  const confirmUnread = () => {
    markAllNotificationAsUnread();
    setShowModal(false);
    setSelectedNotification(null);
  };

  const confirmClear = () => {
    clearNotifications();
    setShowModal(false);
    setSelectedNotification(null);
  };

  const userProfileInfo = useSelector(
    (state) => state.userProfileInfo.response
  );
  const [open, setopenNotify] = useState(false);
  const onClickNotify = () => setopenNotify(!open);

  useEffect(() => {
    getRefreshState();
  }, []);

  // Fetch notifications dynamically based on the user's role and uid
  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        // setLoading(true); // Uncomment if you handle loading state

        // Make an API call to fetch notifications
        const response = await axios.get(
          `/notifications/fetch?uid=${getUserId()}`
        );
        const { data } = response;

        if (data.status === 200 && data.data.length > 0) {
          const notificationsData = data.data;
          setNotifications(notificationsData || []);
          const unreadCount = notificationsData.filter(
            (msg) => !msg.isRead
          ).length;
          setUnreadCount(unreadCount);
        } else {
          console.error("Unexpected API response structure:", data);
          setNotifications([]);
          setUnreadCount(0);
        }
      } catch (error) {
        console.error("Error fetching notifications:", error);
      } finally {
        // setLoading(false); // Uncomment if you handle loading state
      }
    };

    fetchNotifications();
  }, []); // Runs once on component mount

  // Mark notification as read
  const markNotificationAsRead = async (notificationId) => {
    try {
      // API call to mark the notification as read
      await axios.patch(`/notifications/markAsRead/${notificationId}`);

      // Update the state locally to reflect the read status
      setNotifications((prevNotifications) =>
        prevNotifications.map((notification) =>
          notification.id === notificationId
            ? { ...notification, isRead: true } // Mark as read
            : notification
        )
      );

      // Decrease the unread count
      setUnreadCount((prevCount) => (prevCount > 0 ? prevCount - 1 : 0));
    } catch (error) {
      // Log error for debugging
      console.error("Error marking notification as read:", error);
    }
  };

  const deleteNotification = async (notificationId) => {
    try {
      // API call to delete the notification
      await axios.delete(`/notifications/delete/${notificationId}`);

      // Update the state locally to remove the deleted notification
      setNotifications((prevNotifications) =>
        prevNotifications.filter(
          (notification) => notification.id !== notificationId
        )
      );
    } catch (error) {
      // Log error for debugging
      console.error("Error deleting notification:", error);
    }
  };

  const getIconForWorkflowNotification = (notificationType) => {
    // console.log({ notificationType });
    if (notificationType.includes("assigned")) {
      return (
        <img
          src={NewStepAddedIcon}
          alt="Workflow Icon"
          style={{
            width: "62px",
            height: "60px",
            // borderRadius: "50%",
          }}
        />
      );
    }
    if (notificationType.includes("removed")) {
      return (
        <img
          src={NewStepAddedIcon}
          alt="Workflow Icon"
          style={{
            width: "62px",
            height: "60px",
            // borderRadius: "50%",
          }}
        />
      );
    }
    if (notificationType.includes("Due date")) {
      return (
        <img
          src={MissedDueDateIcon}
          alt="Workflow Icon"
          style={{
            width: "62px",
            height: "60px",
            // borderRadius: "50%",
          }}
        />
      );
    } else {
      if (
        notificationType.includes("new") ||
        notificationType.includes("completed")
      ) {
        return (
          <img
            src={NewStepAddedIcon}
            alt="Workflow Icon"
            style={{
              width: "62px",
              height: "60px",
              // borderRadius: "50%",
            }}
          />
        );
      } else {
        <img
          src={PendingTaskIcon}
          alt="Workflow Icon"
          style={{
            width: "62px",
            height: "60px",
            // borderRadius: "50%",
          }}
        />;
      }
    }
  };

  function Notification({ notification }) {
    // Function to calculate local time ago
    const getLocalTimeAgo = (utcTimeString) => {
      if (!utcTimeString) return "Invalid time";

      // Convert the string to proper UTC format
      const utcTime = `${utcTimeString}Z`; // Adding 'Z' for UTC format

      // Get current local time and convert it to UTC
      const now = new Date();
      const utcNow = new Date(now.toISOString()); // Current time in UTC

      // Parse the provided UTC time
      const utcDate = new Date(utcTime);

      // Calculate time difference in milliseconds
      const timeDiff = utcNow.getTime() - utcDate.getTime();

      // Handle negative values (future dates)
      if (timeDiff < 0) return "In the future";

      const seconds = Math.floor(timeDiff / 1000);
      const minutes = Math.floor(seconds / 60);
      const hours = Math.floor(minutes / 60);
      const days = Math.floor(hours / 24);

      if (seconds < 60) {
        return `${seconds} seconds ago`;
      } else if (minutes < 60) {
        return `${minutes} minutes ago`;
      } else if (hours < 24) {
        return `${hours} hours ago`;
      } else {
        return `${days} days ago`;
      }
    };

    return (
      <p style={{ fontSize: "18px", width: "100px" }}>
        {getLocalTimeAgo(notification.timeAgo)}
      </p>
    );
  }

  // Mark all notifications as read
  const markAllAsRead = async () => {
    try {
      // API call to mark all notifications as read
      const userId = getUserId();
      await axios.patch(`/notifications/markAllAsRead/${userId}`);

      // Update state locally
      setNotifications((prev) =>
        prev.map((notification) => ({ ...notification, isRead: true }))
      );
      setUnreadCount(0);
    } catch (error) {
      console.error("Error marking notifications as read:", error);
    }
  };

  const getRefreshState = (OptionalChange = null) => {
    axios
      .get(`/services/status/${getUserSID()}`)
      .then((res) => {
        if (res.data.data.code === 200) {
          const { authClio, authIntuit, updated_at } = res.data.data.body;
          dispatch(
            changeInfoInUserInfo({
              updated_at: updated_at,
              authClio: authClio,
              authIntuit: authIntuit,
              ...OptionalChange,
            })
          );
          if (authClio !== undefined) {
            Cookies.set("authClio", authClio);
          } else {
            Cookies.set("authClio", false);
          }

          if (authIntuit !== undefined) {
            Cookies.set("authIntuit", authIntuit);
          } else {
            Cookies.set("authIntuit", false);
          }
        }
      })
      .catch((err) => {
        console.log("err", err);
      });
  };

  const curClientList = userInfo?.role;

  // Header profile label: truncate to 20 characters with an ellipsis so long
  // values (e.g. an email used as the name) don't overflow the header.
  const profileName = `${userProfileInfo?.first_name ?? ""} ${
    userProfileInfo?.last_name ?? ""
  }`.trim();
  const profileNameShort =
    profileName.length > 20 ? `${profileName.slice(0, 20)}...` : profileName;

  const menuList = [
    {
      option: "Profile",
      link: "/profile/edit",
    },
    {
      option: "divider",
      link: "",
    },
  ];

  const onClientChange = (e, list, type) => {
    const text = e.target.innerText;
    const role = e.target.dataset.role;
    const filter = list.filter((e) => {
      return e.display_firmname.trim() === text && e.role.trim() === role;
    });

    if (
      filter[0].display_firmname !== userRole.display_firmname ||
      filter[0].role !== userRole.role
    ) {
      setShowLoading(true);
      setTimeout(() => {
        setShowLoading(false);
        window.location.reload();
      }, 3000);
    }

    return filter[0];
  };

  const pageTitle = () => {
    switch (location.pathname) {
      case "/runreport":
        return "Law society compliance reports";
      case "/tasks/form":
        return "Tasks";
      default:
        break;
    }
  };
  return (
    <>
      {showLoading && <div className="loader">Changing Client</div>}
      <header className="mainHeader">
        <span className="title">
          {title}
          <div>
            <text>{pageTitle()}</text>
          </div>
          {["/runreport", "/reports", "/new_report_history"].includes(
            location.pathname
          ) && (
            <text>
              Clio & QuickBooks were last refreshed on:{" "}
              <span>
                {userInfo?.updated_at
                  ? momentFunction.formatDate(
                      userInfo.updated_at,
                      "MMM D, YYYY hh:mm A"
                    )
                  : "Sep 13, 2023 08:40 AM"}
              </span>
            </text>
          )}
        </span>
        <div className="controls">
          <Dropdown
            type={
              getCurrentUserFromCookies()?.role == Roles.SUPERADMIN
                ? "CloudAct"
                : "Firmname"
            }
            addClassName={"bg-transparent"}
            list={curClientList}
            curClient={
              getCurrentUserFromCookies() &&
              getCurrentUserFromCookies().display_firmname
            }
            handleClientChange={(e, list, type) =>
              onClientChange(e, list, type)
            }
            stateToChange={(e) => dispatch(userChangeAction(e))}
          ></Dropdown>

          {/* hide for now .  uncomment when you need to use notification part */}

          {/* <div class="dropdown notificationDrop unread">
            <button
              onClick={onClickNotify}
              className={`${open ? "show" : ""}`}
              type="button"
              data-bs-toggle="dropdown"
              aria-expanded="false"
            >
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                {" "}
                <path
                  d="M6 19V10C6 8.4087 6.63214 6.88258 7.75736 5.75736C8.88258 4.63214 10.4087 4 12 4C13.5913 4 15.1174 4.63214 16.2426 5.75736C17.3679 6.88258 18 8.4087 18 10V19M6 19H18M6 19H4M18 19H20M11 22H13"
                  stroke="#171D34"
                  stroke-width="1.5"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />{" "}
                <path
                  d="M12 4C12.5523 4 13 3.55228 13 3C13 2.44772 12.5523 2 12 2C11.4477 2 11 2.44772 11 3C11 3.55228 11.4477 4 12 4Z"
                  stroke="#171D34"
                  stroke-width="1.5"
                />{" "}
              </svg>
            </button>
            <div className={`notifications ${open ? "show" : ""}`}>
              <span className="title">
                Notification <span className="count">2</span>
              </span>
              <div className="notifcationInner">
                <a href="#" className="unread">
                  <span className="thumb">
                    <img
                      src="https://portal.bilardo.gov.tr/assets/pages/media/profile/profile_user.jpg"
                      alt="unknown"
                    />
                  </span>
                  <span className="nameInfo">
                    <strong>{`${
                      userProfileInfo?.first_name != undefined
                        ? userProfileInfo?.first_name
                        : ""
                    } ${
                      userProfileInfo?.last_name != undefined
                        ? userProfileInfo?.last_name
                        : ""
                    }`}</strong>
                    5m ago
                  </span>
                  <span className="notifyInfo">
                    <span>
                      assigned a <strong>Report</strong>
                    </span>
                  </span>
                </a>
                <a href="#" className="unread">
                  <span className="thumb">
                    <img
                      src="https://portal.bilardo.gov.tr/assets/pages/media/profile/profile_user.jpg"
                      alt="unknown"
                    />
                  </span>
                  <span className="nameInfo">
                    <strong>{`${
                      userProfileInfo?.first_name != undefined
                        ? userProfileInfo?.first_name
                        : ""
                    } ${
                      userProfileInfo?.last_name != undefined
                        ? userProfileInfo?.last_name
                        : ""
                    }`}</strong>
                    5m ago
                  </span>
                  <span className="notifyInfo">
                    <span>
                      assigned a <strong>Report</strong>
                    </span>
                  </span>
                </a>
                <a href="#">
                  <span className="thumb">
                    <img
                      src="https://portal.bilardo.gov.tr/assets/pages/media/profile/profile_user.jpg"
                      alt="unknown"
                    />
                  </span>
                  <span className="nameInfo">
                    <strong>{`${
                      userProfileInfo?.first_name != undefined
                        ? userProfileInfo?.first_name
                        : ""
                    } ${
                      userProfileInfo?.last_name != undefined
                        ? userProfileInfo?.last_name
                        : ""
                    }`}</strong>
                    5m ago
                  </span>
                  <span className="notifyInfo">
                    <span>
                      assigned a <strong>Report</strong>
                    </span>
                    <span className="blueColor">
                      <svg
                        width="8"
                        height="8"
                        viewBox="0 0 8 8"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        {" "}
                        <path
                          d="M1.08398 4.525L2.9174 6.625L7.50065 1.375"
                          stroke="#307FF4"
                          stroke-width="0.875"
                          stroke-linecap="round"
                          stroke-linejoin="round"
                        />{" "}
                      </svg>{" "}
                      read
                    </span>
                  </span>
                </a>
                <a href="#">
                  <span className="thumb">
                    <img
                      src="https://portal.bilardo.gov.tr/assets/pages/media/profile/profile_user.jpg"
                      alt="unknown"
                    />
                  </span>
                  <span className="nameInfo">
                    <strong>{`${
                      userProfileInfo?.first_name != undefined
                        ? userProfileInfo?.first_name
                        : ""
                    } ${
                      userProfileInfo?.last_name != undefined
                        ? userProfileInfo?.last_name
                        : ""
                    }`}</strong>
                    5m ago
                  </span>
                  <span className="notifyInfo">
                    <span>
                      assigned a <strong>Report</strong>
                    </span>
                    <span className="blueColor">
                      <svg
                        width="8"
                        height="8"
                        viewBox="0 0 8 8"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        {" "}
                        <path
                          d="M1.08398 4.525L2.9174 6.625L7.50065 1.375"
                          stroke="#307FF4"
                          stroke-width="0.875"
                          stroke-linecap="round"
                          stroke-linejoin="round"
                        />{" "}
                      </svg>{" "}
                      read
                    </span>
                  </span>
                </a>
                <a href="#">
                  <span className="thumb">
                    <img
                      src="https://portal.bilardo.gov.tr/assets/pages/media/profile/profile_user.jpg"
                      alt="unknown"
                    />
                  </span>
                  <span className="nameInfo">
                    <strong>{`${
                      userProfileInfo?.first_name != undefined
                        ? userProfileInfo?.first_name
                        : ""
                    } ${
                      userProfileInfo?.last_name != undefined
                        ? userProfileInfo?.last_name
                        : ""
                    }`}</strong>
                    5m ago
                  </span>
                  <span className="notifyInfo">
                    <span>
                      assigned a <strong>Report</strong>
                    </span>
                    <span className="blueColor">
                      <svg
                        width="8"
                        height="8"
                        viewBox="0 0 8 8"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        {" "}
                        <path
                          d="M1.08398 4.525L2.9174 6.625L7.50065 1.375"
                          stroke="#307FF4"
                          stroke-width="0.875"
                          stroke-linecap="round"
                          stroke-linejoin="round"
                        />{" "}
                      </svg>{" "}
                      read
                    </span>
                  </span>
                </a>
                <a href="#">
                  <span className="thumb">
                    <img
                      src="https://portal.bilardo.gov.tr/assets/pages/media/profile/profile_user.jpg"
                      alt="unknown"
                    />
                  </span>
                  <span className="nameInfo">
                    <strong>{`${
                      userProfileInfo?.first_name != undefined
                        ? userProfileInfo?.first_name
                        : ""
                    } ${
                      userProfileInfo?.last_name != undefined
                        ? userProfileInfo?.last_name
                        : ""
                    }`}</strong>
                    5m ago
                  </span>
                  <span className="notifyInfo">
                    <span>
                      assigned a <strong>Report</strong>
                    </span>
                    <span className="blueColor">
                      <svg
                        width="8"
                        height="8"
                        viewBox="0 0 8 8"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        {" "}
                        <path
                          d="M1.08398 4.525L2.9174 6.625L7.50065 1.375"
                          stroke="#307FF4"
                          stroke-width="0.875"
                          stroke-linecap="round"
                          stroke-linejoin="round"
                        />{" "}
                      </svg>{" "}
                      read
                    </span>
                  </span>
                </a>
                <a href="#">
                  <span className="thumb">
                    <img
                      src="https://portal.bilardo.gov.tr/assets/pages/media/profile/profile_user.jpg"
                      alt="unknown"
                    />
                  </span>
                  <span className="nameInfo">
                    <strong>{`${
                      userProfileInfo?.first_name != undefined
                        ? userProfileInfo?.first_name
                        : ""
                    } ${
                      userProfileInfo?.last_name != undefined
                        ? userProfileInfo?.last_name
                        : ""
                    }`}</strong>
                    5m ago
                  </span>
                  <span className="notifyInfo">
                    <span>
                      assigned a <strong>Report</strong>
                    </span>
                    <span className="blueColor">
                      <svg
                        width="8"
                        height="8"
                        viewBox="0 0 8 8"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        {" "}
                        <path
                          d="M1.08398 4.525L2.9174 6.625L7.50065 1.375"
                          stroke="#307FF4"
                          stroke-width="0.875"
                          stroke-linecap="round"
                          stroke-linejoin="round"
                        />{" "}
                      </svg>{" "}
                      read
                    </span>
                  </span>
                </a>
                <a href="#">
                  <span className="thumb">
                    <img
                      src="https://portal.bilardo.gov.tr/assets/pages/media/profile/profile_user.jpg"
                      alt="unknown"
                    />
                  </span>
                  <span className="nameInfo">
                    <strong>{`${
                      userProfileInfo?.first_name != undefined
                        ? userProfileInfo?.first_name
                        : ""
                    } ${
                      userProfileInfo?.last_name != undefined
                        ? userProfileInfo?.last_name
                        : ""
                    }`}</strong>
                    5m ago
                  </span>
                  <span className="notifyInfo">
                    <span>
                      assigned a <strong>Report</strong>
                    </span>
                    <span className="blueColor">
                      <svg
                        width="8"
                        height="8"
                        viewBox="0 0 8 8"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        {" "}
                        <path
                          d="M1.08398 4.525L2.9174 6.625L7.50065 1.375"
                          stroke="#307FF4"
                          stroke-width="0.875"
                          stroke-linecap="round"
                          stroke-linejoin="round"
                        />{" "}
                      </svg>{" "}
                      read
                    </span>
                  </span>
                </a>
              </div>
              <a className="allRead" href="#">
                <svg
                  width="18"
                  height="12"
                  viewBox="0 0 18 12"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  {" "}
                  <path
                    d="M1 6.9L4.143 10.5L12 1.5M17 1.563L8.428 10.563L8 10"
                    stroke="#307FF4"
                    stroke-width="1.5"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  />{" "}
                </svg>{" "}
                Mark all as read
              </a>
            </div>
          </div> */}

          {/* {userRole.company_profile_pic && (<img alt="Company Profile" src={userRole.company_profile_pic}/>)} */}
          {clioConnectedOrNot() && (
            <button
              className="btn"
              type="button"
              style={{
                border: "none",
                top: "100px",
              }}
              onClick={handleDataLoad}
            >
              <LuRefreshCcw
                style={{
                  position: "relative",
                  padding: "0px 6px 0px 6px",
                  fontSize: "46px",
                  background: "#212529",
                  color: "white",
                  cursor: "pointer",
                  borderRadius: "50%",
                  border: "none",
                  outline: "none",
                }}
              />
            </button>
          )}
          <div className="dropdown">
            <button
              className="btn"
              type="button"
              id="dropdownMenuButton1"
              data-bs-toggle="dropdown"
              aria-expanded="false"
              data-bs-auto-close="outside"
              style={{
                border: "none",
                top: "100px",
                borderRight: "2px solid rgb(225, 240, 253)",
                borderRadius: "0px",
              }}
            >
              <CgBell
                style={{
                  position: "relative",
                  padding: "0px 6px 0px 6px",
                  fontSize: "46px",
                  background: "#212529",
                  color: "white",
                  cursor: "pointer",
                  borderRadius: "50%",
                  border: "none",
                  outline: "none",
                }}
              />
              {unreadCount > 0 && <span className="dot"></span>}
            </button>

            <ul
              className="dropdown-menu"
              aria-labelledby="dropdownMenuButton1"
              style={{
                width: "427px",
                padding: "0px",
                borderRadius: "12px",
                maxHeight: "760px",
                overflow: "hidden",
                flexDirection: "column",
                position: "absolute", // Ensures dropdown appears correctly
                zIndex: 1000, // Keeps dropdown above other elements
              }}
            >
              {/* Sticky Header */}
              <li
                style={{
                  position: "sticky",
                  top: 0,
                  background: "white",
                  zIndex: 10,
                }}
              >
                <div className="modal-header" style={{ padding: "12px 32px" }}>
                  <div className="heading">Notification</div>
                  <div className="right-header-info">
                    <div className="note-counts">{unreadCount}</div>
                    {notifications.length > 1 && (
                      <div className="dropdown" ref={dropdownRef}>
                        <button
                          className="btn info-btn"
                          type="button"
                          id="dropdownMenuButton"
                          onClick={() => setShowDropdown(!showDropdown)}
                          aria-expanded={showDropdown}
                        >
                          <RiMore2Line size={22} />
                        </button>
                        <ul
                          className={`dropdown-menu ${
                            showDropdown ? "show" : ""
                          }`}
                          aria-labelledby="dropdownMenuButton"
                          style={{ left: "-140px", top: "30px" }}
                        >
                          <li>
                            <button
                              className="dropdown-item"
                              onClick={handleAllAsUnread}
                            >
                              Mark all as unread
                            </button>
                          </li>
                          <li>
                            <button
                              className="dropdown-item"
                              onClick={clearAllNotifications}
                            >
                              Delete all notifications
                            </button>
                          </li>
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              </li>

              <li
                style={{
                  maxHeight: "632px",
                  overflowY: "auto",
                  overflowX: "hidden",
                }}
              >
                {notifications.length > 0 ? (
                  notifications.map((notification, index) => (
                    <div
                      key={index}
                      className="modal-content"
                      style={{
                        display: "flex",
                        flexDirection: "row",
                        gap: "22px",
                        background: "#F0F8FF",
                        padding: "19px 47px 3px 23px",
                        borderBottom: "2px solid #73c3fd",
                      }}
                    >
                      <div className="modal-img">
                        {notification.type === "Billing" ? (
                          <img
                            src={
                              notification.status === "NOT_STARTED"
                                ? Bills
                                : notification.status === "PENDING"
                                ? PendingState
                                : notification.status === "AMEND"
                                ? Amend
                                : Done
                            }
                            alt="Profile"
                            style={{
                              width: "62px",
                              height: "60px",
                              // borderRadius: "50%",
                            }}
                          />
                        ) : notification.type === "Workflow" ? (
                          <>
                            {getIconForWorkflowNotification(
                              notification.message
                            )}
                          </>
                        ) : notification.type === "Compliance Form" ? (
                          <img
                            src={
                              notification.status === "PENDING"
                                ? Compliance_Created
                                : notification.status === "INPROGRESS"
                                ? Compliance_SignOff_Preparer
                                : Compliance_SignOff_Reviewer
                            }
                            alt="Profile"
                            style={{
                              width: "62px",
                              height: "60px",
                              // borderRadius: "50%",
                            }}
                          />
                        ) : (
                          <img
                            src={
                              notification.status === "PENDING"
                                ? Monthly_Form_Created
                                : notification.status === "INPROGRESS"
                                ? Monthly_SignOff_Preparer
                                : Monthly_SignOff_Reviewer
                            }
                            alt="Profile"
                            style={{
                              width: "62px",
                              height: "60px",
                              // borderRadius: "50%",
                            }}
                          />
                        )}
                      </div>

                      <div className="modal-area">
                        <p style={{ fontSize: "20px" }}>
                          {notification.message}
                        </p>
                        <div className="modal-info">
                          <p
                            style={{ width: "100px" }}
                            className="time-paragraph"
                          >
                            <Notification notification={notification} />
                          </p>
                          {!notification.isRead ? (
                            <p
                              style={{
                                color: "#73c3fd",
                                marginRight: "-14px",
                                cursor: "pointer",
                              }}
                              onClick={() =>
                                markNotificationAsRead(notification.id)
                              }
                            >
                              <span>
                                <TiTick fontSize={20} />
                              </span>
                              Read
                            </p>
                          ) : (
                            <>
                              <p
                                style={{
                                  color: "#007bff",
                                  marginRight: "-14px",
                                  cursor: "pointer",
                                }}
                                onClick={() =>
                                  markNotificationAsUnread(notification.id)
                                }
                              >
                                <span>
                                  <BiUndo fontSize={20} />
                                </span>
                                Unread
                              </p>
                              <p
                                style={{
                                  color: "red",
                                  marginRight: "-14px",
                                  cursor: "pointer",
                                }}
                                onClick={() =>
                                  handleDeleteClick(notification.id)
                                }
                              >
                                <span style={{ marginRight: "3px" }}>
                                  <TiDeleteOutline fontSize={20} color="red" />
                                </span>
                                Remove
                              </p>
                            </>
                          )}
                        </div>
                        {/* Confirmation Modal */}
                        {showModal && (
                          <div
                            style={{
                              position: "fixed",
                              top: 0,
                              left: 0,
                              width: "100%",
                              height: "100%",
                              backgroundColor: "#d5edfe",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                            }}
                          >
                            <div
                              style={{
                                backgroundColor: "white",
                                padding: "20px 12px",
                                borderRadius: "8px",
                                textAlign: "center",
                                width: "300px",
                                marginTop: "10px",
                              }}
                            >
                              <h5>{modalMessage.message}</h5>
                              <div style={{ marginTop: "20px" }}>
                                <button
                                  onClick={
                                    modalMessage.type == "delete"
                                      ? confirmDelete
                                      : modalMessage.type == "unread"
                                      ? confirmUnread
                                      : confirmClear
                                  }
                                  style={{
                                    marginRight: "10px",
                                    padding: "8px 16px",
                                    border: "none",
                                    backgroundColor: "rgb(221,51,51)",
                                    color: "white",
                                    borderRadius: "4px",
                                    cursor: "pointer",
                                  }}
                                >
                                  Yes
                                </button>
                                <button
                                  onClick={() => setShowModal(false)}
                                  style={{
                                    padding: "8px 16px",
                                    border: "none",
                                    backgroundColor: "rgb(115,195,253)",
                                    color: "white",
                                    borderRadius: "4px",
                                    cursor: "pointer",
                                  }}
                                >
                                  Cancel
                                </button>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div
                    style={{
                      textAlign: "center",
                      padding: "16px",
                      fontSize: "18px",
                      color: "#999",
                    }}
                  >
                    No notifications available.
                  </div>
                )}
              </li>

              {/* Fixed Bottom Section */}
              {notifications.length > 0 && (
                <li
                  style={{
                    position: "sticky",
                    bottom: 0,
                    background: "white",
                    zIndex: 10,
                  }}
                >
                  <div
                    className="mark-section"
                    style={{
                      textAlign: "center",
                      padding: "10px",
                      fontSize: "18px",
                      color: "#73c3fd",
                      cursor: "pointer",
                    }}
                    onClick={markAllAsRead}
                  >
                    <span>
                      <BiCheckDouble fontSize={24} />
                    </span>
                    Mark all as read
                  </div>
                </li>
              )}
            </ul>
          </div>

          <div
            onClick={
              getCurrentUserFromCookies()?.role === Roles.SUPERADMIN
                ? undefined // Disables the onClick if the user is SUPERADMIN
                : (e) => {
                    setOpenMenu((state) => !state);
                  }
            }
            className="dropdown profile"
          >
            <button className="dropdownBtn">
              <img src={userInfo?.profile_pic || ProfilePic} alt="unknown" />
              <span>
                <strong title={profileName}> {profileNameShort}</strong>
                {userRole.role === "ADMIN" ? "Administrator" : userRole.role}
              </span>
            </button>
            <Menu open={openMenu} menuList={menuList} />
          </div>
        </div>
      </header>
      <ModalInputCenter
        changeShow={() => setshowDataEraseAlert(false)}
        show={showDataEraseAlert}
        action="Yes"
        cancelOption="No"
        handleClick={() => {
          if (getUserSID() && clioConnectedOrNot()) {
            deleteDataLoad();
          }
          setshowDataEraseAlert(false);
        }}
        heading={"Data Refresh"}
      >
        <h4 style={{ fontSize: "16px" }}>
          Data sync will start and might take up to 5 minutes. Do you want to
          proceed?
        </h4>
      </ModalInputCenter>
    </>
  );
};

export default InfoHeader;
