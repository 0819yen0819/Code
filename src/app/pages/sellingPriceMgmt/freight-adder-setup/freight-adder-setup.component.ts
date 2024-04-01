import { Component, OnInit, isDevMode } from '@angular/core';
import { FreightAdderApiService } from './freight-adder-api.service';
import { Subscription, lastValueFrom } from 'rxjs';
import { TranslateService } from '@ngx-translate/core';
import { UserContextService } from 'src/app/core/services/user-context.service';
import { Router } from '@angular/router';
import { LazyLoadEvent } from 'primeng/api';
import { ObjectFormatService } from 'src/app/core/services/object-format.service';
import { environment } from 'src/environments/environment';
import { LanguageService } from 'src/app/core/services/language.service';
import { DEFAULT_LAZY_EVENT, DefaultFreightQuery } from './freight-query-condition/freight-query-const';
import { LoaderService } from 'src/app/core/services/loader.service';
import { DialogSettingParams } from 'src/app/core/model/selector-dialog-params';
import { TableStatusKeepService } from 'src/app/core/services/table-status-keep.service';

@Component({
  selector: 'app-freight-adder-setup',
  templateUrl: './freight-adder-setup.component.html',
  styleUrls: ['./freight-adder-setup.component.scss']
})
export class FreightAdderSetupComponent implements OnInit {
  onLangChange$: Subscription;
  permissions: string[] = [];

  queryFreightAdderDataRef = []; // query 回傳資訊
  queryFreightAdderData = []; // 顯示在 Table 上的資訊 (ex.filter過) 

  tableCols = this.translateService.instant('FreightAdder.Columns');
  colFuncs = this.translateService.instant('FreightAdder.ColumnFunctions');
  selectedCols: any[] = [];

  //分頁
  sortField: string;
  sortOrder: number;
  first: number = 0;
  globalFilter: string = '';
  totalRecords: number;
  // -----------

  showAddDialog = false;
  showEditDialog = false;
  showFilter = false;

  queryReq: any = {}; // 查詢參數

  // 編輯資訊
  editObj;

  // 刪除資訊
  delSeq;
  displayDelDialog = false;

  constructor(
    private freightAdderApiService: FreightAdderApiService,
    private translateService: TranslateService,
    private router: Router,
    private userContextService: UserContextService,
    private objectFormatService: ObjectFormatService,
    private languageService: LanguageService,
    private loaderService: LoaderService,
    public tableStatusKeepService: TableStatusKeepService
  ) {
    if (this.userContextService.user$.getValue) {
      this.permissions = this.userContextService.getMenuUrlPermission(
        this.router.url
      );

      this.permissions = ['add', 'view', 'del', 'edit'];
      isDevMode() && console.log('permissions: ', this.permissions);
    }
  }

  ngOnInit(): void {
    this.subscribeLangChange();
    this.setDefaultSetting();
    this.changeFilter();
  }

  ngOnDestroy(): void {
    this.tableStatusKeepService.resetPageEvent();
    if (this.onLangChange$) { this.onLangChange$.unsubscribe() }
  }

  subscribeLangChange() {
    this.onLangChange$ = this.translateService.onLangChange.subscribe(() => {
      this.setDefaultSetting();
      this.changeFilter();
    });
  }

  // 取得查詢條件回傳參數 (按下查詢按鈕)
  queryFreightAdderByCondition(e, action = '') {
    if (action === 'search') { this.tableStatusKeepService.resetPageEvent() }; // 查詢才重置,新增不重置
    this.queryReq = JSON.parse(JSON.stringify(e)); // 記住本次查詢資訊
    const request = this.getQueryFreightAdderRequest(e);
    this.queryFreightAdder(request);
  }

  // 點擊頁碼 (lazy)
  async lazyTableGetData(event: LazyLoadEvent) {
    await this.tableStatusKeepService.delay(1);

    event.first = this.tableStatusKeepService.get(this.tableStatusKeepService.tableStatusKeepEnum.PageEvent)?.first;
    event.rows = this.tableStatusKeepService.get(this.tableStatusKeepService.tableStatusKeepEnum.PageEvent)?.rows;
    this.queryReq.lazyLoadEvent = event; // 根據當前分頁資訊查詢
    const request = this.getQueryFreightAdderRequest(this.queryReq, 'S');
    this.queryFreightAdder(request);
  }

  // 點擊重置按鈕
  reset() {
    this.queryFreightAdderData = [];
    this.queryFreightAdderDataRef = [];
    this.first = 0;
    this.totalRecords = 0;
  }

