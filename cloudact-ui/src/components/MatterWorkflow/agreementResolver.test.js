import { buildAgreementData, agreementOutstandingFields } from "./agreementResolver";
import { EMPTY_AGREEMENT_ANSWERS, applyAgreementPatch } from "./agreementSections";

const baseMatterData = {
  background: [
    { role: "Client", name: "Alex Doe", address: "565 Kanata Avenue" },
    { role: "Opposing Party", name: "Jane Doe", address: "250 Front St W, Toronto, ON" },
  ],
  relationship: [{ dateOfMarriage: "2000-06-30", placeOfMarriage: "Toronto", dateOfSeparation: "2025-06-30" }],
  children: [{ childName: "Mike Doe", dateOfBirth: "2010-06-30" }],
  assets: {},
  debts_liabilities: [],
};

describe("buildAgreementData", () => {
  it("resolves party identity, dates, and children straight from the matter snapshot", () => {
    const data = buildAgreementData({ matterData: baseMatterData, answers: EMPTY_AGREEMENT_ANSWERS });
    expect(data.party1.name).toBe("Alex Doe");
    expect(data.party2.name).toBe("Jane Doe");
    expect(data.dateOfMarriage).toBe("2000-06-30");
    expect(data.hasChildren).toBe(true);
    expect(data.children[0].name).toBe("Mike Doe");
  });

  it("has no children when none are on file, and every child-only field is left unresolved", () => {
    const data = buildAgreementData({
      matterData: { ...baseMatterData, children: [] },
      answers: EMPTY_AGREEMENT_ANSWERS,
    });
    expect(data.hasChildren).toBe(false);
  });

  it("prefers a resolved child-support report over the chat fallback", () => {
    const report = {
      calculationType: "child_support",
      resultData: { party1_name: "Alex Doe", party2_name: "Jane Doe", net_payer: "Alex Doe", net_monthly: 750 },
    };
    const data = buildAgreementData({
      matterData: baseMatterData,
      childSupportReport: report,
      answers: EMPTY_AGREEMENT_ANSWERS,
    });
    expect(data.childSupport.resolved).toBe(true);
    expect(data.childSupport.payer).toBe("Alex Doe");
    expect(data.childSupport.recipient).toBe("Jane Doe");
    expect(data.childSupport.amount).toBe(750);
  });

  it("falls back to the chat-collected ChildSupportFallback when no report is on file", () => {
    const answers = applyAgreementPatch(EMPTY_AGREEMENT_ANSWERS, {
      section: "ChildSupportFallback",
      data: { payer: "Alex Doe", recipient: "Jane Doe", amount: 600 },
    });
    const data = buildAgreementData({ matterData: baseMatterData, childSupportReport: null, answers });
    expect(data.childSupport.resolved).toBe(false);
    expect(data.childSupport.payer).toBe("Alex Doe");
    expect(data.childSupport.amount).toBe(600);
  });

  it("never resolves spousal support from a low/mid/high report that hasn't converged on one number", () => {
    const report = {
      calculationType: "spousal_support",
      resultData: { payor: "Alex Doe", monthly_low: 200, monthly_mid: 500, monthly_high: 800 },
    };
    const data = buildAgreementData({
      matterData: baseMatterData,
      spousalSupportReport: report,
      answers: EMPTY_AGREEMENT_ANSWERS,
    });
    expect(data.spousalSupport.resolved).toBe(false);
  });

  it("resolves spousal support when the three scenarios have already converged to one figure", () => {
    const report = {
      calculationType: "spousal_support",
      resultData: { payor: "Alex Doe", monthly_low: 500, monthly_mid: 500, monthly_high: 500 },
    };
    const data = buildAgreementData({
      matterData: baseMatterData,
      spousalSupportReport: report,
      answers: EMPTY_AGREEMENT_ANSWERS,
    });
    expect(data.spousalSupport.resolved).toBe(true);
    expect(data.spousalSupport.amount).toBe(500);
    expect(data.spousalSupport.payer).toBe("Alex Doe");
  });

  it("never resolves child support when the report's payer doesn't match either party's name", () => {
    // A stale/mismatched report (e.g. names edited on the matter after the
    // calculation ran) must fall back to chat rather than silently
    // attributing support to the wrong party.
    const report = {
      calculationType: "child_support",
      resultData: { party1_name: "Alex Doe", party2_name: "Jane Doe", net_payer: "Someone Else", net_monthly: 750 },
    };
    const data = buildAgreementData({ matterData: baseMatterData, childSupportReport: report, answers: EMPTY_AGREEMENT_ANSWERS });
    expect(data.childSupport.resolved).toBe(false);
  });

  it("never resolves child support from a report missing net_payer or net_monthly", () => {
    const report = { calculationType: "child_support", resultData: { party1_name: "Alex Doe", party2_name: "Jane Doe" } };
    const data = buildAgreementData({ matterData: baseMatterData, childSupportReport: report, answers: EMPTY_AGREEMENT_ANSWERS });
    expect(data.childSupport.resolved).toBe(false);
    expect(data.childSupport.payer).toBe("");
  });

  it("does not crash when no calculation report exists at all (undefined, not null)", () => {
    expect(() =>
      buildAgreementData({ matterData: baseMatterData, childSupportReport: undefined, spousalSupportReport: undefined, answers: EMPTY_AGREEMENT_ANSWERS })
    ).not.toThrow();
  });

  it("never resolves spousal support from non-numeric scenario values", () => {
    const report = {
      calculationType: "spousal_support",
      resultData: { payor: "Alex Doe", monthly_low: "N/A", monthly_mid: "N/A", monthly_high: "N/A" },
    };
    const data = buildAgreementData({ matterData: baseMatterData, spousalSupportReport: report, answers: EMPTY_AGREEMENT_ANSWERS });
    expect(data.spousalSupport.resolved).toBe(false);
  });

  it("never resolves spousal support from a report with no payor", () => {
    const report = { calculationType: "spousal_support", resultData: { monthly_low: 500, monthly_mid: 500, monthly_high: 500 } };
    const data = buildAgreementData({ matterData: baseMatterData, spousalSupportReport: report, answers: EMPTY_AGREEMENT_ANSWERS });
    expect(data.spousalSupport.resolved).toBe(false);
  });

  it("never resolves spousal support from a converged-but-zero amount", () => {
    const report = { calculationType: "spousal_support", resultData: { payor: "Alex Doe", monthly_low: 0, monthly_mid: 0, monthly_high: 0 } };
    const data = buildAgreementData({ matterData: baseMatterData, spousalSupportReport: report, answers: EMPTY_AGREEMENT_ANSWERS });
    expect(data.spousalSupport.resolved).toBe(false);
  });

  it("does not crash when a child has no date of birth on file", () => {
    const data = buildAgreementData({
      matterData: { ...baseMatterData, children: [{ childName: "Mike Doe" }] },
      answers: EMPTY_AGREEMENT_ANSWERS,
    });
    expect(data.children[0].dateOfBirth).toBe("");
  });

  it("treats a non-object assets value as no assets on file, rather than throwing", () => {
    const data = buildAgreementData({
      matterData: { ...baseMatterData, assets: null },
      answers: EMPTY_AGREEMENT_ANSWERS,
    });
    expect(data.assets.onFile).toEqual([]);
  });
});

