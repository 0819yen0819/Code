import { Component, isDevMode, OnDestroy, OnInit, ViewChild } from "@angular/core";
import { Router } from "@angular/router";
import { TranslateService } from "@ngx-translate/core";
import { LazyLoadEvent, SelectItem } from "primeng/api";
import { Table } from "primeng/table";
import { lastValueFrom, Subscription } from "rxjs";
import { ItemBrandCtg } from "src/app/core/model/item-brand-ctg";
import { DialogSettingParams } from "src/app/core/model/selector-dialog-params";
import { AuthApiService } from "src/app/core/services/auth-api.service";
import { CommonApiService } from "src/app/core/services/common-api.service";
import { LoaderService } from "src/app/core/services/loader.service";
import { SalesMarginToleranceApiService } from "src/app/core/services/sales-margin-tolerance-api.service";
import { UserContextService } from "src/app/core/services/user-context.service";
import { environment } from "src/environments/environment";
import { ObjectFormatService } from '../../../core/services/object-format.service';
import { SalesMarginToleranceSetupRequest } from "./bean/sales-margin-tolerance-setup-request";
import { SalesMarginToleranceSetupService } from "./sales-margin-tolerance-setup.service";
import { TableStatusKeepService } from "src/app/core/services/table-status-keep.service";

@Component({
  selector: 'app-sales-margin-tolerance-setup',
  templateUrl: './sales-margin-tolerance-setup.component.html',
  styleUrls: ['./sales-margin-tolerance-setup.component.scss']
})
export class SalesMarginToleranceSetupComponent implements OnInit, OnDestroy {
  @ViewChild('lazyTable') lazyTable: Table;
  permissions: string[] = [];
  queryReq: SalesMarginToleranceSetupRequest = new SalesMarginToleranceSetupRequest();
  formValue: any = { status: 'Y' }; // query form
  cloneFormValue: any = { status: 'Y' }; // for 按分頁時使用上一次查詢記錄 
  data: any[]; //query result
  cloneData: any[]; //排序
  editObj = null;// update

  tableCols = this.translateService.instant(
    'SalesMarginToleranceSetup.Columns'
  );
  colFuncs = this.translateService.instant('SalesMarginToleranceSetup.ColumnFunctions');
  selectedCols: any[] = [];
  nowDate: any = new Date();

  //分頁
  sortField: string;
  sortOrder: number;
  first: number = 0;
  globalFilter: string = '';
  totalRecords: number;
  // -----------

  showDialog = false;
  displayFilter = false;
  displayResult = false;
  isUploadDialogClose = true;

  // ------ options
  groupOptions: SelectItem[] = [];
  ouOptions: any[] = [];
  endCustomerOptions: any[] = [];
  customerOptions: any[] = [];
  brandOptions: any[] = [];
  ctg1Options: any[] = [];
  itemOptions: any[] = [];
  statusOptions: SelectItem[] = [];
  //  -----

  noticeCheckDialogParams: DialogSettingParams;
  noticeContentList: string[] = [];

  showSpinner = false;
  onLangChange$: Subscription;

  constructor(
    private router: Router,
    private translateService: TranslateService,
    private salesMarginToleranceSetupService: SalesMarginToleranceSetupService,
    private salesMarginToleranceApiService: SalesMarginToleranceApiService,
    private userContextService: UserContextService,
    private commonApiService: CommonApiService,
    private objectFormatService: ObjectFormatService,
    private authApiService: AuthApiService,
    private loaderService: LoaderService,
    public tableStatusKeepService : TableStatusKeepService
  ) {
    if (this.userContextService.user$.getValue) {
      this.permissions = this.userContextService.getMenuUrlPermission(
        this.router.url
      );
      isDevMode() && console.log('permissions: ', this.permissions);
    }
  }

  ngOnInit(): void {
    this.setDefaultSetting();
    this.subscribeLangChange();
    this.initOptions();
    this.changeFilter();
    // 會trigger LAZY-TABLE的onLazyLoad event
    if (this.permissions.includes('view')) {
      this.displayResult = true;
    }
  }

  subscribeLangChange() {
    this.onLangChange$ = this.translateService.onLangChange.subscribe(() => {
      this.setDefaultSetting();
      this.initOptions();
      this.changeFilter();
    });
  }

