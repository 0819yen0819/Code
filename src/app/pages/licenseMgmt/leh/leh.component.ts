import { Component, isDevMode, OnChanges, OnDestroy, OnInit, SimpleChanges } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { lastValueFrom, Subscription, take } from 'rxjs';
import { LehApiService } from 'src/app/core/services/leh-api.service';
import { tableCols, eucCols, eucCheckBoxList } from './leh-support/leh-const';
import {
  IHeaderSetting,
  IColSetting,
  IMainTableData,
  IEucTableData,
} from './leh-support/leh-interface';
import { LehUtilService } from './leh-support/leh-util.service';
import { ActivatedRoute, Router } from '@angular/router';
import { DialogSettingParams } from 'src/app/core/model/selector-dialog-params';
import { UserContextService } from 'src/app/core/services/user-context.service';
import { AuthApiService } from 'src/app/core/services/auth-api.service';
import { takeLast } from 'rxjs';
import { environment } from 'src/environments/environment';
import { ReassignDialogService } from 'src/app/core/components/reassign-dialog/reassign-dialog.service';
import { IntegrateService } from 'src/app/core/services/integrate.service';
import { CurFormStatusService } from '../services/cur-form-status.service';
import { ApproveDialogService } from './leh-support/component/approve-dialog/approve-dialog.service';
import { LanguageService } from 'src/app/core/services/language.service';
import { LoaderService } from 'src/app/core/services/loader.service';
import { AgentInfoTableService } from 'src/app/core/components/agent-info-table/agent-info-table.service';
@Component({
  selector: 'app-leh',
  templateUrl: './leh.component.html',
  styleUrls: ['./leh.component.scss'],
})
export class LehComponent implements OnInit, OnDestroy, OnChanges {
  langSubscription = new Subscription(); // 語言變換subscription
  eucExtendOpen: boolean[] = [];
  headerSetting: IColSetting[] = []; // 表頭資訊
  tabPanelSetting: IColSetting[] = []; // 申請資訊

  tableCols: IHeaderSetting[] = tableCols; // Main Table 欄位設定
  eucCols: IHeaderSetting[] = eucCols; // Euc Table 欄位設定
  eucCheckBoxList: string[] = eucCheckBoxList; // 副表中需要在HTML中顯示為Checkbox而非字串的euc欄位

  tableData: IMainTableData[] = []; // Main Table 資料
  eucData: IEucTableData[][] = []; // 副表 Euc Table 資料

  formAuditActionDialogParams: DialogSettingParams; // 審核dialog
  openApproveDialog = false;
  showSpinner = false;

  formSetting = {
    formNo: '',
    title: '',
    status: '',
    backUrl: '',
  };
  viewpointWidth;

  curFlowingStatus!: string;

  noticeCheckDialogParams!: DialogSettingParams;
  noticeContentList: string[] = new Array<string>();
  formTypeId;
  formInfo;
  constructor(
    private translateService: TranslateService,
    private lehApiService: LehApiService,
    private activatedRoute: ActivatedRoute,
    public lehUtilService: LehUtilService,
    private userContextService: UserContextService,
    private authApiService: AuthApiService,
    private router: Router,
    public reassignDialogService: ReassignDialogService,
    public integrateService: IntegrateService,
    private curFormStatusService: CurFormStatusService,
    private approveDialogService: ApproveDialogService,
    private languageService : LanguageService,
    private loaderService : LoaderService,
    private agentInfoTableService : AgentInfoTableService
  ) {
    this.viewpointWidth = window.innerWidth;
  }
 
  async ngOnInit(): Promise<void> {
    this.loaderService.show();
    await this.getFormType();
    this.lehUtilService.setMode();
    this.subscribeEventHanlder();
    this.initData();
  }

  ngOnDestroy(): void {
    this.langSubscription?.unsubscribe();
  }

  ngOnChanges(changes: SimpleChanges): void {
    isDevMode() && console.log(changes)
  }

  /**
   * 訂閱語言變動事件，更改Extend按鈕值 / 訂閱Route參數
   *
   */
  subscribeEventHanlder() {
    this.langSubscription = this.translateService.onLangChange.subscribe((lang:any) => {
      const title = lang.lang === 'zh-tw' ? this.formInfo.formTypeNameC : this.formInfo.formTypeNameE;
      this.formSetting.title = `${title} ${this.lehUtilService.getFormStatus(this.formSetting.status)}`;
    });
    this.activatedRoute.queryParams.subscribe((params) => {
      this.formSetting.formNo = params['queryFormNo'];
      this.formSetting.backUrl = params['backUrl'];
      this.curFormStatusService.getCurFormStatus$(this.formSetting.formNo,this.formTypeId).then(obs => {
        obs.pipe(take(1)).subscribe(res => { this.curFlowingStatus =  this.lehUtilService.pendingIncludeMeFlag ? res : null })
      })
    });
  }

