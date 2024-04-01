import { CurFormStatusService } from 'src/app/pages/licenseMgmt/services/cur-form-status.service';
import { Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { SelectItem } from 'primeng/api';
import { BehaviorSubject, Subscription, lastValueFrom, retry, takeLast, take } from 'rxjs';
import { UserDepts } from 'src/app/core/model/user-depts';
import { UserInfo } from 'src/app/core/model/user-info';
import { AuthApiService } from 'src/app/core/services/auth-api.service';
import { LanguageService } from 'src/app/core/services/language.service';
import { UserContextService } from 'src/app/core/services/user-context.service';
import { SoaCommonService } from '../../../soa-common.service';
import { SoaApiService } from 'src/app/core/services/soa-api.service';
import { environment } from 'src/environments/environment';
import { ReassignDialogService } from 'src/app/core/components/reassign-dialog/reassign-dialog.service';
import { IntegrateService } from 'src/app/core/services/integrate.service';
import { ApproveDialogService } from 'src/app/pages/licenseMgmt/leh/leh-support/component/approve-dialog/approve-dialog.service';

@Component({
  selector: 'app-soa-header',
  templateUrl: './soa-header.component.html',
  styleUrls: ['./soa-header.component.scss']
})
export class SoaHeaderComponent implements OnInit, OnDestroy {
  @Input() headerSetting = {
    colData: {
      no: '單號',
      applyDate: Date.now(),
      applyer: '',
      title: '',
      titleInfo: null,
      backBtnText: ''
    },
    backUrl: ''
  }

  @Output() deptInfo = new EventEmitter<any>(); // file drop 事件接口
  @Output() submitInfo = new EventEmitter<any>(); // 將formGroup與相關history log往上送

  langSubscription = new Subscription; // 語言變換subscription
  openApproveDialog = false; // 審核dialog控制
  userDeptsOptions: BehaviorSubject<SelectItem<UserDepts>[]> = new BehaviorSubject<SelectItem<UserDepts>[]>([]); // 當前使用者部門選項
  userDeptInfo: any = []; // 紀錄使用者有的部門
  currentDept // 當前所選的部門

  constructor(
    private translateService: TranslateService,
    private authApiService: AuthApiService,
    private languageService: LanguageService,
    private userContextService: UserContextService,
    public soaCommonService: SoaCommonService,
    private soaApiService: SoaApiService,
    public reassignDialogService: ReassignDialogService,
    public integrateService: IntegrateService,
    private curFormStatusService: CurFormStatusService,
    private approveDialogService: ApproveDialogService
  ) { }

  ngOnInit(): void {
    this.subscribeLang();
    this.init();
  }

  async init() {
    // 設定表單標題 (ex.'申請 貿易合規客戶確認函(SOA)申請單')
    const formTitleRes = await lastValueFrom(this.soaApiService.getFormTitle('License_SOA'));
    this.integrateService.init((formTitleRes as any).body.formTypeId);
    this.approveDialogService.formTypeId = (formTitleRes as any).body.formTypeId;
    this.headerSetting.colData.titleInfo = (formTitleRes as any).body;
    this.setFormTitle();

    const curLangStatus: string = this.languageService.getLang(); // 當前語言
    const userInfo = new BehaviorSubject<UserInfo | null>(this.userContextService.user$.getValue()); // 當前使用者資料
    const res = await lastValueFrom(this.authApiService.getUserEmpDataByTenantAndCode(userInfo.getValue().tenant, userInfo.getValue().userCode)) // 取得部門資料
    this.userDeptInfo = res.body.empDepts; // 儲存解析後的部門資料
    this.userDeptInfo.tenant = res.body.tenant;
    this.setDeptLang();  // 設定 下拉選單

    // 上面取完資料後 開始設定單號 申請人
    setTimeout(() => {
      if (this.soaCommonService.currentState === 'Apply') { this.genarateNewForm(); }  // 全新表單
      else if (this.soaCommonService.currentRole === 'Applyer') { this.rollbackForm(this.soaCommonService.getSOAFormData()); } // 被退回
      else { this.recoverData(this.soaCommonService.getSOAFormData()); }  // 根據單號取得對應資料
      this.reassignDialogService.init(this.headerSetting.colData.no, this.soaCommonService.getSOAFormData().formTypeId);
    }, 0);

  }

  ngOnDestroy(): void {
    this.langSubscription?.unsubscribe();
  }

  /**
   * 全新表單 設定申請人、單號、部門資訊
   */
  genarateNewForm() {
    this.headerSetting.colData.no = this.soaCommonService.SOAformNo;
    const userCode = this.userContextService.user$.getValue().userCode;
    const userName = this.userContextService.user$.getValue().userName
    const userNameE = this.userContextService.user$.getValue().userNameE
    this.headerSetting.colData.applyer = `${userCode} ${userName} / ${userNameE}`
    this.currentDept = this.userDeptsOptions.getValue()[0]?.value;
    this.deptInfo.emit({ deptInfo: this.currentDept?.label, deptCode: this.currentDept?.dept?.deptId });
    this.curFormStatusService.getCurFormStatus$(this.headerSetting.colData.no).then(obs => {
      obs.pipe(take(1)).subscribe()
    })
  }

  /**
   * 利用舊單號 設定申請人、單號、部門資訊
   *
   * @param rsp
   * @returns
   */
  async recoverData(rsp) {
    this.headerSetting.colData.no = this.soaCommonService.getRouteParams().queryFormNo;
    if (!rsp) { return; }
    this.headerSetting.colData.applyDate = rsp.creationDate
    const userCode = rsp.userCode;
    const userName = rsp.userName;
    const tenant = this.userContextService.user$.getValue().tenant;
    const applyerRes = await lastValueFrom(this.authApiService.getUserEmpDataByTenantAndCode(tenant, userCode)) // 取得部門資料
    this.headerSetting.colData.applyer = `${userCode} ${userName} / ${applyerRes.body.nickName}`;
    this.currentDept = rsp.deptName
    this.deptInfo.emit({ deptInfo: rsp.deptName, deptCode: rsp.deptCode });

    this.curFormStatusService.getCurFormStatus$(this.headerSetting.colData.no, this.soaCommonService.getSOAFormData().formTypeId).then(obs => {
      obs.pipe(take(1)).subscribe()
    })
  }

  /**
   * 這張是被退回的 所以單號是舊的 部門要可以選
   */
  async rollbackForm(rsp) {
    this.headerSetting.colData.no = this.soaCommonService.getRouteParams().queryFormNo;
    if (!rsp) { return; }
    this.headerSetting.colData.applyDate = rsp.creationDate
    const userCode = rsp.userCode;
    const userName = rsp.userName;
    const tenant = this.userContextService.user$.getValue().tenant;
    const applyerRes = await lastValueFrom(this.authApiService.getUserEmpDataByTenantAndCode(tenant, userCode)) // 取得部門資料
    this.headerSetting.colData.applyer = `${userCode} ${userName} / ${applyerRes.body.nickName}`;

    const curUserEqualApplyUser = this.soaCommonService.getAuditLog()[0]?.signerCode === this.userContextService.user$.getValue().userCode;
    if (curUserEqualApplyUser) {
      // 選擇送單時的單位
      this.userDeptsOptions.getValue().forEach((dept: any) => {
        if (dept.value.dept.deptId === rsp.deptCode) {
          this.currentDept = dept.value
        }
      })
      // 如果沒有送簞食的單位(特殊情況)，則預設第一個
      if (!this.currentDept) { this.currentDept = this.userDeptsOptions.getValue()[0]; }

    } else {
      this.userDeptsOptions.next([]);
      this.currentDept = {
        dept: {
          deptId: rsp.deptCode,
        },
        label: rsp.deptName
      }
    }

    this.deptInfo.emit({ deptInfo: this.currentDept.label, deptCode: this.currentDept.dept?.deptId || this.currentDept.value.dept?.deptId });
  }

  /**
   * 訂閱語言變換
   */
  subscribeLang() {
    this.langSubscription = this.translateService.onLangChange.subscribe((lang) => {
      this.setFormTitle();
      this.setDeptLang();
    })
  }

  onAuditActionDialogHandler(): void {
    this.openApproveDialog = true;
  }

  /**
   * 取得Approve審核dialog的最終結果
   */
  getApproveDialogResult(event) {
    this.submitInfo.emit(event);
  }

  /**
   * p-dialog close 機制 patch function
   */
  updateDialog() {
    this.openApproveDialog = false;
  }

  userDeptOnChange() {
    this.deptInfo.emit({ deptInfo: this.currentDept.label, deptCode: this.currentDept.dept.deptId });
  }

  get showApproveBtn() {
    const condition1 = this.soaCommonService.currentRole !== 'Applyer' || this.soaCommonService.showHistory;
    const condition2 = this.soaCommonService.currentRole !== 'Readonly' && this.soaCommonService.currentState !== 'Readonly'
    const IamAssignee = this.soaCommonService.assigneeMode;
    return (condition1 && condition2) || IamAssignee
  }

  /**
   * 支援切換語系時更改當前使用者部門(僅限非全新表單以及非本人編輯) / 有需要用時加到lang change 與 ngOninit()中
   * @returns
   */
  private setDeptLabelLang() {
    if (this.soaCommonService.currentState === 'Apply') { return }  // 全新表單
    else if (this.soaCommonService.currentRole === 'Applyer') { return } // 被退回

    const rsp = this.soaCommonService.getSOAFormData();
    const tenant = this.userContextService.user$.getValue().tenant;
    const userCode = rsp.userCode;
    this.authApiService.getUserEmpDataByTenantAndCode(tenant, userCode)
      .pipe(takeLast(1))
      .subscribe((res) => {
        if (res.body) {
          const deptInfo = res.body.empDepts;
          deptInfo.forEach(dep => {
            if (dep.dept.deptId === rsp.deptCode) {
              setTimeout(() => {
                const curLangStatus: string = this.languageService.getLang();
                this.currentDept = curLangStatus === 'zh-tw' ? `${tenant}-${dep.dept.deptnameTw}` : `${tenant}-${dep.dept.deptnameEn}`
              }, 0);
            }
          })
        }
      });
  }


  /**
   * 根據當前語系設定下拉選單資訊
   */
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

      this.userDeptsOptions.next(userOptions);
    }, 0);
  }

  private setFormTitle() {
    setTimeout(() => {
      const curLangStatus: string = this.languageService.getLang();
      const title = curLangStatus === 'zh-tw' ? this.headerSetting.colData.titleInfo.formTypeNameC : this.headerSetting.colData.titleInfo.formTypeNameE;
      const status = this.translateService.instant(`LicenseMgmt.Status.${this.soaCommonService.getFormLog().status}`);
      if (this.soaCommonService.getFormLog().status) { this.headerSetting.colData.title = `${title} (${status})` }
      else { this.headerSetting.colData.title = `${title}` }
    }, 0);
  }

}
