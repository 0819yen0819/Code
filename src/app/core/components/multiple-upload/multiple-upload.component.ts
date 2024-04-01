import { Component, Input, OnInit } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { lastValueFrom } from 'rxjs';
import { FileUploader, FileUploaderManager } from '../../model/file-uploader';
import { DialogSettingParams } from '../../model/selector-dialog-params';
import { CommonApiService } from '../../services/common-api.service';
import { ToastService } from '../../services/toast.service';
import { MultipleUploadService } from './multiple-upload.service';

@Component({
  selector: 'app-multiple-upload',
  templateUrl: './multiple-upload.component.html',
  styleUrls: ['./multiple-upload.component.scss']
})
export class MultipleUploadComponent implements OnInit {
  @Input() sampleFileIndex: number;
  @Input() uploadApiUrl: string;

  fileUploaderSettings: FileUploader = new FileUploaderManager();
  noticeCheckDialogParams!: DialogSettingParams;
  noticeContentList: string[] = new Array<string>();
  showSpinner = false;

  constructor(
    private commonApiService: CommonApiService,
    private translateService: TranslateService,
    private multipleUploadService: MultipleUploadService,
    private toastService: ToastService
  ) { }

  ngOnInit(): void {
  }

  /**
   * 送出按鈕
   */
  multipleItemUpload() {
    this.openSpinner();

    lastValueFrom(this.multipleUploadService.itemUpload(this.selectedFileList[0], this.uploadApiUrl))
      .then(res => { this.toastService.success(`${this.translateService.instant('LicenseMgmt.Common.Hint.AddFileSuccess')}`); })
      .catch(err => { this.showMsgDialog(err.error.errors, 'error') })
      .finally(() => { this.closeSpinner(); })
  }

  // 檔案上傳
  selectedFileList: File[] = []; // p-fileload target file array
  fileUploader
  onFileUploadHandler(file: any, fileUploader: any): void {
    this.selectedFileList = [...this.selectedFileList]; // avoid to primeNG default list opt.

    const targetFiles = file.currentFiles || file.files // select-upload or drop-upload

    let notAllowThisFile = false;
    targetFiles.forEach(targetFile => { notAllowThisFile = notAllowThisFile || !!this.isAcceptFile(targetFile, this.fileUploaderSettings.accept) });
    notAllowThisFile ? this.showMsgDialog(notAllowThisFile, 'error') : this.selectedFileList = targetFiles;

    this.fileUploader = fileUploader;
  }

  onDownloadSampleFileEvent(): void { this.commonApiService.downloadFile(this.sampleFileIndex); }

  onDropError(event) { this.showMsgDialog(event, 'error'); }

  onRemove(e) { this.selectedFileList = this.selectedFileList.filter(item => item.name !== e.file.name); }

  // 手動上傳允許的檔案格式
  private isAcceptFile(file: File, acceptFileType: string = '', maxFileSize: number = 4 * 1024 * 1024) {
    const fileType = file.name?.split('.')?.pop() || '';
    const fileSizeAccept = file.size < maxFileSize;
    const fileTypeAccept = acceptFileType.split(',').includes('.' + fileType) || acceptFileType === '';
    if (!fileSizeAccept) { return 'SampleOutDPL.Message.FileSizeExceed'; }
    if (!fileTypeAccept) { return 'SampleOutDPL.Message.NotAllowThisUploadFileType'; }
    return;
  }

  // 顯示Dialog
  private showMsgDialog(labels: any, mode: string) {
    if ((typeof labels) === 'string') { labels = [labels] }

    this.noticeContentList = new Array<string>();

    labels.forEach(label => {
      this.noticeContentList.push(this.translateService.instant(label));
    })

    this.noticeCheckDialogParams = {
      title: this.translateService.instant('LicenseMgmt.Common.Title.Notification'),
      visiable: true,
      mode: mode
    };
  }

  private openSpinner() { this.showSpinner = true; }
  private closeSpinner() { this.showSpinner = false; }
}
