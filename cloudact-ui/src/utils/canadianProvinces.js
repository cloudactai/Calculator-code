// Province options for the {name, value} shape the app's Dropdown expects.
// Shared so the party form and the lawyer address book can never drift apart.
export const PROVINCE_LIST = [
  "Ontario",
  "Quebec",
  "British Columbia",
  "Alberta",
  "Manitoba",
  "Saskatchewan",
  "Nova Scotia",
  "New Brunswick",
  "Newfoundland and Labrador",
  "Prince Edward Island",
  "Northwest Territories",
  "Nunavut",
  "Yukon",
].map((province) => ({ name: province, value: province }));

export default PROVINCE_LIST;
