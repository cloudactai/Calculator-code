import { Image, Container, Row, Col } from "react-bootstrap";
import { Link, useLocation, useHistory } from "react-router-dom";
import Footer from "../../components/Footer";
import CheckYourEmailImage from "../../assets/images/Check your email.svg";
import axios from "../../utils/axios";
import Logo from "../../assets/images/CloudAct-Accounting-Taxation-logo-1 3.png";

const ResetPassNotification = () => {
  const location = useLocation();
  const history = useHistory();

  const handleResend = () => {
    const email =
      location.search && location.search.split("?")[1].split("=")[1];

    if (email) {
      axios
        .post("password/recovery", {
          email: email,
        })
        .catch((err) => {
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
            We sent a password reset link to <br />{" "}
            {location.search && location.search.split("?")[1].split("=")[1]}
          </span>
          {/* <Link to="#" className="btn btnPrimary">Open email app</Link> */}
          <span className="text justify-content-center text-center">
            Don't receive the email. &nbsp;
            <a
              className="text-primary-color heading-6 fw-bold"
              onClick={handleResend}
            >
              Click to resend
            </a>
          </span>
          <span className="text justify-content-center text-center mt-5">
            <Link to="/signin" className="text-primary-color heading-6 fw-bold">
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
