import { Component, HostListener, OnInit } from '@angular/core';
import { Subject, lastValueFrom, take, takeUntil } from 'rxjs';
import { ReassignDialogService } from 'src/app/core/components/reassign-dialog/reassign-dialog.service';
import { IntegrateService } from 'src/app/core/services/integrate.service';
import { SocApiService } from './soc-api.service';
import { TranslateService } from '@ngx-translate/core';
import { Test_getSoChgGbgForm, Test_formTitle, Test_FormLog } from './soc-const';
import { MyFlowService } from 'src/app/core/services/my-flow.service';
import { ActivatedRoute, Router } from '@angular/router';
import { UserContextService } from 'src/app/core/services/user-context.service';
import { CurFormStatusService } from '../../licenseMgmt/services/cur-form-status.service';
import { LoaderService } from 'src/app/core/services/loader.service';
import { LanguageService } from 'src/app/core/services/language.service';
import { DialogSettingParams } from 'src/app/core/model/selector-dialog-params';
import { environment } from 'src/environments/environment';
import { LicenseFormStatusEnum } from 'src/app/core/enums/license-form-status';
import { StoreBatchEditEntryService } from '../../storeBatchEditEntry/store-batch-edit-entry.service';
import { SovApproveDialogService } from '../components/approve-dialog/approve-dialog.service';
import { AuthApiService } from 'src/app/core/services/auth-api.service';
import { AgentInfoTableService } from 'src/app/core/components/agent-info-table/agent-info-table.service';
@Component({
  selector: 'app-soc',
  templateUrl: './soc.component.html',
  styleUrls: ['./soc.component.scss']
})
export class SocComponent implements OnInit {
  formTitleRes: any;
  formTitle: string = '';
  formStatus: string = '';
  formContentRes: any = {};
  formLogRes: any = {};
  formAuditRes: any = {};

  showApproveDialog: boolean = false;
  showWithdrawDialog: boolean = false;

  formNo: string = '';
  deptInfo: any;
  lineInfo: any;

  private unsubscribeEvent = new Subject();
  curFlowingStatus!: string;
  pendingListIncludeMe: boolean = false;
  canEditDept: boolean = false;
  extendForm: boolean = false;

  constructor(
    private userContextService: UserContextService,
    public reassignDialogService: ReassignDialogService,
    public integrateService: IntegrateService,
    private socApiService: SocApiService,
    private translateService: TranslateService,
    private myFlowService: MyFlowService,
    private router: Router,
    private activatedRoute: ActivatedRoute,
    private curFormStatusService: CurFormStatusService,
    private loaderService: LoaderService,
    private languageService: LanguageService,
    public storeBatchEditEntryService: StoreBatchEditEntryService,
    private approveDialogService:SovApproveDialogService,
    private authApiService : AuthApiService,
    private agentInfoTableService : AgentInfoTableService
  ) { }

  ngOnInit(): void {
    this.storeBatchEditEntryService.postMessageToParent('FormInit');
    this.recoverUserSetting();
    this.subscribeLangChange();
    this.subscribeRoute();
  }

  ngOnDestroy(): void {
    this.storeBatchEditEntryService.postMessageToParent('Form Destroy');
    this.unsubscribeEvent.next(null);
    this.unsubscribeEvent.complete();
  }

  recoverUserSetting() {
    const user_extend_form = document.cookie.split("user_extend_form=");
    if (user_extend_form[1]) { this.extendForm = (user_extend_form[1][0] ?? '') === "t" ? true : false; }
    else { this.extendForm = true; }
  }

  get showApproveButton(): boolean {
    const approvingListIncludeMe = this.pendingListIncludeMe;
    const isApprovingPage = this.router.url.includes('approving');
    return approvingListIncludeMe && isApprovingPage
  }

  get showWithdrawButton(): boolean {
    const createdByMe = this.formContentRes?.userCode === this.userContextService.user$.getValue().userCode; // 申請人=查詢者
    const isApporving = this.formLogRes.status?.toUpperCase() === 'APPROVING'; // 表單狀態為處理中
    const isReadonlyPage = !this.router.url.includes('approving');
    return createdByMe && isApporving && isReadonlyPage
  }