  setDefaultSetting() {
    this.tableCols = this.translateService.instant(
      'SalesMarginToleranceSetup.Columns'
    );
    this.colFuncs = this.translateService.instant('SalesMarginToleranceSetup.ColumnFunctions');
    if (!this.permissions.includes('edit')) { this.colFuncs = this.colFuncs.filter(item => item.field !== 'edit') };
    if (!this.permissions.includes('del')) { this.colFuncs = this.colFuncs.filter(item => item.field !== 'del') };

  }

  async initOptions() {
    await this.salesMarginToleranceSetupService.initGroupOptions().then(rsp => this.groupOptions = rsp);
    this.statusOptions = this.translateService.instant('Common.Options.flagOptionsWithDefault');
  }

  /**
   * OU Autocomplete fun
   *
   * @param event
   */
  filterOu(event) {
    let filtered: any[] = [];
    let query = event.query;
    this.authApiService.ouQueryByPrefixAndGroup(query, this.formValue.ouGroup).subscribe(x => {
      for (let ou of x.ouList) {
        filtered.push(ou);
      }
      this.ouOptions = filtered;
    })
  }

  onOuSelect(event): void {
    if (!this.formValue.ouGroup || this.formValue.ouGroup === 'ALL') {
      this.formValue.ouGroup = event.groupName;
    }
  }

  /**
   * endcustomer Autocomplete fun
   *
   * @param event
   */
  filterEndCustomer(event) {
    let filtered: any[] = [];
    let query = event.query;
    const request = {
      ouGroup: this.formValue.ouGroup,
      ouCode: this.formValue.ou?.ouCode,
      brand: this.formValue.brand?.value,
      keyword: query
    };

    this.commonApiService.queryEndCustomer(request).subscribe(x => {
      for (let endCustomer of x.endCustomerList) {
        filtered.push(endCustomer);
      }
      this.endCustomerOptions = filtered;
    })
  }

  /**
   * Customer Autocomplete fun
   * 
   * @param event 
   */
  filterCustomer(event) {
    let filtered: any[] = [];
    let query = event.query;
    this.commonApiService.getFuzzyActiveCustomerAllList(query).subscribe(x => {
      for (let customer of x.customerList) {
        filtered.push({
          displayCustomer: `${customer.customerNo} - ${customer.customerName} (${customer.customerNameEg})`,
          value: customer.customerNo,
        });
      }
      this.customerOptions = filtered;
    })
  }

  /**
   * brand Autocomplete fun
   * 
   * @param event 
   */
  filterBrand(event) {
    const filtered: any[] = [];
    this.formValue.ctg1 = null;
    this.commonApiService.brandQueryByPrefix(event.query).subscribe(x => {
      for (const brand of x.brandList) {
        filtered.push({
          label: brand.name,
          value: brand.code,
        });
      }
      this.brandOptions = filtered;
    })
  }

  onBrandSelect(brand: string): void {
    this.formValue.ctg1 = null;
    if (brand) {
      this.initCtg1Options({
        tenant: this.userContextService.user$.getValue().tenant,
        brand: brand,
      });
    }
  }

  initCtg1Options(target: ItemBrandCtg) {
    const filtered: any[] = [];
    this.commonApiService.getItemCtgByBrand(target).subscribe(rsp => {
      for (const brand of rsp.brandList) {
        if (brand.ctg1) {
          filtered.push({
            label: brand.ctg1,
            value: brand.ctg1,
          });
        }
      }
      this.ctg1Options = filtered;
    })
  }

  onCtg1Select(event): void {
    if (event) {
      this.formValue.productCode = null;
    }
  }

  /**
    * item Autocomplete fun
    * 
    * @param event 
    */
  filterItem(event) {
    if (event?.query) {
      const filtered: any[] = [];
      this.commonApiService.productQueryByPrefix("", event.query).subscribe((rsp) => {
        for (const item of rsp.productList) {
          filtered.push({
            label: item.code,
            value: item.code,
          });
        }
        this.itemOptions = filtered;
      });
    }
  }

