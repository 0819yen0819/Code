import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { UserContextService } from 'src/app/core/services/user-context.service';
import { UserDataService } from 'src/app/core/services/user-data.service';

import { lastValueFrom } from 'rxjs';
import { ResponseCodeEnum } from 'src/app/core/enums/ResponseCodeEnum';
import { UserInfo } from 'src/app/core/model/user-info';
import { AuthApiService } from 'src/app/core/services/auth-api.service';
import { LanguageService } from 'src/app/core/services/language.service';
import { ToastService } from 'src/app/core/services/toast.service';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
})
export class LoginComponent implements OnInit {
  devLoginDisplay: string;

  constructor(
    private router: Router,
    private authApiService: AuthApiService,
    private userService: UserDataService,
    private userContextService: UserContextService,
    private toastService: ToastService,
    private languageService: LanguageService
  ) {}

  ngOnInit(): void {
    this.devLoginDisplay = `${environment.devLoginDisplay}`;
  }

  devLogin() {
    console.log('devLogin');
    let userInfo: UserInfo = {
      tenant: 'null',
      tenantId: null,
      adSubscriptionId: '6F4D0A39-38CB-45EC-A4AE-7E257E59E8D4',
      userEmail: 'kennycc@kevintwleeoutlook.onmicrosoft.com',
      userId: null,
      userCode: null,
      userToken: '476E26BF-DB90-4605-BF57-B814300B9629',
      userName: null,
      userNameE: null,
      userStatus: null,
    };

    this.getUserProfileAndPermissions(userInfo);
  }

  private async getUserProfileAndPermissions(userInfo: UserInfo) {
    let userNotFound = false;

    let rsp = await lastValueFrom(
      this.userService.getUserProfileByEmail(userInfo)
    ).catch((e) => {
      console.log(e, 'error');
      if (
        rsp?.status == 500 &&
        rsp.error?.code === ResponseCodeEnum.USER_NOT_FOUND
      ) {
        userNotFound = true;
      }
    });

    if (userNotFound) {
      let rspNewUser = await lastValueFrom(
        this.authApiService.addUserProfileByEmail(userInfo)
      );
      if (rspNewUser.status !== 200) {
        this.toastService.error('System.Message.Error');
        this.router.navigate(['/login']);
      }
    }

    if (rsp?.status == 200) {
      let user = rsp.body.user;
      userInfo = Object.assign(userInfo, user);
      console.log(userInfo);

      let rsp2 = await lastValueFrom(
        this.authApiService.getUserMenuUrlPermissionList(userInfo)
      );
      let menuUrlPermissions = rsp2.permissions;
      userInfo.menuUrlPermissions = menuUrlPermissions;

      if (userInfo.userCode) {
        this.userContextService.setUser(userInfo);
        this.router.navigate(['/home']);
      } else {
        this.router.navigate(['/login']);
      }
    }
  }
}
