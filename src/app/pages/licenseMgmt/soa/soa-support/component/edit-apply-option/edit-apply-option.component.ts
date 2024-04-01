import { DateInputHandlerService } from './../../../../../../core/services/date-input-handler.service';
import { Component, EventEmitter, Input, isDevMode, OnChanges, OnDestroy, OnInit, Output, SimpleChanges } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { SelectItem } from 'primeng/api';
import { Subscription } from 'rxjs';
import { SelectorDialogParams } from 'src/app/core/model/selector-dialog-params';
import { VenCusInfo } from 'src/app/core/model/ven-cus-info';
import { RuleSetupService } from 'src/app/core/services/rule-setup.service';
import { SoaCommonService } from '../../../soa-common.service';
import { lastValueFrom } from 'rxjs';
import { AuthApiService } from 'src/app/core/services/auth-api.service';
import { DocCols, GroupType, SpecialApprovalOptions } from '../soa-import-ou/soa-import-ou-const';
import { SoaApiService } from 'src/app/core/services/soa-api.service';

@Component({
  selector: 'app-edit-apply-option',
  templateUrl: './edit-apply-option.component.html',
  styleUrls: ['./edit-apply-option.component.scss']
})
export class EditApplyOptionComponent implements OnInit, OnDestroy, OnChanges {
  @Input() ouRefer: any;
  @Output() applyInfoEmmiter = new EventEmitter<any>();
  @Output() ouInfoEmmiter = new EventEmitter<any>();

  private onLangChange$: Subscription;

  applyInfo: any = {
    docAreaValue: '',
    docAreaLabel:'',
    docAreaMap: [], // 正本歸檔區域選項

    IEtypeValue: 'Export',
    IEtypeMap: ['Export', 'Import'],

    cvValue: {
      type: 'Customer',
      data: {
        label: null,
        value: {
          vendorCode: null,
          vendorName: null,
          customerNo: null,
          customerName: null,
          customerNameEg: null
        }
      }
    },
    cvMap: ['Customer', 'Vendor'],
    startDate: '',
    endDate: '',
    remarkInfo: '',

    specialApprovalMap:SpecialApprovalOptions,
    specialApprovalValue:'N',
  }

  ouInfo: any = {
    docMap: DocCols,
    docValue: 'Y',//'Y' | 'N'

    groupTypeMap: GroupType,
    groupTypeValue: 'ALL Group', // 'Group OU' | 'OU' | 'ALL Group'

    ouSelectedValueCheckbox: [], // type = Group OU 時 extend選項 為checkbox;
    ouSelectedValueRadio: [], // type = OU 時 extend選項 為 radiobtn;
    ouSubSelectedValue: [],// type = OU 時 ， 選擇了某項radiobtn 會展開ou的checkbox ， 此為ou checkbox的選項

    ouMainList: [], // Group OU清單
    ouSubList: [], // Group OU下的OU清單
  }

  selectorDialogParams!: SelectorDialogParams;
  constructor(
    private translateService: TranslateService,
    private ruleSetupService: RuleSetupService,
    public soaCommonService: SoaCommonService,
    private authApiService: AuthApiService,
    private soaApiService: SoaApiService,
    private dateInputHandlerService:DateInputHandlerService
  ) { }

  get vcType() {
    return this.translateService.instant('SOA.Label.' + this.applyInfo.cvValue.type);
  }

  get groupSelectDisabled() {
    return (this.soaCommonService.currentRole !== 'Applyer') && (this.soaCommonService.currentRole !== 'TCSU');
  }

  get docAreaDisabled(){
    return (this.soaCommonService.currentRole !== 'Applyer') && (this.soaCommonService.currentRole !== 'TCSU')
  }

  get specialApprovalDisabled(){
    return (this.soaCommonService.currentRole !== 'Legal') && (this.soaCommonService.currentRole !== 'TCSU')
  }

  ngOnInit(): void {
    this.initData();
    this.subscribeLangChange();
    this.getAreaData();
    this.getDateData(this.ouRefer);
    this.recoverData();
    this.recoverDataOU();
  }

  ngOnChanges(changes: SimpleChanges): void {
    this.getDateData(this.ouRefer);
  }

  ngOnDestroy(): void {
    this.onLangChange$?.unsubscribe();
  }

