import React, { useState , useEffect } from 'react';
import InputCustom from "../../../components/InputCustom";
import "./NPVCal.css"

const NPVCalculator = ({ scenarioKey, setScenarios,scenarios }) => {
  const [discountRate, setDiscountRate] = useState(0);
  const [cashFlowsAndDurations, setCashFlowsAndDurations] = useState([{ cashFlows: 0, duration: 0 }]);
  const [npvResult, setNPVResult] = useState(null);

  const handleInputChange = (index, key, value) => {
    const newCashFlowsAndDurations = [...cashFlowsAndDurations];
    newCashFlowsAndDurations[index][key] = value;
    setCashFlowsAndDurations(newCashFlowsAndDurations);
  };

  const handleAddCashFlow = () => {
    setCashFlowsAndDurations([...cashFlowsAndDurations, { cashFlows: 0, duration: 0 }]);
  };

  
  useEffect(() => {
    
    // const initialCashFlowsAndDurations = scenarios[scenarioKey]?.cashFlowsAndDurations || [{ cashFlows: 0, duration: 0 }];
    const initialCashFlowsAndDurations =
    scenarios[scenarioKey]?.cashFlowsAndDurations.length > 0
      ? scenarios[scenarioKey]?.cashFlowsAndDurations
      : [{ cashFlows: 0, duration: 0 }];
    setCashFlowsAndDurations(initialCashFlowsAndDurations);

   
    setDiscountRate(scenarios[scenarioKey]?.discountRate ?scenarios[scenarioKey].discountRate :0 );
    // setCashFlowsAndDurations(scenarios[scenarioKey]?.cashFlowsAndDurations.cashFlows ? scenarios[scenarioKey]?.cashFlowsAndDurations : [{ cashFlows: 0, duration: 0 }]);
    setNPVResult(scenarios[scenarioKey]?.npvResult);
  }, [scenarioKey]);


  
  const handleCalculateNPV = () => {
    let totalNPV = 0;
    let cumulativeDuration = 0;
  
    cashFlowsAndDurations.forEach(({ cashFlows, duration }) => {


      let npv = 0;
  
      for (let t = 1; t <= duration; t++) {
      

        npv += cashFlows / Math.pow(1 + discountRate / 100, t + cumulativeDuration);
      }
    


  
      cumulativeDuration += duration; 
      totalNPV += npv;
    });

   
  
    setNPVResult(totalNPV.toFixed(2));
    setScenarios((prevScenarios) => ({
      ...prevScenarios,
      [scenarioKey]: {
        discountRate,
        cashFlowsAndDurations,
        npvResult: totalNPV.toFixed(2),
      },
    }));

  };
  

  return (
    <div className='tableInnerRow'>

      <div>

        <table style={{ width: "100%" }}>

          <tr>
            <td><strong>Discount Rate (%):</strong></td>
            <td>  <InputCustom
              handleChange={(e) => setDiscountRate(parseFloat(e.target.value))}
              type="number"
              classNames="form-control"
              value={discountRate}
            /></td>

          </tr>

        </table>


        <div className='d-flex'>
          <label> 

          </label>
        </div>


        <div className="tableOuter m-0 p-0">
          <table className="table customGrid">
            <thead>
              <tr>
               
                <th style={{paddingLeft:"5px"}}>Amount</th>
                <th className="text-center">
                  Years
                </th>
                <th className="text-center">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {
                cashFlowsAndDurations.map((item, index) => (
                  <>
                    <tr>
                   
                      <td style={{paddingLeft:"5px"}}>
                        <div className="form-group">
                          <input
                            className="form-control"
                            type="number"
                            value={item.cashFlows}
                            onChange={(e) => handleInputChange(index, 'cashFlows', parseFloat(e.target.value))}

                          // value={calpercentage.low}
                          // onChange={calChange}
                          // readOnly={editingSpecificAmount.low}
                          // placeholder="low"
                          // name="low"
                          />
                          {/* <p style={{color:"red"}}>this is warning</p> */}
                        </div>
                      </td>
                      <td>
                        <div className="form-group">
                          <input
                            type="number"
                            className="m-auto"
                            style={{maxWidth: "50px"}}
                            value={item.duration}
                            onChange={(e) => handleInputChange(index, 'duration', parseInt(e.target.value, 10))}
                          />
                        </div>
                      </td>

                      <td>
                        <button className="btn btnPrimary rounded-pill mb-4" onClick={handleAddCashFlow}>Add+</button>
                      </td>
                    </tr>
                  </>
                ))
              }

            </tbody>
          </table>
          <div  style={{ display: "flex", justifyContent: "center" }}>
            <button className="btn btnPrimary rounded-pill mt-2" onClick={handleCalculateNPV}>Calculate NPV</button>
          </div>


          {npvResult !== null && (
            <div className='text-center' >
              <strong>NPV Result: {npvResult}</strong>
            </div>
          )}

        </div>

      </div>

    </div>
  );
};

export default NPVCalculator;
