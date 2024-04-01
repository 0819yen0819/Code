export interface FileUploader {
  multiple: boolean;
  accept: string;
  auto: boolean;
  maxFileSize: number;
  fileLimit: number | null;
  uploadIcon: string;
  chooseIcon: string;
  chooseLabel: string;
  showUploadButton: boolean;
  showCancelButton: boolean;
  customUpload: boolean;
  previewWidth: number;
  cancelIcon:string
}

export class FileUploaderManager implements FileUploader {
  multiple = false;
  accept = '.xlsx,.xls';
  auto = false;
  maxFileSize = 10 * 1024 * 1024;
  fileLimit = 1;
  uploadIcon = '';
  chooseIcon = '';
  chooseLabel = 'Choose File';
  cancelIcon='pi pi-times'
  showUploadButton = false;
  showCancelButton = false;
  customUpload = true;
  previewWidth = 0;
}
