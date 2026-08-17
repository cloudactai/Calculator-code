import axios from "./axios";
import Cookies from "js-cookie";
import moment from "moment";
import { CompanyInfo } from "./helpers/helpers";
import { nanoid } from "nanoid";
import { REACT_APP_ENVIRONMENT } from "../config";
import { decrypt, encrypt,userRole,updatedecrypt } from "./Encrypted";
import CookiesParser from "./cookieParser/Cookies";
import toast from "react-hot-toast"
import { attachProfileMedia } from "./profileMedia";

const determineColor = (e) => {
  return e === "processed" ? "green" : e === "pending" ? "orange" : "red";
};

const checkUserLoggedIn = () => {
  return Cookies.get("token") ? true : false;
};

const getRefreshDate = () => {
  const { last_refreshed_at } = getAllUserInfo();
  return last_refreshed_at;
};

// const getAllUserInfo = () => {
//   let alluserInfo = CookiesParser.get("allUserInfo")
//   let alluserInfonext = CookiesParser.get("allUserInfo2")

//   let decryptAlluserInfo = decrypt(alluserInfo)
//   let decryptAlluserInfonext = decrypt(alluserInfonext)
  

//   let mergedObj ={};

//   if (decryptAlluserInfo) {
//     mergedObj = { ...decryptAlluserInfo }; 
//   }

//   if (decryptAlluserInfonext) {
//     mergedObj = {
//       ...mergedObj, 
//       ...decryptAlluserInfonext,
//       role: [
//         ...(mergedObj.role || []),
//         ...(decryptAlluserInfonext.role || []) 
//       ]
//     };
//   }


// return alluserInfo
//     ? mergedObj
//     : null;
// };

const getAllUserInfo = () => {
  const baseCookieName = "allUserInfo";
  let mergedObj = {}; 

  let i = 0; 

  while (true) {
    const cookieName = i === 0 ? baseCookieName : `${baseCookieName}${i + 1}`;
    let userInfo = CookiesParser.get(cookieName);

    if (!userInfo) break;

    let decryptedUserInfo = decrypt(userInfo);

    if (decryptedUserInfo) {
      mergedObj = {
        ...mergedObj,
        ...decryptedUserInfo,
        role: [
          ...(mergedObj.role || []), 
          ...(decryptedUserInfo.role || []), 
        ]
      };

      mergedObj.role = 
      Array.from(new Set(mergedObj.role.map(role => JSON.stringify(role)))).map(role => JSON.parse(role));
    }

    i++;
  }
  return Object.keys(mergedObj).length > 0 ? attachProfileMedia(mergedObj) : null; // Return mergedObj if it has keys, otherwise null
};






const getUserProfileInfo = () => {
  let userProfile = CookiesParser.get('userProfile')
  return userProfile
    ? attachProfileMedia(decrypt(userProfile))
    : null;
};

const getUserProvince = () => {
  let province = CookiesParser.get('province');
  return province;
};



const clioConnectedOrNot = () => {
  if (
    Cookies.get("authClio") === undefined ||
    Cookies.get("authClio") === null
  ) {
    return false;
  }
  return Cookies.get("authClio") !== undefined
    ? JSON.parse(Cookies.get("authClio"))
    : false;
};

const intuitConnectedOrNot = () => {
  if (
    Cookies.get("authIntuit") === undefined ||
    Cookies.get("authIntuit") === null
  ) {
    return false;
  }

  return Cookies.get("authIntuit") !== undefined
    ? JSON.parse(Cookies.get("authIntuit"))
    : false;
};

const getUpdatedatDate = () => {
  let userInfo = CookiesParser.get("allUserInfo")
  
  
  if (userInfo) {
    const { updated_at } = decrypt(userInfo);
    return updated_at;
  }
};

const getUserId = () => {
  let id;
  const cookieUser = CookiesParser.get("allUserInfo");

  if (cookieUser) {
    id = decrypt(cookieUser).id;
  }



  return id;
};

const getUserSID = () => {
  let getSide = CookiesParser.get("currentUserRole")
  if (!getSide) return undefined;
  const { sid } = decrypt(getSide) || {};
  return sid;
};

