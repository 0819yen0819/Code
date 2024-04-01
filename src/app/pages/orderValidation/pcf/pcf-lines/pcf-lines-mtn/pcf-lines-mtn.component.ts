import { Component, EventEmitter, Input, OnChanges, OnInit, Output } from '@angular/core';
import { PCF_CONFIG_PRICE_LABEL, pcfMtnCols } from '../pcf-lines-const';
import { TranslateService } from '@ngx-translate/core';
import { SelectItem } from 'primeng/api';
import { CommonApiService } from 'src/app/core/services/common-api.service';
import { DialogSettingParams } from 'src/app/core/model/selector-dialog-params';
import { UserContextService } from 'src/app/core/services/user-context.service';
import { LoaderService } from 'src/app/core/services/loader.service';
import { lastValueFrom } from 'rxjs';
import { RuleSetupService } from 'src/app/core/services/rule-setup.service';

@Component({
  selector: 'app-pcf-lines-mtn',
  templateUrl: './pcf-lines-mtn.component.html',
  styleUrls: ['./pcf-lines-mtn.component.scss']
})
export class PcfLinesMtnComponent implements OnInit, OnChanges {
  @Input() data;
  @Output() linesMtnEvent = new EventEmitter<any>();

  tableCols;
  tableData = [];
  priceCols = PCF_CONFIG_PRICE_LABEL;

  nowDate = new Date();
  enableEdit = false;

  currencyOptions: SelectItem[] = []; // 幣別選項 
  controlFlagOptions: SelectItem[] = [];
  requireCols = []; // 必填欄位

  dialogTitle = ''; // 標題
  endCustomerOptions: any[] = [];   // end customer


  constructor(
    private translateService: TranslateService,
    private commonApiService: CommonApiService,
    private userContextService: UserContextService,
    private loaderService: LoaderService,
    private ruleSetupService: RuleSetupService
  ) { }

  ngOnInit(): void {
    this.initCurrencyOptions();
    this.initControlFlagOptions();
    this.translateService.onLangChange.subscribe(() => {
      this.initControlFlagOptions();
    })
  }

  ngOnChanges() {
    if (!this.data.data) { return; }
    // 1.為審核頁面/且在簽核名單中 才可啟用編輯 否則只能查看
    // 2.MAINTAIN_M-C  configVal1 必須是 Y line的SaleCostType 要符合 configVal2 的值 (canEditPriceMtn)
    // 3.SignType為 PM
    // 4.line必須為Approve 
    if (this.data.data) {
      this.enableEdit = this.editPermissionIsTrue();
      this.dialogTitle = `${this.translateService.instant('PriceControlForm.Label.Maintain')} ${this.data?.data?.salesCostTypeDash?.replace('.', '-')} ${this.translateService.instant('PriceControlForm.Label.Price')}`;
      this.initColumn();
      this.initData();
      this.filterEndCustomer({ query: '' });
    }
  }

  saveOnClick() {
    if (!this.checkFormValid()) { return };
    this.data.show = false;
    this.tableData[0].lastUpdatedBy = this.userContextService.user$.getValue().userEmail;
    this.tableData[0].lastUpdatedDate = new Date().getTime();
    this.linesMtnEvent.emit(this.tableData[0]);
  }

  startDateChange() {
    if (this.tableData[0].startDate > this.tableData[0].endDate) {
      this.tableData[0].endDate = null;
    }
  }

  filterEndCustomer(event) {
    this.loaderService.show();
    let filtered: any[] = [];
    let query = event.query;
    const request = {
      ouGroup: this.data.formInfo.ouGroup,
      ouCode: this.data.formInfo.ouCode,
      brand: this.data.data.brand,
      keyword: query
    };


    this.commonApiService.queryEndCustomer(request).subscribe(x => {
      for (let endCustomer of x.endCustomerList) {
        filtered.push({ label: endCustomer.endCustomerName, value: endCustomer.endCustomerName });
      }
      this.endCustomerOptions = filtered;
      this.loaderService.hide();
    })

  }

  worstSellingChange(){
    const isWsp = this.data.formInfo.formType === 'SO-M-C_WorstPrice'
    if (isWsp){
      this.tableData[0].salesCost = this.tableData[0].minSellingPrice
    }
  }

  /**
   * 初始化幣別選單
   */
  private initCurrencyOptions() {
    this.commonApiService.currencyCodeQueryByPrefix().subscribe(res => {
      const options: SelectItem[] = [];
      res.currencyLists.forEach(element => {
        options.push({
          label: element,
          value: element,
        })
      });
      this.currencyOptions = options;
    })
  }

  /**
   * 初始化 1-2 用的 Control Flag 選單
   * SaleCostType 1-2 
   * 註3：呼叫API common-service/service/v1/queryRuleSetup RuleId=M-CControlFlag選單顯示項目
   * (A.控小(SO Price < Worst Selling Price)、B.控大控小(SO Price <> Worst Selling Price)、N.無控管(No Control))使用Rule Code A/B/N傳入 DB及API
   */
  private initControlFlagOptions() {
    const model = {
      "tenant": "WPG",
      "msgFrom": "PriceControl",
      "trackingId": "M-CControlFlag",
      "tenantPermissionList": [
        "WPG"
      ],
      "ruleId": "M-CControlFlag"
    };
    lastValueFrom(this.ruleSetupService.queryRuleSetup(model)).then(res => {
      const curLang = this.translateService.currentLang;
      this.controlFlagOptions = res.ruleList
        .sort((a, b) => a.ordinal - b.ordinal)
        .map(element => ({
          label: curLang === 'zh-tw' ? element.rulesCategoryRuleItemCn : element.rulesCategoryRuleItemEn,
          value: element.ruleCode,
        }));
    })
  }

