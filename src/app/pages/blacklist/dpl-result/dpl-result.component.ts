import { DateInputHandlerService } from './../../../core/services/date-input-handler.service';
import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { LazyLoadEvent, SelectItem } from 'primeng/api';
import { Table } from 'primeng/table';
import { lastValueFrom, Subscription } from 'rxjs';
import { ToastService } from 'src/app/core/services/toast.service';
import { environment } from 'src/environments/environment';
import { CommonApiService } from '../../../core/services/common-api.service';
import { DplBlackApiService } from '../../../core/services/dpl-black-api.service';
import { LanguageService } from '../../../core/services/language.service';
import { LoaderService } from '../../../core/services/loader.service';
import { UserContextService } from './../../../core/services/user-context.service';
import { DplBatchDetailResponse } from './bean/dpl-batch-detail-response';
import { DplResultBatchRequest } from './bean/dpl-result-batch-request';
import { DplResultDetailResponse } from './bean/dpl-result-detail-response';
import { DplResultQueryRequest } from './bean/dpl-result-query-request';

@Component({
  selector: 'app-dpl-result',
  templateUrl: './dpl-result.component.html',
  styleUrls: ['./dpl-result.component.scss'],
})
export class DplResultComponent implements OnInit, OnDestroy {
  private onLangChange$: Subscription;
  private loginStateSubscription$: Subscription;

  @ViewChild('lazyTable') lazyTable: Table;
  @ViewChild('lazyTableBatch') lazyTableBatch: Table;

  permissions: string[] = [];

  countryOptions: SelectItem[];
  displayResult = false;
  totalRecords: number;

  cols: any[];
  selectedCols: any[];
  data: any[];
  cloneData: any[];

  displayFilter = false;
  displayResultDetail = false;

  sourceTypeOptions: SelectItem[];

  detailCols: any[];
  detailData: any[];

  detailEbcCols: any[];
  detailEbcData: any[];

  detailEccnCols: any[];
  detailEccnData: any[];

  detailRsp: DplResultDetailResponse = new DplResultDetailResponse();
  queryReq: DplResultQueryRequest = new DplResultQueryRequest();

  displayBatchResult = false;
  displayBatchDetail = false;
  totalBatchRecords: number;
  batchCols: any[];
  batchSelectedCols: any[];
  batchData: any[];
  cloneBatchData: any[];
  batchDetailCols: any[];
  batchDetailData: any[];
  batchReq: DplResultBatchRequest = new DplResultBatchRequest();
  batchDetailRsp: DplBatchDetailResponse = new DplBatchDetailResponse();
  displayBatchFilter = false;

  sortField: string;
  sortOrder: number;
  first: number = 0;

  sortFieldBatch: string;
  sortOrderBatch: number;
  firstBatch: number = 0;

  globalFilter: string = '';
  globalFilterBatch: string = '';

  displayDialog: boolean = false;
  dialogMsg: string;

  formSubmitted: boolean = false;

  constructor(
    private router: Router,
    private userContextService: UserContextService,
    private languageService: LanguageService,
    private translateService: TranslateService,
    private toastService: ToastService,
    private dplBlackApiService: DplBlackApiService,
    private commonApiService: CommonApiService,
    private loaderService: LoaderService,
    private dateInputHandlerService:DateInputHandlerService
  ) {
    if (this.userContextService.user$.getValue) {
      this.permissions = this.userContextService.getMenuUrlPermission(
        this.router.url
      );
      console.log('permissions: ', this.permissions);
    }
    this.onLangChange$ = this.translateService.onLangChange.subscribe(() => {
      // this.setBreadcrumbItems();
      this.initColumns();
      this.changeFilter();
      this.changeBatchFilter();
      this.initOptions();
      setTimeout(() => {
        this.doCountryQuery();
        this.displayResult = true;
      });
    });

    this.translateService
      .use(this.languageService.getLang())
      .subscribe((next) => {});
  }