const determineStrengthPassword = (val) => {
  const mediumRegex =
    /((?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[^A-Za-z0-9])(?=.{6,}))|((?=.*[a-z])(?=.*[A-Z])(?=.*[^A-Za-z0-9])(?=.{8,}))/gi;

  const strongRegex =
    /(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[^A-Za-z0-9])(?=.{8,})/gi;

  if (val.match(strongRegex)) {
    return "Strong";
  } else if (val.match(mediumRegex)) {
    return "Medium";
  } else {
    return "Weak";
  }
};

const getUserRole = () => {
  let getRole = CookiesParser.get("allUserInfo")
  const { role } = userRole(getRole);
  return role;
};


const determineStep = (type) => {
 
  if ((type.includes("General A/C checklist"))) {
    return 2;
} else if (type.includes("Trust A/C checklist")) {
    return 1;
} else if (type.includes("Credit card checklist")) {
    return 3;
}


  
  else if (type === "FINANCIAL INSTITUTION AUTHORIZATION RELEASE FORM") {
    return 4;
  } else if (type === "TRUST ACCOUNT AND CLIENT LEDGER SHORTAGES") {
    return 6;
  } else if (type === "CLAIM TO TRUST MONEY") {
    return 5;
  } else if (type === "UNDISBURSABLE TRUST MONEY – LONG FORM") {
    return 7;
  } else if (type === "UNDISBURSABLE TRUST MONEY – SHORT FORM") {
    return 8;
  } else if (type === "BANK DRAFTS AND MONEY ORDERS") {
    return 9;
  } else if (type === "ELECTRONIC BANKING WITHDRAWAL") {
    return 10;
  } else if (type === "MATTER TO MATTER TRUST TRANSFERS") {
    return 11;
  } else if (type === "LETTER OF DIRECTION - BANK INTEREST ON TRUST  ACCOUNT") {
    return 12;
  } else if (type === "REPRESENTATIVE CAPACITY UNDERTAKING") {
    return 13;
  } else if (type === "FORM 9A - ELECTRONIC TRUST TRANSFER REQUISITION") {
    return 14;
  } else if (type === "FORM 9B - AUTHORIZATION OF WITHDRAWAL BY TERANET") {
    return 15;
  } else if (type === "FORM 9C - ELECTRONIC TRUST TRANSFER REQUISITION: CLOSING FUNDS") {
    return 16;
  } else if (type === "FORM 9D - INVESTMENT AUTHORITY") {
    return 17;
  } else if (type === "FORM 9E - REPORT ON THE INVESTMENT") {
    return 18;
  } else if (type === "ELECTRONIC TRANSFER OF TRUST FUNDS") {
    return 20;
  } else if (
    type === "CONFIRMATION OF LAW FOUNDATION OF BC INTEREST REMITTANCE"
  ) {
    return 19;
  } else if (type === "LETTER - NEW TRUST ACCOUNT") {
    return 21;
  } else if (type === "INSOLVENT LAWYER – SCHEDULE 3") {
    return 22;
  } else if (type === "PAYMENT OF UNCLAIMED TRUST MONEY TO THE LAW SOCIETY") {
    return 23;
  } else if (type === "WITHDRAWAL FROM TRUST BY BANK DRAFT") {
    return 24;
  }
};


const last12Months = () => {
  let monthName = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];
  const allMonths = [];
  let d = new Date();
  d.setDate(1);
  for (let i = 0; i <= 11; i++) {
    allMonths.push(monthName[d.getMonth()] + " " + d.getFullYear());
    d.setMonth(d.getMonth() - 1);
  }
  return allMonths;
};

const getMonthFromDigit = (monthInNumber) => {
  let monthName = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  return monthName[monthInNumber - 1];
};

const getDigitFromMonth = (monthInDigit) => {
  let monthName = {
    'January': 1,
    'February': 2,
    'March': 3,
    'April': 4,
    'May': 5,
    'June': 6,
    'July': 7,
    'August': 8,
    'September': 9,
    'October': 10,
    'November': 11,
    'December': 12,
  };

  return monthName[monthInDigit];

};

const getMonthFromDigitWithCurrentYear = (monthInNumber) => {
  let monthName = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  let currentDate = new Date();
  let currentYear = currentDate.getFullYear();

  return `${monthName[monthInNumber - 1]} ${currentYear}`;
};

console.log(getMonthFromDigit(new Date().getMonth() + 1));

const getFirmnameForSetup = () => {
  return getUserRole().filter((e) => {
    return e.role === "ADMIN";
  });
};

