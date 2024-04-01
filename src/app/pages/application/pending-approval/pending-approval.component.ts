import { DatePipe } from '@angular/common';
import { Component, OnInit, ViewChild } from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import {
  LazyLoadEvent,
  MenuItem,
  MessageService,
  SelectItem,
} from 'primeng/api';
import { Table } from 'primeng/table';
import { Subscription } from 'rxjs';
import { LanguageService } from 'src/app/core/services/language.service';
import { ToastService } from 'src/app/core/services/toast.service';
import { CommonApiService } from '../../../core/services/common-api.service';
import { LoaderService } from '../../../core/services/loader.service';
import { PendingApprovalQueryParam } from '../bean/pending-approval-query-param';
import { PendingApprovalQueryRequest } from '../bean/pending-approval-query-request';
import { MyApplicationService } from './../../../core/services/my-application.service';
import { MyFlowService } from './../../../core/services/my-flow.service';
import { UserContextService } from './../../../core/services/user-context.service';

@Component({
  selector: 'app-pending-approval',
  templateUrl: './pending-approval.component.html',
  styleUrls: ['./pending-approval.component.scss'],
})
export class PendingApprovalComponent implements OnInit {
  private onLangChange$: Subscription;

  @ViewChild('lazyTable1') lazyTable1: Table;
  @ViewChild('lazyTable2') lazyTable2: Table;

  permissions: string[] = [];

  formName: string;
  status: string;
  formNo: string;
  startDate: Date = new Date();
  endDate: Date = new Date();
  requestorName: string;

  cols: any[];
  selectedCols: any[];
  data: any[];
  cloneData: any[];
  data2: any[];
  cloneData2: any[];
  displayFilterDetail = false;
  breadcrumbItems: MenuItem[];
  formNameOptions: SelectItem[];
  statusOptions: SelectItem[];
  workflowStatusOptions: SelectItem[];
  workflowStatus: string;
  documentTypeOptions: SelectItem[];
  documentType: string;

  statusDesc: any;
  workflowStatusDesc: any;
  displayDialog: boolean = false;
  dialogMsg: string;

  queryReq1: PendingApprovalQueryRequest = new PendingApprovalQueryRequest();
  queryReq2: PendingApprovalQueryRequest = new PendingApprovalQueryRequest();
  totalRecords1: number;
  totalRecords2: number;

  sortField1: string;
  sortOrder1: number;
  first1: number = 0;
  globalFilter1: string = '';
  sortField2: string;
  sortOrder2: number;
  first2: number = 0;
  globalFilter2: string = '';
  selectedData1: any[];
  displayResult1: boolean = false;
  selectedData2: any[];
  displayResult2: boolean = false;
  colsTab2: any[];
  selectedColsTab2: any[];
  displayFilterDetail2 = false;

  constructor(
    private router: Router,
    private formBuilder: FormBuilder,
    private messageService: MessageService,
    private userContextService: UserContextService,
    private myFlowService: MyFlowService,
    private myApplicationService: MyApplicationService,
    private translateService: TranslateService,
    private toastService: ToastService,
    private datePipe: DatePipe,
    private commonApiService: CommonApiService,
    private languageService: LanguageService,
    private loaderService: LoaderService
  ) {
    if (this.userContextService.user$.getValue) {
      this.permissions = this.userContextService.getMenuUrlPermission(
        this.router.url
      );
      console.log('permissions: ', this.permissions);
    }
    this.onLangChange$ = this.translateService.onLangChange.subscribe(() => {
      this.setBreadcrumbItems();
      this.initTranslateCharacter();
      this.changeFilterDetail();
      this.initDocumentTypeOptions();
    });

    let today = new Date();
    this.endDate = new Date(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate());
    this.startDate = new Date(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate());
    this.startDate.setMonth(this.startDate.getMonth() - 6);

    this.setBreadcrumbItems();
  }

  ngOnInit(): void {
    this.composeQueryReq1();
    this.composeQueryReq2();

    // 會trigger LAZY-TABLE的onLazyLoad event
    this.displayResult1 = true;

    this.myApplicationService.getFormTypes().subscribe({
      next: (rsp) => {
        this.formNameOptions = rsp.map(function (obj) {
          return { label: obj.formTypeNameE, value: obj.formTypeNameE };
        });
      },
      error: (rsp) => {
        console.log(rsp);
        this.toastService.error('System.Message.Error');
      },
    });

    this.workflowStatusOptions = [
      { label: 'Approving', value: 'Approving' },
      { label: 'Approve', value: 'Approve' },
      { label: 'Reject', value: 'Reject' },
      { label: 'Withdraw', value: 'Withdraw' },
    ];

    this.initTranslateCharacter();
    this.initDocumentTypeOptions();
    this.changeFilterDetail();
    this.searchBtnClick();
  }

