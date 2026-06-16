import Cookies from "js-cookie";
import React, { useEffect, useState } from "react";
import { Alert, Button, Modal } from "react-bootstrap";
import Dropdown from "react-dropdown";
import { useDispatch, useSelector } from "react-redux";
import { useHistory, useLocation } from "react-router-dom";
import {
  changeInfoInUserInfo,
  userChangeAction,
} from "../../actions/userActions";
import CanadaClio from "../../assets/images/CanadaClio.png";
import USAClio from "../../assets/images/USAClio.png";
import OnBoarding from "../../components/Setup/OnBoarding.jsx";
import axios from "../../utils/axios";
import { fetchRequest } from "../../utils/fetchRequest";
import {
  getCurrentUserFromCookies,
  getRegionOfUser,
  getUserId,
  getUserSID,
  updateCookiesInfo,
  updateInfoInCurrentUser,
} from "../../utils/helpers";
import { momentFunction } from "../../utils/moment";
import ModalInputCenter from "../ModalInputCenter";
import { decrypt } from "../../utils/Encrypted";
import CookiesParser from "../../utils/cookieParser/Cookies";
import { AUTH_ROUTES } from "../../routes/Routes.types";
import { accessPagesAction } from "../../actions/accessPagesActions.js";

const LoginForm = ({
  connectedFormOrNot,
  isClioConnected,
  changeLoginStep,
  changeQBOConnected,
  changeClioConnected,
  changeCompletedFormOrNot,
  activeFormNumber,
  isQBOConnected,
}) => {
  const { userRole } = useSelector((state) => state.userChange);
  const { response } = useSelector((state) => state.accessPages);
  const [form7Data, setForm7Data] = useState({
    month_QBO: "",
    formCompleted: false,
  });
  const [name, setName] = useState(
    getCurrentUserFromCookies().display_firmname !== null
      ? getCurrentUserFromCookies().display_firmname
      : ""
  );
  const [shortName, setShortName] = useState(
    getCurrentUserFromCookies().short_firmname !== null
      ? getCurrentUserFromCookies().short_firmname
      : ""
  );
  const [errorname, setErrorName] = useState("");
  const [errorVal, setErrorVal] = useState("");
  const [clioError, setClioError] = useState(false);
  const [QBOError, setQBOError] = useState(false);
  const [alreadySet, setAlreadySet] = useState(false);
  const [regionOfUser, setRegionOfUser] = useState(
    getRegionOfUser() ? getRegionOfUser() : ""
  );
  const [checkRegionModal, setCheckRegionModal] = useState(false);
  const [showModalUpdateFirmname, setShowModalUpdateFirmname] = useState(false);
  const [isSuccessReq, setIsSuccessReq] = useState(false);
  const [subscriberError, setSubscriberError] = useState("");
  const [familyLawTools, setFamilyLawTools] = useState(false);
  const [complianceReports, setComplianceReports] = useState(false);

  useEffect(() => {
    dispatch(accessPagesAction());
    const { short_firmname, display_firmname } = getCurrentUserFromCookies();
    if (
      (short_firmname !== null && short_firmname !== "") ||
      (display_firmname !== null && display_firmname !== "")
    ) {
      setName(display_firmname);
      setShortName(short_firmname);
      setAlreadySet(true);
    }
  }, []);

  useEffect(() => {
    if(activeFormNumber === 3 && response && response.auth_reports) {
      setComplianceReports(true);
    } 
    if(activeFormNumber === 3 && response && !response.auth_reports) {
      history.push(`/setupwizard?step=4&connected=${isClioConnected}`)
    }
  }, [response]);

  useEffect(() => {
    const fetchData = async () => {
      axios
        .get(`/client/details/${getUserSID()}`)
        .then((res) => {
          const parsingData7 = JSON.parse(res.data.data.body.other_details);
          setForm7Data({ ...form7Data, ...parsingData7 });
        })
        .catch((err) => {
          setForm7Data({ ...form7Data });
          console.log("err", err);
        });
    };

    fetchData();
  }, []);

  const location = useLocation();
  let history = useHistory();
  const dispatch = useDispatch();
  const { userInfo } = useSelector((state) => state.userLogin);

  useEffect(() => {
    getRefreshState();
  }, []);

  const getRefreshState = (OptionalChange = null) => {
    axios
      .get(`/services/status/${getUserSID()}`)
      .then((res) => {
        console.log("res", res);
        if (res.data.data.code === 200) {
          const { authClio, authIntuit, updated_at } = res.data.data.body;

          update({ authClio: authClio });
          update({ authIntuit: authIntuit });
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

          changeClioConnected(authClio);
          changeQBOConnected(authIntuit);
        }
      })
      .catch((err) => {
        console.log("err", err);
      });
  };

  useEffect(() => {
    if (location.search.includes("?step")) {
      const activeStep = new URLSearchParams(location.search).get("step");
      const connectedStepOrNot = new URLSearchParams(location.search).get(
        "connected"
      );

      console.log("complted", connectedStepOrNot);
      if (connectedStepOrNot) {
        connectedStepOrNot === "true"
          ? changeCompletedFormOrNot(true)
          : changeCompletedFormOrNot(false);
      }

      changeLoginStep(parseInt(activeStep));
    }
  }, [history, location]);

  const handleChange = (e) => {
    const val = e.target.value;
    const nam = e.target.name;

    if (nam === "name") {
      setName(val);
    }

    if (!alreadySet) {
      if (nam === "shortName") {
        setShortName(val.toUpperCase());
      }
    }
  };

  const handleProductSelection = (e) => {
    e.preventDefault();
    console.log("familyLawTools", familyLawTools);
    if (!familyLawTools && !complianceReports) {
      setErrorVal("Please select at least one product");
    } else {
      setErrorVal("");
      const data = JSON.stringify({
        familyLawTools: familyLawTools,
        complianceReports: complianceReports,
      });
      if (!getUserSID()) {
        return;
      }
      axios
        .post("/add/access_pages/" + getUserSID(), JSON.parse(data))
        .then((res) => {
          if (res.data.data.code === 200 && res.data.data.status !== "error") {
            if (complianceReports) {
              history.push(`/setupwizard?step=3&connected=${isClioConnected}`);
            } else {
              history.push(`/setupwizard?step=4&connected=${isClioConnected}`);
            }
          }
        })
        .catch((err) => {
          console.log(" errIn cat", err.response.data.data.message);
          setSubscriberError(err.response.data.data.message);
        });
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (name === "") {
      setErrorName("Enter display name");
    }
    if (shortName === "") {
      setErrorVal("Enter short name");
    }
    if (shortName !== "") {
      setErrorVal("");
    }
    if (/\s/.test(shortName)) {
      setErrorVal("Short Name should not contain any spaces.");
    }
    if (shortName !== "" && shortName.length > 6 && shortName.length < 3) {
      setErrorVal("Short Name must be between 3 to 6 characters");
    } else if (alreadySet && !showModalUpdateFirmname) {
      // history.push(`/setupwizard?step=2&connected=${isClioConnected}`);
      // alert("Do you want to change the law Firm name")
      setShowModalUpdateFirmname(true);
      // window.location.href = '/logout'
    } else if (
      (shortName.length <= 6 &&
        shortName.length >= 3 &&
        shortName !== "" &&
        name !== "" &&
        errorVal === "") ||
      getUserSID() === null
    ) {
      const data = JSON.stringify({
        uid: getUserId(),
        display_firmname: name,
        short_firmname: shortName,
      });

      axios
        .post("/add/subscriber", JSON.parse(data))
        .then((res) => {
          if (res.data.data.code === 200 && res.data.data.status !== "error") {
            const { sid } = res.data.data.body;

            if (sid !== 0) {
              updateInfoInCurrentUser({ sid: sid });
              updateInfoInCurrentUser({ short_firmname: shortName });
              updateInfoInCurrentUser({ display_firmname: name });
            }

            getRefreshState();
            setAlreadySet(true);
            setSubscriberError("");

            if (showModalUpdateFirmname) {
              window.location.href = "/logout";
            } else {
              history.push(`/setupwizard?step=2&connected=${isClioConnected}`);
            }
          } else {
            throw res.data.data.message;
          }
        })
        .catch((err) => {
          console.log(" errIn cat", err.response.data.data.message);
          setSubscriberError(err.response.data.data.message);
        });
    }
  };

  const checkClioConnected = () => {
    getRefreshState();
    if (isClioConnected) {
      history.push(`/setupwizard?step=2&connected=${isClioConnected}`);
    } else {
      history.push(`/setupwizard?step=2&connected=${isClioConnected}`);
      setClioError("You will have to connect with Clio to proceed");
    }
  };

  // const disconnectClio = () => {
  //   setIsClioConnected(false);
  // };

  const connectClio = () => {
    updateCookiesInfo({ region: regionOfUser.toLowerCase() });
    axios
      .get(`/connect?uid=${getUserId()}&type=clio&region=${regionOfUser}`)
      .then((res) => {
        console.log("res", res);
        const { body } = res.data.data;

        window.location.href = body;
        // history.push(
        // "/oauth/approval?code=fdaljkdfslaj&state=adfsljksfdlkjsfdlkjfdsal"
        // );
        // axios.get(body).then((res) => console.log('res after', res)).catch((err) => console.log("err in dosa", err));

        // setIsClioConnected(true);
      })
      .catch((err) => {
        console.log("err", err);
        // setIsClioConnected(false);
        history.push(`/setupwizard?step=2&connected=${isClioConnected}`);
      });
  };

  const connectQBO = () => {
    axios
      .get(`/connect?uid=${getUserId()}&type=intuit&region=us`)
      .then((res) => {
        console.log("res", res);
        const { body } = res.data.data;

        window.location.href = body;
        // history.push(
        //   "/oauth/approval?code=adfsjlkfdsajl&state=lkjdfakjlfd&realmId=daflkjfdlsak"
        // );
        // axios.get(body).then((res) => console.log('res after', res)).catch((err) => console.log("err in dosa", err));

        // setIsClioConnected(true);
      })
      .catch((err) => {
        console.log("err", err);
        history.push(`/setupwizard?step=3&connected=${isQBOConnected}`);

        // setIsClioConnected(false);
      });
  };

  const update = (value) => {
    let prevData = CookiesParser.get("allUserInfo");
    prevData = decrypt(prevData);

    Object.keys(value).forEach(function (val, key) {
      prevData[val] = value[val];
    });
    CookiesParser.set("allUserInfo", prevData, { path: "/" });
  };

  const disconnectService = (type) => {
    axios
      .get(
        `/disconnect/access?uid=${getUserId()}&type=${type}&region=${
          type === "intuit" ? "us" : getRegionOfUser()
        }&sid=${getUserSID()}`
      )
      .then((res) => {
        console.log("res", res);
        if (res.data.data.code === 200) {
          if (type === "clio") {
            changeClioConnected(false);
            update({ authClio: false });
            history.push(`/setupwizard?step=2&connected=${isClioConnected}`);
          } else if (type === "intuit") {
            changeQBOConnected(false);
            update({ authIntuit: false });
            history.push(`/setupwizard?step=2&connected=${isQBOConnected}`);
          }
        }
      })
      .catch((err) => {
        console.log("err", err);
        if (type === "clio") {
          history.push(`/setupwizard?step=2&connected=${isClioConnected}`);
          changeClioConnected(true);
        } else if (type === "intuit") {
          changeQBOConnected(true);
          history.push(`/setupwizard?step=2&connected=${isQBOConnected}`);
        }
      });
  };

  const checkQBOConnected = () => {
    getRefreshState();

    if (Cookies.get("DiagnoseConnection")) {
      history.push(`${AUTH_ROUTES.DASHBOARD}`);
    } else {
      if (isQBOConnected) {
        history.push(`/setupwizard?step=3&connected=${isQBOConnected}`);
      } else {
        history.push(`/setupwizard?step=3&connected=${isQBOConnected}`);
        setQBOError("You will have to connect with QBO to proceed");
      }
    }
  };

  console.log(isClioConnected, activeFormNumber, complianceReports, isQBOConnected, "isClioConnected");

  return (
    <>
      {activeFormNumber === 1 && (
        <div className="row">
          <div className="col-md-4 offset-md-4">
            <div className="row">
              <div className="col-md-10 offset-md-1">
                <form onSubmit={handleSubmit}>
                  <span className="heading">Add a law firm</span>
                  <span className="text pText">
                    Enter organization details below
                  </span>
                  <div className="form-group">
                    <label>Law firm name</label>
                    <input
                      type="text"
                      value={name}
                      name="name"
                      required
                      onChange={handleChange}
                      className={`form-control`}
                    />
                    <span className="text">{errorname}</span>
                  </div>
                  <div className="form-group mb-0">
                    <label>Law Firm's short name</label>
                    <input
                      type="text"
                      value={shortName}
                      onChange={handleChange}
                      required
                      name="shortName"
                      className={`form-control ${alreadySet ? "disabled" : ""}`}
                    />
                  </div>
                  {<span className="text">{errorVal}</span>}
                  {subscriberError && (
                    <Alert className="text" variant="danger">
                      {subscriberError}
                    </Alert>
                  )}
                  <span className="text blueColor">
                    Short Name must be between 3 to 6 characters.
                  </span>
                  {showModalUpdateFirmname && (
                    <ModalInputCenter
                      heading="Do you want to change the Firmname?"
                      show={showModalUpdateFirmname}
                      changeShow={() => setShowModalUpdateFirmname(false)}
                      action="Ok"
                      handleClick={handleSubmit}
                      cancelOption="Cancel"
                    >
                      <span className="text">
                        You will be logged out and name of firmname in reports
                        will be changed from now on?
                      </span>
                    </ModalInputCenter>
                  )}
                  <div className="form-group">
                    <span className="wizardUpload">
                      {!userRole.company_profile_pic && (
                        <>
                          <input
                            type="file"
                            name="photo"
                            onChange={(event) => {
                              if (event.target.files && event.target.files[0]) {
                                form7Data.photo = URL.createObjectURL(
                                  event.target.files[0]
                                );
                              }
                              const formData = new FormData();
                              formData.append(
                                "file",
                                event.target.files[0],
                                event.target.files[0].name
                              );
                              console.log("file name", event.target.files[0]);
                              console.log("form data", formData);
                              axios
                                .post(`/file/upload/${getUserId()}`, formData)
                                .then((res) => {
                                  const { data } = res;
                                  console.log("data file", data);
                                  dispatch(
                                    userChangeAction({
                                      ...userRole,
                                      company_profile_pic: data.data.body.file,
                                    })
                                  );
                                  setForm7Data({
                                    ...form7Data,
                                    photo: data.data.body.file,
                                  });
                                  updateInfoInCurrentUser({
                                    company_profile_pic: data.data.body.file,
                                  });
                                })
                                .catch((err) => {
                                  console.log("err", err);
                                  alert(
                                    "Photo size should not be greater than 500KB"
                                  );
                                });
                            }}
                          />
                          <button className="btn btnPrimary blue">
                            Upload Logo
                          </button>
                        </>
                      )}
                      {userRole.company_profile_pic && (
                        <>
                          <img
                            src={userRole.company_profile_pic}
                            alt={userRole.company_profile_pic}
                          />
                          <button
                            onClick={async () => {
                              setForm7Data({ ...form7Data, photo: "" });
                              const {
                                data: { data },
                              } = await fetchRequest(
                                "delete",
                                `company/profile/remove/${getUserSID()}`
                              );
                              if (data.code === 200) {
                                dispatch(
                                  userChangeAction({
                                    ...userRole,
                                    company_profile_pic: null,
                                  })
                                );
                                updateInfoInCurrentUser({
                                  company_profile_pic: null,
                                });
                              }
                            }}
                          >
                            <i className="fa-solid fa-times"></i>
                          </button>
                        </>
                      )}
                    </span>
                    <span className="text blueColor">
                      Please upload your company logo. Photo size should be less
                      than 500KB
                    </span>
                  </div>
                  <div className="btnGroup">
                    <button className="btn btnPrimary">
                      {alreadySet ? "Update Firmname" : "Save & Next"}
                    </button>
                    {alreadySet && (
                      <button
                        onClick={() =>
                          history.push(
                            `/setupwizard?step=2&connected=${isClioConnected}`
                          )
                        }
                        className="btn btnPrimary"
                      >
                        Next
                      </button>
                    )}
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}
      {activeFormNumber === 2 && (
        <div className="row">
          <div className="col-md-4 offset-md-4">
            <div className="row">
              <div className="col-md-10 offset-md-1">
                <form onSubmit={handleProductSelection}>
                  <span className="heading">Select Products</span>
                  <span className="text pText">
                    Choose products from list below
                  </span>
                  <div className="mb-0">
                    <label htmlFor="complianceReports">
                      <input
                        type="checkbox"
                        name="complianceReports"
                        id="complianceReports"
                        value={complianceReports}
                        checked={complianceReports}
                        onChange={() => {
                          setComplianceReports(!complianceReports);
                        }}
                        className="mr-2"
                      />
                      Compliance Reports
                    </label>
                  </div>
                  <div className="mb-0">
                    <label htmlFor="familyLawTools">
                      <input
                        type="checkbox"
                        name="familyLawTools"
                        id="familyLawTools"
                        value={familyLawTools}
                        checked={familyLawTools}
                        onChange={() => {
                          setFamilyLawTools(!familyLawTools);
                        }}
                        className="mr-2"
                      />
                      Family Law Tools
                    </label>
                  </div>
                  {errorVal && (
                    <span className="text" style={{ color: "red" }}>
                      {errorVal}
                    </span>
                  )}

                  <div className="btnGroup">
                    <button className="btn btnPrimary">Back</button>

                    <button type="submit" className="btn btnPrimary">
                      Next
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}
      {activeFormNumber === 3 && complianceReports && !isClioConnected && (
        <>
          <div className="row">
            <div className="col-md-4 offset-md-4">
              <div className="row">
                <div className="col-md-10 offset-md-1">
                  <span className="heading pb-0">Connect to Clio & QBO</span>
                  <span className="text pText">
                    Please connect with your Clio and QBO accounts and allow
                    this application to access your organization data. This app
                    do not store user ID and password provided to provide
                    permission
                  </span>
                  {!getRegionOfUser() && (
                    <div className="form-group">
                      <label>
                        Select Region{" "}
                        {!getRegionOfUser() && (
                          <a onClick={() => setCheckRegionModal(true)}>
                            How to check your region?
                          </a>
                        )}
                      </label>
                      <Dropdown
                        options={["CA", "US"]}
                        placeholder="Select Region"
                        value={regionOfUser.toUpperCase()}
                        style={{ textTransform: "uppercase" }}
                        onChange={(e) => {
                          setRegionOfUser(e.value.toLowerCase());
                        }}
                      ></Dropdown>
                    </div>
                  )}
                  <div
                    className={`connectList ${!regionOfUser ? "disabled" : ""}`}
                  >
                    <span>
                      <svg
                        width="77"
                        height="27"
                        viewBox="0 0 77 27"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        {" "}
                        <path
                          d="M24.0331 5.09751L26.6895 1.38642L23.376 4.34129C20.9154 1.6805 17.3922 0 13.4776 0C6.03975 0 0 6.0498 0 13.5C0 20.9642 6.03975 27 13.4776 27C20.9294 27 26.9551 20.9502 26.9551 13.5C26.9691 10.3211 25.8646 7.40819 24.0331 5.09751ZM22.8587 17.9673C22.8587 20.6982 20.6498 22.8968 17.9375 22.8968H9.03163C6.30541 22.8968 4.11038 20.6842 4.11038 17.9673V9.04667C4.11038 6.31585 6.31935 4.11722 9.03163 4.11722H17.9375C19.4474 4.11722 20.7896 4.78942 21.6843 5.85374L13.4356 13.2339L7.82929 9.42479L11.8838 17.2391C11.9117 17.2811 11.9397 17.3231 11.9816 17.3652C11.9956 17.3932 12.0096 17.4071 12.0236 17.4352C12.0655 17.4912 12.0935 17.5472 12.1494 17.5892C12.1914 17.6313 12.2333 17.6592 12.2752 17.7013C12.7925 18.1634 13.4776 18.3174 14.1207 18.1634H14.1347C14.2465 18.1354 14.3584 18.0934 14.4702 18.0374C14.4842 18.0234 14.4982 18.0234 14.5262 18.0094C14.624 17.9673 14.7079 17.9113 14.8058 17.8413C14.8337 17.8273 14.8617 17.7993 14.8896 17.7853C14.9316 17.7573 14.9875 17.7292 15.0295 17.6873C15.0574 17.6592 15.0854 17.6173 15.1134 17.5892C15.1273 17.5752 15.1413 17.5612 15.1553 17.5472L15.1972 17.4912C15.2531 17.4212 15.3091 17.3512 15.351 17.2811L22.5092 7.22612C22.7329 7.78631 22.8587 8.40247 22.8587 9.04667V17.9673Z"
                          fill="white"
                        />{" "}
                        <path
                          d="M41.2685 23.2551C35.5867 23.2551 31.7773 19.4129 31.7773 13.7115C31.7773 8.09281 35.6771 4.16797 41.2685 4.16797C44.9616 4.16797 46.8598 5.66905 47.3505 6.12351L46.2142 9.24961C45.4781 8.60236 43.6961 7.47308 41.5138 7.47308C38.0143 7.47308 35.6642 9.95195 35.6642 13.6426C35.6642 17.2508 38.066 19.7847 41.5138 19.7847C43.9931 19.7847 45.5944 18.7381 46.4337 17.9669L47.6604 20.914C46.098 22.4426 43.9415 23.2551 41.2685 23.2551Z"
                          fill="white"
                        />{" "}
                        <path
                          d="M53.1898 4.42969H49.4062V22.9246H53.1898V4.42969Z"
                          fill="white"
                        />{" "}
                        <path
                          d="M56.0392 22.9102V9.8687H59.8228V22.9239H56.0392V22.9102ZM57.9374 7.73415C56.6074 7.73415 55.7422 6.94914 55.7422 5.72351C55.7422 4.5254 56.6203 3.71289 57.9374 3.71289C59.2414 3.71289 60.1327 4.5254 60.1327 5.72351C60.1199 6.93538 59.2676 7.73415 57.9374 7.73415Z"
                          fill="white"
                        />{" "}
                        <path
                          d="M68.94 23.2272C64.6786 23.2272 61.8125 20.5004 61.8125 16.4379C61.8125 12.3616 64.6786 9.62109 68.94 9.62109C73.1885 9.62109 76.0424 12.3616 76.0424 16.4379C76.0296 20.5004 73.1757 23.2272 68.94 23.2272ZM68.94 12.5406C66.9774 12.5406 65.6602 14.0692 65.6602 16.3553C65.6602 18.6413 66.9774 20.1699 68.94 20.1699C70.9032 20.1699 72.2203 18.6413 72.2203 16.3553C72.2203 14.0692 70.9032 12.5406 68.94 12.5406Z"
                          fill="white"
                        />{" "}
                      </svg>
                      <strong>Last connected to Clio</strong>
                      {momentFunction.formatDate(userInfo.updated_at)}
                    </span>
                    <button
                      disabled={!regionOfUser}
                      onClick={connectClio}
                      className={`btn btnPrimary`}
                    >
                      Connect{" "}
                      <svg
                        width="32"
                        height="32"
                        viewBox="0 0 32 32"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        {" "}
                        <g clip-path="url(#clip0_587_15216)">
                          {" "}
                          <path
                            d="M22.494 15.4006L22.5484 15.6673H22.8207H26.334V16.3339H22.814H22.5407L22.4871 16.602C22.3119 17.479 21.8339 18.2665 21.1369 18.8268C20.4398 19.3872 19.568 19.6847 18.6738 19.6673L18.6738 19.6673H18.6673H13.434V19.6672L13.4275 19.6673C12.5333 19.6847 11.6615 19.3872 10.9644 18.8268C10.2674 18.2665 9.78944 17.479 9.61419 16.6019L9.56063 16.3339H9.28732H5.66732V15.6673H9.29398H9.56618L9.62059 15.4006C9.79905 14.5259 10.2772 13.7409 10.9725 13.1811C11.6678 12.6212 12.5368 12.3216 13.4294 12.3339L13.4294 12.3339H13.434H18.6673V12.334L18.673 12.3339C19.5677 12.3187 20.4395 12.617 21.1374 13.1771C21.8353 13.7372 22.3152 14.5238 22.494 15.4006ZM15.3873 19.0006H15.7202L15.7207 18.6677L15.7273 13.3344L15.7277 13.0006H15.394H13.4396C12.6195 12.9739 11.822 13.2721 11.2205 13.8303C10.6176 14.3899 10.2606 15.1653 10.2276 15.9872L10.227 16.0006L10.2276 16.014C10.2606 16.8359 10.6176 17.6113 11.2205 18.1709C11.822 18.7291 12.6195 19.0273 13.4395 19.0006H15.3873ZM16.334 18.6673V19.0006H16.6673H18.6618C19.4818 19.0273 20.2793 18.7291 20.8808 18.1709C21.4837 17.6113 21.8407 16.8359 21.8737 16.014L21.8743 16.0006L21.8737 15.9872C21.8407 15.1653 21.4837 14.3899 20.8808 13.8303C20.2793 13.2721 19.4818 12.9739 18.6617 13.0006H16.6673H16.334V13.3339V18.6673Z"
                            fill="#171D34"
                            stroke="white"
                            stroke-width="0.666667"
                          />{" "}
                        </g>{" "}
                        <rect
                          x="1"
                          y="1"
                          width="30"
                          height="30"
                          rx="15"
                          stroke="white"
                          stroke-width="2"
                        />{" "}
                        <defs>
                          {" "}
                          <clipPath id="clip0_587_15216">
                            {" "}
                            <rect
                              width="24"
                              height="24"
                              fill="white"
                              transform="translate(4 4)"
                            />{" "}
                          </clipPath>{" "}
                        </defs>{" "}
                      </svg>
                    </button>
                  </div>
                  {clioError && (
                    <Alert
                      className="text p-2 mt-3"
                      style={{ color: "#d93025" }}
                      variant="warning"
                    >
                      {clioError}
                    </Alert>
                  )}
                  <div className="btnGroup">
                    {/* <button
                      className="btn btnPrimary"
                      onClick={() => {
                        history.push("/setupwizard?step=1&connected=false");
                      }}
                    >
                      Previous
                    </button>
                    <button
                      className="btn btnPrimary"
                      onClick={checkClioConnected}
                    >
                      Next
                    </button> */}
                  </div>
                  {checkRegionModal && (
                    <Modal
                      onHide={() => setCheckRegionModal(false)}
                      show={checkRegionModal}
                      size="md"
                      aria-labelledby="contained-modal-title-vcenter"
                      centered
                    >
                      <Modal.Header closeButton>
                        <Modal.Title
                          className="heading-4 fw-bold"
                          id="contained-modal-title-vcenter"
                        >
                          How to Check your Region?
                        </Modal.Title>
                      </Modal.Header>
                      <Modal.Body>
                        <>
                          <ul className="heading-5">
                            <li style={{ listStyle: "inside" }}>
                              When you log on Clio manage, Please check the url
                              at the top. If url starts with{" "}
                              <span className="fw-bold">
                                {" "}
                                https://app.clio.com{" "}
                              </span>{" "}
                              then your region is US
                              <p>
                                <img src={USAClio} alt="" />
                              </p>
                            </li>

                            <li
                              style={{ listStyle: "inside" }}
                              className="py-4"
                            >
                              If the URL starts with{" "}
                              <span className="fw-bold">
                                https://ca.app.clio.com
                              </span>{" "}
                              then your region is CA.
                              <p>
                                <img src={CanadaClio} alt="" />
                              </p>
                            </li>
                          </ul>

                          <p className="heading-5"></p>
                          <a
                            className="heading-5 fw-bold"
                            href="https://app.clio.com"
                            referrerPolicy
                            target="_blank"
                            rel="noreferrer"
                          >
                            Log in to Clio Manage to check your region.
                          </a>
                        </>
                      </Modal.Body>
                      <Modal.Footer>
                        <Button
                          variant="warning"
                          className="fw-bold"
                          onClick={() => setCheckRegionModal(false)}
                        >
                          Close
                        </Button>
                      </Modal.Footer>
                    </Modal>
                  )}
                </div>
              </div>
            </div>
          </div>
        </>
      )}
      {activeFormNumber === 3 && complianceReports && isClioConnected && (
        <>
          <div className="row">
            <div className="col-md-4 offset-md-4">
              <div className="row">
                <div className="col-md-10 offset-md-1">
                  <span className="heading pb-0">Connect to Clio & QBO</span>
                  <span className="text pText">
                    Please connect with your Clio and QBO accounts and allow
                    this application to access your organization data. This app
                    do not store user ID and password provided to provide
                    permisiom
                  </span>
                  {/* <span className="text pText">You've been successfully connected with Clio on{" "}{momentFunction.formatDate(userInfo.updated_at)}</span> */}
                  <div className="connectList">
                    <span>
                      <svg
                        width="77"
                        height="27"
                        viewBox="0 0 77 27"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        {" "}
                        <path
                          d="M24.0331 5.09751L26.6895 1.38642L23.376 4.34129C20.9154 1.6805 17.3922 0 13.4776 0C6.03975 0 0 6.0498 0 13.5C0 20.9642 6.03975 27 13.4776 27C20.9294 27 26.9551 20.9502 26.9551 13.5C26.9691 10.3211 25.8646 7.40819 24.0331 5.09751ZM22.8587 17.9673C22.8587 20.6982 20.6498 22.8968 17.9375 22.8968H9.03163C6.30541 22.8968 4.11038 20.6842 4.11038 17.9673V9.04667C4.11038 6.31585 6.31935 4.11722 9.03163 4.11722H17.9375C19.4474 4.11722 20.7896 4.78942 21.6843 5.85374L13.4356 13.2339L7.82929 9.42479L11.8838 17.2391C11.9117 17.2811 11.9397 17.3231 11.9816 17.3652C11.9956 17.3932 12.0096 17.4071 12.0236 17.4352C12.0655 17.4912 12.0935 17.5472 12.1494 17.5892C12.1914 17.6313 12.2333 17.6592 12.2752 17.7013C12.7925 18.1634 13.4776 18.3174 14.1207 18.1634H14.1347C14.2465 18.1354 14.3584 18.0934 14.4702 18.0374C14.4842 18.0234 14.4982 18.0234 14.5262 18.0094C14.624 17.9673 14.7079 17.9113 14.8058 17.8413C14.8337 17.8273 14.8617 17.7993 14.8896 17.7853C14.9316 17.7573 14.9875 17.7292 15.0295 17.6873C15.0574 17.6592 15.0854 17.6173 15.1134 17.5892C15.1273 17.5752 15.1413 17.5612 15.1553 17.5472L15.1972 17.4912C15.2531 17.4212 15.3091 17.3512 15.351 17.2811L22.5092 7.22612C22.7329 7.78631 22.8587 8.40247 22.8587 9.04667V17.9673Z"
                          fill="white"
                        />{" "}
                        <path
                          d="M41.2685 23.2551C35.5867 23.2551 31.7773 19.4129 31.7773 13.7115C31.7773 8.09281 35.6771 4.16797 41.2685 4.16797C44.9616 4.16797 46.8598 5.66905 47.3505 6.12351L46.2142 9.24961C45.4781 8.60236 43.6961 7.47308 41.5138 7.47308C38.0143 7.47308 35.6642 9.95195 35.6642 13.6426C35.6642 17.2508 38.066 19.7847 41.5138 19.7847C43.9931 19.7847 45.5944 18.7381 46.4337 17.9669L47.6604 20.914C46.098 22.4426 43.9415 23.2551 41.2685 23.2551Z"
                          fill="white"
                        />{" "}
                        <path
                          d="M53.1898 4.42969H49.4062V22.9246H53.1898V4.42969Z"
                          fill="white"
                        />{" "}
                        <path
                          d="M56.0392 22.9102V9.8687H59.8228V22.9239H56.0392V22.9102ZM57.9374 7.73415C56.6074 7.73415 55.7422 6.94914 55.7422 5.72351C55.7422 4.5254 56.6203 3.71289 57.9374 3.71289C59.2414 3.71289 60.1327 4.5254 60.1327 5.72351C60.1199 6.93538 59.2676 7.73415 57.9374 7.73415Z"
                          fill="white"
                        />{" "}
                        <path
                          d="M68.94 23.2272C64.6786 23.2272 61.8125 20.5004 61.8125 16.4379C61.8125 12.3616 64.6786 9.62109 68.94 9.62109C73.1885 9.62109 76.0424 12.3616 76.0424 16.4379C76.0296 20.5004 73.1757 23.2272 68.94 23.2272ZM68.94 12.5406C66.9774 12.5406 65.6602 14.0692 65.6602 16.3553C65.6602 18.6413 66.9774 20.1699 68.94 20.1699C70.9032 20.1699 72.2203 18.6413 72.2203 16.3553C72.2203 14.0692 70.9032 12.5406 68.94 12.5406Z"
                          fill="white"
                        />{" "}
                      </svg>
                      <strong>Connected to Clio</strong>
                      {momentFunction.formatDate(userInfo.updated_at)}
                    </span>
                    <button onClick={() => disconnectService("clio")}>
                      Disconnect{" "}
                      <svg
                        width="32"
                        height="32"
                        viewBox="0 0 32 32"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        {" "}
                        <path
                          d="M22 22L10 10M22 10L10 22"
                          stroke="white"
                          stroke-width="1.5"
                          stroke-linecap="round"
                        />{" "}
                        <rect
                          x="1"
                          y="1"
                          width="30"
                          height="30"
                          rx="15"
                          stroke="white"
                          stroke-width="2"
                        />{" "}
                      </svg>
                    </button>
                  </div>
                  <div className="btnGroup">
                    {/* <button
                      onClick={() => {
                        isClioConnected
                          ? history.push(
                              `/setupwizard?step=1&connected=${isClioConnected}`
                            )
                          : history.push(
                              `/setupwizard?step=2&connected=${isClioConnected}`
                            );
                      }}
                      className="btn btnPrimary"
                    >
                      Previous
                    </button>{" "}
                    <button
                      className="btn btnPrimary"
                      onClick={() =>
                        history.push(
                          `/setupwizard?step=3&connected=${isQBOConnected}`
                        )
                      }
                    >
                      Next
                    </button> */}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
      {activeFormNumber === 3 && complianceReports && !isQBOConnected && (
        <>
          <div className="row">
            <div className="col-md-4 offset-md-4">
              <div className="row">
                <div className="col-md-10 offset-md-1">
                  {/* <span className="heading pb-0">Connect to QBO</span>
                  <span className="text pText">
                    Please connect with your QBO accounts and allow this
                    application to access your organization data. This app do
                    not store user ID and password provided to provide permisiom
                  </span> */}
                  <div className="connectList QBO">
                    <span>
                      <svg
                        width="132"
                        height="26"
                        viewBox="0 0 132 26"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        {" "}
                        <path
                          d="M131.348 19.8571C131.348 19.6063 131.098 19.506 130.872 19.506H130.446V20.7597H130.672V20.2582H130.847L131.123 20.7597H131.399L131.073 20.2081C131.15 20.196 131.221 20.1564 131.271 20.0966C131.322 20.0367 131.349 19.9606 131.348 19.8821V19.8571ZM130.672 20.0577V19.7066H130.872C130.998 19.7066 131.123 19.7317 131.123 19.8821C131.123 20.0326 130.973 20.0577 130.847 20.0577H130.672ZM130.872 19.0547C130.654 19.0597 130.443 19.1293 130.264 19.2546C130.086 19.3799 129.948 19.5554 129.869 19.7589C129.791 19.9623 129.774 20.1845 129.821 20.3975C129.869 20.6105 129.978 20.8046 130.136 20.9553C130.293 21.1061 130.492 21.2066 130.707 21.2443C130.922 21.282 131.143 21.2552 131.343 21.1672C131.542 21.0791 131.711 20.9339 131.828 20.7498C131.945 20.5657 132.005 20.351 132 20.1329C132 19.9859 131.971 19.8403 131.914 19.7048C131.857 19.5693 131.773 19.4465 131.668 19.3437C131.563 19.241 131.439 19.1602 131.302 19.1063C131.165 19.0523 131.019 19.0263 130.872 19.0296V19.0547ZM130.872 21.0606C130.683 21.0606 130.498 21.004 130.341 20.8981C130.184 20.7923 130.062 20.642 129.99 20.4664C129.919 20.2908 129.902 20.098 129.94 19.9125C129.979 19.727 130.072 19.5573 130.208 19.4251C130.344 19.2929 130.516 19.2042 130.702 19.1703C130.889 19.1364 131.081 19.1589 131.254 19.2349C131.428 19.3109 131.575 19.4369 131.677 19.5969C131.778 19.7568 131.83 19.9434 131.825 20.1329C131.825 20.3856 131.724 20.6279 131.546 20.8066C131.367 20.9853 131.125 21.0857 130.872 21.0857V21.0606ZM59.1917 19.2302C57.5626 19.2302 56.7355 17.7508 56.7355 16.3466C56.7355 14.9424 57.6378 13.5383 59.1165 13.5383C59.8183 13.5383 60.6955 13.8893 61.0464 14.3908L62.7507 12.6606C62.2692 12.1958 61.6997 11.8321 61.0755 11.5909C60.4514 11.3497 59.7853 11.236 59.1165 11.2565C56.1089 11.2565 53.9284 13.4129 53.9284 16.3717C53.9284 19.3806 56.0839 21.512 59.1917 21.512C60.6454 21.512 61.9988 21.0857 62.8008 20.2081L61.1216 18.4027C60.8721 18.6634 60.5725 18.8711 60.2409 19.0133C59.9093 19.1554 59.5525 19.2292 59.1917 19.2302ZM49.5424 21.2362H52.2492V11.5323H49.5674L49.5424 21.2362ZM44.6551 16.8481C44.6551 17.9765 43.9032 19.2051 42.5498 19.2051C41.4721 19.2051 40.8956 18.4529 40.8956 16.8732V11.5574H38.2138V17.5753C38.2138 19.5812 39.2164 21.5371 41.8981 21.5371C43.1513 21.5371 44.2039 20.5341 44.7303 19.7818H44.7804V21.2612H47.3368V11.5323H44.6551V16.8481ZM33.3767 12.7609H33.3265C32.9506 12.3347 31.923 11.2565 30.2688 11.2565C27.5369 11.2565 25.4316 13.3878 25.4316 16.3466C25.4316 19.3556 27.3866 21.512 30.1435 21.512C30.7332 21.4938 31.3129 21.3555 31.8473 21.1054C32.3817 20.8554 32.8595 20.4988 33.2513 20.0577H33.3015V26.0003H35.9582V11.5323H33.4017L33.3767 12.7609ZM30.7952 19.2302C29.141 19.2302 28.1886 17.7759 28.1886 16.3466C28.1886 14.9675 29.0407 13.5132 30.7952 13.5132C32.3741 13.5132 33.3516 15.0177 33.3516 16.3717C33.3516 17.7257 32.3992 19.2302 30.7952 19.2302ZM91.7738 11.2565C88.7411 11.2565 86.5105 13.3878 86.5105 16.3466C86.5105 19.4057 88.7662 21.5371 91.7738 21.5371C94.7814 21.5371 97.037 19.3806 97.037 16.3466C97.037 13.3878 94.8315 11.2565 91.7738 11.2565ZM91.7738 19.2302C90.0194 19.2302 89.2424 17.7257 89.2424 16.3466C89.2424 14.9675 90.0444 13.5132 91.7738 13.5132C93.5031 13.5132 94.3553 14.9675 94.3553 16.3466C94.3553 17.7257 93.5533 19.2302 91.7988 19.2302H91.7738ZM125.258 15.2684C123.88 14.9424 123.378 14.7669 123.378 14.1902C123.378 13.438 124.381 13.2624 124.807 13.2624C125.634 13.2624 126.561 13.7639 126.937 14.2153L128.516 12.7108C127.764 11.8081 126.336 11.2815 124.832 11.2815C122.877 11.2815 120.847 12.2595 120.847 14.4159C120.847 16.2965 122.326 16.8481 123.754 17.1991C125.258 17.5502 125.81 17.8009 125.81 18.4278C125.81 19.3054 124.807 19.4559 124.431 19.4559C123.97 19.4345 123.517 19.3215 123.1 19.1234C122.682 18.9254 122.308 18.6463 122 18.3024L120.371 19.9574C121.248 20.9603 122.777 21.5371 124.331 21.5371C126.962 21.5371 128.516 20.2833 128.516 18.2272C128.516 16.2714 126.612 15.5944 125.258 15.2684ZM120.17 11.5323H116.712L113.253 15.5442H113.203V6.19141H110.521V21.2362H113.203V16.472H113.253L116.837 21.2362H120.346L116.185 15.9454L120.17 11.5323ZM80.4703 11.2815C79.2172 11.2815 78.3399 11.783 77.4627 12.5854H77.4377V6.19141H74.7559V21.2362H77.3124V19.8571H77.3625C77.6923 20.3599 78.1424 20.7724 78.672 21.057C79.2017 21.3417 79.7939 21.4894 80.3951 21.4869C83.1521 21.4869 85.2574 19.3305 85.2574 16.3466C85.2574 13.3878 83.2022 11.2565 80.4703 11.2565V11.2815ZM79.944 19.2302C78.3149 19.2302 77.3625 17.7759 77.3625 16.3717C77.3625 14.9675 78.365 13.5132 79.944 13.5132C81.6733 13.5132 82.5255 14.9675 82.5255 16.3466C82.5255 17.7759 81.5981 19.2302 79.944 19.2302ZM73.7534 11.5323H70.2947L66.836 15.5442H66.7858V6.19141H64.1041V21.2362H66.7858V16.472H66.836L70.42 21.2362H73.9288L69.7934 15.9454L73.7534 11.5323ZM103.528 11.2815C100.471 11.2815 98.2651 13.4129 98.2651 16.3466C98.2651 19.4057 100.521 21.5371 103.528 21.5371C106.536 21.5371 108.792 19.3806 108.792 16.3466C108.792 13.3878 106.561 11.2565 103.528 11.2565V11.2815ZM103.528 19.2302C101.774 19.2302 100.972 17.7257 100.972 16.3466C100.972 14.9675 101.774 13.5132 103.528 13.5132C105.283 13.5132 106.06 14.9675 106.06 16.3466C106.06 17.7257 105.258 19.2302 103.528 19.2302Z"
                          fill="white"
                        />{" "}
                        <path
                          d="M11.5046 22.285C17.8584 22.285 23.0092 17.2964 23.0092 11.1425C23.0092 4.98868 17.8584 0 11.5046 0C5.15078 0 0 4.98868 0 11.1425C0 17.2964 5.15078 22.285 11.5046 22.285Z"
                          fill="#2CA01C"
                        />{" "}
                        <path
                          d="M3.63281 11.1432C3.63281 12.3119 4.07937 13.4328 4.87425 14.2592C5.66913 15.0856 6.74722 15.5498 7.87134 15.5498H8.47685V13.9131H7.87134C7.16475 13.9131 6.48709 13.6213 5.98746 13.1018C5.48782 12.5823 5.20712 11.8778 5.20712 11.1432C5.20712 10.4086 5.48782 9.70404 5.98746 9.18458C6.48709 8.66513 7.16475 8.3733 7.87134 8.3733H9.32456V16.9348C9.32456 17.1497 9.36528 17.3626 9.44439 17.5611C9.52351 17.7597 9.63947 17.9402 9.78566 18.0921C9.93185 18.2441 10.1054 18.3647 10.2964 18.4469C10.4874 18.5292 10.6921 18.5715 10.8989 18.5715V6.73654H7.87134C6.74722 6.73654 5.66913 7.20081 4.87425 8.02722C4.07937 8.85363 3.63281 9.97448 3.63281 11.1432ZM15.1374 6.73654H14.5319V8.3733H15.1374C15.844 8.3733 16.5216 8.66513 17.0213 9.18458C17.5209 9.70404 17.8016 10.4086 17.8016 11.1432C17.8016 11.8778 17.5209 12.5823 17.0213 13.1018C16.5216 13.6213 15.844 13.9131 15.1374 13.9131H13.6842V5.3516C13.6842 4.9175 13.5183 4.50119 13.2231 4.19424C12.9278 3.88729 12.5274 3.71484 12.1099 3.71484V15.5498H15.1374C15.694 15.5498 16.2452 15.4359 16.7594 15.2144C17.2737 14.9929 17.7409 14.6684 18.1345 14.2592C18.5281 13.85 18.8403 13.3642 19.0533 12.8295C19.2663 12.2949 19.3759 11.7219 19.3759 11.1432C19.3759 10.5645 19.2663 9.99148 19.0533 9.45684C18.8403 8.9222 18.5281 8.43642 18.1345 8.02722C17.7409 7.61803 17.2737 7.29344 16.7594 7.07198C16.2452 6.85053 15.694 6.73654 15.1374 6.73654Z"
                          fill="white"
                        />{" "}
                        <path
                          d="M36.2064 2.80615C36.3538 2.80615 36.4979 2.76093 36.6205 2.6762C36.743 2.59148 36.8385 2.47105 36.895 2.33015C36.9514 2.18925 36.9661 2.03421 36.9374 1.88464C36.9086 1.73506 36.8376 1.59767 36.7334 1.48983C36.6292 1.38199 36.4964 1.30855 36.3518 1.2788C36.2073 1.24905 36.0574 1.26432 35.9213 1.32268C35.7851 1.38104 35.6687 1.47987 35.5868 1.60668C35.5049 1.73348 35.4612 1.88256 35.4612 2.03507C35.4612 2.23957 35.5397 2.4357 35.6795 2.58031C35.8192 2.72492 36.0088 2.80615 36.2064 2.80615ZM31.8095 3.32021C31.5002 3.31977 31.1969 3.40852 30.9337 3.57651C30.6704 3.74449 30.4576 3.98506 30.3191 4.27122H30.2694V3.44873H29.1267V8.51219H30.3439V5.73628C30.3439 5.068 30.7165 4.37403 31.4866 4.37403C32.2567 4.37403 32.4057 5.11941 32.4057 5.71058V8.53789H33.623V5.32503C33.623 4.29692 33.1013 3.26881 31.8095 3.26881V3.32021ZM26.6426 8.51219H27.8846V3.44873H26.6426V8.51219ZM48.8755 2.78045C49.0229 2.78045 49.1669 2.73523 49.2895 2.6505C49.412 2.56577 49.5076 2.44535 49.564 2.30445C49.6204 2.16355 49.6351 2.00851 49.6064 1.85894C49.5776 1.70936 49.5066 1.57197 49.4024 1.46413C49.2982 1.35629 49.1654 1.28285 49.0208 1.2531C48.8763 1.22335 48.7264 1.23862 48.5903 1.29698C48.4541 1.35534 48.3377 1.45417 48.2558 1.58097C48.1739 1.70778 48.1302 1.85686 48.1302 2.00937C48.1302 2.21387 48.2087 2.41 48.3485 2.55461C48.4883 2.69921 48.6778 2.78045 48.8755 2.78045ZM46.8882 3.44873V4.57965H48.2544V8.51219H49.4965V4.57965H50.8628V3.44873H46.8882ZM44.8015 8.51219H46.0436V3.44873H44.8015V8.51219ZM34.244 4.57965H35.6103V8.51219H36.8523V4.57965H38.2186V3.44873H34.244V4.57965ZM42.3422 6.25034C42.3422 6.91861 41.9696 7.61259 41.1995 7.61259C40.4295 7.61259 40.2804 6.8415 40.2804 6.25034V3.44873H39.0383V6.61018C39.0383 7.63829 39.5848 8.6664 40.8517 8.6664C41.1653 8.67167 41.4738 8.58519 41.7419 8.41694C42.01 8.24869 42.2267 8.00551 42.3671 7.7154H42.3919V8.53789H43.5594V3.44873H42.3174V6.22463L42.3422 6.25034Z"
                          fill="white"
                        />{" "}
                      </svg>
                      <strong>Last connected to QBO</strong>
                      {momentFunction.formatDate(userInfo.updated_at)}
                    </span>
                    <button onClick={connectQBO} className={`btn btnPrimary`}>
                      Connect{" "}
                      <svg
                        width="32"
                        height="32"
                        viewBox="0 0 32 32"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        {" "}
                        <g clip-path="url(#clip0_587_15216)">
                          {" "}
                          <path
                            d="M22.494 15.4006L22.5484 15.6673H22.8207H26.334V16.3339H22.814H22.5407L22.4871 16.602C22.3119 17.479 21.8339 18.2665 21.1369 18.8268C20.4398 19.3872 19.568 19.6847 18.6738 19.6673L18.6738 19.6673H18.6673H13.434V19.6672L13.4275 19.6673C12.5333 19.6847 11.6615 19.3872 10.9644 18.8268C10.2674 18.2665 9.78944 17.479 9.61419 16.6019L9.56063 16.3339H9.28732H5.66732V15.6673H9.29398H9.56618L9.62059 15.4006C9.79905 14.5259 10.2772 13.7409 10.9725 13.1811C11.6678 12.6212 12.5368 12.3216 13.4294 12.3339L13.4294 12.3339H13.434H18.6673V12.334L18.673 12.3339C19.5677 12.3187 20.4395 12.617 21.1374 13.1771C21.8353 13.7372 22.3152 14.5238 22.494 15.4006ZM15.3873 19.0006H15.7202L15.7207 18.6677L15.7273 13.3344L15.7277 13.0006H15.394H13.4396C12.6195 12.9739 11.822 13.2721 11.2205 13.8303C10.6176 14.3899 10.2606 15.1653 10.2276 15.9872L10.227 16.0006L10.2276 16.014C10.2606 16.8359 10.6176 17.6113 11.2205 18.1709C11.822 18.7291 12.6195 19.0273 13.4395 19.0006H15.3873ZM16.334 18.6673V19.0006H16.6673H18.6618C19.4818 19.0273 20.2793 18.7291 20.8808 18.1709C21.4837 17.6113 21.8407 16.8359 21.8737 16.014L21.8743 16.0006L21.8737 15.9872C21.8407 15.1653 21.4837 14.3899 20.8808 13.8303C20.2793 13.2721 19.4818 12.9739 18.6617 13.0006H16.6673H16.334V13.3339V18.6673Z"
                            fill="#171D34"
                            stroke="white"
                            stroke-width="0.666667"
                          />{" "}
                        </g>{" "}
                        <rect
                          x="1"
                          y="1"
                          width="30"
                          height="30"
                          rx="15"
                          stroke="white"
                          stroke-width="2"
                        />{" "}
                        <defs>
                          {" "}
                          <clipPath id="clip0_587_15216">
                            {" "}
                            <rect
                              width="24"
                              height="24"
                              fill="white"
                              transform="translate(4 4)"
                            />{" "}
                          </clipPath>{" "}
                        </defs>{" "}
                      </svg>
                    </button>
                  </div>
                  {QBOError && (
                    <Alert
                      variant="warning"
                      className="text p-2 mt-3"
                      style={{ color: "#d93025" }}
                    >
                      You will have to connect to QBO to proceed
                    </Alert>
                  )}
                  <div className="btnGroup">
                    {/* <button
                      className="btn btnPrimary"
                      onClick={() => {
                        isClioConnected
                          ? history.push("/setupwizard?step=1&connected=true")
                          : history.push("/setupwizard?step=1&connected=false");
                      }}
                    >
                      Previous
                    </button> */}

                    {!Cookies.get("DiagnoseConnection") ? (
                      <button
                        className="btn btnPrimary"
                        onClick={() => {
                          isQBOConnected
                            ? history.push("/setupwizard?step=2&connected=true")
                            : history.push(
                                "/setupwizard?step=2&connected=false"
                              );
                        }}
                      >
                        Previous
                      </button>
                    ) : (
                      <span>{""}</span>
                    )}

                    <button
                      className="btn btnPrimary"
                      onClick={checkQBOConnected}
                    >
                      Next
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
      {activeFormNumber === 3 && complianceReports && isQBOConnected && (
        <>
          <div className="row">
            <div className="col-md-4 offset-md-4">
              <div className="row">
                <div className="col-md-10 offset-md-1">
                  {/* <span className="heading pb-0">Connect to QBO</span>
                  <span className="text pText">
                    Please connect with your QBO accounts and allow this
                    application to access your organization data. This app do
                    not store user ID and password provided to provide permisiom
                  </span> */}
                  <div className="connectList QBO">
                    <span>
                      <svg
                        width="132"
                        height="26"
                        viewBox="0 0 132 26"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        {" "}
                        <path
                          d="M131.348 19.8571C131.348 19.6063 131.098 19.506 130.872 19.506H130.446V20.7597H130.672V20.2582H130.847L131.123 20.7597H131.399L131.073 20.2081C131.15 20.196 131.221 20.1564 131.271 20.0966C131.322 20.0367 131.349 19.9606 131.348 19.8821V19.8571ZM130.672 20.0577V19.7066H130.872C130.998 19.7066 131.123 19.7317 131.123 19.8821C131.123 20.0326 130.973 20.0577 130.847 20.0577H130.672ZM130.872 19.0547C130.654 19.0597 130.443 19.1293 130.264 19.2546C130.086 19.3799 129.948 19.5554 129.869 19.7589C129.791 19.9623 129.774 20.1845 129.821 20.3975C129.869 20.6105 129.978 20.8046 130.136 20.9553C130.293 21.1061 130.492 21.2066 130.707 21.2443C130.922 21.282 131.143 21.2552 131.343 21.1672C131.542 21.0791 131.711 20.9339 131.828 20.7498C131.945 20.5657 132.005 20.351 132 20.1329C132 19.9859 131.971 19.8403 131.914 19.7048C131.857 19.5693 131.773 19.4465 131.668 19.3437C131.563 19.241 131.439 19.1602 131.302 19.1063C131.165 19.0523 131.019 19.0263 130.872 19.0296V19.0547ZM130.872 21.0606C130.683 21.0606 130.498 21.004 130.341 20.8981C130.184 20.7923 130.062 20.642 129.99 20.4664C129.919 20.2908 129.902 20.098 129.94 19.9125C129.979 19.727 130.072 19.5573 130.208 19.4251C130.344 19.2929 130.516 19.2042 130.702 19.1703C130.889 19.1364 131.081 19.1589 131.254 19.2349C131.428 19.3109 131.575 19.4369 131.677 19.5969C131.778 19.7568 131.83 19.9434 131.825 20.1329C131.825 20.3856 131.724 20.6279 131.546 20.8066C131.367 20.9853 131.125 21.0857 130.872 21.0857V21.0606ZM59.1917 19.2302C57.5626 19.2302 56.7355 17.7508 56.7355 16.3466C56.7355 14.9424 57.6378 13.5383 59.1165 13.5383C59.8183 13.5383 60.6955 13.8893 61.0464 14.3908L62.7507 12.6606C62.2692 12.1958 61.6997 11.8321 61.0755 11.5909C60.4514 11.3497 59.7853 11.236 59.1165 11.2565C56.1089 11.2565 53.9284 13.4129 53.9284 16.3717C53.9284 19.3806 56.0839 21.512 59.1917 21.512C60.6454 21.512 61.9988 21.0857 62.8008 20.2081L61.1216 18.4027C60.8721 18.6634 60.5725 18.8711 60.2409 19.0133C59.9093 19.1554 59.5525 19.2292 59.1917 19.2302ZM49.5424 21.2362H52.2492V11.5323H49.5674L49.5424 21.2362ZM44.6551 16.8481C44.6551 17.9765 43.9032 19.2051 42.5498 19.2051C41.4721 19.2051 40.8956 18.4529 40.8956 16.8732V11.5574H38.2138V17.5753C38.2138 19.5812 39.2164 21.5371 41.8981 21.5371C43.1513 21.5371 44.2039 20.5341 44.7303 19.7818H44.7804V21.2612H47.3368V11.5323H44.6551V16.8481ZM33.3767 12.7609H33.3265C32.9506 12.3347 31.923 11.2565 30.2688 11.2565C27.5369 11.2565 25.4316 13.3878 25.4316 16.3466C25.4316 19.3556 27.3866 21.512 30.1435 21.512C30.7332 21.4938 31.3129 21.3555 31.8473 21.1054C32.3817 20.8554 32.8595 20.4988 33.2513 20.0577H33.3015V26.0003H35.9582V11.5323H33.4017L33.3767 12.7609ZM30.7952 19.2302C29.141 19.2302 28.1886 17.7759 28.1886 16.3466C28.1886 14.9675 29.0407 13.5132 30.7952 13.5132C32.3741 13.5132 33.3516 15.0177 33.3516 16.3717C33.3516 17.7257 32.3992 19.2302 30.7952 19.2302ZM91.7738 11.2565C88.7411 11.2565 86.5105 13.3878 86.5105 16.3466C86.5105 19.4057 88.7662 21.5371 91.7738 21.5371C94.7814 21.5371 97.037 19.3806 97.037 16.3466C97.037 13.3878 94.8315 11.2565 91.7738 11.2565ZM91.7738 19.2302C90.0194 19.2302 89.2424 17.7257 89.2424 16.3466C89.2424 14.9675 90.0444 13.5132 91.7738 13.5132C93.5031 13.5132 94.3553 14.9675 94.3553 16.3466C94.3553 17.7257 93.5533 19.2302 91.7988 19.2302H91.7738ZM125.258 15.2684C123.88 14.9424 123.378 14.7669 123.378 14.1902C123.378 13.438 124.381 13.2624 124.807 13.2624C125.634 13.2624 126.561 13.7639 126.937 14.2153L128.516 12.7108C127.764 11.8081 126.336 11.2815 124.832 11.2815C122.877 11.2815 120.847 12.2595 120.847 14.4159C120.847 16.2965 122.326 16.8481 123.754 17.1991C125.258 17.5502 125.81 17.8009 125.81 18.4278C125.81 19.3054 124.807 19.4559 124.431 19.4559C123.97 19.4345 123.517 19.3215 123.1 19.1234C122.682 18.9254 122.308 18.6463 122 18.3024L120.371 19.9574C121.248 20.9603 122.777 21.5371 124.331 21.5371C126.962 21.5371 128.516 20.2833 128.516 18.2272C128.516 16.2714 126.612 15.5944 125.258 15.2684ZM120.17 11.5323H116.712L113.253 15.5442H113.203V6.19141H110.521V21.2362H113.203V16.472H113.253L116.837 21.2362H120.346L116.185 15.9454L120.17 11.5323ZM80.4703 11.2815C79.2172 11.2815 78.3399 11.783 77.4627 12.5854H77.4377V6.19141H74.7559V21.2362H77.3124V19.8571H77.3625C77.6923 20.3599 78.1424 20.7724 78.672 21.057C79.2017 21.3417 79.7939 21.4894 80.3951 21.4869C83.1521 21.4869 85.2574 19.3305 85.2574 16.3466C85.2574 13.3878 83.2022 11.2565 80.4703 11.2565V11.2815ZM79.944 19.2302C78.3149 19.2302 77.3625 17.7759 77.3625 16.3717C77.3625 14.9675 78.365 13.5132 79.944 13.5132C81.6733 13.5132 82.5255 14.9675 82.5255 16.3466C82.5255 17.7759 81.5981 19.2302 79.944 19.2302ZM73.7534 11.5323H70.2947L66.836 15.5442H66.7858V6.19141H64.1041V21.2362H66.7858V16.472H66.836L70.42 21.2362H73.9288L69.7934 15.9454L73.7534 11.5323ZM103.528 11.2815C100.471 11.2815 98.2651 13.4129 98.2651 16.3466C98.2651 19.4057 100.521 21.5371 103.528 21.5371C106.536 21.5371 108.792 19.3806 108.792 16.3466C108.792 13.3878 106.561 11.2565 103.528 11.2565V11.2815ZM103.528 19.2302C101.774 19.2302 100.972 17.7257 100.972 16.3466C100.972 14.9675 101.774 13.5132 103.528 13.5132C105.283 13.5132 106.06 14.9675 106.06 16.3466C106.06 17.7257 105.258 19.2302 103.528 19.2302Z"
                          fill="white"
                        />{" "}
                        <path
                          d="M11.5046 22.285C17.8584 22.285 23.0092 17.2964 23.0092 11.1425C23.0092 4.98868 17.8584 0 11.5046 0C5.15078 0 0 4.98868 0 11.1425C0 17.2964 5.15078 22.285 11.5046 22.285Z"
                          fill="#2CA01C"
                        />{" "}
                        <path
                          d="M3.63281 11.1432C3.63281 12.3119 4.07937 13.4328 4.87425 14.2592C5.66913 15.0856 6.74722 15.5498 7.87134 15.5498H8.47685V13.9131H7.87134C7.16475 13.9131 6.48709 13.6213 5.98746 13.1018C5.48782 12.5823 5.20712 11.8778 5.20712 11.1432C5.20712 10.4086 5.48782 9.70404 5.98746 9.18458C6.48709 8.66513 7.16475 8.3733 7.87134 8.3733H9.32456V16.9348C9.32456 17.1497 9.36528 17.3626 9.44439 17.5611C9.52351 17.7597 9.63947 17.9402 9.78566 18.0921C9.93185 18.2441 10.1054 18.3647 10.2964 18.4469C10.4874 18.5292 10.6921 18.5715 10.8989 18.5715V6.73654H7.87134C6.74722 6.73654 5.66913 7.20081 4.87425 8.02722C4.07937 8.85363 3.63281 9.97448 3.63281 11.1432ZM15.1374 6.73654H14.5319V8.3733H15.1374C15.844 8.3733 16.5216 8.66513 17.0213 9.18458C17.5209 9.70404 17.8016 10.4086 17.8016 11.1432C17.8016 11.8778 17.5209 12.5823 17.0213 13.1018C16.5216 13.6213 15.844 13.9131 15.1374 13.9131H13.6842V5.3516C13.6842 4.9175 13.5183 4.50119 13.2231 4.19424C12.9278 3.88729 12.5274 3.71484 12.1099 3.71484V15.5498H15.1374C15.694 15.5498 16.2452 15.4359 16.7594 15.2144C17.2737 14.9929 17.7409 14.6684 18.1345 14.2592C18.5281 13.85 18.8403 13.3642 19.0533 12.8295C19.2663 12.2949 19.3759 11.7219 19.3759 11.1432C19.3759 10.5645 19.2663 9.99148 19.0533 9.45684C18.8403 8.9222 18.5281 8.43642 18.1345 8.02722C17.7409 7.61803 17.2737 7.29344 16.7594 7.07198C16.2452 6.85053 15.694 6.73654 15.1374 6.73654Z"
                          fill="white"
                        />{" "}
                        <path
                          d="M36.2064 2.80615C36.3538 2.80615 36.4979 2.76093 36.6205 2.6762C36.743 2.59148 36.8385 2.47105 36.895 2.33015C36.9514 2.18925 36.9661 2.03421 36.9374 1.88464C36.9086 1.73506 36.8376 1.59767 36.7334 1.48983C36.6292 1.38199 36.4964 1.30855 36.3518 1.2788C36.2073 1.24905 36.0574 1.26432 35.9213 1.32268C35.7851 1.38104 35.6687 1.47987 35.5868 1.60668C35.5049 1.73348 35.4612 1.88256 35.4612 2.03507C35.4612 2.23957 35.5397 2.4357 35.6795 2.58031C35.8192 2.72492 36.0088 2.80615 36.2064 2.80615ZM31.8095 3.32021C31.5002 3.31977 31.1969 3.40852 30.9337 3.57651C30.6704 3.74449 30.4576 3.98506 30.3191 4.27122H30.2694V3.44873H29.1267V8.51219H30.3439V5.73628C30.3439 5.068 30.7165 4.37403 31.4866 4.37403C32.2567 4.37403 32.4057 5.11941 32.4057 5.71058V8.53789H33.623V5.32503C33.623 4.29692 33.1013 3.26881 31.8095 3.26881V3.32021ZM26.6426 8.51219H27.8846V3.44873H26.6426V8.51219ZM48.8755 2.78045C49.0229 2.78045 49.1669 2.73523 49.2895 2.6505C49.412 2.56577 49.5076 2.44535 49.564 2.30445C49.6204 2.16355 49.6351 2.00851 49.6064 1.85894C49.5776 1.70936 49.5066 1.57197 49.4024 1.46413C49.2982 1.35629 49.1654 1.28285 49.0208 1.2531C48.8763 1.22335 48.7264 1.23862 48.5903 1.29698C48.4541 1.35534 48.3377 1.45417 48.2558 1.58097C48.1739 1.70778 48.1302 1.85686 48.1302 2.00937C48.1302 2.21387 48.2087 2.41 48.3485 2.55461C48.4883 2.69921 48.6778 2.78045 48.8755 2.78045ZM46.8882 3.44873V4.57965H48.2544V8.51219H49.4965V4.57965H50.8628V3.44873H46.8882ZM44.8015 8.51219H46.0436V3.44873H44.8015V8.51219ZM34.244 4.57965H35.6103V8.51219H36.8523V4.57965H38.2186V3.44873H34.244V4.57965ZM42.3422 6.25034C42.3422 6.91861 41.9696 7.61259 41.1995 7.61259C40.4295 7.61259 40.2804 6.8415 40.2804 6.25034V3.44873H39.0383V6.61018C39.0383 7.63829 39.5848 8.6664 40.8517 8.6664C41.1653 8.67167 41.4738 8.58519 41.7419 8.41694C42.01 8.24869 42.2267 8.00551 42.3671 7.7154H42.3919V8.53789H43.5594V3.44873H42.3174V6.22463L42.3422 6.25034Z"
                          fill="white"
                        />{" "}
                      </svg>
                      <strong>Connected to QBO</strong>
                      {momentFunction.formatDate(userInfo.updated_at)}
                    </span>
                    <button onClick={() => disconnectService("intuit")}>
                      Disconnect{" "}
                      <svg
                        width="32"
                        height="32"
                        viewBox="0 0 32 32"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        {" "}
                        <path
                          d="M22 22L10 10M22 10L10 22"
                          stroke="white"
                          stroke-width="1.5"
                          stroke-linecap="round"
                        />{" "}
                        <rect
                          x="1"
                          y="1"
                          width="30"
                          height="30"
                          rx="15"
                          stroke="white"
                          stroke-width="2"
                        />{" "}
                      </svg>
                    </button>
                  </div>
                  <div className="btnGroup">
                    {!Cookies.get("DiagnoseConnection") ? (
                      <button
                        className="btn btnPrimary"
                        onClick={() => {
                          isQBOConnected
                            ? history.push("/setupwizard?step=2&connected=true")
                            : history.push(
                                "/setupwizard?step=2&connected=false"
                              );
                        }}
                      >
                        Previous
                      </button>
                    ) : (
                      <span>{""}</span>
                    )}

                    <button
                      className="btn btnPrimary"
                      onClick={() => {
                        if (Cookies.get("DiagnoseConnection")) {
                          history.push(`${AUTH_ROUTES.DASHBOARD}`);
                        } else {
                          const isRedirect = location?.search
                            ?.split("&")[1]
                            ?.split("=");
                          if (isRedirect[0] === "redirect") {
                            history.push(`/${isRedirect[1]}`);
                          } else {
                            history.push("/setupwizard?step=4&form=1");
                          }
                        }
                      }}
                    >
                      Next
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
      {activeFormNumber === 4 &&
        ((complianceReports && isQBOConnected) || !complianceReports) && (
          <OnBoarding
            isQBOConnected={isQBOConnected}
            familyLawTools={familyLawTools}
            complianceReports={complianceReports}
          ></OnBoarding>
        )}
    </>
  );
};

export default LoginForm;
