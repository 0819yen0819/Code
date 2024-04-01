import { ChangeDetectorRef, Component, HostListener, OnInit, isDevMode } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { ReassignDialogService } from 'src/app/core/components/reassign-dialog/reassign-dialog.service';
import { MyFlowService } from 'src/app/core/services/my-flow.service';
import { UserContextService } from 'src/app/core/services/user-context.service';
import { CurFormStatusService } from '../../licenseMgmt/services/cur-form-status.service';
import { LoaderService } from 'src/app/core/services/loader.service';
import { LanguageService } from 'src/app/core/services/language.service';
import { Subject, lastValueFrom, retry, take } from 'rxjs';
import { LicenseFormStatusEnum } from 'src/app/core/enums/license-form-status';
import { IntegrateService } from 'src/app/core/services/integrate.service';
import { DialogSettingParams } from 'src/app/core/model/selector-dialog-params';
import { environment } from 'src/environments/environment';
import { CommonApiService } from 'src/app/core/services/common-api.service';
import { PcfService } from './pcf.service';
import { PCF_CONFIG_ID } from './pcf-const';
import { StoreBatchEditEntryService } from '../../storeBatchEditEntry/store-batch-edit-entry.service';
import { SovApproveDialogService } from '../components/approve-dialog/approve-dialog.service';
import { AgentInfoTableService } from 'src/app/core/components/agent-info-table/agent-info-table.service';

@Component({
  selector: 'app-pcf',
  templateUrl: './pcf.component.html',
  styleUrls: ['./pcf.component.scss']
})
export class PcfComponent implements OnInit {

  formTitleRes: any;
  formTitle: string = '';
  formStatus: string = '';
  formContentRes: any = {};
  formLogRes: any = {};
  formAuditRes: any = {};

  showApproveDialog: boolean = false;
  showWithdrawDialog: boolean = false;

  formNo: string = '';
  pcfInformation: any = {
    deptInfo: {},
    currency: ''
  }
  hideReject = true;


  private unsubscribeEvent = new Subject();
  curFlowingStatus!: string;
  pendingListIncludeMe: boolean = false;
  canEditDept: boolean = false;

  extendForm: boolean = false;
  formValid: Boolean = true;
  initFinish: boolean = false;

  constructor(
    private userContextService: UserContextService,
    public reassignDialogService: ReassignDialogService,
    private translateService: TranslateService,
    private myFlowService: MyFlowService,
    private router: Router,
    private activatedRoute: ActivatedRoute,
    private curFormStatusService: CurFormStatusService,
    private loaderService: LoaderService,
    private languageService: LanguageService,
    public integrateService: IntegrateService,
    private commonApiService: CommonApiService,
    private pcfService: PcfService,
    private changeDetectorRef: ChangeDetectorRef,
    private approveDialogService: SovApproveDialogService,
    public storeBatchEditEntryService: StoreBatchEditEntryService,
    private agentInfoTableService : AgentInfoTableService
  ) { }

  @HostListener('window:popstate')
  onPopState() {
    this.storeBatchEditEntryService.postMessageToParent('popstate')
  }

  get showApproveButton(): boolean {
    const approvingListIncludeMe = this.pendingListIncludeMe;
    const isApprovingPage = this.router.url.includes('approving');
    return approvingListIncludeMe && isApprovingPage
  }

  ngOnInit(): void {
    this.storeBatchEditEntryService.postMessageToParent('FormInit');
    this.recoverUserSetting();
    this.subscribeLangChange();
    this.subscribeRoute();
  }

  ngOnDestroy(): void {
    this.unsubscribeEvent.next(null);
    this.unsubscribeEvent.complete();
  }

  recoverUserSetting() {
    const user_extend_form = document.cookie.split("user_extend_form=");
    if (user_extend_form[1]) { this.extendForm = (user_extend_form[1][0] ?? '') === "t" ? true : false; }
    else { this.extendForm = true; }
  }

  /**
   * 訂閱語系變換
   */
  subscribeLangChange() {
    this.translateService.onLangChange.subscribe((lang) => {
      lang.lang === 'zh-tw' ? this.formTitle = this.formTitleRes.formTypeNameC : this.formTitle = this.formTitleRes.formTypeNameE
    });
  }

