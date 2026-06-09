import axios from '../../axios';
import { getBodyStatusCode, getUserSID } from '../../helpers';

const getDashboardAnalytics = async () => {
    const data = await axios.get(`/dashboard/analytics/${getUserSID()}`);

    const { body } = getBodyStatusCode(data);
    return body;
}

export default getDashboardAnalytics;