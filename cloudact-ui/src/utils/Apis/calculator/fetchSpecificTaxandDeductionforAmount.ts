import axios from "../../axios";

const fetchSpecificTaxandDeductionforAmount = async (obj: Object) => {
  console.log("check boj on api request",obj)
  try {
    const res = await axios.post(`other/calculator`, obj);
    console.log("api response frontend",res)
    return res.data;
  } catch (err: any) {
    return err.response.data.data;
  }
};

export { fetchSpecificTaxandDeductionforAmount };
