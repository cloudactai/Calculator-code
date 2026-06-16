import axios from "../utils/axios";
import React, { useEffect } from "react";
import { useLocation, useHistory } from "react-router-dom";

const Confirmation = ({ changeLinkConfirmed }) => {
  const location = useLocation().search;
  const history = useHistory();
  console.log("url", location);

  useEffect(() => {
    const code = location.substring(1);

    console.log("code", code);

    axios
      .get(`/account/activation?code=${code}`)
      .then((res) => {
        console.log("res", res);
        if (res.data.data.code === 200) {
          changeLinkConfirmed(true);
          history.push("/signIn");
        } else {
          throw res.data.data.body;
        }
      })
      .catch((err) => {
        console.log("err", err);
        history.push("/createAccount");
      });
  }, [location, history, changeLinkConfirmed]);

  return <div>Confirmation Works</div>;
};

export default Confirmation;
