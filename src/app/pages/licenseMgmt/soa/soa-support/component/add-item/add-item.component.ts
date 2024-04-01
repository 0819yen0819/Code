import { Component, EventEmitter, Input, isDevMode, OnInit, Output } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { BehaviorSubject, lastValueFrom } from 'rxjs';
import { TableCol } from 'src/app/core/model/data-table-cols';
import { DialogSettingParams } from 'src/app/core/model/selector-dialog-params';
import { SoaCommonService } from '../../../soa-common.service';
import { allItemTemplate } from './add-item.const';
import { UserContextService } from 'src/app/core/services/user-context.service';
import { LicenseControlApiService } from 'src/app/core/services/license-control-api.service';
import { LoaderService } from 'src/app/core/services/loader.service';
@Component({
  selector: 'app-add-item',
  templateUrl: './add-item.component.html',
  styleUrls: ['./add-item.component.scss']
})
export class AddItemComponent implements OnInit {
  @Input() soaData: any;
  @Output() itemEmmiter = new EventEmitter<any>();

  showAddItemDialog = false;
  showModifyItemDialog = false;
  itemQueue: BehaviorSubject<any[]> = new BehaviorSubject<any[]>([]);;
  itemTableCols: TableCol[] = new Array<TableCol>();

  dataTableSettings: any;

  noticeContentList: string[] = new Array<string>();
  noticeCheckDialogParams: DialogSettingParams = {
    title: this.translateService.instant('LicenseMgmt.Common.Title.Notification'),
    visiable: false,
  };

  editItem: any = {
    item: '',
    brand: '',
    oldName: '',
  };

  allowSelectRole = ['Group1', 'TCSU'];
  batchSelectData: any[] = []; // 當前選擇要被批次修改的資料
  clearSelection: boolean = false;
  approvingLicenseData: any[] = [];
  showApprovingLicense: boolean = false;

  constructor(
    public soaCommonService: SoaCommonService,
    private translateService: TranslateService,
    private userContextService: UserContextService,
    private licenseControlApiService: LicenseControlApiService,
    private loaderService: LoaderService
  ) { }

  ngOnInit(): void {
    this.subscribeLangChange();
    this.initTable();
  }

  get enableSelection() {
    return this.allowSelectRole.includes(this.soaCommonService.currentRole)
  }

  subscribeLangChange(){
    this.translateService.onLangChange.subscribe(() => {
      this.itemTableCols = [
        { label: 'Brand', field: 'brand' },
        { label: 'Ctg1', field: 'ctg1' },
        { label: 'Ctg2', field: 'ctg2' },
        { label: 'Ctg3', field: 'ctg3' },
        { label: 'ECCN', field: 'eccn' },
        { label: 'Item', field: 'item' },
        { label: this.translateService.instant('SOA.Button.deduct'), field: 'isDeduct' },
        { label: 'Qty', field: 'qty' }
      ]

      this.resetBatchData();
    });
  }

  initTable() {
    this.itemTableCols = [
      { label: 'Brand', field: 'brand' },
      { label: 'Ctg1', field: 'ctg1' },
      { label: 'Ctg2', field: 'ctg2' },
      { label: 'Ctg3', field: 'ctg3' },
      { label: 'ECCN', field: 'eccn' },
      { label: 'Item', field: 'item' },
      { label: this.translateService.instant('SOA.Button.deduct'), field: 'isDeduct' },
      { label: 'Qty', field: 'qty' }
    ]

    if (this.soaCommonService.currentState === 'Apply' && this.soaCommonService.curState !== 'Draft') {
      this.addItemIntoQueue(allItemTemplate);
      this.dataTableSettings = this.getDefaultDataSetting(true, false);
    }
    else {
      this.recoverData();
    }
  }

  recoverData() {
    const isDraft = this.soaCommonService.curState === 'Draft';
    const isApplyer = this.soaCommonService.currentRole === 'Applyer';

    const isGroup1 = this.soaCommonService.currentRole === 'Group1'   // GroupOU人員(GroupOU)，可編輯扣量與否與數量
    const isTCSU = this.soaCommonService.currentRole === 'TCSU'  // 若表單關卡為TCSU，可編輯扣量與否與數量
    const isManager = this.soaCommonService.currentRole === 'Manager'   // 主管不可編輯扣量與否與數量
    const isLegal = this.soaCommonService.currentRole === 'Legal'  // Legal不可編輯扣量與否與數量
    const currentIsAllowToEdit = (isGroup1 || isTCSU && (!isManager && !isLegal));

    const disabledSelect = isGroup1 || isTCSU

    this.dataTableSettings = this.getDefaultDataSetting(isDraft || isApplyer || currentIsAllowToEdit, disabledSelect);
    const rsp = this.soaCommonService.getSOAFormData();
    if (!rsp) { return; }
    rsp.datas?.forEach(item => { this.addItemIntoQueue(item); });
  }

