import axios from '../../axios'
import { getBodyStatusCode } from "../../helpers";

const fetchAllCalculatorTasks = async (sid: number): Promise<Object[]> => {

    const res = await axios.get(`calculator/get_values/${sid}`)

    const { body } = getBodyStatusCode(res);

    return body;
}

export { fetchAllCalculatorTasks }
