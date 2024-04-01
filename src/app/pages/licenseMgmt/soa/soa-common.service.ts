import { Injectable, isDevMode } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { lastValueFrom } from 'rxjs';
import { AuthApiService } from 'src/app/core/services/auth-api.service';
import { CommonApiService } from 'src/app/core/services/common-api.service';
import { MyFlowService } from 'src/app/core/services/my-flow.service';
import { RuleSetupService } from 'src/app/core/services/rule-setup.service';
import { SoaApiService } from 'src/app/core/services/soa-api.service';
import { UserContextService } from 'src/app/core/services/user-context.service';

@Injectable({
  providedIn: 'root'
})
export class SoaCommonService {
  curState: 'Approving' | 'Readonly' | 'Apply' | 'Draft' = 'Readonly';
  private routeParams = {
    queryFormNo: '',
    backUrl: ''
  }
  formNo = '';
  role: 'Applyer' | 'TCSU' | 'Group1' | 'Readonly' | 'Legal' | 'Manager';
  assigneeMode = false; // 當前使用者是Assignee 只有審核按鈕能按;

  private SOAFormData: any = null;
  private _docArea: any;
  formLog: any = null;
  auditLog: any;

  attachFileMode: 'approving' | 'readonly' = 'readonly';
  initFinish = false;
  formTypeId:string;
  userOu:string = '';
  groupQueryRes;
  constructor(
    private router: Router,
    private activatedRoute: ActivatedRoute,
    private soaApiService: SoaApiService,
    private commonApiService: CommonApiService,
    private myFlowService: MyFlowService,
    private userContextService: UserContextService,
    private ruleSetupService: RuleSetupService,
    private authApiService: AuthApiService
  ) {
    this.subscribeRoute();
  }

  subscribeRoute() {
    this.activatedRoute.queryParams.subscribe((params) => {
      this.resetVariable();
      this.setRouteParams(params)
      this.init(params);
    });
  }

  async init(params) {
    try {
      if (this.routeParams.queryFormNo) {
        let rsp: any = await this.setSOAFormData();
        this.SOAFormData = rsp.body;
        this.formNo = this.routeParams.queryFormNo || '';
        this.formTypeId = rsp.body.formTypeId;
      }   
      Promise.all([
        lastValueFrom(this.myFlowService.getFormLog(this.routeParams.queryFormNo,this.formTypeId)), // formLog
        lastValueFrom(this.myFlowService.getFlowAuditLog(this.routeParams.queryFormNo,this.formTypeId)), // auditLog  
        lastValueFrom(this.ruleSetupService.queryRuleSetup(this.getDocAreaModel())),
        lastValueFrom(this.authApiService.getUserGroupByEmail()),
        lastValueFrom(this.authApiService.groupQuery())
      ]).then(async ([formLog, auditLog, docArea,userOuRsp,groupQueryRes]) => {
        // 取得formLog
        this.formLog = formLog;
        // 取得auditLog 
        const historyStatus = ['Submitted', 'Approve', 'Reject', 'Rollback', 'Resolve', 'Cancel', 'Approving', 'Assignee'];
        this.auditLog = auditLog.filter((x) => historyStatus.includes(x.status)).sort((a, b) => { return a.stepNumber - b.stepNumber });
        // 取得doc 正本位置
        this._docArea = docArea;

        this.setCurrentState();
        this.setCurrentRole();

        if (!(this.curState !== 'Apply' && this.curState !== 'Readonly')) {
          const rsp = await lastValueFrom(this.commonApiService.idGenerator('SOAForm'))
          this.formNo = this.routeParams.queryFormNo ?? rsp.id;
        }
        this.userOu = userOuRsp.groupName;
        this.groupQueryRes = groupQueryRes;
        this.initFinish = true;
      })

    } catch (error) {
      isDevMode() && console.log(error);
    }
  }

  setRouteParams(params) {
    this.routeParams.queryFormNo = params['queryFormNo'];
    this.routeParams.backUrl = params['backUrl']
  }

