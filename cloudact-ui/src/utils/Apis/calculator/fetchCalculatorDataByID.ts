import axios from '../../axios'
import { getBodyStatusCode } from "../../helpers";

const fetchCalculatorDataByID = async(id: number) => {
    const res = await axios.get(`calculator/get_data_by_stored_id/${id}`)

    const {body} = getBodyStatusCode(res);

    return body[0];
}

export {fetchCalculatorDataByID}
