export interface AuditHistoryLog {
  assigneeCode: string | null;
  assigneeType: string | null;
  authorizerCode: string;
  authorizerName: string | null;
  completeTime: string;
  formNo: string;
  processId: string;
  receiveTime: string;
  remark: string;
  returnStep: string | null;
  seq: number;
  signComment: string | null;
  signResult: string | null;
  signerCode: string;
  signerDeptId: string;
  signerDeptName: string;
  signerNameCn: string;
  signerNameEn: string;
  signerPhoneNumber: string;
  signerInfo?: string;
  status: string;
  stepName: string;
  stepNumber: number;
  taskId: string | null;
}
