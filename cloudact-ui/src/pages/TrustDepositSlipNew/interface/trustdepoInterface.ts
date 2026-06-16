  export type DataProps = {
    id: number;             
    task_month: string;        
    pdf_url: string;           
    task_name: string;
    task_type_account: string;
  };

  
  export type TrustDepositSlipProps = {
    data: DataProps;
    index: number;
    handleSelectIndividual: (id: number) => void; 
    selectedReports: number[]; 
  };

  
  export interface RootState {
    userProfileInfo: {
      response: UserInfo | null;
    };
  }

  export interface UserInfo {
    username: string;
  }
  
  
 
