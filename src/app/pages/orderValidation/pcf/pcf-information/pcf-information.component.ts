import { DatePipe } from '@angular/common';
import { Component, EventEmitter, Input, OnChanges, OnInit, Output } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { SelectItem } from 'primeng/api';
import { BehaviorSubject, lastValueFrom } from 'rxjs';
import { AuthApiService } from 'src/app/core/services/auth-api.service';
import { CommonApiService } from 'src/app/core/services/common-api.service';
import { LanguageService } from 'src/app/core/services/language.service';
import { UserContextService } from 'src/app/core/services/user-context.service';

@Component({
  selector: 'app-pcf-information',
  templateUrl: './pcf-information.component.html',
  styleUrls: ['./pcf-information.component.scss']
})
export class PcfInformationComponent implements OnInit, OnChanges {
  @Input() formInfo: any = {};
  @Input() canEditDept: boolean = false;
  @Output() infoChange = new EventEmitter<any>();

  userDeptsRes: any = []; // 部門Result
  userDeptsOptions: BehaviorSubject<SelectItem<any>[]> = new BehaviorSubject<SelectItem<any>[]>([]); // 當前使用者部門選項
  currentDept // 當前所選的部門
  pcfInfoCols = [];


  constructor(
    private translateService: TranslateService,
    private authApiService: AuthApiService,
    public languageService: LanguageService,
    private userContextService: UserContextService,
    private commonApiService: CommonApiService,
    private datePipe: DatePipe
  ) { }

  ngOnInit(): void {
    this.subscribeLang();
  }

  ngOnChanges(): void {
    this.getCurrentUserDeptResult();
    this.initColumn();
  }

  // getFlowSetting  isDisplay 'Y' 表示該欄位不顯示 type:Header 為表頭 
  initColumn() {
    const columnSettingArr = [];
    this.formInfo.getFlowSettingRsp.columns.forEach(column => {
      if ((column.isDisplay === 'N') && (column.type === 'Header')) {
        columnSettingArr.push(column.columnId);
      }
    });

    const custName = (this.languageService.getLang() === 'zh-tw' ? this.formInfo.customerName : this.formInfo.customerNameEg) ?? this.formInfo.customerName
    this.pcfInfoCols = this.getInformationViewData(
      `${this.formInfo.ouCode} - ${this.formInfo.ouName}`,
      `${this.formInfo.orderNumber ?? ''}`,
      `${this.datePipe.transform(this.formInfo.orderDate, 'yyyy/MM/dd') ?? ''}`,
      `${this.formInfo.salesCode} - ${this.formInfo.salesName}`,
      `${this.currentDept?.label ?? ''}`,
      `${this.formInfo.custCode} - ${custName}`,
      `${this.formInfo.custPoNo ?? ''}`,
      `${this.formInfo.currency ?? ''}`
    )
      .filter(column => !columnSettingArr.includes(column.id));
  }


  /**
   * 訂閱語言變換
   */
  subscribeLang() {
    this.translateService.onLangChange.subscribe((lang) => {
      this.setDeptLang();
      this.initColumn();
    })
  }

  /**
   * 取得使用者的部門資訊
   */
  getCurrentUserDeptResult() {
    // 業務員部門：申請人關卡才可修改，預設帶主要部門
    lastValueFrom(this.authApiService.getUserEmpDataByTenantAndCode(this.userContextService.user$.getValue().tenant, this.formInfo.salesCode)).then(res => {  // 取得部門資料
      this.userDeptsRes = res.body.empDepts; // 儲存解析後的部門資料
      this.userDeptsRes.tenant = res.body.tenant;
      this.setDeptLang();
    })
  }


  userDeptOnChange() {
    this.infoChange.emit(
      {
        deptInfo: this.currentDept,
        currency: this.formInfo.currency
      })
  }

