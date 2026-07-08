import Cookies from "js-cookie";
import { applyMiddleware, combineReducers, createStore } from "redux";
import { composeWithDevTools } from "redux-devtools-extension";
import thunk from "redux-thunk";
import {
  fullRefreshReducer,
  userChangeReducer,
  userLoginReducer,
  userRegisterReducer,
  user2FAVerificationReducer,
  userLoginAuthReducer,
  userOPTMatchReducer,
  userProfileInfoReducer,
  userProfileInfoChangeReducer,
} from "../reducers/userReducer";
import {
  clientDetailsFromFileReducer,
  matterClientReducer,
  matterReducer
} from "../reducers/matterReducer";
import { accessPagesReducer } from "../reducers/accessPagesReducer";
import {
  getAllUserInfo,
  getCurrentUserFromCookies,
  getCompanyInfo,
  getAccessPagesInfo,
  getUserProfileInfo,
} from "../utils/helpers";
import { companyInformationReducer } from "../reducers/companyReducer";
import { dynamicValuesReducer } from "../reducers/dynamicValuesReducer";
import { setupWizardReducer } from "../reducers/setupWizardReducer";
import { selecetdFormsReducer } from "../reducers/formPagesReducer";
import { getMattersReducer } from "../utils/Apis/matters/getMatters/getMattersReducers";
import {createMattersReducer} from "../utils/Apis/matters/createMatters/createMattersReducers";
import { getSingleMatterReducer } from "../utils/Apis/matters/getSingleMatter/getSingleMattersReducers";
import { getMatterFoldersReducer } from "../utils/Apis/matters/getMatterFolders/getMattersFoldersReducers";
import { getSingleMatterAssetsDataReducer, getSingleMatterBackgroundDataReducer, getSingleMatterChildrenDataReducer, getSingleMatterCourtDataReducer, getSingleMatterDataReducer, getSingleMatterDebtDataReducer, getSingleMatterEmploymentDataReducer, getSingleMatterExpenseDataReducer, getSingleMatterIncomeBenefitsDataReducer, getSingleMatterOtherPersonsDataReducer, getSingleMatterRelationshipDataReducer } from "../utils/Apis/matters/getSingleMatterData/getSingleMattersDataReducers";
import { getMunicipalitiesReducer } from "../utils/Apis/matters/getMunicipalities/getMunicipalitiesReducers";
import { getAllCourtsReducer } from "../utils/Apis/matters/getCourts/getCourtsReducers";
import { createMatterFoldersReducer } from "../utils/Apis/matters/createMatterFolders/createMatterFoldersReducers";
import { createMatterFilesReducer } from "../utils/Apis/matters/createMatterFiles/createMatterFilesReducers";
import { getMatterFilesReducer } from "../utils/Apis/matters/getMatterFiles/getMattersFilesReducers";
import { updateMatterDataReducer } from "../utils/Apis/matters/updateMatters/updateMatterDataReducers";
import { saveMattersReducer } from "../utils/Apis/matters/saveMatterInformation/saveMattersReducers";
import { saveFileDataReducer } from "../utils/Apis/matters/saveFileData/saveFileDataReducers";
import { getFileDataReducer } from "../utils/Apis/matters/getFileData/getFileDataReducers";
import { getMatterDataReducer } from "../utils/Apis/matters/getMatterData/getMatterDataReducers";




const reducer: Store = combineReducers({
  matter: matterReducer,
  userLogin: userLoginReducer,
  userRegister: userRegisterReducer,
  fullRefresh: fullRefreshReducer,
  userChange: userChangeReducer,
  matterClients: matterClientReducer,
  user2FAVerification: user2FAVerificationReducer,
  userOPTMatch: userOPTMatchReducer,
  userLoginAuth: userLoginAuthReducer,
  userProfileInfo: userProfileInfoReducer,
  userProfileInfoChange: userProfileInfoChangeReducer,
  companyInformation: companyInformationReducer,
  accessPages: accessPagesReducer,
  dynamicValues: dynamicValuesReducer,
  clientDetailsFromFile: clientDetailsFromFileReducer,
  setupWizard: setupWizardReducer,
  createNewMatter: createMattersReducer,
  getAllMatters: getMattersReducer,
  getMatterFolders: getMatterFoldersReducer,
  singleMatter: getSingleMatterReducer,
  singleMatterData: getSingleMatterDataReducer,
  getMunicipalities: getMunicipalitiesReducer,
  getAllCourts: getAllCourtsReducer,
  createFolders: createMatterFoldersReducer,
  createFiles: createMatterFilesReducer,
  getMatterFiles: getMatterFilesReducer,
  courtData: getSingleMatterCourtDataReducer,
  backgroundData: getSingleMatterBackgroundDataReducer,
  relationshipData: getSingleMatterRelationshipDataReducer,
  childrenData: getSingleMatterChildrenDataReducer,
  employmentData: getSingleMatterEmploymentDataReducer,
  incomeBenefits:getSingleMatterIncomeBenefitsDataReducer,
  updateMatterData: updateMatterDataReducer,
  assetsData: getSingleMatterAssetsDataReducer,
  expenseData:  getSingleMatterExpenseDataReducer,
  debtData: getSingleMatterDebtDataReducer,
  saveMatter: saveMattersReducer,
  getOtherPersons: getSingleMatterOtherPersonsDataReducer,
  saveFileData: saveFileDataReducer,
  getFileData: getFileDataReducer,
  matterData: getMatterDataReducer,
  // Forms Pages
  selectedForms: selecetdFormsReducer,
});

