import { DateInputHandlerService } from './../../../../core/services/date-input-handler.service';
import { Component, EventEmitter, Input, isDevMode, OnChanges, OnInit, Output } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { TranslateService } from '@ngx-translate/core';
import { lastValueFrom } from 'rxjs';
import { AuthApiService } from 'src/app/core/services/auth-api.service';
import { SelectorItemType } from "src/app/core/enums/selector-item-type";
import { CommonApiService } from 'src/app/core/services/common-api.service';
import { UserContextService } from 'src/app/core/services/user-context.service';
import { LicenseControlApiService } from 'src/app/core/services/license-control-api.service';
import { ToastService } from 'src/app/core/services/toast.service';
import { LoaderService } from 'src/app/core/services/loader.service';
import { ResponseCodeEnum } from 'src/app/core/enums/ResponseCodeEnum';
import { AmSoaMtnDialogService } from './am-soa-mtn-dialog.service';
import { SelectItem } from 'primeng/api';
import { SoaLicenseMtnBean } from './soa-license-mtn-bean';
import { SoaLicenseMtnModifyRequest } from './soa-license-mtn-modify-request';

@Component({
  selector: 'app-am-soa-mtn-dialog',
  templateUrl: './am-soa-mtn-dialog.component.html',
  styleUrls: ['./am-soa-mtn-dialog.component.scss']
})
export class AmSoaMtnDialogComponent implements OnInit, OnChanges {
  @Input() editObj: any;
  @Input() showDialog: boolean = false;
  @Output() saveEmitter = new EventEmitter<any>();
  @Output() closeDialog = new EventEmitter<any>();

  formGroup: FormGroup;
  curSelectType: any;
  selectorDialogParams: any;
  minDate: any;
  isSubmitted: boolean = false;
  initFinish = false;

  dropdownOptions = {
    group: [],
    cv: ['Customer', 'Vendor'],
    flag: [
      { "label": "Y", "value": "Y" },
      { "label": "N", "value": "N" }
    ],
    quantity: [
      { label: 'Y', value: 'Y', },
      { label: 'N', value: 'N', }
    ],
    origin: [
      { label: '正本', value: 'Y', },
      { label: '副本', value: 'N', }
    ],
    oOuList: []
  }

  get dialogHeader(){
    return this.translateService.instant(this.isAddMode ? 'Button.Label.Add' : 'Button.Label.Modify') + this.translateService.instant('SoaLicenseMtn.PageTitle');
  }

  get isAddMode() {
    return !!!this.editObj;
  }

  get isEditMode() {
    return !!this.editObj
  }

  constructor(
    private authApiService: AuthApiService,
    private formBuilder: FormBuilder,
    private translateService: TranslateService,
    private commonApiService: CommonApiService,
    private userContextService: UserContextService,
    private licenseControlApiService: LicenseControlApiService,
    private loaderService: LoaderService,
    private toastService: ToastService,
    private amSoaMtnDialogService: AmSoaMtnDialogService,
    private dateInputHandlerService:DateInputHandlerService
  ) { }

  ngOnInit(): void {
    this.subscribeLangChange();
  }

  ngOnChanges(): void {
    this.initData();
  }

  subscribeLangChange() {
    this.translateService.onLangChange.subscribe(() => {
      this.eccnListOptions[0] = {label:`${this.translateService.instant('Input.PlaceHolder.PleaseSelect')}`,value:''};
    });
  } // 訂閱語言變換

  eccnListOptions = [];

