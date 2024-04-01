import { Component, EventEmitter, Input, isDevMode, OnInit, Output } from '@angular/core';
import { BehaviorSubject, lastValueFrom, Observable, skipWhile } from 'rxjs';
import { ReassignDialogService } from './reassign-dialog.service';
import { AuthApiService } from '../../services/auth-api.service';
import { UserContextService } from '../../services/user-context.service';
import { MyFlowService } from '../../services/my-flow.service'
import { SelectItem } from 'primeng/api';
import { SimpleUserInfo } from '../../model/user-info';
import { TranslateService } from '@ngx-translate/core';
import { DialogSettingParams } from '../../model/selector-dialog-params';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-reassign-dialog',
  templateUrl: './reassign-dialog.component.html',
  styleUrls: ['./reassign-dialog.component.scss']
})
export class ReassignDialogComponent implements OnInit {
  @Output() reAssignFinish: EventEmitter<boolean> = new EventEmitter<boolean>();
  formNo: string = '';

  OriginAssignerOptions: SelectItem[]; // 被轉派的人員清單
  fuzzyEmpInfosOptions = new BehaviorSubject<SelectItem<SimpleUserInfo>[]>([]); // 轉派給的人員清單
  originAssigner // 原始人原
  targetAssigner // 指派人員

  noticeCheckDialogParams: DialogSettingParams;
  noticeContentList: string[] = [];
  showSpinner = false;
  closeReassignDialogAfterMsgDialogClose = false;

  constructor(
    public reassignDialogService: ReassignDialogService,
    private authApiService: AuthApiService,
    private userContextService: UserContextService,
    private myFlowService: MyFlowService,
    private translateService: TranslateService,
    private activatedRoute: ActivatedRoute
  ) {
    this.activatedRoute.queryParams.subscribe((params) => {
      this.formNo = params['queryFormNo'];
    });
  }

  ngOnInit(): void {
    this.getOriginAssignerList();
  }

  saveOnClick() {
    const submitCheckMsg = this.getSubmitCheckResult();
    if (submitCheckMsg.length > 0) {
      return this.showMsgDialog(submitCheckMsg,'error');
    }

    this.openSpinner();
    const model = this.getReassignModel();
    this.reassignDialogService.saveReassign(model).subscribe({
      next: (rsp) => {
        const successMsg = `${this.translateService.instant('ReAssignDialog.Msg.AlreadyReAssign')} ${this.targetAssigner.value.staffCode}`
        this.handleGetReAssignResponse(rsp, successMsg, true,'success');
        this.reAssignFinish.emit(true);
        this.reassignDialogService.refreshHistory();
        this.getOriginAssignerList();
      },
      error: (rsp) => {
        let msg = '';
        if (rsp?.status === 200) {
          msg = `${this.translateService.instant('ReAssignDialog.Msg.AlreadyReAssign')} ${this.targetAssigner.value.staffCode}`
          this.handleGetReAssignResponse(rsp, msg, true,'success');
          this.reAssignFinish.emit(true);
          this.reassignDialogService.refreshHistory();
          this.getOriginAssignerList();
        } else {
          msg = `${this.formNo} ${this.translateService.instant('ReAssignDialog.Msg.SaveFail')}`
          this.handleGetReAssignResponse(rsp, msg,false,'error');
        }
      }
    });
  }

  /**
   * 取得原始Approving對象清單
   */
  async getOriginAssignerList() {
    const rsp = await lastValueFrom(this.myFlowService.getFlowAuditLog(this.formNo,this.reassignDialogService.formTypeId));
    const approvingList = rsp.filter((x) => x.status === 'Approving' || x.status === 'Assignee');
    this.OriginAssignerOptions = [];

    approvingList.forEach(log => {
      this.OriginAssignerOptions.push({
        value: log,
        label: `${log.signerCode} ${log.signerNameCn} ${log.signerNameEn}`
      })
    })
  }

