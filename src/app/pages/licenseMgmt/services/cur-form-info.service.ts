import { AuditHistoryLog } from 'src/app/core/model/sign-off-history';
import { Injectable } from '@angular/core';
import { BehaviorSubject, lastValueFrom, Observable, take } from 'rxjs';
import { MyFlowService } from 'src/app/core/services/my-flow.service';

@Injectable({
  providedIn: 'root',
})
export class CurFormInfoService {
  currentFormInfo!: BehaviorSubject<any>;

  private curFormNo!: BehaviorSubject<string | null>;
  curFormAuditLog!: BehaviorSubject<Array<AuditHistoryLog> | null>;

  constructor(private myFlowService: MyFlowService) {
    //> init current page info
    this.currentFormInfo = new BehaviorSubject<any>(null);
    this.curFormAuditLog = new BehaviorSubject<Array<AuditHistoryLog> | null>(null);
    this.curFormNo = new BehaviorSubject<string | null>(null);
  }

  setCurFormInfo(formInfo: any): void {
    this.currentFormInfo.next(formInfo);
  }

  getCurFormInfo(): Observable<any> {
    return this.currentFormInfo.asObservable();
  }

  resetCurFormInfo(): void {
    this.currentFormInfo.next(null);
    this.curFormAuditLog.next(null);
  }

  //> Get target form audit history by form no.
  async getCurFormAuditLog$(
    formNo: string = null,
    formTypeId?: string
  ): Promise<Observable<Array<AuditHistoryLog>>> {
    //> 用 Promise 是 await 得到表單歷程
    //> 用 Observable 是考慮未來可能多層嵌套，可以用 BehaviorSubject 拿取
    //> init 時機點 主表單載入呼叫該 func
    //> 本 cache 刷新時機是 formNo 變更

    const getFlowAuditLog$ = (formNo: string) =>
      new Observable<AuditHistoryLog[]>((obs) => {
        if (formNo) {
          this.myFlowService
            .getFlowAuditLog(formNo, formTypeId)
            .pipe(take(1))
            .subscribe((res) => {
              res.sort((a: { seq: number }, b: { seq: number }) =>
                a.seq > b.seq ? 1 : -1
              );
              obs.next(res);
              obs.complete();
            });
        } else {
          obs.next([]);
          obs.complete();
        }
      });

    if (
      formNo &&
      (!this.curFormNo ||
        (this.curFormNo && this.curFormNo.getValue() !== formNo))
    ) {
      this.curFormNo.next(formNo);
      this.curFormAuditLog.next(await lastValueFrom(getFlowAuditLog$(formNo)));
    }

    return this.curFormAuditLog.asObservable();
  }
}
