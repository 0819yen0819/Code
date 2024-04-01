import { DateInputHandlerService } from './../../../core/services/date-input-handler.service';
import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import {
  LazyLoadEvent,
  SelectItem
} from 'primeng/api';
import { Table } from 'primeng/table';
import { lastValueFrom, Subscription, takeLast } from 'rxjs';
import { LicenseTypeEnum } from 'src/app/core/enums/license-type-enum';
import { SelectorItemType } from 'src/app/core/enums/selector-item-type';
import {
  DialogSettingParams,
  SelectorDialogParams
} from 'src/app/core/model/selector-dialog-params';
import { CommonApiService } from 'src/app/core/services/common-api.service';
import { LicenseControlApiService } from 'src/app/core/services/license-control-api.service';
import { LoaderService } from 'src/app/core/services/loader.service';
import { ToastService } from 'src/app/core/services/toast.service';
import { UserContextService } from 'src/app/core/services/user-context.service';
import { LicenseMtnQueryRequest } from '../common/bean/license-mtn-query-request';
import { ObjectFormatService } from './../../../core/services/object-format.service';
import { TableStatusKeepService } from 'src/app/core/services/table-status-keep.service';

@Component({
  selector: 'app-sc047-license-mtn',
  templateUrl: './sc047-license-mtn.component.html',
  styleUrls: ['./sc047-license-mtn.component.scss'],
})
export class Sc047LicenseMtnComponent implements OnInit, OnDestroy {
  @ViewChild('lazyTable') lazyTable: Table;

  private onLangChange$: Subscription;
  permissions: string[] = [];
  countryCodeOptions: SelectItem[];
  customerVendorTypeOptions: SelectItem[];
  customerVendorCode: any;
  flagOptions: SelectItem[];

  displayResult: boolean = false;

  cols: any[];
  data: any[];
  cloneData: any[];
  selectedCols: any[];

  queryReq: LicenseMtnQueryRequest = new LicenseMtnQueryRequest();

  sortField: string;
  sortOrder: number;
  first: number = 0;
  globalFilter: string = '';
  totalRecords: number;

  displayFilter: boolean = false;
  displayDetail: boolean = false;

  colFuncs: any[];
  itemFilterTypeOptions: SelectItem[];

  displayArea: boolean = false;
  displayHistory: boolean = false;

  viewAreaProductCode: string;
  queryHistoryParam: any;

  //> v/c selector dialog params
  selectorDialogParams!: SelectorDialogParams;
  curCVLable: string = '';
  curOULable: string = '';
  curOOULable: string = '';
  curSelectType: string;

  itemAddDialogParams!: DialogSettingParams;
  itemModifyDialogParams!: DialogSettingParams;

  displayDelDialog!: boolean;
  delSeq!: number | null;

  constructor(
    private router: Router,
    private userContextService: UserContextService,
    private translateService: TranslateService,
    private toastService: ToastService,
    private commonApiService: CommonApiService,
    private loaderService: LoaderService,
    private licenseControlApiService: LicenseControlApiService,
    private objectFormatService:ObjectFormatService,
    private dateInputHandlerService:DateInputHandlerService,
    public tableStatusKeepService : TableStatusKeepService
  ) {
    if (this.userContextService.user$.getValue) {
      this.permissions = this.userContextService.getMenuUrlPermission(
        this.router.url
      );
      console.log('permissions: ', this.permissions);
    }
    this.onLangChange$ = this.translateService.onLangChange.subscribe(() => {
      this.initColumns();
      this.initOptions();
      this.changeFilter();
    });
    this.composeQueryReq();
  }

  ngOnInit(): void {
    this.initColumns();
    this.initOptions();
    this.changeFilter();
    //# TK-35854
    // 會trigger LAZY-TABLE的onLazyLoad event
    // this.displayResult = true;
    this.displayDelDialog = false;
    this.delSeq = null;
  }

  initColumns() {
    this.cols = this.translateService.instant('Sc047LicenseMtn.Columns');
    this.colFuncs = this.translateService.instant(
      'EucLicenseMtn.ColumnFunctions'
    );
  }

  initOptions() {
    this.customerVendorTypeOptions = [];
    this.customerVendorTypeOptions.push.apply(
      this.customerVendorTypeOptions,
      this.translateService.instant(
        'ImpExpLicenseMtn.Options.customerVendorTypeOptions'
      )
    );
    this.flagOptions = this.translateService.instant(
      'ImpExpLicenseMtn.Options.flagOptions'
    );
    this.countryCodeOptions = [];
    this.countryCodeOptions.push.apply(
      this.countryCodeOptions,
      this.translateService.instant(
        'ImpExpLicenseMtn.Options.countryCodeOptions'
      )
    );
    this.getCountryCode();
    this.itemFilterTypeOptions = [];
    this.itemFilterTypeOptions.push.apply(
      this.itemFilterTypeOptions,
      this.translateService.instant(
        'ImpExpLicenseMtn.Options.itemFilterTypeOptions'
      )
    );
  }

