import { Component, Input, OnChanges, OnInit, SimpleChanges } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { lastValueFrom } from 'rxjs';
import { RuleSetupService } from 'src/app/core/services/rule-setup.service';

@Component({
  selector: 'app-pcf-lines-readonly-table',
  templateUrl: './pcf-lines-readonly-table.component.html',
  styleUrls: ['./pcf-lines-readonly-table.component.scss']
})
export class PcfLinesReadonlyTableComponent implements OnInit, OnChanges {
  @Input() inputColumns;
  @Input() salesCostTypeDash; // 0-0 , 1-2 ...
  @Input() inputData: any = [{
    currency: '',
    minSellingPrice: '',
    maxSellingPrice: '',
    worstSalesGP: '',
    startDateString: '',
    endDateString: '',
    endCustomer: '',
    salesCost: '',
    controlFlag: ''
  }];

  constructor(
    private ruleSetupService: RuleSetupService,
    private translateService: TranslateService
  ) {
    this.translateService.onLangChange.subscribe(() => {
      if (this.inputData[0].controlFlag) { this.initControlFlagOptions() };
    });
  }

  ngOnInit(): void {
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.inputData) {
      this.inputData = [changes.inputData.currentValue];
      if (this.inputData[0].controlFlag) { this.initControlFlagOptions() }; // 如果傳入的值有control Flag 再轉
    }
  }

  /**
   * 將 A/B/N 轉回 字串
   * ex. A.控小(SO Price < Worst Selling Price)
   */
  controlFlagOptions = [];
  originControlFlag = '';
  private initControlFlagOptions() {
    this.originControlFlag = this.originControlFlag ? this.originControlFlag : this.inputData[0].controlFlag // 紀錄原始 control flag ，後續只變更顯示用的
    const model = {
      "tenant": "WPG",
      "msgFrom": "PriceControl",
      "trackingId": "M-CControlFlag",
      "tenantPermissionList": [
        "WPG"
      ],
      "ruleId": "M-CControlFlag"
    };
    if (this.controlFlagOptions.length === 0) { // 呼叫過一次之後就用第一次拿到的資料，放進controlFlagOptions
      lastValueFrom(this.ruleSetupService.queryRuleSetup(model)).then(res => {
        this.controlFlagOptions = res.ruleList.sort((a, b) => a.ordinal - b.ordinal)
        const curLang = this.translateService.currentLang;
        res.ruleList
          .sort((a, b) => a.ordinal - b.ordinal)
          .forEach((element: any) => {
            if (element.ruleCode === this.originControlFlag) {
              this.inputData[0].controlFlag = curLang === 'zh-tw' ? element.rulesCategoryRuleItemCn : element.rulesCategoryRuleItemEn
            }
          })
      })
    } else {
      const curLang = this.translateService.currentLang;
      this.controlFlagOptions.forEach((element: any) => {
        if (element.ruleCode === this.originControlFlag) {
          this.inputData[0].controlFlag = curLang === 'zh-tw' ? element.rulesCategoryRuleItemCn : element.rulesCategoryRuleItemEn
        }
      })
    }

  }

}
