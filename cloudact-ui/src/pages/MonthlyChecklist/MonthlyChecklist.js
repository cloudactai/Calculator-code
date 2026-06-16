import moment from "moment";
import Cookies from "js-cookie";
import { lastDateOfTheMonth } from "../../utils/helpers";

export const stepsInfo = [
  {
    id: 1,
    name: "Trust Account - Overview",
  },
  {
    id: 2,
    name: "Trust Account - Detail",
  },
  {
    id: 3,
    name: "General Account - Overview",
  },
  {
    id: 4,
    name: "General Account - Detail",
  },
  {
    id: 5,
    name: "Credit Cards",
  },
  {
    id: 6,
    name: "Cash Transactions",
  },
  {
    id: 7,
    name: "Reports",
  },
  {
    id: 8,
    name: "Tax Filing",
  },
  {
    id: 9,
    name: "Sign Off",
  },
];

export const stepsInfoForm1 = [
  {
    id: 1,
    name: "Trust Account ",
  },
  {
    id: 2,
    name: "Trust Account - Overview",
  },
  {
    id: 3,
    name: "Trust Account - Account Detail",
  },
  {
    id: 4,
    name: "Other Details",
  },
  {
    id: 5,
    name: "Reports",
  },
];

export const stepsInfoForm2 = [
  {
    id: 1,
    name: "General Account - Overview",
  },
  {
    id: 2,
    name: "General Account - Detail",
  },
  {
    id: 3,
    name: "Reports",
  },
];

export const stepsInfoForm3 = [
  {
    id: 1,
    name: "Credit Cards",
  },
  // {
  //   id: 2,
  //   name: "Reports",
  // },
  {
    id: 2,
    name: "Sign Off",
  },
];

export const determineFilingDeadlinePST = (
  yearEnd: Date,
  reportPeriod: Date,
  frequency: "MONTHLY" | "YEARLY" | "QUARTERLY"
) => {
  //do not change this algorithm
  switch (frequency) {
    case "MONTHLY":
      return moment(reportPeriod).add(1, "month");

    case "QUARTERLY":
      let monthsToAdd =
        Math.ceil(
          (12 -
            (new Date(yearEnd).getMonth() +
              1 -
              (new Date(reportPeriod).getMonth() + 1))) /
            3
        ) *
          3 +
        1;

      let diff =
        new Date(reportPeriod).getMonth() +
        1 -
        (new Date(yearEnd).getMonth() + 1);

      if (diff <= 0) {
        monthsToAdd = ((12 + diff) / 3) * 3 + 1;
      } else {
        monthsToAdd = (diff / 3) * 3 + 1;
      }

      return moment(yearEnd).add(monthsToAdd, "months")._d;

    case "YEARLY":
      return moment(reportPeriod).add(12, "months");

    default:
      return moment(reportPeriod);
  }
};

export const determineMonthEnd = (fiscalStartMonth: string) => {
  return moment(fiscalStartMonth + new Date().getFullYear())
    .endOf("month")
    .toDate();
};

export const determineStartAndEndDatesOfATask = (
  monthlyChecklistMonth: string
): { startDate: string, endDate: string } => {
  const startMonthOfTask = (
    new Date(monthlyChecklistMonth).getMonth() + 1
  ).toString();
  const YearOfTheTask = new Date(monthlyChecklistMonth).getUTCFullYear();

  console.log("start month of task", startMonthOfTask);
  console.log("start Year of task", YearOfTheTask);

  const startDateOfTask = makeReadableDate(
    "01",
    startMonthOfTask,
    YearOfTheTask
  );
  console.log("start date of task", startDateOfTask);

  const endDateOfTask = makeReadableDate(
    lastDateOfTheMonth(new Date(monthlyChecklistMonth).getMonth() + 1),
    startMonthOfTask,
    YearOfTheTask
  );

  console.log("end date of task", endDateOfTask);

  return {
    startDate: startDateOfTask,
    endDate: endDateOfTask,
  };
};

export const isQuarterlyChecklist = (
  fiscalstartmonth: string,
  checklistMonth: string
) => {
  console.log("checklistMonth", checklistMonth.split(" ")[0]);
  console.log("fiscalStartmonth", fiscalstartmonth);
  const checklistMonthWithoutYear = checklistMonth.split(" ")[0];

  const allMonthsForQuaterly = [fiscalstartmonth];

  //financial end month is 31 Dec
  //financial Start month is 01 Jan
  //then quarter end month will be march, june, sept, dec

  //these quarterly months will be calculated based on financial start month or financial end month?
};

export const getMonthlyChecklistId = () => {
  const checklist = Cookies.get("checklistId")
    ? JSON.parse(Cookies.get("checklistId"))
    : null;
  if (checklist !== null) {
    return checklist.id;
  } else {
    return null;
  }
};

export const getMonthlyChecklistMonth = () => {
  const checklist = Cookies.get("checklistId")
    ? JSON.parse(Cookies.get("checklistId"))
    : null;

  if (checklist !== null) {
    return checklist.task_month;
  } else {
    return null;
  }
};
export const getMonthlyChecklistStatus = () => {
  const checklist = Cookies.get("checklistId")
    ? JSON.parse(Cookies.get("checklistId"))
    : null;

  if (checklist !== null) {
    return checklist.task_status;
  } else {
    return null;
  }
};

export const getMonthlyChecklistDetails = () => {
  const checklist = Cookies.get("checklistId")
    ? JSON.parse(Cookies.get("checklistId"))
    : null;
    

  if (checklist !== null) {
    return checklist;
  }
  return null;
};

export const makeReadableDate = (date: string, month: string, year: number) => {
  let addZeroToMonth = month;
  if (month.length === 1) {
    addZeroToMonth = (0 + month).toString();
  }

  return (year + "-" + addZeroToMonth + "-" + date).toString();
};
