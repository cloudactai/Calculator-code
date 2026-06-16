import axios from "../axios";
import { getBodyStatusCode } from "../helpers";

type childSupportParams = {
  incomeOver: number;
  numChildren: number;
  province: string;
};

type childSupportResponse = {
  from: number;
  To: number;
  basic: number;
  rate: number;
  income_over: number;
  no_of_Children: number;
  province: string;
};

const childSupportDetails = async (data: childSupportParams) => {
  try {
    const res = await axios.get<childSupportResponse>(
      `/calc-ref/${data.incomeOver}/${data.numChildren}/${data.province}`
    );


    const { body } = getBodyStatusCode(res); 
    
    if(body.length > 0)
    {
      return body[0];
    }else{
      throw new Error('No Object found');
    }
  } catch (err) {
    return {
      Basic: 0,
      From: 0,
      Income_over: 0,
      Province: "ON",
      Rate: 0,
      To: 0,
      Year: 2021,
      id: 0,
    };
  }
};

export { childSupportDetails };
