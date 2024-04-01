import { LoaderService } from './../../../../core/services/loader.service';
import { TranslateService } from '@ngx-translate/core';
import { Component, OnDestroy, OnInit, isDevMode } from '@angular/core';
import {
  getFormValueDefault,
  soaControlTabelSetting,
} from './soa-exclusion-control-init';
import { SoaExclusionControlSetupService } from './soa-exclusion-control-setup.service';
import {
  DialogSettingParams,
  SelectorDialogParams,
} from 'src/app/core/model/selector-dialog-params';
import { LazyLoadEvent, SelectItem } from 'primeng/api';
import { VenCusInfo } from 'src/app/core/model/ven-cus-info';
import { TableCol } from 'src/app/core/model/data-table-cols';
import { Subject, lastValueFrom } from 'rxjs';
import { Router } from '@angular/router';
import { UserContextService } from 'src/app/core/services/user-context.service';
import { ObjectFormatService } from 'src/app/core/services/object-format.service';
import { SoaApiService } from 'src/app/core/services/soa-api.service';
import { environment } from 'src/environments/environment';
import { TableStatusKeepService } from 'src/app/core/services/table-status-keep.service';
import { TableStatusKeepEnum } from 'src/app/core/model/table-status-keep.const';
@Component({
  selector: 'app-soa-exclusion-control',
  templateUrl: './soa-exclusion-control.component.html',
  styleUrls: ['./soa-exclusion-control.component.scss'],
})
export class SoaExclusionControlComponent implements OnInit, OnDestroy {
  private unSubscribeEvent = new Subject();
  permissions: string[] = [];
  formValue = JSON.parse(JSON.stringify(getFormValueDefault));
  selectorDialogParams: SelectorDialogParams;
  dataTableSettings = soaControlTabelSetting;
  noticeCheckDialogParams: DialogSettingParams;
  noticeContentList: string[] = [];

  editObj = null;
  showDialog = false;

  tableData = new Array<any>();
  tableCols: TableCol[] = [];

  curTableStatus!: LazyLoadEvent;
  totalRecords!: number;
  cleanTable = false;
  constructor(
    public soaExclusionControlSetupService: SoaExclusionControlSetupService,
    private translateService: TranslateService,
    private userContextService: UserContextService,
    private router: Router,
    private loaderService: LoaderService,
    private objectFormatService: ObjectFormatService,
    private soaApiService: SoaApiService,
    public tableStatusKeepService:TableStatusKeepService
  ) {
    if (this.userContextService.user$.getValue) {
      this.permissions = this.userContextService.getMenuUrlPermission(
        this.router.url
      );
      isDevMode() && console.log('permissions: ', this.permissions);
    }
    this.translateService
      .get('SoaControlSetup.TableColumn.soaExclusionControlTableCol')
      .subscribe((res) => {
        this.tableCols = res;
      });
  }

  ngOnInit(): void {
    this.setDefaultSetting();
    this.subscribeLangChange();
  }

  ngOnDestroy(): void {
    this.unSubscribeEvent.next(null);
    this.unSubscribeEvent.complete();
  }

  subscribeLangChange() {
    this.translateService.onLangChange.subscribe(() => {
      this.soaExclusionControlSetupService.init();
      this.dataTableSettings.noDataConText = this.translateService.instant(
        'SoaControlSetup.Label.PleaseSearchOrAdd'
      );
      this.translateService
        .get('SoaControlSetup.TableColumn.soaExclusionControlTableCol')
        .subscribe((res) => {
          this.tableCols = res;
        });
    });
  }

  setDefaultSetting() {
    this.totalRecords = 0;
    this.dataTableSettings.lazyMode = true;
    this.dataTableSettings.noDataConText = this.translateService.instant(
      'SoaControlSetup.Label.PleaseSearchOrAdd'
    );
    this.dataTableSettings.isAddMode = this.permissions.includes('add');
    this.dataTableSettings.isEditedMode = this.permissions.includes('edit');
    this.dataTableSettings.isSelectMode = this.permissions.includes('del');
    this.dataTableSettings.isDeleteMode = this.permissions.includes('del');
    this.dataTableSettings.isPaginationMode = false;
  }

