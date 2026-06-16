export interface UserInfo {
  username: string;
}


export interface RootState {
  userLogin: {
    userInfo: UserInfo | null;
  };
}

export interface ModalData {
  id: string;
  dashboard: string;
  task: string;
  reports: string;
  settings: string;
  reportHistory: string;
  calculator: string;
  [key: string]: any; 
}

export interface PanelProps {
  icon: React.ReactNode;
  title: string;
  activeCount: number;
  activeLabel: string;
  inactiveCount: number;
  inactiveLabel: string;
  route: string;
}

export interface User {
  display_firmname?: string;
  short_firmname?: string;
  province?: string;
  region?: string;
  totalConnectedUsers?: number;
  status?: string;
  id?: number;
}

export interface filterElement{
  status: string;
  type: string;
}

export interface ModalConfig {
  visible: boolean;
  data: ModalData | null;
}