const handleClientChange = (e, list, type) => {
  const text = e.target.innerText;
  console.log("text", text);
  console.log("list", list);

  let curClient = [];
  if (type === "Matter Owner") {
    curClient = list.filter((e) => {
      return e.responsible_attorney_name === text;
    });
  } else if (type === "simple") {
    curClient = list.filter((e) => {
      return e === text;
    });
  } else {
    curClient = list.filter((e) => {
      return e.name === text;
    });
  }

  console.log("curclient", curClient);
  return curClient;
};

const updateCookiesInfo = (value) => {
  let prevData = CookiesParser.get("allUserInfo");
  prevData = decrypt(prevData)
  Object.keys(value).forEach(function (val, key) {
    prevData[val] = value[val];
  });
  CookiesParser.set("allUserInfo",prevData);
};

// const updateInfoInCurrentUser = (value) => {
//   let prevData = CookiesParser.get("currentUserRole");
//   prevData = updatedecrypt(prevData)
//   Object.keys(value).forEach(function (val, key) {
//     prevData[val] = value[val];
//   });
//   CookiesParser.set("currentUserRole", prevData);
// };
const updateInfoInCurrentUser = (value) => {
console.log('✌️valXXXXXXue --->', value);
  let prevData = CookiesParser.get("currentUserRole");
  prevData = decrypt(prevData);
  if (prevData) {
    Object.keys(value).forEach((val, key) => {
      prevData[val] = value[val];
    });
    CookiesParser.set("currentUserRole", prevData);
  }
};


const getCurrentUserFromCookies = () => {
  let currentUserRole =  CookiesParser.get("currentUserRole")
  return currentUserRole
    ? attachProfileMedia(decrypt(currentUserRole))
    : null;
};

// Date.prototype.addDays = function (days) {
//   var date = new Date(this.valueOf());
//   date.setDate(date.getDate() + days);
//   return date.toLocaleDateString();
// };

const addOneDayToDate = (e) => {
  const date = new Date(e);
  date.setDate(date.getDate() + 2);
  return date.toLocaleDateString("fr-CA");
};

const getToken = () => {
  let userInfo = CookiesParser.get("allUserInfo")
  if (userInfo) {
    const { token } = decrypt(userInfo);
    return token;
  }
  return null;
};

const extendTimeForCookies = () => {
  if (getAllUserInfo()) {
    CookiesParser.set("allUserInfo", getAllUserInfo(), { path: "/" });
    Cookies.set("authIntuit", JSON.stringify(getAllUserInfo().authIntuit), {
      path: "/",
    });
    Cookies.set("authClio", JSON.stringify(getAllUserInfo().authClio), {
      path: "/",
    });
    CookiesParser.set(
      "currentUserRole",
     getCurrentUserFromCookies(),
      { path: "/" }
    );
  }
};

const lastDateOfTheMonth = (monthNumber) => {
  var d = new Date(new Date().getUTCFullYear(), monthNumber, 0);

  let addZeroToMonth = d.getDate().toString();

  if (addZeroToMonth.length === 1) {
    addZeroToMonth = 0 + d.getDate().toString();
  }

  return addZeroToMonth;
};

const getRegionOfUser = () => {
  let  userInfo = CookiesParser.get("allUserInfo") ;
   userInfo = decrypt(userInfo)

  if (userInfo.region) {
    return userInfo.region;
  }
  return null;
};

const getShortFirmname = () => {
  console.log('retunrWhat', getCurrentUserFromCookies().short_firmname)
  return getCurrentUserFromCookies().short_firmname;
};

const isTaskSignedOffByPreparer = () => {
  const checklist = Cookies.get("checklistId")
    ? JSON.parse(Cookies.get("checklistId"))
    : null;

  if (checklist !== null) {
    return checklist.task_preparer_signoff;
  }
  return null;
};

const addUpNumbersFromArray = (arr) => {
  return arr.reduce((acc, curr) => {
    return acc + curr;
  }, 0);
};

const determineColorOfTask = (status) => {
  return status === "INPROGRESS"
    ? "text-primary-color"
    : status === "REJECTED"
    ? "text-danger"
    : "text-success";
};

