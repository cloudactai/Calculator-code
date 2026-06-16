import {set  , get , remove} from "js-cookie";
import { encrypt , decrypt } from "../Encrypted";

const CookiesParser = {

    set: (key, value, options) => {
      return set(key, encrypt(value), options);
    },

    get: (key) => {
      let getData = get(key);
      return getData;
    },

    remove : (key, options) => {
      return remove(key,options);
  },

  };

  export default CookiesParser;