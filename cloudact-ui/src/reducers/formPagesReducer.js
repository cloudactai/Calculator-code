
export const selecetdFormsReducer = (state = {}, action) => {
    switch (action.type) {
        case 'UPDATE_SELECTED_FORMS':
            return [...action.payload]
        default:
            return state;
    }
};