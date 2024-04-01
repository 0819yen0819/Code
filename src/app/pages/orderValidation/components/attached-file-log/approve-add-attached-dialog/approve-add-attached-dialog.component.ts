import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnInit,
  Output,
  SimpleChanges,
} from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { TranslateService } from '@ngx-translate/core';
import {
  BehaviorSubject,
  catchError,
  concatMap,
  from,
  mergeMap,
  Observable,
  Subject,
  takeLast,
  throwError,
} from 'rxjs';
import { AttachedLink } from 'src/app/core/model/attached-add-about';
import {
  AttachedFileLog,
  FileUploadCallback,
  SaveFileLog,
} from 'src/app/core/model/file-info';
import {
  FileUploader,
  FileUploaderManager,
} from 'src/app/core/model/file-uploader';
import { DialogSettingParams } from 'src/app/core/model/selector-dialog-params';
import { LoaderService } from 'src/app/core/services/loader.service';
import { MyFlowService } from 'src/app/core/services/my-flow.service';
import { ObjectFormatService } from 'src/app/core/services/object-format.service';
import { ConfirmationService as NGConfirmationService } from 'primeng/api';
import { ToastService } from 'src/app/core/services/toast.service';

@Component({
  selector: 'sov-app-common-approve-add-attached-dialog',
  templateUrl: './sov-approve-add-attached-dialog.component.html',
  styleUrls: ['./sov-approve-add-attached-dialog.component.scss'],
})
export class SovApproveAttachedDialogComponent implements OnInit, OnChanges {
  @Input() settingParams!: DialogSettingParams;
  @Output() isClose: EventEmitter<boolean> = new EventEmitter<boolean>();
  @Input() attachedFilesData;
  @Input() attachedURLData;
  @Input() formTypeId:string;

  private unsubscribeEvent = new Subject();

  //>file upload component settings
  fileUploaderSettings!: FileUploader;

  dialogSetting!: BehaviorSubject<DialogSettingParams>;

  formGroup!: FormGroup;

  selectedFileList!: BehaviorSubject<File[]>;
  existFileList!: BehaviorSubject<AttachedFileLog[]>;
  existURLList!: BehaviorSubject<AttachedFileLog[]>;

  isUploadPassed!: boolean;
  isDefaultNotice!: boolean;

  //>notice check dialog params
  noticeCheckDialogParams!: DialogSettingParams;
  //> error message list
  noticeContentList!: string[];

  constructor(
    private formbuilder: FormBuilder,
    private translateService: TranslateService,
    private myFlowService: MyFlowService,
    private loaderService: LoaderService,
    private objectFormatService: ObjectFormatService,
    private ngConfirmationService: NGConfirmationService,
    private toastService: ToastService
  ) {}

  ngOnInit(): void {
    this.onInitFileUploadSettings();
    this.onInitApproveAttachedList();
  }

  ngOnChanges(changes: SimpleChanges): void {
    //> when any changes, reset dialog setting params
    if (!changes.settingParams){return}
    if (this.dialogSetting) {
      this.dialogSetting.next({
        ...this.dialogSetting.getValue(),
        ...this.settingParams,
      });

      if (!this.settingParams.visiable) {
        this.unsubscribeEvent.next(null);
        this.unsubscribeEvent.complete();
      } else {
        this.isDefaultNotice = true;
        this.onInitFileUploadSettings();
        this.onGetTargetFormAttachedList();
      }
    }
  }

  onInitFileUploadSettings(): void {
    //> init file uploader settings
    this.fileUploaderSettings = new FileUploaderManager();
    this.fileUploaderSettings.multiple = true;
    this.fileUploaderSettings.fileLimit = null;
    this.fileUploaderSettings.chooseLabel = this.translateService.instant(
      'LicenseMgmt.Common.Hint.AddFileCKMe'
    );
    //> max 40MBs
    this.fileUploaderSettings.maxFileSize = 40 * 1024 * 1024;
    this.fileUploaderSettings.showUploadButton = true;
    this.fileUploaderSettings.accept = '';
  }