const add6Months = (mon) => {
  let newDate = new Date(Date.parse(mon + " 1, " + 2021));

  newDate.setMonth(newDate.getMonth() + 6);
  newDate = new Date(newDate.getFullYear(), newDate.getMonth(), 0);

  return newDate.getDate() + "-" + moment(newDate).format("MMM");
};

const addMonthsToDate = (date, NumberOfMonthsToAdd) => {
  let newDate = new Date(Date.parse(date));

  newDate.setMonth(newDate.getMonth() + 1 + NumberOfMonthsToAdd);

  newDate = new Date(newDate.getFullYear(), newDate.getMonth(), 0);

  return newDate.getDate() + "-" + moment(newDate).format("MMM");
};

const getAccessPagesInfo = () => {
  let access_pages = CookiesParser.get("access_pages")
  return access_pages
    ? decrypt(access_pages)
    : null;
};

// const getAccessPagesInfo = () => {
//   return Cookies.get("access_pages")
//     ? JSON.parse(Cookies.get("access_pages"))
//     : null;
// };

const getCompanyInfo = (): CompanyInfo | null => {
  let companyInfo = CookiesParser.get("companyInfo");

  return companyInfo
    ? decrypt(companyInfo)
    : null;
};

const add1Month = (mon) => {
  let newDate = new Date(Date.parse(mon + " 1, " + new Date().getFullYear()));

  newDate.setMonth(newDate.getMonth() + 1);
  newDate = new Date(newDate.getFullYear(), newDate.getMonth(), 0);

  return newDate.getDate() + "-" + moment(newDate).format("MMM");
};

const checkIfAllValuesInArrAreSame = (arr) => {
  console.log("arr", arr);
  const allEqual = arr.every((val) => (val ? val === 1000 : true));
  console.log("all equal", allEqual);
  return allEqual;
};

const checkIfValueInArrayInSome = (arr, valueToCheck) => {
  const value = arr.some((e) => e === valueToCheck);
  console.log("value", value);

  return value;
};

const checkIfValueInArrayInEvery = (arr, valueToCheck) => {
  const value = arr.every((e) => e === valueToCheck);
  console.log("value", value);
  return value;
};

const isApiRequestSuccessfully = (code, status) => {
  return code === 200 && status === "success";
};

const assignValues = (doc, obj) => {
  for (const property in obj) {
    let elem = doc.querySelector(`#${property}`);
    if (elem.type === "radio") {
      doc.querySelector(`#${property}`).checked = obj[property];
    } else {
      doc.querySelector(`#${property}`).value = obj[property];
    }
  }
};

const saveValues = (doc, obj) => {
  const newObj = {};
  for (let property in obj) {
    let elem = doc.querySelector(`${obj[property]}`);
    if (elem.type === "radio") {
      newObj[property] = doc.querySelector(`${obj[property]}`).checked;
    } else {
      newObj[property] = `${doc.querySelector(`${obj[property]}`).value}`;
    }
  }
  return newObj;
};

const saveComplianceFormDetails = (obj, id) => {
  const posting = axios
    .post("/compliance", { formDetails: obj, task_id: id })
    .then((res) => {
      const {
        data: {
          data: { code, status },
        },
      } = res;

      if (isApiRequestSuccessfully(code, status)) {
        toast.error("Form Saved Successfully");
        window.location.href = "/compliance-forms";
      }
    })
    .catch((err) => {
      console.log("err", err);
      toast.error("Error saving Form");
    });

  console.log("posting ", posting);
};

const fetchFormDetails = async (
  id
): { formDetails: any, isFormFilled: boolean } => {
  try {
    const {
      data: {
        data: { body, status, code },
      },
    } = await axios.get("/compliance/" + id);

    if (isApiRequestSuccessfully(code, status)) {
      let isFormFilled = true;

      if (body.length > 0) {
        const formDetails = JSON.parse(body[0].formDetails);
        return { formDetails, isFormFilled };
      } else {
        isFormFilled = false;
        return { undefined, isFormFilled };
      }
    }
  } catch (err) {
    console.log("err", err);
  }
};

const fetchLawyerResponsible = async (sid, matterDisplayNumber) => {
  try {
    const {
      data: {
        data: { body, status, code },
      },
    } = await axios.get("/clientMatter/" + sid + "/" + matterDisplayNumber);

    if (isApiRequestSuccessfully(code, status) && body.length > 0) {
      return body[0];
    }
  } catch (err) {
    console.log("err", err);
    toast.error("Lawyer Info not available");
  }
};

