/**
 * Calls the Flask child support calculator (app.py → POST /calculate).
 *
 * Payload shape matches what child_support.py expects:
 *   party1_income, party2_income, party1_name, party2_name, children[]
 *
 * Returns the result dict or null if the backend is unavailable.
 */
import { CALCULATOR_API } from "../../../config";

type ChildPayload = {
  name: string;
  csg_table: string;               // "Yes" | "No"
  child_support_override: number;  // monthly override amount
  custody_arrangement: string;     // "Party 1" | "Party 2" | "Shared"
};

type ChildSupportFlaskPayload = {
  party1_income: number;
  party2_income: number;
  party1_name: string;
  party2_name: string;
  party1_province?: string;
  party2_province?: string;
  children: ChildPayload[];
};

export type ChildSupportFlaskResult = {
  scenario: string;
  party1_monthly: number;
  party2_monthly: number;
  party1_annual: number;
  party2_annual: number;
  child_support_ref: {
    party1_monthly: number;
    party2_monthly: number;
    party1_annual: number;
    party2_annual: number;
  };
  notional_amount_ref: {
    party1_monthly: number;
    party2_monthly: number;
    party1_annual: number;
    party2_annual: number;
  };
  child_support_init: {
    party1_annual: number;
    party2_annual: number;
  };
  net_payer: string | null;
  net_monthly: number;
  net_annual: number;
};

const calcChildSupportFlask = async (
  payload: ChildSupportFlaskPayload
): Promise<ChildSupportFlaskResult | null> => {
  try {
    const res = await fetch(`${CALCULATOR_API}/calculate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) return null;
    const data = await res.json();
    // Flask may return {"error": "..."} with status 200
    if (data.error) {
      console.error('[Flask CS] error:', data.error);
      return null;
    }
    return data;
  } catch {
    return null;
  }
};

export { calcChildSupportFlask };
export type { ChildSupportFlaskPayload };
