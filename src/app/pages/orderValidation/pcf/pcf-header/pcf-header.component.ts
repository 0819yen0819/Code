import { DatePipe } from '@angular/common';
import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { SelectItem } from 'primeng/api';
import { BehaviorSubject, Subscription, lastValueFrom } from 'rxjs';
import { UserDepts } from 'src/app/core/model/user-depts';
import { UserInfo } from 'src/app/core/model/user-info';
import { AuthApiService } from 'src/app/core/services/auth-api.service';
import { LanguageService } from 'src/app/core/services/language.service';
import { UserContextService } from 'src/app/core/services/user-context.service';


@Component({
  selector: 'app-pcf-header',
  templateUrl: './pcf-header.component.html',
  styleUrls: ['./pcf-header.component.scss']
})
export class PcfHeaderComponent implements OnInit {
  @Input() formInfo: any = {};

  userInfo = new BehaviorSubject<UserInfo | null>(this.userContextService.user$.getValue()); // 當前使用者資料
  enabledModifyDepartment: boolean = false;
  pcfHeaderCols = [];

  constructor(
    private languageService: LanguageService,
    private datePipe: DatePipe,
    private translateService: TranslateService,
    private authApiService: AuthApiService,
    private userContextService: UserContextService
  ) { }

  ngOnInit(): void {
    this.subscribeLang();
    this.initDeptModifyRule();
  }

  ngOnChanges(): void {
    this.initColumn();
  }

  ngOnDestroy(): void {
    this.langSubscription?.unsubscribe();
  }

  // getFlowSetting  isDisplay 'Y' 表示該欄位不顯示 type:Header 為表頭
  columnSettingArr = [];
  initColumn() {
    this.columnSettingArr = [];
    this.formInfo.getFlowSettingRsp.columns.forEach(column => {
      if ((column.isDisplay === 'N') && (column.type === 'Header')) {
        this.columnSettingArr.push(column.columnId);
      }
    });

    this.pcfHeaderCols = this.getHeaderViewData(
      this.formInfo.formNo,
      this.datePipe.transform(this.formInfo.creationDate, 'yyyy-MM-dd'),
      `${this.formInfo.userCode} ${this.formInfo.userName}`,
      ''
    )
      .filter(column => !this.columnSettingArr.includes(column.id));

    if (this.formInfo.isWSPandIsBatch) {
      const allowedColumnId = ['formNo', 'h_creationDate'] // WSP BATCH顯示欄位=>  Flow No.、 Flow Date、 OU
      this.pcfHeaderCols = this.pcfHeaderCols.filter(item => allowedColumnId.includes(item.id))

      this.pcfHeaderCols.push({
        label: this.translateService.instant('SalesOrderChange.field.Corp'),
        value: `${this.formInfo.ouCode} - ${this.formInfo.ouName}`,
        id: 'h_ouCode'
      })
    }
  }

  initDeptModifyRule() {
    const canEditDept = this.formInfo.initFormInfo.pendingIncludeMe && this.formInfo.initFormInfo.urlIncludeApproving &&
      this.formInfo.initFormInfo.iAmApplyer && this.formInfo.initFormInfo.isFirstStep

    if (canEditDept) {
      this.enabledModifyDepartment = true;
      this.initDept();
    } else {
      this.currentDept = `${this.userInfo.getValue().tenant}-${this.formInfo.userDeptName}`;
      this.deptInfo.emit({ deptInfo: this.formInfo.userDeptName, deptCode: this.formInfo.userDeptCode });
    }

  }

  /**
   * 訂閱語言變換
   */
  langSubscription = new Subscription; // 語言變換subscription
  subscribeLang() {
    this.langSubscription = this.translateService.onLangChange.subscribe((lang) => {
      this.initColumn();
      const canEditDept = this.formInfo.initFormInfo.pendingIncludeMe && this.formInfo.initFormInfo.urlIncludeApproving &&
        this.formInfo.initFormInfo.iAmApplyer && this.formInfo.initFormInfo.isFirstStep

      if (canEditDept) {
        this.setDeptLang();
      } else {
        this.currentDept = `${this.userInfo.getValue().tenant}-${this.formInfo.userDeptName}`;
      }

    })
  }

  @Output() deptInfo = new EventEmitter<any>(); // file drop 事件接口
  userDeptInfo: any = []; // 紀錄使用者有的部門
  userDeptsOptions: BehaviorSubject<SelectItem<UserDepts>[]> = new BehaviorSubject<SelectItem<UserDepts>[]>([]); // 當前使用者部門選項
  currentDept // 當前所選的部門
  async initDept() {
    const res = await lastValueFrom(this.authApiService.getUserEmpDataByTenantAndCode(this.userInfo.getValue().tenant, this.formInfo.userCode)) // 取得起單人
    this.userDeptInfo = res.body.empDepts; // 儲存解析後的部門資料
    this.userDeptInfo.tenant = res.body.tenant;
    this.setDeptLang();  // 設定 下拉選單
  }

  private setDeptLang() {
    setTimeout(() => {
      const curLangStatus: string = this.languageService.getLang();
      let userOptions = [];

      this.userDeptInfo.forEach(dept => {
        const targetDept = curLangStatus === 'zh-tw' ? dept.dept.deptnameTw : dept.dept.deptnameEn;
        const deptLabel = targetDept ? `${this.userDeptInfo.tenant}-${targetDept}` : `${this.userDeptInfo.tenant}-${dept.dept.deptnameTw || dept.dept.deptnameEn}`

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
      this.currentDept = this.userDeptsOptions.getValue()[0]?.value;
      this.userDeptOnChange();
    }, 0);
  }

  userDeptOnChange() {
    const deptInfo = this.currentDept?.label?.split('-')[1] ?? this.currentDept?.label;
    this.deptInfo.emit({ deptInfo: deptInfo, deptCode: this.currentDept?.dept?.deptId });
  }

  private getHeaderViewData(formNo = '', h_creationDate = '', h_userCode = '', h_userDeptName = '') {
    return [
      {
        label: this.translateService.instant('LicenseMgmt.Common.Label.ReferenceNo'),
        value: formNo,
        id: 'formNo'
      },
      {
        label: this.translateService.instant('APPROVING_LEH.Label.ApplicantDate'),
        value: h_creationDate,
        id: 'h_creationDate'
      },
      {
        label: this.translateService.instant('APPROVING_LEH.Label.Applicant'),
        value: h_userCode,
        id: 'h_userCode'
      },
      {
        label: this.translateService.instant('LicenseMgmt.Common.Label.Department'),
        value: h_userDeptName,
        id: 'h_userDeptName'
      }
    ]
  }
}
