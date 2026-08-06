import { provinceCodeOf } from "./canadianProvinces";

/**
 * Which province's data set a matter runs on, as a two-letter code.
 *
 * The forms used to read this off the signed-in user's cookie, which is the
 * firm's province, not the matter's — so a BC matter opened by an Ontario login
 * got Ontario expense and income dropdowns, and saved values the BC form cannot
 * render. What the matter says about itself is the authority:
 *
 *   1. the client's province as saved in Background — the intake asks for it,
 *      manual and AI both write it, and it is the one the parties' own forms
 *      are filled out on,
 *   2. failing that, the matter header's province (the New Matter modal), which
 *      is a separate field set once at creation and often left alone,
 *   3. failing that, the caller's fallback (the user cookie), still a better
 *      guess than nothing for a matter that has neither,
 *   4. Ontario, the platform default.
 *
 * Court forms are the deliberate exception and do NOT use this. Which province's
 * forms a matter gets is decided by the matter header's province alone (see
 * CreateNewFormPage) — that header is the jurisdiction the documents will be
 * filed in, and guessing it from a party's address would hand someone the wrong
 * court's paperwork. A matter with no header province is asked to set one rather
 * than being given a default set of forms.
 */
export function matterProvinceCode(matterData, fallback) {
  const backgroundRows = Array.isArray(matterData?.background)
    ? matterData.background
    : [];
  const clientRow = backgroundRows.find(
    (row) =>
      String(row?.role || "")
        .trim()
        .toLowerCase()
        .replace(/[^a-z]/g, "") === "client"
  );

  return (
    provinceCodeOf(clientRow?.province) ||
    provinceCodeOf(matterData?.province) ||
    provinceCodeOf(fallback) ||
    "ON"
  );
}

export default matterProvinceCode;