  recoverData() {
    if (this.soaCommonService.curState !== 'Apply') {
      const rsp = this.soaCommonService.getSOAFormData();
      this.applyInfo.docAreaValue = rsp.area;

      this.soaCommonService.docArea.ruleList?.forEach(area => {
         if (rsp.area === area.ruleCode){
          this.applyInfo.docAreaLabel =   this.translateService.currentLang === 'zh-tw' ? area.rulesCategoryRuleItemCn : area.rulesCategoryRuleItemEn
         }
      });

      rsp.ieType === 'I' ? this.applyInfo.IEtypeValue = "Import" : this.applyInfo.IEtypeValue = "Export";
      rsp.vcType === 'V' ? this.applyInfo.cvValue.type = "Vendor" : this.applyInfo.cvValue.type = "Customer";

      if (rsp.vcCode && rsp.vcNameC && rsp.vcNameE) { this.applyInfo.cvValue.data.label = `${rsp.vcCode} - ${rsp.vcNameC} (${rsp.vcNameE})`; }
      else { this.applyInfo.cvValue.data.label = ''; }

      this.applyInfo.startDate = new Date(rsp.startDate);
      this.applyInfo.endDate = new Date(rsp.endDate);
      this.applyInfo.remarkInfo = rsp.memo;

      this.applyInfo.cvValue.data.value.vendorCode = rsp.vcCode;  // 公司代號
      this.applyInfo.cvValue.data.value.vendorName = rsp.vcNameC; // 公司名稱
      this.applyInfo.cvValue.data.value.customerNo = rsp.vcCode;  // 客戶代碼
      this.applyInfo.cvValue.data.value.customerName = rsp.vcNameC;  // 客戶中文名稱
      this.applyInfo.cvValue.data.value.customerNameEg = rsp.vcNameE; // 客戶英文名稱
      this.applyInfo.specialApprovalValue = rsp.specialApproval ?? 'N';

      this.applyInfoEmmiter.emit(this.applyInfo);
    }
  }

  subscribeLangChange() {
    this.onLangChange$ = this.translateService.onLangChange.subscribe(() => {
      this.setAreaText();
    })
  }

  /**
   * 透過API取得歸檔區域資訊
   */
  getAreaData() {
    if (this.soaCommonService.currentState === 'Apply') {
      this.applyInfo.docAreaValue = this.soaCommonService.docArea.ruleList[0]?.ruleCode
    }
    this.setAreaText();
    this.applyInfoEmmiter.emit(this.applyInfo);
  }

  /**
   * 透過API取得 有效日期 與 失效日期
   *
   * @param docIsOrigin
   * @returns
   */
  getDateData(docIsOrigin: 'Y' | 'N') {
    if (this.soaCommonService.currentRole !== 'Applyer') { return; }
    if (!docIsOrigin) { return; }
    let model;
    if (docIsOrigin === 'Y') {
      model = {
        "tenant": "WPG",
        "msgFrom": "SOAForm",
        "trackingId": "SOAOriginalPeriod",
        "tenantPermissionList": [
          "WPG"
        ],
        "ruleId": "SOAOriginalPeriod"
      }
    } else if (docIsOrigin === 'N') {
      model = {
        "tenant": "WPG",
        "msgFrom": "SOAForm",
        "trackingId": "SOAPeriod",
        "tenantPermissionList": [
          "WPG"
        ],
        "ruleId": "SOAPeriod"
      }
    }

    this.ruleSetupService.queryRuleSetup(model).subscribe({
      next: (rsp) => {
        this.applyInfo.startDate = new Date(new Date().setHours(0, 0, 0, 0));

        if (rsp.ruleList[0].ruleCode === 'F') {
          const defaultEndDate = rsp.ruleList[0].ruleVal.split('-'); // ex.2400-12-31
          this.applyInfo.endDate = new Date(defaultEndDate[0], defaultEndDate[1] - 1, defaultEndDate[2], 12);
        } else {
          this.applyInfo.endDate = this.addDays(new Date(), rsp.ruleList[0].ruleVal, rsp.ruleList[0].ruleCode);
        }

        this.applyInfoEmmiter.emit(this.applyInfo);
      },
      error: (rsp) => { console.debug(rsp || 'error'); },
    })
  }

  cvTypeOnChange() {
    this.applyInfo.cvValue.data = null;
    this.applyInfoEmmiter.emit(this.applyInfo);
  }

  /**
   * 廠商名單被點擊
   */
  cvSelectDialogOnOpen(): void {
    this.selectorDialogParams = {
      title: `${this.translateService.instant('Dialog.Header.Choose')} ${this.applyInfo.cvValue.type}`,
      type: this.applyInfo.cvValue.type.toLowerCase(),
      visiable: true,
    };
  }

  /**
   * 廠商名單回傳
   *
   * @param result
   */
  onSelectorDialogCallback(result: SelectItem<VenCusInfo>): void {
    this.applyInfo.cvValue.data = result;
    this.emitApplyInfo();
  }

  emitApplyInfo() {
    this.applyInfoEmmiter.emit(this.applyInfo)
  }

  private setAreaText() {
    this.applyInfo.docAreaMap = [];

    this.soaCommonService.docArea.ruleList?.forEach(area => {
      const itemByCurrentLang = {
        label: this.translateService.currentLang === 'zh-tw' ? area.rulesCategoryRuleItemCn : area.rulesCategoryRuleItemEn,
        value: area.ruleCode
      }
      this.applyInfo.docAreaMap.push(itemByCurrentLang);

      if (this.applyInfo.docAreaValue === area.ruleCode){
        this.applyInfo.docAreaLabel = this.translateService.currentLang === 'zh-tw' ? area.rulesCategoryRuleItemCn : area.rulesCategoryRuleItemEn
       }
    });
  }

