
import { AES, enc } from 'crypto-js';

//move the key to config.js
let Secret_Key = 'CloudAct_Law_Firm'


export const encrypt=(value:any) => AES.encrypt(JSON.stringify(value), Secret_Key).toString();

// export const decrypt=(value:any) => JSON.parse(AES.decrypt(value, Secret_Key).toString(enc.Utf8));

export const decrypt = (value: any) => {
// console.log('✌️value --->', value);
    try {
      const decryptedValue = AES.decrypt(value, Secret_Key).toString(enc.Utf8);
// console.log('✌️decryptedValue --->', decryptedValue);
      return JSON.parse(decryptedValue);
    } catch (error) {
      // console.error('Error decrypting:', error);
      return null;
    }
  };
  export const updatedecrypt = (value: any) => {
    // console.log('✌️valdddddue --->', value);
        try {
          const decryptedValue = AES.decrypt(value, Secret_Key).toString(enc.Utf8);
    // console.log('SCFCSCSFCFCXXFXF --->', decryptedValue);
          return JSON.parse(decryptedValue);
        } catch (error) {
          // console.error('Error decrypting:', error);
          return null;
        }
      };
  export const userRole = (value: any) => {
    // console.log('✌️value --->', value);
        try {
          const decryptedValue = AES.decrypt(value, Secret_Key).toString(enc.Utf8);
    // console.log('userRole --->', decryptedValue);
          return JSON.parse(decryptedValue);
        } catch (error) {
          // console.error('Error decrypting:', error);
          return null;
        }
      };

