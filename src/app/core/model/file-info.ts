export interface FileUploadCallback {
  fileId: number | null;
  fileName: string;
  filePath: string;
}

export interface SaveFileLog extends FileUploadCallback {
  formNo: string;
  formTypeId?:string;
}

export interface AttachedFileLog extends SaveFileLog {
  seq: number;
  url: string | null;
  type: string;
  lastUpdatedDate: string;
  lastUpdatedBy: string;
  uploadDate: string;
  uploadBy: string;
  uploadName: string;
  canDelete: string;
}
