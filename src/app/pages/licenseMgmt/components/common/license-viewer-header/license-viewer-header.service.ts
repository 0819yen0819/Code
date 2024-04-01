import { LoaderService } from './../../../../../core/services/loader.service';
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, take, takeLast } from 'rxjs';
import { CommonApiService } from 'src/app/core/services/common-api.service';
import { LicenseControlApiService } from 'src/app/core/services/license-control-api.service';
import { ECCNLERules } from 'src/app/core/model/eccn-info';
import { ToastService } from 'src/app/core/services/toast.service';

@Injectable({
  providedIn: 'root',
})
export class LicenseViewerHeaderService {
  isReload!: BehaviorSubject<boolean>;

  constructor(
    private licenseControlApiService: LicenseControlApiService,
    private commonApiService: CommonApiService,
    private loaderService: LoaderService,
    private toastService: ToastService
  ) {
    this.isReload = new BehaviorSubject<boolean>(false);
  }

  setReloadNotice(status: boolean): void {
    this.isReload.next(status);
  }

  //# ECCN LE Rules
  //> 下載 ECCN LE Rules Event
  downloadTargetECCNLERuleList(filterRule: any): void {
    const getTargetECCNLERuleFileNo$ = (): Observable<number> =>
      new Observable<number>((obs) => {
        this.licenseControlApiService
          .getTargetECCNLERuleList({
            action: 'download',
            ...filterRule,
          })
          .pipe(takeLast(1))
          .subscribe({
            next: (res) => {
              obs.next(res.fileId);
              obs.complete();
            },
            error: (err) => {
              console.error(err.message);
              this.toastService.error('System.Message.Error');
              obs.next(null);
              obs.complete();
            },
          });
      });

    this.loaderService.show();
    getTargetECCNLERuleFileNo$().subscribe((fileId) => {
      this.loaderService.hide();
      if (fileId) {
        this.commonApiService.downloadFile(fileId);
      }
    });
  }

  //# ECCN LE Rules
  //> 取得符合條件的 ECCN LE Rules Event
  getTargetECCNLERuleList(filterRule: any): Observable<ECCNLERules[]> {
    const getTargetECCNLERuleList$ = (): Observable<ECCNLERules[]> =>
      new Observable<ECCNLERules[]>((obs) => {
        this.licenseControlApiService
          .getTargetECCNLERuleList({
            action: 'search',
            ...filterRule,
          })
          .pipe(take(1))
          .subscribe({
            next: (res) => {
              obs.next(res.licenseExceptionRuleList);
              obs.complete();
            },
            error: (err) => {
              console.error(err.message);
              this.toastService.error('System.Message.Error');
              obs.next([]);
              obs.complete();
            },
          });
      });

    return getTargetECCNLERuleList$();
  }

  //# ECCN Status Maintain
  //> 取得符合條件的 ECCN Status
  getTargetECCNList(filterRule: any): Observable<any> {
    const getTargetECCNList$ = (): Observable<ECCNLERules[]> =>
      new Observable<ECCNLERules[]>((obs) => {
        const model = {
          action: 'S',
          ...filterRule,
          ...{ keyword: filterRule.eccn },
          ...{ activeFlag: filterRule.flag },
        };

        delete model.eccn;
        delete model.flag;

        this.licenseControlApiService
          .getTargetECCNList(model)
          .pipe(take(1))
          .subscribe({
            next: (res) => {
              obs.next(res.eccnList);
              obs.complete();
            },
            error: (err) => {
              console.error(err.message);
              this.toastService.error('System.Message.Error');
              obs.next([]);
              obs.complete();
            },
          });
      });

    return getTargetECCNList$();
  }

  //# ECCN Status Maintain
  //> 下載符合條件的 ECCN Status
  downloadTargetECCNList(filterRule: any): void {
    const getTargetECCNLERuleFileNo$ = (): Observable<number> =>
      new Observable<number>((obs) => {
        const model = {
          action: 'E',
          ...filterRule,
          ...{ keyword: filterRule.eccn },
          ...{ activeFlag: filterRule.flag },
        };

        delete model.eccn;
        delete model.flag;

        this.licenseControlApiService
          .getTargetECCNList(model)
          .pipe(take(1))
          .subscribe({
            next: (res) => {
              obs.next(res.fileId);
              obs.complete();
            },
            error: (err) => {
              console.error(err.message);
              this.toastService.error('System.Message.Error');
              obs.next(null);
              obs.complete();
            },
          });
      });

    this.loaderService.show();
    getTargetECCNLERuleFileNo$().subscribe((fileId) => {
      this.loaderService.hide();
      if (fileId) {
        this.commonApiService.downloadFile(fileId);
      }
    });
  }
}
