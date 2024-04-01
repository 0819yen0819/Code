import { AfterViewInit, Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MsalService } from '@azure/msal-angular';
import { TranslateService } from '@ngx-translate/core';
import { lastValueFrom } from 'rxjs';
import { ResponseCodeEnum } from 'src/app/core/enums/ResponseCodeEnum';
import { DialogSettingParams } from 'src/app/core/model/selector-dialog-params';
import { UserInfo } from 'src/app/core/model/user-info';
import { AuthApiService } from 'src/app/core/services/auth-api.service';
import { ToastService } from 'src/app/core/services/toast.service';
import { UserContextService } from 'src/app/core/services/user-context.service';
import { UserDataService } from 'src/app/core/services/user-data.service';
import { RedirectService } from './redirect.service';

@Component({
  selector: 'app-redirect',
  templateUrl: './redirect.component.html',
  styleUrls: ['./redirect.component.scss'],
})
export class RedirectComponent implements OnInit, AfterViewInit {
  queryParams: any;
  version: string;
  loaderShow!: boolean;

  //>notice check dialog params
  noticeCheckDialogParams!: DialogSettingParams;

  //> error message list
  noticeContentList!: string[];

  constructor(
    private router: Router,
    private activatedRoute: ActivatedRoute,
    private userService: UserDataService,
    private userContextService: UserContextService,
    private authApiService: AuthApiService,
    private msalService: MsalService,
    private toastService: ToastService,
    private translateService: TranslateService,
    private redirectService : RedirectService
  ) {
    if (!this.translateService.currentLang) {
      if (localStorage.getItem('LANG')) {
        this.translateService.setDefaultLang(
          localStorage.getItem('LANG').includes('zh-tw') ? 'zh-tw' : 'en-us'
        );
      } else {
        this.translateService.setDefaultLang('zh-tw');
      }
    }
    this.loaderShow = true;
  }

  ngOnInit(): void {
    this.activatedRoute.queryParams.subscribe((res) => {
      this.queryParams = res;
    });

    this.msalService.handleRedirectObservable().subscribe((x) => {
      console.log('handleRedirectObservable');
    });
  }

  ngAfterViewInit(): void {
    if(this.redirectService.checkUrlHavingUserCode()){
      this.handleSpecificLogin();
    }else{
      this.handleNormalLogin();
    }
  }

  async handleSpecificLogin(){
    let getUserProfileByUserCodeRsp:any = await this.redirectService.getUserProfileByUserCode(); // 撈第一次
    if (!getUserProfileByUserCodeRsp){ // 如果撈第一次 User Profile 沒有資料 要建立 
      const hrEmpDeptRsp = await lastValueFrom(this.authApiService.getEmpData(this.redirectService.getReplaceUserCode())); // 撈出基本資料
      const addUserModel = { // 組建立用參數
        "userCode":  this.redirectService.getReplaceUserCode(),   
        "userEmail": hrEmpDeptRsp.email,
        "userName": hrEmpDeptRsp.fullName,
        "userNameE": hrEmpDeptRsp.nickName,
        "userStatus": "ACTIVATE",
        "createdBy": "SYSTEM",
        "createdDate": new Date(),
        "lastUpdatedBy": "SYSTEM",
        "lastUpdatedDate": new Date(),
        "adSubscriptionId":"de047c79-d4d9-4af3-91de-bc44b0581490"
      }
      await lastValueFrom(this.authApiService.addUserProfileByEmail(addUserModel)) // 建立
      getUserProfileByUserCodeRsp = await this.redirectService.getUserProfileByUserCode(); // 撈取第二次
    }

    const email = getUserProfileByUserCodeRsp.userEmail;
    const userInfo = this.redirectService.getAddUserParams(email,"de047c79-d4d9-4af3-91de-bc44b0581490")
    this.getUserProfileAndPermissions(userInfo);
  }

  handleNormalLogin(){
    let activeAccount = this.msalService.instance.getActiveAccount();

    if (
      !activeAccount &&
      this.msalService.instance.getAllAccounts().length > 0
    ) {
      let accounts = this.msalService.instance.getAllAccounts();
      this.msalService.instance.setActiveAccount(accounts[0]);
      activeAccount = this.msalService.instance.getActiveAccount();
    }

    if (activeAccount) {
      let userInfo: UserInfo = {
        tenant: null,
        tenantId: null,
        adSubscriptionId: activeAccount.tenantId,
        userEmail: activeAccount.username,
        userId: null,
        userCode: null,
        userToken: null,
        userName: null,
        userNameE: null,
        userStatus: null,
      };

      this.getUserProfileAndPermissions(userInfo);
    } else {
      console.error('Invalid user...to login');
      this.router.navigate(['/login']);
    }
  }

