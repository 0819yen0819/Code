import { DatePipe } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { MenuItem } from 'primeng/api';

import { ActivatedRoute } from '@angular/router';
import { Subscription, BehaviorSubject } from 'rxjs';

import { DplSuccess } from './../../../core/model/dpl-success';

import { ToastService } from 'src/app/core/services/toast.service';
import { AuditLog } from './../../../core/model/audit-log';
import { MyFlowService } from './../../../core/services/my-flow.service';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-dplsuccess',
  templateUrl: './dpl-success.component.html',
  styleUrls: ['./dpl-success.component.scss'],
})
export class DplSuccessComponent implements OnInit {
  private onLangChange$: Subscription;
  // private userToken: string;
  breadcrumbItems: MenuItem[];
  queryFormNo: string;
  aduitLog: AuditLog;
  whiteListFlag: boolean = false;
  completeTime: string;

  approveData: BehaviorSubject<DplSuccess<any>[]>;
  assigneeData: BehaviorSubject<DplSuccess<any>[]>;
  isFlowDone: boolean = true;
  isLoading: boolean = true;

  constructor(
    private activatedRoute: ActivatedRoute,
    private myFlowService: MyFlowService,
    private translateService: TranslateService,
    private toastService: ToastService,
    private datePipe: DatePipe
  ) {
    this.activatedRoute.queryParams.subscribe((params) => {
      this.queryFormNo = params['queryFormNo'] ?? null;
    });

    this.onLangChange$ = this.translateService.onLangChange.subscribe(() => {
      this.setBreadcrumbItems();
    });

    this.setBreadcrumbItems();
    this.getCurrentTime();
  }

  ngOnInit(): void {
    this.approveData = new BehaviorSubject<DplSuccess[]>([]);
    this.assigneeData = new BehaviorSubject<DplSuccess[]>([]);
    // 取得auditLog
    this.myFlowService.getFlowAuditLog(this.queryFormNo).subscribe({
      next: (rsp) => {
        rsp.forEach((element) => {
          if (element.status === 'Approving') {
            this.approveData.next([
              ...this.approveData.getValue(),
              {
                signerNameCn: `${element.signerNameCn}`.trim(),
                signerNameEn: `${element.signerNameEn}`.trim(),
                signerCode: `${element.signerCode}`.trim(),
              },
            ]);
          } else if (element.status === 'Assignee') {
            this.assigneeData.next([
              ...this.assigneeData.getValue(),
              {
                signerNameCn: `${element.signerNameCn}`.trim(),
                signerNameEn: `${element.signerNameEn}`.trim(),
                signerCode: `${element.signerCode}`.trim(),
              },
            ]);
          }
        });
      },
      error: (rsp) => {
        console.log(rsp);
        this.toastService.error('System.Message.Error');
      },
      complete: () => {
        this.isLoading = false;
        if (
          this.approveData.getValue().length == 0 &&
          this.assigneeData.getValue().length == 0
        ) {
          this.isFlowDone = true;
        } else {
          this.isFlowDone = false;
        }
      },
    });
  }

  getCurrentTime(): void {
    this.completeTime = new Date().toLocaleString();
  }

  backToPendingListBtnClick(): void {
    window.location.href =
      environment.storeRedirectUrlPrefix + '?entryUrl=myforms/approval';
  }

  private setBreadcrumbItems(): void {
    this.breadcrumbItems = this.translateService.instant(
      'BreadcrumbItems.Backstage'
    );
  }
}
