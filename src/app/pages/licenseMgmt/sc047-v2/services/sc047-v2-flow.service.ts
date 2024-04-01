import { Injectable } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { TranslateService } from '@ngx-translate/core';
import { Observable, take } from 'rxjs';
import { AuditAction } from 'src/app/core/model/audit-action';
import { OUInfo } from 'src/app/core/model/ou-info';
import { LicenseControlApiService } from 'src/app/core/services/license-control-api.service';
import { ToastService } from 'src/app/core/services/toast.service';
import { environment } from 'src/environments/environment';
import { LicenseFormStatusEnum } from './../../../../core/enums/license-form-status';
import { UserDepts } from './../../../../core/model/user-depts';
import { ObjectFormatService } from './../../../../core/services/object-format.service';
import { UserContextService } from './../../../../core/services/user-context.service';
import { CurFormStatusService } from './../../services/cur-form-status.service';

@Injectable({
  providedIn: 'root',
})
export class Sc047V2FlowService {
  constructor(
    private objectFormatService: ObjectFormatService,
    private userContextService: UserContextService,
    private licenseControlApiService: LicenseControlApiService,
    private curFormStatusService: CurFormStatusService,
    private translateService: TranslateService,
    private toastService: ToastService
  ) {}

  //> Flow 進單流程
  onFlowSubmitProcess$(
    mode: 'Apply' | 'Draft' | 'ReAssign' | 'Approve',
    formNo: string,
    userDpet: UserDepts,
    form: FormGroup,
    itemList: any[],
    isConsigneeListEmpty: boolean,
    ouInfo: OUInfo,
    cosigners?: string[],
    auditAcion?: AuditAction
  ): Observable<boolean> {
    const saveSCLicenseForm$ = (model): Observable<boolean> =>
      new Observable<any>((obs) => {
        this.licenseControlApiService
          .postSaveSCLicense(model)
          .pipe(take(1))
          .subscribe({
            next: () => {
              obs.next(true);
              obs.complete();
            },
            error: (err) => {
              console.error(err);
              this.toastService.error(err.message);
              obs.next(false);
              obs.complete();
            },
          });
      });

    const approveSCLicenseForm$ = (model): Observable<boolean> =>
      new Observable<any>((obs) => {
        this.licenseControlApiService
          .postApproveSCLicense(model)
          .pipe(take(1))
          .subscribe({
            next: () => {
              obs.next(true);
              obs.complete();
            },
            error: (err) => {
              console.error(err);
              this.toastService.error(err.message);
              obs.next(false);
              obs.complete();
            },
          });
      });

    const formModel = this.rebuildModel(
      mode,
      formNo,
      userDpet,
      form,
      itemList,
      isConsigneeListEmpty,
      ouInfo,
      cosigners,
      auditAcion
    );

    if (['Draft', 'Apply', 'ReAssign'].includes(mode)) {
      return saveSCLicenseForm$(formModel);
    } else {
      return approveSCLicenseForm$(formModel);
    }
  }

  //> After Flow 進單後行為
  onAfterFlowSubmitEvent$(): Observable<string[]> {
    const afterSubmitEvent$ = (): Observable<string[]> =>
      new Observable<string[]>((obs) => {
        this.curFormStatusService
          .getCurFormStatus()
          .pipe(take(1))
          .subscribe((res) => {
            let noticeContentList = new Array<string>();

            if (res.status === LicenseFormStatusEnum.DRAFT) {
              if (
                res.success &&
                environment.storeRedirectUrlPrefix === 'local'
              ) {
                noticeContentList = [
                  `SC047 / SC054：${res.formNo} ${this.translateService.instant(
                    'LicenseMgmt.Common.Hint.DraftSuccess'
                  )}`,
                ];
              } else {
                noticeContentList = [
                  `SC047 / SC054：${res.formNo} ${this.translateService.instant(
                    'LicenseMgmt.Common.Hint.DraftFailed'
                  )}`,
                ];
              }

              obs.next(noticeContentList);
              obs.complete();
            }

            if (res.status === LicenseFormStatusEnum.APPLY) {
              if (
                res.success &&
                environment.storeRedirectUrlPrefix === 'local'
              ) {
                noticeContentList = [
                  `SC047 / SC054：${res.formNo} ${this.translateService.instant(
                    'LicenseMgmt.Common.Hint.ApplySuccess'
                  )}`,
                ];
              } else {
                noticeContentList = [
                  `SC047 / SC054：${res.formNo} ${this.translateService.instant(
                    'LicenseMgmt.Common.Hint.ApplyFailed'
                  )}`,
                ];
              }

              obs.next(noticeContentList);
              obs.complete();
            }

            if (
              res.status === LicenseFormStatusEnum.APPROVE ||
              res.status === LicenseFormStatusEnum.ReAssign
            ) {
              if (
                res.success &&
                environment.storeRedirectUrlPrefix === 'local'
              ) {
                noticeContentList = [
                  `SC047 / SC054：${res.formNo} ${this.translateService.instant(
                    'LicenseMgmt.Common.Hint.ApproveSuccess'
                  )}`,
                ];
              } else {
                noticeContentList = [
                  `SC047 / SC054：${res.formNo} ${this.translateService.instant(
                    'LicenseMgmt.Common.Hint.ApproveFailed'
                  )}`,
                ];
              }

              obs.next(noticeContentList);
              obs.complete();
            }
          });
      });

    return afterSubmitEvent$();
  }

  //> Rebuild form model
  private rebuildModel(
    mode: 'Apply' | 'Draft' | 'ReAssign' | 'Approve',
    formNo: string,
    userDept: UserDepts,
    form: FormGroup,
    itemList: any[],
    isConsigneeListEmpty: boolean,
    ouInfo: OUInfo,
    cosigners?: string[],
    auditAcion?: AuditAction
  ): any {
    let formModel = this.objectFormatService.ObjectClean(form.getRawValue());
    for (let [index, item] of itemList.entries()) {
      item.lineId = index + 1;
      item.quantity = this.objectFormatService.RecorveryThousandFormat(
        item.quantity
      );
      item = this.objectFormatService.ObjectClean(item);
      delete item.key;
    }

    if (isConsigneeListEmpty) {
      if (ouInfo) {
        if (typeof ouInfo === 'object') {
          form
            .get('consignee')
            .setValue(`${ouInfo.ouName} ( ${ouInfo.ouShortName} )`);
          //# TK-21421
          // form.get('consigneeAddress').setValue(form.get('shipToAddress').value);
        } else {
          form.get('consignee').setValue(ouInfo);
        }
      }
    }

    formModel = this.objectFormatService.ObjectClean({
      ...formModel,
      ...{
        tenant: this.userContextService.user$.getValue().tenant,
        action: mode === 'ReAssign' ? 'addAssignee' : mode,
        formNo: formNo,
        userCode: this.userContextService.user$.getValue().userCode,
        userName: this.userContextService.user$.getValue().userName,
        deptCode: userDept.deptCode,
        deptName: userDept.deptnameTw,
        creationDate: new Date().getTime(),
        datas: itemList,
      },
      ...form.getRawValue(),
    });

    delete formModel.consigneeKit;

    if (mode === 'ReAssign') {
      formModel.cosigner = cosigners;
    }

    if (mode === 'Approve') {
      formModel = {
        ...formModel,
        ...auditAcion,
      };
    }

    return formModel;
  }
}