  onOpenAddItemDialogEvent() {
    this.showAddItemDialog = true;
  }

  addItemOnClose() {
    this.showAddItemDialog = false;
  }

  modifyItemOnClose() {
    this.showModifyItemDialog = false;
  }

  /**
   * 取得新增ITEM回傳的結果
   * @param item
   */
  getItemInfo(item) {
    this.itemAlreadyExist(item) ? this.showHintDialog(this.translateService.instant('SOA.Msg.duplicateItem'), 'error') : this.addItemIntoQueue(item);
  }

  onEditSelectedDataCallback(e) {
    const labelIsAllItem = e.productCode === '0' || e.item === 'All Item';
    const nullOfElseAttributes = !e.brand && !e.ctg1 && !e.ctg2 && !e.ctg3 && !e.eccn
    if (labelIsAllItem && nullOfElseAttributes) { // all Item不可編輯
      this.showHintDialog(this.translateService.instant('SOA.Msg.AllItemNotAllowEdit'), 'error');
    } else {
      this.editItem = JSON.parse(JSON.stringify(e));
      this.editItem.oldName = e.item
      this.showModifyItemDialog = true;
    }
  }

  getMulitpleItemUpload(rsp) {
    const msg = [];
    rsp?.existedList?.forEach(existItem => { msg.push(`${existItem.productCode} ${existItem.brand} ${this.translateService.instant('SOA.Msg.MulitpleUploadItemAlreadExist')}`) });
    rsp?.unMatchedList?.forEach(umMatchItem => { msg.push(`${umMatchItem.productCode} ${umMatchItem.brand} ${this.translateService.instant('SOA.Msg.ItemNotFound')}`) });
    rsp?.itemList?.forEach(item => {
      this.itemAlreadyExist(item)
        ? msg.push(`${item.productCode} ${item.brand} ${this.translateService.instant('SOA.Msg.MulitpleUploadItemAlreadExist')}`)
        : this.addItemIntoQueue(item);
    });
    this.showMulitpleHintDialog(msg, 'error');
  }

  onAfterModifiedDataCallback(e) {
    this.itemQueue.next(e);
    this.itemEmmiter.emit(this.itemQueue.getValue());
  }

  getModifyRes(e) {
    if (this.itemAlreadyExist(e)) { this.showHintDialog(this.translateService.instant('SOA.Msg.duplicateItem'), 'error') }
    else {
      let queue = this.itemQueue.getValue();
      queue.forEach(item => { // 找到修改的對象進行修改
        if ((item.lineId === e.lineId)) {
          item.item = e.item;
          item.productCode = e.productCode;
          item.brand = e.brand;
          item.isDeduct = e.isDeduct;
          item.qty = e.isDeduct === 'N' ? null : e.qty;
          item.ctg1 = e.ctg1;
          item.ctg2 = e.ctg2;
          item.ctg3 = e.ctg3;
          item.eccn = e.eccn;
        }
      })
      this.itemQueue.next(queue);
      this.itemEmmiter.emit(this.itemQueue.getValue());
    }
  }

  /**
   * table的checkbox被點擊
   */
  onSelectedDataHandler(event: any) {
    this.clearSelection = false;
    this.batchSelectData = event;
  }

  batchOnSave(event: any) {
    // check
    const batchDataHaveAllItem = this.batchSelectData
      .filter(item => {
        return (item.item === 'All Item' && !item.brand) && (item.item === 'All Item' && !item.eccn)
      }).length > 0;
    if (batchDataHaveAllItem) { return this.showHintDialog(this.translateService.instant('SoaControlSetup.Msg.NotAllowEditAllItem'), 'error') };

    // update table data by batch edit result
    const batchDataIds = this.batchSelectData.map(batchItem => { return batchItem.lineId });
    this.itemQueue.getValue().forEach(originItem => {
      if (batchDataIds.includes(originItem.lineId)) {
        originItem.isDeduct = event.deduction;
        originItem.qty = event.qty;
      }
    });

    this.itemEmmiter.emit(this.itemQueue.getValue());
    this.resetBatchData();
  }