describe("agreementOutstandingFields", () => {
  it("does not ask about children's topics when the matter has no children", () => {
    const data = buildAgreementData({
      matterData: { ...baseMatterData, children: [] },
      answers: EMPTY_AGREEMENT_ANSWERS,
    });
    const outstanding = agreementOutstandingFields(data).map((f) => f.key);
    expect(outstanding).not.toContain("childSupport");
    expect(outstanding).not.toContain("decisionMaking");
    expect(outstanding).not.toContain("visitation");
  });

  it("stops asking about spousal support once it's answered as not included", () => {
    const answers = applyAgreementPatch(EMPTY_AGREEMENT_ANSWERS, {
      section: "SpousalSupportFallback",
      data: { include: false },
    });
    const data = buildAgreementData({ matterData: baseMatterData, answers });
    const outstanding = agreementOutstandingFields(data).map((f) => f.key);
    expect(outstanding).not.toContain("spousalSupport");
  });

  it("stops asking about assets once each party's flag is answered, even with an empty list", () => {
    let answers = applyAgreementPatch(EMPTY_AGREEMENT_ANSWERS, {
      section: "Assets",
      data: { party1: { hasKeptAssets: false } },
    });
    answers = applyAgreementPatch(answers, { section: "Assets", data: { party2: { hasKeptAssets: false } } });
    answers = applyAgreementPatch(answers, { section: "Assets", data: { joint: { hasJointAssets: false } } });
    const data = buildAgreementData({ matterData: baseMatterData, answers });
    const outstanding = agreementOutstandingFields(data).map((f) => f.key);
    expect(outstanding).not.toContain("assetsParty1");
    expect(outstanding).not.toContain("assetsParty2");
    expect(outstanding).not.toContain("assetsJoint");
  });

  it("stops asking about the matrimonial home once answered No, but keeps asking once answered Yes until a branch is picked", () => {
    let answers = applyAgreementPatch(EMPTY_AGREEMENT_ANSWERS, {
      section: "MatrimonialHome",
      data: { hasSharedHome: false },
    });
    let data = buildAgreementData({ matterData: baseMatterData, answers });
    expect(agreementOutstandingFields(data).map((f) => f.key)).not.toContain("matrimonialHome");

    answers = applyAgreementPatch(EMPTY_AGREEMENT_ANSWERS, {
      section: "MatrimonialHome",
      data: { hasSharedHome: true, address: "1 Elm St" },
    });
    data = buildAgreementData({ matterData: baseMatterData, answers });
    // Confirmed there IS a shared home, but selling-vs-transferring hasn't
    // been chosen yet — still outstanding.
    expect(agreementOutstandingFields(data).map((f) => f.key)).toContain("matrimonialHome");
  });

  it("still asks for child support's payment day once the payer/recipient/amount resolve from a report", () => {
    const report = {
      calculationType: "child_support",
      resultData: { party1_name: "Alex Doe", party2_name: "Jane Doe", net_payer: "Alex Doe", net_monthly: 750 },
    };
    const data = buildAgreementData({ matterData: baseMatterData, childSupportReport: report, answers: EMPTY_AGREEMENT_ANSWERS });
    expect(data.childSupport.resolved).toBe(true);
    const field = agreementOutstandingFields(data).find((f) => f.key === "childSupport");
    expect(field).toBeDefined();
    expect(field.label).toBe("Day of the month child support payments begin");
  });

  it("equalization stays outstanding until include is explicitly answered true or false", () => {
    const data = buildAgreementData({ matterData: baseMatterData, answers: EMPTY_AGREEMENT_ANSWERS });
    expect(agreementOutstandingFields(data).map((f) => f.key)).toContain("equalization");

    const declined = buildAgreementData({
      matterData: baseMatterData,
      answers: applyAgreementPatch(EMPTY_AGREEMENT_ANSWERS, { section: "Equalization", data: { include: false } }),
    });
    expect(agreementOutstandingFields(declined).map((f) => f.key)).not.toContain("equalization");
  });
});
