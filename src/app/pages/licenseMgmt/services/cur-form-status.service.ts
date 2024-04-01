import { MyFlowService } from 'src/app/core/services/my-flow.service';
import { Injectable } from '@angular/core';
import { BehaviorSubject, lastValueFrom, Observable, take } from 'rxjs';
import { LicenseFormStatusEnum } from 'src/app/core/enums/license-form-status';
import { FormLogInfo } from 'src/app/core/model/form-log-info';

@Injectable({
  providedIn: 'root',
})
export class CurFormStatusService {
  currentFormStatus!: BehaviorSubject<{
    status: string;
    formNo?: string;
  }>;

  private curFormNo!: BehaviorSubject<string | null>;
  curFormStatus!: BehaviorSubject<string | null>;

  constructor(private myFlowService: MyFlowService) {
    //> init current page status of Draft
    this.currentFormStatus = new BehaviorSubject<{
      status: string;
      formNo?: string;
      success?: boolean;
    }>({
      status: LicenseFormStatusEnum.DRAFT,
    });
    this.curFormNo = new BehaviorSubject<string | null>(null);
    this.curFormStatus = new BehaviorSubject<string | null>(null);
  }

  setCurFormStatus(model: {
    status: string;
    formNo?: string;
    success?: boolean;
  }): void {
    this.currentFormStatus.next(model);
  }

  getCurFormStatus(): Observable<{
    status: string;
    formNo?: string;
    success?: boolean;
  }> {
    return this.currentFormStatus.asObservable();
  }

  resetCurFormStatus(): void {
    this.currentFormStatus.next({
      status: LicenseFormStatusEnum.DRAFT,
    });
    this.curFormStatus.next(null);
  }

  //> Get target form current status by form no.
  async getCurFormStatus$(
    formNo: string = null,
    formTypeId?: string
  ): Promise<Observable<string>> {
    //> 用 Promise 是 await 得到表單狀態
    //> 用 Observable 是考慮未來可能多層嵌套，可以用 BehaviorSubject 拿取
    //> init 時機點 主表單載入呼叫該 func
    //> 本 cache 刷新時機是 formNo 變更

    const getFormStatus$ = (
      formNo: string,
      formTypeId: string
    ): Observable<string> =>
      new Observable<string>((obs) => {

        this.myFlowService
          .getFormLog(formNo, formTypeId)
          .pipe(take(1))
          .subscribe({
            next: (res: FormLogInfo) => {
              obs.next(
                res.status
                  ? res.status.toLowerCase()
                  : LicenseFormStatusEnum.DRAFT
              );
              obs.complete();
            },
            error: (err) => {
              console.error(err);
              obs.next('');
              obs.complete();
            },
          });
      });

    if (formNo && formTypeId) {
      this.curFormNo.next(formNo);
      this.curFormStatus.next(
        await lastValueFrom(getFormStatus$(formNo, formTypeId))
      );
    }

    return this.curFormStatus.asObservable();
  }
}