  onInitApproveAttachedList(): void {
    //> init dialog setting
    this.dialogSetting = new BehaviorSubject<DialogSettingParams>({
      title: '',
      visiable: false,
      modal: true,
      maximized: true,
      draggable: false,
      resizeable: true,
      blockScroll: true,
    });

    this.formGroup = this.formbuilder.group({
      url: [
        null,
        [Validators.required, Validators.pattern(/(http|https):\/\//)],
      ],
    });

    this.selectedFileList = new BehaviorSubject<File[]>([]);
    this.existFileList = new BehaviorSubject<AttachedFileLog[]>([]);
    this.existURLList = new BehaviorSubject<AttachedFileLog[]>([]);

    this.noticeCheckDialogParams = {
      visiable: false,
    };
  }

  //> 表單 已存在檔案列表
  onGetTargetFormAttachedList() {
    const getTargetFormAttachedList$ = (formNo: string) =>
      new Observable<AttachedFileLog[]>((obs) => {
        this.myFlowService.getFormFile(formNo,this.formTypeId).subscribe((res) => {
          obs.next(res);
          obs.complete();
        });
      });

    getTargetFormAttachedList$(
      this.dialogSetting.getValue().data.formNo
    ).subscribe((attachedList) => {
      attachedList.forEach((item) => {
        item.uploadDate = this.objectFormatService.DateTimeFormat(
          new Date(item.uploadDate),'/'
        );
      });

      this.existURLList.next(attachedList.filter((data) => data.type == 'Url'));
      this.existFileList.next(
        attachedList.filter((data) => data.type == 'File')
      );
    });
  }

  onSaveAttachedURLLogEvent(): void {
    //> save attaced file url
    const saveAttachedURLLog$ = (
      url: AttachedLink['url']
    ): Observable<boolean> =>
      new Observable<boolean>((obs) => {
        const model = {
          formNo: this.dialogSetting.getValue().data.formNo,
          url: url,
          formTypeId:this.formTypeId
        };
        this.myFlowService
          .uploadFormFileUrl(model)
          .pipe(takeLast(1))
          .subscribe({
            next: () => {
              obs.next(true);
              obs.complete();
            },
            error: (err) => {
              obs.error(err.error.message);
              obs.complete();
            },
          });
      });

    this.noticeContentList = new Array<string>();

    if (
      this.existURLList
        .getValue()
        .filter((data) => data.url == this.formGroup.get('url').value)
        .length === 0
    ) {
      this.loaderService.show();
      saveAttachedURLLog$(this.formGroup.get('url').value).subscribe({
        next: () => {
          this.toastService.success(
            `${this.translateService.instant(
              'LicenseMgmt.Common.Hint.AddURLSuccess'
            )}`
          );
          this.loaderService.hide();

          this.formGroup.reset();
          this.isUploadPassed = true;
          this.isClose.emit();
          this.onGetTargetFormAttachedList();
        },
        error: (err) => {
          this.noticeContentList.push(
            `${this.translateService.instant(
              'LicenseMgmt.Common.Hint.AddURLFailed'
            )}：${err}`
          );

          this.toastService.error(`${this.noticeContentList.join('\n')}`);
          this.loaderService.hide();

          this.isUploadPassed = false;
        },
      });
    } else {
      this.noticeContentList.push(
        `${this.translateService.instant(
          'LicenseMgmt.Common.Hint.URLExistTemOrQueueList'
        )}`
      );
      this.noticeCheckDialogParams = {
        title: this.translateService.instant(
          'LicenseMgmt.Common.Title.Notification'
        ),
        visiable: true,
        mode: 'error',
      };

      this.isUploadPassed = false;
    }
  }

  onSaveAttachedFileEvent(event, fileUploader: any): void {
    //> upload attaced file
    const uploadAttachedFile$ = (
      file: File
    ): Observable<FileUploadCallback | boolean> =>
      new Observable<FileUploadCallback | boolean>((obs) => {
        this.myFlowService
          .uploadFile(this.dialogSetting.getValue().data.formNo, file)
          .pipe(takeLast(1))
          .subscribe({
            next: (res) => {
              obs.next({
                fileId: res.fileId,
                fileName: res.fileName,
                filePath: res.filePath,
              });
              obs.complete();
            },
            error: (err) => {
              console.error(err);
              obs.error(err.error.message);
              obs.complete();
            },
          });
      });

    //> save attaced file log
    const saveAttachedFileLog$ = (model: SaveFileLog): Observable<boolean> =>
      new Observable<boolean>((obs) => {
        this.myFlowService
          .addFormFile(model)
          .pipe(takeLast(1))
          .subscribe({
            next: () => {
              obs.next(true);
              obs.complete();
            },
            error: (err) => {
              obs.error(err.message);
              obs.complete();
            },
          });
      });

    this.noticeContentList = new Array();

    this.loaderService.show();
    from(this.selectedFileList.getValue())
      .pipe(
        mergeMap((file) =>
          uploadAttachedFile$(file).pipe(
            concatMap((res) => {
              if (typeof res !== 'boolean') {
                const model: SaveFileLog = {
                  ...res,
                  formNo: this.dialogSetting.getValue().data.formNo,
                  formTypeId:this.formTypeId
                };
                return saveAttachedFileLog$(model);
              }
            }),
            catchError((err) => throwError(() => `${err}`))
          )
        )
      )
      .subscribe({
        next: () => {
          this.toastService.success(
            `${this.translateService.instant(
              'LicenseMgmt.Common.Hint.AddFileSuccess'
            )}`
          );
          this.selectedFileList.next([]);
          this.loaderService.hide();

          this.isUploadPassed = true;

          this.isClose.emit();
          fileUploader.clear();
        },
        error: (err) => {
          console.error(err);
          this.noticeContentList = new Array<string>();

          if (err === 'Duplicate file name') {
            const currentSelectFile = event.files.map((item) => {
              return item.name;
            });
            const duplicateFiles = this.attachedFilesData
              .filter((file) => currentSelectFile.includes(file.fileName));
            duplicateFiles.forEach((duplicateFile) => {
              this.noticeContentList.push(
                `${duplicateFile.fileName} ${this.translateService.instant(
                  'LicenseMgmt.Common.Hint.FileExistTemOrQueueList'
                )}`
              );
            });
          } else {
            this.noticeContentList.push(
              `${this.translateService.instant(
                'LicenseMgmt.Common.Hint.AddFileFailed'
              )}：${err}`
            );
          }

          this.noticeCheckDialogParams = {
            title: this.translateService.instant(
              'LicenseMgmt.Common.Title.Notification'
            ),
            visiable: true,
            mode:'error'
          };
          this.loaderService.hide();

          this.isUploadPassed = false;
        },
      });
  }

  onNoticeDialogCloseHandler(): void {
    this.formGroup.reset();
    if (this.isUploadPassed && !this.isDefaultNotice) {
      this.onDialogClosed();
    }
  }

  onDialogHided(): void {
    if (!this.checkHasFileInQueneProcess()) {
      this.formGroup.reset();
      this.selectedFileList.next([]);
      this.isClose.emit();
    } else {
      this.ngConfirmationService.confirm({
        message: this.translateService.instant(
          'LicenseMgmt.Common.Hint.FileNotUploaded'
        ),
        header: 'Confirm',
        icon: 'pi pi-exclamation-triangle',
        key: 'approveAddAttachedDialog',
        accept: () => {
          this.formGroup.reset();
          this.selectedFileList.next([]);
          this.isClose.emit();
        },
        reject: () => {
          this.dialogSetting.next({
            ...this.dialogSetting.getValue(),
            ...{ visiable: true },
          });
        },
      });
    }
  }

  checkHasFileInQueneProcess(): boolean {
    if (this.selectedFileList.getValue().length > 0) {
      return true;
    } else {
      return false;
    }
  }

  onDialogClosed(): void {
    this.dialogSetting.next({
      ...this.dialogSetting.getValue(),
      ...{ visiable: false },
    });
  }

  //> Handle drop event
  onDropHandler(event: { files: any }) {
    this.noticeContentList = new Array<string>();

    for (const file of event.files) {
      if (
        this.selectedFileList
          .getValue()
          .findIndex((data) => data.name == file.name) == -1 &&
        this.existFileList
          .getValue()
          .findIndex((data) => data.fileName == file.name) == -1
      ) {
        this.selectedFileList.next([...this.selectedFileList.getValue(), file]);
      } else {
        this.noticeContentList.push(
          `${file.name} ${this.translateService.instant(
            'LicenseMgmt.Common.Hint.FileExistTemOrQueueList'
          )}`
        );
      }
    }

    if (this.noticeContentList.length > 0) {
      this.noticeCheckDialogParams = {
        title: this.translateService.instant(
          'LicenseMgmt.Common.Title.Notification'
        ),
        visiable: true,
        mode: 'error',
      };
    }
  }

  //> Handle drop error
  onDropErrorHandler(event) {
    this.showDialog(event);
  }

  //> Temp file uploader 新增事件
  onFileUploaderSelectHandler(fileList: any, fileUploader: any): void {
    if (!this.customeSelectFileAccept(fileList, fileUploader)) {
      return;
    }

    this.noticeContentList = new Array<string>();

    //> 檢測是否已經存在在佇列/已存在列表中
    for (const file of fileList.currentFiles) {
      if (
        this.selectedFileList
          .getValue()
          .findIndex((data) => data.name == file.name) == -1 &&
        this.existFileList
          .getValue()
          .findIndex((data) => data.fileName == file.name) == -1
      ) {
        this.selectedFileList.next([...this.selectedFileList.getValue(), file]);
      } else if (
        this.existFileList
          .getValue()
          .findIndex((data) => data.fileName == file.name) > -1
      ) {
        this.noticeContentList.push(
          `${file.name} ${this.translateService.instant(
            'LicenseMgmt.Common.Hint.FileExistTemOrQueueList'
          )}`
        );
      }
    }

    if (this.noticeContentList.length > 0) {
      this.noticeCheckDialogParams = {
        title: this.translateService.instant(
          'LicenseMgmt.Common.Title.Notification'
        ),
        visiable: true,
        mode: 'error',
      };
      fileUploader.clear();
    }

    //  fileUploader.clear();
  }

  //> Temp file uploader 刪除事件
  onTempFileDeleteHandler(fileInfo: File, fileUploader: any) {
    const removeTargetItem=(arr:File[],item:File)=>{
      const index=arr.findIndex(x=>x.name===item.name)
      if(index>-1){
        return [...arr.slice(0,index),...arr.slice(index+1)]
      }
     return arr
    }

    this.selectedFileList.next(removeTargetItem(this.selectedFileList.getValue(),fileInfo))

    if (this.selectedFileList.getValue().length == 0) {
      fileUploader.clear();
    }
  }

  //> Handle user select limit
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

  /**
   * 驗證連結是否有效
   *
   * @param url
   * @returns
   */
  isValidURL(url: string): boolean {
    if (url === undefined || !url) return false;

    if (!url.startsWith('http://') && !url.startsWith('https://')) return false;

    var res = url.match(
      /(http(s)?:\/\/.)?(www\.)?[-a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_\+.~#?&//=]*)/g
    );
    return res !== null;
  }

  //> 手動上傳允許的檔案格式
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

  //> 顯示 Notice Dialog
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