  resetBatchData() {
    this.batchSelectData = [];
    this.clearSelection = true;
    setTimeout(() => {
      this.clearSelection = false;
    }, 0);
  }

  itemFieldOnClick(e) {
    if (!this.soaData.applyInfo.vcCode) {
      const pleaseSelect = this.translateService.instant('Input.PlaceHolder.PleaseSelect');
      const msg = `${pleaseSelect} ${this.translateService.instant('SOA.Label.CV')}`;
      return this.showHintDialog(msg, 'error');
    }
    this.loaderService.show();
    const model = this.getApprovingAndApproveLicenseModel(e);

    lastValueFrom(this.licenseControlApiService.getApprovingAndApproveLicense(model))
      .then(res => {
        res.beans?.forEach(element => {
          if (element.ouCode === '0') { element.ouCode = 'ALL' }
          if (element.ouName === '0') { element.ouName = '' }
          if (element.productCode === '0') { element.productCode = 'All' }
          if (!element.specialApproval) { element.specialApproval = 'N' }
          element.isOriginal = this.translateService.instant(element.isOriginal === 'Y' ? 'SoaLicenseMtn.Label.Original' : 'SoaLicenseMtn.Label.NonOriginal')
          element.status = this.translateService.instant(`LicenseMgmt.Status.${element.status}`);
        });
        this.showApprovingLicense = true;
        this.approvingLicenseData = res.beans.filter(item=>item.formNo !== this.soaCommonService.formNo) ;
      })
      .catch(err => { console.log(err); })
      .finally(() => { this.loaderService.hide(); })
  }

  // 關閉查詢在途表單對話框
  closeApprovingLicenseDialog() {
    this.showApprovingLicense = false;
    this.approvingLicenseData = [];
  }

  private getApprovingAndApproveLicenseModel(e) {
    let ouGroups = [];
    let ouCodes = []; 

    // switch (this.soaData.ouInfo.groupTypeValue) {
    //   case 'ALL Group': ouGroups = []; ouCodes = []; break;
    //   case 'OU':
    //     // ouGroups = [this.soaData.ouInfo.ouSelectedValueRadio];  
    //     ouGroups = this.soaData.ouInfo.ouMainList
    //       .filter(item => { return item.groupCode === this.soaData.ouInfo.ouSelectedValueRadio })
    //       .map(item => item.groupName)
    //     ouCodes = this.soaData.ouInfo.ouSubSelectedValue; break;

    //   case 'Group OU':
    //     // ouGroups = this.soaData.ouInfo.ouSelectedValueCheckbox;
    //     this.soaData.ouInfo.ouMainList.forEach(element => {
    //       if (this.soaData.ouInfo.ouSelectedValueCheckbox.includes(element.groupCode)) { ouGroups.push(element.groupName) }
    //     });
    //     ouCodes = []; break;
    //   default: break;
    // }

    return {
      tenant: this.userContextService.user$.getValue().tenant,
      licenseType: "SOA",
      vcType: this.soaData.applyInfo.vcType,
      vcCode: this.soaData.applyInfo.vcCode,
      ouGroups: [],
      ouCodes: [],
      items: [{
        productCode:e.productCode,
        brand:e.brand ?? null,
        ctg1:e.ctg1 ?? null,
        ctg2:e.ctg2 ?? null,
        ctg3:e.ctg3 ?? null,
        eccn:e.eccn ?? null,
      }]
    }
  }

  /**
   * 將item增加進queue
   * @param item
   */
  private addItemIntoQueue(item) {
    const itemLabel = (item.label === '0' || item.productCode === '0') ? 'All Item' : item.label || item.productCode
    const qty = (item.value?.isDeduct === 'N' ? null : item.value?.qty) || (item.isDeduct === 'N' ? null : item.quantity)

    const itemModel = {
      item: itemLabel,
      brand: item.value?.brand || item.brand,
      key: item.value?.seq || item.productCode,
      productCode: item.value?.invItemNo || item.productCode,
      isDeduct: item.value?.isDeduct || item.isDeduct,
      qty: qty,
      ctg1: item.value?.ctg1 || item?.ctg1,
      ctg2: item.value?.ctg2 || item?.ctg2,
      ctg3: item.value?.ctg3 || item?.ctg3,
      eccn: item.value?.eccn || item?.eccn
    };

    this.itemQueue.next([...this.itemQueue.getValue(), itemModel])

    // if (this.itemQueue.getValue().length > 1) { // 新增非All Item時 蓋掉All Item
    //   const queueWithoutAllItem = [...this.itemQueue.getValue()].splice(1);
    //   const isFullAllItem = (this.itemQueue.getValue()[0].item === 'All Item') && !this.itemQueue.getValue()[0].brand && !this.itemQueue.getValue()[0].eccn
    //   if (isFullAllItem) { this.itemQueue.next(queueWithoutAllItem) }
    // }

    this.itemEmmiter.emit(this.itemQueue.getValue());
  }