  /**
   * 根據當前語系設定 下拉選單資訊
   */
  private setDeptLang() {
    this.canEditDept = this.formInfo.initFormInfo.pendingIncludeMe && this.formInfo.initFormInfo.urlIncludeApproving &&
      this.formInfo.initFormInfo.iAmApplyer && this.formInfo.initFormInfo.isFirstStep;

    // 如果get回來有資料 就用get回來的
    if (this.formInfo.salesDeptName) {
      setTimeout(() => {
        const curLangStatus: string = this.languageService.getLang();
        this.currentDept = {
          dept: {
            deptnameTw: this.formInfo.salesDeptName,
            deptnameEn: this.formInfo.salesDeptNameE,
            deptId: this.formInfo.salesDeptCode
          }
          , label: curLangStatus === 'zh-tw' ? (this.formInfo.salesDeptName ?? this.formInfo.salesDeptNameE) : (this.formInfo.salesDeptNameE ?? this.formInfo.salesDeptName)
        }
        this.userDeptOnChange();
        return
      })
    }

    // 若沒有 只可能是在第一關 就需要根據當前操作者的部門去顯示
    setTimeout(() => {
      const curLangStatus: string = this.languageService.getLang();

      // 根據語系設定下拉選項
      let userOptions = [];
      this.userDeptsRes.forEach(dept => {
        const targetDept = curLangStatus === 'zh-tw' ? dept.dept.deptnameTw : dept.dept.deptnameEn;
        const deptLabel = targetDept ? targetDept : `${dept.dept.deptnameTw || dept.dept.deptnameEn}`

        let userOptionsValue = dept;
        dept.label = deptLabel;
        userOptions.push({
          label: deptLabel,
          value: userOptionsValue,
        })
      })

      // 將 isPrimary 為 True 的排到第一個，當作預設
      userOptions = userOptions.sort((firstItem, secondItem) => {
        // 如果第一個元素的a屬性為true，返回負值，它將被放到陣列的前面
        // 如果第二個元素的a屬性為true，返回正值，它將被放到陣列的後面
        // 如果兩者都為true或都為false，保持原有順序
        return (firstItem?.value?.isPrimary === 'true' ? -1 : 1) - (secondItem?.value?.isPrimary === 'true' ? -1 : 1);
      })
    
      this.userDeptsOptions.next(userOptions);
 
      // 若當前沒有選擇部門，則預設第一筆；若有部門，則切換到對應語系資料
      this.currentDept = !this.currentDept
        ? this.userDeptsOptions.getValue()[0]?.value
        : this.userDeptsOptions.getValue().filter((dept) => { return dept.value.dept.deptId === this.currentDept.dept.deptId })[0]?.value ?? this.userDeptsOptions.getValue()[0]?.value
      this.userDeptOnChange();
    }, 0);
  }

  private getInformationViewData(h_ouCode = '', h_orderNumber = '', h_orderDate = '', h_salesCode = ''
    , h_salesDeptName = '', h_custCode = '',h_custPoNo = '', h_currency = '') {
    return [
      {
        label: this.translateService.instant('SalesOrderChange.field.Corp'),
        value: h_ouCode,
        id: 'h_ouCode'
      },
      {
        label: this.translateService.instant('SalesOrderChange.field.Customer'),
        value: h_custCode,
        id: 'h_custCode'
      },
      {
        label: this.translateService.instant('SalesOrderChange.field.OrderNumber'),
        value: h_orderNumber,
        id: 'h_orderNumber'
      },
      {
        label: this.translateService.instant('SalesOrderChange.field.OrderDate'),
        value: h_orderDate,
        id: 'h_orderDate'
      },
      {
        label: this.translateService.instant('SalesOrderChange.field.Sales'),
        value: h_salesCode,
        id: 'h_salesCode'
      },
      {
        label: this.translateService.instant('SalesOrderChange.field.SalesDept'),
        value: h_salesDeptName,
        id: 'h_salesDeptName'
      },
      {
        label: this.translateService.instant('SalesOrderChange.field.CustomerPONo'),
        value: h_custPoNo,
        id: 'h_custPoNo'
      },
      {
        label: this.translateService.instant('SalesOrderChange.field.Currency'),
        value: h_currency,
        id: 'h_currency'
      }

    ]
  }
}
