// selectors.js
export const selectGetFileData = (state) => state.getFileData.response;
export const selectGetFileDataLoading = (state) => state.getFileData.loading;
export const selectGetFileDataError = (state) => state.getFileData.error;
export const selectGetFileDataReset = (state) => state.getFileData.error;
