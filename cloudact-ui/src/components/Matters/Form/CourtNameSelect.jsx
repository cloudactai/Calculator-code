import CreatableSelect from "react-select/creatable";
import { getCourtsForProvince, findCourtByName } from "../../../utils/matterData/courtDirectory";

/**
 * Searchable Court Name picker backed by the court directory.
 *
 * The list is long, so it is searchable; it is also creatable so a court that
 * is not in the directory can still be typed in (preserving the old free-text
 * behaviour). Selecting a directory court reports its address back so the
 * caller can auto-fill the Address field.
 *
 * Props:
 *   value    – current court name (string)
 *   province – optional province code used to scope the list (falls back to all)
 *   onChange – ({ name, court }) => void  (court is the directory entry or null)
 *   isDisabled – optional
 */
const selectStyles = {
  control: (base, state) => ({
    ...base,
    minHeight: 42,
    borderRadius: 8,
    borderColor: state.isFocused ? "#307ff4" : "rgba(115, 195, 253, 0.6)",
    boxShadow: "none",
    "&:hover": { borderColor: "#307ff4" },
  }),
  menuPortal: (base) => ({ ...base, zIndex: 9999 }),
  menu: (base) => ({ ...base, zIndex: 9999 }),
};

export default function CourtNameSelect({ value, province, onChange, isDisabled }) {
  const courts = getCourtsForProvince(province);
  const options = courts.map((c) => ({ value: c.name, label: c.name, court: c }));
  const current = value ? { value, label: value, court: findCourtByName(value) } : null;

  const handleChange = (option) => {
    if (!option) {
      onChange({ name: "", court: null });
      return;
    }
    const court = option.court || findCourtByName(option.value);
    onChange({ name: option.value, court: court || null });
  };

  return (
    <CreatableSelect
      classNamePrefix="court-select"
      isClearable
      isDisabled={isDisabled}
      placeholder="Search or enter court name"
      options={options}
      value={current}
      onChange={handleChange}
      styles={selectStyles}
      menuPortalTarget={typeof document !== "undefined" ? document.body : null}
    />
  );
}
