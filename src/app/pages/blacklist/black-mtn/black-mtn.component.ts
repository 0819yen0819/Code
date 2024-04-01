import { ObjectFormatService } from 'src/app/core/services/object-format.service';
import { DateInputHandlerService } from './../../../core/services/date-input-handler.service';
import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { LazyLoadEvent, SelectItem } from 'primeng/api';
import { Table } from 'primeng/table';
import { lastValueFrom, Subscription, takeLast } from 'rxjs';
import { ToastService } from 'src/app/core/services/toast.service';
import { CommonApiService } from '../../../core/services/common-api.service';
import { DplBlackApiService } from '../../../core/services/dpl-black-api.service';
import { LanguageService } from '../../../core/services/language.service';
import { LoaderService } from '../../../core/services/loader.service';
import { UserContextService } from './../../../core/services/user-context.service';
import { BlackMtnBean } from './bean/black-mtn-bean';
import { BlackMtnModifyRequest } from './bean/black-mtn-modify-request';
import { BlackMtnQueryRequest } from './bean/black-mtn-query-request';
import { TableStatusKeepService } from 'src/app/core/services/table-status-keep.service';

@Component({
  selector: 'app-black-mtn',
  templateUrl: './black-mtn.component.html',
  styleUrls: ['./black-mtn.component.scss'],
})
export class BlackMtnComponent implements OnInit, OnDestroy {
  private onLangChange$: Subscription;
  private loginStateSubscription$: Subscription;

  @ViewChild('lazyTable') lazyTable: Table;

  permissions: string[] = [];

  selectedCustomer: any;

  flagOptions: SelectItem[];

  displayResult: boolean = false;

  displayDialog: boolean = false;
  dialogMsg: string;

  cols: any[];
  selectedCols: any[];

  data: any[];
  cloneData: any[];
  selectedData: any[];

  displayFilter: boolean = false;
  displayDetail: boolean = false;

  queryReq: BlackMtnQueryRequest = new BlackMtnQueryRequest();

  detailBean: BlackMtnBean = new BlackMtnBean();

  totalRecords: number;

  isEdit: boolean = false;

  editFlagOptions: SelectItem[];

  modifyStatus: boolean = false;

  filteredCustomers: any[];

  editForm: FormGroup;
  formSubmitted: boolean = false;

  sortField: string;
  sortOrder: number;
  first: number = 0;
  globalFilter: string = '';

  DPLMtnWarningRes: any;
  DPLMtnWarningLabel: string = '';

  constructor(
    private router: Router,
    private formBuilder: FormBuilder,
    private userContextService: UserContextService,
    private languageService: LanguageService,
    private translateService: TranslateService,
    private toastService: ToastService,
    private dplBlackApiService: DplBlackApiService,
    private commonApiService: CommonApiService,
    private loaderService: LoaderService,
    private dateInputHandlerService: DateInputHandlerService,
    private objectFormatService:ObjectFormatService,
    public tableStatusKeepService : TableStatusKeepService
  ) {
    if (this.userContextService.user$.getValue) {
      this.permissions = this.userContextService.getMenuUrlPermission(
        this.router.url
      );
      console.log('permissions: ', this.permissions);
    }
    this.onLangChange$ = this.translateService.onLangChange.subscribe(
      (lang) => {
        // this.setBreadcrumbItems();
        this.initOptions();
        this.initColumns();
        this.changeFilter();
        this.DPLMtnWarningLabel =
          lang.lang === 'zh-tw'
            ? this.DPLMtnWarningRes?.rulesCategoryRemarkCn
            : this.DPLMtnWarningRes?.rulesCategoryRemarkEn;
      }
    );

    this.translateService
      .use(this.languageService.getLang())
      .subscribe((next) => {});
  }

  ngOnInit(): void {
    this.composeQueryReq();

    this.initOptions();

    this.editFlagOptions = [
      { label: 'Y', value: 'Y' },
      { label: 'N', value: 'N' },
    ];

    this.initColumns();

    this.changeFilter();

    //# TK-35854
    // 會trigger LAZY-TABLE的onLazyLoad event
    // this.displayResult = true;

    this.editForm = this.formBuilder.group({
      addCustomer: ['', Validators.required],
      source: ['', Validators.required],
      publishDate: ['', Validators.required],
      frNumber: ['', Validators.required],
      remark: [''],
      flag: ['', Validators.required],
    });

    const tenant = this.userContextService.user$.getValue().tenant;
    this.commonApiService
      .queryRuleSetup({
        tenant: tenant,
        msgFrom: '',
        trackingId: '',
        searchTenant: tenant,
        tenantPermissionList: [tenant],
        ruleId: 'DPLMtnWarning1',
      })
      .pipe(takeLast(1))
      .subscribe({
        next: (res) => {
          this.DPLMtnWarningRes = res?.ruleList[0];
          const lang = this.languageService.getLang();
          this.DPLMtnWarningLabel =
            lang === 'zh-tw'
              ? this.DPLMtnWarningRes?.rulesCategoryRemarkCn
              : this.DPLMtnWarningRes?.rulesCategoryRemarkEn;
        },
        error: (err) => {
          console.error(err);
        },
      });
  }

  initColumns() {
    this.cols = this.translateService.instant('BlackMtn.Columns');
  }

