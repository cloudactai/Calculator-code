// selectors.js
export const selectCreateFoldersData = (state) => state.createFolders.response;
export const selectCreateFoldersLoading = (state) => state.createFolders.loading;
export const selectCreateFoldersError = (state) => state.createFolders.error;