  onItemSelect(event) {
    if (!event) {
      return;
    }
    const invItemNo = [];
    invItemNo.push(event.value);
    this.commonApiService.queryItemMasterByInvItemNos(invItemNo).subscribe(rsp => {
      const product = rsp.itemMasterList[0];
      if (product) {
        this.formValue.brand = {
          value: product.brand,
          label: product.brand
        };
        setTimeout(() => {
          if(product.ctg1){
            this.ctg1Options = [{
              value: product.ctg1,
              label: product.ctg1
            }];
          }
        }, 0);
        this.formValue.ctg1 = product.ctg1;
      }
    })

  }

  onItemChange() {
    this.formValue.productCode = null;
    if (this.formValue.brand) {
      this.initCtg1Options({
        tenant: this.userContextService.user$.getValue().tenant,
        brand: this.formValue.brand.value,
      });
    }
  }

  /**
   * 重設
   */
  resetOnClick() {
    // this.tableData.next([]);
    this.data = [];
    this.cloneData = [];
    this.displayResult = false;
    this.formValue = { status: 'Y' };
    this.first = 0;
    this.sortField = undefined;
    this.sortOrder = undefined;
  }
 
  showFilter() {
    this.displayFilter = true;
  }

  changeFilter() {
    this.selectedCols = this.tableCols.filter(x => { return x.isDefault; });
    this.colFuncs?.forEach(x => {
      this.selectedCols.unshift(x);
    });
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
    isDevMode() && console.log('onLazyLoad',JSON.parse(JSON.stringify(event)));
    setTimeout(() => {
      this.loaderService.show(); 
      this.queryReq = this.getQueryModel(this.cloneFormValue,event);
      // 當沒有給排序時，default查最新資料
      if (!this.queryReq.lazyLoadEvent.sortField) {
        this.queryReq.lazyLoadEvent.sortOrder = -1;
        this.queryReq.lazyLoadEvent.sortField = 'createdDate';
      }
      this.salesMarginToleranceApiService.querySalesMargin(this.queryReq).subscribe({
        next: (rsp) => {
          isDevMode() && console.log('resp',rsp)
          this.data = rsp.marginToleranceList;
          this.cloneData = rsp.marginToleranceList;
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
          this.showMsgDialog('System.Message.Error', 'error');
        },
      });
    });
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
    for (let i = 0; i < this.cloneData.length; i++) {
      for (let j = 0; j < this.selectedCols.length; j++) {
        try {
          if (this.cloneData[i][this.selectedCols[j].field] === undefined)
            continue;
          let value = this.cloneData[i][this.selectedCols[j].field];
          if ((value.toString().toLowerCase()).indexOf(globalFilter.toLowerCase()) !== -1) {
            this.data.push(this.cloneData[i]);
            break;
          }
        } catch (e) { console.log(e) };
      }
    }
    return;
  }

  searchBtnClick(fromDialog:boolean): void {
    if (!fromDialog){this.tableStatusKeepService.resetPageEvent();}
    // for 查詢前判斷被卡住，先做賦值
    this.sortField = this.queryReq.lazyLoadEvent.sortField;
    this.sortOrder = this.queryReq.lazyLoadEvent.sortOrder;
    // 執行查詢永遠查第一頁
    // this.queryReq.lazyLoadEvent.first = 0;
    // if (this.lazyTable) {
    //   this.lazyTable.first = 0;
    // }
    // 為避免displayResult變更後重複查詢
    if (this.displayResult) {
      // dialog關閉時查詢要依照上次的分頁設定，但點按查詢按鈕回歸初始化分頁設定
      this.onLazyLoad(this.queryReq.lazyLoadEvent);
    } else {
      this.displayResult = true;
    }

    this.cloneFormValue = JSON.parse(JSON.stringify(this.formValue));
  }

  resetLazySort() {
    if (this.lazyTable) {
      this.lazyTable.sortOrder = undefined;
      this.lazyTable.sortField = undefined;
      this.lazyTable.first = 0;
      this.lazyTable.rows = 10;
      this.lazyTable.reset();
    }
  }

