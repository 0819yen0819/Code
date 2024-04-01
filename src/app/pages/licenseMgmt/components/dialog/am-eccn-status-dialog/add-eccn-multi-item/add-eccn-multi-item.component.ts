import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnInit,
  Output,
} from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { takeLast } from 'rxjs';
import {
  FileUploader,
  FileUploaderManager,
} from 'src/app/core/model/file-uploader';
import { DialogSettingParams } from 'src/app/core/model/selector-dialog-params';
import { CommonApiService } from 'src/app/core/services/common-api.service';
import { LicenseControlApiService } from 'src/app/core/services/license-control-api.service';
import { LoaderService } from 'src/app/core/services/loader.service';
import { LicenseViewerHeaderService } from '../../../common/license-viewer-header/license-viewer-header.service';

@Component({
  selector: 'app-add-eccn-multi-item',
  templateUrl: './add-eccn-multi-item.component.html',
  styleUrls: ['./add-eccn-multi-item.component.scss'],
})
export class AddEccnMultiItemComponent implements OnInit, OnChanges {
  @Input() isDialogClose: boolean;
  @Output() isUploadDone: EventEmitter<any> = new EventEmitter<any>();

  //>notice check dialog params
  noticeCheckDialogParams!: DialogSettingParams;
  //> error message list
  noticeContentList!: string[];

  //>file upload component settings
  fileUploaderSettings!: FileUploader;

  fileUploader!: any;

  isUploadSuccess!: boolean;

  selectedFileList: File[] = []; // p-fileload target file array
  constructor(
    private licenseControlApiService: LicenseControlApiService,
    private loaderService: LoaderService,
    private translateService: TranslateService,
    private commonApiService: CommonApiService,
    private licenseViewerHeaderService: LicenseViewerHeaderService
  ) {}

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
    this.commonApiService.downloadFile(2086);
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
    this.loaderService.show();
    this.licenseControlApiService
      .addECCNListByFile(this.selectedFileList[0])
      .pipe(takeLast(1))
      .subscribe({
        next: () => {
          this.loaderService.hide();
          this.isUploadSuccess = true;
          this.noticeContentList = [
            this.translateService.instant(
              'LicenseMgmt.Common.Hint.CreateSuccess'
            ),
          ];
          this.noticeCheckDialogParams = {
            title: this.translateService.instant(
              'LicenseMgmt.Common.Title.Notification'
            ),
            visiable: true,
          };
        },
        error: (err) => {
          console.error(err);
          this.isUploadSuccess = false;
          this.noticeContentList = err.error.errors;
          this.noticeCheckDialogParams = {
            title: this.translateService.instant(
              'LicenseMgmt.Common.Title.Notification'
            ),
            visiable: true,
            mode: 'error',
          };

          this.selectedFileList = new Array();
          this.fileUploader.clear();
          this.loaderService.hide();
        },
      });
  }

  onCloseAddItemDialog(): void {
    if (this.fileUploader != undefined) {
      this.fileUploader.clear();
    }
    this.isUploadDone.emit();
  }

  onNoticeDialogClose(): void {
    if (this.isUploadSuccess) {
      this.onCloseAddItemDialog();
      this.licenseViewerHeaderService.setReloadNotice(true);
    }
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
