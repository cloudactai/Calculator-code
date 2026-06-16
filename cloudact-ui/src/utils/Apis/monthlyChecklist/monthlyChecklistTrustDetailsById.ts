import axios from "../../axios";
import { getBodyStatusCode } from "../../helpers";

const monthlyChecklistTrustDetailsById = async (monthlyChecklistId: number) => {
  const data = await axios.get(`/trust/${monthlyChecklistId}`);

  const { body } = getBodyStatusCode(data);
  console.log("checkMyfhadbhg",data)

  return body;
};

export default monthlyChecklistTrustDetailsById;