  changeFilter() {
    this.selectedCols = this.cols.filter((x) => {
      return x.isDefault;
    });
    this.colFuncs?.forEach((x) => {
      this.selectedCols.unshift(x);
    });
  }

  addDetail(): void {
    this.itemAddDialogParams = {
      title: this.translateService.instant(
        'LicenseMgmt.Common.Title.AddSCMtnRecord'
      ),
      visiable: true,
    };
  }

  editDetail(data): void {
    this.itemModifyDialogParams = {
      title: this.translateService.instant(
        'LicenseMgmt.Common.Title.ModifySCMtnRecord'
      ),
      visiable: true,
      data: data,
    };
  }

  showDelDialog(seq: number): void {
    this.displayDelDialog = true;
    this.delSeq = seq;
  }

  delDetail(): void {
    this.displayDelDialog = false;
    this.licenseControlApiService
      .deleteLicenseMasterBySeq(this.delSeq)
      .pipe(takeLast(1))
      .subscribe({
        next: () => {
          this.toastService.success(
            this.translateService.instant('Sc047LicenseMtn.Message.DelSuccess')
          );
          this.searchBtnClick(true);
        },
        error: (err) => {
          console.error(err);
          this.toastService.error(
            this.translateService.instant('Sc047LicenseMtn.Message.DelFailed')
          );
        },
      });
  }

  showFilter() {
    this.displayFilter = true;
  }

  resetBtnClick() {
    this.displayResult = false;
    this.composeQueryReq();
    this.first = 0;
    this.sortField = undefined;
    this.sortOrder = undefined;
  }

  searchBtnClick(isFromDialog = false): void {

      if (!isFromDialog){
        this.tableStatusKeepService.resetPageEvent();
        if (this.displayResult) {
          this.resetLazySort();
        } else {
          setTimeout(() => {
            this.displayResult = true;
          });
        }
      } else{
        this.onLazyLoad({
          "first": this.tableStatusKeepService.get(this.tableStatusKeepService.tableStatusKeepEnum.PageEvent)?.first,
          "rows": this.tableStatusKeepService.get(this.tableStatusKeepService.tableStatusKeepEnum.PageEvent)?.rows,
          "sortOrder": 1,
          "filters": {},
          "globalFilter": null
      });
    }

  }

