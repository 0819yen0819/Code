import { Injectable } from '@angular/core';
import { lastValueFrom } from 'rxjs';
import { MyApplicationService } from 'src/app/core/services/my-application.service';
import { MyFlowService } from 'src/app/core/services/my-flow.service';
import { ObjectFormatService } from 'src/app/core/services/object-format.service';
import { SessionService } from 'src/app/core/services/session.service';
import { UserContextService } from 'src/app/core/services/user-context.service';

@Injectable({
  providedIn: 'root'
})
export class AttachmentUploaderService {

  constructor(
    private myFlowService: MyFlowService,
    private objectFormatService: ObjectFormatService,
    private sessionService: SessionService,
    private myApplicationService: MyApplicationService,
    private userContextService: UserContextService
  ) { }

  urlInCludingApproving() {
    const url = window.location.href || '';
    return url.toLocaleLowerCase().includes('approving');
  }

  /**
   * 根據表單編號取得當前簽核狀態
   * @param formNo 
   * @returns 
   */
  getFormStatus(formNo: string) {
    if (!formNo) { return };
    return new Promise<string>(async (resolve, reject) => {
      try {
        const rsp = await lastValueFrom(this.myFlowService.queryFlowStatus(formNo));
        resolve(rsp.flowStatus)
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * 取得當前表單附件檔案
   * @param formNo 
   * @param formTypeId 
   * @param type 
   * @returns 
   */
  getAttachment(formNo: string, formTypeId: string, type: 'File' | 'Url') {
    let targetResult = [];
    if (!formNo || !type) { return targetResult }; // 沒有傳入參數

    return new Promise<any[]>(async (resolve, reject) => {
      try {
        const attachments = await lastValueFrom(this.myFlowService.getFormFile(formNo, formTypeId));
        attachments.forEach((data) => { data.uploadDate = this.objectFormatService.DateTimeFormat(new Date(data.uploadDate), '/'); }); // 格式化日期欄位

        console.log(attachments);
        targetResult = type === 'File' ? attachments.filter((data) => data.type == 'File') : attachments.filter((data) => data.type == 'Url')
        
        this.sessionService.setItem('fileNum', attachments.filter((data) => data.type == 'File').length); // euc 送簽時檢核用
        resolve(targetResult)

      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * 確認當前使用者有沒有簽核權限
   * @param formNo 
   * @param formTypeId 
   * @returns 
   */
  haveApprovePermission(formNo: string, formTypeId: string) {
    if (!formNo || !formTypeId) { return false }; // 沒有傳入參數
    return new Promise<boolean>(async (resolve, reject) => {
      try {
        const model = this.getCheckPermissionModel(formNo, formTypeId);
        const rsp = await lastValueFrom(this.myApplicationService.checkPermissionApproveForm(model));
        resolve(rsp.approving)
      } catch (error) {
        reject(error);
      }
    });
  }

  auditLogIsEmpty(formNo: string, formTypeId: string) {
    return new Promise<boolean>(async (resolve, reject) => {
      try {
        const getFlowAuditLogRsp = await lastValueFrom(this.myFlowService.getFlowAuditLog(formNo, formTypeId))
        resolve(getFlowAuditLogRsp.length === 0);
      } catch (error) {
        reject(error);
      }
    })
  }

  getFormLog(formNo: string, formTypeId: string) {
    return new Promise<any>(async (resolve, reject) => {
      try {
        const getFormLogRsp = await lastValueFrom(this.myFlowService.getFormLog(formNo, formTypeId))
        resolve(getFormLogRsp);
      } catch (error) {
        reject(error);
      }
    })
  }

  iAmFormApplier(formNo: string, formTypeId: string) {
    return new Promise<boolean>(async (resolve, reject) => {
      try {
        const getFormLogRsp = await lastValueFrom(this.myFlowService.getFormLog(formNo, formTypeId))
        resolve(getFormLogRsp.applicantId === this.userContextService.user$.getValue().userCode);
      } catch (error) {
        reject(error);
      }
    })
  }

  private getCheckPermissionModel(formNo: string, formTypeId: string) {
    return {
      tenant: this.userContextService.user$.getValue().tenant,
      staffCode: this.userContextService.user$.getValue().userCode,
      formNo: formNo,
      formTypeId: formTypeId
    }
  }

}