  @HostListener('window:popstate')
  onPopState() {
    this.storeBatchEditEntryService.postMessageToParent('popstate')
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

      const formContent = await lastValueFrom(this.socApiService.getSoChgForm(this.formNo)) // formContent
      this.formContentRes = formContent['body'];

      this.formContentRes.lines.forEach(line => {
        line.defaultStatusReject = line.status === 'R';
      });

      this.integrateService.init(this.formContentRes.formTypeId);
      this.reassignDialogService.init(this.formNo,this.formContentRes.formTypeId);
      this.approveDialogService.formTypeId = this.formContentRes.formTypeId;
      this.agentInfoTableService.setFormTypeId(this.formContentRes.formTypeId);

      // WPIG -> 轉成 '1'
      const ouList = await lastValueFrom(this.authApiService.groupQuery());
      const groupInfo = ouList.groupList.filter(item=> item.groupName === this.formContentRes.ouGroup);
      const getFlowSettingModel = {
        tenant: this.userContextService.user$.getValue().tenant,
        formType: this.formContentRes.docType,
        groupCode: groupInfo[0]?.groupCode ?? 0,
        ouCode: this.formContentRes.ouCode,
        configId: ''
      }

      Promise.all([
        lastValueFrom(this.myFlowService.getFormLog(this.formNo,this.formContentRes.formTypeId)), // formStatus
        lastValueFrom(this.socApiService.getFormTitle()), // formTitle
        lastValueFrom(this.myFlowService.getFlowAuditLog(this.formNo,this.formContentRes.formTypeId)),
        lastValueFrom(this.socApiService.getFlowSetting(getFlowSettingModel))
      ]).then(([formStatus, formTitle, formAuditLog,flowSettingRsp]) => {
        formAuditLog = formAuditLog.sort((a,b)=>{return +(new Date(a.receiveTime)) - +(new Date(b.receiveTime))});
        this.formLogRes = formStatus;
        this.formTitleRes = formTitle['body'];

        this.formAuditRes = formAuditLog;
        this.formContentRes.flowSetting = flowSettingRsp['body'];

        this.languageService.getLang() === 'zh-tw' ? this.formTitle = this.formTitleRes.formTypeNameC : this.formTitle = this.formTitleRes.formTypeNameE  // 根據當前語系決定表單狀態文字
        this.formStatus = `SalesOrderChange.Status.${formStatus.status?.toUpperCase()}`; // 表單狀態
        this.pendingListIncludeMe = this.pendingIncludeMe(formAuditLog); // 當前待簽核人是否有自己
        this.formContentRes.iAmAssignee = this.getIfIAmAssignee(formAuditLog);
        this.canEditDept = this.pendingIncludeMe(formAuditLog) && this.router.url.includes('approving') && !this.formContentRes.iAmAssignee

        this.curFormStatusService.setCurFormStatus({
          status: LicenseFormStatusEnum[formStatus.status?.toUpperCase()],
          formNo: params['queryFormNo'],
        });
        this.getFormStatus();

      })
        .catch((error) => { console.log(error); })
        .finally(() => { this.loaderService.hide(); })

    });
  }

  getFormStatus() {
    this.curFormStatusService.getCurFormStatus$(this.formNo,this.formContentRes.formTypeId).then(obs => {
      obs.pipe(take(1)).subscribe(res => { this.curFlowingStatus = res })
    })
  }


  getApplicationChange(e) { this.deptInfo = e; } // 取得申請資訊變動事件

  getLineChange(e) { this.lineInfo = e; } // 取得line資料變動事件

  openApproveDialog(): void { this.showApproveDialog = true; } // 打開審核對話框

  closeApproveDialog() { this.showApproveDialog = false; } // 關閉審核對話框

  getApproveDialogRes(e) {  // 取得審核事件
    if (!this.canApprove(e)) { return };

    this.loaderService.show();
    const model = this.getApproveModel(e);
    lastValueFrom(this.socApiService.approveSoChgForm(model))
      .then(res => {
        this.storeBatchEditEntryService.postMessageToParent('Form Destroy');
        if (environment.storeRedirectUrlPrefix == 'local') { this.router.navigate(['/', 'applicationMgmt', 'my-application']); }
        else { window.location.href = environment.storeRedirectUrlPrefix + '?entryUrl=myforms/success&type=' + this.formNo + '&formTypeId=' + this.formContentRes.formTypeId; }
      })
      .catch(err => {
        if (err.error?.code === 'AllLineNeedChecked') {
          this.reassignDialogService.refreshHistory();
          this.formContentRes.lastStep = 'Y';
        }
        
        const errorMsg = err.error?.message ? err.error?.message : this.translateService.instant('System.Message.Error');
        this.showMsgDialog(errorMsg, 'error');
      })
      .finally(() => { this.loaderService.hide(); })
  }

  openWithdrawDialog() { this.showWithdrawDialog = true; } // 打開撤回對話框

  getWithdrawClose() { this.showWithdrawDialog = false; } // 關閉撤回對話框

  getWithdrawSubmit(comment) {
    this.showWithdrawDialog = false;
    const model = this.getWithdrawModel(comment);
    this.loaderService.show();
    lastValueFrom(this.socApiService.approveSoChgForm(model))
      .then(res => {
        this.storeBatchEditEntryService.postMessageToParent('Form Destroy');
        if (environment.storeRedirectUrlPrefix == 'local') { this.router.navigate(['/', 'applicationMgmt', 'my-application']); }
        else { window.location.href = environment.storeRedirectUrlPrefix + '?entryUrl=myforms/success&type=' + this.formNo + '&formTypeId=' + this.formContentRes.formTypeId;}
      })
      .catch(err => {
        const errorMsg = err.error?.message ? err.error?.message: this.translateService.instant('System.Message.Error');
        this.showMsgDialog(errorMsg, 'error');
      })
      .finally(() => { this.loaderService.hide(); })

  } // 取得撤回事件

  extendFormOnClick() {
    this.extendForm = !this.extendForm;
    document.cookie = `user_extend_form=${this.extendForm.toString()}`;
  }

  get extendBtnLabel() {
    return this.extendForm ? this.translateService.instant('Button.Label.PackUp') : this.translateService.instant('Button.Label.Extend')
  }

  private canApprove(e) {
    let errorMsg = '';
    const salesDeptIsEmpty = !this.deptInfo; //sales部門不得為空
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

  // 取得審核用API Model
  private getApproveModel(e: any) {
    const lines = this.lineInfo.map(item => {
      return {
        lineNumber: item.lineNumber,
        status: item.status?.substring(0, 1),
        comments: item.comments,
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
      nowStep: e.nowStep,
      cosigner: this.getCosigner(e),
      salesDeptCode: this.deptInfo.dept.deptId,
      salesDeptName: this.deptInfo.dept.deptnameTw,
      salesDeptNameE: this.deptInfo.dept.deptnameEn,
      orderNumber: this.formContentRes.orderNumber,
      lines: lines,
      rollbackSignerCode: e.rollbackSignerCode
    }
  }

  // 取得撤回用API Model
  private getWithdrawModel(comment) {
    const lines = this.lineInfo.map(item => {
      return {
        lineNumber: item.lineNumber,
        status: item.status?.substring(0, 1),
        comments: item.comments,
        orderHoldId: item.orderHoldId
      }
    })
    const latestAuditLog = this.formAuditRes[this.formAuditRes.length - 1];

    return {
      tenant: this.userContextService.user$.getValue().tenant,
      action: 'withDraw',
      formNo: this.formNo,
      userCode: this.userContextService.user$.getValue().userCode,
      comment: comment,
      stepNumber: latestAuditLog.stepNumber,
      activityId: '',
      nowStep: latestAuditLog.stepName,
      cosigner: [],
      salesDeptCode: this.deptInfo.dept.deptId,
      salesDeptName: this.deptInfo.label,
      orderNumber: this.formContentRes.orderNumber,
      lines: lines
    }
  }

  private pendingIncludeMe(auditLog) {
    const pendingListAllowType = ['Approving', 'Assignee'];
    const pendingList = auditLog.filter((x) => pendingListAllowType.includes(x.status))
    const myCode = this.userContextService.user$.getValue().userCode;
    let includeMe = false;
    pendingList.forEach(log => { if (log.signerCode === myCode) { includeMe = true; } });
    return includeMe;
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

  private getCosigner(event) {
    let consigner = [];
    if (event?.cosigners) {
      Array.isArray(event.cosigners)
        ? event.cosigners.forEach(cos => { consigner.push(cos.value.staffCode) })
        : consigner.push(event.cosigners.value.staffCode)
    }
    return consigner
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