  /**
   * 下載按鈕 click 事件
   */
  downloadBtnClick(): void {
    let model = this.queryReq;
    this.loaderService.show();
    this.licenseControlApiService
      .downloadLazyLicenseMasterByConditions(model)
      .subscribe({
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

  composeQueryReq() {
    this.queryReq = new LicenseMtnQueryRequest();
    this.queryReq.flag = 'Y';
    this.queryReq.licenseType = LicenseTypeEnum.SC047;
    // let myDate = new Date();
    // this.queryReq.endDate = new Date(myDate.getUTCFullYear(), myDate.getUTCMonth(), myDate.getUTCDate());
    // this.queryReq.startDate = new Date(this.queryReq.endDate.getFullYear(), this.queryReq.endDate.getMonth(), this.queryReq.endDate.getDate() - 31);
    this.queryReq.permissions = this.permissions;
    this.queryReq.customerVendorType = 'Customer';
    this.queryReq.itemFilterType = 'Include';
    this.curCVLable = '';
    this.curOOULable = '';
    this.curOULable = '';
  }

  resetLazySort() {
    this.lazyTable.sortOrder = undefined;
    this.lazyTable.sortField = undefined;
    this.lazyTable.first = 0;
    this.lazyTable.rows = 10;
    this.lazyTable.reset();
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
      const req = {
        ...this.queryReq,
        customerVendorType:
        ( this.queryReq.licenseNo ||
          this.queryReq.item ||
          this.queryReq.trxReferenceNo ) &&
          !this.queryReq.customerVendorCode
            ? ''
            : this.queryReq.customerVendorType,
      };
      this.licenseControlApiService
        .getLazyLicenseMasterByConditions(req)
        .subscribe({
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

  filterLazy(globalFilter: string) {
    this.data = [];
    for (var i = 0; i < this.cloneData.length; i++) {
      for (var j = 0; j < this.selectedCols.length; j++) {
        try {
          if (this.cloneData[i][this.selectedCols[j].field] === undefined)
            continue;
          var value = this.cloneData[i][this.selectedCols[j].field];
          if (
            value &&
            value
              .toString()
              .toLowerCase()
              .indexOf(globalFilter.toLowerCase()) !== -1
          ) {
            this.data.push(this.cloneData[i]);
            break;
          }
        } catch (e) {
          console.error(e);
        }
      }
    }
    return;
  }

  async getCountryCode() {
    let currentCountryCode = this.queryReq.countryCode;
    let tenant = this.userContextService.user$.getValue().tenant;
    let tenantPermissionList = [];
    tenantPermissionList.push(tenant);
    let model = {
      msgFrom: 'ImportLicenseMtn',
      trackingId: 'SCLicense',
      tenantPermissionList: tenantPermissionList,
      ruleId: 'SCLicense'
    };
    let rsp = await lastValueFrom(this.commonApiService.queryRuleSetup(model));
    for (var rule of rsp.ruleList) {
      this.countryCodeOptions.push({
        label:
          this.translateService.currentLang === 'zh-tw'
            ? rule.rulesCategoryRuleItemCn
            : rule.rulesCategoryRuleItemEn,
        value: rule.ruleCode,
      });
    }
    this.queryReq.countryCode = currentCountryCode;
  }

  viewArea(productCode: string) {
    this.viewAreaProductCode = productCode;
    this.displayArea = true;
  }

  viewHistory(data) {
    this.queryHistoryParam = data;
    this.displayHistory = true;
  }

  onChangeVCType(event) {
    this.customerVendorCode = undefined;
    this.queryReq.customerVendorCode = undefined;
    this.curCVLable = '';
  }

  //> open v/c selector dialog handler
  onOpenSelectorDialogEvent(type: string): void {
    let titlePrefix: string = '';
    this.curSelectType = type;

    let title = '';
    let searchType = '';
    let data = null;

    if (this.translateService.currentLang == 'zh-tw') {
      titlePrefix = '選擇';
    } else {
      titlePrefix = 'Choose';
    }

    if (this.curSelectType == SelectorItemType.OOU) {
      title = `${titlePrefix} ${this.translateService.instant(
        'SoaLicenseMtn.Label.OOuCode'
      )}`;
      searchType = SelectorItemType.ALLOOU;
    } else if (this.curSelectType == SelectorItemType.OU) {
      title = `${titlePrefix} ${this.translateService.instant(
        'SoaLicenseMtn.Label.OuCode'
      )}`;
      searchType = SelectorItemType.ALLOU;
    } else {
      if (this.queryReq.customerVendorType === 'Customer') {
        title = `${titlePrefix} Custormer`;
        searchType = SelectorItemType.ALLCUSTOMER;
      }
      if (this.queryReq.customerVendorType === 'Vendor') {
        title = `${titlePrefix} Vendor`;
        searchType = SelectorItemType.ALLVENDOR;
      }
    }

    if (data == null) {
      this.selectorDialogParams = {
        title: title,
        type: searchType,
        visiable: true,
      };
    } else {
      this.selectorDialogParams = {
        title: title,
        type: searchType,
        data: data,
        visiable: true,
      };
    }
  }

  //> open selector dialog callback event
  onSelectorDialogCallback(result: SelectItem<any>): void {
    if (this.curSelectType == SelectorItemType.OOU) {
      this.queryReq.oouCode = result.value.ouCode;
      this.curOOULable = result.value.displayOu;
    } else if (this.curSelectType == SelectorItemType.OU) {
      this.queryReq.ouCode = result.value.ouCode;
      this.curOULable = result.value.displayOu;
    } else {
      this.queryReq.customerVendorCode = result.value.customerNo
        ? result.value.customerNo
        : result.value.vendorCode;
      this.curCVLable = result.label;
    }
  }

  onSelectorClean(type: string) {
    if (type == SelectorItemType.OOU) {
      this.queryReq.oouCode = '';
      this.curOOULable = '';
    } else if (type == SelectorItemType.OU) {
      this.queryReq.ouCode = '';
      this.curOULable = '';
    } else {
      this.queryReq.customerVendorCode = '';
      this.curCVLable = '';
    }
  }

  processTableData(field: string, data: any) {
    if (
      field === 'ouCode' ||
      field === 'oouCode' ||
      field === 'productCode' ||
      field === 'ouGroup'
    ) {
      if (data[field] === '0') {
        return 'ALL';
      }
    } else if (field === 'vcType') {
      if (data[field] === 'V') {
        // return this.translateService.instant('ImpExpLicenseMtn.Label.Vendor');
        return 'Vendor';
      } else if (data[field] === 'C') {
        // return this.translateService.instant('ImpExpLicenseMtn.Label.Customer');
        return 'Customer';
      }
    } else if (field === 'countryCode') {
      let countryCodeOption = this.countryCodeOptions.filter(
        (x) => x.value === data.countryCode
      );
      if (countryCodeOption.length > 0) {
        return countryCodeOption[0]['label'];
      }
      return '';
    } else if (field === 'vcName') {
      if (this.translateService.currentLang !== 'zh-tw') {
        return data['vcNameE'];
      }
    } else if (field === 'startDate'||field === 'endDate') {
      return this.objectFormatService.DateFormat(data[field],'/')
    }
    return data[field];
  }

  onChangeItemFilterType(licenseType: string): void {
    if (this.queryReq.itemFilterType === 'Multi') {
      this.queryReq.item = '';
    } else {
      this.queryReq.items = [];
    }
  }

  ngOnDestroy(): void {
    [this.onLangChange$].forEach((subscription: Subscription) => {
      if (subscription != null) subscription.unsubscribe();
    });
  }

    //#-----------------start------------------
  //# for date picker input format event
  onCheckDateHandler(): void {
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
  }

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
}
