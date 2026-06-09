import axios from '../../axios'
import { getBodyStatusCode } from "../../helpers";

const fetchAllValuesInTaxRefDB = async(year: number) => {
    const res = await axios.get(`tax-calc-values-by-year/${year}`)

    const {body} = getBodyStatusCode(res);

    return body;
}

export {fetchAllValuesInTaxRefDB}
