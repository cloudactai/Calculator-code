/**
 * LOCAL DEV AUTH BYPASS
 * ---------------------
 * Seeds the encrypted auth cookies the app normally gets from the backend on
 * login, so the calculator UI can be explored locally without any backend running.
 *
 * Always active in development builds. Safe in production — NODE_ENV guard
 * makes this dead code in any production bundle.
 *
 * Pages will render and navigation works, but anything that fetches data
 * (matters, tasks, reports) will show empty/error states — there's no API.
 */
import Cookies from "js-cookie";
import { encrypt } from "./Encrypted";

const BYPASS_ENABLED = process.env.NODE_ENV === "development";

const DEV_USER = {
  id: 1,
  uid: 1,
  sid: 1,
  first_name: "Dev",
  last_name: "User",
  name: "Dev User",
  email: "dev@local.test",
  company_name: "Dev Law Firm",
  short_firmname: "DevFirm",
  province: "ON",
  region: "ON",
  authClio: true,
  authIntuit: true,
};

// Routes.jsx gates pages on these flags (state.accessPages.response.auth_*).
// AuthUser treats undefined as allowed, so missing ones are fine too.
const ALL_ACCESS = {
  auth_archive: true,
  auth_calculator: true,
  auth_compliance_billing: true,
  auth_compliance_forms: true,
  auth_dashboard: true,
  auth_five_steps: true,
  auth_forms: true,
  auth_law_tools: true,
  auth_matters: true,
  auth_monthly_checklists: true,
  auth_operational_report: true,
  auth_report_history: true,
  auth_reports: true,
  auth_run_report: true,
  auth_settings: true,
  auth_tasks: true,
  auth_trust_deposit_slip: true,
  auth_workflow: true,
};

// Re-seed on every page load so flag/shape updates here take effect without
// manually clearing cookies.
if (BYPASS_ENABLED) {
  const opts = { path: "/" };

  Cookies.set(
    "allUserInfo",
    encrypt({
      ...DEV_USER,
      last_refreshed_at: new Date().toISOString(),
      role: [{ ...DEV_USER, role: "ADMIN" }],
    }),
    opts
  );
  Cookies.set("currentUserRole", encrypt({ ...DEV_USER, role: "ADMIN" }), opts);
  Cookies.set("access_pages", encrypt(ALL_ACCESS), opts);
  Cookies.set(
    "companyInfo",
    encrypt({
      ...DEV_USER,
      address: "123 Dev Street",
      city: "Toronto",
      postal_code: "A1A 1A1",
      phone: "555-555-5555",
    }),
    opts
  );
  Cookies.set("userProfile", encrypt(DEV_USER), opts);
  Cookies.set("authClio", "true", opts);
  Cookies.set("authIntuit", "true", opts);
  Cookies.set("province", JSON.stringify("ON"), opts);
  Cookies.set("AccessToken", "dev-bypass-token", opts);

  console.warn(
    "[devBypass] Auth bypass active — signed in as Dev User (ADMIN). " +
      "API-backed pages will show empty data."
  );
}
