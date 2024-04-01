export class AuditLog {
  seq: number;
	formNo: string;
	processId: string;
	stepNumber: number;
	stepName: string;
	taskId: string;
	status: string;
	signerCode: string;
	receiveTime: Date;
	completeTime: Date;
	signerNameCn: string;
	signerNameEn: string;
	signerDeptId: string;
	signerDeptName: string;
	signResult: string;
	signComment: string;
	assigneeCode: string;
	assigneeType: string;
	remark: string;
}
