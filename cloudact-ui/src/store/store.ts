import { Province } from "../pages/calculator/Calculator";
import { dynamicValues } from "../utils/helpers/calculator/creditTaxCalculationFormulas";

export interface userLoginReducer {
  userInfo: Object;
}

export interface matterClientObj {
  client_name: string;
  client_id: number;
}

export interface matterClients {
  data: matterClientObj[];
  loading: boolean;
}

export interface IaccessPagesAuthData {
  auth_calculator: boolean;
  auth_dashboard: boolean;
  auth_report_history: boolean;
  auth_run_report: boolean;
  auth_settings: boolean;
  auth_tasks: boolean;
  auth_tools: boolean;
  auth_monthly_checklists: boolean;
  auth_compliance_forms: boolean;
  auth_compliance_billing: boolean;
  auth_trust_deposit_slip: boolean;
  auth_workflow: boolean;
  auth_reports: boolean;
  auth_operational_report: boolean;
  auth_law_tools: boolean;
  auth_matters: boolean;
  auth_forms: boolean;
  auth_archive: boolean;
}

export interface IaccessPagesReducer {
  loading: boolean;
  response: IaccessPagesAuthData;
}

export interface IClientDetailsFromFile {
  loading: boolean;
  data: {
    client_name: string;
    opposing_party_name: string;
    client_DOB: string;
    client_province: Province;
    opposing_party_DOB: string;
    opposing_party_province: Province;
    date_of_marriage: string;
    date_of_separation: string;
    no_of_children: number;
    child_1_name: string;
    child_1_lives_with: string;
    child_1_DOB: string;
    child_2_name: string;
    child_2_DOB: string;
    child_2_lives_with: string;
    child_3_name: string;
    child_3_DOB: string;
    child_3_lives_with: string;
  };
}

export interface Store {
  userLogin: userLoginReducer;
  userRegister: {};
  fullRefresh: {};
  userChange: {};
  matterClients: matterClients;
  user2FAVerification: {};
  userOPTMatch: {};
  userLoginAuth: {};
  userProfileInfo: {};
  userProfileInfoChange: {};
  companyInformation: {};
  accessPages: IaccessPagesReducer;
  dynamicValues: IDynamicValuesReducers;
  clientDetailsFromFile: IClientDetailsFromFile;
  getAllUserMatters: userMatters;
  matter:{
    matterId:string
  }
}

export interface userMatters {
  loading: boolean;
  response: string;
}

export interface IDynamicValuesReducers {
  data: dynamicValues;
}