const getBodyStatusCode = (obj) => {
  // console.log("obj", obj);
  try {
    const {
      data: {
        data: { body, status, code },
      },
    } = obj;
    return { body, status, code };
  } catch (err) {
    console.log("err", err);
    const {
      data: { message, status, code },
    } = obj;
    return { message, status, code };
  }
};

const nameOfChecklist = (e) => {
  if (e === "TRUST ACCOUNT") {
    return "Trust A/C Review checklist";
  } else if (e === "GENERAL ACCOUNT") {
    return "General A/C Review checklist";
  } else if (e === "CREDIT CARD" || e === "CREDIT CARD MONTHLY") {
    return "Credit Card Review checklist";
  }
  else if (e === "FINANCIAL INSTITUTION AUTHORIZATION RELEASE FORM") {
    return "Financial institution authorization release form";
} else if (e === "TRUST ACCOUNT AND CLIENT LEDGER SHORTAGES") {
    return "Trust account and client ledger shortages";
} else if (e === "CLAIM TO TRUST MONEY") {
    return "Claim to trust money";
} else if (e === "UNDISBURSABLE TRUST MONEY – LONG FORM") {
    return "Undisbursable trust money – long form";
} else if (e === "UNDISBURSABLE TRUST MONEY – SHORT FORM") {
    return "Undisbursable trust money – short form";
} else if (e === "BANK DRAFTS AND MONEY ORDERS") {
    return "Bank drafts and money orders";
} else if (e === "ELECTRONIC BANKING WITHDRAWAL") {
    return "Electronic banking withdrawal";
} else if (e === "MATTER TO MATTER TRUST TRANSFERS") {
    return "Matter to Matter trust transfers ";
    
} else if (e === "LETTER OF DIRECTION - BANK INTEREST ON TRUST  ACCOUNT") {
    return "Letter of direction - bank interest on trust  account";
} else if (e === "REPRESENTATIVE CAPACITY UNDERTAKING") {
    return "Representative capacity undertaking";
} else if (e === "FORM 9A - ELECTRONIC TRUST TRANSFER REQUISITION") {
    return "Form 9A - Electronic trust transfer requisition";
} else if (e === "FORM 9B - AUTHORIZATION OF WITHDRAWAL BY TERANET") {
    return "Form 9B - Authorization of withdrawal by teranet";
} else if (e === "FORM 9C - ELECTRONIC TRUST TRANSFER REQUISITION: CLOSING FUNDS") {
    return "Form 9C - Electronic trust transfer requisition: closing funds";
} else if (e === "FORM 9D - INVESTMENT AUTHORITY") {
    return "Form 9D - Investment authority";
} else if (e === "FORM 9E - REPORT ON THE INVESTMENT") {
    return "Form 9E - Report on the investment";
} else if (e === "ELECTRONIC TRANSFER OF TRUST FUNDS") {
    return "Electronic transfer of trust funds";
} else if (e === "CONFIRMATION OF LAW FOUNDATION OF BC INTEREST REMITTANCE") {
    return "Confirmation of Law Foundation of BC interest remittance";
} else if (e === "LETTER - NEW TRUST ACCOUNT") {
    return "Letter - new trust account";
} else if (e === "INSOLVENT LAWYER – SCHEDULE 3") {
    return "Insolvent lawyer – schedule 3";
} else if (e === "PAYMENT OF UNCLAIMED TRUST MONEY TO THE LAW SOCIETY") {
    return "Payment of unclaimed trust money to the law society";
} else if (e === "WITHDRAWAL FROM TRUST BY BANK DRAFT") {
    return "Withdrawal from trust by bank draft";
}



  return e;
};

const replaceLastThreeChars = (number: string, replaceWith: string = "000") => {
  const allNumbersExceptLastThree = number.substring(0, number.length - 3);
  return parseInt(allNumbersExceptLastThree + replaceWith);
};

const greaterAmount = (val1, val2) => {
  if (val1 > val2) {
    return val1;
  } else {
    return val2;
  }
};

const generateRandomDigits = () => {
  const nanoID = nanoid();
  return nanoID;
};

const render0IfValueIsNegative = (val) => {
  if (val <= 0 || isNaN(val)) {
    return 0;
  }
  return val;
};

