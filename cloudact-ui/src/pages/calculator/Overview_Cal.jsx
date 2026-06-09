import { Fade, Paper, Popper, Step, StepLabel, Stepper } from '@mui/material'
import React, { useMemo, useState } from 'react'
import { FaMoneyBill } from 'react-icons/fa'
import { File, FileAnalytics, User } from "tabler-icons-react"
import { formatNumberInThousands } from '../../utils/helpers/Formatting'
import { momentFunction } from '../../utils/moment'
import { childInfo } from './Calculator'


const OverviewCal = ({ screen1, incomeDetails, taxDetails }: IOverview_Cal) => {
  const [showOverview, setShowOverview] = useState(false);
  const openOverview = () => setShowOverview(true);
  const hideOverview = () => setShowOverview(false);
  const [anchorEl, setAnchorEl] = React.useState(null);

  const stepperSteps1 = useMemo(() => ([
    {
      label: "Calculation", description: [
        { key: 'Name', value: screen1?.background?.party1FirstName, icon: null },
        { key: 'PDF', value: screen1?.background?.label ? screen1?.background?.label : "Untitled" , icon: <File size={16} /> },
      ]
    },
    {
      label: "Background", description: [
        { key: 'Details 1', value: screen1?.background?.party1FirstName + " " +  screen1?.background?.party1province + "/" + momentFunction.differenceBetweenNowAndThen(screen1?.background?.party1DateOfBirth), icon: <User size={16} /> },
        { key: 'Details 2', value: screen1?.background?.party2FirstName + " " + screen1?.background?.party2province + "/" + momentFunction.differenceBetweenNowAndThen(screen1?.background?.party2DateOfBirth), icon: <User size={16} /> },
      ]
    },
  ]), [screen1.aboutTheChildren, screen1.background]);

  const stepperSteps2 = useMemo(() => ([
    {
      label: "Income and taxes", description: [
        { key: screen1?.background?.party1FirstName, value: screen1?.background?.party1FirstName + ": " +  formatNumberInThousands(incomeDetails?.party1) , icon: <FaMoneyBill size={16} /> },
        { key: screen1?.background?.party2FirstName, value: screen1?.background?.party2FirstName + ": " +  formatNumberInThousands(incomeDetails?.party2), icon: <FaMoneyBill size={16} /> },]
    },
    {
      label: "Tax Details",
      description: [
        { key: 'Name', value: "Automatically calculated in final screen", icon: <FileAnalytics size={16}/> },
        // { key: 'PDF', value: "Untitled file", icon: <Forms size={16} /> }
      ]
    },
  ]), [incomeDetails.party1, incomeDetails.party2])


  const Mapsteps = (step) => <Step className="w-100" key={step.label + Math.random()}>
    <StepLabel
    >
      <p className="heading-5">
        {step.label}
      </p>
      {step.description.map((e) => {
        return <p className="heading-6 " style={{whiteSpace: "normal"}}>{e.icon}  {e.value}</p>
      })}
    </StepLabel>
  </Step>

  const Renderoverview = () => {
    return <Popper open={showOverview} anchorEl={anchorEl} placement={'bottom'} transition>
      {({ TransitionProps }) => (
        <Fade {...TransitionProps} timeout={350}>
          <Paper className="p-5">
            <Stepper activeStep={-1} orientation="vertical">
              {stepperSteps1.map((step, index) => Mapsteps(step))}
               <Step>
                <StepLabel
                >
                  <p className="heading-5">
                    Children
                  </p>

                  {screen1?.aboutTheChildren?.childrenInfo.map((e: childInfo) => {
                    return <p key={e.dateOfBirth + e.name} className="heading-6">  {e.name} / {momentFunction.differenceBetweenNowAndThen(e.dateOfBirth)} / {e.custodyArrangement}</p>
                  })}
                </StepLabel>
              </Step> 
               {stepperSteps2.map((step, index) => Mapsteps(step))} 
            </Stepper>
          </Paper>
        </Fade>
      )}
    </Popper>

  }

  return (
    <div>  <h4 onMouseEnter={(e) => {
      openOverview();
      setAnchorEl(e.target);
    }} onMouseLeave={hideOverview} className="heading-5 text-center cursor_pointer mb-4 fw-bold" style={{ background: "#e6e6e6", padding: '1rem' }}>
      {screen1.background.label ? screen1.background.label : "Untitled"} {screen1.background.description ? ("- " + screen1.background.description) : ""}
    </h4>

      <Renderoverview />
    </div>
  )
}

export default OverviewCal