// Lawyer address book CRUD (auth-server /v1/lawyers). The entries are per-user
// and outlive any single matter, so this is deliberately not part of the
// per-matter redux state - the modal owns its own list.
import { fetchRequest } from "../../fetchRequest";

// Every /v1 route answers with the legacy wrapper
// { data: { code, status, body } }; unwrap it in one place.
const unwrap = (response) => response?.data?.data?.body;

export const EMPTY_LAWYER = {
  name: "",
  address: "",
  municipality: "",
  province: "",
  postalCode: "",
  phone: "",
  email: "",
  memberOfFirm: true,
};

export const listLawyers = async () => {
  const body = unwrap(await fetchRequest("get", "lawyers"));
  return Array.isArray(body) ? body : [];
};

export const createLawyer = async (lawyer) =>
  unwrap(await fetchRequest("post", "lawyers", lawyer));

export const updateLawyer = async (id, lawyer) =>
  unwrap(await fetchRequest("put", `lawyers/${id}`, lawyer));

export const deleteLawyer = async (id) =>
  unwrap(await fetchRequest("delete", `lawyers/${id}`));

// Maps an address book entry onto the `lawyer*` keys the background form
// stores for a party. Single source of truth for the auto-fill, so the
// dropdown and the modal's "Insert Lawyer details" always agree.
export const lawyerToPartyFields = (lawyer) => ({
  lawyerName: lawyer?.name || "",
  lawyerAddress: lawyer?.address || "",
  lawyerMunicipality: lawyer?.municipality || "",
  lawyerPostalCode: lawyer?.postalCode || "",
  lawyerPhone: lawyer?.phone || "",
  lawyerEmail: lawyer?.email || "",
  lawyerProvince: lawyer?.province || "",
});
