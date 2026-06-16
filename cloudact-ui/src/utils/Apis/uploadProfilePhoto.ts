import axios from "../axios";
import { getBodyStatusCode } from "../helpers";

type profilePicParams = {
  uid: number;
  photo: FormData;
};

const uploadProfilePic = async (data: profilePicParams) => {
  const res = await axios.post(`/profile`, 
   data.photo
  );

  console.log("res", res);

  const { body } = getBodyStatusCode(res);
  return body;
};

export {uploadProfilePic}