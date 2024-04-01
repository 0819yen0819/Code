import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { Observable, takeLast } from 'rxjs';
import {
  FileUploader,
  FileUploaderManager
} from 'src/app/core/model/file-uploader';
import { DialogSettingParams } from 'src/app/core/model/selector-dialog-params';
import { CommonApiService } from 'src/app/core/services/common-api.service';
import { LicenseControlApiService } from 'src/app/core/services/license-control-api.service';
import { LoaderService } from 'src/app/core/services/loader.service';

@Component({
  selector: 'app-sc047-v2-item-batch-handler',
  templateUrl: './sc047-v2-item-batch-handler.component.html',
  styleUrls: ['./sc047-v2-item-batch-handler.component.scss'],
})
export class Sc047V2ItemBatchHandlerComponent implements OnInit {
  @Input() formNo: string = '';
  @Output() outputResult: EventEmitter<any[]> = new EventEmitter<any[]>();

  //>notice check dialog params
  noticeCheckDialogParams!: DialogSettingParams;
  //> error message list
  noticeContentList!: string[];

  //>file upload component settings
  fileUploaderSettings!: FileUploader;

  fileUploader!: any;

  selectedFileList: File[] = [];
  constructor(
    private translateService: TranslateService,
    private licenseControlApiService: LicenseControlApiService,
    private commonApiService: CommonApiService,
    private loaderService: LoaderService
  ) {}

  ngOnInit(): void {
    //> init file uploader settings
    this.fileUploaderSettings = new FileUploaderManager();
    this.fileUploaderSettings.showUploadButton = true;
    this.fileUploaderSettings.fileLimit = null;
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
      ? this.showDialog(fileErrorHint)
      : (this.selectedFileList = file.currentFiles);

    this.fileUploader = fileUploader;
  }

  onFileRemoveHandler(): void {
    this.selectedFileList = new Array();
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
      this.showDialog(fileUnexpectMsg.pop());
      return false;
    }
    {
      return true;
    }
  }

  onDropHandler(event) {
    this.selectedFileList = event.files;
  }

  // Handle drop error
  onDropError(event) {
    this.showDialog(event);
  }

  onExportFormItemEvent(): void {
    const getTargetSCFormItemListNo$ = (): Observable<number> =>
      new Observable<any>((obs) => {
        this.licenseControlApiService
          .getTargetSCFormItemListNo(this.formNo)
          .pipe(takeLast(1))
          .subscribe({
            next: (res) => {
              obs.next(res.fileId);
              obs.complete();
            },
            error: (err) => {
              console.error(err);
              this.noticeContentList = [err.message];
              this.noticeCheckDialogParams = {
                title: this.translateService.instant(
                  'LicenseMgmt.Common.Title.Notification'
                ),
                visiable: true,
                mode: 'error',
              };
              obs.complete();
            },
          });
      });

    this.loaderService.show();
    getTargetSCFormItemListNo$().subscribe((res) => {
      this.loaderService.hide();
      this.commonApiService.downloadFile(res);
    });
  }

  onRenewItemListbyFile(fileUploader: any): void {
    const renewSCFormItemListbyFile$ = (file: File): Observable<any> =>
      new Observable<any>((obs) => {
        this.licenseControlApiService
          .renewSCFormItemListbyFile(this.formNo, file)
          .pipe(takeLast(1))
          .subscribe({
            next: (res) => {
              this.loaderService.hide();
              this.selectedFileList = new Array();
              fileUploader.clear();
              obs.next(res.datas);
              obs.complete();
            },
            error: (err) => {
              this.loaderService.hide();
              this.noticeContentList = err.error.errors;
              this.noticeCheckDialogParams = {
                title: this.translateService.instant(
                  'LicenseMgmt.Common.Title.Notification'
                ),
                visiable: true,
                mode: 'error',
              };
              obs.complete();
            },
          });
      });

    this.loaderService.show();
    renewSCFormItemListbyFile$(this.selectedFileList[0]).subscribe((res) => {
      this.loaderService.hide();
      this.outputResult.emit(res);
    });
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
  private showDialog(label: string) {
    this.noticeContentList = new Array<string>();
    this.noticeContentList.push(this.translateService.instant(label));
    this.noticeCheckDialogParams = {
      title: this.translateService.instant(
        'LicenseMgmt.Common.Title.Notification'
      ),
      visiable: true,
    };
  }
}
