import React from "react";
import { ClipLoader } from "react-spinners";

type Iprops = {
  loadingMsg?: string,
  isLoading: boolean,
};

const Loader = ({ loadingMsg, isLoading }: Iprops) => {
  return isLoading ? (
    <div className="loader"> 
      {loadingMsg || "Loading..."}
    </div>
  ) : null;
};

export default Loader;
