import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { TranslateService } from '@ngx-translate/core';
import { FileUploader, FileUploaderManager } from 'src/app/core/model/file-uploader';
import { ConfirmationService as NGConfirmationService } from 'primeng/api';
import { AttachUploadDialogService } from './attach-upload-dialog.service';
import { DialogSettingParams } from 'src/app/core/model/selector-dialog-params';
import { LoaderService } from 'src/app/core/services/loader.service';
import { ToastService } from 'src/app/core/services/toast.service';
import { UserContextService } from 'src/app/core/services/user-context.service';
import { Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-attachment-uploader-dialog',
  templateUrl: './attachment-uploader-dialog.component.html',
  styleUrls: ['./attachment-uploader-dialog.component.scss']
})
export class AttachmentUploaderDialogComponent implements OnInit {
  @Input() showDialog: boolean;
  @Input() formNo: string;
  @Input() formTypeId: string;
  @Input() attachedFilesData = []; // 檔案資料
  @Input() attachedURLData = []; // 連結資料 

  @Output() isClose: EventEmitter<boolean> = new EventEmitter<boolean>();
  @Output() isUpdate: EventEmitter<boolean> = new EventEmitter<boolean>();

  fileUploaderSettings: FileUploader = this.attachUploadDialogService.getDefaultUploadSetting();
  fileUploadTempList = []; // 未上傳

