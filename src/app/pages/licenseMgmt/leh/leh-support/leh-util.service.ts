import { Injectable } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { MyFlowService } from 'src/app/core/services/my-flow.service';
import { UserContextService } from 'src/app/core/services/user-context.service';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class LehUtilService {
  mode: 'approving' | 'readonly' = 'readonly';
  formId:string;

  constructor(
    private activatedRoute: ActivatedRoute,
    private router: Router,
    private translateService: TranslateService,
    private userContextService: UserContextService,
    private myFlowService: MyFlowService,
  ) { }

  /**
   * timestamp 2 date format
   * @param timeStamp 
   * @param showHMS true = 'YYYY/MM/DD HH:mm:ss' ; false = 'YYYY/MM/DD'
   * @returns 
   */
  dateFormat(timeStamp: Date, showHMS: boolean) {
    let date = new Date(timeStamp);
    const dateFormat = `${date.getFullYear()}/${date.getMonth() + 1}/${date.getDate()}`
    if (showHMS) { return dateFormat + ` ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}:${date.getSeconds().toString().padStart(2, '0')}` }
    else { return dateFormat };
  }

  navigateToTargetRoute(backUrl: string) {
    const targeRoute = backUrl ? backUrl : 'applicationMgmt/pending'
    this.router.navigate([targeRoute], { queryParams: {} });
  }

  get getMode() {
    return this.mode;
  }

 
  setMode() {
    this.mode = 'readonly';
    if (!(this.router.url.includes('approving'))) {
      return this.mode = 'readonly';
    }

    this.activatedRoute.queryParams.subscribe((params) => {
      const formNo = params['queryFormNo'];
      this.myFlowService.getFlowAuditLog(formNo,this.formId).subscribe({
        next: (auditLog) => {
          if (this.pendingIncludeMe(auditLog)) {
            this.mode = 'approving'
          }
        }
      });
    });
  }

  getFormTitle(formNo: string, formStatus: string) {
    const formType = this.translateService.instant('LicenseMgmt.FormType.LEH');
    const status = this.translateService.instant(`APPROVING_LEH.Label.${formStatus}`);
    return `${formType} (${status})`
    // const referenceNo = this.translateService.instant('APPROVING_LEH.Label.ReferenceNo');
    // const status = this.translateService.instant(`APPROVING_LEH.Label.${formStatus}`);
    // return `${referenceNo} / ${formNo} (${status})`
  }

  getFormStatus(formStatus: string){
    const status = this.translateService.instant(`APPROVING_LEH.Label.${formStatus}`);
    return `(${status})`
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
}
