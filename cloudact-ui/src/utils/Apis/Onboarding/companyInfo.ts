import axios from '../../axios';
import { getBodyStatusCode, getUserId } from '../../helpers';

export const fetchCompanyInfo = async() => {
const res = await axios.get(`/companyInfo/${getUserId()}`);

const {body} = getBodyStatusCode(res);
return body;
}