const initialState = {
  userLogin: {
    userInfo: getAllUserInfo(),
  },
  userChange: {
    loading: false,
    sidebarCollapse: false,
    userRole: getCurrentUserFromCookies(),
  },
  companyInformation: { loading: false, companyInfo: getCompanyInfo() },
  accessPages: { loading: false, response: getAccessPagesInfo() },
  userProfileInfo: {
    loading: false,
    response: getUserProfileInfo() || {
      first_name: "",
      last_name: "",
    },
  },
  clientDetailsFromFile: {
    loading: false,
    data: [],
  },
  matter:{
    matterId:""
  },
  dynamicValues: {
    data: {
      AmountForEligibleDependentFed: 0,
      AmountForEligibleDependentOntario: 0,
      BaseCPPLimit: 0,
      BasicPersonalAmountFed: 0,
      BasicPersonalAmountOntario: 0,
      CanadaEmploymentAmountLimit: 0,
      ChildBenefitDeduction: 0,
      ChildBenefitBasic: 0,
      EILimit: 0,
      EnhancedCPPDeductionLimit: 0,
      EnhancedCPPDeductionRate: 0,
      SelfEmployedEnhCPPRate: 0,
      SelfEmployedEnhCPPThreshold: 0,
      ChildBenefitWorking1ChildAmt: 0,
      ChildBenefitWorking2ChildAmt: 0,
      ChildBenefitThresholdofBase: 0,
      ChildBenefitThresholdofWorking: 0,
      ChildBenefitWorking3ChildAmt: 0,
      ChildBenefitWorking4ChildAmt: 0,
      ChildBenefitBase3ChildAmt: 0,
      ChildBenefitBase4ChildAmt: 0,
      ChildBenefitBase1ChildAmt: 0,
      ChildBenefitBase2ChildAmt: 0,
      ChildBenefitBaseAddlChildAmt: 0,
      ChildBenefitThreshold1ChildAmt: 0,
      ChildBenefitThreshold2ChildAmt: 0,
      ChildBenefitThresholdAddlChildAmt: 0,
      ChildBenefitBaseAmountLess6: 0,
      ChildBenefitBaseAmountMore6: 0,
      CAChildBenefitBase4Child: 0,
      CAChildBenefitBase1Child: 0,
      CAChildBenefitBase2Child: 0,
      CAChildBenefitBase3Child: 0,
      CAChildBenefitReduHighThreshold: 0,
      CAChildBenefitReduLowerThreshold: 0,
      CAWorkerBenefitFamMax: 0,
      CAWorkerBenefitSingleMax: 0,
      CAWorkerBenefitFamThreshold: 0,
      CAWorkerBenefitSingleThreshold: 0,
      EIRate: 0,
      AgeAmtBase: 0,
      AgeAmtLowerThreshold: 0,
      GSTBaseCredit: 0,
      GSTDependentCredit: 0,
      GSTBaseAmount: 0,
      BCChildBenefitLowerThreshold: 0,
      BCClimateActionBasic: 0,
      BCClimateActionAddl: 0,
      BCClimateActionSingleThreshold: 0,
      BCClimateActionFamilyThreshold: 0,
      TaxReductionBase: 0,
      TaxReductionThresholdCalc: 0,
      TaxReductionThresholdEligibility: 0,
      ONSurtaxThreshold1: 0,
      ONSurtaxThreshold2: 0,
      ONTaxReductionBase: 0,
      ONTaxReductionDep: 0,
      ONLIFTAmount: 0,
      ONLIFTIndividual: 0,
      ONLIFTReductionRate: 0,
      ONSalesTaxBase: 0,
      ONSalesTaxThresholdFamily: 0,
      ONSalesTaxThresholdSingle: 0,
      ONClimateActionBase: 0,
      ONClimateActionChildUnder19: 0,
      ONClimateActionChildFirstChild: 0,
    },
  },
  setupWizard: {
    taxAndFinancialDetails: {
      loading: false,
      error: null,
      data: {},
    },
  },

  // Forms Pages
  selectedForms: [],
};

const middleware = [thunk];

const store = createStore(
  reducer,
  initialState,
  composeWithDevTools(applyMiddleware(...middleware))
);

export default store;
