// selectors.js
export const selectSaveFileData = (state) => state.saveFileData.response;
export const selectSaveFileDataLoading = (state) => state.saveFileData.loading;
export const selectSaveFileDataError = (state) => state.saveFileData.error;
export const selectSaveFileDataReset = (state) => state.saveFileData.error;