  async initData() {

    // init eccnOptions
    this.eccnListOptions = [{label:`${this.translateService.instant('Input.PlaceHolder.PleaseSelect')}`,value:''}];
    const eccnListRes = await lastValueFrom( this.licenseControlApiService.getECCNList())
    eccnListRes.eccnList?.forEach(eccn => { this.eccnListOptions.push({ label: eccn, value: eccn })});


    if (this.editObj) {
      const dataWithoutNullValue = JSON.parse(JSON.stringify(this.editObj));
      Object.keys(dataWithoutNullValue).forEach(k => (!dataWithoutNullValue[k] && dataWithoutNullValue[k] !== undefined) && delete dataWithoutNullValue[k]);
      isDevMode() && console.log('傳入資料', dataWithoutNullValue);
    }

    this.isSubmitted = false;

    await this.initGroupOptions();

    this.formGroup = this.editObj
      ? this.formBuilder.group(this.amSoaMtnDialogService.getRecoverTemplate(this.editObj))
      : this.formBuilder.group(this.amSoaMtnDialogService.getAddTemplate())
    this.minDate = new Date(this.formGroup.get('startDate').value);

    if (this.editObj?.productCode === '0'){ this.setOptions(); }

    if (this.isEditMode) { await this.recoverGroupInfo(); }

    this.subscribeFormGroupChange();
  }

  subscribeFormGroupChange() {
    // item change
    this.formGroup.get('item').valueChanges.subscribe(val => {
      if (val !== 'ALL ITEM') {
        const qty = this.formGroup.get('applyQty').value;
        this.formGroup.get('quantity').enable();
        this.formGroup.get('applyQty').enable();
        this.formGroup.get('applyQty').setValue(qty);
      }
    });

    this.formGroup.get('brand').valueChanges.subscribe(val => {
      const qty = this.formGroup.get('applyQty').value;
      this.formGroup.get('quantity').enable();
      this.formGroup.get('applyQty').enable();
      this.formGroup.get('applyQty').setValue(qty);
    });

    this.formGroup.get('eccn').valueChanges.subscribe(val => {
      if (val){
        const qty = this.formGroup.get('applyQty').value;
        this.formGroup.get('quantity').enable();
        this.formGroup.get('applyQty').enable();
        this.formGroup.get('applyQty').setValue(qty);
      }else{
        this.formGroup.get('quantity').setValue('N');
        this.formGroup.get('applyQty').setValue(0);
        this.formGroup.get('quantity').disable();
        this.formGroup.get('applyQty').disable();
      }
    });

    // 扣量 change
    this.formGroup.get('quantity').valueChanges.subscribe(val => {
      this.formGroup.get('applyQty').setValue(0);

      if (val === 'Y') { this.formGroup.get('applyQty').enable(); }
      else if (val === 'N') { this.formGroup.get('applyQty').disable(); }
    });
  }

  onHideDetailDialog() {
    this.closeDialog.emit(true);
  }

  async saveOnClick() {
    isDevMode() && console.log(this.getModifyModel())
    this.isSubmitted = true;
    if (!this.submitCheckPass()) { return; }

    const model = this.getModifyModel();
    isDevMode() && console.log(model)

    await lastValueFrom(this.licenseControlApiService.licenseMasterSoaModify(model)).then(rsp => {
      if (rsp.code === ResponseCodeEnum.LICENSEMASTER_ALREADY_EXISTS) { return this.toastService.error('ImpExpLicenseMtn.Message.LicenseMasterExists'); }

      this.editObj
      ? this.toastService.success('LicenseMgmt.Common.Hint.EditSuccess')
      : this.toastService.success('LicenseMgmt.Common.Hint.CreateSuccess')

      this.onHideDetailDialog();
      this.saveEmitter.emit(model);
    }).catch(err => {
      console.log(err);
      err?.status == 500 && err.error?.code ? this.toastService.error(err.error?.message) : this.toastService.error('System.Message.Error');
    }).finally(() => {
      this.loaderService.hide();
    })

  }

  originOnChange() {
    this.formGroup.get('startDate').setValue(new Date(new Date().setHours(0, 0, 0, 0)));
    const isOrigin = this.formGroup.get('isOrigin').value === 'Y';
    isOrigin
      ? this.formGroup.get('endDate').setValue(new Date('2400-12-31'))
      : this.formGroup.get('endDate').setValue(this.amSoaMtnDialogService.addDays(new Date(), 7, 'D'))
  }

