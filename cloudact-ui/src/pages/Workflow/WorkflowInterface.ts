// Define types for props
export interface DataProps {
  workflow_id: number;
  workflow_name: string;
  approver: string;
  preparer: string;
  start_date: string;
  due_date: string;
  file_url: string;
  workflow_month: string;
  workflow_status: string;
  workflow_type: number;
}

export interface ReportOption {
  hasOption1: string;
  option1: string;
  hasOption2: string;
  option2: string;
  hasOption3: string;
  option3: string;
  hasOption4: string;
  option4: string;
  hasOption5: string;
  option5: string;
}

export interface WorkflowFormsBodyProps {
  data: DataProps;
  index: number;
  handleSelectIndividual: (id: number) => void;
  handleDownloadDocument: (url: string) => void;
  onClick?: () => void;
  selectedReports: number[];
}
