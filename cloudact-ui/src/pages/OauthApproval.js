import axios from "../utils/axios";
import React, { useEffect, useState } from "react";
import { useHistory, useLocation } from "react-router";
import { getRegionOfUser, getUserId, getUserSID } from "../utils/helpers";
import Cookies from "js-cookie";
import { AUTH_ROUTES } from "../routes/Routes.types";
import Loader from "../components/Loader";

const OauthApproval = ({ changeClioConnected, changeQBOConnected }) => {
  const location = useLocation();
  const history = useHistory();
  const [loader, setLoader] = useState(false);

  // useEffect(() => {
  //   const extractCode = () => {
  //     return new URLSearchParams(location.search);
  //   };

  //   const code = extractCode().get("code");
  //   const stateCode = extractCode().get("state");
  //   const realmId = extractCode().get("realmId");
  //   // const url = extractCode().get("url");

  //   console.log("code", code);
  //   console.log("state", stateCode);
  //   console.log("realmId", realmId);
  //   console.log("url full", window.location.href);

  //   axios
  //     .post("/approval", {
  //       service: realmId ? "intuit" : "clio",
  //       uid: getUserId(),
  //       sid: getUserSID(),
  //       code: code,
  //       state: stateCode,
  //       region: realmId || !getRegionOfUser() ? 'us' : getRegionOfUser(),
  //       realmId: realmId ? realmId : "",
  //       url: realmId ? `${window.location.href}` : "",
  //     })
  //     .then((res) => {
  //       console.log("res", res);
  //       if (res.data.data.code === 200) {
  //         realmId
  //           ? changeQBOConnected(res.data.data.body.authIntuit)
  //           : changeClioConnected(res.data.data.body.authClio);

  //         realmId ? Cookies.set("authIntuit", res.data.data.body.authIntuit) : Cookies.set("authClio", res.data.data.body.authClio);
  //         //change to setupwizard as development has new component named setup wizard and production only has setup in it.
  //         realmId
  //           ? history.push("/setupwizard?step=3&connected=true")
  //           : history.push("/setupwizard?step=2&connected=true");
  //       } else {
  //         realmId ? changeQBOConnected(false) : changeClioConnected(false);

  //         realmId
  //           ? history.push("/setupwizard?step=3&connected=false")
  //           : history.push("/setupwizard?step=2&connected=false");

  //         realmId ? Cookies.set("authIntuit", res.data.data.body.authIntuit) : Cookies.set("authClio", res.data.data.body.authClio);

  //         throw res.data.data.status;
  //       }
  //     })
  //     .catch((err) => {
  //       console.log("err", err);
  //     });

  //   // if (realmId === null && code && stateCode) {
  //   //   changeClioConnected(true);
  //   // } else if (realmId && code && stateCode) {
  //   //   changeQBOConnected(true);
  //   //   history.push("/setup?step=3&completed=true");
  //   // }
  // }, []);

  useEffect(() => {
    setLoader(true);
    const extractCode = () => {
      return new URLSearchParams(location.search);
    };

    const code = extractCode().get("code");
    const stateCode = extractCode().get("state");
    const realmId = extractCode().get("realmId");
    // const url = extractCode().get("url");

    axios
      .post("/approval", {
        service: realmId ? "intuit" : "clio",
        uid: getUserId(),
        sid: getUserSID(),
        code: code,
        state: stateCode,
        region: realmId || !getRegionOfUser() ? "us" : getRegionOfUser(),
        realmId: realmId ? realmId : "",
        url: realmId ? `${window.location.href}` : "",
      })
      .then((res) => {
        console.log("res", res);
        if (res.data.data.code === 200) {
          realmId
            ? changeQBOConnected(res.data.data.body.authIntuit)
            : changeClioConnected(res.data.data.body.authClio);

          realmId
            ? Cookies.set("authIntuit", res.data.data.body.authIntuit)
            : Cookies.set("authClio", res.data.data.body.authClio);

          if (realmId) {
            if (Cookies.get("DiagnoseConnection")) {
              history.push(AUTH_ROUTES.DASHBOARD);
            } else {
              history.push("/setupwizard?step=4&connected=true");
            }
          } else {
            history.push("/setupwizard?step=3&connected=true");
          }
        } else {
          realmId ? changeQBOConnected(false) : changeClioConnected(false);

          realmId
            ? history.push("/setupwizard?step=4&connected=false")
            : history.push("/setupwizard?step=3&connected=false");

          realmId
            ? Cookies.set("authIntuit", res.data.data.body.authIntuit)
            : Cookies.set("authClio", res.data.data.body.authClio);

          throw res.data.data.status;
        }
      })
      .catch((err) => {
        console.log("err", err);
      })
      .finally((result) => {
        setLoader(false);
      });
  }, []);

  return (
    <div>
      {" "}
      <Loader isLoading={loader} loadingMsg="Please wait..." />{" "}
    </div>
  );
};

export default OauthApproval;