  formGroup: FormGroup = this.formbuilder.group({
    url: [
      null,
      [Validators.required, Validators.pattern(/(http|https):\/\//)],
    ],
  });
  unsubscribeEvent = new Subject();

  constructor(
    private translateService: TranslateService,
    private formbuilder: FormBuilder,
    private ngConfirmationService: NGConfirmationService,
    public attachUploadDialogService: AttachUploadDialogService,
    private loaderService: LoaderService,
    private toastService: ToastService,
    private userContextService: UserContextService
  ) { }

  ngOnInit(): void {
    this.translateService.onLangChange
      .pipe(takeUntil(this.unsubscribeEvent))
      .subscribe(() => {
        this.fileUploaderSettings.chooseLabel = this.translateService.instant('LicenseMgmt.Common.Hint.AddFileCKMe');
      });
  }

  ngOnDestroy(): void {
    this.unsubscribeEvent.next(null);
    this.unsubscribeEvent.complete();
  }

  onDialogHided() {
    const FileAlreadyUploaded = this.fileUploadTempList.length === 0; // 有檔案尚未上傳 
    if (FileAlreadyUploaded) {
      this.resetFormData(); this.isClose.emit();
    } else {
      this.showExitConfirmDialog();
    }
  }

  /**
   * 點擊畫面選擇檔案
   * @param fileList 
   * @param fileUploader 
   * @returns 
   */
  onFileUploader(fileList: any, fileUploader: any): void {
    const fileUnexpectedMsg = [];
    const allowedFiles = [];
    for (const file of fileList.currentFiles) {
      // 驗證 Size 與 Type
      const fileSizeOrTypeNotAcceptMsg = this.attachUploadDialogService.fileIsValid(file, this.fileUploaderSettings.accept);
      if (fileSizeOrTypeNotAcceptMsg) { fileUnexpectedMsg.push(`${file.name} ${fileSizeOrTypeNotAcceptMsg}`) };

      if (!fileSizeOrTypeNotAcceptMsg) { allowedFiles.push(file) }
    }

    if (fileUnexpectedMsg.length > 0) { this.showMsgDialog(fileUnexpectedMsg, 'error'); }
    else { this.fileUploadTempList = [...new Set([...this.fileUploadTempList, ...allowedFiles])]; }
  }

  /**
   * 上傳檔案
   * @param event 
   * @param fileUploader 
   */
  onSaveAttachedFileEvent(event, fileUploader) {
    this.loaderService.show();

    const uploadPromiseArr = this.fileUploadTempList.map(file => this.attachUploadDialogService.uploadFile(this.formNo, file));
    // 1.1 uploadFile
    Promise.all([...uploadPromiseArr])
      .then((uploadResponse) => {
        // 1.2 addFormFile 
        const addFormFilePromiseArr = uploadResponse.map(uploadElement => this.attachUploadDialogService.addFormFile(this.getAddFormModel(uploadElement)));
        Promise.all([...addFormFilePromiseArr])
          .then(() => {
            this.fileUploadTempList = [];
            fileUploader.clear();
            this.isUpdate.emit(true);
            this.toastService.success(`${this.translateService.instant('LicenseMgmt.Common.Hint.AddFileSuccess')}`);
          })
          .catch((err) => { this.showMsgDialog([`${this.translateService.instant('LicenseMgmt.Common.Hint.AddFileFailed')}：${err.message}`], 'error'); })
          .finally(() => { this.loaderService.hide(); })
      })
      .catch((err) => {
        const errMsgs = [];

        if (err.error.code === 'DuplicateFileName') {
          const currentSelectFiles = this.fileUploadTempList.map((item) => { return item.name; }); // 取得當前 Temp 的檔案清單
          const duplicateFiles = this.attachedFilesData.filter((file) => currentSelectFiles.includes(file.fileName)); // 與原先的檔案清單比對 
          duplicateFiles.forEach(duplicateFile => {
            errMsgs.push(`${duplicateFile.fileName} ${this.translateService.instant('LicenseMgmt.Common.Hint.FileExistTemOrQueueList')}`);
          });
        } else {
          errMsgs.push(`${this.translateService.instant('LicenseMgmt.Common.Hint.AddFileFailed')}：${err.message}`)
        }
        this.showMsgDialog(errMsgs, 'error');
      })
      .finally(() => {
        this.loaderService.hide();
      })
  }

  /**
   * 上傳附件連結
   */
  onSaveAttachedURLLogEvent() {

    const urlAlreadyExist = this.attachedURLData.filter(item => item.url === this.formGroup.get('url').value).length > 0
    if (urlAlreadyExist) { return this.showMsgDialog([this.translateService.instant('LicenseMgmt.Common.Hint.URLExistTemOrQueueList')], 'error') };

    this.loaderService.show();
    this.attachUploadDialogService.uploadUrl(this.formTypeId, this.formNo, this.formGroup.get('url').value)
      .then(() => {
        this.toastService.success(`${this.translateService.instant('LicenseMgmt.Common.Hint.AddURLSuccess')}`);
        this.formGroup.reset();
        this.isUpdate.emit(true);
      })
      .catch((err) => {
        this.showMsgDialog([`${this.translateService.instant('LicenseMgmt.Common.Hint.AddURLFailed')}：${err}`], 'error')
        this.toastService.error(`${this.noticeContentList.join('\n')}`);
        this.loaderService.hide();
      })
      .finally(() => {
        this.loaderService.hide();
      })
  }


  // Temp file uploader 刪除事件
  onTempFileDeleteHandler(fileInfo: File, fileUploader: any) {
    this.fileUploadTempList = this.fileUploadTempList.filter(x => x.name !== fileInfo.name);
    if (this.fileUploadTempList.length == 0) { fileUploader.clear(); }
  }

  noticeContentList: string[] = [];
  noticeCheckDialogParams!: DialogSettingParams;
  //> 顯示 Notice Dialog
  private showMsgDialog(msgs: string[], mode: string) {
    this.noticeContentList = new Array<string>();
    this.noticeContentList.push(...msgs);
    this.noticeCheckDialogParams = {
      title: this.translateService.instant('LicenseMgmt.Common.Title.Notification'),
      visiable: true,
      mode: mode
    };
  }


  /**
   * 重置資料
   */
  private resetFormData() {
    this.formGroup.reset();
    this.fileUploadTempList = [];
  }

  /**
   * 是否離開訊息框
   */
  private showExitConfirmDialog() {
    this.ngConfirmationService.confirm({
      message: this.translateService.instant('LicenseMgmt.Common.Hint.FileNotUploaded'),
      header: 'Confirm',
      icon: 'pi pi-exclamation-triangle',
      key: 'approveAddAttachedDialog',
      accept: () => {
        this.resetFormData();
        this.isClose.emit();
      },
      reject: (err) => {
        this.showDialog = true;
      },
    });
  }

  private getAddFormModel(uploadElement) {
    return {
      fileId: uploadElement.fileId,
      fileName: uploadElement.fileName,
      filePath: uploadElement.filePath,
      formNo: this.formNo,
      formTypeId: this.formTypeId,
      tenant: this.userContextService.user$.getValue().tenant
    }
  }

}