const addAllNumbersInArr = (arr) => {
  return arr.reduce((arr, curr) => arr + Number(curr), 0);
};

const isENVPROD = () => REACT_APP_ENVIRONMENT === "PROD";

const dateDiff = (startingDate, endingDate) => {
  let startDate = new Date(new Date(startingDate).toISOString().substr(0, 10));
  if (!endingDate) {
    endingDate = new Date().toISOString().substr(0, 10); // need date in YYYY-MM-DD format
  }
  let endDate = new Date(endingDate);
  if (startDate > endDate) {
    const swap = startDate;
    startDate = endDate;
    endDate = swap;
  }
  const startYear = startDate.getFullYear();
  const february =
    (startYear % 4 === 0 && startYear % 100 !== 0) || startYear % 400 === 0
      ? 29
      : 28;
  const daysInMonth = [31, february, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

  let yearDiff = endDate.getFullYear() - startYear;
  let monthDiff = endDate.getMonth() - startDate.getMonth();
  if (monthDiff < 0) {
    yearDiff--;
    monthDiff += 12;
  }
  let dayDiff = endDate.getDate() - startDate.getDate();
  if (dayDiff < 0) {
    if (monthDiff > 0) {
      monthDiff--;
    } else {
      yearDiff--;
      monthDiff = 11;
    }
    dayDiff += daysInMonth[startDate.getMonth()];
  }

  return {
    year: yearDiff,
    month: monthDiff,
    day: dayDiff,
  };
};

const getProviveFromSuffice = (suffice) => {
  switch (suffice.toUpperCase()) {
    case "ON":
      return "Ontario";
    case "BC":
      return "British Columbia";
    case "AB":
      return "Alberta";
    case "SK":
      return "Saskatchewan";
    case "MB":
      return "Manitoba";
    default:
      return "Ontario";
  }
};

function getMonthsBetweenDates(startDate, endDate) {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const months = [];

  while (start <= end) {
    const year = start.getFullYear();
    const month = start.toLocaleString("default", {
      month: "long",
    });
    const formattedDate = `${month} ${year}`;

    months.push(formattedDate);

    // Move to the next month
    start.setMonth(start.getMonth() + 1);
  }

  // Check if the last month is not already included
  const lastMonthYear = end.toLocaleString("default", {
    month: "long",
    year: "numeric",
  });
  const lastMonthFormatted = months[months.length - 1];

  if (lastMonthFormatted !== lastMonthYear) {
    months.push(lastMonthYear);
  }

  return months;
}

function getLastMonthDates() {
  const today = new Date();
  const lastMonth = new Date(today);

  // Set the date to the first day of the current month
  lastMonth.setDate(1);
  // Subtract one day to get the last day of the last month
  lastMonth.setDate(0);
  const firstDayOfLastMonth = new Date(lastMonth);

  firstDayOfLastMonth.setDate(1);
  // Format the dates as YYYY-MM-DD strings
  const firstDate = formatDate(firstDayOfLastMonth);
  const lastDate = formatDate(lastMonth);

  return {
    firstDate,
    lastDate,
  };
}

function getColorFromPercentage(percentage , compliance) {
  if(compliance){
    percentage = percentage.replace('%',' ')

  }

  
  if (percentage < 50) {
    return "#fb554a";
  } else if (percentage >= 50 && percentage < 90) {
    return "#AAE07F";
  } else {
    return "#73C3FD";
  }
}

function formatDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function capitalizeFirstLetter(text) {
  // return text;

  return text.toLowerCase().replace(/\b\w/g, (char) => char.toUpperCase());
}

function totalInArray(arr) {
  const sum = arr.reduce((accumuator, currentValue) => {
    if (typeof currentValue === "number") {
      return accumuator + currentValue;
    }
    return accumuator;
  });

  return sum;
}

function getEndOfDay(date) {
  // Set the time to 23:59:59
  date.setHours(23);
  date.setMinutes(59);
  date.setSeconds(59);
  date.setMilliseconds(0); 
  console.log('dateinEnd Fun',date)

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');

  return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}.000Z`;
  

}


// const getRenderRequisitionwithdate = () => {
//   const date = new Date();

//   const day = String(date.getDate()).padStart(2, '0'); 
//   const month = String(date.getMonth() + 1).padStart(2, '0'); 

//   return `${day} ${month}`;
// }

const getRenderRequisitionwithdate = () => {
  const date = new Date();

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0'); // Month is zero-based
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}/${month}/${day}`;
}