  /**
   * Group 下拉選單值切換
   * @param e
   * @returns
   */
  async onChangeGroup(e: any) {
    if (!this.formGroup.get('group').value) { return; }
    // set order ou options
    const all = { label: 'ALL', value: { ouCode: 0, ouShortName: "ALL", tenant: "ALL" } };
    this.dropdownOptions.oOuList = [all];

    // 取得oOuList清單
    const ouRes = await lastValueFrom(this.authApiService.getOUInfoByOUGroup(this.formGroup.get('group').value.groupCode))
    ouRes?.body?.ouList.forEach(ou => {
      this.dropdownOptions.oOuList.push({ label: ou.ouShortName, value: ou });
    });

    // reset oOuList
    if (this.formGroup.get('oOuCode')?.value?.ouCode !== '0') { this.formGroup.get('oOuCode').setValue(null); }

    // 如果只有一筆資料，就當預設
    if (this.dropdownOptions.oOuList.length === 1) { this.formGroup.get('oOuCode').setValue(this.dropdownOptions.oOuList[0].value) }
  }

  /**
   * 恢復Group 跟 OuGroup
   */
  async recoverGroupInfo() {
    const group = this.dropdownOptions.group.filter(item => { return item.value?.groupName === this.editObj.ouGroup }) || [''];
    this.formGroup.get('group').setValue(group[0]?.value || this.dropdownOptions.group[1].value);

    await this.onChangeGroup(null);  // 取得oOuList

    this.dropdownOptions.oOuList.forEach(ou => {
      if (ou.value.ouShortName == this.editObj.ouName) { this.formGroup.get('oOuCode').setValue(ou.value) }
    });

  }

  /**
   * cv Type選取後行為
   */
  cvTypeOnChange() {
    this.formGroup.get('vcName').setValue(null);
  }


  /**
   * start Date選取後行為
   */
  onStartDataSelectEvent(): void {
    this.formGroup.get('endDate').setValue(null);
    this.minDate = new Date(this.formGroup.get('startDate').value) > new Date() ? new Date(this.formGroup.get('startDate').value) : new Date();
  }

  /**
   * 選擇OU / oOu / customer / vendor
   *
   * @param type
   */
  onOpenSelectorDialogEvent(type: string): void {
    this.curSelectType = type.toLowerCase();
    const titlePrefix: string = this.translateService.currentLang == 'zh-tw' ? '選擇' : 'Choose';

    if (this.curSelectType == SelectorItemType.OOU) { this.showSelectorDialog(`${titlePrefix} ${this.translateService.instant('SoaLicenseMtn.Label.OOuCode')}`, SelectorItemType.ALLOOU_ALL) }
    else if (this.curSelectType == SelectorItemType.OU) { this.showSelectorDialog(`${titlePrefix} ${this.translateService.instant('SoaLicenseMtn.Label.OuCode')}`, SelectorItemType.ALLOU_ALL) }
    else if (this.curSelectType == SelectorItemType.ITEM) { this.showSelectorDialog(`${this.translateService.instant('Dialog.Header.Choose')} Item`, SelectorItemType.ITEM) }
    else if (this.curSelectType == SelectorItemType.BRAND_WITHOUT_ALL) { this.showSelectorDialog(`${this.translateService.instant('Dialog.Header.Choose')} Brand`, SelectorItemType.BRAND_WITHOUT_ALL)}
    else {
      if (this.formGroup.get('vcType').value === 'Customer') { this.showSelectorDialog(`${titlePrefix} Customer`, SelectorItemType.ALLCUSTOMER) }
      if (this.formGroup.get('vcType').value === 'Vendor') { this.showSelectorDialog(`${titlePrefix} Vendor`, SelectorItemType.ALLVENDOR) };
    }
  }

