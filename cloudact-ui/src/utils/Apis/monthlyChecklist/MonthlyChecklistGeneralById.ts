import axios from '../../axios';
import { getBodyStatusCode } from '../../helpers';

const monthlyChecklistGeneralById = async(monthlyChecklistId: number) => {
    const data = await axios.get(`/general/${monthlyChecklistId}`);

    const {body} = getBodyStatusCode(data);
    return body;
}

export default monthlyChecklistGeneralById;