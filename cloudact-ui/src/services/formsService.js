import axios from "../utils/axios";

const body = (response) => response.data?.data ?? response.data;

export const formsService = {
  listMatters: async () => body(await axios.get("/matters")),
  getMatterContext: async (matterNumber) => body(await axios.get(`/matters/${encodeURIComponent(matterNumber)}`)),
  listTemplates: async (province) => body(await axios.get("/forms", { params: { province, production_ready: true, mapping_ready: true } })),
  createDocuments: async (matterNumber, folderId, templateIds) => body(await axios.post(`/matters/${encodeURIComponent(matterNumber)}/forms`, { folderId, templateIds })),
  getDocument: async (matterNumber, documentId) => body(await axios.get(`/matters/${encodeURIComponent(matterNumber)}/forms/${documentId}`)),
  saveDocument: async (matterNumber, documentId, revision, fieldValues, status) => body(await axios.patch(`/matters/${encodeURIComponent(matterNumber)}/forms/${documentId}`, { revision, fieldValues, status })),
  saveGeneratedPdf: async (matterNumber, documentId, revision, pdfBlob, generationMs) => body(await axios.put(
    `/matters/${encodeURIComponent(matterNumber)}/forms/${documentId}/pdf`,
    pdfBlob,
    { params: { revision, generationMs }, headers: { "Content-Type": "application/pdf" } }
  )),
  listPdfRevisions: async (matterNumber, documentId) => body(await axios.get(`/matters/${encodeURIComponent(matterNumber)}/forms/${documentId}/pdf/revisions`)),
  listDocuments: async (matterNumber, folderId) => body(await axios.get(`/matters/${encodeURIComponent(matterNumber)}/forms`, { params: folderId ? { folderId } : undefined })),
  createFolder: async (matterNumber, title, type = "forms") => body(await axios.post(`/matters/${encodeURIComponent(matterNumber)}/folders`, { title, type })),
  listFolders: async (matterNumber) => body(await axios.get(`/matters/${encodeURIComponent(matterNumber)}/folders`)),
  listTaskStates: async (matterNumber) => body(await axios.get(`/matters/${encodeURIComponent(matterNumber)}/task-states`)),
  setTaskState: async (matterNumber, taskKey, status) => body(await axios.put(`/matters/${encodeURIComponent(matterNumber)}/task-states/${encodeURIComponent(taskKey)}`, { status })),
  renameDocument: async (matterNumber, documentId, displayName) => body(await axios.patch(`/matters/${encodeURIComponent(matterNumber)}/forms/${documentId}/name`, { displayName })),
  deleteDocument: async (matterNumber, documentId) => axios.delete(`/matters/${encodeURIComponent(matterNumber)}/forms/${documentId}`),
};
