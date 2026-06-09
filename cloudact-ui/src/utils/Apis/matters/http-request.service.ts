import { getToken } from "../../helpers";

class HttpRequestService {

    async get(url: string): Promise<any> {
        try {
          const response = await fetch(url, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `${getToken()}`,
            },
          });
    
          const json = await response.json();
    
          if (response.status !== 200) {
            const data = json;
            return data;
          }
          return json;
        } catch (error) {
          Promise.reject(new Error(`HTTP error! status: ${error}`));
          console.error(error);
        }
      }
 



}

export default new HttpRequestService();