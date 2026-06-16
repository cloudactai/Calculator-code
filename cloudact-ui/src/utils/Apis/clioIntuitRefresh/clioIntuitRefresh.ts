import axios from '../../axios';
import { getBodyStatusCode, getUserSID } from '../../helpers';

const clioIntuitRefresh = async () => {
    const data = await axios.get(`/services/status/${getUserSID()}`);

    const { body } = getBodyStatusCode(data);
    return body;
}

export default clioIntuitRefresh;