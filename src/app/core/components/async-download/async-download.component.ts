import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { Subscription } from 'rxjs';
import { CommonApiService } from '../../../core/services/common-api.service';
import { LanguageService } from '../../../core/services/language.service';
import { UserContextService } from '../../../core/services/user-context.service';

@Component({
  selector: '',
  template: '',
})
export class AsyncDownloadComponent implements OnInit, OnDestroy {
  private onLangChange$: Subscription;
  private loginStateSubscription$: Subscription;
  queryParams: any;

  constructor(
    private activatedRoute: ActivatedRoute,
    private userContextService: UserContextService,
    private languageService: LanguageService,
    private translateService: TranslateService,
    private commonApiService: CommonApiService,
  ) {

    if (this.userContextService.user$.getValue) {
    }
    this.onLangChange$ = this.translateService.onLangChange.subscribe(() => { });

    this.translateService.use(this.languageService.getLang()).subscribe((next) => { });
  }

  ngOnInit(): void {
    this.activatedRoute.queryParams.subscribe((res) => {
      this.queryParams = res;
    });
    console.log(this.queryParams);
    this.commonApiService.downloadFile(this.queryParams.fileId);
  }

  ngOnDestroy(): void {
    [this.onLangChange$, this.loginStateSubscription$].forEach(
      (subscription: Subscription) => {
        if (subscription != null || subscription != undefined)
          subscription.unsubscribe();
      }
    );
  }


}
