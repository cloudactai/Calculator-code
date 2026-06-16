import { Image } from "react-bootstrap";
import NumberFormat from "react-number-format";
import { Link } from "react-router-dom";
import { AUTH_ROUTES } from "../../../routes/Routes.types";
import {
  dateDiff,
  getProviveFromSuffice,
} from "../../../utils/helpers";
import CONSTANTS from "../TollTipConstants";
import InfoIcon from "@mui/icons-material/Info";
import OverlayTrigger from "react-bootstrap/OverlayTrigger";
import Tooltip from "react-bootstrap/Tooltip";
import { getSvg } from "../assets/Svgs";

type Props = {
  activeFormNumber: number;
  calculatorId: number;
  activeForm1Data: any;
  activeForm2Data: any;
  activeForm3Data: any;
  typeOfCalculatorSelected: any;
};

const StepNumber = ({
  activeFormNumber,
  calculatorId,
  activeForm1Data,
  activeForm2Data,
  activeForm3Data,
  typeOfCalculatorSelected,
}: Props) => {
  return (
    <div className="statusSteps topSpace">
      <span className="h5 mb-4">
        {getSvg('The Calculation')}
        
        The Calculation
      </span>

      {/* <h4>The Calculation</h4> */}
      <div
        className={`${activeFormNumber === 1 ? "active" : ""} ${
          activeFormNumber === 2 ||
          activeFormNumber === 3 ||
          activeFormNumber === 4
            ? "done"
            : ""
        }`}
      >
        {activeFormNumber === 2 ||
        activeFormNumber === 3 ||
        activeFormNumber === 4 ? (
          <Link
            to={`${
             AUTH_ROUTES.CALCULATOR
            }?id=${calculatorId}&step=1`}
          >
            Background and Children
          </Link>
        ) : (
          <>Background and Children</>
        )}
        {activeForm1Data?.background?.party1FirstName && (
          <>
            <ActiveForm1DataElement activeForm1Data={{ ...activeForm1Data }} />
          </>
        )}
      </div>
      <div
        className={`${activeFormNumber === 2 ? "active" : ""} ${
          activeFormNumber === 3 || activeFormNumber === 4 ? "done" : ""
        }`}
      >
        {activeFormNumber === 3 || activeFormNumber === 4 ? (
          <Link
            to={`${
             AUTH_ROUTES.CALCULATOR
            }?id=${calculatorId}&step=2`}
          >
            Income and Taxes
          </Link>
        ) : (
          <>Income and Taxes</>
        )}
        {activeForm2Data && (
          <ActiveForm2DataElement activeForm2Data={activeForm2Data} />
        )}
      </div>
      <div className={`${activeFormNumber === 4 ? "active" : ""}`}>
        Result
        <ActiveForm3DataElement
          activeForm3Data={activeForm3Data}
          typeOfCalculatorSelected={typeOfCalculatorSelected}
        />
      </div>
    </div>
  );
};

const ActiveForm1DataElement = ({ activeForm1Data }: any) => {
  return (
    <>
      {/* <p data-toggle="tooltip" data-placement="left" title={CONSTANTS.background_party1} style={{cursor:"pointer" }} > */}

      <OverlayTrigger
        placement="left"
        overlay={
          <Tooltip id="tooltip-left">{CONSTANTS.background_party1}</Tooltip>
        }
      >
        {/* <InfoIcon fontSize='small' style={{color:"grey"}}/>  */}

        <span className="info">
          {getSvg('dateDiffyrs')}
          {/* <p data-toggle="tooltip" data-placement="left" title={CONSTANTS.background_party1} style={{cursor:"pointer"}}><InfoIcon/></p> */}
        
          {/* <p data-toggle="tooltip" data-placement="left" title={CONSTANTS.background_party1} style={{cursor:"pointer"}} > */}
          {activeForm1Data?.background?.party1FirstName}
          <br />
          {activeForm1Data?.background?.party1DateOfBirth &&
            dateDiff(activeForm1Data?.background?.party1DateOfBirth, new Date())
              .year}{" "}
          yrs /{" "}
          {getProviveFromSuffice(activeForm1Data?.background?.party1province)}
        </span>
      </OverlayTrigger>

      <span className="info">
        {getSvg('yrs_province')}
     
        {activeForm1Data?.background?.party2FirstName} <br />
        {activeForm1Data?.background?.party2DateOfBirth &&
          dateDiff(activeForm1Data?.background?.party2DateOfBirth, new Date())
            .year}{" "}
        yrs / {getProviveFromSuffice(activeForm1Data.background.party2province)}
      </span>
      <span className="info">
        {getSvg('year relationship checkout')}
      
        {activeForm1Data?.aboutTheRelationship?.dateOfMarriage &&
          dateDiff(
            activeForm1Data?.aboutTheRelationship?.dateOfMarriage,
            activeForm1Data?.aboutTheRelationship?.dateOfSeparation
          ).year}{" "}
        year relationship
      </span>
      {!!activeForm1Data?.aboutTheChildren?.childrenInfo.length &&
        activeForm1Data?.aboutTheChildren?.childrenInfo.map((child: any) => (
          <>
            <OverlayTrigger
              placement="left"
              overlay={
                <Tooltip id="tooltip-left">
                  {CONSTANTS.background_child1}
                </Tooltip>
              }
            >
              {/* <p data-toggle="tooltip" data-placement="left" title={CONSTANTS.background_child1} style={{cursor:"pointer"}} > */}

              <span className="info">
                {getSvg('yrs / lives with checkout')}
               
                {child.name} <br />
                {child?.dateOfBirth &&
                  dateDiff(child?.dateOfBirth, new Date()).year}{" "}
                yrs / lives with {child?.custodyArrangement}
              </span>
            </OverlayTrigger>

            {/* </p> */}
          </>
        ))}
    </>
  );
};

