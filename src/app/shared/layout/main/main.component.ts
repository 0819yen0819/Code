import { Component, HostListener, OnDestroy, OnInit } from '@angular/core';
import { Event, NavigationEnd, Router } from '@angular/router';
import { MsalService } from '@azure/msal-angular';
import { TranslateService } from '@ngx-translate/core';
import { MenuItem, SelectItem } from 'primeng/api';
import { Subject, Subscription } from 'rxjs';
import { SessionService } from 'src/app/core/services/session.service';
import { UserContextService } from 'src/app/core/services/user-context.service';
import { environment } from 'src/environments/environment';
import { AuthApiService } from './../../../core/services/auth-api.service';
import { ToastService } from './../../../core/services/toast.service';
import { StoreBatchEditEntryService } from 'src/app/pages/storeBatchEditEntry/store-batch-edit-entry.service';

@Component({
  selector: 'app-main',
  templateUrl: './main.component.html',
  styleUrls: ['./main.component.scss'],
})
export class MainComponent implements OnInit, OnDestroy {
  showLoader = false;

  displayMenu = true;
  menuItems: MenuItem[];

  langOptions: SelectItem[];
  selectedLang: string;

  private onLangChange$: Subscription;
  private onUserChange$: Subscription;

  private unsubscribeEvent = new Subject();

  currentUser: any;

  envName: string;
  isShowEnv: boolean = false;
  isShowNavBar: boolean;

  constructor(
    private router: Router,
    private msalService: MsalService,
    private authApiService: AuthApiService,
    private userContextService: UserContextService,
    private translateService: TranslateService,
    private sessionService: SessionService,
    private toastService: ToastService,
    public storeBatchEditEntryService: StoreBatchEditEntryService
  ) {
    //> get current url and check
    this.checkIsShowNavBar();
  }

  ngOnInit(): void {
    this.menuItems = new Array(); // end: menuItems

    this.langOptions = [
      { label: '繁體中文', value: 'zh-tw' },
      { label: 'English', value: 'en-us' },
    ];

    this.selectedLang = this.translateService.currentLang;
    this.changeLanguage();

    this.router.events.subscribe((event: Event) => {
      if (event instanceof NavigationEnd) {
        this.routerChanged();
      }
    });

    this.onUserChange$ = this.userContextService.user$.subscribe(() => {
      console.log('setHasLogin...');
      this.setHasLogin();
    });

    //> check is test env
    if (environment.envName !== 'PROD') {
      this.envName = environment.envName;
      this.isShowEnv = true;
    }

    this.getTenantFormTypeList();
  }

  private checkIsShowNavBar() {
    let isHide = true;
    const noHideList = [
      '/applicationMgmt/',
      '/home',
      '/blacklistMgmt/dpl-result',
      '/blacklistMgmt/sample-out-dpl',
      '/sysadmin/',
      '/formMgmt/',
      '-mtn',
      '-setup',
    ];
    for (const urlpath of noHideList) {
      if (this.router.url.includes(urlpath)) {
        isHide = false;
        break;
      }
    }

    const hideList = ['soa-control-setup-check-result-download'];
    for (const urlpath of hideList) {
      if (this.router.url.includes(urlpath)) {
        isHide = true;
        break;
      }
    }

    if (isHide ) {
      this.isShowNavBar = false;
    } else {
      this.isShowNavBar = true;
    }
  }

  changeLanguage() {
    console.log('Change Language to: ' + this.selectedLang);
    this.translateService.use(this.selectedLang).subscribe(() => {
      this.initMenu();
    });
    this.sessionService.setItem('LANG', this.selectedLang);
  }

  changeLang() {
    this.changeLanguage();
  }

  setHasLogin() {
    this.currentUser = this.userContextService.user$.getValue();
    if (this.currentUser != null) {
    }
  }

  hideUserInfo(element) {
    if (!this.currentUser) {
      element.hide();
    }
  }

  initMenu(): void {
    this.authApiService.getUserMenuList().subscribe({
      next: (rsp) => {
        let newMenus: any[] = [];

        if (rsp.menus) {
          let menus = rsp.menus.filter((x) => x.subMenus.length > 0);
          newMenus = this.createMenu(menus, this);
        }
        this.menuItems = newMenus;

        this.sessionService.setItem('Menus', JSON.stringify(this.menuItems));
      },
      error: (rsp) => {
        this.toastService.error('System.Message.Error');
      },
    });
  }

  private createMenu(menus: any[], _this) {
    let items = [];
    menus.forEach(function (menu) {
      let menuDesc =
        _this.selectedLang == 'en-us' ? menu.menuDescEn : menu.menuDesc;
      let item: any = {
        label: menuDesc,
        routerLink: menu.menuUrl,
      };
      if (menu.icon) {
        item.icon = menu.icon;
      }
      if (menu.subMenus) {
        item.items = _this.createMenu(menu.subMenus, _this);
      }
      items.push(item);
    });
    return items;
  }

  logout() {
    this.msalService.logout();
    this.userContextService.logout();
    this.router.navigate(['/login']);
  }

  routerChanged() {
    this.menuItems.forEach((item) => {
      if (
        item.hasOwnProperty('items') &&
        item.items.length > 0 &&
        item.items.filter((x) => {
          return this.router.url.includes(x.routerLink);
        }).length > 0
      ) {
        if (!item.hasOwnProperty('expanded')) item['expanded'] = true;
      } else if (item.hasOwnProperty('items') && item.items.length > 0) {
        item['expanded'] = false;
      }
    });
  }

  getTenantFormTypeList(): void {
    this.authApiService.getTenantFormTypeList().subscribe({
      next: (rsp) => {
        let formTyleList: string[] = [];
        let rspformTypeList = rsp.formTypeList;
        formTyleList = rspformTypeList.map((p) => p.permissionId);
        this.sessionService.setItem(
          'FormTyleList',
          JSON.stringify(formTyleList)
        );
      },
      error: (rsp) => {
        this.toastService.error('System.Message.Error');
      },
    });
  }

  ngOnDestroy(): void {
    [this.onLangChange$, this.onUserChange$].forEach(
      (subscription: Subscription) => {
        if (subscription != null || subscription != undefined)
          subscription.unsubscribe();
      }
    );

    this.unsubscribeEvent.next(null);
    this.unsubscribeEvent.complete();
  }

  @HostListener('window:message', ['$event'])
  onMessage(event: any) {
  if (event.data?.type === "parentLangChange") {
        this.selectedLang = event.data.message;
        this.changeLanguage();
      }
  }
    
}