  private async getUserProfileAndPermissions(userInfo: UserInfo) {
    let rsp = await lastValueFrom(
      this.userService.getUserProfileByEmail(userInfo)
    ).catch((e) => {
      console.error(e, 'error');

      //# 當 code 500 & message 是 UserNotFound
      //# 進行一次新增 USER 行為
      if (
        e?.status === 500 &&
        e.error?.code === ResponseCodeEnum.USER_NOT_FOUND
      ) {
        this.AddNewUserAndRetryLogin(userInfo);
      }

      //# 當 code 403 & message 是 NoPermission
      //# 根據語系彈窗通知

      if (
        e?.status === 403 &&
        e.error?.code === ResponseCodeEnum.NO_PERMISSION
      ) {
        this.openNoticeDialog(
          localStorage.getItem('LANG') === '"zh-tw"'
            ? e.error?.message
            : e.error?.messageEn
        );
      }
    });

    //# 登入成功後行為
    if (rsp?.status == 200) {
      let user = rsp.body.user;
      userInfo = Object.assign(userInfo, user);

      this.GetUserMenuUrlPermissionList(userInfo);
    }
  }

  private async AddNewUserAndRetryLogin(userInfo): Promise<void> {
    const rspNewUser = await lastValueFrom(
      this.authApiService.addUserProfileByEmail(userInfo)
    ).catch((e) => {
      //# 當 code 403 & message 是 NoPermission
      //# 根據語系彈窗通知

      if (
          e?.status === 403 &&
          e.error?.code === ResponseCodeEnum.NO_PERMISSION
      ) {
        this.openNoticeDialog(
          localStorage.getItem('LANG') === '"zh-tw"'
            ? e.error?.message
            : e.error?.messageEn
        );
      }else if (e?.status === 500 ){
        this.openNoticeDialog(this.translateService.instant('LicenseMgmt.Common.Hint.ServerErrorPleaseContactAdmin'));
      }
    });

    if (rspNewUser.status === 200) {
      const rsp = await lastValueFrom(
        this.userService.getUserProfileByEmail(userInfo)
      ).catch((e) => {
        console.error(e, 'error');

        //# 當 code 500 & message 是 UserNotFound
        //# 跳轉至 Login
        if (
          e?.status == 500 &&
          e.error?.code === ResponseCodeEnum.USER_NOT_FOUND
        ) {
          this.toastService.error('System.Message.Error');
          this.router.navigate(['/login']);
        }

        //# 當 code 403 & message 是 NoPermission
        //# 根據語系彈窗通知

        if (
          e?.status === 403 &&
          e.error?.code === ResponseCodeEnum.NO_PERMISSION
        ) {
          this.openNoticeDialog(
            localStorage.getItem('LANG') === '"zh-tw"'
              ? e.error?.message
              : e.error?.messageEn
          );
        }
      });

      //# 登入成功後行為
      if (rsp?.status == 200) {
        let user = rsp.body.user;
        userInfo = Object.assign(userInfo, user);
        this.GetUserMenuUrlPermissionList(userInfo);
      }
    }
  }

  private async GetUserMenuUrlPermissionList(userInfo): Promise<void> {
    //# 抓取 user permission
    let rsp2 = await lastValueFrom(
      this.authApiService.getUserMenuUrlPermissionList(userInfo)
    );
    let menuUrlPermissions = rsp2.permissions;
    userInfo.menuUrlPermissions = menuUrlPermissions;

    if (userInfo.userCode) {
      this.userContextService.setUser(userInfo); 
      if (this.queryParams.url) {
        const replaceUserCodeParams = this.redirectService.checkUrlHavingUserCode() ? `&replaceUserCode=${this.redirectService.getReplaceUserCode()}` : '';
        if (this.queryParams.backUrl) {
          this.router.navigateByUrl(this.queryParams.url + '&backUrl=' + this.queryParams.backUrl + replaceUserCodeParams);
        } else {
          this.router.navigateByUrl(this.queryParams.url + replaceUserCodeParams);
        }
      } else {
        this.router.navigate(['/home']);
      }
    } else {
      this.router.navigate(['/login']);
    }
  }

  private openNoticeDialog(message: string): void {
    this.loaderShow = false;
    this.noticeContentList = [message];
    this.noticeCheckDialogParams = {
      title: this.translateService.instant(
        'LicenseMgmt.Common.Title.Notification'
      ),
      visiable: true,
      mode: 'error',
    };
  }
}