  /**
   * 選擇OU / oOu / customer / vendor 後 Dialog回傳
   * @param e
   */
  onSelectorDialogCallback(e) {
    if (this.curSelectType == SelectorItemType.OOU) { this.oOuSelectedHandler(e); }
    else if (this.curSelectType == SelectorItemType.ITEM) { this.itemSelectedHandler(e); }
    else if (this.curSelectType == SelectorItemType.CUSTOMER || this.curSelectType == SelectorItemType.VENDOR) { this.cvSelectHandler(e); }
    else if (this.curSelectType == SelectorItemType.BRAND_WITHOUT_ALL) { this.brandSelectedHandler(e); }
  }

  private oOuSelectedHandler(e) {
    this.formGroup.get('oOuCode').setValue(e.value.ouShortName);
  }

  private async itemSelectedHandler(e: any) {
    this.formGroup.get('itemInfo').setValue(e);
    this.formGroup.get('item').setValue(e.label);
    this.formGroup.get('brand').setValue(e.value?.brand);
    this.formGroup.get('ctg1').setValue(e.value?.ctg1);
    this.formGroup.get('ctg2').setValue(e.value?.ctg2);
    this.formGroup.get('ctg3').setValue(e.value?.ctg3);

    let invItemNos = [];
    invItemNos.push(e.value.invItemNo);

    let rsp = await lastValueFrom(this.commonApiService.queryItemMasterByInvItemNos(invItemNos));
    let itemMasterList = rsp.itemMasterList;
    if (itemMasterList !== undefined && itemMasterList.length > 0) {
      this.formGroup.get('eccn').setValue(itemMasterList[0]?.eccn ? itemMasterList[0].eccn : '');
      this.formGroup.get('ccats').setValue(itemMasterList[0]?.ccats ? itemMasterList[0].ccats : '');
      this.formGroup.get('proviso').setValue(itemMasterList[0]?.proviso ? itemMasterList[0].proviso : '');
    }
  }

  private cvSelectHandler(e) {
    this.formGroup.get('vcInfo').setValue(e);
    this.formGroup.get('vcName').setValue(e.label);
  }

  private showSelectorDialog(title: string, searchType: SelectorItemType) {
    this.selectorDialogParams = { title: title, type: searchType, visiable: true, };
  }

