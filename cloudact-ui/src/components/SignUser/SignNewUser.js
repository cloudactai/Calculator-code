import React, { useEffect, useState } from "react";
import { Alert, Col, Row, Container, Image } from "react-bootstrap";
import { Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { PiEyeClosedDuotone, PiEyeBold } from "react-icons/pi";
import { userRegisterAction } from "../../actions/userActions";
import PasswordStrength from "../../components/PasswordStrength";
import { determineStrengthPassword } from "../../utils/helpers";
import Logo from "../../assets/images/CloudAct-Accounting-Taxation-logo-1 3.png";
import SignUpImage from "../../assets/images/sign up.svg";
import ModalInputCenter from "../ModalInputCenter";
import UserAgreement from "./UserAgreement";
import Privacypolicy from "./Privacypolicy";

const SignNewUser = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [emailError, setEmailError] = useState("");
  const [passStrength, setPassStrength] = useState("Weak");
  const [passwordError, setPasswordError] = useState("");
  const [checkboxChecked, setCheckboxChecked] = useState({
    password: false,
    confirmPassword: false,
    privacy: false
  });

  const [newPassword, setNewPassword] = useState("");
  const [newPasswordError, setNewPasswordError] = useState("");
  const [confirmationLink, setconfirmationLink] = useState(false);
  const [displayEmail, setdisplayEmail] = useState("");
  const [nameError, setNameError] = useState("");
  const [userName, setUserName] = useState("");
  const dispatch = useDispatch();
  const userRegister = useSelector((state) => state.userRegister);
  const { error, loading, message } = userRegister;

  const [modalState, setModalState] = useState({
    privacyModal: false,
    AgreementModal: false,
  })


  useEffect(() => {
    console.log("error", error);
    console.log("error", message);
    if (error) setEmailError(error);
    if (message) {
      setconfirmationLink(true);
      setdisplayEmail(email);
      setUserName("");
      setEmail("");
      setPassword("");
      setNewPassword("");
    }
  }, [error, message]);

  const handleChange = (e) => {
    const nam = e.target.name;
    const val = e.target.value;

    if (nam === "email") {
      setEmail(val);
      setEmailError("");
    } else if (nam === "password") {
      setPassword(val);
      setPasswordError("");
      setPassStrength(determineStrengthPassword(val));
    } else if (nam === "newPassword") {
      setNewPassword(val);
      setNewPasswordError("");
    } else if (nam === "username") {
      setUserName(val);
      setNameError("");
    }
  };

  const handleCheckboxChange = (e) => {
    switch (e.currentTarget.getAttribute("data-name")) {
      case "password":
        setCheckboxChecked({
          ...checkboxChecked,
          password: !checkboxChecked.password,
        });
        break;
      case "confirmPassword":
        setCheckboxChecked({
          ...checkboxChecked,
          confirmPassword: !checkboxChecked.confirmPassword,
        });
        break;
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (userName === "") {
      setNameError("Enter User Name");
    }

    if (email === "") {
      setEmailError("Enter email address");
    }
    if (password !== newPassword) {
      setPasswordError("Password does not match");
    }

    if (
      userName !== "" &&
      email !== "" &&
      password !== "" &&
      newPassword !== "" &&
      password === newPassword
    ) {
      const dataStringify = JSON.stringify({
        user_name: userName,
        email: email,
        password: password,
      });
      console.log("data stringify", dataStringify);
      dispatch(userRegisterAction(dataStringify));
    }
  };

  let Privacystyles = {
    color: "#307FF4",
    cursor: "pointer",
    fontWeight: 700,
    fontSize: '15px',
    lineHeight: "20.46px"
  }

  const handleCheckClick = (e) => {
    const checked = e.target.checked;
    if (checked) {
      setCheckboxChecked((prev) => ({
        ...prev,
        privacy: true
      }))
    } else {
      setCheckboxChecked((prev) => ({
        ...prev,
        privacy: false
      }))
    }
  };


  const handlePrivacyModal = (e) => {

    if (e == 'privacyModal') {
      setModalState((prev) => ({
        ...prev,
        privacyModal: true,
        AgreementModal: false
      }))
    } else {
      setModalState((prev) => ({
        ...prev,
        privacyModal: false,
        AgreementModal: true
      }))
    }

  }


  return (
    <>
      <div className="login">
        <Link className="brand" to="/">
          <Image src={Logo} />
        </Link>
        {confirmationLink && (
          <Alert variant="success">
            <span className="heading-5 m-auto">
              A verification link has been sent to your email
              <b> {displayEmail} </b> . Verify your email by clicking on the
              link to continue.
            </span>
          </Alert>
        )}
        <div className="loginFields">
          <span className="h3">Create Account</span>
          <span className="h5">
            We are glad that you have chosen our platform. Please enter your
            details to create your CloudAct account.
          </span>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>User Name</label>
              <input
                className={`form-control ${nameError ? "border_red" : ""}`}
                placeholder="Enter your user name"
                value={userName}
                required
                name="username"
                onChange={handleChange}
                type="text"
              ></input>
            </div>
            {nameError && <p className="text-error mt-2">{nameError}</p>}
            <div className="form-group">
              <label>Email Address</label>
              <input
                className={`form-control ${emailError ? "border_red" : ""}`}
                placeholder="Enter your email"
                value={email}
                name="email"
                onChange={handleChange}
                type="email"
                required
              />
            </div>
            {emailError && <p className="text-error mt-2">{emailError}</p>}
            <div className="form-group">
              <label className="fw-bold">Password</label>
              <input
                value={password}
                type={checkboxChecked.password ? "text" : "password"}
                name="password"
                required
                onChange={handleChange}
                className={`form-control ${passwordError ? "border_red" : ""}`}
              />
              <span
                className="input-icon"
                data-name="password"
                onClick={handleCheckboxChange}
              >
                {checkboxChecked.password ? (
                  <PiEyeClosedDuotone size={20} />
                ) : (
                  <PiEyeBold size={20} />
                )}
              </span>
            </div>
            {passwordError && (
              <p className="text-error mt-2">{passwordError}</p>
            )}
            {password && <PasswordStrength strength={passStrength} />}

            <div className="form-group">
              <label>Repeat the Password</label>
              <input
                value={newPassword}
                type={checkboxChecked.confirmPassword ? "text" : "password"}
                name="newPassword"
                required
                onChange={handleChange}
                className={`form-control ${passwordError ? "border_red" : ""}`}
              />
              <span
                className="input-icon"
                data-name="confirmPassword"
                onClick={handleCheckboxChange}
              >
                {checkboxChecked.confirmPassword ? (
                  <PiEyeClosedDuotone size={20} />
                ) : (
                  <PiEyeBold size={20} />
                )}
              </span>
            </div>
            {newPasswordError && (
              <p className="text-error mt-2">{newPasswordError}</p>
            )}

            <div className="d-flex gap-2">
              <label className="checkbox">
                <input
                  type="checkbox"
                  onChange={handleCheckClick}
                  checked={checkboxChecked.privacy}
                  className="p-2"
                  name="save"
                />

              </label>

              <p>I agree with CloudAct's <span
                style={Privacystyles} onClick={() => handlePrivacyModal('Agreement')}
              >User Agreement </span> and <span
                style={Privacystyles} onClick={() => handlePrivacyModal('privacyModal')}

              >Privacy Policy</span></p>
            </div>
            
            <button type="submit" disabled={!checkboxChecked.privacy} className="btn btnPrimary">
              Sign up
            </button>
          </form>
          <span className="text">
            Already have an CloudAct Account?{" "}
            <Link to="/signin" className="ms-1">
              Sign In
            </Link>
          </span>
        </div>
      </div>
      <div className="loginGraphic">
        <img src={SignUpImage} alt="signup in phone"></img>
      </div>

      {modalState.privacyModal &&
        <ModalInputCenter
        heading="Privacy Policy"
        cancelOption="Ok"
        handleClick={()=>setModalState((prev)=>({...prev , privacyModal:false}))}
        changeShow={()=>setModalState((prev)=>({...prev , privacyModal:false}))}
        show={modalState.privacyModal}
        modalSize="modal-lg"
        action="Cancel"
      >
       <Privacypolicy/>
      </ModalInputCenter>
      }

      {modalState.AgreementModal &&
        <ModalInputCenter
        modalSize="modal-lg"
        heading="User Agreement"
        cancelOption="Ok"
        handleClick={()=>setModalState((prev)=>({...prev , AgreementModal:false}))}
        changeShow={()=>setModalState((prev)=>({...prev , AgreementModal:false}))}
        show={modalState.AgreementModal}
        action="Cancel"
      >
       <UserAgreement/>
      </ModalInputCenter>
      }

    </>
  );
};

export default SignNewUser;
