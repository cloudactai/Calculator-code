import moment from "moment";

export const momentFunction = {
  formatDate: (date: Date | string | number, format = "MM/DD/YYYY") => {
    return moment(date).format(format);
  },
  differenceBetweenTwoDates: (
    date1: string | number,
    date2: string | number
  ) => {
    // console.log('difference two dates', {date1: , date2: , diff: moment.duration(moment(new Date(date2)).startOf('date').diff(moment(new Date(date1)).endOf('date')._d)).years()});
    const date1Moment = moment(new Date(date1))
      .subtract(1, "day")
      .endOf("date")._d;
    const date2Moment = moment(new Date(date2)).endOf("date")._d;

    console.log("dates", { date1Moment, date2Moment });

    return moment.duration(moment(date2Moment).diff(date1Moment)).years();
  },
  differenceBetweenNowAndThen: (date: string | number) => {
    return moment().diff(date, "years");
  },
  differenceBetweenNowAndJanuaryOfYear: (date: string | number) => {
    const months = moment([new Date().getFullYear(), 0, 31]).diff(
      date,
      "years"
    );
    // console.log("months", { months, currentYear: new Date().getFullYear() });
    return months;
  },
  getPreviousMonthFromString: (mon: string) => {
    let newDate = new Date(Date.parse(mon + " 28, " + 2021));
    newDate = new Date(newDate.getFullYear(), newDate.getMonth(), 0);
    return newDate.getDate() + "-" + moment(newDate).format("MMM");
  },
  add6Months: (mon: string) => {
    let newDate = new Date(Date.parse(mon + " 1, " + 2021));
    newDate.setMonth(newDate.getMonth() + 6);
    newDate = new Date(newDate.getFullYear(), newDate.getMonth(), 0);
    return newDate.getDate() + "-" + moment(newDate).format("MMM");
  },
  addMonthsToDate: (date: string, NumberOfMonthsToAdd: number) => {
    let newDate = new Date(Date.parse(date));

    newDate.setMonth(newDate.getMonth() + 1 + NumberOfMonthsToAdd);

    newDate = new Date(newDate.getFullYear(), newDate.getMonth(), 0);

    return newDate.getDate() + "-" + moment(newDate).format("MMM");
  },
  add1Month: (mon: string) => {
    let newDate = new Date(Date.parse(mon + " 1, " + new Date().getFullYear()));

    newDate.setMonth(newDate.getMonth() + 1);
    newDate = new Date(newDate.getFullYear(), newDate.getMonth(), 0);

    return newDate.getDate() + "-" + moment(newDate).format("MMM");
  },
  addMonths: (
    startingMonth: string,
    date: string = "1",
    monthToAdd: number,
    format: string = "MMMM"
  ) => {
    let newDate = new Date( Date.parse(startingMonth + ` ${date}, ` + new Date().getFullYear()));

    newDate.setMonth(newDate.getMonth() + monthToAdd);

    newDate = new Date(newDate.getFullYear(), newDate.getMonth(), 0);

    return moment(newDate).format(format);
  },
  calculateNumberOfYears: (val: number | string) => {
    return moment().diff(val, "years");
  },
  validateDate: (val: string) => {
    // First check for the pattern
    if (!/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(val)) return false;

    // Parse the date parts to integers
    var parts = val.split("/");
    var day = parseInt(parts[0], 10);
    var month = parseInt(parts[1], 10);
    var year = parseInt(parts[2], 10);

    // Check the ranges of month and year
    if (year < 1000 || year > 3000 || month === 0 || month > 12) return false;

    var monthLength = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

    // Adjust for leap years
    if (year % 400 === 0 || (year % 100 !== 0 && year % 4 === 0))
      monthLength[1] = 29;

    // Check the range of the day
    return day > 0 && day <= monthLength[month - 1];
  },

  getCurrentDate: (val: string) => {
  const today = new Date();
  const year = today.getFullYear();
  let month = today.getMonth() + 1;
  let day = today.getDate();

 
  if (month < 10) {
    month = '0' + month;
  }
  if (day < 10) {
    day = '0' + day;
  }

  return `${year}-${month}-${day}`;

},

getStartingDateofCurrentMonth: (val: string) => {
  const today = new Date();
const year = today.getFullYear();
let month = today.getMonth() + 1;
let day = 1;


if (month < 10) {
  month = '0' + month;
}
if (day < 10) {
  day = '0' + day;
}

return `${year}-${month}-${day}`;

},

getEndingDateofCurrentMonth: (val: string) => {
  const today = new Date();
  const year = today.getFullYear();
  let month = today.getMonth() + 1;
  let day = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate(); // Get the last day of the current month

  if (month < 10) {
      month = '0' + month;
  }
  
  if (day < 10) {
    day = '0' + day;
  }


  return `${year}-${month}-${day}`;
},



 removeDayFromDate : (dateString) =>{
  var parts = dateString.split('-');
  var monthYearString = parts[1] + '-' + parts[2];
  return monthYearString;
}


};
