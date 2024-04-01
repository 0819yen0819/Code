import { Component, OnDestroy, OnInit } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { MsalBroadcastService, MsalService } from '@azure/msal-angular';
import { InteractionStatus } from '@azure/msal-browser';
import { Subject } from 'rxjs';
import { filter, takeUntil } from 'rxjs/operators';
import { LanguageService } from './core/services/language.service';
import { LoaderService } from './core/services/loader.service';
import { SessionService } from './core/services/session.service';
import { ThemeService } from './core/services/theme.service';
import { ToastService } from './core/services/toast.service';
import { NoticeCheckHandlerService } from './core/services/notice-check-handler.service';
import {
  NoticeDialogParams,
} from './core/model/selector-dialog-params';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent implements OnInit, OnDestroy {
  private readonly _destroying$ = new Subject<void>();
  noticeCheckDialogParams: NoticeDialogParams;
  noticeContentList: string[];

  showLoader: boolean = false;
  theme: string;

  title = 'socheck-portal';
  isExpanded = false;
  menuItems = [
    {
      label: '我的首頁12345',
      icon: 'home',
      routerLink: '/home',
    },
    {
      label: '表單管理',
      icon: 'assignment',
      routerLink: '/formMgmt',
    },
    {
      label: '黑名單管理',
      icon: 'assignment',
      routerLink: '/blacklistMgmt',
    },
    {
      label: '許可證管理',
      icon: 'change_circle',
      routerLink: '/licenseMgmt',
    },
    {
      label: '白名單管理',
      icon: 'supervisor_account',
      routerLink: '/whitelistMgmt',
    },
    {
      label: '設定',
      icon: 'settings',
      routerLink: '/settings',
    },
  ];

  constructor(
    // @Inject(DOCUMENT) private document,
    private router: Router,
    private loaderService: LoaderService,
    private languageService: LanguageService,
    private themeService: ThemeService,
    private sessionService: SessionService,
    private msalBroadcastService: MsalBroadcastService,
    private toastService: ToastService,
    private noticeCheckHandlerService: NoticeCheckHandlerService
  ) {
    var theme = this.sessionService.getItem('selected-theme');
    if (theme != null && theme.length > 0) {
      this.theme = theme;
      this.themeService.selectTheme(theme);
    } else {
      this.theme = 'theme-blue';
    }
    router.events.subscribe((val) => {
      if (val instanceof NavigationEnd) {
        this.toastService.clear();
      }
    });
  }

  isActive(path: string): boolean {
    return this.router.url.includes(path);
  }

  ngOnInit() {
    this.loaderService.status.subscribe((val: boolean) => {
      this.showLoader = val;
    });

    this.themeService.theme.subscribe((val: string) => {
      this.theme = val;
    });

    this.msalBroadcastService.inProgress$
      .pipe(
        filter(
          (status: InteractionStatus) => status === InteractionStatus.None
        ),
        takeUntil(this._destroying$)
      )
      .subscribe(() => {
        console.log('msalBroadcastService.inProgress');
      });

    this.loaderService.show();

    this.languageService.initLang();
    console.log('Language: ' + this.languageService.getLang());

    this.loaderService.hide();

    this.noticeDialogListener();
  }

  ngOnDestroy() {
    this._destroying$.next(null);
    this._destroying$.complete();
  }

  //# TK-36887
  private noticeDialogListener(): void {
    this.noticeCheckHandlerService.noticeCheckDialogParams
      .pipe(takeUntil(this._destroying$))
      .subscribe((status) => {
        this.noticeCheckDialogParams = status;
      });
    this.noticeCheckHandlerService.noticeContentList
      .pipe(takeUntil(this._destroying$))
      .subscribe((msg) => {
        this.noticeContentList = msg;
      });
  }

  closeNoticeDialog(): void {
    this.noticeCheckHandlerService.closeNoticeDialog();
  }
}