  ngOnInit(): void {
    this.composeQueryReq();

    this.composeBatchReq();

    this.initColumns();

    this.detailCols = [
      { field: 'matchCategory', header: 'Match Category', isDefault: true },
      { field: 'matchPercent', header: 'Match Percent', isDefault: true },
      { field: 'sourceList', header: 'Source List', isDefault: true },
      { field: 'dplName', header: 'Dpl Name', isDefault: true },
      { field: 'dplAddress', header: 'Dpl Address', isDefault: true },
    ];

    this.detailEbcCols = [
      { field: 'country', header: 'Country', isDefault: true },
      {
        field: 'countryCheckType',
        header: 'Country Check Type',
        isDefault: true,
      },
      { field: 'ebcCode', header: 'Ebc Code', isDefault: true },
      { field: 'ebcText', header: 'Ebc Text', isDefault: true },
      { field: 'ebcUser', header: 'Ebc User', isDefault: true },
    ];

    this.detailEccnCols = [
      { field: 'eccnItemInfo', header: 'Eccn Item Info', isDefault: true },
      { field: 'eccnItemLine', header: 'Eccn Item Line', isDefault: true },
      { field: 'eccnCode', header: 'Eccn Code', isDefault: true },
      { field: 'eccnDescription', header: 'Eccn Description', isDefault: true },
      {
        field: 'eccnExportLicenseRequired',
        header: 'Eccn Export License Required',
        isDefault: true,
      },
    ];

    this.batchDetailCols = [
      { field: 'ebcResult', header: 'Ebc Result', isDefault: true },
      { field: 'dplResult', header: 'Dpl Result', isDefault: true },
      { field: 'resultsStatus', header: 'Results Status', isDefault: true },
      { field: 'matchCategory', header: 'Match Category', isDefault: true },
      { field: 'matchPercent', header: 'Match Percent', isDefault: true },
      { field: 'sourceList', header: 'Source List', isDefault: true },
      { field: 'dplName', header: 'Dpl Name', isDefault: true },
      { field: 'dplAddress', header: 'Dpl Address', isDefault: true },
    ];

    this.changeFilter();
    this.changeBatchFilter();

    this.initOptions();
    setTimeout(() => {
      this.doCountryQuery();
    });

    //# TK-35854
    // setTimeout(() => {
    //   this.displayResult = true;
    // });
  }

  initColumns() {
    this.cols = this.translateService.instant('DPLResult.Columns');
    this.batchCols = this.translateService.instant('DPLResult.BatchColumns');
  }

  initOptions() {
    this.countryOptions = [];
    this.countryOptions.push.apply(
      this.countryOptions,
      this.translateService.instant('DPLResult.Options.countryOptions')
    );
    this.sourceTypeOptions = this.translateService.instant(
      'DPLResult.Options.sourceTypeOptions'
    );
  }

  async doCountryQuery() {
    let rsp = await lastValueFrom(this.commonApiService.countryQuery());
    for (var country of rsp.countryList) {
      this.countryOptions.push({
        label: country.displayCountry,
        value: country.shortCode,
      });
    }
  }

  /**
   * 查詢按鈕 Click 事件
   */
  searchBtnClick(): void {
    if (!this.queryReq.startDate || !this.queryReq.endDate) return;
    if (this.displayResult) {
      this.resetLazySort();
    } else {
      setTimeout(() => {
        this.displayResult = true;
      });
    }
  }

  downloadBtnClick(): void {
    if (!this.queryReq.startDate || !this.queryReq.endDate) return;
    this.queryReq.action = 'DOWNLOAD';
    this.queryReq.userEmail =
      this.userContextService.user$.getValue().userEmail;
    this.loaderService.show();
    this.dplBlackApiService.dplResultQuery(this.queryReq).subscribe({
      next: (rsp) => {
        this.dialogMsg = this.translateService.instant(
          'DPLResult.Message.DownloadProcess'
        );
        this.queryReq.action = '';
        this.loaderService.hide();
        this.displayDialog = true;
      },
      error: (e) => {
        this.batchReq.action = '';
        console.error(e);
        this.loaderService.hide();
        this.toastService.error('System.Message.Error');
      },
    });
  }

