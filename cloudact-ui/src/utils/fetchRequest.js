import axios from "./axios"

const getRequest = async (endpoint) => {

    
    
    const { data } = await axios.get(endpoint);
    return { data };
}

const postRequest = async (endpoint, obj) => {
    const { data } = await axios.post(endpoint, obj);
    return { data };
}

const deleteRequest = async (endpoint) => {
    const { data } = await axios.delete(endpoint);
    return { data };
}

const putRequest = async (endpoint, obj) => {
    const { data } = await axios.put(endpoint, obj);
    return { data };
}

const fetchRequest = async (type, endpoint, obj = null) => {


    if (type === "get") {
        // console("get request");
        return getRequest(endpoint);
    } else if (type === "post") {
        // console("post request");
        return postRequest(endpoint, obj);
    } else if (type === "delete") {
        // console("delete request");
        return deleteRequest(endpoint);
    } else if (type === "put") {
        // console("put request");
        return putRequest(endpoint, obj);
    }
}

export { fetchRequest }