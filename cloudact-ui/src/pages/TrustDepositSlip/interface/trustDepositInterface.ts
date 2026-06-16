
export interface RootState {
  userLogin: {
    userInfo: UserInfo | null;
  };
}

export interface UserInfo {
  username: string;
}

export interface ReportRowTrustProgressProps {
  data: {
    id: number;
    task_month: string;
    task_status?: string;         // Made optional
    pdf_url?: string;
    task_name?: string;           // Made optional
    task_type_account?: string;   // Made optional
  };
  key: number;
  checkBoxFunction: (key: number, id: number) => void;
  isChecked: boolean;
}


export interface Transaction {
  client_name: string;
  amount: number;
  [key: string]: any;
}

export interface TrustAccount {
  account_name: string;
  bank_account_id: string;
  [key: string]: any;
}

export interface DateRange {
  from: string;
  to: string;
}