  initOptions() {
    this.flagOptions = this.translateService.instant(
      'BlackMtn.Options.flagOptions'
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
    this.dplBlackApiService.blackMtnQuery(this.queryReq).subscribe({
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
    if (this.selectedCustomer !== undefined) {
      this.queryReq.customerNo = this.selectedCustomer.customerNo;
    }
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
      this.dplBlackApiService.blackMtnQuery(this.queryReq).subscribe({
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
    // this.selectedCols.unshift({ field: 'edit', header: '編輯', css: 'icon-col' });
    if (this.permissions.includes('edit')) {
      this.selectedCols.unshift(
        this.translateService.instant('BlackMtn.EditColums')
      );
    }
  }

  resetFilter() {
    this.selectedCols = this.cols.filter((x) => {
      return x.isDefault;
    });
  }

  editDetail(seq: number) {
    if (seq !== undefined) {
      this.loaderService.show();
      this.isEdit = true;
      this.queryReq.seq = seq;
      this.dplBlackApiService.blackMtnView(this.queryReq).subscribe({
        next: (res) => {
          this.detailBean = res.detail;
          let editFormData = {
            addCustomer: this.detailBean.customerNo,
            source: this.detailBean.source,
            frNumber: this.detailBean.frNumber,
            flag: this.detailBean.flag,
            publishDate: this.detailBean.displayPublishDate,
            remark: this.detailBean.remark,
          };
          this.editForm.setValue(editFormData);
          this.loaderService.hide();
        },
        error: (e) => {
          console.error(e);
          this.loaderService.hide();
          this.toastService.error('System.Message.Error');
        },
      });
    } else {
      this.isEdit = false;
      let editFormData = {
        addCustomer: '',
        source: '',
        frNumber: '',
        flag: 'Y',
        publishDate: '',
        remark: '',
      };
      this.editForm.setValue(editFormData);
      this.detailBean = new BlackMtnBean();
    }

    this.displayDetail = true;
  }

  saveDetail() {
    this.formSubmitted = true;
    if (this.editForm.invalid) {
      return;
    }

    let modifyReq = new BlackMtnModifyRequest();
    modifyReq.userEmail = this.userContextService.user$.getValue().userEmail;
    modifyReq.tenant = this.userContextService.user$.getValue().tenant;
    modifyReq.action = 'ADD';
    modifyReq.detail = this.detailBean;

    modifyReq.detail.source = this.editForm.get('source').value;
    modifyReq.detail.frNumber = this.editForm.get('frNumber').value;
    modifyReq.detail.flag = this.editForm.get('flag').value;
    modifyReq.detail.displayPublishDate =
      this.objectFormatService.DateFormat(this.editForm.get('publishDate').value,'/');
    modifyReq.detail.remark = this.editForm.get('remark').value;

    if (this.isEdit) {
      modifyReq.action = 'EDIT';
    } else {
      modifyReq.detail.customerNo =
        this.editForm.get('addCustomer').value.customerNo;
    }

    this.dplBlackApiService.blackMtnModify(modifyReq).subscribe({
      next: (rsp) => {
        this.displayResult = false;
        this.modifyStatus = true;
        this.dialogMsg = this.translateService.instant(
          'Dialog.Message.SuccessfullySaved'
        );
        this.displayDialog = true;
        this.loaderService.hide();
      },
      error: (rsp) => {
        console.log(rsp);
        if (rsp?.status == 500 && rsp.error?.code) {
          this.modifyStatus = false;
          this.dialogMsg = rsp.error?.message;
          this.displayDialog = true;
        } else {
          this.toastService.error('System.Message.Error');
        }
        this.loaderService.hide();
      },
    });
    // this.dialogMsg = 'Tenant + CustomerNo 已有設定紀錄存在，請您確認一下';
  }

  onHideMsgDialog(event: any) {
    if (this.modifyStatus) {
      this.displayDetail = false;
      setTimeout(() => {
        this.displayResult = true;
      });

      this.formSubmitted = false;
      this.editForm.reset();
    }
  }

  onHideDetailDialog(event: any) {
    this.formSubmitted = false;
    this.editForm.reset();
  }

  cancelDetail() {
    this.displayDetail = false;
    this.formSubmitted = false;
    this.editForm.reset();
  }

  composeQueryReq() {
    this.queryReq = new BlackMtnQueryRequest();
    this.queryReq.tenant = this.userContextService.user$.getValue().tenant;
    this.selectedCustomer = undefined;
    this.selectedData = undefined;
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

  onSelectAddCustomer() {
    let customer = this.editForm.get('addCustomer').value;
    this.detailBean.customerNo = customer.customerNo;
    this.detailBean.customerName = customer.customerName;
    this.detailBean.customerNameEg = customer.customerNameEg;
  }

  ngOnDestroy(): void {
    [this.onLangChange$, this.loginStateSubscription$].forEach(
      (subscription: Subscription) => {
        if (subscription != null || subscription != undefined)
          subscription.unsubscribe();
      }
    );
  }

  get editF() {
    return this.editForm.controls;
  }

  //#-----------------start------------------
  //# for date picker input format event
  onDatePickerInput(event: InputEvent): void {
    this.dateInputHandlerService.concat(event.data);
  }

  onDatePickerSelectAndBlur(): void {
    this.dateInputHandlerService.clean();
  }

  onDatePickerClose(key: string): void {
    this.queryReq = {
      ...this.queryReq,
      [key]: this.dateInputHandlerService.getDate() ?? this.queryReq[key],
    };
    this.dateInputHandlerService.clean();
  }
  //#------------------end------------------

  //#-----------------start------------------
  //# for date picker input format event
  onFormDatePickerInput(event: InputEvent, key: string): void {
    if (!this.editForm.controls[key].value) {
      this.dateInputHandlerService.concat(event.data);
    }
  }

  onFormDatePickerSelectAndBlur(): void {
    this.dateInputHandlerService.clean();
  }

  onFormDatePickerClose(key: string): void {
    this.editForm.controls[key].setValue(
      this.dateInputHandlerService.getDate() ??
        this.editForm.controls[key].value
    );
    this.dateInputHandlerService.clean();
  }
  //#------------------end------------------
}