  private getModifyModel() {
    let isOrigin = this.formGroup.get('isOrigin').value;
    if (isOrigin === '正本') { isOrigin = 'Y' }
    else if (isOrigin === '副本') { isOrigin = 'N' }

    let modifyReq = new SoaLicenseMtnModifyRequest();
    modifyReq.action = this.isAddMode ? 'ADD' : 'EDIT';
    modifyReq.userEmail = this.userContextService.user$.getValue().userEmail;
    modifyReq.tenant = this.userContextService.user$.getValue().tenant;
    modifyReq.detail = new SoaLicenseMtnBean();
    modifyReq.detail.tenant = this.userContextService.user$.getValue().tenant;

    modifyReq.detail.vcNo = this.formGroup.get('vcInfo').value.value?.customerNo || this.formGroup.get('vcInfo').value.value?.vendorCode || this.editObj?.vcNo;
    modifyReq.detail.vcName = this.formGroup.get('vcInfo').value.value?.customerName || this.formGroup.get('vcInfo').value.value?.vendorName || this.editObj?.vcName;
    modifyReq.detail.vcNameE = this.formGroup.get('vcInfo').value.value?.customerNameEg || this.formGroup.get('vcInfo').value.value?.vendorEngName || this.editObj?.vcNameE;
    modifyReq.detail.ieType = 'E';
    modifyReq.detail.vcType = this.formGroup.get('vcType').value.substring(0, 1) || this.editObj?.vcType;
    modifyReq.detail.startDate = new Date(this.formGroup.get('startDate').value).getTime();
    modifyReq.detail.endDate = new Date(this.formGroup.get('endDate').value).getTime();
    modifyReq.detail.remark = this.formGroup.get('remark')?.value;
    modifyReq.detail.isOriginal = isOrigin;
    modifyReq.detail.activeFlag = this.formGroup.get('flag').value;
    modifyReq.detail.licenseNo = this.formGroup.get('license').value;
    modifyReq.detail.brand = this.formGroup.get('brand').value;
    modifyReq.detail.ctg1 = this.formGroup.get('ctg1').value;
    modifyReq.detail.ctg2 = this.formGroup.get('ctg2').value;
    modifyReq.detail.ctg3 = this.formGroup.get('ctg3').value;
    modifyReq.detail.eccn = this.formGroup.get('eccn').value;
    modifyReq.detail.specialApproval = this.formGroup.get('specialApproval').value;

    if (this.isAddMode) {
      modifyReq.detail.addOu = {
        groupCode: this.formGroup.get('group')?.value?.groupCode === 'ALL' ? 0 : this.formGroup.get('group').value.groupCode,
        groupName: this.formGroup.get('group')?.value?.groupName,
        ouCode: this.formGroup.get('oOuCode')?.value?.ouCode === 'ALL' ? 0 :  this.formGroup.get('oOuCode').value.ouCode,
        ouShortName: this.formGroup.get('oOuCode')?.value?.ouShortName
      }
    }

    if (this.isEditMode){
      modifyReq.detail.seq = this.editObj.seq;
    }

    modifyReq.detail.productCode = this.formGroup.get('itemInfo').value?.value?.invItemNo || this.editObj?.productCode;
    modifyReq.detail.quantityFlag = this.formGroup.get('quantity').value;
    modifyReq.detail.quantity = this.formGroup.get('applyQty').value

    return modifyReq;
  }

  /**
   * 初始化Group下拉選項
   *
   */
  private async initGroupOptions() {
    this.dropdownOptions.group = [{
      label: this.translateService.instant('Input.PlaceHolder.PleaseSelect'),
      value: null
    }];

    let rsp = await lastValueFrom(this.authApiService.groupQuery());
    for (let group of rsp.groupList) {
      this.dropdownOptions.group.push({
        label: group.groupName,
        value: group
      });
    }
  }

  private submitCheckPass() {
    if (this.formGroup.get('quantity').value === 'Y' && (this.formGroup.get('applyQty').value < 1)) {
      return false;
    }

    return this.formGroup.status !== "INVALID";
  }

  get isAllItem(){
    const isAllItem = this.formGroup.get('item')?.value === 'All Item' || this.formGroup.get('productCode')?.value === '0';
    return isAllItem;
  }

  get isAllItemWithBrandOrEccn(){
    const brandIsEmpty = !this.formGroup.get('brand')?.value;
    const eccnIsEmpty = !this.formGroup.get('eccn')?.value;
    const isAllItem = this.formGroup.get('item')?.value === 'All Item' || this.formGroup.get('productCode')?.value === '0';
    return isAllItem && (brandIsEmpty || eccnIsEmpty);
  }


  private async brandSelectedHandler(e: any) {
    this.formGroup.get('brand').setValue(e.label);
    this.formGroup.get('ctg1').setValue('');
    this.formGroup.get('ctg2').setValue('');
    this.formGroup.get('ctg3').setValue('');

    this.ctg2Options = [];
    this.ctg3Options = [];

    // 設定ctg1下拉選單選項
    this.setCtg1Options();
  }

  ctg1Options: SelectItem[] = [];
  ctg2Options: SelectItem[] = [];
  ctg3Options: SelectItem[] = [];

  async ctg1OnChange(){
    this.formGroup.get('ctg2').setValue('');
    this.formGroup.get('ctg3').setValue('');
    this.ctg2Options = [];
    this.ctg3Options = [];
    if (!this.formGroup.get('ctg1').value){return;}
    // 設定ctg2下拉選單選項
    this.setCtg2Options();
  }

