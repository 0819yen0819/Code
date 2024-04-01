import { AuditHistoryLog } from 'src/app/core/model/sign-off-history';
import { CurFormInfoService } from 'src/app/pages/licenseMgmt/services/cur-form-info.service';
import { Component, Input, OnChanges, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { BehaviorSubject, Observable, Subject, take ,takeLast} from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { LicenseFormStatusEnum } from 'src/app/core/enums/license-form-status';
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
import { CurFormStatusService } from 'src/app/pages/licenseMgmt/services/cur-form-status.service';
import { UserContextService } from 'src/app/core/services/user-context.service';

@Component({
  selector: 'sov-app-common-attached-file-log',
  templateUrl: './sov-attached-file-log.component.html',
  styleUrls: ['./sov-attached-file-log.component.scss'],
})
export class SovAttachedFileLogComponent implements OnInit, OnChanges, OnDestroy {
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

  constructor(
    private myFlowService: MyFlowService,
    private objectFormatService: ObjectFormatService,
    private sessionService: SessionService,
    private router: Router,
    private translateService: TranslateService,
    private curFormStatusService: CurFormStatusService,
    private userContextService: UserContextService
  ) {}

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
    const getFlowAuditLog$ = (formNo: string, formTypeId: string) =>
      new Observable<AuditHistoryLog[]>((obs) => {
        if (formNo) {
          this.myFlowService
            .getFlowAuditLog(formNo, formTypeId)
            .pipe(takeLast(1))
            .subscribe((res) => {
              obs.next(res);
              obs.complete();
            });
        } else {
          obs.next([]);
          obs.complete();
        }
      });

    //> 能 show 附件上傳按鈕規則
    //> 1. 草稿單
    //> 2. on Flowing & 在簽核頁面
    if (this.formNo && this.formTypeId) {
      getFlowAuditLog$(this.formNo, this.formTypeId).subscribe((auditHistoryLog) => {
        const waitApproveList = new Array<string>()
        const waitAssigneeList = new Array<string>()
        for (const log of auditHistoryLog) {
          if (log.status === 'Approving') {
            waitApproveList.push(
              `${log['signerCode'].trim()}`
            );
          }

          if (log.status === 'Assignee') {
            waitAssigneeList.push(
              `${log['signerCode'].trim()}`
            );
          }
        }

        const userCode = this.userContextService.user$.getValue().userCode
        if (userCode && (waitApproveList.includes(userCode) || waitAssigneeList.includes(userCode) || (waitApproveList.length === 0 && waitAssigneeList.length === 0))) {
          this.curFormStatusService
            .getCurFormStatus$(this.formNo, this.formTypeId)
            .then((obs) => {
              obs.subscribe((res) => {
                if (
                  res === LicenseFormStatusEnum.DRAFT ||
                  (res === LicenseFormStatusEnum.APPROVING &&
                    this.router.url.includes('approving'))
                ) {
                  this.isAddAttachedShow = true;
                } else {
                  this.isAddAttachedShow = false;
                }
              });
            });
        } else {
          this.isAddAttachedShow = false;
        }
      })

    }

    this.onInitDataTableSettings();
    this.onInitAttachedFileLogView();
  }

  ngOnDestroy(): void {
    this.sessionService.removeItem('fileNum');
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
