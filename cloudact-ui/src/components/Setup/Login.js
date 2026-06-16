import React, { useState, useEffect } from "react";
import LoginSteps from "./LoginSteps";
import LoginForm from "./LoginForm";
import { useLocation } from "react-router";
import { clioConnectedOrNot, intuitConnectedOrNot } from "../../utils/helpers";

const Login = ({
  changeClioConnected,
  changeQBOConnected,
  isClioConnected,
  isQBOConnected,
}) => {
  const [activeFormNumber, setActiveFormNumber] = useState(1);
  const location = useLocation();
  const [completedFormOrNot, setCompletedFormOrNot] = useState(false);

  const changeLoginStep = (number) => {
    setActiveFormNumber(number);
  };

  const changeCompletedFormOrNot = (bool) => {
    setCompletedFormOrNot(bool);
  };

  useEffect(() => {
    if (location.search.includes("?step")) {
      const activeStep = new URLSearchParams(location.search).get("step");
      const completedStepOrNot = new URLSearchParams(location.search).get(
        "completed"
      );

      setActiveFormNumber(parseInt(activeStep));

      if (completedStepOrNot) {
        completedStepOrNot.toLowerCase() === "true"
          ? changeCompletedFormOrNot(true)
          : changeCompletedFormOrNot(false);
      }
    }

    changeClioConnected(clioConnectedOrNot());
    changeQBOConnected(intuitConnectedOrNot());
  }, []);

  return (
    <>
    <span className="heading">Set up your account</span>
      <LoginSteps activeFormNumber={activeFormNumber} isClioConnected={isClioConnected} isQBOConnected={isQBOConnected}></LoginSteps>
      <LoginForm
        completedFormOrNot={completedFormOrNot}
        activeFormNumber={activeFormNumber}
        isClioConnected={isClioConnected}
        changeLoginStep={changeLoginStep}
        changeClioConnected={changeClioConnected}
        changeQBOConnected={changeQBOConnected}
        changeCompletedFormOrNot={changeCompletedFormOrNot}
        isQBOConnected={isQBOConnected}
      ></LoginForm>
    </>
  );
};

export default Login;