  /**
 * 訂閱路由變換(取得params參數)
 */
  subscribeRoute() {
    this.activatedRoute.queryParams.subscribe(async (params) => {
      this.loaderService.show();
      this.formNo = params['queryFormNo'];

      const formContent = await lastValueFrom(this.pcfService.getPCForm(this.formNo)) // formContent;
      this.formContentRes = formContent['body'];

      this.formContentRes.trxLines.forEach(line => {
        line.defaultStatusReject = line.status === 'R';
         // 寫死WSP 只顯示1-2跟只能改1-2，M-C就照原本規則(顯示維護 "明細中的saleCostType" 按鈕)
         line.salesCostTypeDash = this.formContentRes.formType === 'SO-M-C_WorstPrice' ? '1-2' : line.salesCostType?.replace('.','-');
      });

      this.integrateService.init(this.formContentRes.formTypeId);
      this.reassignDialogService.init(this.formNo, this.formContentRes.formTypeId);
      this.approveDialogService.formTypeId = this.formContentRes.formTypeId;
      this.agentInfoTableService.setFormTypeId(this.formContentRes.formTypeId);

      Promise.all([
        lastValueFrom(this.myFlowService.getFormLog(this.formNo, this.formContentRes.formTypeId)), // formStatus
        lastValueFrom(this.pcfService.getFormTitle()), // formTitle
        lastValueFrom(this.myFlowService.getFlowAuditLog(this.formNo, this.formContentRes.formTypeId))
      ]).then(async ([formStatus, formTitle, formAuditLog]) => {
        formAuditLog = formAuditLog.sort((a,b)=>{return +(new Date(a.receiveTime)) - +(new Date(b.receiveTime))});
        this.formLogRes = formStatus;
        this.formTitleRes = formTitle['body'];
        this.formAuditRes = formAuditLog;

        const getFlowSettingModel = {
          tenant: this.userContextService.user$.getValue().tenant,
          formType: this.formContentRes.formType,
          groupCode: this.formContentRes.groupCode,
          ouCode: this.formContentRes.ouCode,
          configId: ''
        }
        const getFlowSettingRsp = await lastValueFrom(this.pcfService.getFlowSetting(getFlowSettingModel));

        this.languageService.getLang() === 'zh-tw' ? this.formTitle = this.formTitleRes.formTypeNameC : this.formTitle = this.formTitleRes.formTypeNameE  // 根據當前語系決定表單狀態文字
        this.formStatus = `SalesOrderChange.Status.${formStatus.status?.toUpperCase()}`; // 表單狀態
        this.pendingListIncludeMe = this.pendingIncludeMe(formAuditLog); // 當前待簽核人是否有自己
        this.canEditDept = this.pendingIncludeMe(formAuditLog) && this.router.url.includes('approving') && (this.formContentRes.userCode === this.userContextService.user$.getValue().userCode && (formAuditLog[formAuditLog.length - 1].stepNumber === 1))

        this.curFormStatusService.setCurFormStatus({
          status: LicenseFormStatusEnum[formStatus.status?.toUpperCase()],
          formNo: params['queryFormNo'],
        });
        this.getFormStatus();

        // customer lang change  ->  BI-25103-TK-27666 QA (P1,3-1)
        const customerRsp = await lastValueFrom(this.commonApiService.getFuzzyActiveCustomerList(this.formContentRes.custCode));
        this.formContentRes.customerName = this.formContentRes.customerName ?? customerRsp.customerList[0].customerName;
        this.formContentRes.customerNameEg = this.formContentRes.customerNameEg ?? customerRsp.customerList[0].customerNameEg;
        this.formContentRes.curFormNo = params['queryFormNo'];
        this.formContentRes.getFlowSettingRsp = getFlowSettingRsp['body'];

        this.formContentRes.initFormInfo = { // 判斷用資訊
          pendingIncludeMe: this.pendingIncludeMe(formAuditLog),
          urlIncludeApproving: this.router.url.includes('approving'),
          iAmApplyer: (this.formContentRes.userCode === this.userContextService.user$.getValue().userCode),
          isFirstStep: formAuditLog[formAuditLog.length - 1].stepNumber === 1,
          iAmAssignee : this.getIfIAmAssignee(formAuditLog)
        }

        const SHOW_REJECT_ARR = this.formContentRes.getFlowSettingRsp.flowConfig?.filter(config => config.configId === PCF_CONFIG_ID.SHOW_REJECT) || [{}];
        this.hideReject = SHOW_REJECT_ARR[0]?.configVal1 === 'N';

        const isWSP = this.formContentRes.formType === 'SO-M-C_WorstPrice'
        const isBatch = this.formContentRes.isBatch === 'Y'
        this.formContentRes.isWSPandIsBatch = isWSP && isBatch;
      })
        .catch((error) => {
          this.formValid = false;
          const errorMsg = error.error?.message ? error.error?.message : this.translateService.instant('System.Message.Error');
          this.showMsgDialog(errorMsg, 'error');
        })
        .finally(() => {
          this.loaderService.hide();
          this.initFinish = true;
        })
    });
  }

