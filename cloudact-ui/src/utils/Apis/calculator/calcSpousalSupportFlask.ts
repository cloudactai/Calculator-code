/**
 * Calls the Flask spousal support calculator (app.py → POST /spousal-calculate).
 *
 * If children_list is provided and monthly_child_support / monthly_notional_child_support
 * are omitted, Python computes them internally via the Schedule I CS calculator.
 */
import { CALCULATOR_API } from "../../../config";

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
};

const calcSpousalSupportFlask = async (
  payload: SpousalSupportFlaskPayload
): Promise<SpousalSupportFlaskResult | null> => {
  try {
    const res = await fetch(`${CALCULATOR_API}/spousal-calculate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
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
