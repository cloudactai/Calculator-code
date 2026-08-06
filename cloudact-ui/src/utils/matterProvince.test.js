import { provinceCodeOf } from "./canadianProvinces";
import { matterProvinceCode } from "./matterProvince";

test("province names, codes and sloppy spellings all resolve to a code", () => {
  expect(provinceCodeOf("Ontario")).toBe("ON");
  expect(provinceCodeOf("British Columbia")).toBe("BC");
  expect(provinceCodeOf("british columbia")).toBe("BC");
  expect(provinceCodeOf("B.C.")).toBe("BC");
  expect(provinceCodeOf("bc")).toBe("BC");
  expect(provinceCodeOf(" BC ")).toBe("BC");
  expect(provinceCodeOf("Newfoundland and Labrador")).toBe("NL");
  expect(provinceCodeOf("Nfld")).toBe("NL");
  expect(provinceCodeOf("PEI")).toBe("PE");
  expect(provinceCodeOf("N.W.T.")).toBe("NT");
  expect(provinceCodeOf("Ont.")).toBe("ON");
  expect(provinceCodeOf("Québec")).toBe("QC");
  expect(provinceCodeOf("")).toBe("");
  expect(provinceCodeOf(undefined)).toBe("");
  expect(provinceCodeOf("Nowhere")).toBe("");
});

test("Background's client province is the authority", () => {
  // The reported bug: a BC matter opened by an Ontario login.
  const matterData = {
    background: [
      { role: "Opposing Party", province: "Alberta" },
      { role: "Client", province: "British Columbia" },
    ],
  };
  expect(matterProvinceCode(matterData, "ON")).toBe("BC");

  // The matter header is a separate field, set once at creation — Background
  // wins when the two disagree.
  expect(matterProvinceCode({ ...matterData, province: "Ontario" }, "ON")).toBe("BC");
});

test("the matter header is the fallback when Background has no province", () => {
  expect(matterProvinceCode({ province: "British Columbia" }, "ON")).toBe("BC");
  expect(
    matterProvinceCode(
      { province: "British Columbia", background: [{ role: "Client", name: "Sam" }] },
      "ON"
    )
  ).toBe("BC");
});

test("falls back to the user, then to Ontario", () => {
  expect(matterProvinceCode({}, "BC")).toBe("BC");
  expect(matterProvinceCode({}, "")).toBe("ON");
  expect(matterProvinceCode(null, undefined)).toBe("ON");
  expect(matterProvinceCode({ province: "" }, "not a province")).toBe("ON");
});