  initData() {
    this.reassignDialogService.init(this.formSetting.formNo, this.formTypeId);
    this.lehApiService.getLehHold(this.formSetting.formNo).subscribe({
      next: (rsp) => {
        isDevMode() && console.log(rsp);
        this.getFormStatus();
        this.dataProcessHandler(rsp);
        this.initEcuExtendBtn();
        this.loaderService.hide();
      },
      error: (rsp) => {
        isDevMode() && console.log(rsp);
        const errorMsg = rsp.error?.message || this.translateService.instant('System.Message.Error');
        this.showMsgDialog(errorMsg, 'error');
        this.loaderService.hide();
      },
    });
  }

  async getFormType(){
    const formTitleRes = await lastValueFrom(this.lehApiService.getFormType('EXCEPTION_HOLD'));
    this.formInfo = (formTitleRes as any).body;
    this.formTypeId = (formTitleRes as any).body.formTypeId;
    this.agentInfoTableService.setFormTypeId(this.formTypeId);
    this.approveDialogService.formTypeId = this.formTypeId;
    this.lehUtilService.formId = this.formTypeId; 
 
    const title = this.languageService.getLang() === 'zh-tw' ? this.formInfo.formTypeNameC : this.formInfo.formTypeNameE;
    this.formSetting.title = `${title} ${this.lehUtilService.getFormStatus(this.formSetting.status)}`;
  }

  getFormStatus() {
    this.lehApiService.getFormStatus(this.formSetting.formNo,this.formTypeId).subscribe({
      next: (rsp) => {
        const status = rsp.status === 'Approve' ? 'Approved' : rsp.status
        this.formSetting.status = status;
        this.setForm();
      },
      error: (rsp) => {
        isDevMode() && console.log(rsp);
        const errorMsg = rsp.error?.message || this.translateService.instant('System.Message.Error');
        this.showMsgDialog(errorMsg, 'error');
      },
    })
  }

  onAuditActionDialogHandler(): void {
    this.openApproveDialog = true;
  }

  /**
   * 取得Approve審核dialog的最終結果
   */
  getApproveDialogResult(event) {
    this.showSpinner = true;

    let consigner = [];
    if (event.cosigners) {
      Array.isArray(event.cosigners)
        ? event.cosigners.forEach((cos) => {
          consigner.push(cos.value.staffCode);
        })
        : consigner.push(event.cosigners.value.staffCode);
    }

    const model = {
      tenant: this.userContextService.user$.getValue().tenant,
      action: event.action,
      formNo: this.formSetting.formNo,
      userCode: this.userContextService.user$.getValue().userCode,
      comment: event.comment,
      stepNumber: event.stepNumber,
      activityId: event.rollbackStep,
      nowStep: event.nowStep,
      cosigner: consigner,
    };

    this.lehApiService.approvalLeh(model).subscribe({
      next: (rsp: any) => {
        if (rsp.body) {
          isDevMode() && console.log('success', rsp);
          this.showSpinner = false;

          if (environment.storeRedirectUrlPrefix == 'local') { this.router.navigate(['/', 'applicationMgmt', 'my-application']); }
          else { window.location.href = environment.storeRedirectUrlPrefix + '?entryUrl=myforms/success&type=' + this.formSetting.formNo + '&formTypeId=' + this.formTypeId; }
        }
      },
      error: (rsp) => {
        isDevMode() && console.log('fail', rsp);
        const errorMsg = rsp.error?.message || this.translateService.instant('System.Message.Error');
        this.showMsgDialog(errorMsg, 'error');
        this.showSpinner = false;
      },
    });
  }

  /**
   * p-dialog close 機制 patch function
   */
  updateDialog() {
    this.openApproveDialog = false;
  }

  eucBtnOnClick(rowIndex: number) {
    this.eucExtendOpen[rowIndex] = !this.eucExtendOpen[rowIndex];

    if (this.eucExtendOpen[rowIndex] && (this.viewpointWidth <= 640)) {
      setTimeout(() => {
        const mainArea = document.getElementById('mainArea' + rowIndex);
        mainArea.scrollIntoView({ behavior: "smooth", block: "end", inline: "end" });
      }, 100);

      setTimeout(() => {
        const eucExtendArea = document.getElementById('eucExtendArea' + rowIndex);
        eucExtendArea.scrollIntoView({ behavior: "smooth", block: "end", inline: "end" });
      }, 280);
    }
  }

