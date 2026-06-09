import React from "react";
import { showElementForReportType } from "..";

const Reports7 = ({ data }: any) => {
  const reportType = data?.report_type;
  const calculatorType = data?.calculator_type;
  return (
    <>
      <div className="pagePDF">
        <span className="headingPDF">TERMS OF USE</span>
        <span className="textPDF" style={{ margin: "10px 0 0 0" }}>
          This support report was created using the Cloud Act support
          calculator. Please visit Cloud Act at ****** to learn more, or to
          perform your own support calculations. <br></br>
          <br></br>Calculations are current based on the laws and regulations in
          force as of the date the report was calculated. The Calculator applies
          the federal Child SupportGuidelines (“CSG”), which are legally binding
          in most provinces in Canada, and the federal Spousal Support Advisory
          Guidelines (“SSAG”), which are not legally binding but are widely used
          on an advisory basis. Note that actual taxes and benefits may vary
          based on interpretations and calculations performed by the Canada
          Revenue Agency or relevant provincial or territorial authorities.{" "}
          <br></br>
          <br></br>This calculation is only as reliable as the inputs provided
          by the user: if income, expenses, taxes or benefits are different than
          set out in page 1, the amount of support should be recalculated to
          reflect reality. <br></br>
          <br></br>Although the Calculator generates child and spousal support
          amounts, support is not automatically payable in all circumstances.
          Family law is extremely complex and there are many other factors and
          legal issues not considered by this Calculator that could dramatically
          affect child and spousal support. <br></br>
          <br></br>This report does not contain legal advice or establish a
          lawyer-client relationship. By using or referencing this report in any
          way, you agree to indemnify CloudAct for any loss, damages, costs, or
          expenses incurred by you or any third parties in relation to this
          report, howsoever arising, regardless of theory of liability.<br></br>
          <br></br> If you have questions or concerns regarding this support
          calculation, please contact us at ****.
        </span>
        <div className="paginationPDF">
          Page{" "}
          {showElementForReportType(
            calculatorType,
            reportType,
            8,
            "currentPage"
          )}{" "}
          of{" "}
          {showElementForReportType(
            calculatorType,
            reportType,
            "otherDetails",
            "totalPages"
          )}
        </div>
      </div>
    </>
  );
};

export default Reports7;
