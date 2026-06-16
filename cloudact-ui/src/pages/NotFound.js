import React from "react";
import Footer from "../components/Footer";
import Page404 from "../assets/images/page404.png";
import Layout from "../components/LayoutComponents/Layout";
const NotFound = () => {
  return (
    <Layout title="Page Not Found">
      <div className="error_message_page">
        <div className="d-flex flex-column">
          <div className="heading-1">ERROR 404</div>
          <div className="heading-3">Oops. Page Not Found!</div>
          <div className="heading-5">
            The resource requested could not be found on this server!
          </div>
        </div>
        <div>
          <img src={Page404} alt="page404" />
        </div>
        <Footer />
      </div>
    </Layout >
  );
};

export default NotFound;
