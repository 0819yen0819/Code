export interface FormLogInfo {
  seq: number;
  formNo: string;
  applicantId: string;
  editUrl: string | null;
  formTypeId: string;
  formTypeNameC: string;
  formTypeNameE: string;
  remark: string | null;
  status: string;
  subject: string | null;
  viewUrl: string;
  approvingUrl: string;
  submitDate: string | null;
  lastUpdatedDate: string;
  lastUpdatedBy: string;
  createdDate: string;
  createdBy: string;
  docType: string | null;
  applicantName: string;
  serviceType: string;
  tenant: string;
  ouCode: string;
}
