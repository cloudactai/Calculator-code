import axios from "./axios"
import dataAxios from "./dataAxios"

const migratedDataEndpoints = [
    /^get_matters\//,
    /^create_matter\//,
    /^get_single_matter\//,
    /^get_single_matter_data\//,
    /^get_single_matter_data_all\//,
    /^save_matter\//,
    /^patch_matter_intake\//,
    /^update_matter\//,
    /^get_municipalities\//,
    /^get_courts\//,
    /^create_folder\/?$/,
    /^add_files\/?$/,
    /^get_folders\//,
    /^get_files\//,
    /^save_file_data\//,
    /^get_file_data\//,
    /^SAVE_FORM_FIELDS\//,
];

const clientForEndpoint = (endpoint) => {
    const normalizedEndpoint = String(endpoint || "");
    return migratedDataEndpoints.some((pattern) => pattern.test(normalizedEndpoint))
        ? dataAxios
        : axios;
};

const getRequest = async (endpoint) => {

    
    
    const { data } = await clientForEndpoint(endpoint).get(endpoint);
    return { data };
}

const postRequest = async (endpoint, obj) => {
    const { data } = await clientForEndpoint(endpoint).post(endpoint, obj);
    return { data };
}

const deleteRequest = async (endpoint) => {
    const { data } = await clientForEndpoint(endpoint).delete(endpoint);
    return { data };
}

const putRequest = async (endpoint, obj) => {
    const { data } = await clientForEndpoint(endpoint).put(endpoint, obj);
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
