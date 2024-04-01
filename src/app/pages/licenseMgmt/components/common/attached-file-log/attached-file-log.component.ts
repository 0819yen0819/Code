import { Component, Input, OnChanges, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import {
  BehaviorSubject,
  Observable,
  Subject,
  lastValueFrom,
  combineLatest,
} from 'rxjs';
import { skipWhile, takeUntil } from 'rxjs/operators';
import { TableCol } from 'src/app/core/model/data-table-cols';
import {
  DataTableParams,
  DataTableSettings,
} from 'src/app/core/model/data-table-view';
import { AttachedFileLog } from 'src/app/core/model/file-info';
import { DialogSettingParams } from 'src/app/core/model/selector-dialog-params';
import { MyFlowService } from 'src/app/core/services/my-flow.service';
import { ObjectFormatService } from 'src/app/core/services/object-format.service';
import { SessionService } from 'src/app/core/services/session.service';
import { UserContextService } from 'src/app/core/services/user-context.service';

/*
  Description: AttachedFileLogComponent 使用 AttachmentUploaderComponent 取代
  Date: 2024-01-15
*/
@Component({
  selector: 'app-common-attached-file-log',
  templateUrl: './attached-file-log.component.html',
  styleUrls: ['./attached-file-log.component.scss'],
})
export class AttachedFileLogComponent implements OnInit, OnChanges, OnDestroy {
  //TODO：formStatus 無作用，後續需拔除
  //# 必輸入 formNo / formTypeId

  @Input() formNo!: string;
  @Input() formStatus!: string;
  @Input() formTypeId: string;
  private unsubscribeEvent = new Subject();

  attachedFilesTableCols!: TableCol[];
  attachedURLTableCols!: TableCol[];
  attachedFilesData!: BehaviorSubject<AttachedFileLog[]>;
  attachedURLData!: BehaviorSubject<AttachedFileLog[]>;
  dataTableSettings!: DataTableParams;

  isAddAttachedShow!: boolean;

  //>form audit action dialog dialog params
  formAuditActionDialogParams!: DialogSettingParams;

  cacheFormNo: BehaviorSubject<string | null> = new BehaviorSubject(null);
  cacheFormTypeId: BehaviorSubject<string | null> = new BehaviorSubject(null);

  waitApproveList!: string[];
  waitAssigneeList!: string[];

  constructor(
    private myFlowService: MyFlowService,
    private objectFormatService: ObjectFormatService,
    private sessionService: SessionService,
    private translateService: TranslateService,
    private router: Router,
    private userContextService: UserContextService
  ) { }

  ngOnInit(): void {
    this.attachedFilesTableCols = [
      { field: 'uploadDate', label: 'UploadDate' },
      { field: 'fileName', label: 'File Name' },
      { field: 'uploadName', label: 'User Name' },
      { field: 'delete', label: 'Action' },
    ];

    this.attachedURLTableCols = [
      { field: 'uploadDate', label: 'UploadDate' },
      { field: 'url', label: 'Url' },
      { field: 'uploadName', label: 'User Name' },
      { field: 'delete', label: 'Action' },
    ];

    this.attachedFilesData = new BehaviorSubject<Array<AttachedFileLog>>([]);
    this.attachedURLData = new BehaviorSubject<Array<AttachedFileLog>>([]);

    combineLatest([
      this.cacheFormNo.pipe(skipWhile((x) => !x)),
      this.cacheFormTypeId.pipe(skipWhile((x) => !x)),
    ])
      .pipe(takeUntil(this.unsubscribeEvent))
      .subscribe(async (res) => {
        const formStatus = await lastValueFrom(
          this.myFlowService.getFormLog(res[0], res[1])
        );

        const formAuditLog = await lastValueFrom(
          this.myFlowService.getFlowAuditLog(res[0], res[1])
        );

        this.waitApproveList = new Array<string>();
        this.waitAssigneeList = new Array<string>();

        for (const log of formAuditLog) {
          if (log.status === 'Approving') {
            this.waitApproveList.push(log['signerCode'].trim());
          }
          if (log.status === 'Assignee') {
            this.waitAssigneeList.push(log['signerCode'].trim());
          }
        }

        const curUserCode = this.userContextService.user$.getValue().userCode;

        if (
          formStatus.status === null ||
          formStatus.status === 'Draft' ||
          (formStatus.status === 'Approving' &&
            this.router.url.includes('approving') &&
            (this.waitApproveList.includes(curUserCode) ||
              this.waitAssigneeList.includes(curUserCode)))
        ) {
          this.isAddAttachedShow = true;
        } else {
          this.isAddAttachedShow = false;
        }
      });

    this.translateService.onLangChange
      .pipe(takeUntil(this.unsubscribeEvent))
      .subscribe(() => {
        this.onInitAttachedFileLogView();
        this.onInitDataTableSettings();
      });

    this.onInitDataTableSettings();
  }

  onInitDataTableSettings(): void {
    this.dataTableSettings = new DataTableSettings();
    this.dataTableSettings.isShowNoDataInfo = true;
    this.dataTableSettings.noDataConText = this.translateService.instant(
      'LicenseMgmt.Common.Hint.NoData'
    );

    this.attachedFilesData = new BehaviorSubject<Array<AttachedFileLog>>([]);
    this.attachedURLData = new BehaviorSubject<Array<AttachedFileLog>>([]);
  }

  ngOnChanges(): void {
    //> 能 show 附件上傳按鈕規則
    //> 1. 草稿單
    //> 2. on Flowing & 在簽核頁面
    this.cacheFormNo.next(this.formNo);
    this.cacheFormTypeId.next(this.formTypeId);

    this.onInitDataTableSettings();
    this.onInitAttachedFileLogView();
  }

  ngOnDestroy(): void {
    this.sessionService.removeItem('fileNum');
    this.cacheFormNo.complete();
    this.cacheFormTypeId.complete();
    this.unsubscribeEvent.next(null);
    this.unsubscribeEvent.complete();
  }

  //> open audit action dialog
  onAddAttachedDialogHandler(): void {
    this.formAuditActionDialogParams = {
      title: this.translateService.instant(
        'LicenseMgmt.Common.Title.AddFileOrLink'
      ),
      visiable: true,
      data: {
        formNo: this.formNo,
      },
    };
  }

  onInitAttachedFileLogView(): void {
    //> get target form attacheds list
    const getTargetExistAttachedList$ = (formNo: string) =>
      new Observable<AttachedFileLog[]>((obs) => {
        this.myFlowService
          .getFormFile(formNo, this.formTypeId)
          .subscribe((res) => {
            obs.next(res);
            obs.complete();
          });
      });
    if (this.formNo) {
      getTargetExistAttachedList$(this.formNo).subscribe((attachedsList) => {
        attachedsList.forEach((data) => {
          data.uploadDate = this.objectFormatService.DateTimeFormat(
            new Date(data.uploadDate),
            '/'
          );
        });

        this.attachedFilesData.next(
          attachedsList.filter((data) => data.type == 'File')
        );

        this.attachedURLData.next(
          attachedsList.filter((data) => data.type == 'Url')
        );

        this.sessionService.setItem(
          'fileNum',
          this.attachedFilesData.getValue().length
        );
      });
    }
  }
}
