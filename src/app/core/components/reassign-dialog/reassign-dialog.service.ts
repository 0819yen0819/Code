import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { lastValueFrom, Observable } from 'rxjs';
import { MyApplicationService } from '../../services/my-application.service';
import { MyFlowService } from '../../services/my-flow.service';
import { UserContextService } from '../../services/user-context.service';
import { environment } from 'src/environments/environment';
import { HttpClient, HttpHeaders } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class ReassignDialogService {
  public reAssignBtnSetting = {
    visiable: false,
    name: 'ReAssignDialog.Btn.ReAssign',
    color: '#5289af',
    formTypeId:''
  }
  public showDialog = false; // 點擊轉派後的彈出視窗
  private _refreshHistoryController = true;

  constructor(
    private userContextService: UserContextService,
    private myApplicationService: MyApplicationService,
    private myFlowService: MyFlowService,
    private http: HttpClient,
    private router: Router
  ) {}

  // TODO：( 後期 ) 因應 formTypeId，需要 re-write
  /**
   * 判斷當前有無權限轉派 是否顯示轉派按鈕
   *
   * @param formNo
   */
  async init(formNo: string,formTypeId:string) {
    this.reAssignBtnSetting.visiable = false;
    this.reAssignBtnSetting.formTypeId = formTypeId;

    const isApprovingPage = this.router.url.includes('approving');
    if (isApprovingPage) { return; };

    const rsp = await lastValueFrom(this.myFlowService.getFlowAuditLog(formNo,this.reAssignBtnSetting.formTypeId));
    const approvingListIsEmpty = rsp.filter((x) => x.status === 'Approving' || x.status === 'Assignee').length === 0;
    if (approvingListIsEmpty) { return; };

    const permissionListRes = await this.getReaasignPermissionList();
    const currentFormIdRes = await this.getFormIdByFormNo(formNo);
    this.reAssignBtnSetting.visiable = this.havePermissionToReAssign(permissionListRes.formTypePermissionList, currentFormIdRes.formTypeId);
  }

  get reAssignHistoryRefreshController() {
    return this._refreshHistoryController;
  }

  get reAssignBtn() {
    return this.reAssignBtnSetting.visiable;
  }

  get reAssignDialog() {
    return this.showDialog;
  }

  get formTypeId(){
    return this.reAssignBtnSetting.formTypeId;
  }

  openAssignDialog() {
    this.showDialog = true;
  }

  closeAssignDialog() {
    this.showDialog = false;
  }

  saveReassign(model): Observable<any> {
    const baseUrl = `${environment.workflowApiUrl}${environment.apiPathPrefix}`;
    const APIM_AUTH_HEADER: HttpHeaders = new HttpHeaders({ 'Ocp-Apim-Subscription-Key': environment.apiKey });

    const url = `${baseUrl}/reassign`;
    const userToken = this.userContextService.user$.getValue().userToken;
    const headerslocal = APIM_AUTH_HEADER
      .append('accept', 'application/json')
      .append('Content-Type', 'application/json')
      .append('userToken', userToken);

    return this.http.post(url, model, { headers: headerslocal });
  }

  refreshHistory() {
    this._refreshHistoryController = false;
    setTimeout(() => { this._refreshHistoryController = true; }, 0);
  }

  private async getReaasignPermissionList() {
    const model = JSON.parse('{}');
    model.tenant = this.userContextService.user$.getValue().tenant;
    model.email = this.userContextService.user$.getValue().userEmail;
    model.staffCode = this.userContextService.user$.getValue().userCode;
    model.permissionType = 'REASSIGN';
    return lastValueFrom(this.myApplicationService.getAuthFormTypes(model));
  }

  private async getFormIdByFormNo(formNo: string) {
    return lastValueFrom(this.myFlowService.getFormLog(formNo,this.reAssignBtnSetting.formTypeId));
  }

  private havePermissionToReAssign(permissionList, currentFormId) {
    return permissionList.filter(permission => permission.formTypeId === currentFormId).length > 0 ? true : false;
  }
}
