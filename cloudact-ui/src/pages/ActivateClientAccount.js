import React, { useState } from "react";
import { Col, Row } from "react-bootstrap";
import { useHistory, useLocation } from "react-router-dom";
import Illustration from "../assets/images/illustration-2-02 1.png";
import axios from "../utils/axios";

const ActivateClientAccount = ({ changeLinkConfirmed }) => {
  const [password, setPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [confirmPasswordError, setConfirmPasswordError] = useState("");
  const [userName, setUserName] = useState("");
  const [nameError, setNameError] = useState("");
  const location = useLocation();
  const history = useHistory();
  const { confirmationCode, email, uid } = location.state;

  console.log("confirmationCode", confirmationCode);
  console.log("email", email);
  console.log("uid", uid);
  const handleSubmit = (e) => {
    e.preventDefault();
    if (userName === "") {
      setUserName("Enter User Name");
    }

    if (password === "") {
      setPasswordError("Enter Password");
    }
    if (confirmPassword === "") {
      setConfirmPasswordError("Enter Confirm Password");
    }

    if (password !== confirmPassword) {
      setPasswordError("Password does not match!");
    }

    if (
      password !== "" &&
      password === confirmPassword &&
      email &&
      userName &&
      uid &&
      confirmationCode
    ) {
      axios
        .post("/activate/client/account", {
          user_name: userName,
          uid: uid,
          password: password,
          confirmationCode: confirmationCode,
        })
        .then((res) => {
          const { code } = res.data.data;

          if (code === 200) {
            changeLinkConfirmed(true);
            history.push("/signIn");
          } else {
            throw res.data.data.message;
          }
        })
        .catch((err) => {
          console.log("err", err);
          history.push("/signIn");
        });
    }
  };

  return (
    <div className="d-flex justify-content-center my-5">
      <Row className="align-self-center w-50 py-5 m-4">
        <Col className="align-self-center">
          <img
            src={Illustration}
            alt="man sitting on desk"
            style={{ width: "100%" }}
          ></img>
        </Col>
        <Col>
          <div className="heading-4 mb-1">Sign in to CloudAct</div>
          <p className="heading-6 mb-4">Enter your details below</p>

          <form onSubmit={handleSubmit} className="signIn_form">
            <div className="searchformfld mt-4">
              <input
                required
                className={`input_primary rounded heading-5`}
                value={userName}
                name="username"
                onChange={(e) => setUserName(e.target.value)}
                type="text"
              />
              <div className="floating-label">Name</div>
            </div>
            {nameError && <p className="text-error mt-2">{nameError}</p>}
            <div className="searchformfld mt-4">
              <input
                className={`input_primary rounded heading-5 disabled`}
                value={email}
                name="email"
                disabled={true}
                required
                //   onChange={handleChange}
                type="text"
              />
              <div className="floating-label">Email Address</div>
            </div>
            {/* {emailError && <p className="text-error mt-2">{emailError}</p>} */}
            <div className="searchformfld mt-4">
              <input
                value={password}
                type="password"
                required
                name="password"
                onChange={(e) => setPassword(e.target.value)}
                className={`input_primary rounded heading-5 ${passwordError ? "border_red" : ""
                  }`}
              />
              <div className="floating-label">Password</div>
            </div>
            {passwordError && (
              <p className="text-error mt-2">{passwordError}</p>
            )}
            <div className="searchformfld mt-4">
              <input
                placeholder="Confirm Password"
                value={confirmPassword}
                type="password"
                name="password"
                required
                onChange={(e) => setConfirmPassword(e.target.value)}
                className={`input_primary rounded heading-5 ${passwordError ? "border_red" : ""
                  }`}
              />
              <div className="floating-label">Confirm Password</div>
            </div>
            {confirmPasswordError && (
              <p className="text-error mt-2">{confirmPasswordError}</p>
            )}

            <button
              type="submit"
              className="btn_primary_colored w-100 py-3 my-3"
            >
              Sign In
            </button>
          </form>
        </Col>
      </Row>
    </div>
  );
};

export default ActivateClientAccount;
