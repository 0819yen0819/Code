import { LoaderService } from 'src/app/core/services/loader.service';
import { LicenseControlApiService } from 'src/app/core/services/license-control-api.service';
import { ObjectFormatService } from 'src/app/core/services/object-format.service';
import { SoaControlSetupByItemService } from './soa-control-by-item-setup.service';
import { Component, OnInit, isDevMode } from '@angular/core';
import { Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { LazyLoadEvent, SelectItem } from 'primeng/api';
import { BehaviorSubject, finalize, lastValueFrom } from 'rxjs';
import {
  SelectorDialogParams,
  DialogSettingParams,
} from 'src/app/core/model/selector-dialog-params';
import { SoaApiService } from 'src/app/core/services/soa-api.service';
import { UserContextService } from 'src/app/core/services/user-context.service';
import {
  getFormValueDefault,
  soaControlTabelSetting,
} from '../soa-control-setup-by-item/soa-control-setup-by-item-init';
import { environment } from 'src/environments/environment';
import { TableStatusKeepService } from 'src/app/core/services/table-status-keep.service';
import { TableStatusKeepEnum } from 'src/app/core/model/table-status-keep.const';

@Component({
  selector: 'app-soa-control-setup-by-item',
  templateUrl: './soa-control-setup-by-item.component.html',
  styleUrls: ['./soa-control-setup-by-item.component.scss'],
})
export class SoaControlSetupByItemComponent implements OnInit {
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

  itemFilterTypeOptions: SelectItem[]; // 搜尋類型 下拉選項
  filterType; // 當前所選類型

  curTableStatus!: LazyLoadEvent;
  totalRecords!: number;

  selectedData = new Array<any>();
  updateDialogParams: DialogSettingParams;
  cleanTable = false;
  constructor(
    private router: Router,
    private translateService: TranslateService,
    private soaApiService: SoaApiService,
    private userContextService: UserContextService,
    public soaControlSetupByItemService: SoaControlSetupByItemService,
    private objectFormatService: ObjectFormatService,
    private licenseControlApiService: LicenseControlApiService,
    private loaderService: LoaderService,
    public tableStatusKeepService: TableStatusKeepService
  ) {
    if (this.userContextService.user$.getValue) {
      this.permissions = this.userContextService.getMenuUrlPermission(
        this.router.url
      );
      isDevMode() && console.log('permissions: ', this.permissions);
    }

    this.translateService
      .get('SoaControlSetup.TableColumn.soaControlTableColByItem')
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
      this.soaControlSetupByItemService.init();
      this.dataTableSettings.noDataConText = this.translateService.instant(
        'SoaControlSetup.Label.PleaseSearchOrAdd'
      );
      this.translateService
        .get('SoaControlSetup.TableColumn.soaControlTableColByItem')
        .subscribe((res) => {
          this.tableCols = res;
        });
      this.itemFilterTypeOptions = this.translateService.instant(
        'EccnMtn.Options.itemFilterTypeOptions'
      );
    });
  }

  setDefaultSetting() {
    this.totalRecords = 0;
    this.dataTableSettings.noDataConText = this.translateService.instant(
      'SoaControlSetup.Label.PleaseSearchOrAdd'
    );
    this.dataTableSettings.isAddMode = this.permissions.includes('add');
    this.dataTableSettings.isEditedMode = this.permissions.includes('edit');
    this.dataTableSettings.isUpdateMode = this.permissions.includes('edit');
    this.dataTableSettings.isSelectMode = this.permissions.includes('edit') || this.permissions.includes('del');
    this.dataTableSettings.isDeleteMode = this.permissions.includes('del');
    this.dataTableSettings.isPaginationMode = false;

    this.itemFilterTypeOptions = this.translateService.instant(
      'EccnMtn.Options.itemFilterTypeOptions'
    );
    this.filterType = this.itemFilterTypeOptions[0].value;
  }

  /**
   * 重設
   */
  resetOnClick() {
    this.dataTableSettings.isPaginationMode = false;
    this.formValue = JSON.parse(JSON.stringify(getFormValueDefault));
    this.tableData.next([]);
    this.tableStatusKeepService.resetPageEvent();
    this.cleanTable = true;
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
    lastValueFrom(this.soaApiService.querySoaItem(model))
      .then((res: any) => {
        if (mode === 'S') {
          res.body.datas.map((item) => {
            item.specialApproval =
              item.specialApproval === '0' ? 'ALL' : item.specialApproval;
          });
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
          this.cleanTable = true;
          setTimeout(() => {
            this.cleanTable = false;
          }, 50);
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
      process.push(lastValueFrom(this.soaApiService.delSoaItem(model)));
    });

    const successMsg = this.translateService.instant(
      'SoaControlSetup.Msg.DelSuccess'
    );
    Promise.all([...process])
      .then(() => {
        this.queryOnClick('S');
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
        this.soaApiService.saveSoaItem(this.getAddModel(event))
      );
    } else if (event.mode === 'edit') {
      process = lastValueFrom(
        this.soaApiService.updateSoaItem(this.getUpdateModel(event))
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

  //> 當篩選模式更換後，清空 item info
  onSelectModeChange() {
    this.formValue.item = null;
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
      if (item.productCode === '0') {
        item.productCode = 'All Item';
      }
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
      item.key = this.soaControlSetupByItemService.getRandomKey();
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

  /**
   * 取得Query 要帶入 的Model
   * @param mode
   * @returns
   */
  private async getQueryModel(mode: 'S' | 'E') {
    await this.tableStatusKeepService.delay(1);
    return this.objectFormatService.ObjectClean({
      tenant: this.userContextService.user$.getValue().tenant,
      brand:
        this.formValue.brand && this.formValue.brand.value
          ? this.formValue.brand.value
          : this.formValue.brand,
      ctg1: this.formValue.ctg1,
      ctg2: this.formValue.ctg2,
      eccn: this.formValue.eccn,
      productCode: this.formValue.item ? this.formValue.item.value : null,
      flag: this.formValue.flag,
      action: mode,
      specialApproval: this.formValue.specialApproval,
      userEmail: this.userContextService.user$.getValue().userEmail,
      sofcBaseHerf: environment.sofcBaseHerf,
      lazyLoadEvent: this.tableStatusKeepService.get(
        TableStatusKeepEnum.PageEvent
      ),
    });
  }

  /**
   * 取得刪除的Model
   * @param data
   * @returns
   */
  private getDelModel(data) {
    return this.objectFormatService.ObjectClean({
      seq: data.seq,
      tenant: this.userContextService.user$.getValue().tenant,
      vcType: data.vcType.substr(0, 1),
      vcCode: data.vcCode,
      vcName: data.vcName,
      brand: data.brand,
      ctg1: data.ctg1,
      ctg2: data.ctg2,
      ctg3: data.ctg3,
      eccn: data.eccn,
      productCode: data.productCode,
      validFrom: this.objectFormatService.DateFormat(data.validFrom),
      flag: data.flag,
      remark: data.remark,
      createdBy: this.userContextService.user$.getValue().userEmail,
      specialApproval: data.specialApproval,
    });
  }

  private getAddModel(data) {
    return this.objectFormatService.ObjectClean({
      tenant: this.userContextService.user$.getValue().tenant,
      vcType: data.vcType.substr(0, 1),
      vcCode:
        data.vcCode === 0
          ? 0
          : data.vcType.substr(0, 1) === 'C'
            ? data.vcCode.value.customerNo
            : data.vcCode.value.vendorCode,
      vcName: data.vcCode === 0 ? 'ALL (ALL)' : data.vcName,
      brand: data.brand && data.brand.value ? data.brand.value : data.brand,
      ctg1: data.ctg1,
      ctg2: data.ctg2,
      ctg3: data.ctg3,
      eccn: data.eccn,
      productCode: data.item && data.item.value ? data.item.value : data.item,
      validFrom: this.objectFormatService.DateFormat(data.validFrom),
      flag: data.flag,
      remark: data.remark,
      createdBy: this.userContextService.user$.getValue().userEmail,
      specialApproval: data.specialApproval,
    });
  }

  private getUpdateModel(data) {
    return this.objectFormatService.ObjectClean({
      seq: data.seq,
      tenant: this.userContextService.user$.getValue().tenant,
      vcType: data.vcType.substr(0, 1),
      vcCode: data.vcCode === '0' ? 0 : data.vcCode,
      vcName: data.vcName,
      brand: data.brand && data.brand.value ? data.brand.value : data.brand,
      ctg1: data.ctg1,
      ctg2: data.ctg2,
      ctg3: data.ctg3,
      eccn: data.eccn,
      productCode: data.item && data.item.value ? data.item.value : data.item,
      validFrom: this.objectFormatService.DateFormat(data.validFrom),
      flag: data.flag,
      remark: data.remark,
      createdBy: this.userContextService.user$.getValue().userEmail,
      specialApproval: data.specialApproval,
    });
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

  onBrandSelect(): void {
    this.formValue.ctg1 = null;
    this.formValue.ctg2 = null;
    this.formValue.ctg3 = null;
    if (this.formValue.brand.value) {
      this.soaControlSetupByItemService.initCtg1Options({
        tenant: this.userContextService.user$.getValue().tenant,
        brand: this.formValue.brand.value,
      });
    }
  }

  onCtg1Select(): void {
    this.formValue.ctg2 = null;
    this.formValue.ctg3 = null;
    if (this.formValue.brand.value && this.formValue.ctg1) {
      this.soaControlSetupByItemService.initCtg2Options({
        tenant: this.userContextService.user$.getValue().tenant,
        brand: this.formValue.brand.value,
        ctg1: this.formValue.ctg1,
      });
    }
  }

  onSelectedDataHandler(data: any): void {
    this.selectedData = data;
  }

  updateSignalHandler(): void {
    this.updateDialogParams = {
      title: this.translateService.instant('SoaControlSetup.Label.Update'),
      visiable: true,
    };
  }

  onUpdateInfoHandler(updateInfo: any): void {
    let model: {
      seqList: number[];
      specialApproval: 'Y' | 'N' | 0;
      createdBy: string;
    };

    if (updateInfo) {
      this.loaderService.show();
      model = {
        seqList: this.selectedData.map((x) => x.seq),
        specialApproval: updateInfo['specialApproval'],
        createdBy: this.userContextService.user$.getValue().userEmail,
      };

      this.noticeContentList = [];
      this.licenseControlApiService
        .batchUpdateSoaItemSpecialApproval(model)
        .pipe(
          finalize(() => {
            this.cleanTable = true;
            setTimeout(() => {
              this.cleanTable = false;
            }, 50);

            this.loaderService.hide();
          })
        )
        .subscribe({
          next: () => {
            this.noticeContentList.push(
              this.translateService.instant('SoaControlSetup.Msg.EditSuccess')
            );
            this.showNoticeDialog('success');
            this.queryOnClick('S');
          },
          error: (err) => {
            console.error(err);
            this.noticeContentList.push(
              this.translateService.instant('SoaControlSetup.Msg.EditFail')
            );
            this.showNoticeDialog('error');
          },
        });
    } else {
      this.cleanTable = true;
      setTimeout(() => {
        this.cleanTable = false;
      }, 50);
    }
  }
}