  composeQueryReq1() {
    this.queryReq1 = new PendingApprovalQueryRequest();
    this.queryReq1.params = new PendingApprovalQueryParam();
    this.queryReq1.params.tenant =
      this.userContextService.user$.getValue().tenant;
    this.selectedData1 = undefined;
  }
  composeQueryReq2() {
    this.queryReq2 = new PendingApprovalQueryRequest();
    this.queryReq2.params = new PendingApprovalQueryParam();
    this.queryReq2.params.tenant =
      this.userContextService.user$.getValue().tenant;
    this.selectedData2 = undefined;
  }

  initTranslateCharacter() {
    this.cols = this.translateService.instant('PendingApproval.Columns');
    this.colsTab2 = this.translateService.instant('PendingApproval.ColumnsTab2');
    this.statusDesc = this.translateService.instant('MyFlow.statusDesc');
    this.workflowStatusDesc = this.translateService.instant(
      'MyFlow.workflowStatusDesc'
    );
  }

  /**
   * 下載按鈕 click 事件(共用)
   * @param downloadType
   */
  downloadBtnClick(downloadType: string): void {
    const userCode = this.userContextService.user$.getValue().userCode;
    const userLang = this.languageService.getLang();
    const tenant = this.userContextService.user$.getValue().tenant;
    const params = {
      params: {
        empCode: userCode,
        endDate: this.endDate,
          // this.endDate == null
          //   ? null
          //   : this.datePipe.transform(this.endDate, 'yyyy/MM/dd'),
        formName: this.formName,
        formNo: this.formNo,
        startDate: this.startDate,
          // this.startDate == null
          //   ? null
          //   : this.datePipe.transform(this.startDate, 'yyyy/MM/dd'),
        requestorName: this.requestorName,
        userLang: userLang,
        userTimeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        tenant: tenant,
        downloadType: downloadType,
        workflowStatus: this.workflowStatus,
      },
    };
    this.loaderService.show();
    this.myFlowService.downloadMyFlow(params).subscribe({
      next: (rsp) => {
        this.commonApiService.downloadFile(rsp.fileId);
        this.loaderService.hide();
      },
      error: (e) => {
        console.error(e);
        this.loaderService.hide();
        this.toastService.error('System.Message.Error');
      },
    });
  }

  /**
   * 下載按鈕 click 事件(共用)
   * @param downloadType
   */
   downloadLazyBtnClick(downloadType: string): void {
    const userCode = this.userContextService.user$.getValue().userCode;
    const userLang = this.languageService.getLang();
    const tenant = this.userContextService.user$.getValue().tenant;
    const params = {
      params: {
        empCode: userCode,
        endDate: this.endDate,
          // this.endDate == null
          //   ? null
          //   : this.datePipe.transform(this.endDate, 'yyyy/MM/dd'),
        formName: this.formName,
        formNo: this.formNo,
        startDate: this.startDate,
          // this.startDate == null
          //   ? null
          //   : this.datePipe.transform(this.startDate, 'yyyy/MM/dd'),
        requestorName: this.requestorName,
        userLang: userLang,
        userTimeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        tenant: tenant,
        downloadType: downloadType,
        workflowStatus: this.workflowStatus,
        status: this.status,
      },
      lazyLoadEvent: downloadType === 'downloadApproving' ? this.queryReq1.lazyLoadEvent : this.queryReq2.lazyLoadEvent
    };
    this.loaderService.show();
    this.myFlowService.downloadLazyMyFlow(params).subscribe({
      next: (rsp) => {
        this.commonApiService.downloadFile(rsp.fileId);
        this.loaderService.hide();
      },
      error: (e) => {
        console.error(e);
        this.loaderService.hide();
        this.toastService.error('System.Message.Error');
      },
    });
  }

  /**
   * 待簽核項目 查詢按鈕 Click 事件
   */
  searchBtnClick(): void {
    if (this.displayResult1) {
      this.resetLazySort1();
    } else {
      setTimeout(() => {
        this.displayResult1 = true;
      });
    }
  }

  /**
   * 已處理＆通知 查詢按鈕 Click 事件
   */
  searchBtnClick2(): void {
    if (this.displayResult2) {
      this.resetLazySort2();
    } else {
      setTimeout(() => {
        this.displayResult2 = true;
      });
    }
  }

