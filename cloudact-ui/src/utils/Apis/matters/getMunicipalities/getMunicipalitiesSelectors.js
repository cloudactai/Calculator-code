// selectors.js
export const selectMunicipaltiesData = (state) => state.getMunicipalities.response;
export const selectMunicipaltiesLoading = (state) => state.getMunicipalities.loading;
export const selectMunicipaltiesError = (state) => state.getMunicipalities.error;
