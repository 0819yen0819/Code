import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnInit,
  Output
} from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { from, Observable, takeLast } from 'rxjs';
import {
  FileUploader,
  FileUploaderManager
} from 'src/app/core/model/file-uploader';
import {
  ItemInfo,
  LicenseItemInfo
} from './../../../../../../core/model/item-info';

import { DialogSettingParams } from 'src/app/core/model/selector-dialog-params';
import { CommonApiService } from 'src/app/core/services/common-api.service';
import { LicenseControlApiService } from 'src/app/core/services/license-control-api.service';
import { LoaderService } from 'src/app/core/services/loader.service';
import { SessionService } from 'src/app/core/services/session.service';

@Component({
  selector: 'app-add-imp-multi-item',
  templateUrl: './add-imp-multi-item.component.html',
  styleUrls: ['./add-imp-multi-item.component.scss'],
})
export class AddImpMultiItemComponent implements OnInit, OnChanges {
  @Input() closeNotice: boolean = true;
  @Output() outputMultiItem: EventEmitter<any> = new EventEmitter<any>();

  //>notice check dialog params
  noticeCheckDialogParams!: DialogSettingParams;
  //> error message list
  noticeContentList!: string[];

  //>file upload component settings
  fileUploaderSettings!: FileUploader;

  fileUploader!: any;

  selectedFileList: File[] = []; // p-fileload target file array

  constructor(
    private licenseControlApiService: LicenseControlApiService,
    private sessionService: SessionService,
    private loaderService: LoaderService,
    private translateService: TranslateService,
    private commonApiService: CommonApiService
  ) {}

  ngOnInit(): void {
    //> init file uploader settings
    this.fileUploaderSettings = new FileUploaderManager();
  }

  ngOnChanges(): void {
    if (this.closeNotice) {
      this.selectedFileList = new Array();
    }
  }

  onDownloadSampleFileEvent(): void {
    this.commonApiService.downloadFile(1990);
  }

  onDropHandler(event) {
    this.selectedFileList = event.files;
  }

  // Handle drop error
  onDropError(event) {
    this.showDialog(event);
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
      ? this.showDialog(fileErrorHint)
      : (this.selectedFileList = file.currentFiles);

    this.fileUploader = fileUploader;
  }

  onFormSubmit(): void {
    const getTargetItemInfo$ = (
      itemNo: ItemInfo['invItemNo']
    ): Observable<ItemInfo> =>
      new Observable<ItemInfo>((obs) => {
        this.commonApiService
          .getTargetItemInfo(itemNo)
          .pipe(takeLast(1))
          .subscribe((res) => {
            obs.next(res.itemInfo);
          });
      });
    const getMultiItemListByFile$ = (
      formNo: string,
      file: File
    ): Observable<any> =>
      new Observable<any>((obs) => {
        this.licenseControlApiService
          .getIMPMultiItemListByFile(formNo, file)
          .pipe(takeLast(1))
          .subscribe({
            next: (res) => {
              this.noticeCheckDialogParams = {
                visiable: false,
              };
              obs.next(res.itemList);
              obs.complete();
            },
            error: (err) => {
              console.error(err);
              if (err.status === 500) {
                this.noticeContentList = new Array<string>();
                this.noticeContentList = err.error.errors;
                this.noticeCheckDialogParams = {
                  title: this.translateService.instant(
                    'LicenseMgmt.Common.Title.Notification'
                  ),
                  visiable: true,
                  mode: 'error',
                };
              } else if (err.status === 504) {
                this.noticeContentList = new Array<string>();
                this.noticeContentList.push(
                  this.translateService.instant(
                    'LicenseMgmt.Common.Hint.Timeout'
                  )
                );
                this.noticeCheckDialogParams = {
                  title: err.error.message,
                  visiable: true,
                  mode: 'error',
                };
              } else {
                this.noticeContentList = new Array<string>();
                this.noticeContentList = ['System Error'];
                this.noticeCheckDialogParams = {
                  title: this.translateService.instant(
                    'LicenseMgmt.Common.Title.Notification'
                  ),
                  visiable: true,
                  mode: 'error',
                };
              }

              this.selectedFileList = new Array();
              this.loaderService.hide();
              this.fileUploader.clear();

              obs.complete();
            },
          });
      });

    this.loaderService.show();

    getMultiItemListByFile$(
      this.sessionService.getItem('CurFormNo'),
      this.selectedFileList[0]
    ).subscribe((res) => {
      let count = 0;
      from(res).subscribe((data: LicenseItemInfo) => {
        if (data.productCode) {
          getTargetItemInfo$(data.productCode).subscribe((itemInfo) => {
            data = {
              itemInfo,
              ...data,
              ...{
                specialFlag: 'N',
                specialLabel: 'N',
                startDate: new Date().getTime(),
              },
            };
            this.outputMultiItem.emit(data);
            count++;

            if (count == res.length) {
              this.loaderService.hide();
              this.fileUploader.clear();
            }
          });
        } else {
          data = {
            ...data,
            ...{
              specialFlag: 'N',
              specialLabel: 'N',
              startDate: new Date().getTime(),
            },
          };
          this.outputMultiItem.emit(data);
          count++;

          if (count == res.length) {
            this.loaderService.hide();
            this.fileUploader.clear();
          }
        }
      });
    });
  }

  onCloseAddItemDialog(): void {
    if (this.fileUploader != undefined) {
      this.fileUploader.clear();
    }
    this.outputMultiItem.emit(null);
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
      mode: 'error',
    };
  }
}
