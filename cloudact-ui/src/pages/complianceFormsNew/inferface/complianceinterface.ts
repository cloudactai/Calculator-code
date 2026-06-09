// Define types for props
export interface DataProps {
    id: number;
    task_month: string;
    task_type: string;
    task_type_account: string;
    task_due_date: string;
    task_status: string;
    task_preparer_signoff: string | number;
    task_approverer_signoff: string | number;
    pdf_url?: string;
    isComplianceForm: number;
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
  
  export interface ComplianceFormsBodyProps {
    data: DataProps;
    index: number;
    handleSelectIndividual: (id: number) => void;
    selectedReports: number[];
  }