  filterLazy(globalFilter: string) {
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

  onLazyLoad(event: LazyLoadEvent) {
    this.queryReq.lazyLoadEvent = event;
    if (
      event &&
      event.sortField &&
      this.lazyTable &&
      this.data &&
      (event.sortField !== this.sortField || event.sortOrder !== this.sortOrder)
    ) {
      this.data = this.sortArrayData(
        this.data,
        event.sortField,
        event.sortOrder
      );
      this.lazyTable.first = this.first;
      return;
    }
    setTimeout(() => {
      this.loaderService.show();
      this.dplBlackApiService.dplResultQuery(this.queryReq).subscribe({
        next: (rsp) => {
          this.data = rsp.resultList;
          this.cloneData = rsp.resultList;
          this.filterLazy(this.globalFilter);
          this.totalRecords = rsp.totalRecords;
          this.displayResult = true;
          this.loaderService.hide();
          this.data = this.sortArrayData(
            this.data,
            event.sortField,
            event.sortOrder
          );
        },
        error: (e) => {
          console.error(e);
          this.loaderService.hide();
          this.toastService.error('System.Message.Error');
        },
      });
    });
  }

  onSort(event) {
    this.sortField = event.field;
    this.sortOrder = event.order;
  }

  onPage(event) {
    this.first = event.first;
  }

  resetLazySort() {
    this.lazyTable.sortOrder = undefined;
    this.lazyTable.sortField = undefined;
    this.lazyTable.first = 0;
    this.lazyTable.rows = 10;
    this.lazyTable.reset();
    this.first = 0;
    this.sortOrder = undefined;
    this.sortField = undefined;
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
    this.displayResult = false;
    this.composeQueryReq();
    this.first = 0;
    this.sortField = undefined;
    this.sortOrder = undefined;
  }

  showFilter() {
    this.displayFilter = true;
  }

  changeFilter() {
    this.selectedCols = this.cols.filter((x) => {
      return x.isDefault;
    });
    if (this.permissions.includes('view')) {
      this.selectedCols.push(
        this.translateService.instant('DPLResult.DetailColums')
      );
    }
  }

  resetFilter() {
    this.selectedCols = this.cols.filter((x) => {
      return x.isDefault;
    });
  }

  viewDetail(headerId: number, lineId: number) {
    this.loaderService.show();
    this.queryReq.headerId = headerId;
    this.queryReq.lineId = lineId;

    this.dplBlackApiService.dplResultDetail(this.queryReq).subscribe({
      next: (rsp) => {
        this.detailRsp = rsp;
        this.detailData = rsp.detailList;
        this.detailEbcData = rsp.detailEbcList;
        this.detailEccnData = rsp.detailEccnList;
        this.loaderService.hide();
      },
      error: (e) => {
        console.error(e);
        this.loaderService.hide();
        this.toastService.error('System.Message.Error');
      },
    });

    this.displayResultDetail = true;
  }

  composeQueryReq() {
    this.queryReq = new DplResultQueryRequest();
    let myDate = new Date();
    this.queryReq.tenant = this.userContextService.user$.getValue().tenant;
    this.queryReq.sofcBaseHerf = environment.sofcBaseHerf;
    this.queryReq.endDate = new Date(
      myDate.getUTCFullYear(),
      myDate.getUTCMonth(),
      myDate.getUTCDate()
    );
    this.queryReq.startDate = new Date(
      this.queryReq.endDate.getFullYear(),
      this.queryReq.endDate.getMonth(),
      this.queryReq.endDate.getDate()
    );
  }

  composeBatchReq() {
    this.batchReq = new DplResultBatchRequest();
    let myDate = new Date();
    this.batchReq.tenant = this.userContextService.user$.getValue().tenant;
    this.batchReq.sofcBaseHerf = environment.sofcBaseHerf;
    this.batchReq.endDate = new Date(
      myDate.getUTCFullYear(),
      myDate.getUTCMonth(),
      myDate.getUTCDate()
    );
    this.batchReq.startDate = new Date(
      myDate.getUTCFullYear(),
      myDate.getUTCMonth(),
      myDate.getUTCDate()
    );
  }

  /**
   * 查詢按鈕 Click 事件
   */
  searchBatchBtnClick(): void {
    if (!this.batchReq.startDate || !this.batchReq.endDate) return;
    if (this.displayBatchResult) {
      this.resetLazySortBatch();
    } else {
      setTimeout(() => {
        this.displayBatchResult = true;
      });
    }
  }

  downloadBatchBtnClick(): void {
    if (!this.batchReq.startDate || !this.batchReq.endDate) return;
    this.batchReq.action = 'DOWNLOAD';
    this.batchReq.userEmail =
      this.userContextService.user$.getValue().userEmail;
    this.loaderService.show();
    this.dplBlackApiService.dplBatchQuery(this.batchReq).subscribe({
      next: (rsp) => {
        this.dialogMsg = this.translateService.instant(
          'DPLResult.Message.DownloadProcess'
        );
        this.batchReq.action = '';
        this.loaderService.hide();
        this.displayDialog = true;
      },
      error: (e) => {
        this.batchReq.action = '';
        console.error(e);
        this.loaderService.hide();
        this.toastService.error('System.Message.Error');
      },
    });
  }

  filterLazyBatch(globalFilter: string) {
    this.batchData = [];
    for (var i = 0; i < this.cloneBatchData.length; i++) {
      for (var j = 0; j < this.batchSelectedCols.length; j++) {
        try {
          if (
            this.cloneBatchData[i][this.batchSelectedCols[j].field] ===
            undefined
          )
            continue;
          var value = this.cloneBatchData[i][this.batchSelectedCols[j].field];
          if (value.toLowerCase().indexOf(globalFilter.toLowerCase()) !== -1) {
            this.batchData.push(this.cloneBatchData[i]);
            break;
          }
        } catch (e) {
          console.log(e);
        }
      }
    }
    return;
  }

  onLazyLoadBatch(event: LazyLoadEvent) {
    this.batchReq.lazyLoadEvent = event;
    if (
      event &&
      event.sortField &&
      this.lazyTableBatch &&
      this.batchData &&
      (event.sortField !== this.sortFieldBatch ||
        event.sortOrder !== this.sortOrderBatch)
    ) {
      this.batchData = this.sortArrayData(
        this.batchData,
        event.sortField,
        event.sortOrder
      );
      this.lazyTableBatch.first = this.firstBatch;
      return;
    }
    setTimeout(() => {
      this.loaderService.show();
      this.dplBlackApiService.dplBatchQuery(this.batchReq).subscribe({
        next: (rsp) => {
          this.batchData = rsp.resultList;
          this.cloneBatchData = rsp.resultList;
          this.filterLazyBatch(this.globalFilterBatch);
          this.totalBatchRecords = rsp.totalRecords;
          this.displayBatchResult = true;
          this.loaderService.hide();
          this.batchData = this.sortArrayData(
            this.batchData,
            event.sortField,
            event.sortOrder
          );
        },
        error: (e) => {
          console.error(e);
          this.loaderService.hide();
          this.toastService.error('System.Message.Error');
        },
      });
    });
  }

  onSortBatch(event) {
    this.sortFieldBatch = event.field;
    this.sortOrderBatch = event.order;
  }

  onPageBatch(event) {
    this.firstBatch = event.first;
  }

  resetLazySortBatch() {
    this.lazyTableBatch.sortOrder = undefined;
    this.lazyTableBatch.sortField = undefined;
    this.lazyTableBatch.first = 0;
    this.lazyTableBatch.rows = 10;
    this.lazyTableBatch.reset();
    this.firstBatch = 0;
    this.sortFieldBatch = undefined;
    this.sortOrderBatch = undefined;
  }

  resetBatchBtnClick() {
    this.displayBatchResult = false;
    this.composeBatchReq();
  }

  showBatchFilter() {
    this.displayBatchFilter = true;
  }

  changeBatchFilter() {
    this.batchSelectedCols = this.batchCols.filter((x) => {
      return x.isDefault;
    });
    if (this.permissions.includes('view')) {
      this.batchSelectedCols.push(
        this.translateService.instant('DPLResult.DetailColums')
      );
    }
  }

  resetBatchFilter() {
    this.batchSelectedCols = this.batchCols.filter((x) => {
      return x.isDefault;
    });
  }

  viewBatchDetail(seq: number) {
    this.loaderService.show();
    this.batchReq.seq = seq;

    this.dplBlackApiService.dplBatchDetail(this.batchReq).subscribe({
      next: (rsp) => {
        this.batchDetailRsp = rsp;
        this.batchDetailData = rsp.detailList;
        this.loaderService.hide();
      },
      error: (e) => {
        console.error(e);
        this.loaderService.hide();
        this.toastService.error('System.Message.Error');
      },
    });

    this.displayBatchDetail = true;
  }

  ngOnDestroy(): void {
    [this.onLangChange$, this.loginStateSubscription$].forEach(
      (subscription: Subscription) => {
        if (subscription != null || subscription != undefined)
          subscription.unsubscribe();
      }
    );
  }

  //#-----------------start------------------
  //# for date picker input format event
  onCheckDateHandler(queryKey: 'queryReq' | 'batchReq'): void {
    if (queryKey === 'queryReq') {
      if (
        new Date(
          new Date(this.queryReq.startDate).setHours(0, 0, 0, 0)
        ).getTime() >=
        new Date(
          new Date(this.queryReq.endDate).setHours(23, 59, 59, 0)
        ).getTime()
      ) {
        this.queryReq.endDate = null;
      }
    } else {
      if (
        new Date(
          new Date(this.batchReq.startDate).setHours(0, 0, 0, 0)
        ).getTime() >=
        new Date(
          new Date(this.batchReq.endDate).setHours(23, 59, 59, 0)
        ).getTime()
      ) {
        this.batchReq.endDate = null;
      }
    }
  }

  onDatePickerInput(event: InputEvent): void {
    this.dateInputHandlerService.concat(event.data);
  }

  onDatePickerSelectAndBlur(): void {
    this.dateInputHandlerService.clean();
  }

  onDatePickerClose(queryKey: 'queryReq' | 'batchReq', key: string): void {
    if (queryKey === 'queryReq') {
      this.queryReq = {
        ...this.queryReq,
        [key]: this.dateInputHandlerService.getDate() ?? this.queryReq[key],
      };
    } else {
      this.batchReq = {
        ...this.batchReq,
        [key]: this.dateInputHandlerService.getDate() ?? this.batchReq[key],
      };
    }
    this.dateInputHandlerService.clean();
  }
  //#------------------end------------------
}
