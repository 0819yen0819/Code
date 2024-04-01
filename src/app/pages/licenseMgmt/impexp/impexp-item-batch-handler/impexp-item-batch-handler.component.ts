import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { concatMap, Observable, take, takeLast } from 'rxjs';
import { FormTypeEnum } from 'src/app/core/enums/license-name';
import {
  FileUploader,
  FileUploaderManager
} from 'src/app/core/model/file-uploader';
import { DialogSettingParams } from 'src/app/core/model/selector-dialog-params';
import { CommonApiService } from 'src/app/core/services/common-api.service';
import { LicenseControlApiService } from 'src/app/core/services/license-control-api.service';
import { LoaderService } from 'src/app/core/services/loader.service';
import { ObjectFormatService } from 'src/app/core/services/object-format.service';

@Component({
  selector: 'app-impexp-item-batch-handler',
  templateUrl: './impexp-item-batch-handler.component.html',
  styleUrls: ['./impexp-item-batch-handler.component.scss'],
})
export class ImpexpItemBatchHandlerComponent implements OnInit {
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
    private activatedRoute: ActivatedRoute,
    private licenseControlApiService: LicenseControlApiService,
    private commonApiService: CommonApiService,
    private loaderService: LoaderService,
    private objectFormatService: ObjectFormatService
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
    const curFormStatus$ = (): Observable<any> =>
      new Observable<any>((obs) => {
        this.activatedRoute.queryParams.pipe(take(1)).subscribe((res) => {
          obs.next({ ...res, ...{ formNo: this.formNo } });
          obs.complete();
        });
      });

    const getTargetIMPFormItemListNo$ = (): Observable<number> =>
      new Observable<any>((obs) => {
        this.licenseControlApiService
          .getTargetIMPFormItemListNo(this.formNo)
          .pipe(takeLast(1))
          .subscribe({
            next: (res) => {
              obs.next(res.fileId);
              obs.complete();
            },
            error: (err) => {
              this.loaderService.hide();
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

    const getTargetEXPFormItemListNo$ = (): Observable<number> =>
      new Observable<any>((obs) => {
        this.licenseControlApiService
          .getTargetEXPFormItemListNo(this.formNo)
          .pipe(takeLast(1))
          .subscribe({
            next: (res) => {
              obs.next(res.fileId);
              obs.complete();
            },
            error: (err) => {
              this.loaderService.hide();
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
    curFormStatus$()
      .pipe(
        concatMap((res) => {
          if (res.type === FormTypeEnum.LICENSE_IMP) {
            return getTargetIMPFormItemListNo$();
          } else {
            return getTargetEXPFormItemListNo$();
          }
        })
      )
      .subscribe((res) => {
        this.loaderService.hide();
        this.commonApiService.downloadFile(res);
      });
  }

  onRenewItemListbyFile(fileUploader: any): void {
    const curFormStatus$ = (): Observable<any> =>
      new Observable<any>((obs) => {
        this.activatedRoute.queryParams.pipe(take(1)).subscribe((res) => {
          obs.next({ ...res, ...{ formNo: this.formNo } });
          obs.complete();
        });
      });

    const renewEXPFormItemListbyFile$ = (file: File): Observable<any> =>
      new Observable<any>((obs) => {
        this.licenseControlApiService
          .renewEXPFormItemListbyFile(this.formNo, file)
          .pipe(takeLast(1))
          .subscribe({
            next: (res) => {
              for (const item of res.itemList) {
                item.startDate = this.objectFormatService.DateFormat(
                  new Date(item.startDate),'/'
                );
                item.endDate = this.objectFormatService.DateFormat(
                  new Date(item.endDate),'/'
                );
              }
              obs.next(res.itemList);
              obs.complete();
            },
            error: (err) => {
              this.loaderService.hide();
              console.error(err);
              this.noticeContentList = err.error.errors
                ? err.error.errors
                : [err.message];
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

    const renewIMPFormItemListbyFile$ = (file: File): Observable<any> =>
      new Observable<any>((obs) => {
        this.licenseControlApiService
          .renewIMPFormItemListbyFile(this.formNo, file)
          .pipe(takeLast(1))
          .subscribe({
            next: (res) => {
              for (const item of res.itemList) {
                item.startDate = this.objectFormatService.DateFormat(
                  new Date(item.startDate),'/'
                );
                item.endDate = this.objectFormatService.DateFormat(
                  new Date(item.endDate),'/'
                );
              }
              obs.next(res.itemList);
              obs.complete();
            },
            error: (err) => {
              this.loaderService.hide();
              console.error(err);
              this.noticeContentList = err.error.errors
                ? err.error.errors
                : [err.message];
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
    curFormStatus$()
      .pipe(
        concatMap((res) => {
          if (res.type === FormTypeEnum.LICENSE_IMP) {
            return renewIMPFormItemListbyFile$(this.selectedFileList[0]);
          } else {
            return renewEXPFormItemListbyFile$(this.selectedFileList[0]);
          }
        })
      )
      .subscribe((res) => {
        this.loaderService.hide();
        this.selectedFileList = new Array();
        fileUploader.clear();
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