  // 取得查詢條件回傳參數 (按下查詢按鈕)
  download(e) {
    const request = this.getQueryFreightAdderRequest(e, 'E');
    this.downloadFreightAdder(request);
  }

  // 取得 Dialog save回傳參數
  saveFreightAdder(e) {
    const request = this.getSaveFreightAdderRequest(e);
    this.loaderService.show();
    lastValueFrom(this.freightAdderApiService.saveFreightAdder(request))
      .then((res: any) => {
        this.queryFreightAdderByCondition(this.queryReq); // 重新查詢
        this.showMsgDialog('FreightAdder.Msg.CreateSuccess', 'success');
      })
      .catch((err => { this.showMsgDialog(err.error.message, 'error'); }))
      .finally(() => { this.loaderService.hide() })
  }

  // 取得 Dialog edit回傳參數
  updateFreightAdder(e) {
    const request = this.getUpdateFreightAdderRequest(e);
    this.loaderService.show();
    lastValueFrom(this.freightAdderApiService.updateFreightAdder(request))
      .then((res: any) => {
        this.queryFreightAdderData.forEach(element => { if (element.seq === request.seq) { element.flag = request.flag } }); // update table
        this.showMsgDialog('FreightAdder.Msg.EditSuccess', 'success');
      })
      .catch((err => { this.showMsgDialog(err.error.message, 'error'); }))
      .finally(() => { this.loaderService.hide() })
  }

  processTableData(field: string, data: any) {
    if (field === 'ouCode' || field === 'oouCode' || field === 'productCode' || field === 'ouGroup') {
      if (data[field] === '0') { return 'ALL'; }
    } else if (field === 'startDate' || field === 'endDate' || field === 'creationDate' || field === 'lastUpdatedDate') {
      return this.objectFormatService.DateFormat(data[field], '/')
    }
    return data[field];
  }

  delete() {
    if (this.delSeq) {
      this.loaderService.show();
      const request = { seq: this.delSeq, tenant: this.userContextService.user$.getValue().tenant }
      lastValueFrom(this.freightAdderApiService.deleteFreightAdder(request))
        .then((res: any) => {
          this.queryFreightAdderData = this.queryFreightAdderData.filter(item => { return item.seq !== this.delSeq });
          this.showMsgDialog('FreightAdder.Msg.DelSuccess', 'success');
        })
        .catch(err => { this.showMsgDialog(err.error.message, 'error'); })
        .finally(() => { this.loaderService.hide(); this.displayDelDialog = false; })
    }
  }

  changeFilter() {
    this.selectedCols = this.tableCols.filter(x => { return x.isDefault; });
    this.colFuncs?.forEach(x => { this.selectedCols.unshift(x); });
  }

  filterLazy(globalFilter: string) {
    this.queryFreightAdderData = [];
    for (let i = 0; i < this.queryFreightAdderDataRef.length; i++) {
      for (let j = 0; j < this.selectedCols.length; j++) {
        try {
          if (this.queryFreightAdderDataRef[i][this.selectedCols[j].field] === undefined)
            continue;
          let value = this.queryFreightAdderDataRef[i][this.selectedCols[j].field] ?? '';
          if ((value.toString().toLowerCase())?.indexOf(globalFilter.toLowerCase()) !== -1) {
            this.queryFreightAdderData.push(this.queryFreightAdderDataRef[i]);
            break;
          }
        } catch (e) { console.log(e) };
      }
    }
    return;
  }

  onPage(event) {
    this.tableStatusKeepService.keep(this.tableStatusKeepService.tableStatusKeepEnum.PageEvent, event);
    this.first = event.first;
  }

  private sortArrayData(arrayData: any[], field: string, sort: number) {
    if (arrayData && field && sort) {
      if (sort && sort == 1) { return arrayData.sort((a, b) => ((a[field] != null ? a[field] : '') < (b[field] != null ? b[field] : '') ? -1 : 1)); }
      else { return arrayData.sort((a, b) => ((a[field] != null ? a[field] : '') > (b[field] != null ? b[field] : '') ? -1 : 1)); }
    }
    return arrayData;
  }

  private setDefaultSetting() {
    this.tableCols = this.translateService.instant('FreightAdder.Columns');
    this.colFuncs = this.translateService.instant('FreightAdder.ColumnFunctions');

    if (!this.permissions.includes('edit')) { this.colFuncs = this.colFuncs.filter(item => item.field !== 'edit') };
    if (!this.permissions.includes('del')) { this.colFuncs = this.colFuncs.filter(item => item.field !== 'del') };
  }

