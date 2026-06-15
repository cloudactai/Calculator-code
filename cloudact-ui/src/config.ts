type ReactAppEnvironment = "DEV" | "QA" | "PROD" | "LOCAL";

// Environment is set at build time via REACT_APP_ENVIRONMENT (see .env.example).
// Defaults to LOCAL for development.
const rawEnv = (process.env.REACT_APP_ENVIRONMENT || "LOCAL").toUpperCase();

export const REACT_APP_ENVIRONMENT: ReactAppEnvironment = (
  ["DEV", "QA", "PROD", "LOCAL"].includes(rawEnv) ? rawEnv : "LOCAL"
) as ReactAppEnvironment;

type POWERBIEnvironment = {
  POWER_BI_API: string;
  AUTHORITY: string;
  client_id: string;
  client_secret: string;
  grant_type: string;
  scope: string[];
  tenant_id: string;
  report_id: string;
  group_id: string;
};

// Backend API base URLs. Each can be overridden at build time so the UI can be
// pointed at a different backend without code changes.
export const APIS = {
  local: process.env.REACT_APP_API_URL_LOCAL || "http://localhost:3000/v1",
  dev: process.env.REACT_APP_API_URL_DEV || "https://dev-cloudact.infoset.ca/v1",
  QA: process.env.REACT_APP_API_URL_QA || "https://apicloudact.infoset.ca/v1",
  prod: process.env.REACT_APP_API_URL_PROD || "https://api.cloudforlawfirms.com/v1",
};

// Flask calculator/AI backend (Calculator-code app.py) that powers the Family
// Law AI chat widget. Defaults to the deployed Render service so the widget
// works without extra config; override with REACT_APP_CALCULATOR_API_URL to
// point at a local Flask server (http://localhost:5050) during development.
export const CALCULATOR_API =
  process.env.REACT_APP_CALCULATOR_API_URL ||
  "https://calculator-code-x2b4.onrender.com";

// Power BI credentials must be supplied via environment variables — never
// commit real values to source control.
export const POWERBI: POWERBIEnvironment = {
  POWER_BI_API: process.env.REACT_APP_POWER_BI_API || "api.powerbi.com",
  AUTHORITY:
    process.env.REACT_APP_POWERBI_AUTHORITY ||
    "https://login.microsoftonline.com/",
  client_id: process.env.REACT_APP_POWERBI_CLIENT_ID || "",
  client_secret: process.env.REACT_APP_POWERBI_CLIENT_SECRET || "",
  grant_type: process.env.REACT_APP_POWERBI_GRANT_TYPE || "client_credentials",
  scope: [
    process.env.REACT_APP_POWERBI_SCOPE ||
      "https://analysis.windows.net/powerbi/api/.default",
  ],
  tenant_id: process.env.REACT_APP_POWERBI_TENANT_ID || "",
  report_id: process.env.REACT_APP_POWERBI_REPORT_ID || "",
  group_id: process.env.REACT_APP_POWERBI_GROUP_ID || "",
};

export const scopes: string[] = [
  "https://analysis.windows.net/powerbi/api/Report.Read.All",
];
