import axios from "../../axios";
import { getBodyStatusCode } from "../../helpers";

const SaveAllCalculatorValuesByID = async (obj: Object) => {
  try {
    const res = await axios.post(`calculator/save_values`, obj);
    const { body } = getBodyStatusCode(res);
    return body;
  } catch (err: any) {
    // const errorMessage = JSON.parse(err.request.response)
    return err.response.data.data;
  }
};

export { SaveAllCalculatorValuesByID };
