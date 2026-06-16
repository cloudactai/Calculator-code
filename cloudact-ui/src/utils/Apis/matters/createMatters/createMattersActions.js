import { fetchRequest } from "../../../fetchRequest";
import { getUserSID } from "../../../helpers";
import { CREATE_MATTERS_REQUEST,CREATE_MATTERS_SUCCESS,CREATE_MATTERS_FAIL } from "./createMattersConstants";

export const createMatter = (postData,state = {}, action) => async (data,dispatch) => {

    try {
        dispatch({ type: CREATE_MATTERS_REQUEST });
        const { data } = await fetchRequest("post", `create_matter/${getUserSID()}`, postData);

        if (data.data.code === 200 && data.data.status === "success") {
            console.log('Save Matter Data',data)
            dispatch({ type: CREATE_MATTERS_SUCCESS, payload: data.data.body })
        } else {
            dispatch({ type: CREATE_MATTERS_FAIL, payload: "Error" })
        }

    } catch (err) {
        dispatch({ type: CREATE_MATTERS_FAIL, payload: "Error" })

    }
}
