// selectors.js
export const selectCourtsData = (state) => state.getAllCourts.response;
export const selectCourtsLoading = (state) => state.getAllCourts.loading;
export const selectCourtsError = (state) => state.getAllCourts.error;
