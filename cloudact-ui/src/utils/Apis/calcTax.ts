import axios from "../axios";
import { getBodyStatusCode } from "../helpers";

interface taxCalcParams {
  incomeOver: number;
  province: string;
  year: number;
}

export interface taxCalcResponse {
  From: number;
  To: number;
  Basic: number;
  Rate: number;
  Income_over: number;
  Year: number;
  Province: string;
}

const taxCalculation = async (data: taxCalcParams)  => {
  const res = await axios.get<taxCalcResponse[]>(
    `/tax-calc/${data.incomeOver}/${data.province}/${data.year}`
  );

  const { body } = getBodyStatusCode(res);

  return body;
};

export { taxCalculation};