  /**
   * 驗證表單是否可送出
   * @returns 
   */
  private checkFormValid() {
    const isWsp = this.data.formInfo.formType === 'SO-M-C_WorstPrice'

    let msgArr = [];
    this.tableData.forEach((line, index) => {
      Object.keys(line).forEach(key => {
        if (this.requireCols.includes(key)) {
          if (!line[key] && (line[key] !== 0)) {
            const row = this.tableCols.filter(item => item.field === key); // 轉成 Label 而不是顯示 Field
            if (row[0]) { msgArr.push(row[0].label + this.translateService.instant('LicenseMgmt.Common.Hint.NotKeyIn')) }
          };
        }
      })
      if (line.worstSalesGP >= 1 || line.worstSalesGP < 0) {
        msgArr.push('Worst Sales GP% ' + this.translateService.instant('PriceControlForm.Msg.allowOnly0To1'));
      }

      if (isWsp){
        if(line.minSellingPrice < line.salesCost){
          msgArr.push(this.translateService.instant('PriceControlForm.Msg.LineMtnSellingPriceError'));
        }
      }

    })
    if (msgArr.length > 0) { this.showDialog(msgArr, 'error') }
    return !(msgArr.length > 0);
  }

  noticeCheckDialogParams!: DialogSettingParams;
  noticeContentList: string[] = new Array<string>();
  private showDialog(labels: string[], mode: string = 'success') {
    this.noticeContentList = new Array<string>();
    labels.forEach(label => { this.noticeContentList.push(label); });
    this.noticeCheckDialogParams = { title: this.translateService.instant('LicenseMgmt.Common.Title.Notification'), visiable: true, mode: mode };
  }

  /**
   * 確認是否可以有編輯權限
   * @returns 
   */
  private editPermissionIsTrue() {
    const isApprovingUrl = this.data?.formInfo?.initFormInfo?.urlIncludeApproving;
    const pendingIncludeMe = this.data?.formInfo?.initFormInfo.pendingIncludeMe;
    const iAmAssignee = this.data?.formInfo?.initFormInfo.iAmAssignee
    const canEditPriceMtn = this.data?.data?.canEditPriceMtn;
    const signTypeIsPM = this.data?.formInfo?.signType === 'PM'
    const isFirstStep = this.data?.formInfo?.initFormInfo.isFirstStep;

    return isApprovingUrl && pendingIncludeMe && !iAmAssignee && canEditPriceMtn && signTypeIsPM && !isFirstStep
  }

  /**
  * 設定當前的欄位
  */
  private initColumn() {
    this.tableCols = pcfMtnCols;
    if (this.data.data.salesCostTypeDash === '1-2') { // 1-2
      this.requireCols = ['currency', 'minSellingPrice', 'controlFlag', 'startDate', 'endDate','salesCost'];
    } else {  // 0-0 
      this.requireCols = ['currency', 'minSellingPrice', 'worstSalesGP', 'startDate', 'endDate'];
    }

    this.data.formInfo.getFlowSettingRsp.columns
      .filter(item => item.type === 'Maintain') // 只留 Maintain
      .filter(item => item.isDisplay === 'N') // 只留 isDisplay 是 N，因為預設顯示
      .forEach(column => {
        // 過濾掉 display 為 N 的資料
        this.tableCols = this.tableCols.filter(cols => cols.columnId !== column.columnId);
        this.requireCols = this.requireCols.filter(cols => cols !== column.columnId?.replace('p_'));
      });
  }

  /**
   * 初始化資料
   */
  private initData() {
    const pcfFormType = this.data.formInfo.formType;
    const startDateDefault = this.data.data.maintain?.startDate ? new Date(this.data.data.maintain?.startDate) : '';
    const startDate = pcfFormType === 'SO-M-C' ? startDateDefault || new Date() : startDateDefault // SO-M-C(0-0) 第一次維護Effective From預設帶入today

    const currency = this.data.data.maintain?.currency ? this.data.data.maintain?.currency : this.data.formInfo.currency;

    const defaultMinSellingPrice = this.data.data.maintain?.minSellingPrice;
    const minSellingPrice = pcfFormType === 'SO-M-C'
      ? currency === 'USD' ? this.data.data.sellingPrice || defaultMinSellingPrice : defaultMinSellingPrice // SO-M-C(0-0) 且當幣別=USD時將selling price帶入worst selling price
      : defaultMinSellingPrice // SO-M-C_WorstPrice 

    // WSP 預設Sales Cost等於Worst selling price
    const salesCost = this.data.data.maintain?.salesCost;
    
    this.tableData = [{
      currency: this.data.data.maintain?.currency ? this.data.data.maintain?.currency : this.data.formInfo.currency,
      minSellingPrice: minSellingPrice,
      salesCost: salesCost,
      controlFlag: this.data.data.maintain?.controlFlag,
      maxSellingPrice: this.data.data.maintain?.maxSellingPrice,
      worstSalesGP: this.data.data.maintain?.salesGP || this.data.data.maintain?.worstSalesGP,
      endDate: this.data.data.maintain?.endDate ? new Date(this.data.data.maintain?.endDate) : '',
      startDate: startDate,
      endCustomer: this.data.data.maintain?.endCustomer,
      creationBy: this.data.data.maintain?.creationBy,
      creationDate: this.data.data.maintain?.creationDate,
      lastUpdatedBy: this.data.data.maintain?.lastUpdatedBy,
      lastUpdatedDate: this.data.data.maintain?.lastUpdatedDate
    }]
  }

}
