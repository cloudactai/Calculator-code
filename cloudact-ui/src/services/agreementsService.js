import axios from "../utils/axios";

// agreementRoutes.js wraps every JSON reply in the legacy envelope
// `{ data: { code, status, body } }` (matching mattersRoutes/calculationReports),
// where formsRoutes.js replies with a plain `{ data }`. Unwrapping only the
// outer `data` therefore hands callers `{ code, status, body }` instead of the
// payload — which is what silently emptied the Documents folder listing and
// stopped a saved draft from resuming. Peel the envelope when it is one.
const isLegacyEnvelope = (payload) =>
  !!payload &&
  typeof payload === "object" &&
  !Array.isArray(payload) &&
  "body" in payload &&
  "code" in payload &&
  "status" in payload;

const body = (response) => {
  const payload = response.data?.data ?? response.data;
  return isLegacyEnvelope(payload) ? payload.body : payload;
};

/**
 * Client for the Draft Agreements persistence routes (auth-server
 * agreementRoutes.js). Shaped like formsService.js.
 */
export const agreementsService = {
  /** Generated agreements filed in this matter's Documents folders. Without
   * a folderId it lists every generated agreement for the matter. */
  listAgreements: async (matterNumber, folderId) =>
    body(
      await axios.get(`/matters/${encodeURIComponent(matterNumber)}/agreements`, {
        params: folderId ? { folderId } : undefined,
      })
    ),
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
