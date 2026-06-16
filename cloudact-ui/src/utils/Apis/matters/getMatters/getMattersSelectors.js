// selectors.js
export const selectMattersData = (state) => state.getAllMatters.response;
export const selectMattersLoading = (state) => state.getAllMatters.loading;
export const selectMattersError = (state) => state.getAllMatters.error;
