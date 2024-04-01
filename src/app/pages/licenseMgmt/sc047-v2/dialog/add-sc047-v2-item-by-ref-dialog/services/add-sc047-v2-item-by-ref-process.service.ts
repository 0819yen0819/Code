import { Injectable } from '@angular/core';
import { concatMap, Observable, take } from 'rxjs';
import { ERPEXPDOInfo } from 'src/app/core/model/exp-ref-info';
import { ObjectFormatService } from 'src/app/core/services/object-format.service';
import { LicenseControlApiService } from './../../../../../../core/services/license-control-api.service';
import { UserContextService } from './../../../../../../core/services/user-context.service';

@Injectable({
  providedIn: 'root',
})
export class AddSc047V2ItemByRefProcessService {
  constructor(
    private licenseControlApiService: LicenseControlApiService,
    private userContextService: UserContextService,
    private objectFormatService: ObjectFormatService
  ) {}

  private getEXPDOAPIParamsFromERP$(): Observable<{
    key: string;
    url: string;
  }> {
    const getEXPDOAPIParamsFromERP$ = () =>
      new Observable<{
        key: string;
        url: string;
      }>((obs) => {
        this.licenseControlApiService
          .licenseRule(this.userContextService.user$.getValue().tenant)
          .pipe(take(1))
          .subscribe({
            next: (res: {
              licenseRules: {
                ruleDesc: string;
                ruleId: string;
                ruleType: string;
                ruleVal: string;
                tenant: string;
              }[];
            }) => {
              obs.next({
                key: res.licenseRules.filter(
                  (data) => data.ruleId === 'LICENSE-EXPORT-REFSHIPMENT-KEY'
                )[0].ruleVal,
                url: res.licenseRules.filter(
                  (data) => data.ruleId === 'LICENSE-EXPORT-REFSHIPMENT-URL'
                )[0].ruleVal,
              });
              obs.complete();
            },
            error: (err) => {
              obs.error(err);
              obs.complete();
            },
          });
      });

    return getEXPDOAPIParamsFromERP$();
  }

  private GetEXPDOList$(
    apiParams: {
      key: string;
      url: string;
    },
    model: {
      trxNo: string;
      address: string;
      orgId: string;
      targetNo: string;
      vctype: string;
      deliverTo?: string;
    }
  ): Observable<ERPEXPDOInfo[]> {
    const getEXPDOList$ = (
      apiParams: {
        key: string;
        url: string;
      },
      model: {
        trxNo: string;
        address: string;
        orgId: string;
        targetNo: string;
        vctype: string;
        deliverTo?: string;
      }
    ): Observable<ERPEXPDOInfo[]> =>
      new Observable<ERPEXPDOInfo[]>((obs) => {
        this.licenseControlApiService
          .getEXPDOListFromERP(
            apiParams,
            this.objectFormatService.ObjectClean(model)
          )
          .pipe(take(1))
          .subscribe({
            next: (res: { xxomLicenseShipment: ERPEXPDOInfo[] | null }) => {
              if (res.xxomLicenseShipment === null) {
                obs.next([]);
              } else {
                obs.next(res.xxomLicenseShipment);
              }
              obs.complete();
            },
            error: (err) => {
              obs.error(err);
              obs.complete();
            },
          });
      });

    return getEXPDOList$(apiParams, model);
  }

  getRefListFromERP$(model: {
    trxNo: string;
    address: string;
    orgId: string;
    targetNo: string;
    vctype: string;
    deliverTo?:string
  }): Observable<ERPEXPDOInfo[]> {
    return this.getEXPDOAPIParamsFromERP$().pipe(
      concatMap((res) => this.GetEXPDOList$(res, model))
    );
  }
}
