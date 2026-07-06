import React, { useEffect, useRef, useState } from "react";
import { Alert, Col, Row, Container, Image } from "react-bootstrap";
import { useDispatch, useSelector } from "react-redux";
import { Link, useHistory } from "react-router-dom";
import { userOPTMatchAction } from "../../actions/userActions";
import {
  USER_CHANGE_SUCCESS,
  USER_LOGIN_FAIL,
  USER_LOGIN_REQUEST,
  USER_LOGIN_SUCCESS,
} from "../../constants/userConstants";
import { login } from "../../utils/Apis/auth/authApi";
import { establishSession } from "../../utils/personalAuthSession";

import SignInSVG from "../../assets/images/sign in.svg";
import ModalInputCenter from "../ModalInputCenter";
import ProfileNumberInput from "../Profile/ProfileNumberInput";
import Logo from "../../assets/images/CloudAct-Accounting-Taxation-logo-1 3.png";
import InvalidUsernameOrPasswordImage from "../../assets/images/invalid username or password.png";
import { Roles } from "../../routes/Role.types";
import { AUTH_ROUTES, UN_AUTH_ROUTES } from "../../routes/Routes.types";

const SignIn = ({
  isUserLogged,
  isLinkConfirmed,
  changeQBOConnected,
  changeClioConnected,
  changeLinkConfirmed,
  updateuserInfo,
  setUserLogin,
}) => {
  const dispatch = useDispatch();
  const [email, setEmail] = useState(
    localStorage.getItem("email")
      ? JSON.parse(localStorage.getItem("email"))
      : ""
  );
  const [sideImage, setSideImage] = useState(SignInSVG);
  const [password, setPassword] = useState(
    localStorage.getItem("password")
      ? JSON.parse(localStorage.getItem("password"))
      : ""
  );
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [showAlert, setShowAlert] = useState("");
  const number1 = useRef(null);
  const number2 = useRef(null);
  const number3 = useRef(null);
  const number4 = useRef(null);
  const [checkboxChecked, setCheckboxChecked] = useState(
    localStorage.getItem("rememberMe")
      ? JSON.parse(localStorage.getItem("rememberMe"))
      : false
  );
  const [OTP, setOTP] = useState({
    otp: "",
    showModal: false,
  });
  const history = useHistory();
  const userLogin = useSelector((state) => state.userLogin);

  const { error, loading, userInfo } = userLogin;
  const userAuth = useSelector((state) => state.userLoginAuth);

  const userOPTMatch = useSelector((state) => state.userOPTMatch);

  useEffect(() => {
    if (error) {
      setSideImage(InvalidUsernameOrPasswordImage);
    } else {
      setSideImage(SignInSVG);
    }
  }, [error]);

  useEffect(() => {
    if (!userAuth.loading && userAuth.response) {
      console.log("show modal for number");
      setOTP({ ...OTP, showModal: true });
    }
  }, [userAuth]);

  useEffect(() => {

    if(userInfo && userInfo.role[0].role == Roles.SUPERADMIN){
      history.push(AUTH_ROUTES.SUPERADMINDB);
    }else if(userInfo) {
      history.push("/");
    }
  }, [error, userInfo]);

  useEffect(() => {
    if (userOPTMatch.response === false) {
      console.log("OTP invalid");
      setShowAlert("OTP invalid!. Please enter the correct OTP.");
    } else if (!userOPTMatch.loading && userOPTMatch.response) {
      console.log("go to dashboard");
    }
  }, [userOPTMatch]);

  const handleChange = (e) => {
    const nam = e.target.name;
    const val = e.target.value;

    if (nam === "email") {
      setEmail(val);
      setEmailError("");
    } else if (nam === "password") {
      setPassword(val);
      setPasswordError("");
    }
  };

  const handleCheckClick = (e) => {
    setCheckboxChecked((elem) => !elem);
    const checked = e.target.checked;
    if (checked) {
      localStorage.setItem("email", JSON.stringify(email));
      localStorage.setItem("password", JSON.stringify(password));
      localStorage.setItem("rememberMe", JSON.stringify(checked));
    } else {
      localStorage.removeItem("email");
      localStorage.removeItem("password");
      localStorage.removeItem("rememberMe");
    }
  };

  // Signs in against the personal auth-server (/api/login) and seeds the
  // legacy client cookies the rest of the UI reads — same flow VerifyEmail.js
  // uses after the emailed link. The legacy /v1 userLoginAction is gone.
  const submitLogin = async () => {
    dispatch({ type: USER_LOGIN_REQUEST });
    try {
      const { ok, status, data } = await login({ email, password });

      if (ok) {
        const userInfo = establishSession(data.user, data.accessToken);
        dispatch({ type: USER_CHANGE_SUCCESS, payload: userInfo.role[0] });
        dispatch({ type: USER_LOGIN_SUCCESS, payload: userInfo });
        return; // redirect handled by the userInfo effect above
      }

      if (status === 403) {
        // Account exists but the email was never verified — send them to the
        // check-email page where they can resend the verification link.
        dispatch({
          type: USER_LOGIN_FAIL,
          payload: data?.message || "Please verify your email before signing in.",
        });
        history.push({
          pathname: UN_AUTH_ROUTES.VERIFY_EMAIL,
          state: { email },
        });
        return;
      }

      dispatch({
        type: USER_LOGIN_FAIL,
        payload: data?.message || "Invalid email or password.",
      });
    } catch (err) {
      dispatch({
        type: USER_LOGIN_FAIL,
        payload: "Unable to reach the sign-in service. Please try again.",
      });
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (email === "") {
      setEmailError("Enter email address");
    }
    if (password === "") {
      setPasswordError("Enter password");
    }

    if (email !== "" && password !== "") {
      submitLogin();
    }
  };

  return (
    <>
      <div className="login">
        <Link className="brand" to="/">
          <Image src={Logo} />
        </Link>
        {isLinkConfirmed && (
          <Alert variant="success">
            <div className="heading-5 m-auto">
              Your account has been verified. Sign in to continue.
            </div>
          </Alert>
        )}
        <div className="loginFields">
          <span className="h3">CloudAct Solutions</span>
          <span className="h5">
            Welcome back! Please enter your details below
          </span>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Email</label>
              <input
                className={`form-control ${emailError ? "border_red" : ""}`}
                value={email}
                name="email"
                placeholder="Enter your email"
                required
                onChange={handleChange}
                type="email"
              />
            </div>
            {emailError && <p className="text-error">{emailError}</p>}
            <div className="form-group">
              <label>Password</label>
              <input
                value={password}
                type="password"
                placeholder="Enter your password"
                name="password"
                required
                onChange={handleChange}
                className={`form-control ${passwordError ? "border_red" : ""}`}
              />
            </div>
            {passwordError && <p className="text-error">{passwordError}</p>}
            {error && <p className="text-danger">*{error}</p>}
            <div className="control">
              <label className="checkbox">
                <input
                  type="checkbox"
                  onChange={handleCheckClick}
                  checked={checkboxChecked}
                  name="save"
                />{" "}
                Remember me
              </label>
              <Link to="/forgetpassword">Forget your password?</Link>
            </div>
            <button type="submit" className="btn btnPrimary">
              Sign In
            </button>

{/*             
            <button onClick={() => history.push("/freecalculator")} className="btn btnPrimary">
              Free Calculator
            </button> */}
            

          </form>
          <span className="text ">
            Don't have an account?
            <Link
              to="/createAccount"
              className="text-primary-color heading-6 fw-bold ms-1"
            >
              Sign Up
            </Link>
          </span>
          <ModalInputCenter
            show={OTP.showModal}
            changeShow={() => {
              setOTP({
                ...OTP,
                showModal: false,
              });
            }}
            action="Verify Code"
            handleClick={() => {
              console.log("num1", number1.current.value);
              console.log("num1", number2.current.value);
              console.log("num1", number3.current.value);
              console.log("num1", number4.current.value);

              const otp =
                number1.current.value +
                number2.current.value +
                number3.current.value +
                number4.current.value;

              setOTP({ ...OTP, otp: otp });
              const obj = {
                authkey: userAuth.response.authkey,
                type: "validate_login",
                otp: otp,
              };

              dispatch(userOPTMatchAction(obj));
            }}
          >
            <div className="text-center">
              <p className="heading-4">Mobile number notification</p>
              {/* <p className="heading-5 fw-light" style={{ color: "gray" }}>
              A verification code has been sent to your mobile number{" "}
              {OTP.phone}
            </p> */}

              <div className="my-4">
                <div className="heading-normal my-3">
                  Please enter code to verify your mobile number
                </div>

                <ProfileNumberInput ref={number1} />

                <ProfileNumberInput ref={number2} />

                <ProfileNumberInput ref={number3} />

                <ProfileNumberInput ref={number4} />

                <div className="heading-normal my-3">
                  Did not receive code?
                  <span
                    className="text-primary-color cursor_pointer"
                    onClick={(e) => {
                      handleSubmit(e);
                      setShowAlert("New OTP Send!");
                    }}
                  >
                    {" "}
                    Resend SMS
                  </span>
                </div>

                {showAlert && (
                  <Alert className="heading-normal" variant="warning">
                    {showAlert}
                  </Alert>
                )}
              </div>
            </div>
          </ModalInputCenter>
        </div>
      </div>
      <div className="loginGraphic">
        <img src={sideImage} alt="man sitting on desk"></img>
      </div>
    </>
  );
};

export default SignIn;
