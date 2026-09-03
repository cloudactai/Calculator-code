import {
  applyAgreementPatch,
  applyAgreementPatches,
  normalizeAgreementAnswers,
  EMPTY_AGREEMENT_ANSWERS,
} from "./agreementSections";

describe("normalizeAgreementAnswers", () => {
  it("fills in every section, including nested party keys, for a blank/undefined blob", () => {
    expect(normalizeAgreementAnswers(undefined)).toEqual(EMPTY_AGREEMENT_ANSWERS);
  });

  it("keeps existing values and still guarantees nested party keys exist", () => {
    const normalized = normalizeAgreementAnswers({
      DecisionMaking: { responsibility: "joint" },
      ParentingTime: { party1: { include: true, schedule: "weekends" } },
    });
    expect(normalized.DecisionMaking.responsibility).toBe("joint");
    expect(normalized.ParentingTime.party1).toEqual({ include: true, schedule: "weekends" });
    expect(normalized.ParentingTime.party2).toEqual({});
    expect(normalized.Assets.joint).toEqual({});
  });
});

describe("applyAgreementPatch", () => {
  it("merges a flat section patch onto the existing answers", () => {
    const answers = applyAgreementPatch(EMPTY_AGREEMENT_ANSWERS, {
      section: "DecisionMaking",
      data: { responsibility: "Party 1 sole" },
    });
    expect(answers.DecisionMaking).toEqual({ responsibility: "Party 1 sole" });
  });

  it("merges a nested-party patch without clobbering the other party's data", () => {
    let answers = applyAgreementPatch(EMPTY_AGREEMENT_ANSWERS, {
      section: "ParentingTime",
      data: { party1: { include: true, schedule: "Weekly" } },
    });
    answers = applyAgreementPatch(answers, {
      section: "ParentingTime",
      data: { party2: { include: false } },
    });
    expect(answers.ParentingTime.party1).toEqual({ include: true, schedule: "Weekly" });
    expect(answers.ParentingTime.party2).toEqual({ include: false });
  });

  it("replaces an item list wholesale rather than appending", () => {
    let answers = applyAgreementPatch(EMPTY_AGREEMENT_ANSWERS, {
      section: "Debts",
      data: { hasJointDebts: true, items: [{ type: "Mortgage", amount: 20000 }] },
    });
    answers = applyAgreementPatch(answers, {
      section: "Debts",
      data: { items: [{ type: "Mortgage", amount: 20000 }, { type: "Car loan", amount: 5000 }] },
    });
    expect(answers.Debts.items).toHaveLength(2);
    expect(answers.Debts.hasJointDebts).toBe(true);
  });

  it("ignores an unknown section name rather than throwing", () => {
    const answers = applyAgreementPatch(EMPTY_AGREEMENT_ANSWERS, {
      section: "NotARealSection",
      data: { anything: true },
    });
    expect(answers).toBe(EMPTY_AGREEMENT_ANSWERS);
  });

  it("ignores a patch missing data", () => {
    const answers = applyAgreementPatch(EMPTY_AGREEMENT_ANSWERS, { section: "Equalization" });
    expect(answers).toBe(EMPTY_AGREEMENT_ANSWERS);
  });
});

describe("applyAgreementPatches", () => {
  it("applies several saved_sections patches in order", () => {
    const answers = applyAgreementPatches(EMPTY_AGREEMENT_ANSWERS, [
      { section: "Equalization", data: { include: true, payer: "Party 1" } },
      { section: "Equalization", data: { recipient: "Party 2", amount: 10000 } },
    ]);
    expect(answers.Equalization).toEqual({
      include: true,
      payer: "Party 1",
      recipient: "Party 2",
      amount: 10000,
    });
  });

  it("tolerates a non-array input", () => {
    expect(applyAgreementPatches(EMPTY_AGREEMENT_ANSWERS, undefined)).toBe(EMPTY_AGREEMENT_ANSWERS);
  });
});
