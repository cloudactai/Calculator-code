import React from "react";
import "@testing-library/jest-dom";
import { fireEvent, render, screen } from "@testing-library/react";
import AgreementTypeList from "./AgreementTypeList";

describe("AgreementTypeList", () => {
  it("lists the registry's available agreement types and reports a choice", () => {
    const onChoose = jest.fn();
    render(<AgreementTypeList matterName="Doe" onChoose={onChoose} onBack={() => {}} />);

    const card = screen.getByText("Separation Agreement").closest('[role="button"]');
    fireEvent.click(card);
    expect(onChoose).toHaveBeenCalledWith("separation_agreement");
  });

  it("calls onBack from the header button", () => {
    const onBack = jest.fn();
    render(<AgreementTypeList matterName="Doe" onChoose={() => {}} onBack={onBack} />);
    fireEvent.click(screen.getByText("Back to Tasks"));
    expect(onBack).toHaveBeenCalled();
  });
});
