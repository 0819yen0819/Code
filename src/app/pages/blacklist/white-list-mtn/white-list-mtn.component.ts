import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { LazyLoadEvent, SelectItem } from 'primeng/api';
import { Table } from 'primeng/table';
import { lastValueFrom, Subscription } from 'rxjs';
import { AuthApiService } from 'src/app/core/services/auth-api.service';
import { DplBlackApiService } from 'src/app/core/services/dpl-black-api.service';
import { ToastService } from 'src/app/core/services/toast.service';
import { CommonApiService } from '../../../core/services/common-api.service';
import { LanguageService } from '../../../core/services/language.service';
import { LoaderService } from '../../../core/services/loader.service';
import { UserContextService } from './../../../core/services/user-context.service';
import { WhiteListMtnModifyRequest } from './bean/white-list-mtn-modify-request';
import { WhiteListMtnQueryRequest } from './bean/white-list-mtn-query-request';
import { TableStatusKeepService } from 'src/app/core/services/table-status-keep.service';

@Component({
  selector: 'app-white-list-mtn',
  templateUrl: './white-list-mtn.component.html',
  styleUrls: ['./white-list-mtn.component.scss'],
})
export class WhiteListMtnComponent implements OnInit, OnDestroy {
  private onLangChange$: Subscription;
  private loginStateSubscription$: Subscription;

  @ViewChild('lazyTable') lazyTable: Table;

  permissions: string[] = [];

  selectedCustomer: any;
  filteredCustomers: any[];

  flagOptions: SelectItem[];
  flag2Options: SelectItem[];

  displayResult: boolean = false;

  displayDialog: boolean = false;
  dialogMsg: string;

  cols: any[];
  selectedCols: any[];

  data: any[];
  cloneData: any[];
  selectedData: any[];
  editData: any[];

  displayFilter: boolean = false;
  displayDetail: boolean = false;

  queryReq: WhiteListMtnQueryRequest = new WhiteListMtnQueryRequest();

  totalRecords: number;

  displayUpload: boolean = false;

  modifyStatus: boolean = false;

  isSuccess: boolean = false;

  displayEditTable: boolean = false;

  selectedOu: any;
  filteredOus: any[];

  sortField: string;
  sortOrder: number;
  first: number = 0;

  globalFilter: string = '';

  constructor(
    private router: Router,
    private userContextService: UserContextService,
    private languageService: LanguageService,
    private translateService: TranslateService,
    private toastService: ToastService,
    private dplBlackApiService: DplBlackApiService,
    private authApiService: AuthApiService,
    private commonApiService: CommonApiService,
    private loaderService: LoaderService,
    public tableStatusKeepService : TableStatusKeepService
  ) {
    if (this.userContextService.user$.getValue) {
      this.permissions = this.userContextService.getMenuUrlPermission(
        this.router.url
      );
      console.log('permissions: ', this.permissions);
    }
    this.onLangChange$ = this.translateService.onLangChange.subscribe(() => {
      // this.setBreadcrumbItems();
      this.initOptions();
      this.initColumns();
      this.changeFilter();
      // 會trigger LAZY-TABLE的onLazyLoad event
      this.displayResult = true;
    });

    this.translateService
      .use(this.languageService.getLang())
      .subscribe((next) => {});
  }

  ngOnInit(): void {
    this.composeQueryReq();

    this.initOptions();
    this.flag2Options = [
      { label: 'Y', value: 'Y' },
      { label: 'N', value: 'N' },
    ];

    this.initColumns();

    this.changeFilter();

    //# TK-35854
    // 會trigger LAZY-TABLE的onLazyLoad event
    // this.displayResult = true;
  }

  initColumns() {
    this.cols = this.translateService.instant('WhiteListMtn.Columns');
  }

  initOptions() {
    this.flagOptions = this.translateService.instant(
      'WhiteListMtn.Options.flagOptions'
    );
  }

  /**
   * 查詢按鈕 Click 事件
   */
  searchBtnClick(): void {
    this.tableStatusKeepService.resetPageEvent();
    this.composeAutoCompleteReq();

    if (this.displayResult) {
      this.resetLazySort();
    } else {
      setTimeout(() => {
        this.displayResult = true;
      });
    }
  }

  downloadBtnClick(): void {
    this.queryReq.action = 'DOWNLOAD';
    this.composeAutoCompleteReq();

    this.loaderService.show();
    this.dplBlackApiService.whiteListMtnQuery(this.queryReq).subscribe({
      next: (rsp) => {
        this.queryReq.action = '';
        this.commonApiService.downloadFile(rsp.fileId);
      },
      error: (e) => {
        this.queryReq.action = '';
        console.error(e);
        this.loaderService.hide();
        this.toastService.error('System.Message.Error');
      },
    });
  }

