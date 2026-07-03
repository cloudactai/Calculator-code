import React from "react";
import { useSelector } from "react-redux";
import { useHistory } from "react-router";
import Dashboard from "../pages/Dashboard";
import Logout from "../pages/Logout";
import { AUTH_ROUTES } from "../routes/Routes.types";
import { Store } from "../store/store";
import { getCurrentUserFromCookies } from "../utils/helpers";

export const AuthUser: React.FC<{
  children: JSX.Element,
  usersAuth: string[],
  sidAccess: boolean,
}> = ({ children, usersAuth, sidAccess }) => {
  const { userInfo } = useSelector((state: Store) => state.userLogin);
  const history = useHistory();

  if (!userInfo) {
    // Not signed in: clear any stale session state and land on sign-in.
    return <Logout />;
  } else if (
    usersAuth.includes(getCurrentUserFromCookies().role) &&
    sidAccess
  ) {
    return children;
  } else if (sidAccess === undefined) {
    return children;
  } else if (
    !usersAuth.includes(getCurrentUserFromCookies().role) ||
    !sidAccess
  ) {
    history.push(AUTH_ROUTES.HOME);
    return (
      <Dashboard
        userInfo={userInfo}
        currentUserRole={getCurrentUserFromCookies().role}
      />
    );
  }
};
