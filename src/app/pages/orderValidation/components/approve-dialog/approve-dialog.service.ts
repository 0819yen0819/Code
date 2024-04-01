import { Injectable, isDevMode, OnDestroy, OnInit } from '@angular/core';
import { BehaviorSubject, Observable, Subject, takeUntil } from 'rxjs';
import { SimpleUserInfo } from 'src/app/core/model/user-info';
import { AuthApiService } from 'src/app/core/services/auth-api.service';
import { UserContextService } from 'src/app/core/services/user-context.service';
import { skipWhile } from 'rxjs/operators';
import { SelectItem } from 'primeng/api';
import { MyFlowService } from 'src/app/core/services/my-flow.service';

@Injectable({
  providedIn: 'root'
})
export class SovApproveDialogService {
  fuzzyEmpInfosOptions = new BehaviorSubject<SelectItem<SimpleUserInfo>[]>([]); // 下拉選單人員名單(加簽、加簽傳回)
  formTypeId :string = '';
  private unsubscribeEvent = new Subject(); // 取消訂閱
  private rollbackStepOptions: SelectItem<any>[] = new Array<SelectItem<any>>(); // 退回 下拉選單使用者選項
  private stepNumber: number;
  private nowStep: string;
  private isAssigneeTask: boolean = true; // 是否是被加簽的
  private isNewForm: boolean = false;
  public auditLogIsEmpty: boolean = false;

  constructor(
    private userContextService: UserContextService,
    private authApiService: AuthApiService,
    private myFlowService: MyFlowService
  ) { }

  destroy(): void {
    this.unsubscribeEvent.next(null);
    this.unsubscribeEvent.complete();
  }

  get getStepNumber() { // 歷程Log中取得的資訊
    return this.stepNumber;
  }

  get getNowStep() { // 歷程Log中取得的資訊
    return this.nowStep;
  }

  get getRollBackStepOptions() { // 歷程Log中取得的資訊
    return this.rollbackStepOptions;
  }

  get getIsAssigneeTask() {
    return this.isAssigneeTask;
  }

  get getIsNewForm(){
    return this.isNewForm;
  }

  /**
 * 取得 "加簽至下一關"、"加簽後傳回" 下拉選單的人員
 *
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

  /**
  * 透過 歷程Log 取得("退回"下拉選單的人員、當前step資訊)
  */
  public onGetFlowAuditLog(formNo: string) {

    return new Promise<boolean>((resolve, reject) => {
      if (!this.formTypeId) {resolve(true); return isDevMode() && console.log("請先傳入formTypeId ! approve-dialog")}
      if (formNo === '') { this.isAssigneeTask = false; this.isNewForm = true;  return resolve(true);}else{this.isNewForm = false;} // url中沒有單號，表示這張單是新增(也不會有歷程)

      this.myFlowService.getFlowAuditLog(formNo,this.formTypeId).subscribe({
        next: (auditLog) => {
          auditLog = auditLog.sort((a,b)=>{return a.receiveTime - b.receiveTime})
          isDevMode() && console.log(auditLog);

          let pendingArr = [];
          for(let i = 0 ; i < auditLog.length ; i++) {
            if (!auditLog[i].completeTime){
              pendingArr.push(auditLog[i]);
            }
          }
          const pendingLog = pendingArr.sort((a,b)=>{return b.stepNumber - a.stepNumber})[0];

          this.auditLogIsEmpty = !auditLog || (auditLog?.length === 0);
          // 取得當前step資訊
          auditLog
            .filter((data) => data.status === 'Approving' || data.status === 'Assignee')
            .forEach((data) => { this.stepNumber = data.stepNumber; this.nowStep = data.stepName; })


          // 取得 退回 下拉選單選項(this.rollbackStepOptions) 做法1 
          this.rollbackStepOptions = auditLog
          .filter((data) => data.status === 'Approve')
          .filter(log => log.stepNumber < pendingLog.stepNumber)
          .map((obj) => {
            let result = {};
            let code;
            for (let i = auditLog.length - 1; i >= 0; i--) {
                if (auditLog[i].stepNumber !== obj.stepNumber) {
                    continue;
                }
                if (code != null && code === auditLog[i].assigneeCode) {
                    if ('replace' === auditLog[i].assigneeType?.toLowerCase()) {
                        result = {
                            label: 'Step.' + auditLog[i].stepNumber + '：' + auditLog[i].authorizerCode + ' ' + auditLog[i].signerNameCn + ' / ' + auditLog[i].signerNameEn,
                            value: auditLog[i].returnStep
                        }
                        code = null;
                    } else if ('reassign' === auditLog[i].assigneeType?.toLowerCase()) {
                        code = auditLog[i].signerCode;
                    }
                }

                if (auditLog[i].seq === obj.seq) {
                    result = {
                        label: 'Step.' + auditLog[i].stepNumber + '：' + auditLog[i].authorizerCode + ' ' + auditLog[i].signerNameCn + ' / ' + auditLog[i].signerNameEn,
                        value: auditLog[i].returnStep
                    }
                    code = auditLog[i].signerCode;
                }
            }
            return result;
          })
          .filter((thing, i, arr) => arr.findIndex((t) => t.value === thing.value) === i)
          
          // 取得 退回 下拉選單選項(this.rollbackStepOptions) 做法2
          // let rollbackOptions = [];
          // const latestStep = lastestAuditLog.stepNumber;
          // for (let step = 1; step < latestStep; step++) { // 遍歷每個Step (Step1是申請人關卡)
          //   const curStepLogs = auditLog.filter((data) => data.stepNumber === step); // 找出當前 Step 的所有 Log
          //   const curStepApproveLogs = auditLog.filter((data) => (data.status === 'Approve') && data.stepNumber === step) // 找出當前 Step 為 Approve 的 Log
          //   curStepApproveLogs.forEach(approveLog => { // 當前 Step 為 Approve 
          //     let rollbackTemp = approveLog;
          //     for (let i = curStepLogs.length - 1; i >= 0; i--) {
          //       if (curStepLogs[i].assigneeCode === rollbackTemp.signerCode) { rollbackTemp = curStepLogs[i]; }
          //     }
          //     rollbackOptions.push(rollbackTemp);
          //   });
          // }
          // this.rollbackStepOptions = rollbackOptions
          //   .map((obj) => { return { label: `Step.${obj.stepNumber} ： ${obj.signerCode} ${obj.signerNameCn} / ${obj.signerNameEn}`, value: obj.returnStep } })
          //   .filter((thing, i, arr) => arr.findIndex((t) => t.value === thing.value) === i)
      
          const myUserCode = this.userContextService.user$.getValue().userCode;
          const IAmAssignee = auditLog.filter((data) => data.status === 'Assignee' && data.signerCode === myUserCode).length !== 0;
          const firstStep = auditLog.length === 2 && auditLog[0]?.signerCode === myUserCode && auditLog[1]?.signerCode === myUserCode;
          this.isAssigneeTask = IAmAssignee && !firstStep;
          // 如果是被加簽，就只能選核准。但，如果是被加簽，可是是ERP拋過來時的第一次加簽就可以有其他按鈕選項(加簽至下關、加簽傳回...等)
          // 所以僅當使用者為加簽人且當前並非第一次ERP拋過來時才會限制只剩"核准"按鈕
          resolve(true);
        },
        error(err) {
          console.error(err);
          resolve(true);
        }
      });
    })
  }


}
