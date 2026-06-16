import axios from "../../axios";
import { getBodyStatusCode } from "../../helpers";

const apiCalculatorById = {
  delete_value: async (id: number) => {
    const res = await axios.delete(`calculator/delete_value/${id}`);

    const { body } = getBodyStatusCode(res);

    return body;
  },
  get_value: async (id: number) => {
    const res = await axios.get(`calculator/get_data_by_stored_id/${id}`);

    const { body } = getBodyStatusCode(res);

    return body[0];
  },
  edit_value: async (id: number, obj: Object) => {
    const res = await axios.patch(`calculator/save_values/${id}`, obj);

    const { body } = getBodyStatusCode(res);

    return body;
  },
};

export { apiCalculatorById };
