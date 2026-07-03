"use strict";

// Branded email facade for the auth flows. Stable interface
// (sendVerificationEmail / sendPasswordResetEmail with EMAIL_CONFIG /
// EMAIL_SEND_FAILED error codes that authRoutes relies on) delegating delivery
// to the Microsoft Graph transport.
//
// LOGO IS OPTIONAL: if you have a PNG at ./email/assets/<logo>.png it is embedded
// inline; if the file is missing or Graph rejects the inline attachment, we fall
// back to a logo-less send so an auth email never fails just because of the logo.
// Don't have a logo yet? Delete the getLogoAttachment() call — set `hasLogo`
// false and the template renders a text wordmark instead.
const fs = require("fs");
const path = require("path");
const { sendMicrosoftEmail } = require("./email/microsoftGraphEmail");

const LOGO_CID = "app-logo";
const BRAND_COLOR = "#307FF4"; // change to your brand's action color
const BRAND_NAME = "CloudAct"; // change to your app name

function createEmailError(code, message) {
  const error = new Error(message);
  error.code = code;
  return error;
}

function escapeHtml(value = "") {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// Load + base64-encode the logo once. Returns an inline attachment descriptor,
// or null if the asset can't be read (so emails still send without the image).
let cachedLogo;
function getLogoAttachment() {
  if (cachedLogo !== undefined) return cachedLogo;
  try {
    const logoPath = path.join(__dirname, "email", "assets", "logo.png");
    cachedLogo = {
      name: "logo.png",
      contentType: "image/png",
      contentBytes: fs.readFileSync(logoPath).toString("base64"),
      cid: LOGO_CID,
    };
  } catch (err) {
    console.warn("Email logo could not be loaded:", err?.message || err);
    cachedLogo = null;
  }
  return cachedLogo;
}

// Renders a branded, email-client-safe HTML message (table layout + inline
// styles). `ctaUrl` must already be HTML-escaped by the caller.
function renderBrandedEmail({ preheader, heading, intro, ctaLabel, ctaUrl, outro, hasLogo }) {
  const year = new Date().getFullYear();
  const logoBlock = hasLogo
    ? `<img src="cid:${LOGO_CID}" alt="${BRAND_NAME}" width="116" style="display:block;width:116px;max-width:116px;height:auto;border:0;outline:none;text-decoration:none;" />`
    : `<span style="font-family:Arial,Helvetica,sans-serif;font-size:24px;font-weight:bold;color:#5BB8E8;">${BRAND_NAME}.</span>`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta name="color-scheme" content="light only" />
</head>
<body style="margin:0;padding:0;background-color:#f4f6f8;">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:#f4f6f8;">${preheader}</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f6f8;">
    <tr>
      <td align="center" style="padding:32px 16px;">
        <table role="presentation" width="480" cellpadding="0" cellspacing="0" style="max-width:480px;width:100%;background-color:#ffffff;border:1px solid #e5e9f0;border-radius:14px;">
          <tr>
            <td align="center" style="padding:36px 40px 8px 40px;">
              ${logoBlock}
            </td>
          </tr>
          <tr>
            <td style="padding:8px 40px 0 40px;">
              <h1 style="margin:0 0 14px 0;font-family:Arial,Helvetica,sans-serif;font-size:22px;line-height:1.3;color:#111827;text-align:center;">${heading}</h1>
              <p style="margin:0 0 24px 0;font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.6;color:#374151;text-align:center;">${intro}</p>
            </td>
          </tr>
          <tr>
            <td align="center" style="padding:0 40px 4px 40px;">
              <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 auto;">
                <tr>
                  <td align="center" bgcolor="${BRAND_COLOR}" style="border-radius:8px;">
                    <a href="${ctaUrl}" style="display:inline-block;padding:13px 30px;font-family:Arial,Helvetica,sans-serif;font-size:15px;font-weight:bold;color:#ffffff;text-decoration:none;border-radius:8px;">${ctaLabel}</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:22px 40px 0 40px;">
              <p style="margin:0 0 6px 0;font-family:Arial,Helvetica,sans-serif;font-size:13px;line-height:1.6;color:#6b7280;text-align:center;">If the button doesn't work, copy and paste this link into your browser:</p>
              <p style="margin:0 0 22px 0;font-family:Arial,Helvetica,sans-serif;font-size:13px;line-height:1.6;text-align:center;word-break:break-all;"><a href="${ctaUrl}" style="color:${BRAND_COLOR};text-decoration:underline;">${ctaUrl}</a></p>
              <p style="margin:0 0 28px 0;font-family:Arial,Helvetica,sans-serif;font-size:13px;line-height:1.6;color:#6b7280;text-align:center;">${outro}</p>
            </td>
          </tr>
          <tr>
            <td style="padding:20px 40px 32px 40px;border-top:1px solid #eef1f5;">
              <p style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:12px;line-height:1.5;color:#9ca3af;text-align:center;">&copy; ${year} ${BRAND_NAME}. All rights reserved.<br />This is an automated message &mdash; please don't reply.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

// Maps a transport error to the codes authRoutes expects.
function toEmailError(err) {
  const message = err?.message || "Failed to send email.";
  if (/Missing required environment variable/i.test(message)) {
    return createEmailError("EMAIL_CONFIG", message);
  }
  return createEmailError("EMAIL_SEND_FAILED", message);
}

// Sends a branded auth email. `render({ hasLogo })` returns the HTML. The inline
// logo must never block an auth-critical email: try once with the embedded logo,
// and if Graph rejects that (some Exchange/Graph setups refuse inline
// attachments), fall back to a plain, logo-less send. Config errors surface as-is.
async function deliverBrandedEmail({ to, subject, render }) {
  const logo = getLogoAttachment();
  console.log(`[Email] Delivering "${subject}" to ${to} (logo=${Boolean(logo)})`);

  if (logo) {
    try {
      await sendMicrosoftEmail({
        to,
        subject,
        html: render({ hasLogo: true }),
        attachments: [logo],
      });
      console.log(`[Email] Sent "${subject}" to ${to} (with logo)`);
      return;
    } catch (err) {
      if (/Missing required environment variable/i.test(err?.message || "")) {
        console.error(`[Email] Config error sending "${subject}" to ${to}: ${err?.message || err}`);
        throw toEmailError(err);
      }
      console.warn(
        `[Email] Send with inline logo failed (${err?.message || err}); retrying without it.`,
      );
    }
  }

  try {
    await sendMicrosoftEmail({ to, subject, html: render({ hasLogo: false }) });
    console.log(`[Email] Sent "${subject}" to ${to} (no logo)`);
  } catch (err) {
    console.error(`[Email] FAILED to send "${subject}" to ${to}: ${err?.message || err}`);
    throw toEmailError(err);
  }
}

// Low-level send kept for any callers that build their own HTML.
async function sendEmail({ to, subject, html, attachments }) {
  try {
    await sendMicrosoftEmail({ to, subject, html, attachments });
  } catch (err) {
    throw toEmailError(err);
  }
}

async function sendVerificationEmail(to, name, verifyUrl) {
  const safeName = escapeHtml(name || to);
  const safeUrl = escapeHtml(verifyUrl);

  return deliverBrandedEmail({
    to,
    subject: `Verify your ${BRAND_NAME} email`,
    render: ({ hasLogo }) =>
      renderBrandedEmail({
        preheader: `Confirm your email address to activate your ${BRAND_NAME} account.`,
        heading: "Verify your email",
        intro: `Hi ${safeName}, thanks for creating your ${BRAND_NAME} account. Confirm your email address to activate it.`,
        ctaLabel: "Verify my email",
        ctaUrl: safeUrl,
        outro:
          "This link expires in 24 hours. If you didn't create an account, you can safely ignore this email.",
        hasLogo,
      }),
  });
}

async function sendPasswordResetEmail(to, name, resetUrl) {
  const safeName = escapeHtml(name || to);
  const safeUrl = escapeHtml(resetUrl);

  return deliverBrandedEmail({
    to,
    subject: `Reset your ${BRAND_NAME} password`,
    render: ({ hasLogo }) =>
      renderBrandedEmail({
        preheader: `Use the link inside to set a new ${BRAND_NAME} password.`,
        heading: "Reset your password",
        intro: `Hi ${safeName}, we received a request to reset the password for your ${BRAND_NAME} account. Click below to choose a new one.`,
        ctaLabel: "Reset my password",
        ctaUrl: safeUrl,
        outro:
          "This link expires in 1 hour. If you didn't request a password reset, you can safely ignore this email.",
        hasLogo,
      }),
  });
}

module.exports = {
  sendEmail,
  sendVerificationEmail,
  sendPasswordResetEmail,
};
