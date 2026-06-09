export const findDueDateFromStartDate = (currentDate, billingFrequency) => {
  if (billingFrequency.type === "Monthly") {
    // Step 1: Get the current date
    // Step 2: Calculate the start date (26th of the previous month)
    return new Date(
      currentDate.getFullYear(),
      currentDate.getMonth() + 1,
      0
    ).toLocaleDateString("en-CA");
  } else if (billingFrequency.type === "Weekly") {
    const weekDay = billingFrequency.data;
    const weekDayMap = {
      Sunday: 0,
      Monday: 1,
      Tuesday: 2,
      Wednesday: 3,
      Thursday: 4,
      Friday: 5,
      Saturday: 6,
    };
    const targetDay = weekDayMap[weekDay];

    if (targetDay === undefined) {
      console.error("Invalid weekday:", weekDay);
      return;
    }
    const currentDay = currentDate.getDay();

    const startOfWeek = new Date(currentDate);
    const mondayOffset = 1 - currentDay;
    startOfWeek.setDate(currentDate.getDate() + mondayOffset);

    const dueDate = new Date(startOfWeek);
    dueDate.setDate(startOfWeek.getDate() + targetDay - 1);
    return dueDate.toLocaleDateString("en-CA");
  } else if (billingFrequency.type === "Daily") {
    // Step 1: Get the current date
    // currentDate.setDate(currentate.getDate() -2);
    const currentDay = currentDate.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday

    let taskFromDate = new Date(currentDate);
    let dueDate = new Date(currentDate);

    dueDate.toLocaleDateString("en-CA");
  } else if (billingFrequency.type === "Semi-monthly") {
    const currentDay = currentDate.getDate(); // Gt the day of the month
    const startDate = new Date(currentDate); // Clone current date for manipulation
    const task_to = new Date(currentDate); // Clone current date for manipulation
    const task_due_date = new Date(currentDate);

    if (currentDay <= 15) {
      // First half of the month: 26th of previous month to 15th of current month
      startDate.setMonth(currentDate.getMonth() - 1); // Move to the previous month
      startDate.setDate(26); // Set to the 26th of the previous month
      task_to.setDate(13); // Set to the 13th of the month
      task_due_date.setDate(15);
    } else {
      // Second half of the month: 14th to month's end
      startDate.setDate(14); // Set to the 14th of the month
      task_to.setDate(25);
      task_due_date.setMonth(task_to.getMonth() + 1, 0); // Set to the last day of the month
    }

    return task_due_date.toLocaleDateString("en-CA");
  } else if (billingFrequency.type === "Other") {
    const specificDate = new Date(billingFrequency.data); // Convert the provided date to a Date object
    // Extract the specific day
    const specificDay = specificDate.getDate();
    // Clone the current date for task_due_date and set it to the specific day
    const task_due_date = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth(),
      specificDay
    );
    return task_due_date;
  }
};
