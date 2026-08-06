// Province options for the {name, value} shape the app's Dropdown expects.
// Shared so the party form and the lawyer address book can never drift apart.
//
// Matters, parties and lawyers all store the FULL NAME ("British Columbia").
// The two-letter code is what picks a data set — expense/income dropdowns, the
// court directory, the support tables — so `provinceCodeOf` is the one place
// that converts between the two. It is deliberately forgiving: the value it is
// handed may have been typed by a user, produced by the AI intake, or imported,
// so "BC", "bc", "B.C.", "British Columbia" and "Br. Columbia" all count.
export const PROVINCES = [
  { name: "Ontario", code: "ON", aliases: ["Ont"] },
  { name: "Quebec", code: "QC", aliases: ["Que", "PQ", "Québec"] },
  { name: "British Columbia", code: "BC", aliases: ["Br Columbia"] },
  { name: "Alberta", code: "AB", aliases: ["Alta", "Alb"] },
  { name: "Manitoba", code: "MB", aliases: ["Man"] },
  { name: "Saskatchewan", code: "SK", aliases: ["Sask"] },
  { name: "Nova Scotia", code: "NS", aliases: [] },
  { name: "New Brunswick", code: "NB", aliases: [] },
  {
    name: "Newfoundland and Labrador",
    code: "NL",
    aliases: ["Newfoundland", "Newfoundland Labrador", "Nfld", "NF"],
  },
  { name: "Prince Edward Island", code: "PE", aliases: ["PEI"] },
  { name: "Northwest Territories", code: "NT", aliases: ["NWT"] },
  { name: "Nunavut", code: "NU", aliases: [] },
  { name: "Yukon", code: "YT", aliases: ["Yukon Territory", "YK"] },
];

export const PROVINCE_LIST = PROVINCES.map(({ name }) => ({
  name,
  value: name,
}));

/** Letters only, upper case — "B.C." and " bc " both become "BC". */
const compact = (value) =>
  String(value ?? "")
    .toUpperCase()
    .replace(/[^A-Z]/g, "");

const CODE_BY_SPELLING = new Map();
PROVINCES.forEach(({ name, code, aliases }) => {
  [code, name, ...aliases].forEach((spelling) => {
    CODE_BY_SPELLING.set(compact(spelling), code);
  });
});

/** "British Columbia", "b.c." and "BC" all resolve to "BC"; junk gives "". */
export const provinceCodeOf = (value) =>
  CODE_BY_SPELLING.get(compact(value)) || "";

export default PROVINCE_LIST;
