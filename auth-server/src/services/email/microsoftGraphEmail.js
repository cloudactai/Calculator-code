/**
 * services/email/microsoftGraphEmail.js
 *
 * Microsoft Graph email sender (app-only). This is the transport the user asked
 * for. It gets an OAuth token via client-credentials and calls Graph `sendMail`.
 * Supports optional inline image attachments (used for the branded logo).
 *
 * Required backend/Render environment variables:
 *   EMAIL_MICROSOFT_TENANT_ID
 *   EMAIL_MICROSOFT_CLIENT_ID
 *   EMAIL_MICROSOFT_CLIENT_SECRET     <-- EXPIRES; see the warning block below
 *   EMAIL_MICROSOFT_SENDER_EMAIL      (e.g. notifications@yourdomain.com)
 *   FRONTEND_URL                      (base for the links this builds)
 *
 * Do not commit real secrets.
 *
 * ──────────────────────────────────────────────────────────────────────────
 * WHEN THE CLIENT SECRET EXPIRES (all emails will stop sending)
 * ──────────────────────────────────────────────────────────────────────────
 * EMAIL_MICROSOFT_CLIENT_SECRET is an Azure app secret with an expiry date.
 * When it expires, getMicrosoftGraphToken() fails and ALL emails stop going out
 * (symptom: "Microsoft Graph token request failed: 401").
 *
 * To fix it (needs Microsoft 365 / Azure admin access):
 *   1. Go to https://entra.microsoft.com  (or portal.azure.com -> Microsoft Entra ID)
 *   2. App registrations -> open the app whose Client ID matches
 *      EMAIL_MICROSOFT_CLIENT_ID.
 *   3. Certificates & secrets -> "New client secret" -> copy the VALUE immediately
 *      (shown once). Note the new expiry date.
 *   4. In Render -> Environment -> update EMAIL_MICROSOFT_CLIENT_SECRET -> save
 *      (triggers redeploy).
 *   5. Test: trigger a signup or "resend verification" and confirm the email arrives.
 *
 * The app only needs the "Mail.Send" APPLICATION permission (admin-consented),
 * ideally scoped to the sender mailbox via an Exchange ApplicationAccessPolicy.
 * ──────────────────────────────────────────────────────────────────────────
 */

function getRequiredEnv(name) {
  const value = process.env[name];
  if (!value || !value.trim()) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value.trim();
}

function getFrontendBaseUrl() {
  const frontendUrl = getRequiredEnv("FRONTEND_URL");
  return frontendUrl.replace(/\/+$/, "");
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

async function getMicrosoftGraphToken() {
  const tenantId = getRequiredEnv("EMAIL_MICROSOFT_TENANT_ID");
  const clientId = getRequiredEnv("EMAIL_MICROSOFT_CLIENT_ID");
  const clientSecret = getRequiredEnv("EMAIL_MICROSOFT_CLIENT_SECRET");

  const body = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    scope: "https://graph.microsoft.com/.default",
    grant_type: "client_credentials",
  });

  const response = await fetch(
    `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`,
    {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
    },
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `Microsoft Graph token request failed: ${response.status} ${errorText}`,
    );
  }

  const data = await response.json();
  if (!data.access_token) {
    throw new Error(
      "Microsoft Graph token response did not include access_token.",
    );
  }
  return data.access_token;
}

async function sendMicrosoftEmail({ to, subject, html, attachments }) {
  if (!to || !subject || !html) {
    throw new Error("sendMicrosoftEmail requires to, subject, and html.");
  }

  const sender = getRequiredEnv("EMAIL_MICROSOFT_SENDER_EMAIL");
  const accessToken = await getMicrosoftGraphToken();

  const message = {
    subject,
    body: { contentType: "HTML", content: html },
    toRecipients: [{ emailAddress: { address: to } }],
  };

  // Optional file attachments. Pass { name, contentType, contentBytes (base64),
  // cid } per attachment; a `cid` marks it as an inline image the HTML can
  // reference via `src="cid:<cid>"`.
  if (Array.isArray(attachments) && attachments.length > 0) {
    message.attachments = attachments.map((att) => ({
      "@odata.type": "#microsoft.graph.fileAttachment",
      name: att.name,
      contentType: att.contentType,
      contentBytes: att.contentBytes,
      isInline: Boolean(att.cid),
      ...(att.cid ? { contentId: att.cid } : {}),
    }));
  }

  const payload = { message, saveToSentItems: false };

  const response = await fetch(
    `https://graph.microsoft.com/v1.0/users/${encodeURIComponent(sender)}/sendMail`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    },
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `Microsoft Graph sendMail failed: ${response.status} ${errorText}`,
    );
  }

  return true;
}

module.exports = {
  sendMicrosoftEmail,
  getMicrosoftGraphToken,
  getFrontendBaseUrl,
  escapeHtml,
};