  /**
   * 負責處理本地資料與API串接
   * @param rsp
   */
  private dataProcessHandler(rsp: any) {

    // header
    this.authApiService
      .getUserEmpDataByTenantAndCode(rsp.tenant, rsp.userCode) // 取得申請單的員工資料
      .pipe(takeLast(1))
      .subscribe((res) => {
        this.headerSetting.push({
          col: 'LicenseMgmt.Common.Label.ReferenceNo',
          content: `${this.formSetting.formNo}`,
        });
        this.headerSetting.push({
          col: 'APPROVING_LEH.Label.ApplicantDate',
          content: this.lehUtilService.dateFormat(rsp.creationDate, true),
        });
        this.headerSetting.push({
          col: 'APPROVING_LEH.Label.Applicant',
          content: `${res.body.staffCode} ${res.body.fullName} / ${res.body.nickName}`,
        });
        this.headerSetting.push({
          col: 'LicenseMgmt.Common.Label.Department',
          content: `${rsp.tenant}-${rsp.salesDeptName}`,
        });
      })


    // 主表 - 申請資訊 欄位資訊
    this.authApiService
      .getUserEmpDataByTenantAndCode(rsp.tenant, rsp.salesCode) // 取得sales的員工資料
      .pipe(takeLast(1))
      .subscribe((res) => {
        this.tabPanelSetting.push({
          col: 'APPROVING_LEH.Label.Type',
          content: rsp.trxType,
        });
        this.tabPanelSetting.push({
          col: 'APPROVING_LEH.Label.Corp',
          content: `${rsp.ouCode} (${rsp.ouName})`,
        });
        this.tabPanelSetting.push({
          col: 'APPROVING_LEH.Label.ReferenceNumber',
          content: rsp.trxNo,
        });
        this.tabPanelSetting.push({
          col: 'APPROVING_LEH.Label.Group',
          content: rsp.group,
        });
        this.tabPanelSetting.push({
          col: 'APPROVING_LEH.Label.Sales',
          content: `${rsp.salesCode} ${res.body.nickName} / ${res.body.fullName}`,
        });
        this.tabPanelSetting.push({
          col: 'APPROVING_LEH.Label.SalesDept',
          content: rsp.salesDeptName,
        });
        this.tabPanelSetting.push({
          col: 'APPROVING_LEH.Label.CreatedByLastUpdateBy',
          content: `${rsp.salesCode} ${res.body.nickName} / ${res.body.fullName}`,
        });
        this.tabPanelSetting.push({
          col: 'APPROVING_LEH.Label.CustomerChineseName',
          content: rsp.custNameC,
        });
        this.tabPanelSetting.push({
          col: 'APPROVING_LEH.Label.CustomerCode',
          content: rsp.custNo,
        });
        this.tabPanelSetting.push({
          col: 'APPROVING_LEH.Label.CustomerEnglishName',
          content: rsp.custNameE,
        });
      })

    // Table 資料
    rsp.datas.forEach((data, index) => {
      // 主表 - Table 資料
      this.tableData.push({
        euc: data.eucDatas?.length || 0,
        brand: data.brand,
        item: data.productCode,
        qty: data.quantity,
        ctmPo: data.custPoNumber,
        eccn: data.eccn,
        ccats: data.ccats,
        proviso: data.proviso,
        exceptionHoldReason: data.holdReason,
        billToCountry: data.billToCountry,
        billTo: data.billToAddress,
        shipToCountry: data.shipToCountry,
        shipTo: data.shipToAddress,
        deliverToCountry: data.deliverToCountry,
        deliverTo: data.deliverToAddress,
      });
      // 副表 - Euc Table 資料
      this.eucData[index] = [];
      data.eucDatas?.forEach((euc) => {
        this.eucData[index].push({
          documentNo: euc.license,
          item: euc.productCode,
          qty: euc.quantity,
          period: `${this.lehUtilService.dateFormat(
            euc.startDate,
            false
          )} - ${this.lehUtilService.dateFormat(euc.endDate, false)}`,
          govermentUnit: euc.government === 'Y' ? true : false,
          civillianEU: euc.civilianEndUser === 'Y' ? true : false,
          cillianEU: euc.civilianEndUse === 'Y' ? true : false,
        });
      });
    });
  }

  private setForm() {
    this.formSetting.title = this.lehUtilService.getFormTitle(this.formSetting.formNo, this.formSetting.status);
  }

  /**
   * 根據table資料幾筆，長出對應的extend控制器
   */
  private initEcuExtendBtn() {
    this.eucExtendOpen = [];
    for (let i = 0; i < this.tableData.length; i++) {
      this.eucExtendOpen.push(false);
    }
  }

  // 顯示Dialog
  private showMsgDialog(label: string, mode: string) {
    this.noticeContentList = new Array<string>();
    this.noticeContentList.push(this.translateService.instant(label));
    this.noticeCheckDialogParams = {
      title: this.translateService.instant('LicenseMgmt.Common.Title.Notification'),
      visiable: true,
      mode: mode
    };
  }
}