  private addDays(date, days, mode: 'Y' | 'D') {
    const day = mode === 'Y' ? +days * 365 : +days
    const targetDate = new Date();
    targetDate.setDate(date.getDate() + day);
    return targetDate;
  }

  // 以下為OU相關 (正副本 / Group Type)

  emitOuInfo() {
    this.ouInfoEmmiter.emit(this.ouInfo);
  }

  typeOUGroupOUChange() {
    this.OUAll = [true];
    this.emitOuInfo();
  }

  async recoverDataOU() {
    if (this.soaCommonService.currentState === 'Apply') { 
      if (this.soaCommonService.userOu){
        this.ouInfo.groupTypeValue = 'Group OU';
        const curOuCode = this.soaCommonService.groupQueryRes.groupList?.filter(group => 
          { return group.groupName === this.soaCommonService.userOu });
        this.ouInfo.ouSelectedValueCheckbox.push(curOuCode[0].groupCode);
      }
      return; 
    }
    const rsp = this.soaCommonService.getSOAFormData();
    this.ouInfo.docValue = rsp.isOriginal;
    if (rsp.ouType === 'GroupOU') {
      this.ouInfo.groupTypeValue = 'Group OU';
      rsp.groupDatas?.forEach(ou => {
        if (ou.groupName !== '0') { // ALL GROUP會回傳一個0
          this.ouInfo.ouSelectedValueCheckbox.push(ou.groupCode);
        }
      });

      const groupQueryRes = this.soaCommonService.groupQueryRes;
      const ouMainList = groupQueryRes.groupList?.filter(group => { return group.groupName !== 'ALL' });
      if (ouMainList.length === this.ouInfo.ouSelectedValueCheckbox.length) { this.groupOUAll = [true] }
    }
    else if (rsp.ouType === 'OU') {
      if (rsp.groupDatas[0].groupName !== '0') { // ALL GROUP會回傳一個0
        this.ouInfo.ouSelectedValueRadio = rsp.groupDatas[0].groupCode;
      }
      this.ouInfo.groupTypeValue = 'OU';
      await this.getOUbyGroup();
      this.ouInfo.ouSubSelectedValue = rsp.groupDatas[0].ouList.map(item => { return item });

      if (this.ouInfo.ouSubSelectedValue.length === this.ouInfo.ouSubList.length) { this.OUAll = [true]; }
    }
    else if (rsp.ouType === 'ALL') {
      this.ouInfo.groupTypeValue = 'Group';
    }
  }

  async initData() {
    // 取得Group OU清單
    const groupQueryRes = this.soaCommonService.groupQueryRes;
    this.ouInfo.ouMainList = groupQueryRes.groupList?.filter(group => { return group.groupName !== 'ALL' });
    this.ouInfoEmmiter.emit(this.ouInfo);
  }

  async getOUbyGroup() {
    // reset
    this.ouInfo.ouSubList = [];
    this.ouInfo.ouSubSelectedValue = [];
    // 取得 Group OU底下的OU清單
    // const ouRes = await lastValueFrom(this.authApiService.getOUInfoByOUGroup(this.ouInfo.ouSelectedValueRadio))
    const ouRes2 = await lastValueFrom(this.soaApiService.getOuGroup(this.ouInfo.ouSelectedValueRadio))

    this.ouInfo.ouSubList = ouRes2.ouList;
    this.ouInfo.ouSubList.forEach(ou => { this.ouInfo.ouSubSelectedValue.push(ou.ouCode) });
  }

  public groupOUAll = [];
  typeGroupOUAllOnClick() {
    this.ouInfo.ouSelectedValueCheckbox = [];
    if (this.groupOUAll.length > 0) {
      this.ouInfo.ouMainList.forEach(group => {
        this.ouInfo.ouSelectedValueCheckbox.push(group.groupCode);
      })
    }
  }

  public OUAll = [];
  typeOUAllOnClick() {
    this.ouInfo.ouSubSelectedValue = [];
    if (this.OUAll.length > 0) {
      this.ouInfo.ouSubList.forEach(ou => {
        this.ouInfo.ouSubSelectedValue.push(ou.ouCode);
      })
    }
  }

  //#-----------------start------------------
  //# for date picker input format event
  onCheckDateHandler(): void {
    if (
      new Date(
        new Date(this.applyInfo.startDate).setHours(0, 0, 0, 0)
      ).getTime() >=
      new Date(
        new Date(this.applyInfo.endDate).setHours(23, 59, 59, 0)
      ).getTime()
    ) {
      this.applyInfo.endDate = null;
    }
  }

  onDatePickerInput(event: InputEvent): void {
    this.dateInputHandlerService.concat(event.data);
  }

  onDatePickerSelectAndBlur(): void {
    this.dateInputHandlerService.clean();
  }

  onDatePickerClose(key: string): void {
    this.applyInfo = {
      ...this.applyInfo,
      [key]: this.dateInputHandlerService.getDate() ?? this.applyInfo[key],
    };
    this.applyInfoEmmiter.emit(this.applyInfo);
    this.dateInputHandlerService.clean();
  }
  //#------------------end------------------
}
