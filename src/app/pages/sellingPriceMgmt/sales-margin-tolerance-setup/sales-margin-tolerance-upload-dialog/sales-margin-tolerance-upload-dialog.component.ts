import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnInit,
  Output,
  ViewChild,
} from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import {
  FileUploader,
  FileUploaderManager,
} from 'src/app/core/model/file-uploader';
import { DialogSettingParams } from 'src/app/core/model/selector-dialog-params';
import { CommonApiService } from 'src/app/core/services/common-api.service';
import { LoaderService } from 'src/app/core/services/loader.service';
import { SalesMarginToleranceApiService } from 'src/app/core/services/sales-margin-tolerance-api.service';
import { SalesMarginToleranceSetupService } from '../sales-margin-tolerance-setup.service';

@Component({
  selector: 'sales-margin-tolerance-upload-dialog',
  templateUrl: './sales-margin-tolerance-upload-dialog.component.html',
  styleUrls: ['./sales-margin-tolerance-upload-dialog.component.scss'],
})
export class SalesMarginToleranceUploadDialogComponent implements OnInit, OnChanges {
  @Input() isDialogClose: boolean;
  @Output() saveEmitter = new EventEmitter<any>();
  @Output() closeDialog = new EventEmitter<any>();
  //>notice check dialog params
  noticeCheckDialogParams!: DialogSettingParams;
  //> error message list
  noticeContentList!: string[];

  //>file upload component settings
  fileUploaderSettings!: FileUploader;

  fileUploader!: any;

  isUploadSuccess!: boolean;
  showError: boolean = false;

  selectedFileList: File[] = []; // p-fileload target file array
  constructor(
    private loaderService: LoaderService,
    private translateService: TranslateService,
    private commonApiService: CommonApiService,
    private salesMarginToleranceSetupService: SalesMarginToleranceSetupService,
    private salesMarginToleranceApiService: SalesMarginToleranceApiService,

  ) { }

  ngOnInit(): void {
    //> init file uploader settings
    this.fileUploaderSettings = new FileUploaderManager();
  }

  ngOnChanges(): void {
    if (this.isDialogClose) {
      this.selectedFileList = new Array();
      this.isUploadSuccess = false;
    }
  }

  onDownloadSampleFileEvent(): void {
    this.commonApiService.downloadFile(3);
  }

  onDropHandler(event) {
    this.selectedFileList = event.files;
  }

  // Handle drop error
  onDropError(event) {
    this.showMsgDialog(event, 'error');
  }

  // Handle user select limit
  customeSelectFileAccept(file: any, fileUploader: any) {
    let fileUnexpectMsg = [];
    file.currentFiles.forEach((selectFile) => {
      fileUnexpectMsg.push(
        this.isAcceptFile(selectFile, this.fileUploaderSettings.accept)
      );
    });

    const haveUnexepectFile =
      fileUnexpectMsg.filter((item) => item !== undefined).length > 0;

    if (haveUnexepectFile) {
      fileUploader.clear();
      this.showMsgDialog(fileUnexpectMsg.pop(), 'error');
      return false;
    }
    {
      return true;
    }
  }

  onFileRemoveHandler(): void {
    this.selectedFileList = new Array();
  }

  onFileUploadHandler(file: any, fileUploader: any): void {
    if (!this.customeSelectFileAccept(file, fileUploader)) {
      return;
    }
    this.selectedFileList = [...this.selectedFileList]; // avoid to primeNG default list opt.
    const fileErrorHint = this.isAcceptFile(
      file.currentFiles[0],
      this.fileUploaderSettings.accept
    );
    fileErrorHint
      ? this.showMsgDialog(fileErrorHint, 'error')
      : (this.selectedFileList = file.currentFiles);

    this.fileUploader = fileUploader;
  }

  onFormSubmit() {

    if (!this.selectedFileList || this.selectedFileList.length == 0) {
      return;
    }
    this.loaderService.show();
    const formData: FormData = new FormData();

    formData.append('file', this.selectedFileList[0]);

    this.salesMarginToleranceApiService.uploadSalesMargin(formData).subscribe({
      next: (rsp) => {
        this.loaderService.hide();
        this.showMsgDialog('SalesMarginToleranceSetup.Msg.UploadSuccessfully', 'success');
        this.fileUploader?.clear();
        this.selectedFileList = new Array();
      },
      error: (rsp) => {
        if(rsp.error?.errors?.length>0){
          this.showMulitpleMsgDialog(rsp.error.errors,'error')
        }else if (rsp.error?.message) {
          let msg = rsp.error.message;
          if (rsp.error.errors && rsp.error.errors.length > 0) {
            msg += ':' + rsp.error.errors;
            this.showMsgDialog(msg, 'error');
          }
        } else {
          this.showMsgDialog('System.Message.Error', 'error');
        }
        this.selectedFileList = new Array();
        this.fileUploader?.clear();
        this.loaderService.hide();
      }
    });
  }

  onCloseAddItemDialog(): void {
    if (this.fileUploader != undefined) {
      this.fileUploader.clear();
    }
    this.closeDialog.emit();
  }

  // 手動上傳允許的檔案格式
  private isAcceptFile(
    file: File,
    acceptFileType: string = '',
    maxFileSize: number = 40 * 1024 * 1024
  ) {
    const fileType = file.name?.split('.')?.pop() || '';
    const fileSizeAccept = file.size < maxFileSize;
    const fileTypeAccept =
      acceptFileType.split(',').includes('.' + fileType) ||
      acceptFileType === '';
    if (!fileSizeAccept) {
      return 'SampleOutDPL.Message.FileSizeExceed';
    }
    if (!fileTypeAccept) {
      return 'SampleOutDPL.Message.NotAllowThisUploadFileType';
    }
    return;
  }

  // 顯示Dialog
  private showMsgDialog(label: string, mode?: string) {
    this.showError = mode == 'error' ? true : false;// 決定按下關閉時是否徹底關閉全部開窗
    this.noticeContentList = new Array<string>();
    this.noticeContentList.push(this.translateService.instant(label));
    this.noticeCheckDialogParams = {
      title: this.translateService.instant(
        'SalesMarginToleranceSetup.Label.Notification'
      ),
      visiable: true,
      mode: mode
    };
  }

  private showMulitpleMsgDialog(label: string[],mode: string) {
    if (label.length === 0) { return; }
    this.showError = mode == 'error' ? true : false;// 決定按下關閉時是否徹底關閉全部開窗
    this.noticeContentList = new Array<string>();
    label.forEach(msg => { this.noticeContentList.push(this.translateService.instant(msg)); });
    this.noticeCheckDialogParams = {
      title: this.translateService.instant('SalesMarginToleranceSetup.Label.Notification'),
      visiable: true,
      mode:mode
    };
  }

  /**
   * 控制msg顯示後是否徹底關閉全部開窗，正確時才要
   */
  msgDialogOnClose() {
    if (!this.showError) {
      this.onCloseAddItemDialog();
      this.saveEmitter.emit(undefined);
    }
  }

}
