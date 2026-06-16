import WorkflowLogo from "../../assets/images/workflow.svg";
import WorkflowDescriptionIcon from "../../assets/images/tabler-icon-writing-sign.svg";
import WorkflowAssigneeIcon from "../../assets/images/tabler-icon-users-plus.svg";
import WorkflowDueDateIcon from "../../assets/images/calendar.svg";
import WorkflowTypeIcon from "../../assets/images/tabler-icon-checkbox.svg";
import WorkflowStep1Icon from "../../assets/images/Workflow-icons/step1-icon.svg";
import WorkflowStep2Icon from "../../assets/images/Workflow-icons/step2-icon.svg";
import WorkflowStep3Icon from "../../assets/images/Workflow-icons/step3-icon.svg";
import WorkflowStep4Icon from "../../assets/images/Workflow-icons/step4-icon.svg";
import WorkflowStep5Icon from "../../assets/images/Workflow-icons/step5-icon.svg";
import WorkflowStep6Icon from "../../assets/images/Workflow-icons/step6-icon.svg";
import WorkflowStep7Icon from "../../assets/images/Workflow-icons/step7-icon.svg";
import WorkflowStep8Icon from "../../assets/images/Workflow-icons/step8-icon.svg";
import WorkflowStep9Icon from "../../assets/images/Workflow-icons/step9-icon.svg";
import WorkflowStep1CheckedIcon from "../../assets/images/Workflow-icons/step-done-icon.svg";
import WorkflowNewStepIcon from "../../assets/images/Workflow-icons/workflow-newstep.svg";

const GetAddWorkflowTitleIcon = () => {
  return <img src={WorkflowLogo} alt="Workflow Icon" width="40" height="40" />;
};
const GetWorkflowNameDescriptionIcon = () => {
  return (
    <img
      src={WorkflowDescriptionIcon}
      alt="Workflow Icon"
      width="36"
      height="36"
    />
  );
};
const GetWorkflowAssignerIcon = () => {
  return (
    <img
      src={WorkflowAssigneeIcon}
      alt="Workflow Icon"
      width="36"
      height="36"
    />
  );
};
const GetWorkflowDateIcon = () => {
  return (
    <img src={WorkflowDueDateIcon} alt="Workflow Icon" width="36" height="36" />
  );
};
const GetWorkflowTypeIcon = () => {
  return (
    <img src={WorkflowTypeIcon} alt="Workflow Icon" width="36" height="36" />
  );
};

const getStepIcon = (stepNumber) => {
  console.log({ stepNumberIm: stepNumber });
  switch (stepNumber) {
    case "1":
      return WorkflowStep1Icon;
    case "2":
      return WorkflowStep2Icon;
    case "3":
      return WorkflowStep3Icon;
    case "4":
      return WorkflowStep4Icon;
    case "5":
      return WorkflowStep5Icon;
    case "6":
      return WorkflowStep6Icon;
    case "7":
      return WorkflowStep7Icon;
    case "8":
      return WorkflowStep8Icon;
    case "9":
      return WorkflowStep9Icon;
    default:
      return WorkflowStep1Icon;
  }
};
const GetStepIcon = ({ stepNumber, checked }) => {
  return (
    <img
      src={checked ? WorkflowStep1CheckedIcon : getStepIcon(stepNumber)}
      alt="Workflow Icon"
      width="36"
      height="36"
    />
  );
};

const GetNewStepIcon = () => {
  return (
    <img src={WorkflowNewStepIcon} alt="Workflow Icon" width="36" height="36" />
  );
};

export const getSvg = (svgicon) => {
  switch (svgicon) {
    case "Write task name":
      return <GetWorkflowNameDescriptionIcon />;
    case "Assign preparer and approver":
      return <GetWorkflowAssignerIcon />;
    case "Choose Due Date":
      return <GetWorkflowDateIcon />;
    case "Choose Type":
      return <GetWorkflowTypeIcon />;
    case "Add Workflow Icon":
      return <GetAddWorkflowTitleIcon />;

    default:
      return "";
  }
};

export const getIcon = (stepName, isChecked) => {
  switch (stepName) {
    case "Write task name":
      return <GetWorkflowNameDescriptionIcon />;
    case "Assign preparer and approver":
      return <GetWorkflowAssignerIcon />;
    case "Choose Due Date":
      return <GetWorkflowDateIcon />;
    case "Choose Type":
      return <GetWorkflowTypeIcon />;
    case "Add Workflow Icon":
      return <GetAddWorkflowTitleIcon />;
    case "New step Icon":
      return <GetNewStepIcon />;

    default:
      return <GetStepIcon stepNumber={stepName} checked={isChecked} />;
  }
};
