import React from 'react';
import no_repeat from "../../src/assets/images/no_report.svg";
import no_repeat_period from "../../src/assets/images/no_repeat_period.svg"

const Noreportpage = ({repeatPeriod=false}) => {


  return (
    <div className='d-flex justify-content-center align-item-center'>
        {
            repeatPeriod ? 
            <img src={no_repeat} style={{
              width: '399px',
              marginBottom: '15px'
            }}/> :
            <img src={no_repeat_period}  style={{
              width: '499px',
              marginBottom: '10px'
            }} />
        }
     
   
    </div>
  )
}

export default Noreportpage