  /**
   * 取得當前角色 (法務/主管/GroupOU人員/申請者/TCSU)
   * @returns 
   */
  async setCurrentRole() {
    this.role = 'Readonly';

    if (this.router.url.toLowerCase().includes('/soa?') && (this.formLog.status !== 'Draft')) { return isDevMode() }  // 這張是查詢表單，不是新增也不是簽核

    const lastestApprovingLog = this.auditLog.filter(log => (log.status === 'Approving' || log.status === 'Assignee')).pop();
    const isApplying = !lastestApprovingLog && this.auditLog.length === 0 // 沒有log，表示還在申請中

    if (isApplying) {
      this.role = 'Applyer'
    }
    else if (this.pendingIncludeMe(this.auditLog)) {
      const myCode = this.userContextService.user$.getValue().userCode;
      const firstApplyLog = this.auditLog.filter(item => item.stepNumber === 1)?.reverse().pop(); // 退回到第一關且加簽給其他人，此時其他人還是在第一關，會導致被加簽的人有申請時所有的修改全縣
      const backToFirstOfMine = (lastestApprovingLog?.stepNumber === 1) && (lastestApprovingLog.signerCode === myCode) && (lastestApprovingLog.signerCode === firstApplyLog.signerCode);

      if (this.assigneeListHaveMe(this.auditLog)) {
        this.role = 'Readonly';
        this.curState = 'Readonly'
        this.assigneeMode = true;
      }
      else if (backToFirstOfMine) { this.role = 'Applyer' } // 退回第一關 而且是自己 要全部都可以編輯
      else if (lastestApprovingLog?.stepName === 'TCSU') { this.role = 'TCSU' }
      else if (lastestApprovingLog?.stepName === 'Legal') { this.role = 'Legal' }
      else if (lastestApprovingLog?.stepName.indexOf('主管') !== -1) { this.role = 'Manager' }
      else if (lastestApprovingLog?.stepName === 'GroupOU') { this.role = 'Group1' }
      else if (lastestApprovingLog?.stepName === '申請人') { this.role = 'Applyer' }
    }


    // 設定附件連結上傳權限
    const applyerIsMe = this.role === 'Applyer';
    const appvingHaveMe = (this.curState === 'Approving') && this.pendingIncludeMe(this.auditLog);
    const assigneeHaveMe = this.assigneeListHaveMe(this.auditLog) || false; // 有可能回傳undefied 因為沒log 

    if (applyerIsMe || appvingHaveMe || assigneeHaveMe) { this.attachFileMode = 'approving' };
  }

  /**
   * 透過當前表單號取得先前表單資料
   */
  async setSOAFormData() {
    return lastValueFrom(this.soaApiService.getSOA(this.routeParams.queryFormNo));
  }


  async setCurrentState() {
    if (!this.formLog.status) { this.curState = 'Apply' }
    else if (this.formLog.status === 'Approve') { this.curState = 'Readonly' }
    else { this.curState = this.formLog.status }
  }

  getDocAreaModel() {
    return {
      "tenant": "WPG",
      "msgFrom": "SOAForm",
      "trackingId": "SOA_AREA",
      "tenantPermissionList": [
        "WPG"
      ],
      "ruleId": "SOA_AREA",
      "isConfigurable": null
    }
  }

  get docArea() {
    return this._docArea;
  }


  getFormLog() {
    return this.formLog;
  }

  getSOAFormData() {
    return this.SOAFormData || {};
  }

  getRouteParams() {
    return this.routeParams;
  }

  getAuditLog() {
    return this.auditLog;
  }

  getCurrentUrl() {
    return this.router.url;
  }

  /**
   * 等待透過表單後取得資料後再進行渲染
   */
  get serviceInitFinish() {
    return this.initFinish;
  }

  get SOAformNo() {
    return this.formNo;
  }

  /**
   * 返回當前狀態為：申請、審核、查看
   * 
   * @returns 
   */
  get currentState(): 'Approving' | 'Readonly' | 'Apply' | 'Draft' {
    return this.curState;
  }

  get showHistory() {
    return this.auditLog.length !== 0;
  }

  get getAttachFileMode() {
    return this.attachFileMode;
  }

  get currentRole() {
    return this.role;
  }

  /**
   * 是否扣量 是否需要disabled
   */
  get disabledEditDeduct() {
    return (this.currentRole === 'Applyer' && this.curState === 'Apply') || (this.role !== 'TCSU' && this.role !== 'Group1' && this.role !== 'Manager' && this.role !== 'Legal')
    // 申請時鎖死不得編輯 ， 非TCSU、Group1、Manager、Legal不得編輯
  }

  pendingIncludeMeFlag = false;
  private pendingIncludeMe(auditLog) {
    const pendingListAllowType = ['Approving', 'Assignee'];
    const pendingList = auditLog.filter((x) => pendingListAllowType.includes(x.status))
    const myCode = this.userContextService.user$.getValue().userCode;
    let includeMe = false;
    pendingList.forEach(log => { if (log.signerCode === myCode) { includeMe = true; } });
    this.pendingIncludeMeFlag = includeMe;
    return includeMe;
  }

  private assigneeListHaveMe(auditLog) {
    const pendingList = auditLog.filter((x) => x.status === 'Assignee')
    const myCode = this.userContextService.user$.getValue().userCode;
    let assigneeLog: any;
    pendingList.forEach(log => { if (log.signerCode === myCode) { assigneeLog = log; } });
    return assigneeLog;
  }

  /**
   * 重置變數，使得每次進入新的表單頁面時都會刷新
   */
  resetVariable() {
    this.formNo = '';
    this.role = 'Readonly';
    this.curState = 'Readonly'
    this.routeParams = {
      queryFormNo: '',
      backUrl: ''
    }
    this.SOAFormData = null;
    this.formLog = null;
    this.auditLog = null;
    this.initFinish = false;
  }
}
