import axios from "../axios";
import { formulaForChildSupport, getBodyStatusCode, getUserSID, isApiRequestSuccessfully } from "../helpers";


export type argGetClioTrustDetailsForOntarioForms = {
    clientId: number,
    bankAccountId: number, 
    matterDisplayNbr: string,
} 

type Error = {
    message: string
  }

export interface DataForComplianceForms {
allocation_amount: number,
allocation_desc: string,
allocation_has_online_payment: number,
allocation_id: number,
allocation_payment_type: string,
amount: number,
bank_transactions_id: number,
bankaccount_id: number,
bill_number: string,
client_id: number,
client_name: string,
client_type: string,
confirmation: string,
created_at: string,
date: string,
description: string,
funds_in: number,
funds_out: number,
id: number,
matter_description: string,
matter_display_number: string,
matter_id: number,
other_party: string,
subscriber_id: number
transaction_type: string,
type: string,
updated_at: string,
}


const getClioTrustDetailsForOntarioForms =  ({clientId, bankAccountId, matterDisplayNbr}: argGetClioTrustDetailsForOntarioForms)  => {
    try{
       
        // const {data: {data: {body, status, code}}} = await 
        // console.log("body", body);
        // return body;
    }catch(err: any)
    {
        console.log("err", err);
        alert("Error fetching clio trust details")
        return err;
    }
}

// const getBankDetails = async({}) =>
// {
//     try {
//         const {data: {data: {body}}} = await axios.get("/");

//         console.log("data", data);
//         return body;

//     } catch (err) {
        
//     }
// }




export {getClioTrustDetailsForOntarioForms}
