export interface ReportData {
    filename: string;
    display_name: string | null;
    from_date: string;
    to_date: string;
    created_at: string;
    user_name: string;
    pdf_file: string;
    accountName: string;
    report_id: string;
    batch_id: string;
    hasChild: string;
    id: string;
    profile_pic?: string;
  }
  
  export interface ReportBodyProps {
    data: ReportData;
    index: number;
    handleSelectIndividual: (id: string) => void;
    selectedReports: string[];
  }
  
  export interface ReportOptions {
    loading: boolean;
    options: Array<{
      hasOption1: string;
      option1: string;
      hasOption2?: string;
      option2?: string;
      hasOption3?: string;
      option3?: string;
      hasOption4?: string;
      option4?: string;
      hasOption5?: string;
      option5?: string;
    }>;
  }