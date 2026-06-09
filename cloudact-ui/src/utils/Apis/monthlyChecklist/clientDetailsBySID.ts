import axios from '../../axios';
import { getBodyStatusCode, getUserId, getUserSID } from '../../helpers';

export const fetchClientDetails = async () => {
    const data = await axios.get(`/client/details/${getUserSID()}`);
    const { body } = getBodyStatusCode(data);
    return body;
}

export const fetchTasksByBatch = async (batchId: string) => {
    const data = await axios.get(`/task/list/ADMIN/${getUserId()}/${getUserSID()}/${batchId}?page=1&search=`);

    const { body } = getBodyStatusCode(data);
    return body;
}

export const fetchTasksDetailsById = async (id: number) => {
    const data = await axios.get(``);

    const { body } = getBodyStatusCode(data);
    return body;
}

export const fetchTaskDetails = async (id: number) => {
    const data = await axios.get(`/task/list/${id}`);

    const { body } = getBodyStatusCode(data);
    return body;
}