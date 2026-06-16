const OnboardingSteps = ({
  activeStep,
  activeHeight,
  list,
  completedSteps,
  type,
  activeForm,
  setActiveStepFunc,
}) => {
  return (
    <>
      {list.map((e) => {
        return (
          <>
            <div
              className={`step ${
                activeStep === e.id
                  ? "active"
                  : completedSteps >= e.id
                  ? "done"
                  : ""
              }`}
            >
              {completedSteps >= e.id && (
                <a
                  onClick={(elem) => {
                    setActiveStepFunc(e.id);
                  }}
                >
                  {e.name} <i className="fas fa-angle-down"></i>
                </a>
              )}
              {completedSteps < e.id && (
                <a
                  className={`${activeStep >= e.id ? "heading-5" : ""} ${
                    activeStep === e.id ? "text-primary-color" : "heading-6"
                  }`}
                >
                  {e.name}{" "}
                  <i
                    className="fas fa-angle-down"
                    onClick={() => {
                      setActiveStepFunc(e.id);
                    }}
                  ></i>
                </a>
              )}
              {/* {e.id !== list.length && (
              <hr style={{width: activeStep === e.id ? "97%" : "0.5%",}}/>
            )} */}
            </div>
          </>
        );
      })}
    </>
  );
};

export default OnboardingSteps;