  private queryFreightAdder(request) {
    this.loaderService.show();
    lastValueFrom(this.freightAdderApiService.queryFreightAdder(request))
      .then((res: any) => {
        this.totalRecords = res.body.totalRecords;
        this.queryFreightAdderDataRef = res.body.datas;
        this.queryFreightAdderData = res.body.datas;
        this.filterLazy(this.globalFilter);
        this.queryFreightAdderData = this.sortArrayData(
          this.queryFreightAdderData,
          this.queryReq.lazyLoadEvent.sortField,
          this.queryReq.lazyLoadEvent.sortOrder
        );
      })
      .finally(() => { this.loaderService.hide(); })
  }

  private downloadFreightAdder(request) {
    this.loaderService.show();
    lastValueFrom(this.freightAdderApiService.queryFreightAdder(request))
      .then((res: any) => { this.showMsgDialog('SalesMarginToleranceSetup.Msg.DownloadProcess', 'success'); })
      .finally(() => { this.loaderService.hide(); })
  }

  private getSaveFreightAdderRequest(e) {
    return {
      "tenant": this.userContextService.user$.getValue().tenant,
      "groupCode": e.ouGroup === 'ALL' ? 0 : e.ouGroup,
      "groupName": e.groupName,
      "ouCode": e.ou?.ouCode,
      "ouName": e.ou?.ouName,
      "custCode": e.customer?.value,
      "custName": e.customer?.label,
      "endCustomer": e.endCustomer,
      "vendorCode": e.vendor?.value,
      "vendorName": e.vendor?.label,
      "brand": e.brand?.label,
      "ctg1": e.ctg1,
      "ncnr": e.ncnr,
      "customize": e.customize,
      "single": e.single,
      "eol": e.eol,
      "productCode": e.productCode?.value,
      "freightAdder": +e.freightAdder,
      "adder": +e.freightAdder - 1,
      "createdBy": this.userContextService.user$.getValue().userEmail,
      "startDate": new Date(e.startDate.getTime()).setHours(0, 0, 0, 0),
      "endDate": new Date(e.endDate.getTime()).setHours(23, 59, 59, 0),
      "flag": e.flag
    }
  }

  private getUpdateFreightAdderRequest(e) {
    return {
      "seq": e.seq,
      "tenant": this.userContextService.user$.getValue().tenant,
      "groupCode": e.groupCode,
      "ouCode": e.ouCode,
      "custCode": e.custCode,
      "custName": e.custName,
      "endCustomer": e.endCustomer,
      "vendorCode": e.vendorCode,
      "vendorName": e.vendorName,
      "brand": e.brand,
      "ctg1": e.ctg1,
      "ncnr": e.ncnr,
      "customize": e.customize,
      "single": e.single,
      "eol": e.eol,
      "productCode": e.productCode,
      "freightAdder": e.freightAdder,
      "adder": e.adder,
      "createdBy": this.userContextService.user$.getValue().userEmail,
      "startDate": e.startDate,
      "endDate": e.endDate,
      "flag": e.flag
    }
  }

  private getQueryFreightAdderRequest(e, action = 'S') {
    return {
      "tenant": this.userContextService.user$.getValue().tenant,
      "groupCode": e.ouGroup,
      "ouCode": e.ou?.ouCode,
      "custCode": e.customer?.value,
      "endCustomer": e.endCustomer?.endCustomerName,
      "vendorCode": e.vendor?.value,
      "brand": e.brand?.value,
      "ctg1": e.ctg1,
      "ncnr": e.ncnr,
      "customize": e.customize,
      "single": e.single,
      "eol": e.eol,
      "item": e.item,
      "items": e.items,
      "status": e.status === '' ? null : e.status,
      "action": action,
      "userEmail": this.userContextService.user$.getValue().userEmail,
      "sofcBaseHerf": environment.sofcBaseHerf,
      "userLang": this.languageService.getLang(),
      "timeZone": Intl.DateTimeFormat().resolvedOptions().timeZone,
      "lazyLoadEvent": e.lazyLoadEvent,
      "startDate": e.startDate?.getTime(),
      "endDate": e.endDate?.getTime(),
      "itemFilterType": e.itemFilterType
    }
  }

  noticeCheckDialogParams: DialogSettingParams;
  noticeContentList: string[] = [];
  private showMsgDialog(label: string, mode: string) {
    this.noticeContentList = new Array<string>();
    this.noticeContentList.push(this.translateService.instant(label));
    this.noticeCheckDialogParams = {
      title: this.translateService.instant('FreightAdder.Label.Notification'),
      visiable: true,
      mode: mode
    };
  }

}
