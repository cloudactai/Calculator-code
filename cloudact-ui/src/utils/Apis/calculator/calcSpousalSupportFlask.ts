/**
 * Calls the Flask spousal support calculator (app.py → POST /spousal-calculate).
 *
 * If children_list is provided and monthly_child_support / monthly_notional_child_support
 * are omitted, Python computes them internally via the Schedule I CS calculator.
 */
import { CALCULATOR_API } from "../../../config";
import { getAuthToken } from "../../authToken";

export type SpousalSupportFlaskPayload = {
  party1_net_income: number;              // annual income
  party2_net_income: number;              // annual income
  party1_name?: string;                   // party 1 display name
  party2_name?: string;                   // party 2 display name
  party1_age?: number;                    // party 1 age at separation
  recipient_age: number;                  // lower-income party's age
  years: number;                          // years of relationship
  province?: string;                      // e.g. "ON"
  children: boolean;                      // true if any children exist
  children_list?: any[];                  // child objects — Python computes CS from these
  youngest_child_age?: number;
  monthly_child_support?: number;         // override: monthly CS paid by payor
  monthly_notional_child_support?: number; // override: monthly notional CS
};

export type TaxProfileData = {
  // Input values
  employed_income: number;
  self_employed_income: number;
  other_income: number;
  deductible_support_paid: number;
  support_received: number;
  child_care_expenses: number;
  other_deductions: number;
  // Computed values
  gross_income: number;
  taxable_income: number;
  basic_personal_amount_fed: number;
  age_amount_fed: number;
  eligible_dependent_credit_fed: number;
  cpp_base: number;
  ei: number;
  canada_employment_credit: number;
  disability_credit_fed: number;
  cpp_ei_credit: number;
  total_federal_credits: number;
  basic_personal_amount_prov: number;
  eligible_dependent_credit_prov: number;
  age_amount_prov: number;
  disability_credit_prov: number;
  total_provincial_credits: number;
  federal_tax_before_credits: number;
  provincial_tax_before_credits: number;
  federal_tax: number;
  provincial_tax: number;
  ontario_health_premium: number;
  ontario_surtax: number;
  cpp_enhanced: number;
  cpp2: number;
  cpp_ei_deductions: number;
  canada_workers_benefit: number;
  canada_child_benefit: number;
  gst_hst_benefit: number;
  provincial_child_benefit: number;
  provincial_sales_tax_credit: number;
  climate_action_incentive: number;
  total_benefits: number;
  ontario_tax_reduction: number;
  ontario_lift_credit: number;
  bc_tax_reduction: number;
  total_taxes: number;
  net_income_after_tax: number;
};

export type SpousalSupportFlaskResult = {
  monthly_low: number;
  monthly_med: number;
  monthly_high: number;
  annual_low: number;
  annual_med: number;
  annual_high: number;
  payor: string;
  recipient: string;
  duration_label: string;
  payor_indi_low: number;
  payor_indi_mid: number;
  payor_indi_high: number;
  recipient_indi_low: number;
  recipient_indi_mid: number;
  recipient_indi_high: number;
  payor_taxes_low: number;
  payor_taxes_mid: number;
  payor_taxes_high: number;
  recipient_taxes_low: number;
  recipient_taxes_mid: number;
  recipient_taxes_high: number;
  payor_benefits_low: number;
  payor_benefits_mid: number;
  payor_benefits_high: number;
  recipient_benefits_low: number;
  recipient_benefits_mid: number;
  recipient_benefits_high: number;
  // Detailed tax profiles per party per scenario
  payor_tax_profile_low?: TaxProfileData;
  payor_tax_profile_mid?: TaxProfileData;
  payor_tax_profile_high?: TaxProfileData;
  recipient_tax_profile_low?: TaxProfileData;
  recipient_tax_profile_mid?: TaxProfileData;
  recipient_tax_profile_high?: TaxProfileData;
};

const calcSpousalSupportFlask = async (
  payload: SpousalSupportFlaskPayload
): Promise<SpousalSupportFlaskResult | null> => {
  try {
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    const token = getAuthToken();
    if (token) headers["Authorization"] = `Bearer ${token}`;
    const res = await fetch(`${CALCULATOR_API}/spousal-calculate`, {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
    });

    if (!res.ok) return null;
    const data = await res.json();
    if (data.error) {
      console.error('[Flask SS] error:', data.error);
      return null;
    }
    return data;
  } catch {
    return null;
  }
};

export { calcSpousalSupportFlask };
