import { DateInputHandlerService } from './../../../core/services/date-input-handler.service';
import { Component, OnDestroy, OnInit, ViewChild } from "@angular/core";
import { Router } from "@angular/router";
import { TranslateService } from "@ngx-translate/core";
import { LazyLoadEvent, SelectItem } from "primeng/api";
import { Table } from "primeng/table";
import { Subscription, takeLast } from "rxjs";
import { LicenseTypeEnum } from "src/app/core/enums/license-type-enum";
import { SelectorItemType } from "src/app/core/enums/selector-item-type";
import { DialogSettingParams, SelectorDialogParams } from "src/app/core/model/selector-dialog-params";
import { LicenseControlApiService } from "src/app/core/services/license-control-api.service";
import { LoaderService } from "src/app/core/services/loader.service";
import { ToastService } from "src/app/core/services/toast.service";
import { UserContextService } from "src/app/core/services/user-context.service";
import { LicenseMtnQueryRequest } from "../common/bean/license-mtn-query-request";
import { ObjectFormatService } from './../../../core/services/object-format.service';
import { MyApplicationService } from 'src/app/core/services/my-application.service';
import { environment } from 'src/environments/environment';
import { TableStatusKeepService } from 'src/app/core/services/table-status-keep.service';

@Component({
  selector: 'app-soa-license-mtn',
  templateUrl: './soa-license-mtn.component.html',
  styleUrls: ['./soa-license-mtn.component.scss']
})
export class SoaLicenseMtnComponent implements OnInit, OnDestroy {

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

  isOriginalOptions: SelectItem[];
  groupOptions: SelectItem[];

  //> v/c selector dialog params
  selectorDialogParams!: SelectorDialogParams;
  curCVLable: string = '';
  curOULable: string = '';
  curOOULable: string = '';
  curSelectType: string;
  selectedData;
  dataPermission:any = null;
  disabledPage = false;

  noticeCheckDialogParams!: DialogSettingParams;
  noticeContentList!: string[];

  hyperlinkBtnText: string = '';

  constructor(
    private router: Router,
    private userContextService: UserContextService,
    private translateService: TranslateService,
    private toastService: ToastService,
    private loaderService: LoaderService,
    private licenseControlApiService: LicenseControlApiService,
    private objectFormatService:ObjectFormatService,
    private dateInputHandlerService:DateInputHandlerService,
    private myApplicationService:MyApplicationService,
    public tableStatusKeepService : TableStatusKeepService
  ) {
    if (this.userContextService.user$.getValue) {
      this.permissions = this.userContextService.getMenuUrlPermission(this.router.url);
      console.log('permissions: ', this.permissions);
    }
    this.onLangChange$ = this.translateService.onLangChange.subscribe(() => {
      this.initColumns();
      this.initOptions();
      this.changeFilter();
      this.initHyperLinkText();
    })
    this.composeQueryReq();
  }

  ngOnInit(): void {
    this.initColumns();
    this.initOptions();
    this.changeFilter();
    //# TK-35860
    this.initHyperLinkText();
    // 會trigger LAZY-TABLE的onLazyLoad event
    // this.displayResult = true;
  }

  initHyperLinkText() {
    this.myApplicationService
      .getFormTitleInfo('License_SOA')
      .pipe(takeLast(1))
      .subscribe({
        next: (res) => {
          if (this.translateService.currentLang === 'zh-tw') {
            this.hyperlinkBtnText = res.body.formTypeNameC;
          } else {
            this.hyperlinkBtnText = res.body.formTypeNameE;
          }
        },
        error: (err) => {
          console.error(err);
          this.hyperlinkBtnText = 'Error';
        },
      });
  }

  initColumns() {
    this.cols = this.translateService.instant('SoaLicenseMtn.Columns');
    this.colFuncs = this.translateService.instant('SoaLicenseMtn.ColumnFunctions');

    if (!this.permissions.includes('edit')) { this.colFuncs = this.colFuncs.filter(item => item.field !== 'edit') };
    if (!this.permissions.includes('del')) { this.colFuncs = this.colFuncs.filter(item => item.field !== 'del') };
  }

  initOptions() {
    this.customerVendorTypeOptions = [];
    this.customerVendorTypeOptions.push.apply(this.customerVendorTypeOptions, this.translateService.instant('ImpExpLicenseMtn.Options.customerVendorTypeOptions'));
    this.flagOptions = this.translateService.instant('ImpExpLicenseMtn.Options.flagOptions');
    this.isOriginalOptions = this.translateService.instant('SoaLicenseMtn.Options.IsOriginalOptions');
    this.countryCodeOptions = [];
    this.countryCodeOptions.push.apply(this.countryCodeOptions, this.translateService.instant('ImpExpLicenseMtn.Options.countryCodeOptions'));
    this.getCountryCode();
    this.itemFilterTypeOptions = [];
    this.itemFilterTypeOptions.push.apply(this.itemFilterTypeOptions, this.translateService.instant('ImpExpLicenseMtn.Options.itemFilterTypeOptions'));

    this.licenseControlApiService.getSOALazyUserDataPermissionAndUserGroup(this.queryReq).subscribe({
      next: (dataPermission) => {
        this.dataPermission = dataPermission;
        this.groupOptions = [];

        dataPermission.userGroups.groupList?.forEach(element => {
          this.groupOptions.push({
            label: element.groupName,
            value: element.groupName,
          });
        });

        if (this.groupOptions.length > 1){
          this.groupOptions.unshift({
            label: "ALL",
            value: "ALL",
          })
        }

        setTimeout(() => {
          this.queryReq.ouGroup = this.groupOptions[0]?.value;
        }, 0);

        this.loaderService.hide();
      },
      error: (err) => {
        console.error(err);
        this.loaderService.hide();
        this.toastService.error('System.Message.Error');
      }
    });
  }

