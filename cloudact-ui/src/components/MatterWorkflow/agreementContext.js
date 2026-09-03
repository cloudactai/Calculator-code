import { agreementOutstandingFields } from "./agreementResolver";

/**
 * Primer for the /agreement-chat agent — sibling to
 * buildUpdateContextMessage() in matterIntakeContext.js. Built fresh every
 * time the chat opens (including on resume) from live matter data plus the
 * persisted `answers` blob, never from a replayed transcript: the same
 * reasoning auth-server/src/utils/changeLog.js documents for why Update
 * Information never keeps its transcript either — a snapshot goes stale the
 * moment anything on the matter changes, so replaying it as literal prior
 * turns would resend a stale record every visit.
 */
export function buildAgreementContextMessage(agreementData) {
  if (!agreementData) return null;

  const outstanding = agreementOutstandingFields(agreementData);

  const alreadyKnown = {
    party1: agreementData.party1,
    party2: agreementData.party2,
    dateOfMarriage: agreementData.dateOfMarriage,
    placeOfMarriage: agreementData.placeOfMarriage,
    dateOfSeparation: agreementData.dateOfSeparation,
    children: agreementData.children,
    ...(agreementData.childSupport.resolved
      ? {
          childSupportPayer: agreementData.childSupport.payer,
          childSupportRecipient: agreementData.childSupport.recipient,
          childSupportAmount: agreementData.childSupport.amount,
        }
      : {}),
    ...(agreementData.spousalSupport.resolved
      ? {
          spousalSupportPayer: agreementData.spousalSupport.payer,
          spousalSupportAmount: agreementData.spousalSupport.amount,
        }
      : {}),
  };

  return [
    "Continue (or begin) drafting this matter's Separation Agreement.",
    "alreadyKnown holds values already on file — never ask about these.",
    "outstanding lists exactly what is still needed, in the order to raise it. Work through it one topic at a time; skip any topic the lawyer says does not apply and record it as not-included.",
    "assetsOnFile and debtsOnFile are read-only reference lists of what is already recorded on the matter — use them so the lawyer can confirm ownership instead of redescribing type and value from scratch.",
    "",
    JSON.stringify(
      {
        alreadyKnown,
        outstanding,
        assetsOnFile: agreementData.assets.onFile,
        debtsOnFile: agreementData.debts.onFile,
      },
      null,
      2
    ),
  ].join("\n");
}
