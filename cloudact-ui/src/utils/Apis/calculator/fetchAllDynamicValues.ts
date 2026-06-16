import axios from "../../axios";
import { getBodyStatusCode } from "../../helpers";
import { dynamicValues } from "../../helpers/calculator/creditTaxCalculationFormulas";

const fetchAllDynamicValues = async (
  year: number,
  province: string
): Promise<dynamicValues[]> => {
  const resProvince = await axios.get(
    `dynamic_values_by_year/${year}/${province}`
  );
  const resFederal = await axios.get(`dynamic_values_by_year/${year}/FED`);

  const { body: bodyProvince } = getBodyStatusCode(resProvince);
  const { body: bodyFederal } = getBodyStatusCode(resFederal);

  return bodyProvince.concat(bodyFederal);
};

const fetchChildSupportValues = async (
  year: number,
  province: string,
  NoChild: string
) => {
  try {
    const res = await axios.get(`childSupport/values/${province}/${NoChild}`);
    const { body } = getBodyStatusCode(res);
    return body;
  } catch (error: any) {
    console.log("error", error);
    return error?.message;
  }
};

export { fetchAllDynamicValues, fetchChildSupportValues };