  processTableData(field: string, data: any) {
    if (field === 'ouCode' || field === 'productCode' || field === 'custCode') {
      if (data[field] === '0') {
        return 'ALL';
      }
    } else if (field === 'fromDate' || field === 'toDate') {
      return this.objectFormatService.DateFormat(data[field], '/')
    } else if (field === 'createdDate' || field === 'lastUpdatedDate') {
      return this.objectFormatService.DateTimeFormat(data[field], '/')
    }
    return data[field];
  }



  downloadBtnClick(): void {
    this.loaderService.show();
    this.salesMarginToleranceApiService.downloadLazySalesMarginByConditions(this.getQueryModel(this.formValue)).subscribe({
      next: () => {
        this.loaderService.hide();
        this.showMsgDialog('SalesMarginToleranceSetup.Msg.DownloadProcess', 'success');
      },
      error: (e) => {
        console.error(e);
        this.loaderService.hide();
        this.showMsgDialog('System.Message.Error', 'error');
      }
    });
  }

  delSeq;
  displayDelDialog = false;
  clickDelete(impData) {
    this.delSeq = impData.seq;
    this.displayDelDialog = true;
  }

  /**
   * 刪除
   */
  delete() {
    if (this.delSeq) {
      this.loaderService.show();
      this.salesMarginToleranceApiService.delSalesMargin(this.delSeq).subscribe({
        next: rsp => {
          this.data = this.data.filter(item => { return item.seq !== this.delSeq });
          this.showMsgDialog('SalesMarginToleranceSetup.Msg.DelSuccess', 'success');
        },
        error: rsp => {
          this.showMsgDialog('System.Message.Error', 'error');
        }
      })
        .add(() => { this.loaderService.hide() });
    }
    this.displayDelDialog = false;
  }


  dialogOpen(e?) {
    if (e) {
      this.editObj = e;
    }
    this.showDialog = true;
  }

  dialogClose() {
    this.showDialog = false;
    this.editObj = null;
  }

  uploadDialogClose() {
    this.showDialog = false;
    this.isUploadDialogClose = true;
  }

  /**
 * 編輯 / 新增 資料回傳
 */
  getDialogInfo(event) {
    this.searchBtnClick(true);
  }

  /**
   * 查詢 / 下載 前檢查
   * @returns
   */
  private queryCheck() {
  }

  /**
   * 取得Query 要帶入 的Model
   * @param mode
   * @returns
   */
  private getQueryModel(qryObj:any,event?: LazyLoadEvent): SalesMarginToleranceSetupRequest {
    return {
      tenant: this.userContextService.user$.getValue().tenant,
      ouGroup: qryObj.ouGroup,
      ouCode: qryObj.ou?.ouCode,
      custCode: qryObj.customer?.value,
      endCustomer: qryObj.endCustomer?.endCustomerName,
      brand: qryObj.brand?.value,
      ctg1: qryObj.ctg1,
      productCode: qryObj.productCode?.value == 'ALL' ? 0 : qryObj.productCode?.value,
      status: qryObj.status,
      userEmail: this.userContextService.user$.getValue().userEmail,
      lazyLoadEvent: event,
      sofcBaseHerf: environment.sofcBaseHerf
    }
  }

  onHideDetailDialog() {
    this.editObj = null;
  }

  onSort(event) {
    this.sortField = event.field;
    this.sortOrder = event.order;
  }

  onPage(event) {
    this.tableStatusKeepService.keep(this.tableStatusKeepService.tableStatusKeepEnum.PageEvent,event); 
    this.first = event.first;
  }

  private showMsgDialog(label: string, mode: string) {
    this.noticeContentList = new Array<string>();
    this.noticeContentList.push(this.translateService.instant(label));
    this.noticeCheckDialogParams = {
      title: this.translateService.instant('SalesMarginToleranceSetup.Label.Notification'),
      visiable: true,
      mode: mode
    };
  }

  get dialogHeader() {
    return this.translateService.instant(this.isAddMode ? 'Button.Label.Add' : 'Button.Label.Modify') + ' ' + this.translateService.instant('SalesMarginToleranceSetup.PageTitle');
  }

  get isAddMode() {
    return !!!this.editObj;
  }

  get isEditMode() {
    return !!this.editObj
  }

  ngOnDestroy(): void {
    this.tableStatusKeepService.resetPageEvent();
    if (this.onLangChange$) {
      this.onLangChange$.unsubscribe()
    }
  }


}