import  { useState, useEffect } from "react";
import { useDispatch } from "react-redux";
import { userLogoutAction } from "../actions/userActions";
import Loader from "../components/Loader"; 

const Logout = () => {
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(false);


  useEffect(() => {
    const handleLogout =  () => {
      try {
         dispatch(userLogoutAction()); 
      } catch (error) {
        console.error("Logout error:", error);
      } finally {
        setLoading(true); 
      }
    };

    handleLogout();
  }, [dispatch]);

  

  return (
    <div>
      {loading ? (
        <Loader isLoading={loading} />
      ) : (
        <div>You are currently logged out.</div>
      )}
    </div>
  );
};

export default Logout;