  onSort1(event) {
    this.sortField1 = event.field;
    this.sortOrder1 = event.order;
  }

  onPage1(event) {
    this.first1 = event.first;
  }

  onSort2(event) {
    this.sortField2 = event.field;
    this.sortOrder2 = event.order;
  }

  onPage2(event) {
    this.first2 = event.first;
  }

  resetLazySort1() {
    if (this.lazyTable1 !== undefined) {
      this.lazyTable1.sortOrder = undefined;
      this.lazyTable1.sortField = undefined;
      this.lazyTable1.first = 0;
      this.lazyTable1.rows = 10;
      this.lazyTable1.reset();
    }
  }

  resetLazySort2() {
    if (this.lazyTable2 !== undefined) {
      this.lazyTable2.sortOrder = undefined;
      this.lazyTable2.sortField = undefined;
      this.lazyTable2.first = 0;
      this.lazyTable2.rows = 10;
      this.lazyTable2.reset();
    }
  }

  sortArrayData(arrayData: any[], field: string, sort: number) {
    if (arrayData && field && sort) {
      if (sort && sort == 1) {
        return arrayData.sort((a, b) =>
          (a[field] != null ? a[field] : '') <
          (b[field] != null ? b[field] : '')
            ? -1
            : 1
        );
      } else {
        return arrayData.sort((a, b) =>
          (a[field] != null ? a[field] : '') >
          (b[field] != null ? b[field] : '')
            ? -1
            : 1
        );
      }
    }
    return arrayData;
  }

  resetBtnClick() {
    var today = new Date();
    this.formName = '';
    this.formNo = '';
    this.requestorName = '';
    // this.endDate = new Date();
    this.endDate = new Date(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate());
    this.status = '';
    this.startDate = new Date(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate());
    this.startDate.setMonth(this.startDate.getMonth() - 6);
    // this.startDate = today;
    // this.startDate.setMonth(today.getMonth() - 6);
    this.documentType = '';
    this.workflowStatus = '';
    this.displayResult1 = false;
    this.displayResult2 = false;
    this.composeQueryReq1();
    this.first1 = 0;
    this.sortField1 = undefined;
    this.sortOrder1 = undefined;
    this.composeQueryReq2();
    this.first2 = 0;
    this.sortField2 = undefined;
    this.sortOrder2 = undefined;
  }

  showFilter() {
    this.displayFilterDetail = true;
  }
  showFilter2() {
    this.displayFilterDetail2 = true;
  }
  changeFilterDetail() {
    this.selectedCols = this.cols.filter((x) => {
      return x.isDefault;
    });
    this.selectedColsTab2 = this.colsTab2.filter((x) => {
      return x.isDefault;
    });
    // this.selectedCols.unshift({ field: 'checkbox', header: '' });
  } // end changeFilterDetail

  resetFilterDetail() {
    this.selectedCols = this.cols.filter((x) => {
      return x.isDefault;
    });
    this.selectedColsTab2 = this.colsTab2.filter((x) => {
      return x.isDefault;
    });
  } // end changeFilterDetail

  private setBreadcrumbItems(): void {
    this.breadcrumbItems = this.translateService.instant(
      'BreadcrumbItems.Backstage'
    );
  }

  approvePage(url: string, formNo: string) {
    this.router.navigate([url], { queryParams: { queryFormNo: formNo } });
    return false;
  }

  viewPage(url: string, formNo: string) {
    this.router.navigate([url], { queryParams: { queryFormNo: formNo } });
    return false;
  }

  initDocumentTypeOptions() {
    this.documentTypeOptions = [];
    this.documentTypeOptions.push.apply(
      this.documentTypeOptions,
      this.translateService.instant('MyFlow.Options.documentTypeOptions')
    );
  }

  filterLazy1(globalFilter: string) {
    this.data = [];
    for (var i = 0; i < this.cloneData.length; i++) {
      for (var j = 0; j < this.selectedCols.length; j++) {
        try {
          if (this.cloneData[i][this.selectedCols[j].field] === undefined)
            continue;
          var value = this.cloneData[i][this.selectedCols[j].field];
          if (value.toLowerCase().indexOf(globalFilter.toLowerCase()) !== -1) {
            this.data.push(this.cloneData[i]);
            break;
          }
        } catch (e) {
          console.log(e);
        }
      }
    }
    return;
  }

