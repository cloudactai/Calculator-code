import axios from "../utils/axios";

const body = (response) => response.data?.data ?? response.data;

/**
 * Client for the Draft Agreements persistence routes (auth-server
 * agreementRoutes.js). Shaped like formsService.js.
 */
export const agreementsService = {
  getAgreement: async (matterNumber, agreementType) =>
    body(await axios.get(`/matters/${encodeURIComponent(matterNumber)}/agreements/${encodeURIComponent(agreementType)}`)),
  saveAgreementDraft: async (matterNumber, agreementType, { answers, transcript }) =>
    body(
      await axios.put(
        `/matters/${encodeURIComponent(matterNumber)}/agreements/${encodeURIComponent(agreementType)}`,
        { answers, transcript }
      )
    ),
  resetAgreementChat: async (matterNumber, agreementType) =>
    body(
      await axios.post(
        `/matters/${encodeURIComponent(matterNumber)}/agreements/${encodeURIComponent(agreementType)}/reset`
      )
    ),
  saveAgreementPdf: async (matterNumber, agreementType, pdfBlob, filename) =>
    body(
      await axios.put(
        `/matters/${encodeURIComponent(matterNumber)}/agreements/${encodeURIComponent(agreementType)}/pdf`,
        pdfBlob,
        { params: { filename }, headers: { "Content-Type": "application/pdf" } }
      )
    ),
  downloadAgreementPdf: async (matterNumber, agreementType) =>
    axios.get(
      `/matters/${encodeURIComponent(matterNumber)}/agreements/${encodeURIComponent(agreementType)}/pdf`,
      { responseType: "blob" }
    ),
};
