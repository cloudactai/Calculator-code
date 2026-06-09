import axios from "../../axios";
import { getBodyStatusCode } from "../../helpers";

const fetchAllCalculatorDatawithTaxs = async (obj: Object) => {
    // alert('reched here')
  try {
    const res = await axios.post(`calculator`, obj);
    // const { body } = getBodyStatusCode(res);
    return res;
  } catch (err: any) {
    // const errorMessage = JSON.parse(err.request.response)
    return err.response.data.data;
  }
};

export { fetchAllCalculatorDatawithTaxs };