  /**
   * 取得指派對象建議清單
   * @param event 
   */
  onCosignersFilterHandler(event): void {
    const getFuzzyEmpInfo$ = (keyword: string): Observable<SimpleUserInfo[]> =>
      new Observable<SimpleUserInfo[]>((obs) => {
        const tenant = this.userContextService.user$.getValue().tenant;
        if (keyword != '') {
          this.authApiService
            .getAllEmpByTenant(tenant, keyword)
            .pipe(skipWhile((data) => data.type == 0))
            .subscribe((res) => {
              obs.next(res.body);
              obs.complete();
            });
        } else {
          obs.next([]);
          obs.complete();
        }
      });

    getFuzzyEmpInfo$(event.query).subscribe((empInfos) => {
      this.fuzzyEmpInfosOptions.next([]);

      for (const empInfo of empInfos) {
        if (
          this.fuzzyEmpInfosOptions
            .getValue()
            .findIndex((data) => data.value.staffCode == empInfo.staffCode) == -1) {
          this.fuzzyEmpInfosOptions.next([
            ...this.fuzzyEmpInfosOptions.getValue(),
            {
              label: `${empInfo.staffCode} ${empInfo.fullName} ${empInfo.nickName}`,
              value: empInfo,
            },
          ]);
        }
      }
    });
  }

  onBlur(event) {
    // 沒選autoComplete的話.清空input內容 
    if (this.targetAssigner === undefined || this.targetAssigner?.value === undefined) {
      this.targetAssigner = undefined;
    }
  }

  msgDialogOnClose() {
    if (this.closeReassignDialogAfterMsgDialogClose) {
      this.reassignDialogService.closeAssignDialog();
      this.closeReassignDialogAfterMsgDialogClose = false;
    }
  }

  onHideReAssignDialog(e) {
    this.originAssigner = null // 原始人原
    this.targetAssigner = null // 指派人員
  }

  private getSubmitCheckResult() {
    let msgArr = [];
    const haveOriginAssigner = this.originAssigner?.signerCode ? true : false;
    if (!haveOriginAssigner) { msgArr.push(this.translateService.instant('ReAssignDialog.Msg.PleaseSelectRedirectFrom')) }

    const haveTargetAssigner = this.targetAssigner?.value?.staffCode ? true : false;
    if (!haveTargetAssigner) { msgArr.push(this.translateService.instant('ReAssignDialog.Msg.PleaseSelectRedirectEmp')) }

    return msgArr;
  }

  private getReassignModel() {
    return {
      replacestaffCode: this.originAssigner.signerCode, // 需被替換的人
      reassignStaffCode: this.targetAssigner.value.staffCode, // 替換的人
      executeStaffCode: this.userContextService.user$.getValue().userCode, // 登入人員
      tenant: this.userContextService.user$.getValue().tenant,
      formNos: [this.formNo], // 被重新分配的表單編號
      auditLogKeys:[{
        formNo:this.formNo,
        formTypeId:this.reassignDialogService.formTypeId
      }],
      comment: null
    };
  }

  /**
   * 關閉Spinner、打開送出後的訊息提示、啟用關閉提示後是否關閉重新分派視窗
   * @param rsp 
   * @param msg 
   * @param closeReAssignDialog 
   */
  private handleGetReAssignResponse(rsp, msg, closeReAssignDialog: boolean = false,mode: string) {
    isDevMode() && console.log(rsp);
    this.showMsgDialog([msg],mode);
    this.closeSpinner();
    this.closeReassignDialogAfterMsgDialogClose = closeReAssignDialog;
  }

  private showMsgDialog(msgArr: string[],mode:string) {
    if (msgArr.length === 0) { return; }

    this.noticeContentList = [];
    msgArr.forEach(msg => {
      this.noticeContentList.push(msg);
    })

    this.noticeCheckDialogParams = {
      title: this.translateService.instant('LicenseMgmt.Common.Title.Notification'),
      visiable: true,
      mode:mode
    };
  }

  private openSpinner() {
    this.showSpinner = true;
  }

  private closeSpinner() {
    this.showSpinner = false;
  }
}