  /**
   * 顯示訊息視窗
   * @param msg
   */
  private showHintDialog(msg: string, mode: string) {
    this.noticeContentList = new Array<string>();
    this.noticeContentList.push(msg);
    this.noticeCheckDialogParams = {
      title: this.translateService.instant('LicenseMgmt.Common.Title.Notification'),
      visiable: true,
      mode: mode
    };
  }

  /**
   * 顯示訊息視窗 TODO:跟上面整合
   * @param msg
   */
  private showMulitpleHintDialog(msg: string[], mode) {
    this.noticeContentList = new Array<string>();
    msg.forEach(hint => { this.noticeContentList.push(hint); });
    if (msg.length > 0) {
      this.noticeCheckDialogParams = {
        title: this.translateService.instant('LicenseMgmt.Common.Title.Notification'),
        visiable: true,
        mode: mode
      };
    }
  }

  /**
   * 判斷ITEM是否已存在於queue
   * @param newItem
   * @returns
   */
  private itemAlreadyExist(newItem) {
    let alreadyExist = false;
    if (!newItem.value?.item) { newItem = this.newItemFormatter(newItem) }
    this.itemQueue.getValue()?.forEach(oldItem => {
      const labelIsSame = this.isSame(oldItem.item, newItem.label);
      const brandIsSame = this.isSame(oldItem.brand, newItem.value.brand);
      const ctg1IsSame = this.isSame(oldItem.ctg1 ? oldItem.ctg1 : '', newItem.value.ctg1);
      const ctg2IsSame = this.isSame(oldItem.ctg2 ? oldItem.ctg2 : '', newItem.value.ctg2);
      const ctg3IsSame = this.isSame(oldItem.ctg3 ? oldItem.ctg3 : '', newItem.value.ctg3);
      const eccnIsSame = this.isSame(oldItem.eccn ? oldItem.eccn : '', newItem.value.eccn ? newItem.value.eccn : '');
      const deductIsSame = this.isSame(oldItem.isDeduct, newItem.value.isDeduct);
      const qtyIsSame = this.isSame(oldItem.qty, newItem.value.qty);
      const isOriginItem = ((oldItem.productCode === newItem.productCode) && (newItem.oldName !== oldItem.item))
      if (((labelIsSame && brandIsSame && ctg1IsSame && ctg2IsSame && ctg3IsSame && eccnIsSame && deductIsSame && qtyIsSame) || (isOriginItem))) { alreadyExist = true; }
    })
    return alreadyExist;
  }

  private newItemFormatter(a) {
    if (a.value) {
      return {
        label: a.item || a.label,
        value: a.value
      }
    } else {
      return {
        label: a.item || a.label,
        value: a
      }
    }

  }

  private isSame(a, b) {
    if (a == undefined || a == null || a === 0) { a = '' };
    if (b == undefined || a == null || a === 0) { b = '' };
    if (a == b) {
      return true;
    } else {
      return false;
    }
  }

  private getDefaultDataSetting(canEdit: boolean = false, disabledSelect: boolean = false) {
    return {
      isSelectMode: this.enableSelection ,
      isDeleteMode: !disabledSelect && canEdit,
      isShowNoDataInfo: true,
      isAddMode: false,
      isForceShowTable: false,
      isPaginationMode: false,
      isEditedMode: canEdit,
      isScrollable: true,
      isFuzzySearchMode: true,
      isColSelectorMode: true,
      isSortMode: true,
      noDataConText: this.soaCommonService.currentRole === 'Applyer' ? this.translateService.instant('LicenseMgmt.Common.Hint.AddProductFirst') : ' ',
    };
  }

}