const generateUniqueIdentifier = () => {
  const datePart = getRenderRequisitionwithdate();
  // const randomPart = String(Math.floor(Math.random() * 900) + 100); // Generate a random 3-digit number
  return `${datePart}-`;
}




function getCurrentDate() {
  const today = new Date();
  const day = String(today.getDate()).padStart(2, '0');
  const month = String(today.getMonth() + 1).padStart(2, '0'); // January is 0!
  const year = today.getFullYear();

  return `${month}/${day}/${year}`;
}
function getCurrentDateformatDMY() {
  const today = new Date();
  const day = String(today.getDate()).padStart(2, '0');
  const month = String(today.getMonth() + 1).padStart(2, '0'); // January is 0!
  const year = today.getFullYear();

  return `${day}-${month}-${year}`;
}



const layoutTitles = {
  4: 'Financial Institution Authorization Release',
  5:'Claim to Trust Money',
  6: 'Trust Account and Client Ledger Shortages',
  7: 'Undisbursable Trust Money – Long Form',
  8: 'Undisbursable Trust Money – Short Form',
  9: 'Bank Drafts and Money Orders',
  10: 'Electronic Banking Withdrawal',
  11: 'Matter to Matter Trust transfers',
  12: 'Letter of Direction to Financial Institution re: Interest on Pooled Trust Account',
  13: 'Representative Capacity Undertaking',
  14: 'Form 9A - Electronic Trust Transfer Requisition',
  15: 'Form 9B - Authorization of Withdrawal by Teranet',
  16: 'Form 9C - Electronic Trust Transfer Requisition: Closing Funds',
  17: 'Form 9D - Investment Authority',
  18: 'Form 9E - Report on the Investment',
  19: 'Confirmation of Law Foundation of BC Interest Remittance',
  20: 'Electronic Transfer of Trust Funds',
  21: 'Letter - New Trust Account',
  22: 'Insolvent Lawyer – Schedule 3',
  23: 'Payment of Unclaimed Trust Money to the Law Society',
  24: 'Withdrawal from Trust by Bank Draft',
 
};

const getLayoutTitle = (step) => {
  return layoutTitles[step] || 'Electronic Trust Transfer Requisition';
}




export {
  addAllNumbersInArr,
  generateRandomDigits,
  isENVPROD,
  replaceLastThreeChars,
  render0IfValueIsNegative,
  determineColorOfTask,
  saveValues,
  greaterAmount,
  fetchLawyerResponsible,
  nameOfChecklist,
  getBodyStatusCode,
  isApiRequestSuccessfully,
  saveComplianceFormDetails,
  fetchFormDetails,
  checkIfValueInArrayInEvery,
  checkIfValueInArrayInSome,
  checkUserLoggedIn,
  add1Month,
  getRegionOfUser,
  addOneDayToDate,
  getRefreshDate,
  assignValues,
  updateInfoInCurrentUser,
  addMonthsToDate,
  getUserSID,
  handleClientChange,
  updateCookiesInfo,
  extendTimeForCookies,
  getUpdatedatDate,
  clioConnectedOrNot,
  getToken,
  getCurrentUserFromCookies,
  intuitConnectedOrNot,
  getFirmnameForSetup,
  add6Months,
  getUserId,
  last12Months,
  determineStrengthPassword,
  determineStep,
  getUserRole,
  lastDateOfTheMonth,
  isTaskSignedOffByPreparer,
  getShortFirmname,
  addUpNumbersFromArray,
  getAllUserInfo,
  determineColor,
  checkIfAllValuesInArrAreSame,
  getCompanyInfo,
  getAccessPagesInfo,
  getUserProfileInfo,
  getMonthFromDigit,
  getMonthFromDigitWithCurrentYear,
  getDigitFromMonth,
  dateDiff,
  getProviveFromSuffice,
  getMonthsBetweenDates,
  getLastMonthDates,
  getColorFromPercentage,
  capitalizeFirstLetter,
  totalInArray,
  getEndOfDay,
  generateUniqueIdentifier,
  getCurrentDate,
  getLayoutTitle,
  getCurrentDateformatDMY,
  getUserProvince
};