  getApplicationChange(e) { this.pcfInformation = e; } // 取得申請資訊變動事件

  openApproveDialog(): void { this.showApproveDialog = true; } // 打開審核對話框

  closeApproveDialog() { this.showApproveDialog = false; } // 關閉審核對話框

  deptInfo;
  getDeptChange(e) { this.deptInfo = e; }

  getApproveDialogRes(e) {  // 取得審核事件
    if (!this.canApprove(e)) { return };

    this.loaderService.show();
    const model = this.getApproveModel(e);

    lastValueFrom(this.pcfService.approvePriceControlForm(model))
      .then(res => {
        this.storeBatchEditEntryService.postMessageToParent('Form Destroy');
        if (environment.storeRedirectUrlPrefix == 'local') { this.router.navigate(['/', 'applicationMgmt', 'my-application']); }
        else { window.location.href = environment.storeRedirectUrlPrefix + '?entryUrl=myforms/success&type=' + this.formNo + '&formTypeId=' + this.formContentRes.formTypeId;; }
      })
      .catch(err => {
        if (err.error?.code === 'AllLineNeedChecked'){
          this.reassignDialogService.refreshHistory();
          this.formContentRes.lastStep = 'Y';
        }
        if (err.error?.code === 'PriceControlMaintainError'){
          const errorMsg = err.error?.errors[0]
          this.showMsgDialog(errorMsg, 'error');
          return;
        }
        const errorMsg = err.error?.message ? err.error?.message : this.translateService.instant('System.Message.Error');
        this.showMsgDialog(errorMsg, 'error');
      })
      .finally(() => { this.loaderService.hide(); })
  }

  openWithdrawDialog() { this.showWithdrawDialog = true; } // 打開撤回對話框

  getWithdrawClose() { this.showWithdrawDialog = false; } // 關閉撤回對話框

  extendFormOnClick() {
    this.extendForm = !this.extendForm;
    document.cookie = `user_extend_form=${this.extendForm.toString()}`;
  }

  lineInfo;
  getLinesChange(e) {
    if (e.rowIndex) {
      this.formContentRes.trxLines[e.rowIndex].maintain = e.maintain;
    }

    this.lineInfo = e;
  }

  get extendBtnLabel() {
    return this.extendForm ? this.translateService.instant('Button.Label.PackUp') : this.translateService.instant('Button.Label.Extend')
  }

  noticeCheckDialogParams!: DialogSettingParams;
  noticeContentList: string[] = new Array<string>();
  private showMsgDialog(msg: string, mode: string) {
    this.noticeContentList = new Array<string>();
    this.noticeContentList.push(msg);
    this.noticeCheckDialogParams = {
      title: this.translateService.instant('LicenseMgmt.Common.Title.Notification'),
      visiable: true,
      mode: mode
    };
  }

  private showMsgDialogByArray(msg: string[], mode: string) {
    this.noticeContentList = new Array<string>();
    this.noticeContentList.push(...msg);
    this.noticeCheckDialogParams = {
      title: this.translateService.instant('LicenseMgmt.Common.Title.Notification'),
      visiable: true,
      mode: mode
    };
  }

  private getFormStatus() {
    this.curFormStatusService.getCurFormStatus$(this.formNo, this.formContentRes.formTypeId).then(obs => {
      obs.pipe(take(1)).subscribe(res => { this.curFlowingStatus = res })
    })
  }

  private pendingIncludeMe(auditLog) {
    const pendingListAllowType = ['Approving', 'Assignee'];
    const pendingList = auditLog.filter((x) => pendingListAllowType.includes(x.status))
    const myCode = this.userContextService.user$.getValue().userCode;
    let includeMe = false;
    pendingList.forEach(log => { if (log.signerCode === myCode) { includeMe = true; } });
    return includeMe;
  }

