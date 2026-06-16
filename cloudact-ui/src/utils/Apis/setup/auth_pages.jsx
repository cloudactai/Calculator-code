import axios from '../../axios';
import { getUserSID } from '../../helpers';

const authPagesApi = async () => {
    const data = await axios.get(`/access_pages/${getUserSID()}`);
    // const { body } = getBodyStatusCode(data);
    // console.log("access _body", body);
    return data;
}

export default authPagesApi;