  filterLazy2(globalFilter: string) {
    this.data2 = [];
    for (var i = 0; i < this.cloneData2.length; i++) {
      for (var j = 0; j < this.selectedColsTab2.length; j++) {
        try {
          if (this.cloneData2[i][this.selectedColsTab2[j].field] === undefined)
            continue;
          var value = this.cloneData2[i][this.selectedColsTab2[j].field];
          if (value !== null && value.toLowerCase().indexOf(globalFilter.toLowerCase()) !== -1) {
            this.data2.push(this.cloneData2[i]);
            break;
          }
        } catch (e) {
          console.log(e);
        }
      }
    }
    return;
  }

  onLazyLoad(event: LazyLoadEvent) {
    this.queryReq1.lazyLoadEvent = event;
    console.log('event: ', event);
    if (
      event &&
      event.sortField &&
      this.lazyTable1 &&
      this.data &&
      (event.sortField !== this.sortField1 ||
        event.sortOrder !== this.sortOrder1)
    ) {
      this.data = this.sortArrayData(
        this.data,
        event.sortField,
        event.sortOrder
      );
      this.lazyTable1.first = this.first1;
      return;
    }
    setTimeout(() => {
      this.loaderService.show();
      const userCode = this.userContextService.user$.getValue().userCode;
      this.queryReq1.params.empCode = userCode;
      // this.queryReq1.params.endDate =
      //   this.endDate == null
      //     ? null
      //     : this.datePipe.transform(this.endDate, 'yyyy/MM/dd');
      this.queryReq1.params.endDate =this.endDate;
      this.queryReq1.params.formName = this.formName;
      this.queryReq1.params.formNo = this.formNo;
      // this.queryReq1.params.startDate =
      //   this.startDate == null
      //     ? null
      //     : this.datePipe.transform(this.startDate, 'yyyy/MM/dd');
      this.queryReq1.params.startDate = this.startDate;
      this.queryReq1.params.status = this.status;
      this.queryReq1.params.requestorName = this.requestorName;
      this.queryReq1.params.userLang = this.languageService.getLang();

      this.myFlowService.getLazyMyFlow(this.queryReq1).subscribe({
        next: (rsp) => {
          this.data = rsp.resultList;
          this.cloneData = rsp.resultList;
          this.filterLazy1(this.globalFilter1);
          this.totalRecords1 = rsp.totalRecords;
          this.displayResult1 = true;
          this.loaderService.hide();
          this.data = this.sortArrayData(
            this.data,
            event.sortField,
            event.sortOrder
          );
        },
        error: (rsp) => {
          console.log(rsp);
          this.loaderService.hide();
          this.toastService.error('System.Message.Error');
        },
      });
    });
  }

  onLazyLoad2(event: LazyLoadEvent) {
    this.queryReq2.lazyLoadEvent = event;
    if (
      event &&
      event.sortField &&
      this.lazyTable2 &&
      this.data &&
      (event.sortField !== this.sortField2 ||
        event.sortOrder !== this.sortOrder2)
    ) {
      this.data2 = this.sortArrayData(
        this.data,
        event.sortField,
        event.sortOrder
      );
      this.lazyTable2.first = this.first1;
      return;
    }
    setTimeout(() => {
      this.loaderService.show();
      const userCode = this.userContextService.user$.getValue().userCode;
      this.queryReq2.params.empCode = userCode;
      // this.queryReq2.params.endDate =
      //   this.endDate == null
      //     ? null
      //     : this.datePipe.transform(this.endDate, 'yyyy/MM/dd');
      this.queryReq2.params.endDate = this.endDate;
      this.queryReq2.params.formName = this.formName;
      this.queryReq2.params.formNo = this.formNo;
      // this.queryReq2.params.startDate =
      //   this.startDate == null
      //     ? null
      //     : this.datePipe.transform(this.startDate, 'yyyy/MM/dd');
      this.queryReq2.params.startDate = this.startDate;
      this.queryReq2.params.workflowStatus = this.workflowStatus;
      this.queryReq2.params.status = this.status;
      this.queryReq2.params.requestorName = this.requestorName;
      this.queryReq2.params.userLang = this.languageService.getLang();

      this.myFlowService.getLazyMyAuditFlow(this.queryReq2).subscribe({
        next: (rsp) => {
          this.data2 = rsp.resultList;
          this.cloneData2 = rsp.resultList;
          this.filterLazy2(this.globalFilter2);
          this.totalRecords2 = rsp.totalRecords;
          this.displayResult2 = true;
          this.loaderService.hide();
          this.data2 = this.sortArrayData(
            this.data2,
            event.sortField,
            event.sortOrder
          );
          this.loaderService.hide();
        },
        error: (rsp) => {
          console.error(rsp);
          this.loaderService.hide();
          this.toastService.error('System.Message.Error');
        },
      });
    });
  }
}