  composeAutoCompleteReq() {
    if (this.selectedCustomer !== undefined)
      this.queryReq.customerNo = this.selectedCustomer.customerNo;

    if (this.selectedOu !== undefined)
      this.queryReq.ouCode = this.selectedOu.ouCode;
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

  async onLazyLoad(event: LazyLoadEvent) { 
    await this.tableStatusKeepService.delay(1);

    event.first = this.tableStatusKeepService.get(this.tableStatusKeepService.tableStatusKeepEnum.PageEvent)?.first;
    event.rows = this.tableStatusKeepService.get(this.tableStatusKeepService.tableStatusKeepEnum.PageEvent)?.rows;
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
      this.dplBlackApiService.whiteListMtnQuery(this.queryReq).subscribe({
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
    this.tableStatusKeepService.keep(this.tableStatusKeepService.tableStatusKeepEnum.PageEvent,event); 
    this.first = event.first;
  }

  resetLazySort() {
    this.lazyTable.sortOrder = undefined;
    this.lazyTable.sortField = undefined;
    this.lazyTable.first = 0;
    this.lazyTable.rows = 10;
    this.lazyTable.reset();
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
    if (this.permissions.includes('edit')) {
      this.selectedCols.unshift({
        field: 'checkbox',
        header: '',
        css: 'icon-col',
        maxWidth: '2%',
        textAlign: 'left',
      });
    }
  }

  resetFilter() {
    this.selectedCols = this.cols.filter((x) => {
      return x.isDefault;
    });
  }

  composeQueryReq() {
    this.queryReq = new WhiteListMtnQueryRequest();
    this.queryReq.tenant = this.userContextService.user$.getValue().tenant;
    this.selectedCustomer = undefined;
    this.selectedOu = undefined;
    this.selectedData = undefined;
  }

  onChangeFlag(event): void {
    this.editData.forEach(function (data) {
      data.flag = event;
    });
  }

  editInTable(): void {
    if (this.selectedData === undefined || this.selectedData.length < 1) {
      this.isSuccess = false;
      this.dialogMsg = this.translateService.instant(
        'Dialog.Message.SelectAtLeastOne'
      );
      this.displayDialog = true;
      return;
    }
    this.editData = JSON.parse(JSON.stringify(this.selectedData));
    this.displayResult = false;
    this.displayEditTable = true;
  }

  saveEditTable(): void {
    this.loaderService.show();
    let modifyReq = new WhiteListMtnModifyRequest();
    modifyReq.userEmail = this.userContextService.user$.getValue().userEmail;
    modifyReq.tenant = this.userContextService.user$.getValue().tenant;
    modifyReq.detailList = this.editData;

    this.dplBlackApiService.whiteListMtnModify(modifyReq).subscribe({
      next: (rsp) => {
        this.isSuccess = true;
        this.dialogMsg = this.translateService.instant(
          'Dialog.Message.SuccessfullySaved'
        );
        this.displayDialog = true;
        this.loaderService.hide();
        this.selectedData = undefined;
        this.editData = undefined;
        this.displayResult = true;
        this.displayEditTable = false;
      },
      error: (rsp) => {
        if (rsp) {
          console.log(rsp);
        }
        this.toastService.error('System.Message.Error');
        this.loaderService.hide();
      },
    });
  }

  cancelEditTable(): void {
    this.displayResult = true;
    this.displayEditTable = false;
  }

  async filterCustomer(event) {
    let filtered: any[] = [];
    let query = event.query;

    let rsp = await lastValueFrom(
      this.commonApiService.customerQueryByPrefix(query)
    );
    for (var customer of rsp.customerList) {
      filtered.push(customer);
    }

    this.filteredCustomers = filtered;
  }

  onBlurCustomer(event) {
    // 沒選autoComplete的話.清空input內容
    if (
      this.selectedCustomer === undefined ||
      this.selectedCustomer.customerNo === undefined
    ) {
      this.selectedCustomer = undefined;
      this.queryReq.customerNo = undefined;
    }
  }

  async filterOu(event) {
    let filtered: any[] = [];
    let query = event.query;

    let rsp = await lastValueFrom(this.authApiService.ouQueryByPrefix(query));
    for (var ou of rsp.ouList) {
      filtered.push(ou);
    }

    this.filteredOus = filtered;
  }

  onClickFlag(event): void {
    let value = event.target.innerText;
    if (value === '') {
      return;
    }
    this.editData.forEach(function (data) {
      data.flag = value;
    });
  }

  onBlurOu(event) {
    // 沒選autoComplete的話.清空input內容
    if (this.selectedOu === undefined || this.selectedOu.ouCode === undefined) {
      this.selectedOu = undefined;
      this.queryReq.ouCode = undefined;
    }
  }

  ngOnDestroy(): void {
    [this.onLangChange$, this.loginStateSubscription$].forEach(
      (subscription: Subscription) => {
        if (subscription != null || subscription != undefined)
          subscription.unsubscribe();
      }
    );
  }
}
