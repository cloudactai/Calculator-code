import React, { useEffect } from "react";
import { useLocation, useHistory, useParams } from "react-router-dom";
import axios from "../utils/axios";

const CreateClientPage = () => {
  const location = useLocation().search;
  const history = useHistory();
  // console.log("useParams", useParams());
  const code = location.substring(1);

  //   const { code } = matchPath().params;

  useEffect(() => {
    axios
      .post("/verify/client/account", {
        account_creation_code: code,
      })
      .then((res) => {
        console.log("res in verify client account ", res);
        if (res.data.data.code === 200) {
          console.log("client creation", res.data.data.body);
          const { email, confirmationCode, id, sid, createrid } = res.data.data.body;
          history.push(`/activate/client/account`, {
            email: email,
            confirmationCode: confirmationCode,
            uid: id,
          });
        } else {
          throw res.data.data.message;
        }
      })
      .catch((err) => {
        console.log("err", err);
        alert("Could not Activate Client Account")
      });
  }, [location, history]);

  return <div>create client works</div>;
};

export default CreateClientPage;
