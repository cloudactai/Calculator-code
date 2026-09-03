import React from "react";
import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import SeparationAgreementDocument from "./SeparationAgreementDocument";
import { buildAgreementData } from "./agreementResolver";
import { applyAgreementPatch, EMPTY_AGREEMENT_ANSWERS } from "./agreementSections";

/**
 * Renders through the real buildAgreementData() rather than hand-built
 * fixtures, so these tests catch drift at the boundary between the resolver's
 * output shape and what the document component actually reads — the same
 * boundary a hand-rolled fixture would silently paper over if one side
 * changed without the other.
 */
const baseMatterData = {
  background: [
    { role: "Client", name: "Alex Doe", address: "565 Kanata Avenue" },
    { role: "Opposing Party", name: "Jane Doe", address: "250 Front St W" },
  ],
  relationship: [{ dateOfMarriage: "2000-06-30", placeOfMarriage: "Toronto", dateOfSeparation: "2025-06-30" }],
  children: [],
  assets: {},
  debts_liabilities: [],
};

const withChildren = {
  ...baseMatterData,
  children: [{ childName: "Mike Doe", dateOfBirth: "2024-06-30" }],
};

function patch(answers, section, data) {
  return applyAgreementPatch(answers, { section, data });
}

function renderDoc({ matterData = baseMatterData, answers = EMPTY_AGREEMENT_ANSWERS } = {}) {
  const agreementData = buildAgreementData({ matterData, answers });
  return render(<SeparationAgreementDocument agreementData={agreementData} />);
}

