import axios from "../utils/axios";

const body = (response) => response.data?.data ?? response.data;

export const formsService = {
  listTemplates: async (province) => body(await axios.get("/forms", { params: { province, production_ready: true, mapping_ready: true } })),
  createDocuments: async (matterNumber, folderId, templateIds) => body(await axios.post(`/matters/${encodeURIComponent(matterNumber)}/forms`, { folderId, templateIds })),
  getDocument: async (matterNumber, documentId) => body(await axios.get(`/matters/${encodeURIComponent(matterNumber)}/forms/${documentId}`)),
  saveDocument: async (matterNumber, documentId, revision, fieldValues, status) => body(await axios.patch(`/matters/${encodeURIComponent(matterNumber)}/forms/${documentId}`, { revision, fieldValues, status })),
  listDocuments: async (matterNumber, folderId) => body(await axios.get(`/matters/${encodeURIComponent(matterNumber)}/forms`, { params: folderId ? { folderId } : undefined })),
};
