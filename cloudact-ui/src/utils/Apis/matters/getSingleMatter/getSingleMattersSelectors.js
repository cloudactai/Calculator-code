// selectors.js
export const selectSingleMatterData = (state) =>
  state.singleMatter.data || { code: 200, status: "success", body: [] };
export const selectSingleMatterLoading = (state) => state.singleMatter.loading;
export const selectSingleMatterError = (state) => state.singleMatter.error;
export const selectSingleMatterReset = (state) => state.singleMatter.error;
