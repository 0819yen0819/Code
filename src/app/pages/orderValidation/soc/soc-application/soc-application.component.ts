import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { SelectItem } from 'primeng/api';
import { BehaviorSubject, lastValueFrom } from 'rxjs';
import { AuthApiService } from 'src/app/core/services/auth-api.service';
import { LanguageService } from 'src/app/core/services/language.service';
import { UserContextService } from 'src/app/core/services/user-context.service';

@Component({
  selector: 'app-soc-application',
  templateUrl: './soc-application.component.html',
  styleUrls: ['./soc-application.component.scss']
})
export class SocApplicationComponent implements OnInit {
  @Input() formInfo: any = {};
  @Input() canEditDept: boolean = false;
  @Output() deptInfo = new EventEmitter<any>();

  userDeptsRes: any = []; // 部門Result
  userDeptsOptions: BehaviorSubject<SelectItem<any>[]> = new BehaviorSubject<SelectItem<any>[]>([]); // 當前使用者部門選項
  currentDept // 當前所選的部門

  constructor(
    private translateService: TranslateService,
    private authApiService: AuthApiService,
    public languageService: LanguageService,
    private router: Router,
    private userContextService: UserContextService
  ) { }

  ngOnInit(): void {
    this.subscribeLang();
    this.getCurrentUserDeptResult();
  }

  /**
   * 訂閱語言變換
   */
  subscribeLang() {
    this.translateService.onLangChange.subscribe((lang) => {
      this.setDeptLang(lang.lang);
    })
  }

  /**
   * 取得使用者的部門資訊
   */
  getCurrentUserDeptResult() { 
    lastValueFrom(this.authApiService.getUserEmpDataByTenantAndCode(this.formInfo.tenant, this.formInfo.salesCode)).then(res => {  // 取得部門資料
      const lang = this.languageService.getLang();
      setTimeout(() => {
        this.userDeptsRes = res.body.empDepts; // 儲存解析後的部門資料
        this.userDeptsRes.tenant = res.body.tenant;
        this.setDeptLang(lang);
      }, 0); 
    })
  }

  userDeptOnChange() {
    this.deptInfo.emit(this.currentDept);
  }

  /**
   * 根據當前語系設定 下拉選單資訊
   */
  private setDeptLang(lang:string) {
    // 如果get回來有資料 就用get回來的
    if (this.formInfo.salesDeptName) {
      this.currentDept = {
        dept: {
          deptnameTw: this.formInfo.salesDeptName,
          deptnameEn: this.formInfo.salesDeptNameE ?? this.formInfo.salesDeptName,
          deptId: this.formInfo.salesDeptCode
        }
        , label: lang === 'zh-tw' ? this.formInfo.salesDeptName : this.formInfo.salesDeptNameE
      }
      this.deptInfo.emit(this.currentDept);
      return
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
        : this.userDeptsOptions.getValue().filter((dept) => { return dept.value.dept.deptId === this.currentDept.dept.deptId })[0].value
      this.deptInfo.emit(this.currentDept); 

    }, 0);
  }

}
