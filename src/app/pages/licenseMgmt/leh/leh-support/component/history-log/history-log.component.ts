import { DatePipe } from '@angular/common';
import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { Subscription } from 'rxjs';
import { MyFlowService } from 'src/app/core/services/my-flow.service';
import { historyCols } from '../../leh-const';

@Component({
  selector: 'app-history-log',
  templateUrl: './history-log.component.html',
  styleUrls: ['./history-log.component.scss'],
})
export class HistoryLogComponent implements OnInit, OnDestroy {
  @Input() formNo: string;
  @Input() formTypeId:string;
  langSubscription = new Subscription(); // 語言變換subscription
  historyCols = historyCols; // 簽核歷程欄位
  historyData = {
    // 簽核歷程資料
    mainList: [],
    approvingList: [],
    assigneeList: [],
    pendingString: '',
  };

  dataTableSettings = {
    isDeleteMode: false,
    isShowNoDataInfo: true,
    isAddMode: false,
    isForceShowTable: false,
    isPaginationMode: false,
    isEditedMode: false,
    isScrollable: false,
    isFuzzySearchMode: false,
    isColSelectorMode: false,
    isSortMode: false,
    noDataConText: '目前無資料',
  };

  constructor(
    private myFlowService: MyFlowService,
    private translateService: TranslateService,
    private datePipe: DatePipe
  ) { }

  ngOnInit(): void {
    this.langSubscription = this.translateService.onLangChange.subscribe(() => {
      this.setPendingString();
    });
    this.getHistory();
  }

  ngOnDestroy(): void {
    this.langSubscription?.unsubscribe();
  }

  /**
   * 取得簽核歷程資料
   */
  private getHistory() {
    this.myFlowService.getFlowAuditLog(this.formNo,this.formTypeId).subscribe({
      next: (rsp) => {
        const historyStatus = ['Submitted', 'Approve', 'Reject', 'Rollback', 'Resolve', 'Cancel'];
        this.historyData.mainList = rsp.filter((x) => historyStatus.includes(x.status));
        this.historyData.mainList.forEach(x => x.signerPhoneNumber = (x.signerPhoneNumber === '[]' || x.signerPhoneNumber === '[-]') ? '' : x.signerPhoneNumber)

        //待簽核
        const approvingStatus = ['Approving'];
        this.historyData.approvingList = rsp
          .filter((x) => approvingStatus.includes(x.status))
          .map((list) => (list = `${list.signerNameEn}${list.signerNameCn}(${list.signerCode})`));

        //加簽
        const assigneeStatus = ['Assignee'];
        this.historyData.assigneeList = rsp
          .filter((x) => assigneeStatus.includes(x.status))
          .map((list) => (list = `${list.signerNameEn}${list.signerNameCn}(${list.signerCode})`));

        this.setPendingString();
      },
    });
  }

  private setPendingString() {
    const pendingListEmpty = this.historyData.approvingList.length === 0 && this.historyData.assigneeList.length === 0;
    if (pendingListEmpty) { return; }

    const pendingBy = this.translateService.instant('APPROVING_LEH.Label.AuditApprovingPrefix');
    const approvingPeople = this.historyData.approvingList.join(', ')
    const isAssignee = this.translateService.instant('APPROVING_LEH.Label.AuditApprovingSuffix');
    const approve = this.translateService.instant('APPROVING_LEH.Label.Approve');
    let assigneePeople = '';
    if (this.historyData.assigneeList.length !== 0){
      this.historyData.approvingList.length !== 0
      ? assigneePeople = ',' + this.historyData.assigneeList.map(assignee => assignee = assignee + isAssignee).join(', ')
      : assigneePeople = this.historyData.assigneeList.map(assignee => assignee = assignee + isAssignee).join(', ')
    }

    this.historyData.pendingString = pendingBy + approvingPeople + assigneePeople + approve;
  }

  onReminderSend(): void {
    this.myFlowService.formUgentSendEmail(this.formNo, this.formTypeId);
  }
}
