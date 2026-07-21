function readPath(source, path) {
  return String(path || "")
    .replace(/\[(\d+)\]/g, ".$1")
    .split(".")
    .filter(Boolean)
    .reduce((value, key) => value == null ? undefined : value[key], source);
}

function resolveBinding(source, binding) {
  const paths = String(binding || "").split(",").map((path) => path.trim()).filter(Boolean);
  const values = paths.map((path) => readPath(source, path));
  if (values.length <= 1) return values[0];
  const cleaned = values.map((value) => (value == null ? "" : String(value)));
  // Don't emit bare separators (", ") when every joined part is empty.
  if (cleaned.every((value) => value.trim() === "")) return "";
  return cleaned.join(", ");
}

function parseStoredJson(value) {
  if (value && typeof value === "object") return value;
  if (typeof value !== "string" || !value.trim()) return {};
  try {
    const parsed = JSON.parse(value);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function supportType(calculation) {
  const value = `${calculation.type || ""} ${calculation.calculatorType || ""}`.toLowerCase();
  if (value.includes("child")) return "child";
  if (value.includes("spousal")) return "spousal";
  return null;
}

function prefillFields(data, mapping) {
  const fields = Array.isArray(mapping?.staticFields) ? mapping.staticFields : [];
  const values = {};
  const provenance = {};
  for (const field of fields) {
    if (!field?.id || !field.bind) continue;
    const value = resolveBinding(data, field.bind);
    if (value !== undefined && value !== null && value !== "") {
      values[field.id] = value;
      provenance[field.id] = "prefill";
    }
  }
  return { values, provenance };
}

module.exports = { parseStoredJson, prefillFields, readPath, resolveBinding, supportType };
