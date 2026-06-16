import { useState } from 'react';
import axios from '../utils/axios';
import { getBodyStatusCode } from '../utils/helpers';

type IProps = {
  url: string;
  method: 'GET' | 'DELETE'
}

//hook for making api requests and loading status.
export const useAPI = <T, IQuery extends Record<string | number, any>>(props: IProps) => {
  const [isLoading, setLoading] = useState<boolean>(false);
  const [data, setData] = useState<T | undefined>(undefined);
  const [error, setError] = useState<string>('');

  const deleteRequest = async (): Promise<T> => {
    return await axios.delete(props.url)
  }

  const getRequest = async (): Promise<T> => {
    return await axios.get(props.url);
  }

  const requestAction = async () => {
    try {
      setLoading(true);
      const res = props.method === 'GET' ? await getRequest() : await deleteRequest();
      const {code, status, body: resBody} = getBodyStatusCode(res);
    
      if(code !== 200 && status !== "success"){
        throw new Error("Cannot fetch from DB");
      }

      setData(resBody);
      setError('');
      return { data: resBody, error: null }
    } catch (error: any) {
      console.log(error);
      setError(error?.message || "Something went wrong");
      return { data: null, error: error?.message };
    } finally {
      setLoading(false)
    }
  }

  

  return {
    isLoading,
    data,
    error,
    requestAction,
  }
}

export default useAPI;