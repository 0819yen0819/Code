import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { Observable, Subject, takeLast, takeUntil } from 'rxjs';
import { TableCol } from 'src/app/core/model/data-table-cols';
import {
  DataTableParams,
  DataTableSettings,
} from 'src/app/core/model/data-table-view';
import { AuditHistoryLog } from 'src/app/core/model/sign-off-history';
import { MyFlowService } from 'src/app/core/services/my-flow.service';
import { ObjectFormatService } from 'src/app/core/services/object-format.service';

@Component({
  selector: 'app-common-audit-history-log',
  templateUrl: './audit-history-log.component.html',
  styleUrls: ['./audit-history-log.component.scss'],
})
export class AuditHistoryLogComponent implements OnInit, OnDestroy {
  @Input() formNo!: string;
  @Input() formTypeId!: string;

  private unsubscribeEvent = new Subject();

  auditHistoryLog!: AuditHistoryLog[];
  waitApproveList!: string[];
  waitAssigneeList!: string[];
  itemTableCols!: TableCol[];
  dataTableSettings!: DataTableParams;

  constructor(
    private myFlowService: MyFlowService,
    private objectFormatService: ObjectFormatService,
    private translateService: TranslateService
  ) {}

  ngOnInit(): void {
    this.itemTableCols = [
      { field: 'stepNumber', label: 'Step', isFittedCol: true },
      { field: 'completeTime', label: 'Time' },
      { field: 'signerInfo', label: 'Signer Name' },
      { field: 'signerDeptName', label: 'Dept' },
      { field: 'remark', label: 'Remark' },
      { field: 'signComment', label: 'Opinion' },
      { field: 'signerPhoneNumber', label: 'Mobile' },
    ];

    this.dataTableSettings = new DataTableSettings();
    this.dataTableSettings.isShowNoDataInfo = true;
    this.dataTableSettings.noDataConText = this.translateService.instant(
      'LicenseMgmt.Common.Hint.NoResult'
    );

    this.translateService.onLangChange
      .pipe(takeUntil(this.unsubscribeEvent))
      .subscribe(() => {
        this.auditHistoryLog = new Array<AuditHistoryLog>();
        this.waitApproveList = new Array<string>();
        this.waitAssigneeList = new Array<string>();
        this.onInitAuditLogView();
      });

    this.auditHistoryLog = new Array<AuditHistoryLog>();
    this.waitApproveList = new Array<string>();
    this.waitAssigneeList = new Array<string>();
    this.onInitAuditLogView();
  }

  ngOnDestroy() {
    this.unsubscribeEvent.next(null);
    this.unsubscribeEvent.complete();
  }

  onInitAuditLogView(): void {
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

    getFlowAuditLog$(this.formNo, this.formTypeId).subscribe(
      (auditHistoryLog) => {
        for (const log of auditHistoryLog) {
          if (log.status === 'Approving') {
            this.waitApproveList.push(
              `${log['signerNameEn'].trim()} ${log[
                'signerNameCn'
              ].trim()} ( ${log['signerCode'].trim()} )`
            );
          }

          if (log.status === 'Assignee') {
            this.waitAssigneeList.push(
              `${log['signerNameEn'].trim()} ${log[
                'signerNameCn'
              ].trim()} ( ${log[
                'signerCode'
              ].trim()} ) ${this.translateService.instant(
                'LicenseMgmt.Common.Hint.AuditApprovingConSigneeSuffix'
              )}`
            );
          }
        }

        this.auditHistoryLog = auditHistoryLog.filter(
          (x: AuditHistoryLog) =>
            x.status === 'Submitted' ||
            x.status === 'Approve' ||
            x.status === 'Reject' ||
            x.status === 'Rollback' ||
            x.status === 'Resolve' ||
            x.status === 'Cancel'
        );

        this.auditHistoryLog.forEach((data) => {
          data.signerInfo = `${data.signerCode} ${data.signerNameEn} ${data.signerNameCn}`;
          data.signerPhoneNumber = data.signerPhoneNumber
            .replace('[', '')
            .replace(']', '');
          data.completeTime = this.objectFormatService.DateTimeFormat(
            new Date(data.completeTime),
            '/'
          );
        });

        this.auditHistoryLog.sort((a, b) =>
          a.completeTime > b.completeTime
            ? 1
            : -1 || a.stepNumber > b.stepNumber
            ? 1
            : -1
        );
      }
    );
  }

  onReminderSend(): void {
    this.myFlowService.formUgentSendEmail(this.formNo, this.formTypeId);
  }
}