  changeFilter() {
    this.selectedCols = this.cols.filter(x => { return x.isDefault; });
    this.colFuncs?.forEach(x => {
      // this.selectedCols.unshift(x);
      this.selectedCols.push(x);
    });
  }

  showAmDialog: boolean = false;
  editObj: any;
  editDetail(data) {
    this.editObj = data;
    this.showAmDialog = true;
  }

  addOnClick() {
    this.editObj = null;
    this.showAmDialog = true;
  }

  //# TK-35860
  linkToSOAForm(){
    window.open(`${environment.sofcBaseHerf}/licenseMgmt/soa`,'_blank')
  }

  amDialogOnClose() {
    this.editObj = null;
    this.showAmDialog = false;
  }


  amDialogOnSave(e){
    console.log(e);
    this.searchBtnClick(true);
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
    }else{
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
    const model = {
      tempUserPermission: this.dataPermission.tempUserPermission,
      userGroups: this.dataPermission.userGroups,
      ...this.queryReq,
      startDate: this.queryReq.startDate
        ? new Date(this.queryReq.startDate).getTime()
        : null,
      endDate: this.queryReq.endDate
        ? new Date(this.queryReq.endDate).getTime()
        : null,
    };

    this.loaderService.show();
    this.licenseControlApiService.downloadLazySOALicenseMasterByConditions(model).subscribe({
      next: () => {
        this.loaderService.hide();
        this.noticeContentList=[this.translateService.instant('SoaLicenseMtn.Message.DownloadProcess')]
        this.noticeCheckDialogParams = {
          title: this.translateService.instant(
            'LicenseMgmt.Common.Title.Notification'
          ),
          visiable: true,
          mode: 'success',
        };
      },
      error: (e) => {
        console.error(e);
        this.loaderService.hide();
        this.toastService.error('System.Message.Error');
      }
    });
  }

  composeQueryReq() {
    this.queryReq = new LicenseMtnQueryRequest();
    this.queryReq.flag = 'Y';
    this.queryReq.licenseType = LicenseTypeEnum.SOA;

    this.queryReq.permissions = this.permissions;
    this.queryReq.customerVendorType = 'Customer';
    this.queryReq.itemFilterType = 'Include';
    this.curCVLable = '';
    this.curOOULable = '';
    this.curOULable = '';
    this.queryReq.specialApproval = '';
  }

  resetLazySort() {
    if (this.lazyTable){
      this.lazyTable.sortOrder = undefined;
      this.lazyTable.sortField = undefined;
      this.lazyTable.first = 0;
      this.lazyTable.rows = 10;
      this.lazyTable.reset();
    }
  }

  async onLazyLoad(event: LazyLoadEvent) {
    await this.tableStatusKeepService.delay(1);

    event.first = this.tableStatusKeepService.get(this.tableStatusKeepService.tableStatusKeepEnum.PageEvent)?.first;
    event.rows = this.tableStatusKeepService.get(this.tableStatusKeepService.tableStatusKeepEnum.PageEvent)?.rows;
    this.queryReq.lazyLoadEvent = event;
    if (event && event.sortField && this.lazyTable && this.data && (event.sortField !== this.sortField || event.sortOrder !== this.sortOrder)) {
      this.data = this.sortArrayData(this.data, event.sortField, event.sortOrder);
      this.lazyTable.first = this.first;
      return;
    }
    setTimeout(() => {
      if (this.dataPermission.userGroups.groupList.length === 0) {
        this.disabledPage = true;
        return this.showMsgDialog(this.translateService.instant('SoaLicenseMtn.Msg.ApplyForErpPermission'), 'error');
      }else{
        this.disabledPage = false;
      }

      this.loaderService.show();
      const queryParams = {
        tempUserPermission: this.dataPermission.tempUserPermission,
        userGroups: this.dataPermission.userGroups,
        ...this.queryReq,
        startDate: this.queryReq.startDate
          ? new Date(this.queryReq.startDate).getTime()
          : null,
        endDate: this.queryReq.endDate
          ? new Date(this.queryReq.endDate).getTime()
          : null,
        customerVendorType:
          ( this.queryReq.licenseNo ||
            this.queryReq.item ||
            this.queryReq.trxReferenceNo ) &&
            !this.queryReq.customerVendorCode
            ? ''
            : this.queryReq.customerVendorType,
      };
      this.licenseControlApiService.getSOALazyLicenseMasterByConditions(queryParams).subscribe({
        next: (rsp) => {
          this.data = this.addID(rsp.resultList);
          this.cloneData = rsp.resultList;
          this.filterLazy(this.globalFilter);
          this.totalRecords = rsp.totalRecords;
          this.displayResult = true;
          this.loaderService.hide();
          this.data = this.sortArrayData(this.data, event.sortField, event.sortOrder);
          this.data = this.processAllData(this.data);
        },
        error: (e) => {
          console.error(e);
          this.loaderService.hide();
          this.toastService.error('System.Message.Error');
        }
      });
    });
  }

