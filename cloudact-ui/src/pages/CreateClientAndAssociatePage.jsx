import  { useEffect, useState } from "react";
import { useLocation } from 'react-router'
import Footer from '../components/Footer';
import { Alert,Image } from "react-bootstrap";
import PasswordStrength from "../components/PasswordStrength";
import { determineStrengthPassword } from "../utils/helpers";
import axios from "../utils/axios";
import ModalInputCenter from "../components/ModalInputCenter";
import Logo from "../../src/assets/images/CloudAct-Accounting-Taxation-logo-1 3.png";
import { Link } from "react-router-dom";
import SignInSVG from "../../src/assets/images/sign in.svg";


const CreateClientAndAssociatePage = () => {
  const location = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [passStrength, setPassStrength] = useState("Weak");
  const [emailError, setEmailError] = useState("");
  const [checkboxChecked, setCheckboxChecked] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newPasswordError, setNewPasswordError] = useState("");
  const [confirmationLink, setconfirmationLink] = useState(false);
  const [displayEmail, setdisplayEmail] = useState("");
  const [nameError, setNameError] = useState("");
  const [userName, setUserName] = useState("");
  const [verificationDone, setVerificationDone] = useState(false);

 
  const urlParams = new URLSearchParams(window.location.search);

  const emailUrl = location.search.split("email=")[1].split("&")[0];

  useEffect(() => {
    setEmail(emailUrl);
    setUserName(urlParams.get("username"));
  }, []);


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
      axios.post("/client/associate_and_creation", {
        password: password, email: email
      }).then((res) => {
        console.log("res", res);
        setVerificationDone(true);
      }).catch((err) => {
        console.log("err", err);
        setVerificationDone(false);
      })
    }
  };

  return (
    <>
  
        {confirmationLink && (
          <Alert variant="success">
            <span className="heading-5 m-auto">
              A verification link has been sent to your email
              <b> {displayEmail} </b> . Verify your email by clicking on the link
              to continue.
            </span>
          </Alert>
        )}

        <ModalInputCenter
          heading="Verification done"
          show={verificationDone}
          changeShow={() => setVerificationDone(false)}
          action="Ok"
          handleClick={() => setVerificationDone(false)}
          cancelOption="Cancel"
        >
          <h5 className="heading-5">
            You can now close this window and log in with your account to continue.
          </h5>
        </ModalInputCenter>

        <div className="loginSection">

        <div className="login">
        <Link className="brand" to="/">
          <Image src={Logo} />
        </Link>
      
        <div className="loginFields">

         <span className="h3">Setup your account</span>
          <span className="h5">Enter your details below </span>

         <form onSubmit={handleSubmit} >
                <div className="form-group">
                  <input
                      className="form-control"
                    value={userName}
                    required
                    disabled
                    name="username"
                    type="text"
                  ></input>
                  <div className="floating-label">User Name</div>
                </div>
                {nameError && <p className="text-error mt-2">{nameError}</p>}
                <div className="form-group">
                  <input
                      className="form-control"
                    value={email}
                    name="email"
                    disabled
                    type="text"
                    required
                  />
                  <div className="floating-label">Email Address</div>
                </div>
                {emailError && <p className="text-error mt-2">{emailError}</p>}
                <div className="form-group">
                  <input
                    value={password}
                    type={checkboxChecked ? "text" : "password"}
                    name="password"
                    required
                    onChange={handleChange}
                    className={`form-control ${passwordError ? "border-danger" : "" }`}
                    
                  />
                  <div className="floating-label">New Password</div>
                </div>
                {passwordError && (
                  <p className="text-danger">{passwordError}</p>
                )}


              {console.log("passStrength", passStrength)}
                <PasswordStrength strength={passStrength} />

                <div className="form-group">
                  <input
                    value={newPassword}
                    type={checkboxChecked ? "text" : "password"}
                    name="newPassword"
                    required
                    onChange={handleChange}
                    className={`form-control ${passwordError ? "border-danger" : "" }`}
                  />
                  <div className="floating-label">Confirm Password</div>
                </div>
                {newPasswordError && (
                  <p className="text-danger">{newPasswordError}</p>
                )}



                <div className="control">
                <label className="checkbox">
                  <input
                    type="checkbox"
                    name="showPassword"
                    id="showPassword"
                    onChange={() => setCheckboxChecked((e) => !e)}
                    checked={checkboxChecked}
                  />
                  Show Password
                  </label>
                </div>

                <button          
                  type="submit" className="btn btnPrimary"
                >
                  Create Account
                </button>
              </form>
          
     
        </div>
      </div>

      <div className="loginGraphic">
        <img src={SignInSVG} alt="man sitting on desk"></img>
      </div>
      </div>


      );
      <Footer />

    </>
  )
}

export default CreateClientAndAssociatePage

