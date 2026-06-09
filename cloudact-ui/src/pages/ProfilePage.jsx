import React from "react";
import { Container } from "react-bootstrap";
import { useDispatch, useSelector } from "react-redux";
import Layout from "../components/LayoutComponents/Layout";
import ProfilePic from "../assets/images/profile_pic.jpeg";
import { getAllUserInfo } from "../utils/helpers";
import { Link } from "react-router-dom";

const ProfilePage = () => {
  return (
    <Layout title="My Profile">
      <Container style={{ textAlign: "center" }}>
        <section
          style={{ height: "80vh" }}
          className="d-flex flex-column align-items-center justify-content-center"
        >
          <img
            style={{ width: "30rem", height: "30rem" }}
            src={ProfilePic}
            alt="Unknown Person"
          />

          <div className="profile_info my-5">
            <div className="heading-4">{getAllUserInfo().username}</div>
            <div className="heading-6">{getAllUserInfo().province}</div>
            <Link to="/profile/edit">
              <button className="btn_primary_empty py-4 my-3 px-5">
                Edit Profile
              </button>
            </Link>
          </div>
        </section>
      </Container>
    </Layout>
  );
};

export default ProfilePage;
