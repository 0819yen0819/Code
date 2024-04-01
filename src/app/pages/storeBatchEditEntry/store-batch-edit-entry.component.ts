import { AfterViewInit, Component, HostListener, OnInit } from '@angular/core';
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
import { StoreBatchEditEntryService } from './store-batch-edit-entry.service';
import { RedirectService } from '../redirect/redirect.service';

@Component({
  selector: 'app-store-batch-edit-entry',
  templateUrl: './store-batch-edit-entry.component.html',
  styleUrls: ['./store-batch-edit-entry.component.scss']
})
export class StoreBatchEditEntryComponent {

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
    private storeBatchEditEntryService: StoreBatchEditEntryService,
    private redirectService: RedirectService
  ) {
    this.translateService.setDefaultLang('zh-tw');
  }

  ngOnInit(): void {
    this.storeBatchEditEntryService.postMessageToParent('PortalInit');
    this.storeBatchEditEntryService.openByBatchEditFromStore = true;

    this.activatedRoute.queryParams.subscribe((res) => {
      this.queryParams = res;
    });


    // let userInfo: UserInfo = {
    //   tenant: null, 
    //   tenantId: null,
    //   adSubscriptionId: "de047c79-d4d9-4af3-91de-bc44b0581490", // event.data.tenantId,//activeAccount.tenantId,
    //   userEmail:"ray.yeh@wpgholdings.com", // event.data.username,//activeAccount.username,
    //   userId: null,
    //   userCode: null,
    //   userToken: null,
    //   userName: null,
    //   userNameE: null,
    //   userStatus: null,
    // };

    // this.getUserProfileAndPermissions(userInfo); 

  }

  iframeParent: Window | undefined = window.opener as Window;

  @HostListener('window:message', ['$event'])
  async onMessage(event: any) {
    if (event.data?.type === "iframeChannel") {
      if (this.redirectService.checkUrlHavingUserCode()) {
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
      } else {
        const activeAccount = JSON.parse(event.data.message)

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
      }
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
      } else if (e?.status === 500) {
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
          this.router.navigateByUrl(
            this.queryParams.url + '&backUrl=' + this.queryParams.backUrl + '&t=' + new Date().getTime() + replaceUserCodeParams
          );
        } else {
          this.router.navigateByUrl(this.queryParams.url + '&t=' + new Date().getTime() + replaceUserCodeParams);
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
