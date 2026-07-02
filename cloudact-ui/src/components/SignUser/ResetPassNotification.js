import { Image } from "react-bootstrap";
import { Link, useLocation } from "react-router-dom";
import Footer from "../../components/Footer";
import CheckYourEmailImage from "../../assets/images/Check your email.svg";
import { forgotPassword } from "../../utils/Apis/auth/authApi";
import Logo from "../../assets/images/CloudAct-Accounting-Taxation-logo-1 3.png";

const ResetPassNotification = () => {
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const email = location.state?.email || params.get("email") || "";
  const message =
    location.state?.message ||
    "If that email exists, a password reset link has been sent.";

  const handleResend = () => {
    if (email) {
      forgotPassword(email).catch((err) => {
        console.log("err", err);
      });
    }
  };

  return (
    <div className="loginSection">
      <div className="login">
        <Link className="brand" to="/">
          <Image src={Logo} />
        </Link>
        <div className="loginFields">
          <span className="h3 justify-content-center">Check your email</span>
          <span className="h5 justify-content-center text-center email">
            {/* Inner span keeps this as one flowing sentence — the .h5 rule is
                display:flex, so bare text + <b> would split into side-by-side
                flex items. */}
            <span>
              {email ? (
                <>
                  If that email exists, a password reset link has been sent to{" "}
                  <b>{email}</b>.
                </>
              ) : (
                message
              )}
            </span>
          </span>
          <span className="text justify-content-center text-center">
            Password reset links expire in 1 hour.
          </span>
          {/* <Link to="#" className="btn btnPrimary">Open email app</Link> */}
          {email && (
            <span className="text justify-content-center text-center">
              Don't receive the email. &nbsp;
              <button
                type="button"
                className="text-primary-color heading-6 fw-bold border-0 bg-transparent p-0"
                onClick={handleResend}
              >
                Click to resend
              </button>
            </span>
          )}
          <span className="text justify-content-center text-center mt-4">
            <Link
              to="/forgot-password"
              className="text-primary-color heading-6 fw-bold"
            >
              Try another email
            </Link>
          </span>
          <span className="text justify-content-center text-center mt-5">
            <Link to="/login" className="text-primary-color heading-6 fw-bold">
              <i className="fas fa-angle-left"></i> Back to log in
            </Link>
          </span>
        </div>
      </div>
      <div className="loginGraphic">
        <img src={CheckYourEmailImage} alt="email notification"></img>
      </div>
      <Footer />
    </div>
  );
};

export default ResetPassNotification;