  async ctg2OnChange(){
    this.formGroup.get('ctg3').setValue('');
    this.ctg3Options = [];
    if (!this.formGroup.get('ctg2').value){return;}
    // 設定ctg2下拉選單選項
    this.setCtg3Options();
  }

  async setCtg1Options(){
    return new Promise(async (resolve, reject) => {
      const model = {
        "brand": this.formGroup.get('brand').value
      }
      let OptionRes = await lastValueFrom(this.commonApiService.queryBrandCtg(model));
      OptionRes.brandList = OptionRes.brandList?.filter(item => item.ctg1 !== ''); // 如果沒資料就清除 免得顯示empty
      OptionRes.brandList.unshift({ctg1:'',value:'All',label:''}) // 補上選項
      this.ctg1Options = this.processToSelectOptions(OptionRes.brandList?.map(item => item.ctg1).filter(item => item !== undefined));

      resolve(this.ctg1Options)
    })
  }

  async setCtg2Options(){
    if (this.ctg1Options.length === 1){return;}
    return new Promise(async (resolve, reject) => {
      const model = {
        "brand": this.formGroup.get('brand').value,
        "ctg1":this.formGroup.get('ctg1').value
      }
      let OptionRes = await lastValueFrom(this.commonApiService.queryBrandCtg(model));
      OptionRes.brandList = OptionRes.brandList?.filter(item => item.ctg2 !== ''); // 如果沒資料就清除 免得顯示empty
      OptionRes.brandList.unshift({ctg2:'',value:'All',label:''}) // 補上選項
      this.ctg2Options = this.processToSelectOptions(OptionRes.brandList?.map(item => item.ctg2).filter(item => item !== undefined));

      resolve(this.ctg2Options)
    })
  }

  async setCtg3Options(){
    if (this.ctg2Options.length === 1){return;}
    return new Promise(async (resolve, reject) => {
      const model = {
        "brand": this.formGroup.get('brand').value,
        "ctg1":this.formGroup.get('ctg1').value,
        "ctg2":this.formGroup.get('ctg2').value
      }
      let OptionRes = await lastValueFrom(this.commonApiService.queryBrandCtg(model));
      OptionRes.brandList = OptionRes.brandList?.filter(item => item.ctg3 !== ''); // 如果沒資料就清除 免得顯示empty
      OptionRes.brandList.unshift({ctg3:'',value:'All',label:''}) // 補上選項
      this.ctg3Options = this.processToSelectOptions(OptionRes.brandList?.map(item => item.ctg3).filter(item => item !== undefined));

      resolve(this.ctg3Options)
    })
  }

  showSpinner = false;
  async setOptions(){
    this.showSpinner = true;
    await this.setCtg1Options();
    await this.setCtg2Options();
    await this.setCtg3Options();
    this.showSpinner = false;
  }

  private processToSelectOptions(data){
    let newOptions = [];
    data.forEach(item=>{
      newOptions.push({ label: item, value: item});
    })
    return newOptions;
  }

  //#-----------------start------------------
  //# for date picker input format event
  onCheckDateHandler(): void {
    if (
      new Date(
        new Date(this.formGroup.controls.startDate.value).setHours(0, 0, 0, 0)
      ).getTime() >=
      new Date(
        new Date(this.formGroup.controls.endDate.value).setHours(23, 59, 59, 0)
      ).getTime()
    ) {
      this.formGroup.controls.endDate.setValue(null);
    }
  }

  onDatePickerInput(event: InputEvent): void {
    this.dateInputHandlerService.concat(event.data);
  }

  onDatePickerSelectAndBlur(): void {
    this.dateInputHandlerService.clean();
  }

  onDatePickerClose(key: string): void {
    this.formGroup.controls[key].setValue(
      this.dateInputHandlerService.getDate() ??
        this.formGroup.controls[key].value
    );
    this.dateInputHandlerService.clean();
  }
  //#------------------end------------------
}