  processAllData(data){
    data.forEach((element, index) => {
        if (element.oouCode === '0'){
          element.ouName ='ALL'
        }
      });
    return data;
  }

  addID(data) {
    data.forEach((element, index) => { element.id = index; });
    return data;
  }

  onDeleteSelectedData() {
    console.log(this.selectedData);
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
        return arrayData.sort((a, b) => ((a[field] != null ? a[field] : '') < (b[field] != null ? b[field] : '') ? -1 : 1));
      } else {
        return arrayData.sort((a, b) => ((a[field] != null ? a[field] : '') > (b[field] != null ? b[field] : '') ? -1 : 1));
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
          if ((value.toString().toLowerCase()).indexOf(globalFilter.toLowerCase()) !== -1) {
            this.data.push(this.cloneData[i]);
            break;
          }
        } catch (e) { console.log(e) };
      }
    }
    return;
  }

  delSeqExp;
  displayDelDialogExp = false;
  clickDelete(impData) {
    this.delSeqExp = impData.seq;
    this.displayDelDialogExp = true;
  }

  deleteExp() {
    if (this.delSeqExp) {
      this.loaderService.show();
      this.licenseControlApiService.licenseMasterDelete(this.delSeqExp).subscribe({
        next: rsp => {
          this.data = this.data.filter(item=>{return item.seq !== this.delSeqExp});
          this.toastService.success('ImpExpLicenseMtn.Message.DelSuccess');
        },
        error: rsp => {
          this.toastService.error('System.Message.Error');
        }
      })
        .add(() => { this.loaderService.hide() });
      this.loaderService.hide()
    }
    this.displayDelDialogExp = false;
  }

  getCountryCode() {
    let tenant = this.userContextService.user$.getValue().tenant;
    this.licenseControlApiService.licenseRule(tenant).subscribe({
      next: rsp => {
        let licenseRules = rsp.licenseRules;
        let licenseRule = licenseRules.filter(x => x.ruleId === 'LICENSE-COUNTRY')[0];
        if (licenseRule !== undefined) {
          let ruleVal = licenseRule.ruleVal;
          let ruleVals = ruleVal.split(',');
          ruleVals.forEach(obj => {
            this.countryCodeOptions.push({
              "label": obj,
              "value": obj
            });
          });
        }
      },
      error: rsp => {
        console.log(rsp);
        this.toastService.error('System.Message.Error');
      }
    });
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
      searchType = SelectorItemType.ALLOOU_ALL;
    } else if (this.curSelectType == SelectorItemType.OU) {
      title = `${titlePrefix} ${this.translateService.instant(
        'SoaLicenseMtn.Label.OuCode'
      )}`;
      searchType = SelectorItemType.ALLOU_ALL;
    } else {
      if (this.queryReq.customerVendorType === 'Customer') {
        title = `${titlePrefix} Custormer`;
        searchType = SelectorItemType.ALLCUSTOMER;
      }
      if (this.queryReq.customerVendorType === 'Vendor') {
        title = `${titlePrefix} Vendor`;
        searchType = SelectorItemType.ALLVENDOR;
      };
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
    console.log(result);
    if (this.curSelectType == SelectorItemType.OOU) {
      this.queryReq.oouCode = result.value.ouCode;
      this.curOOULable = result.value.displayOu;
    } else if (this.curSelectType == SelectorItemType.OU) {
      this.queryReq.ouCode = result.value.ouCode;
      this.curOULable = result.value.displayOu;
    } else {
      this.queryReq.customerVendorCode = result.value.customerNo ? result.value.customerNo : result.value.vendorCode;
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
    if (field === 'ouCode' || field === 'oouCode' || field === 'productCode' || field === 'ouGroup') {
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
    } else if(field === 'isOriginal'){
      if(data[field] === '正本' || data[field] === 'Y'){
        return this.translateService.instant('SoaLicenseMtn.Label.Original');
      }else if(data[field] === '副本' || data[field] === 'N'){
        return this.translateService.instant('SoaLicenseMtn.Label.NonOriginal');
      }
    } else if(field === 'vcName'){
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
    [
      this.onLangChange$,
    ].forEach((subscription: Subscription) => {
      if (subscription != null)
        subscription.unsubscribe();
    });
  }

  private showMsgDialog(label: string, mode: string) {
    this.noticeContentList = new Array<string>();
    this.noticeContentList.push(this.translateService.instant(label));
    this.noticeCheckDialogParams = {
      title: this.translateService.instant('LicenseMgmt.Common.Title.Notification'),
      visiable: true,
      mode: mode
    };
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
