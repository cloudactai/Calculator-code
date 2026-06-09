import axios from "../axios"
import { getBodyStatusCode } from "../helpers";

const getDistinctYearsInTaxRef = async() => {
        const res = await axios.get<{year: number}[]>(`/tax-calc-distinct-years`);
        const {body} = getBodyStatusCode(res);
        return body;
}

export {getDistinctYearsInTaxRef}