  vcTypeChange() {
    this.formValue.cvValue = null;
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
   */
  onSelectorDialogCallback(result: SelectItem<VenCusInfo>): void {
    this.formValue.cvValue = result;
  }

  /**
   * 重設
   */
  resetOnClick() {
    this.dataTableSettings.isPaginationMode = false;
    this.formValue = JSON.parse(JSON.stringify(getFormValueDefault));
    this.tableData = new Array<any>();
    this.tableStatusKeepService.resetPageEvent();
    setTimeout(() => {
      this.cleanTable = false;
    }, 50);
  }

  async queryOnClick(mode: 'S' | 'E') {
    this.loaderService.show();
    const model = await this.getQueryModel(mode);
    lastValueFrom(this.soaApiService.querySoaNonControlItem(model))
      .then((res: any) => {
        if (mode === 'S') {
          this.tableData = this.queryResHandler(res.body.datas);
          if (this.tableData.length && this.tableData.length > 0) {
            this.dataTableSettings.isPaginationMode = true;
            this.totalRecords = res.body.totalRecords;
          } else {
            this.dataTableSettings.isPaginationMode = false;
          }
        } else {
          this.noticeContentList = [
            this.translateService.instant(
              'SoaControlSetup.Msg.DownloadProcess'
            ),
          ];
          this.showNoticeDialog('success');
        }
      })
      .catch((err) => {
        this.dataTableSettings.isPaginationMode = false;
        this.handleRequestError(err);
        this.loaderService.hide();
      })
      .finally(() => {
        this.loaderService.hide();
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

  async getDialogInfo(event) {
    this.loaderService.show();
    let process;
    if (event.mode === 'add') {
      process = lastValueFrom(
        this.soaApiService.saveSoaNonControlItem(this.getAddModel(event))
      );
    } else if (event.mode === 'edit') {
      process = lastValueFrom(
        this.soaApiService.updateSoaNonControlItem(this.getUpdateModel(event))
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
        this.showMsgDialogByInput([successMsg], 'success');
      })
      .catch((err) => {
        this.handleRequestError(err);
      })
      .finally(() => {
        this.loaderService.hide();
      });
  }

  onAfterModifiedDataCallback(remainData) {
    this.loaderService.show();
    // 建立要刪除的資料
    const originData = this.tableData;
    const deleteData = originData.filter((data) => !remainData.includes(data));

    let process = [];
    deleteData.forEach((del) => {
      const model = this.getDelModel(del);
      process.push(
        lastValueFrom(this.soaApiService.delSoaNonControlItem(model))
      );
    });

    const successMsg = this.translateService.instant(
      'SoaControlSetup.Msg.DelSuccess'
    );
    Promise.all([...process])
      .then(() => {
        this.tableData = remainData;
        this.showMsgDialogByInput([successMsg], 'success');
      })
      .catch((err) => {
        this.handleRequestError(err);
        this.loaderService.hide();
      })
      .finally(() => {
        this.loaderService.hide();
      });
  }

  getTableStatus(status: LazyLoadEvent) {
    if (
      this.tableData &&
      this.curTableStatus &&
      (this.curTableStatus.first !== status.first ||
        this.curTableStatus.rows !== status.rows)
    ) {
      this.curTableStatus = status;
      this.queryOnClick('S');
    }
    this.curTableStatus = status;
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

  private queryResHandler(res) {
    res.forEach((item) => {
      if (item.vcCode === 0 || item.vcCode === '0') {
        item.vcName = 'ALL (ALL)';
        item.vcCode = 'All';
      }
      item.vcType === 'C'
        ? (item.vcType = 'Customer')
        : (item.vcType = 'Vendor');
      item.validFrom = this.objectFormatService.DateFormat(
        new Date(item.validFrom),
        '/'
      );
      item.createdDate = this.objectFormatService.DateTimeFormat(
        new Date(item.createdDate),
        '/'
      );
      item.lastUpdatedDate = this.objectFormatService.DateTimeFormat(
        new Date(item.lastUpdatedDate),
        '/'
      );
    });

    return res;
  }

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

  private async getQueryModel(mode: 'S' | 'E') {
    await this.tableStatusKeepService.delay(1);
    return this.objectFormatService.ObjectClean({
      tenant: this.userContextService.user$.getValue().tenant,
      group: this.formValue.group,
      brand:
        this.formValue.brand && this.formValue.brand.value
          ? this.formValue.brand.value
          : this.formValue.brand,
      vcType: this.formValue.vcType?.substr(0, 1),
      vcCode:
        this.formValue.cvValue?.value?.customerNo ||
        this.formValue.cvValue?.value?.vendorCode ||
        '',
      flag: this.formValue.flag,
      action: mode,
      userEmail: this.userContextService.user$.getValue().userEmail,
      sofcBaseHerf: environment.sofcBaseHerf,
      lazyLoadEvent:  this.tableStatusKeepService.get(TableStatusKeepEnum.PageEvent),
    });
  }

  private getDelModel(data) {
    return {
      seq: data.seq,
      tenant: this.userContextService.user$.getValue().tenant,
      group: data.group,
      groupCode: this.soaExclusionControlSetupService.getGroupCodeByGroupName(
        data.group
      ),
      brand: data.brand && data.brand.value ? data.brand.value : data.brand,
      vcType: data.vcType?.substr(0, 1),
      vcCode:
        data.vcCode && data.vcCode.value
          ? data.vcCode.value.customerNo || data.vcCode.value.vendorCode
          : data.vcCode,
      vcName: data.vcName,
      flag: data.flag,
      validFrom: new Date(data.validFrom).getTime(),
      remark: data.remark,
      createdBy: this.userContextService.user$.getValue().userEmail,
    };
  }

  private getAddModel(data) {
    return this.objectFormatService.ObjectClean({
      tenant: this.userContextService.user$.getValue().tenant,
      group: data.group,
      groupCode: this.soaExclusionControlSetupService.getGroupCodeByGroupName(
        data.group
      ),
      brand: data.brand && data.brand.value ? data.brand.value : data.brand,
      vcType: data.vcType?.substr(0, 1),
      vcCode: data.vcCode.value.customerNo || data.vcCode.value.vendorCode,
      vcName: data.vcCode.value.customerName || data.vcCode.value.vendorName,
      flag: data.flag,
      validFrom: new Date(data.validFrom).getTime(),
      remark: data.remark,
      createdBy: this.userContextService.user$.getValue().userEmail,
    });
  }

  private getUpdateModel(data) {
    return this.objectFormatService.ObjectClean({
      seq: data.seq,
      tenant: this.userContextService.user$.getValue().tenant,
      group: data.group,
      groupCode: this.soaExclusionControlSetupService.getGroupCodeByGroupName(
        data.group
      ),
      brand: data.brand && data.brand.value ? data.brand.value : data.brand,
      vcType: data.vcType?.substr(0, 1),
      vcCode:
        data.vcCode && data.vcCode.value
          ? data.vcCode.value.customerNo || data.vcCode.value.vendorCode
          : data.vcCode,

      vcName:
        data.vcCode && data.vcCode.value
          ? data.vcCode.value.customerName || data.vcCode.value.vendorName
          : data.vcName,
      flag: data.flag,
      validFrom: new Date(data.validFrom).getTime(),
      remark: data.remark,
      createdBy: this.userContextService.user$.getValue().userEmail,
    });
  }
}
