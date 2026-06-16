import axios from '../../axios';
import { getBodyStatusCode, getUserSID } from '../../helpers';

const dataLoadApi = async () => {
    const data = await axios.get(`/data_load_status/${getUserSID()}`);
    const { body } = getBodyStatusCode(data);
    return body;
}

export default dataLoadApi;