import { DateInputHandlerService } from './../../../core/services/date-input-handler.service';
import { DatePipe } from '@angular/common';
import { Component, isDevMode, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { SelectItem } from 'primeng/api';
import { BehaviorSubject } from 'rxjs';
import { DialogSettingParams } from 'src/app/core/model/selector-dialog-params';
import { BafaLicenseMtnService } from 'src/app/core/services/bafa-license-mtn.service';
import { CommonApiService } from 'src/app/core/services/common-api.service';
import { LanguageService } from 'src/app/core/services/language.service';
import { UserContextService } from 'src/app/core/services/user-context.service';
import { bafaTableSetting } from './bafa-license-mtn.const';
import { TableStatusKeepService } from 'src/app/core/services/table-status-keep.service';

@Component({
  selector: 'app-bafa-license-mtn',
  templateUrl: './bafa-license-mtn.component.html',
  styleUrls: ['./bafa-license-mtn.component.scss'],
})
export class BafaLicenseMtnComponent implements OnInit {
  // 表頭
  formData: FormGroup;
  flagOptions: SelectItem[];
  itemOptions: SelectItem[];
  // Table
  itemQueue: BehaviorSubject<any> = new BehaviorSubject<any>([]);
  tableCols: any[];
  dataTableSettings = bafaTableSetting;
  // dialog control
  showAddDialog = false;
  editObj: any = undefined;
  detailObj: any = undefined;
  showSpinner = false;
  noticeCheckDialogParams: DialogSettingParams;
  noticeContentList: string[] = [];
  showDetailDialog = false;
  permissions: any[] = [];
  selectedData: any[] = [];
  showBatchEdit = false;
  cleanTable = false;
  showSearchBtn = false;

  constructor(
    private formBuilder: FormBuilder,
    private translateService: TranslateService,
    private bafaLicenseMtnService: BafaLicenseMtnService,
    private userContextService: UserContextService,
    private languageService: LanguageService,
    private datePipe: DatePipe,
    private commonApiService: CommonApiService,
    private router: Router,
    private dateInputHandlerService: DateInputHandlerService,
    public tableStatusKeepService : TableStatusKeepService
  ) {
    this.permissions = this.userContextService.getMenuUrlPermission(
      this.router.url
    );
    this.showSearchBtn =
      this.permissions
        ?.map((permission) => permission.includes('view'))
        ?.filter((item) => item === true).length > 0;

    isDevMode() && console.log(this.permissions);
    this.dataTableSettings.isAddMode = this.permissions.includes('add');
    this.dataTableSettings.isEditedMode = this.permissions.includes('edit');
    this.dataTableSettings.noDataConText = this.translateService.instant(
      'EccnMtn.Label.PleaseSearchOrAdd'
    );
  }

  get isAddMode() {
    return !!!this.editObj;
  }
  get isEditMode() {
    return !!this.editObj;
  }

  ngOnInit(): void {
    this.subscribeLangChange();
    this.initForm();
    this.initOptions();
  }

  subscribeLangChange() {
    this.translateService.onLangChange.subscribe(() => {
      this.initOptions();
      this.dataTableSettings.noDataConText = this.translateService.instant(
        'EccnMtn.Label.PleaseSearchOrAdd'
      );
    });
  } // 訂閱語言變換

  closeBafaDialog() {
    this.showAddDialog = false;
  } // 關閉bafa視窗

  openBafaDialog(e) {
    this.editObj = e;
    this.showAddDialog = true;
  } // 開啟bafa視窗

  resetOnClick() {
    this.dataTableSettings.isPaginationMode = false;
    this.initForm();
  }

  searchOnClick() {
    this.tableStatusKeepService.resetPageEvent();
    const searchRequestBody = this.getSearchAndDownloadRequestParams();

    this.openSpinner();
    this.bafaLicenseMtnService
      .queryBafaByConditions(searchRequestBody)
      .subscribe({
        next: (rsp) => {
          rsp.resultList.forEach((element) => {
            element.createdDate = this.datePipe.transform(
              element.createdDate,
              'yyyy/MM/dd'
            );
            element.lastUpdatedDate = this.datePipe.transform(
              element.lastUpdatedDate,
              'yyyy/MM/dd'
            );
          });
          this.itemQueue.next(rsp.resultList);
          if (rsp.resultList.length > 0) {
            this.dataTableSettings.isPaginationMode = true;
          }
          this.closeSpinner();
        },
        error: (err) => {
          this.handleRequestError(err);
          this.closeSpinner();
        },
      });
  }

  downloadOnClick() {
    const downloadRequestBody = this.getSearchAndDownloadRequestParams();

    this.openSpinner();
    this.bafaLicenseMtnService
      .downloadBafaByConditions(downloadRequestBody)
      .subscribe({
        next: (rsp) => {
          this.commonApiService.downloadFile(rsp.fileId);
          this.closeSpinner();
        },
        error: (err) => {
          this.handleRequestError(err);
          this.closeSpinner();
        },
      });
  }

  /**
   * 新增 / 編輯 資料回傳
   * @param e
   */
  getAddData(e) {
    if (this.isAddMode) {
      const addRequestBody = this.getAddRequestParams(e);
      this.openSpinner();
      this.bafaLicenseMtnService.addBafaLicense(addRequestBody).subscribe({
        next: (rsp) => {
          this.handleAddSuccess(addRequestBody);
          this.closeSpinner();
        },
        error: (err) => {
          this.handleRequestError(err);
          this.closeSpinner();
        },
      });
    } else if (this.isEditMode) {
      const editRequestBody = this.getEditRequestParams(e);
      this.openSpinner();
      this.bafaLicenseMtnService.updateBafaLicense(editRequestBody).subscribe({
        next: (rsp) => {
          this.handleModifySuccess(e);
          this.closeSpinner();
        },
        error: (err) => {
          this.handleRequestError(err);
          this.closeSpinner();
        },
      });
    }
  }

  detailOnClick(e) {
    const detailRequestParams = this.getDetailRequestParams(e);
    this.openSpinner();
    this.bafaLicenseMtnService
      .queryBafaLicenseDetail(detailRequestParams)
      .subscribe({
        next: (rsp) => {
          this.detailObj = {
            bafaLicense: e.bafaLicense,
            productCode: e.productCode,
            balanceQuantity: e.balanceQty, // TODO: 沒接到balanceQuantity
            data: rsp.resultList,
          };
          this.closeSpinner();
          this.showDetailDialog = true;
        },
        error: (err) => {
          this.handleRequestError(err);
          this.closeSpinner();
        },
      });
  }

  tableOnSelectedData(e) {
    this.selectedData = e;
    this.showBatchEdit = e.length > 0;
  }

  getBatchEdit(e) {
    if (!this.batchCheckPass(e)) {
      return this.showNoticeDialog('error');
    }

    const batchEdit = this.getBatchEditRequestParams(this.selectedData, e);
    e.license = batchEdit.bafaList;

    this.openSpinner();
    this.bafaLicenseMtnService.updateBafaLicense(batchEdit).subscribe({
      next: (rsp) => {
        this.handleBatchSuccess(e);
        this.closeSpinner();
      },
      error: (err) => {
        this.handleRequestError(err);
        this.closeSpinner();
      },
    });
  }

  searchTypeOnChange(e) {
    const itemType = typeof this.formData.get('itemValue').value;

    if (e.value === 'Multi' && itemType === 'string') {
      this.formData.get('itemValue').setValue(null);
    } else if (!(e.value === 'Multi') && itemType === 'object') {
      this.formData.get('itemValue').setValue(null);
    }
  }

  batchOnClose() {
    this.showBatchEdit = false;
    this.cleanTableSelected();
  }

  private batchCheckPass(e) {
    this.noticeContentList = [];

    const flagIsEmpty = !e.flag;
    const endDateIsEmpty = !e.endDate;

    if (!endDateIsEmpty) {
      // 有選 但是日期有誤
      let endDateEarlyThanApplyDate = false;
      this.selectedData.forEach((item) => {
        if (new Date(item.approveDate).valueOf() > e.endDate.valueOf()) {
          endDateEarlyThanApplyDate = true;
        }
      });
      if (endDateEarlyThanApplyDate) {
        this.noticeContentList.push(
          this.translateService.instant('BafaLicenseMtn.Msg.InvalidEndDate')
        );
      }
    }

    if (flagIsEmpty && endDateIsEmpty) {
      this.noticeContentList.push(
        this.translateService.instant(
          'BafaLicenseMtn.Msg.PleaseChooseBatchField'
        )
      );
    } // 都沒選

    return this.noticeContentList.length === 0;
  }

  private getSearchAndDownloadRequestParams() {
    return {
      tenant: this.userContextService.user$.getValue().tenant,
      userTimeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      userLang: this.languageService.getLang(),
      license: this.formData.get('licenseNo').value,
      active: this.formData.get('flag').value,
      startDate: this.formData.get('startDate').value,
      endDate: this.formData.get('endDate').value,
      searchType: this.formData.get('itemSearchType').value,
      keywords:
        typeof this.formData.get('itemValue').value === 'string'
          ? [this.formData.get('itemValue').value]
          : this.formData.get('itemValue').value,
      impExpLicenseNo: this.formData.get('impExpLicenseNo').value,
      userEmail: this.userContextService.user$.getValue().userEmail,
      userCode: this.userContextService.user$.getValue().userCode,
      permissions: this.permissions,
    };
  }

  private getAddRequestParams(e) {
    return {
      tenant: this.userContextService.user$.getValue().tenant,
      bafaLicense: e.license,
      productCode: e.item,
      quantity: e.qty,
      approveDate: e.startDate,
      endDate: e.endDate,
      active: e.flag,
      remark: e.remark,
      createdBy: this.userContextService.user$.getValue().userEmail,
      userLang: this.languageService.getLang(),
    };
  }

  private getEditRequestParams(e) {
    return {
      tenant: this.userContextService.user$.getValue().tenant,
      active: e.flag,
      endDate: e.endDate,
      quantity: e.qty,
      updatedBy: this.userContextService.user$.getValue().userEmail,
      bafaList: [e.license],
    };
  }

  private getDetailRequestParams(tableData: any) {
    return {
      tenant: this.userContextService.user$.getValue().tenant,
      bafaLicense: tableData.bafaLicense,
      productCode: tableData.productCode,
    };
  }

  private getBatchEditRequestParams(selectData, e) {
    const bafaList = selectData.map((item) => item.bafaLicense);
    return {
      tenant: this.userContextService.user$.getValue().tenant,
      active: e.flag,
      endDate: e.endDate,
      updatedBy: this.userContextService.user$.getValue().userEmail,
      bafaList: bafaList,
    };
  }

  /**
   * 初始化表頭Form參數
   */
  private initForm() {
    this.itemQueue = new BehaviorSubject<any>([]);

    this.formData = this.formBuilder.group({
      licenseNo: [''],
      impExpLicenseNo: [''],
      flag: [''],
      itemSearchType: ['Equals'],
      itemValue: [''], // SPL EU98-40-20-20D
      startDate: [''],
      endDate: [''],
    });
  }

  /**
   * 初始化表頭下拉選單選項
   */
  private initOptions() {
    this.flagOptions = this.translateService.instant(
      'BafaLicenseMtn.Options.flagOptions'
    );
    this.itemOptions = this.translateService.instant(
      'BafaLicenseMtn.Options.itemFilterTypeOptions'
    );
    this.tableCols = this.translateService.instant(
      'BafaLicenseMtn.Table.mainTable'
    );
  }

  private handleRequestError(res) {
    const defaultErrorMsg = this.translateService.instant(
      'System.Message.Error'
    );
    this.noticeContentList = [];
    this.noticeContentList.push(res.error.message || defaultErrorMsg);
    this.showNoticeDialog('error');
  }

  private showNoticeDialog(mode: 'error' | 'success') {
    if (!(this.noticeContentList.length > 0)) {
      return;
    }
    this.noticeCheckDialogParams = {
      title: this.translateService.instant(
        'LicenseMgmt.Common.Title.Notification'
      ),
      visiable: true,
      mode: mode,
    };
  }

  private handleAddSuccess(addRequestBody) {
    this.noticeContentList = [
      this.translateService.instant('LicenseMgmt.Common.Hint.CreateSuccess'),
    ];
    this.showNoticeDialog('success');

    const user = `${this.userContextService.user$.getValue().userCode} ${
      this.userContextService.user$.getValue().userNameE
    } ${this.userContextService.user$.getValue().userName} `;
    const nowTime = this.datePipe.transform(new Date(), 'yyyy-MM-dd');
    addRequestBody.approveDate = this.datePipe.transform(
      addRequestBody.approveDate,
      'yyyy-MM-dd'
    );
    addRequestBody.endDate = this.datePipe.transform(
      addRequestBody.endDate,
      'yyyy-MM-dd'
    );
    addRequestBody.createdDate = nowTime;
    addRequestBody.createdBy = user;
    addRequestBody.lastUpdatedDate = nowTime;
    addRequestBody.lastUpdatedBy = user;
    // update
    // this.itemQueue.next([...this.itemQueue.getValue(), addRequestBody]); // 取消update 避免新增完資料後 頁碼跑掉
  }

  private handleModifySuccess(e) {
    this.noticeContentList = [
      this.translateService.instant('LicenseMgmt.Common.Hint.EditSuccess'),
    ];
    this.showNoticeDialog('success');
    console.log(this.itemQueue.getValue(), e);

    const user = `${this.userContextService.user$.getValue().userCode} ${
      this.userContextService.user$.getValue().userNameE
    } ${this.userContextService.user$.getValue().userName} `;

    // update
    let newData = this.itemQueue.getValue();
    newData.forEach((item) => {
      if (item.bafaLicense === e.license) {
        item.active = e.flag;
        item.endDate = this.datePipe.transform(e.endDate, 'yyyy/MM/dd');
        item.balanceQty = e.qty - item.quantity + item.balanceQty;
        item.quantity = e.qty;
        item.lastUpdatedDate = this.datePipe.transform(
          new Date(),
          'yyyy/MM/dd'
        );
        item.lastUpdatedBy = user;
      }
    });
    this.itemQueue.next(newData);
  }

  private handleBatchSuccess(e) {
    this.noticeContentList = [
      this.translateService.instant('LicenseMgmt.Common.Hint.EditSuccess'),
    ];
    this.showNoticeDialog('success');

    // update
    let newData = this.itemQueue.getValue();
    newData.forEach((item) => {
      if (e.license.includes(item.bafaLicense)) {
        if (e.flag) {
          item.active = e.flag;
        }
        if (e.endDate) {
          item.endDate = this.datePipe.transform(e.endDate, 'yyyy/MM/dd');
        }
      }
    });
    this.itemQueue.next(newData);

    this.cleanTableSelected();
    this.showBatchEdit = false;
    this.selectedData = [];
  }

  private cleanTableSelected() {
    this.cleanTable = false;
    setTimeout(() => {
      this.cleanTable = true;
    }, 0);
  }

  private openSpinner() {
    this.showSpinner = true;
  }
  private closeSpinner() {
    this.showSpinner = false;
  }

  //#-----------------start------------------
  //# for date picker input format event
  onCheckDateHandler(): void {
    if (
      new Date(
        new Date(this.formData.controls.startDate.value).setHours(0, 0, 0, 0)
      ).getTime() >=
      new Date(
        new Date(this.formData.controls.endDate.value).setHours(23, 59, 59, 0)
      ).getTime()
    ) {
      this.formData.controls.endDate.setValue(null);
    }
  }

  onDatePickerInput(event: InputEvent): void {
    this.dateInputHandlerService.concat(event.data);
  }

  onDatePickerSelectAndBlur(): void {
    this.dateInputHandlerService.clean();
  }

  onDatePickerClose(key: string): void {
    this.formData.controls[key].setValue(
      this.dateInputHandlerService.getDate() ??
        this.formData.controls[key].value
    );
    this.dateInputHandlerService.clean();
  }
  //#------------------end------------------
}
