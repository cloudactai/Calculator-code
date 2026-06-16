import React , { useEffect, useState } from 'react';
import { Autocomplete, TextField } from "@mui/material";
import { useHistory } from 'react-router';
import toast from 'react-hot-toast';


import { getUserSID, getUserId, getMonthFromDigitWithCurrentYear } from '../../utils/helpers';
import axios from "../../utils/axios";
import { AUTH_ROUTES } from '../../routes/Routes.types';
import createTaskImage from "../../assets/images/createTaskImage.svg";
import { getSvg } from './trustDepoAssets';
import {Transaction , TrustAccount , DateRange} from "./interface/trustDepositInterface"



const TaskTypeFormTrustDeposit : React.FC= () => {

    const [allClients, setAllClients] = useState<any[]>([]);
  const [trustaccountsList, setTrustAccountsList] = useState<TrustAccount[]>([]);
  const [selectedTrustAccount, setSelectedTrustAccount] = useState<TrustAccount | null>(null);
  const [selectedTransactions, setSelectedTransactions] = useState<Transaction[]>([]);
  const [dateRange, setDateRange] = useState<DateRange>({
    from: '',
    to: ''
  });

   const [transactiondetails, setTransactionDetails] = useState<Transaction[]>([]);
  const [task_name, setTaskName] = useState<string>('');

    const history = useHistory();

    useEffect(() => {
        const getTrustAccountNumbers = async () => {
            try {
                const {
                    data: {
                        data: { body },
                    },
                } = await axios.get(`/clio-accounts/${getUserSID()}/Trust`);

                if (body) {
                    console.log("trust account Number", body);
                    setTrustAccountsList(body);

                }
            } catch (error) {
                console.log("err", error);
                alert("Error fetching Trust account Number");
            }
        };
        const getAllclient = () => {
            axios.get(`/getAllClientInfo/${getUserSID()}`).then((res) => {
                if (res.data.data.body.length != 0) {
                    setAllClients(res.data.data.body)
                }
                console.log('allclientwithsid', res.data.data.body)
            }).catch((err) => {
                console.log(err)
            })
        }
        getTrustAccountNumbers();
        getAllclient()
    }, []);


    const Accounthandler = (e: React.ChangeEvent<{}>,  val: { value: TrustAccount; label: string } | null) => {
        if (val) {
            setSelectedTrustAccount(val.value);
          } else {
            setSelectedTrustAccount(null); // Handle null if needed
          }
      };
    


      const handleTrustChangeBill = (e: React.ChangeEvent<{}>, value: { value: Transaction; label: string }[]) => {
        setSelectedTransactions(value);
      };

   
      const DateHandler = (e: React.ChangeEvent<HTMLInputElement>) => {
        setDateRange((prev) => ({
          ...prev,
          [e.target.name]: e.target.value
        }));
      };
    
      const addPropertiesToObjects = (objects: any[], properties: object) => {
        return objects.map(obj => ({ ...obj, ...properties }));
      };


    useEffect(() => {

        if (selectedTrustAccount && dateRange.from && dateRange.to) {
            axios.get(`/clio_transaction_details_by_bankaccountid/${getUserSID()}/${selectedTrustAccount.bank_account_id}/${dateRange.from}/${dateRange.to}`).then((res) => {
               
                const initialProperties = { coin: {}, bill: {} };  // Default properties to add
                const modifiedData = addPropertiesToObjects(res.data.data.body, initialProperties);
                setTransactionDetails(modifiedData);
              
            }).catch((err) => {
                console.log(err)
            })
        }

    }, [selectedTrustAccount, dateRange.from, dateRange.to])

    const submithandler = () => {

        if(
           !selectedTrustAccount?.account_name || 
           !dateRange.to ||
           !task_name || 
           !dateRange.from  ||
           !selectedTransactions || 
           !selectedTrustAccount.bank_account_id
        ){
            return toast.error('Please fill all the fields')
        }

        const obj = {
            task_created_by: getUserId(),
            sid: getUserSID(),
            task_type: 'TRUST_DEPOSIT_SLIP',
            task_month: getMonthFromDigitWithCurrentYear(new Date().getMonth() + 1),
            task_status: 'INPROGRESS',
            task_account: "",
            task_type_account: selectedTrustAccount.account_name,
            task_to: dateRange.to,
            task_name: task_name,
            task_from: dateRange.from,
            isComplianceForm: 2,
            client_files_details: JSON.stringify(selectedTransactions),
            account_id: selectedTrustAccount.bank_account_id
        };

        axios
            .post("/create/task/trust_deposit_slip", obj)
            .then((res) => {
                history.push(AUTH_ROUTES.TRUST_DEPOSIT_SLIP)
                console.log('checkRespionse', res)
            })
            .catch((err) => {
                console.log("err", err);
            });
    }


    return (
        <div>
            <>
                <div className="outerTitle">
                    <div className="pHead p-0" style={{ minHeight: "60px" }}>
                        <span className="h5">
                            {getSvg("Trust Deposit Slip")}
                            Trust Deposit Slip
                        </span>
                    </div>
                </div>

                <div className="panel Hauto addTaskPanel">
                    <div className="pBody">

                        <div className="row align-items-center">
                            <div className="col-md-9">
                                <div className="row">
                                    <div className="col-md-5">
                                        <div className="pHead pt-0">
                                            <span className="h5">
                                               {getSvg("write_task_svg")}
                                                Write task name

                                            </span>
                                        </div>

                                        <form >
                                            <div className="row">

                                                <div className="col-md-12 mb-3">
<div className='form-group'>
<input className="form-control" type="text"  onChange={(e) => setTaskName(e.target.value)} value={task_name} placeholder="Enter Task Name" />

</div>
                                                </div>

                                               

                                            </div>
                                        </form>
                                    </div>

                                    <div className='col-md-5 offset-md-1 taskAddOpt'>
                                    <div className="pHead pt-0">
                        <span className="h5">
                       {getSvg("Select Account Details")}
                          
                            Select Account Details
                      
                        </span>
                      </div>
                                        
                                    <div className="col-md-12 mb-3">
                                    <label className='font-weight-bold'>Select Account</label>
<Autocomplete
    disabled={allClients.length == 0}
    options={trustaccountsList.map((element) =>
        ({ value: element, label: element.account_name })
    )}
    onChange={Accounthandler}
    size="small"
    renderInput={(params) => (
        <TextField  {...params} 
        placeholder="Select Account" />
    )}
/>

</div>
<div className='row m-1'>
<div className="col-md-6">
<label className='font-weight-bold'>From</label>
 <input type='date' style={{border:"1px solid rgb(115, 195, 253)"}} onChange={DateHandler} name='from' required className="form-control" />

</div>
<div className="col-md-6">
<label className='font-weight-bold'>To</label>

  <input type='date' style={{border:"1px solid rgb(115, 195, 253)"}} onChange={DateHandler} name='to' required className="form-control" />

</div>
</div>


<div className="col-md-12 mt-4">
<label className='font-weight-bold'>Select Transaction</label>
<Autocomplete

    disabled={transactiondetails.length == 0}
    options={transactiondetails?.map((element) =>
        ({ value: element, label: `${element.client_name}-$${element.amount}` })
    )}
    multiple={true}
    // value={""}
    onChange={(event, value) => {
        handleTrustChangeBill(event, value);
    }}
    renderInput={(params) => (
        <TextField  {...params} 
        
    placeholder="Select Transaction" />
    )}
/>
</div>

                                    </div>


                                </div>
                            </div>

                            <div className="col-md-3 text-end">
                  <img src={createTaskImage}></img>
                </div>


                        </div>

                        <div className="btnGroup mt-4">
                            <button
                                className="btn btnPrimary ms-auto"
                                onClick={submithandler}
                            >
                                Generate trust deposit slip
                            </button>
                        </div>
                    </div>
                </div>

                <div className="pb-4"></div>
            </>
        </div>
    )
}

export default TaskTypeFormTrustDeposit