describe("SeparationAgreementDocument", () => {
  it("renders nothing when agreementData is null", () => {
    const { container } = render(<SeparationAgreementDocument agreementData={null} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("shows orange placeholders for unanswered party addresses, and no such placeholder when names are on file", () => {
    const namesNoAddresses = {
      ...baseMatterData,
      background: [
        { role: "Client", name: "Alex Doe" },
        { role: "Opposing Party", name: "Jane Doe" },
      ],
    };
    renderDoc({ matterData: namesNoAddresses });
    expect(screen.getAllByText("[Party 1 address]").length).toBeGreaterThan(0);
    expect(screen.getAllByText("[Party 2 address]").length).toBeGreaterThan(0);
    // Names ARE on file here, so no "[Party 1 name]" placeholder should appear.
    expect(screen.queryByText("[Party 1 name]")).not.toBeInTheDocument();
  });

  it("uses the literal 'Party 1'/'Party 2' fallback (not an orange placeholder) when a name is genuinely unset", () => {
    const noNamesOrAddresses = {
      ...baseMatterData,
      background: [{ role: "Client" }, { role: "Opposing Party" }],
    };
    const { container } = renderDoc({ matterData: noNamesOrAddresses });
    expect(screen.getAllByText("Party 1").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Party 2").length).toBeGreaterThan(0);
    // Documented, intentional asymmetry: the name falls back to a plain
    // label while the address next to it still shows the orange
    // "unanswered" placeholder — captured here so a future change to either
    // behavior is a deliberate decision, not a silent regression.
    const placeholders = container.querySelectorAll(".ad-placeholder");
    const placeholderTexts = Array.from(placeholders).map((el) => el.textContent);
    expect(placeholderTexts).not.toContain("Party 1");
    expect(placeholderTexts).toContain("[Party 1 address]");
  });

  it("omits every children-only section when the matter has no children", () => {
    renderDoc();
    expect(screen.queryByText("Children")).not.toBeInTheDocument();
    expect(screen.queryByText("Child Support")).not.toBeInTheDocument();
    expect(screen.queryByText(/Parenting Time for/)).not.toBeInTheDocument();
    expect(screen.queryByText(/Visiting Schedule/)).not.toBeInTheDocument();
    expect(screen.queryByText("Decision-Making Responsibility")).not.toBeInTheDocument();
  });

  it("shows Children/Child Support once there are children, even with nothing else answered yet", () => {
    renderDoc({ matterData: withChildren });
    expect(screen.getByText("Children")).toBeInTheDocument();
    expect(screen.getByText("Child Support")).toBeInTheDocument();
    expect(screen.getByText("Yes, child support will be paid")).toBeInTheDocument();
    // "Mike Doe" sits inside a longer "Name of the Child: Mike Doe" text
    // node, so match by substring rather than the exact-text default.
    expect(screen.getByText(/Name of the Child: Mike Doe/)).toBeInTheDocument();
    // But the two schedule-dependent sections stay hidden until answered.
    expect(screen.queryByText(/Parenting Time for/)).not.toBeInTheDocument();
    expect(screen.queryByText(/Visiting Schedule/)).not.toBeInTheDocument();
  });

  it("shows a child's own placeholders when its name/DOB are missing, without crashing", () => {
    const blankChild = { ...withChildren, children: [{}] };
    renderDoc({ matterData: blankChild });
    expect(screen.getByText("[name]")).toBeInTheDocument();
    expect(screen.getByText("[date of birth]")).toBeInTheDocument();
  });

  it("shows only the parenting-time section for the party that was actually answered", () => {
    let answers = patch(EMPTY_AGREEMENT_ANSWERS, "ParentingTime", {
      party1: { include: true, schedule: "Weekends with Alex" },
    });
    renderDoc({ matterData: withChildren, answers });
    expect(screen.getByText("Parenting Time for Alex Doe")).toBeInTheDocument();
    expect(screen.queryByText("Parenting Time for Jane Doe")).not.toBeInTheDocument();
    expect(screen.getByText("PARENTING SCHEDULE")).toBeInTheDocument();
    expect(screen.queryByText("PARENTING TIME")).not.toBeInTheDocument();
  });

  it("renders the exact joint decision-making paragraphs only when the answer actually says 'joint'", () => {
    let answers = patch(EMPTY_AGREEMENT_ANSWERS, "DecisionMaking", { responsibility: "Joint custody" });
    renderDoc({ matterData: withChildren, answers });
    expect(
      screen.getByText(/shall share joint and equal decision-making responsibility/)
    ).toBeInTheDocument();
  });

  it("falls back to the substituted sentence (with the answer visible) for a non-joint arrangement", () => {
    let answers = patch(EMPTY_AGREEMENT_ANSWERS, "DecisionMaking", { responsibility: "Party 1 sole" });
    renderDoc({ matterData: withChildren, answers });
    expect(
      screen.queryByText(/shall share joint and equal decision-making responsibility/)
    ).not.toBeInTheDocument();
    expect(screen.getByText(/Party 1 sole/)).toBeInTheDocument();
  });

  it("shows the decision-making placeholder, not the joint text, before the question is answered", () => {
    renderDoc({ matterData: withChildren });
    expect(
      screen.queryByText(/shall share joint and equal decision-making responsibility/)
    ).not.toBeInTheDocument();
    expect(screen.getByText("[decision-making arrangement]")).toBeInTheDocument();
  });

  it("hides Spousal Support until include is explicitly true, and never guesses a value", () => {
    const { rerender, container } = renderDoc();
    expect(screen.queryByText("Spousal Support")).not.toBeInTheDocument();

    let answers = patch(EMPTY_AGREEMENT_ANSWERS, "SpousalSupportFallback", { include: true, payer: "Alex Doe", amount: 500 });
    answers = patch(answers, "SpousalSupport", { paymentStartDay: "1st", recipient: "Jane Doe" });
    const agreementData = buildAgreementData({ matterData: baseMatterData, answers });
    rerender(<SeparationAgreementDocument agreementData={agreementData} />);
    expect(screen.getByText("Spousal Support")).toBeInTheDocument();
    // "$" and "500" are separate text nodes ("in the amount of $" followed by
    // a <span>500</span>), so assert on the paragraph's combined text.
    expect(container.textContent).toContain("in the amount of $500");
  });

  it("hides Matrimonial Home until a shared home is confirmed, and shows only the matching sale/transfer branch", () => {
    let answers = patch(EMPTY_AGREEMENT_ANSWERS, "MatrimonialHome", {
      hasSharedHome: true,
      address: "1 Elm St",
      sellingOrTransferring: "selling",
      saleProceedsSharing: "50/50",
      recipientName: "Alex Doe",
      amount: 10000,
    });
    renderDoc({ answers });
    expect(screen.getByText("Matrimonial Home")).toBeInTheDocument();
    expect(screen.getByText(/The Matrimonial Home shall be sold/)).toBeInTheDocument();
    expect(screen.queryByText(/shall receive exclusive ownership/)).not.toBeInTheDocument();
  });

  it("shows neither sale nor transfer clause when a shared home is confirmed but the branch hasn't been picked yet", () => {
    let answers = patch(EMPTY_AGREEMENT_ANSWERS, "MatrimonialHome", { hasSharedHome: true, address: "1 Elm St" });
    renderDoc({ answers });
    expect(screen.getByText("Matrimonial Home")).toBeInTheDocument();
    expect(screen.queryByText(/shall be sold/)).not.toBeInTheDocument();
    expect(screen.queryByText(/shall receive exclusive ownership/)).not.toBeInTheDocument();
  });

  it("Equalization: shows the payment clause only when include is true", () => {
    let answers = patch(EMPTY_AGREEMENT_ANSWERS, "Equalization", {
      include: true,
      payer: "Alex Doe",
      recipient: "Jane Doe",
      amount: 15000,
      paymentDate: "2026-12-31",
    });
    renderDoc({ answers });
    expect(screen.getByText(/an equalization payment shall be made/)).toBeInTheDocument();
    expect(screen.queryByText(/waives any right to equalization/)).not.toBeInTheDocument();
  });

  it("Equalization: shows the waiver clause only when include is explicitly false", () => {
    let answers = patch(EMPTY_AGREEMENT_ANSWERS, "Equalization", { include: false });
    renderDoc({ answers });
    expect(screen.getByText(/waives any right to equalization/)).toBeInTheDocument();
    expect(screen.queryByText(/an equalization payment shall be made/)).not.toBeInTheDocument();
  });

  it("Equalization: asserts neither payment nor waiver language before the question is answered (regression guard)", () => {
    // Regression guard: this used to be a plain ternary that treated the
    // unanswered (null) state as falsy and silently rendered definitive
    // waiver language — asserting a legal right had been waived before the
    // lawyer had ever been asked. Neither clause should render here.
    renderDoc();
    expect(screen.queryByText(/waives any right to equalization/)).not.toBeInTheDocument();
    expect(screen.queryByText(/an equalization payment shall be made/)).not.toBeInTheDocument();
    expect(screen.getByText("[whether equalization applies is not yet answered]")).toBeInTheDocument();
  });

  it("Assets: shows an empty-list note (not a blank table) when a party kept assets but none are itemized yet", () => {
    let answers = patch(EMPTY_AGREEMENT_ANSWERS, "Assets", { party1: { hasKeptAssets: true } });
    const { container } = renderDoc({ answers });
    expect(screen.getByText(/Acknowledgement of Exclusive Assets of/)).toBeInTheDocument();
    expect(screen.getByText("[asset list to be completed]")).toBeInTheDocument();
    expect(container.querySelector(".ad-empty-note")).toBeInTheDocument();
  });

  it("Assets: lists itemized assets once provided, and stays hidden for a party with none kept", () => {
    let answers = patch(EMPTY_AGREEMENT_ANSWERS, "Assets", {
      party1: { hasKeptAssets: true, items: [{ type: "Truck", value: 50000 }] },
      party2: { hasKeptAssets: false },
    });
    renderDoc({ answers });
    expect(screen.getByText(/Asset Type: Truck Asset Value: \$50000/)).toBeInTheDocument();
    expect(screen.getByText("Acknowledgement of Exclusive Assets of Alex Doe")).toBeInTheDocument();
    expect(screen.queryByText("Acknowledgement of Exclusive Assets of Jane Doe")).not.toBeInTheDocument();
  });

  it("Debts: the general responsibility clause always renders; the joint-debt block only when confirmed", () => {
    renderDoc();
    expect(screen.getByText("Responsibility for Debts and Liabilities")).toBeInTheDocument();
    expect(screen.queryByText(/jointly held or mutually agreed to be shared/)).not.toBeInTheDocument();

    let answers = patch(EMPTY_AGREEMENT_ANSWERS, "Debts", { hasJointDebts: true, items: [{ type: "Mortgage", amount: 20000 }] });
    renderDoc({ answers });
    expect(screen.getByText(/Type of Debt: Mortgage Amount of Debt: 20000/)).toBeInTheDocument();
  });

  it("always renders the fixed sections regardless of any answer state", () => {
    renderDoc();
    for (const heading of [
      "Background",
      "Terms of Agreement",
      "Division of Assets and Property",
      "Equalization of Net Family Property",
      "Debts and Liabilities",
      "Signatures",
    ]) {
      expect(screen.getByText(heading)).toBeInTheDocument();
    }
  });

  it("renders top-level headings visually as-typed in the JSX, capitalized only via CSS text-transform (not baked into the text itself)", () => {
    // The heading text content is Title Case in the markup ("Background") —
    // the ALL-CAPS look the source docx uses comes from the .ad-heading
    // CSS rule (text-transform: uppercase), not from the string itself. If
    // that CSS rule were ever dropped again, this is the assertion that
    // would need updating to catch it, so the reasoning is on record here.
    renderDoc();
    expect(screen.getByText("Background")).toBeInTheDocument();
    expect(screen.getByText("Background").tagName).toBe("H2");
  });

  it("gives 'BETWEEN:' and 'AND' different classes, matching their different styling in the source (BETWEEN: 18pt bold, AND 12pt regular)", () => {
    const { container } = renderDoc();
    expect(container.querySelector(".ad-between").textContent).toBe("BETWEEN:");
    expect(container.querySelector(".ad-and").textContent).toBe("AND");
  });

  it("keeps an invalid date string on screen verbatim rather than crashing or blanking it", () => {
    let answers = EMPTY_AGREEMENT_ANSWERS;
    const weirdMatterData = {
      ...baseMatterData,
      relationship: [{ dateOfMarriage: "not-a-real-date", placeOfMarriage: "Toronto", dateOfSeparation: "2025-06-30" }],
    };
    renderDoc({ matterData: weirdMatterData, answers });
    expect(screen.getByText(/not-a-real-date/)).toBeInTheDocument();
  });

  it("does not throw when matterData is entirely empty", () => {
    expect(() => renderDoc({ matterData: {} })).not.toThrow();
  });
});
