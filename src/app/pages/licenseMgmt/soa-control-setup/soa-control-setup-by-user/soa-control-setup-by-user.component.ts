import { ObjectFormatService } from './../../../../core/services/object-format.service';
import { Component, OnInit, isDevMode } from '@angular/core';
import { Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { LazyLoadEvent, SelectItem } from 'primeng/api';
import { BehaviorSubject, lastValueFrom } from 'rxjs';
import {
  SelectorDialogParams,
  DialogSettingParams,
} from 'src/app/core/model/selector-dialog-params';
import { VenCusInfo } from 'src/app/core/model/ven-cus-info';
import { SoaApiService } from 'src/app/core/services/soa-api.service';
import { UserContextService } from 'src/app/core/services/user-context.service';
import { SoaControlSetupByUserService } from './soa-control-by-user-setup.service';
import {
  getFormValueDefault,
  soaControlTabelSetting,
} from './soa-control-setup-by-user-init';
import { environment } from 'src/environments/environment';
import { TableStatusKeepService } from 'src/app/core/services/table-status-keep.service';
import { TableStatusKeepEnum } from 'src/app/core/model/table-status-keep.const';

@Component({
  selector: 'app-soa-control-setup-by-user',
  templateUrl: './soa-control-setup-by-user.component.html',
  styleUrls: ['./soa-control-setup-by-user.component.scss'],
})
export class SoaControlSetupByUserComponent implements OnInit {
  permissions: string[] = [];
  formValue = JSON.parse(JSON.stringify(getFormValueDefault));

  tableCols = [];
  dataTableSettings = soaControlTabelSetting;
  tableData: BehaviorSubject<any[]> = new BehaviorSubject<any[]>([]); // Table主資料

  selectorDialogParams: SelectorDialogParams;
  showDialog = false;

  noticeCheckDialogParams: DialogSettingParams;
  noticeContentList: string[] = [];

  showSpinner = false;
  editObj = null;

  curTableStatus!: LazyLoadEvent;
  totalRecords!: number;
  cleanTable = false;
  constructor(
    private router: Router,
    private translateService: TranslateService,
    public soaControlSetupByUserService: SoaControlSetupByUserService,
    private soaApiService: SoaApiService,
    private userContextService: UserContextService,
    private objectFormatService: ObjectFormatService,
    public tableStatusKeepService: TableStatusKeepService
  ) {
    if (this.userContextService.user$.getValue) {
      this.permissions = this.userContextService.getMenuUrlPermission(
        this.router.url
      );
      isDevMode() && console.log('permissions: ', this.permissions);
    }

    this.translateService
      .get('SoaControlSetup.TableColumn.soaControlTableColByUser')
      .subscribe((res) => {
        this.tableCols = res;
      });
  }

  ngOnInit(): void {
    this.setDefaultSetting();
    this.subscribeLangChange();
  }

  subscribeLangChange() {
    this.translateService.onLangChange.subscribe(() => {
      this.soaControlSetupByUserService.init();
      this.dataTableSettings.noDataConText = this.translateService.instant(
        'SoaControlSetup.Label.PleaseSearchOrAdd'
      );
      this.translateService
        .get('SoaControlSetup.TableColumn.soaControlTableColByUser')
        .subscribe((res) => {
          this.tableCols = res;
        });
    });
  }

  setDefaultSetting() {
    this.totalRecords = 0;
    this.dataTableSettings.noDataConText = this.translateService.instant(
      'SoaControlSetup.Label.PleaseSearchOrAdd'
    );
    this.dataTableSettings.isAddMode = this.permissions.includes('add');
    this.dataTableSettings.isEditedMode = this.permissions.includes('edit');
    this.dataTableSettings.isSelectMode = this.permissions.includes('del');
    this.dataTableSettings.isDeleteMode = this.permissions.includes('del');
    this.dataTableSettings.isPaginationMode = false;
  }

  /**
   * 重設
   */
  resetOnClick() {
    //# TK-35854
    this.dataTableSettings.isPaginationMode = false;
    this.formValue = JSON.parse(JSON.stringify(getFormValueDefault));
    this.tableData.next([]);
    this.tableStatusKeepService.resetPageEvent();
    setTimeout(() => {
      this.cleanTable = false;
    }, 50);
  }

  /**
   * 搜尋 / 下載
   *
   * @returns
   */
  async queryOnClick(mode: 'S' | 'E') {
    this.openSpinner();
    const model = await this.getQueryModel(mode);
    lastValueFrom(this.soaApiService.querySoaCustomer(model))
      .then((res: any) => {
        if (mode === 'S') {
          this.tableData.next(this.queryResHandler(res.body.datas));
          if (
            this.tableData.getValue().length &&
            this.tableData.getValue().length > 0
          ) {
            this.dataTableSettings.isPaginationMode = true;
            this.totalRecords = res.body.totalRecords;
          } else {
            this.dataTableSettings.isPaginationMode = false;
          }
        } else if (mode === 'E') {
          this.noticeContentList = [
            this.translateService.instant(
              'SoaControlSetup.Msg.DownloadProcess'
            ),
          ];
          this.showNoticeDialog('success');
        }
      })
      .catch((err) => {
        this.handleRequestError(err);
      })
      .finally(() => {
        this.closeSpinner();
      });
  }

  /**
   * 刪除
   */
  onAfterModifiedDataCallback(remainData) {
    this.openSpinner();
    // 建立要刪除的資料
    const originData = this.tableData.getValue();
    const deleteData = originData.filter((data) => !remainData.includes(data));

    let process = [];
    deleteData.forEach((del) => {
      const model = this.getDelModel(del);
      process.push(lastValueFrom(this.soaApiService.delSoaCustomer(model)));
    });

    const successMsg = this.translateService.instant(
      'SoaControlSetup.Msg.DelSuccess'
    );
    Promise.all([...process])
      .then(() => {
        this.tableData.next(remainData);
        this.showMsgDialogByInput([successMsg], 'success');
      })
      .catch((err) => {
        this.handleRequestError(err);
      })
      .finally(() => {
        this.closeSpinner();
      });
  }

  /**
   * 編輯 / 新增 資料回傳
   */
  async getDialogInfo(event) {
    this.openSpinner();
    this.soaDialogClose();

    let process;
    if (event.mode === 'add') {
      process = lastValueFrom(
        this.soaApiService.saveSoaCustomer(this.getAddModel(event))
      );
    } else if (event.mode === 'edit') {
      process = lastValueFrom(
        this.soaApiService.updateSoaCustomer(this.getUpdateModel(event))
      );
    }

    const successMsg = this.translateService.instant(
      event.mode === 'add'
        ? 'SoaControlSetup.Msg.CreateSuccess'
        : 'SoaControlSetup.Msg.EditSuccess'
    );
    process
      .then(() => {
        this.queryOnClick('S');
        // this.updateTable(event, event.mode);
        this.showMsgDialogByInput([successMsg], 'success');
      })
      .catch((err) => {
        this.handleRequestError(err);
      })
      .finally(() => {
        this.closeSpinner();
      });
  }

  soaDialogOpen(e?) {
    if (e) {
      this.editObj = e;
    }
    this.showDialog = true;
  }

  soaDialogClose() {
    this.showDialog = false;
    this.editObj = null;
  }

  /**
   * 沒選autoComplete的話.清空input內容
   *
   * @param event
   */
  onBlurOu(event) {
    if (
      this.formValue.selectedOu === undefined ||
      this.formValue.selectedOu?.ouCode === undefined
    ) {
      this.formValue.selectedOu = undefined;
    }
  }

  /**
   * 廠商名單被點擊
   */
  cvSelectDialogOnOpen(): void {
    if (!this.formValue.vcType) {
      return;
    }
    this.selectorDialogParams = {
      title: `${this.translateService.instant('Dialog.Header.Choose')} ${
        this.formValue.vcType
      }`,
      type: this.formValue.vcType.toLowerCase() + '_all',
      visiable: true,
    };
  }

  /**
   * 廠商名單回傳
   *
   * @param result
   */
  onSelectorDialogCallback(result: SelectItem<VenCusInfo>): void {
    this.formValue.cvValue = result;
  }

  vcTypeChange() {
    this.formValue.cvValue = null;
  }

  getTableStatus(status: LazyLoadEvent) {
    if (
      this.tableData.getValue() &&
      this.curTableStatus &&
      (this.curTableStatus.first !== status.first ||
        this.curTableStatus.rows !== status.rows)
    ) {
      this.curTableStatus = status;
      this.queryOnClick('S');
    }
    this.curTableStatus = status;
  }

  /**
   * 查詢 / 下載 前檢查
   * @returns
   */
  private queryCheck() {
    this.noticeContentList = new Array<string>();
    const pleaseInput = this.translateService.instant(
      'Input.PlaceHolder.PleaseSelect'
    );

    const cvNotSelect = !this.formValue.cvValue;
    if (cvNotSelect) {
      this.noticeContentList.push(
        `${pleaseInput} ${this.translateService.instant('SOA.Label.CV')}`
      );
    }

    return this.noticeContentList.length === 0;
  }

  private handleRequestError(res) {
    isDevMode() && console.log(res);

    const defaultErrorMsg = this.translateService.instant(
      'System.Message.Error'
    );
    this.noticeContentList = [];
    this.noticeContentList.push(res.error.message || defaultErrorMsg);
    this.showNoticeDialog('error');
  }

  /**
   * 接回來的資料轉成要顯示的型態
   * @param res
   * @returns
   */
  private queryResHandler(res) {
    res.forEach((item) => {
      if (item.ouCode === '0') {
        item.ouName = 'ALL OU';
      }
      item.vcType === 'C'
        ? (item.vcType = 'Customer')
        : (item.vcType = 'Vendor');
      item.validFrom = this.objectFormatService.DateFormat(
        new Date(item.validFrom),
        '/'
      );
      item.key = this.soaControlSetupByUserService.getRandomKey();
      item.createdDate = this.objectFormatService.DateTimeFormat(
        new Date(item.createdDate),
        '/'
      );
      item.lastUpdatedDate = this.objectFormatService.DateTimeFormat(
        new Date(item.lastUpdatedDate),
        '/'
      );
    });
    // let rsp = await lastValueFrom(this.authApiService.ouQueryByPrefix(ouCode));

    return res;
  }

  /**
   * 刷新table
   *
   * @param editObj
   */
  private updateTable(editObj, mode: 'add' | 'edit') {
    let newtableData = [];

    editObj.ouCode = editObj.ouCode?.ouCode || editObj.ouCode;
    editObj.vcCode =
      editObj.vcCode?.value?.vendorCode ||
      editObj.vcCode?.value?.customerNo ||
      editObj.vcCode;
    editObj.lastUpdatedDate = this.soaControlSetupByUserService.dateFormat(
      new Date()
    );
    editObj.lastUpdatedBy = `${
      this.userContextService.user$.getValue().userCode
    } ${this.userContextService.user$.getValue().userNameE} ${
      this.userContextService.user$.getValue().userName
    }`;

    if (mode === 'edit') {
      this.tableData.getValue().forEach((item) => {
        editObj.key === item.key
          ? newtableData.push(editObj)
          : newtableData.push(item);
      });
    } else if (mode === 'add') {
      editObj.createdDate = this.soaControlSetupByUserService.dateFormat(
        new Date()
      );
      editObj.createdBy = `${
        this.userContextService.user$.getValue().userCode
      } ${this.userContextService.user$.getValue().userNameE} ${
        this.userContextService.user$.getValue().userName
      }`;
      newtableData = this.tableData.getValue();
      newtableData.push(editObj);
    }

    this.tableData.next(newtableData);
  }

  /**
   * 取得Query 要帶入 的Model
   * @param mode
   * @returns
   */
  private async getQueryModel(mode: 'S' | 'E') {
    await this.tableStatusKeepService.delay(1);
    return {
      tenant: this.userContextService.user$.getValue().tenant,
      group: this.formValue.group,
      ouCode: this.formValue.selectedOu?.ouCode,
      flag: this.formValue.flag,
      vcType: this.formValue.vcType?.substr(0, 1),
      vcCode:
        this.formValue.cvValue?.value?.customerNo ||
        this.formValue.cvValue?.value?.vendorCode ||
        '',
      action: mode,
      userEmail: this.userContextService.user$.getValue().userEmail,
      sofcBaseHerf: environment.sofcBaseHerf,
      lazyLoadEvent: this.tableStatusKeepService.get(TableStatusKeepEnum.PageEvent),
    };
  }

  /**
   * 取得刪除的Model
   * @param data
   * @returns
   */
  private getDelModel(data) {
    return {
      tenant: this.userContextService.user$.getValue().tenant,
      group: data.group,
      ouCode: data.selectedOu?.ouCode || data.ouCode,
      vcType: data.vcType?.substr(0, 1),
      vcCode: data.vcCode,
      validFrom: this.objectFormatService.DateFormat(data.validFrom),
      flag: data.flag,
      remark: data.remark,
      createdBy: this.userContextService.user$.getValue().userEmail,
    };
  }

  private getAddModel(data) {
    return {
      tenant: this.userContextService.user$.getValue().tenant,
      group: data.group,
      groupCode: this.soaControlSetupByUserService.getGroupCodeByGroupName(
        data.group
      ),
      ouCode: data.ouCode.ouCode,
      vcType: data.vcType.substr(0, 1),
      vcCode: data.vcCode.value.vendorCode || data.vcCode.value.customerNo,
      vcName: data.vcName,
      validFrom: this.objectFormatService.DateFormat(data.validFrom),
      flag: data.flag,
      remark: data.remark,
      createdBy: this.userContextService.user$.getValue().userEmail,
    };
  }

  private getUpdateModel(data) {
    return {
      tenant: this.userContextService.user$.getValue().tenant,
      group: data.group,
      groupCode: this.soaControlSetupByUserService.getGroupCodeByGroupName(
        data.group
      ),
      ouCode: data.ouCode.ouCode,
      vcType: data.vcType.substr(0, 1),
      vcCode: data.vcCode,
      validFrom: this.objectFormatService.DateFormat(data.validFrom),
      flag: data.flag,
      remark: data.remark,
      createdBy: this.userContextService.user$.getValue().userEmail,
    };
  }

  /**
   * 打開訊息框
   * @returns
   */
  private showNoticeDialog(mode: string) {
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

  /**
   * 根據輸入打開訊息框
   * @returns
   */
  private showMsgDialogByInput(msg: string[] = [], mode: string) {
    if (msg.length === 0) {
      return;
    }
    this.noticeContentList = [];
    this.noticeContentList.push(...msg);

    this.noticeCheckDialogParams = {
      title: this.translateService.instant(
        'LicenseMgmt.Common.Title.Notification'
      ),
      visiable: true,
      mode: mode,
    };
  }

  private openSpinner() {
    this.showSpinner = true;
  }
  private closeSpinner() {
    this.showSpinner = false;
  }
}
