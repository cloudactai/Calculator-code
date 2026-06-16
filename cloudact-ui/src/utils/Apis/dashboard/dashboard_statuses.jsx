import axios from '../../axios';
import { getBodyStatusCode, getUserSID } from '../../helpers';

const getDashboardStatuses = async () => {
    const data = await axios.get(`/dashboard/status/${getUserSID()}`);
    console.log("getDashboardData>>",data)

    const { body } = getBodyStatusCode(data);
    return body;
}

export default getDashboardStatuses;