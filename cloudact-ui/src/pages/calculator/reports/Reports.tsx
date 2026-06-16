import { forwardRef } from "react";
import { backgroundState } from "../Calculator";
import {
  aboutTheRelationshipState,
  aboutYourChildrenState,
} from "../screen1/Screen1";

// @ts-ignore
import ReportWrapper from "./ReportWrapper.tsx";
// @ts-ignore
import Reports1 from "./reports1/index.tsx";
// @ts-ignore
import Reports2 from "./reports2/index.tsx";
// @ts-ignore
import Reports3 from "./reports3/index.tsx";
// @ts-ignore
import Reports4 from "./reports4/index.tsx";
// @ts-ignore
import Reports5 from "./reports5/index.tsx";
// @ts-ignore
import Reports6 from "./reports6/index.tsx";
// @ts-ignore
import Reports7 from "./reports7/index.tsx";
// @ts-ignore
import Reports8 from "./spousalSupportQuantumA/index.tsx";
// @ts-ignore
import ReportsCover from "./reportCover/index.tsx";
import Reports6a from "./reports6a";
import Reports9 from "./reports9";
import Reports10 from "./reports10";

type Props = {
  background: backgroundState;
  aboutTheRelationship: aboutTheRelationshipState;
  aboutTheChildren: aboutYourChildrenState;
};

const Reports = forwardRef(({ data }: Props, ref) => {
  //api pull data
  console.log("data in reports", data, ref);
  const reportType = data.report_type;
  const calculatorType = data.calculator_type;


  return data ? (
    <div id="calculator_reports_print" ref={ref}>
      <ReportWrapper data={data} page={0} elem={"Page"}>
        <ReportsCover data={data} />
      </ReportWrapper>

      <ReportWrapper data={data} page={1} elem={"Page"}>
        <Reports1 data={data} />
      </ReportWrapper>

      <ReportWrapper data={data} page={2} elem={"Page"}>
        <Reports2 data={data} />
      </ReportWrapper>



{/* report logic */}
{/* {
reportType == "" && 
} */}

      <ReportWrapper data={data} page={9} elem={"Page"}>

        <Reports8 data={data} />


      </ReportWrapper>

      <ReportWrapper data={data} page={3} elem={"Page"}>
        <Reports3 data={data} />
      </ReportWrapper>
      <ReportWrapper data={data} page={4} elem={"Page"}>
        <Reports4 data={data} />
      </ReportWrapper>
      <ReportWrapper data={data} page={5} elem={"Page"}>
        <Reports5 data={data} />
      </ReportWrapper>

      {
        (data?.undueHardship?.party1 || data?.undueHardship?.party2) &&
        <ReportWrapper data={data} page={5} elem={"Page"}>
          <Reports10 data={data} />
        </ReportWrapper>
      }


      {
        data?.restructioring && <ReportWrapper data={data} page={9} elem={"Page"}>
          <Reports9 data={data} />
        </ReportWrapper>
      }



      <ReportWrapper data={data} page={6} elem={"Page"}>
        <Reports6 data={data} />
      </ReportWrapper>



      <ReportWrapper data={data} page={7} elem={"Page"}>
        <Reports6a data={data} />
      </ReportWrapper>

      <ReportWrapper data={data} page={8} elem={"Page"}>
        <Reports7 data={data} />
      </ReportWrapper>
    </div>
  ) : null;
});

export default Reports;
