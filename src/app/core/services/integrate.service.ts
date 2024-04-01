import { Injectable } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { lastValueFrom } from 'rxjs';
import { environment } from 'src/environments/environment';
import { MyFlowService } from './my-flow.service';

@Injectable({
  providedIn: 'root',
})
export class IntegrateService {
  private routeParams = {
    queryFormNo: '',
    backUrl: '',
    formTypeId:''
  };
  curState = '';

  constructor(
    private router: Router,
    private activatedRoute: ActivatedRoute,
    private translateService: TranslateService,
    private myFlowService: MyFlowService
  ) {
    this.activatedRoute.queryParams.subscribe((params) => {
      this.routeParams.queryFormNo = params['queryFormNo'];
      this.routeParams.backUrl = params['backUrl']; 
    });
  }
  
  init(formTypeId:string){
    lastValueFrom(this.myFlowService.getFormLog(this.routeParams.queryFormNo,formTypeId)).then((formLog: any) => {
      this.curState = !formLog.status ? 'Apply' : formLog.status;
    });
  }

  get backBtnLabel() {
    const backUrlExist = !!this.routeParams.backUrl;
    if (this.isApprovingUrl()) {
      return this.translateService.instant(
        `${
          backUrlExist
            ? 'Button.Label.BackToPendingList'
            : 'Button.Label.PreviousPage'
        }`
      );
    } else if (!this.isApprovingUrl()) {
      return this.translateService.instant('Button.Label.PreviousPage');
    }
  }

  backBtnOnClick() {
    const isDevEnv = environment.storeRedirectUrlPrefix == 'local';
    if (isDevEnv) {
      if (this.isApprovingUrl()) {
        this.router.navigate(['/', 'applicationMgmt', 'pending']);
      } else {
        this.router.navigate(['/', 'applicationMgmt', 'my-application']);
      }
    } else {
      window.open(
        `${environment.storeRedirectUrlPrefix}?entryUrl=${
          this.routeParams.backUrl ?? ''
        }`,
        '_self'
      );
    }
  }

  cancelOnClick() {
    if (environment.storeRedirectUrlPrefix == 'local') {
      this.router.navigate(['/', 'applicationMgmt', 'new']);
    } else {
      this.curState === 'Draft' &&
        window.open(
          `${environment.storeRedirectUrlPrefix}?entryUrl=myforms/search`,
          '_self'
        );
      this.curState === 'Apply' &&
        window.open(
          `${environment.storeRedirectUrlPrefix}?entryUrl=myforms/new`,
          '_self'
        );
    }
  }

  formToFlowRedirect(
    formNo: string,
    action: 'Draft' | 'Apply' | 'Approve' | 'ReAssign',
    formTypeId:string
  ): void {
    if (environment.storeRedirectUrlPrefix === 'local') {
      if (action === 'Draft') {
        this.router.navigate(['applicationMgmt', 'my-application']);
      } else {
        this.router.navigate(['applicationMgmt', 'pending']);
      }
    } else {
      if (action === 'Draft') {
        window.open(
          `${environment.storeRedirectUrlPrefix}?entryUrl=myforms/search`,
          '_self'
        );
      } else {
        window.open(
          `${environment.storeRedirectUrlPrefix}?entryUrl=myforms/success&type=${formNo}&formTypeId=${formTypeId}`,
          '_self'
        );
      }
    }
  }

  private isApprovingUrl() {
    return this.router.url.includes('approving');
  }
}