const ActiveForm2DataElement = ({ activeForm2Data }: any) => {
  const clientIncome = parseInt(
    activeForm2Data?.screen2?.income?.party1[0].amount
  );
  const opposingPartyIncome = parseInt(
    activeForm2Data?.screen2?.income?.party2[0].amount
  );
  return (
    <>
      <span className="info">
    
        {getSvg("Client")}
        Client: ${clientIncome.toLocaleString()}
      </span>
      <span className="info">
      

        {getSvg("Opposing Party")}
        Opposing Party: ${opposingPartyIncome.toLocaleString()}
      </span>
    </>
  );
};

const ActiveForm3DataElement = ({
  activeForm3Data,
  typeOfCalculatorSelected,
}: any) => {
  return (
    <>
      {/* uncomment if you conditionly render child calculation */}
      {/* {
       typeOfCalculatorSelected == 'CHILD_SUPPORT_CAL' 
    } */}
      <span className="info">
        {/* child support info 1:22 */}

        {getSvg('Child SupportCheckout')}
        Child Support: $
        {activeForm3Data?.allPropsScreen4?.screen2?.childSupport
          ?.childSupport1 &&
          Math.floor(
            Math.max(
              activeForm3Data?.allPropsScreen4?.screen2?.childSupport
                ?.childSupport1,
              activeForm3Data?.allPropsScreen4?.screen2?.childSupport
                ?.childSupport2
            )
          ) / 12}
      </span>
      {activeForm3Data.typeOfCalculatorSelected !== "CHILD_SUPPORT_CAL" && (
        <>
          <span className="info">
            {getSvg('Spousal SupportCheckout')}
          
            Spousal Support: $
            {Math.floor(
              Math.min(
                activeForm3Data?.allPropsScreen4?.screen2?.spousalSupport
                  ?.spousalSupport1Low,
                activeForm3Data?.allPropsScreen4?.screen2?.spousalSupport
                  ?.spousalSupport1Med,
                activeForm3Data?.allPropsScreen4?.screen2?.spousalSupport
                  ?.spousalSupport1High
              )
            )}
            -$
            {Math.ceil(
              Math.max(
                activeForm3Data?.allPropsScreen4?.screen2?.spousalSupport
                  ?.spousalSupport2Low,
                activeForm3Data?.allPropsScreen4?.screen2?.spousalSupport
                  ?.spousalSupport2Med,
                activeForm3Data?.allPropsScreen4?.screen2?.spousalSupport
                  ?.spousalSupport2High
              )
            )}
          </span>
          <span className="info">
            {getSvg('Indefinite_Checkout')}
          
            {activeForm3Data?.allPropsScreen4?.screen2?.durationOfSupport?.slice(
              0,
              1
            ) > 9999999
              ? "Indefinite"
              : activeForm3Data?.allPropsScreen4?.screen2?.durationOfSupport?.slice(
                  0,
                  1
                ) +
                  activeForm3Data?.allPropsScreen4?.screen2?.durationOfSupport?.slice(
                    1,
                    2
                  ) >
                9999999
              ? ""
              : " - " +
                activeForm3Data?.allPropsScreen4?.screen2?.durationOfSupport?.slice(
                  1,
                  2
                ) +
                " yrs"}
          </span>
        </>
      )}
    </>
  );
};

export default StepNumber;
