enum isComplianceForm{
    No = 0,
    Yes = 1
}

export interface Task {
  id: number,
  task_batch_id: string,
  sid: number,
  report_url: null,
  task_created_by: number,
  task_label: string,
  client_id: number,
  task_type: string,
  task_month: string,
  clio_trust_account: string,
  clio_trust_account_id: string,
  task_description: string,
  task_status: string,
  task_preparer: number,
  task_approverer: number,
  task_preparer_signoff: number,
  task_preparer_signoff_date: string,
  task_approverer_signoff: number,
  task_approverer_signoff_date: string,
  task_version: number,
  updated_at: string,
  task_created_at: string,
  task_preparer_name: string,
  task_account: string,
  task_approverer_name: string,
  isComplianceForm: isComplianceForm,
}
