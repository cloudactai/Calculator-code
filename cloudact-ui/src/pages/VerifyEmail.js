import React, { useEffect, useState } from "react";
import { Image } from "react-bootstrap";
import { useDispatch } from "react-redux";
import { Link, useHistory, useLocation } from "react-router-dom";
import Footer from "../components/Footer";
import Logo from "../assets/images/CloudAct-Accounting-Taxation-logo-1 3.png";
import {
  USER_CHANGE_SUCCESS,
  USER_LOGIN_SUCCESS,
} from "../constants/userConstants";
import { resendVerification, verifyEmail } from "../utils/Apis/auth/authApi";
import { establishSession } from "../utils/personalAuthSession";

/**
 * Landing page for the verification link the auth-server emails on signup
 * (`/verify-email?token=...`). Verifying also signs the user in (the backend
 * sets the session cookies), so on success we go straight into the app —
 * no firm/Clio onboarding.
 */
const VerifyEmail = () => {
  const dispatch = useDispatch();
  const history = useHistory();
  const location = useLocation();
  const token = new URLSearchParams(location.search).get("token");
  const emailFromState = location.state?.email || "";

  // check-email | verifying -> (redirect) | error
  const [status, setStatus] = useState(token ? "verifying" : "check-email");
  const [error, setError] = useState("");
  const [resendEmail, setResendEmail] = useState(emailFromState);
  const [resendMessage, setResendMessage] = useState("");

  useEffect(() => {
    if (!token) return;

    let cancelled = false;
    (async () => {
      try {
        const { ok, data } = await verifyEmail(token);
        if (cancelled) return;

        if (ok) {
          // Backend set the session cookies — user is signed in. Seed the
          // legacy client cookies the UI reads and enter the app.
          const userInfo = establishSession(data.user, data.accessToken);
          dispatch({ type: USER_CHANGE_SUCCESS, payload: userInfo.role[0] });
          dispatch({ type: USER_LOGIN_SUCCESS, payload: userInfo });
          history.replace("/");
        } else {
          setStatus("error");
          setError(data?.message || "Verification link is invalid or expired.");
        }
      } catch (err) {
        if (!cancelled) {
          setStatus("error");
          setError("Unable to reach the verification service. Please try again.");
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [token, dispatch, history]);

  const handleResend = async (e) => {
    e.preventDefault();
    if (!resendEmail) {
      setError("Enter your email address so we can send a new link.");
      return;
    }
    try {
      const { ok, data } = await resendVerification(resendEmail);
      if (!ok) {
        setError(data?.message || "Could not send the email. Please try again.");
        return;
      }
      setStatus("check-email");
      setError("");
      setResendMessage(
        data?.message || "Verification email sent. Check your inbox."
      );
    } catch (err) {
      setResendMessage("Could not send the email. Please try again.");
    }
  };

  return (
    <div className="loginSection">
      <div className="login">
        <Link className="brand" to="/">
          <Image src={Logo} />
        </Link>
        <div className="loginFields">
          {status === "verifying" && (
            <>
              <span className="h3 justify-content-center">
                Verifying your email…
              </span>
              <span className="h5 justify-content-center text-center">
                One moment — signing you in.
              </span>
            </>
          )}

          {status === "check-email" && (
            <>
              <span className="h3 justify-content-center">
                Check your email
              </span>
              <span className="h5 justify-content-center text-center email">
                {/* Inner span keeps this as one flowing sentence — the .h5 rule
                    is display:flex, so bare text + <b> would split into
                    side-by-side flex items. */}
                <span>
                  {resendEmail ? (
                    <>
                      We sent a verification link to <b>{resendEmail}</b>.
                    </>
                  ) : (
                    "Enter your email to send a new verification link."
                  )}
                </span>
              </span>
              <span className="text justify-content-center text-center">
                The verification link expires in 24 hours.
              </span>
              {resendMessage && (
                <p className="text-primary-color text-center">{resendMessage}</p>
              )}
              {error && <p className="text-error text-center">{error}</p>}
              <form onSubmit={handleResend}>
                <div className="form-group">
                  <label>Email Address</label>
                  <input
                    className="form-control"
                    type="email"
                    placeholder="Enter your email"
                    value={resendEmail}
                    onChange={(e) => {
                      setResendEmail(e.target.value);
                      setError("");
                    }}
                    required
                  />
                </div>
                <button type="submit" className="btn btnPrimary">
                  Resend email
                </button>
              </form>
              <span className="text justify-content-center text-center mt-4">
                <Link
                  to="/login"
                  className="text-primary-color heading-6 fw-bold"
                >
                  Back to sign in
                </Link>
              </span>
            </>
          )}

          {status === "error" && (
            <>
              <span className="h3 justify-content-center">
                Verification failed
              </span>
              <span className="h5 justify-content-center text-center">
                {error}
              </span>
              <form onSubmit={handleResend}>
                <div className="form-group">
                  <label>Resend the link to your email</label>
                  <input
                    className="form-control"
                    type="email"
                    placeholder="Enter your email"
                    value={resendEmail}
                    onChange={(e) => setResendEmail(e.target.value)}
                    required
                  />
                </div>
                <button type="submit" className="btn btnPrimary">
                  Resend verification email
                </button>
              </form>
              <span className="text justify-content-center text-center mt-4">
	                <Link
	                  to="/login"
	                  className="text-primary-color heading-6 fw-bold"
	                >
                  Back to sign in
                </Link>
              </span>
            </>
          )}

        </div>
      </div>
      <Footer />
    </div>
  );
};

export default VerifyEmail;
