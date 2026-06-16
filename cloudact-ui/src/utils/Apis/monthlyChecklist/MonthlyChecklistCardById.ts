import axios from '../../axios';
import { getBodyStatusCode } from '../../helpers';

const monthlyChecklistCardDetailsById = async(monthlyChecklistId: number) => {
    const data = await axios.get(`/card/${monthlyChecklistId}`);

    const {body} = getBodyStatusCode(data);
    return body;
}

export default monthlyChecklistCardDetailsById;