  // 取得審核用API Model
  private getApproveModel(e: any) {
    // 是否可以整單Reject : Y的話就是審核的駁回時明細都要壓reject
    const lines = this.lineInfo?.map(item => {

      const statusVal = e.action === "reject" ? 'R' : item.status?.substring(0, 1);

      const maintainIsEmpty = !item.maintain;
      const maintainValue = maintainIsEmpty || (statusVal === 'R') ? null : {
        currency: item.maintain?.currency,
        minSellingPrice: item.maintain?.minSellingPrice,
        maxSellingPrice: item.maintain?.maxSellingPrice,
        salesCost: item.maintain?.salesCost,
        controlFlag:  item.maintain?.controlFlag,
        salesGP: item.maintain?.worstSalesGP || item.maintain?.salesGP || 0,
        startDate: item.maintain?.startDate ? new Date(item.maintain?.startDate).valueOf() : null,
        endDate: item.maintain?.startDate ? new Date(item.maintain?.endDate).valueOf() : null,
        endCustomer: item.maintain?.endCustomer,
        creationBy: item.maintain?.creationBy || this.userContextService.user$.getValue().userEmail,
        creationDate: item.maintain?.creationDate || new Date().getTime(),
        lastUpdatedBy: item.maintain?.lastUpdatedBy,
        lastUpdatedDate: item.maintain?.lastUpdatedDate
      }

      return {
        lineNumber: item.lineNumber,
        status: statusVal,
        lineTrackingId: item.lineTrackingId ?? null,
        apRemark: item.apRemark,
        smRemark: item.smRemark,
        pmRemark: item.pmRemark,
        maintain: maintainValue,
        orderHoldId: item.orderHoldId
      }
    })

    return {
      tenant: this.userContextService.user$.getValue().tenant,
      action: e.action,
      formNo: this.formNo,
      userCode: this.userContextService.user$.getValue().userCode,
      comment: e.comment,
      stepNumber: e.stepNumber,
      activityId: e.rollbackStep,
      rollbackSignerCode: e.rollbackSignerCode,
      nowStep: e.nowStep,
      cosigner: this.getCosigner(e),
      ouGroup: this.formContentRes.ouGroup,
      ouCode: this.formContentRes.ouCode,
      userDeptCode: this.deptInfo.deptCode,
      userDeptName: this.deptInfo.deptInfo,
      salesDeptCode: this.pcfInformation.deptInfo.dept.deptId,
      salesDeptName: this.pcfInformation.deptInfo.label,
      salesDeptNameE: this.pcfInformation.deptInfo.dept.deptnameEn,
      orderNumber: this.formContentRes.orderNumber,
      flowHeaderId: this.formContentRes.flowHeaderId,
      formType: this.formContentRes.formType,
      signType: this.formContentRes.signType,
      isBatch: this.formContentRes.isBatch,
      trxLines: lines,

    }
  }

  private getCosigner(event) {
    let consigner = [];
    if (event?.cosigners) {
      Array.isArray(event.cosigners)
        ? event.cosigners.forEach(cos => { consigner.push(cos.value.staffCode) })
        : consigner.push(event.cosigners.value.staffCode)
    }
    return consigner
  }

  private canApprove(e) {
    let errorMsg = '';
    const salesDeptIsEmpty = !this.pcfInformation.deptInfo?.dept?.deptId; //sales部門不得為空
    const isApprove = e.action === 'approve'; // 核可才要控
    const isLastStage = this.formContentRes.lastStep === 'Y'; // 是否為最後一關
    
    if (salesDeptIsEmpty) {
      errorMsg = this.translateService.instant('SalesOrderChange.Msg.SalesDeptCodeEmpty');
      this.showMsgDialog(errorMsg, 'error');
      return false;
    } else if (!isApprove || !isLastStage) { return true; }


    this.lineInfo.forEach(item => { // 若為最後一關，是否明細列都有填
      if (!item.status) {
        errorMsg = this.translateService.instant('SalesOrderChange.Msg.ApproveRejectRequired');
      }
    })

    if (errorMsg) {
      this.showMsgDialog(errorMsg, 'error');
      return false;
    } else {
      return true;
    }
  }

  private getIfIAmAssignee(auditLog) {
    const pendingListAllowType = ['Assignee'];
    const pendingList = auditLog.filter((x) => pendingListAllowType.includes(x.status))
    const myCode = this.userContextService.user$.getValue().userCode;
    let iAmAssignee = false;
    pendingList.forEach(log => { if (log.signerCode === myCode) { iAmAssignee = true; } });
    return iAmAssignee;
  }

}
