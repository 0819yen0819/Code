import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { lastValueFrom } from 'rxjs';
import { AuthApiService } from 'src/app/core/services/auth-api.service';
import { UserDataService } from 'src/app/core/services/user-data.service';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class RedirectService {

  constructor(
    private router: Router,
    private authApiService: AuthApiService,
    private userService: UserDataService
  ) { }

  checkUrlHavingUserCode() {
    if (environment.envName !== 'PROD') { // 只在非PROD情況下允許替換使用者
      const currentUrl = this.router.url; // 獲取當前路由的 URL 
      const urlSearchParams = new URLSearchParams(currentUrl);  // 解析 URL 中的參數 
      return urlSearchParams.has('replaceUserCode');  // 檢查是否存在 replaceUserCode 參數
    } else {
      return false;
    }
  }

  getTenantId() {
    return new Promise<string>((resolve, reject) => {
      lastValueFrom(this.authApiService.getTenantByTenant()).then(getTenantByTenantRsp => {
        const tenantId = getTenantByTenantRsp.tenant.tenantId;
        resolve(tenantId);
      }).catch(err => {
        reject(JSON.stringify(err));
      })
    });
  }

  getReplaceUserCode() {
    const currentUrl = this.router.url;
    const urlSearchParams = new URLSearchParams(currentUrl);
    const replaceUserCodeValue = urlSearchParams.get('replaceUserCode');
    return replaceUserCodeValue
  }

  getUserProfileByUserCode() {
    return new Promise(async (resolve, reject) => {
      const getTenantByTenantRsp = await lastValueFrom(this.authApiService.getTenantByTenant())
      const tenantId = getTenantByTenantRsp.tenant.tenantId;

      const currentUrl = this.router.url;
      const urlSearchParams = new URLSearchParams(currentUrl);
      const replaceUserCodeValue = urlSearchParams.get('replaceUserCode');

      let userInfo;
      try {
        const getUserProfileByUserCodeRsp = await lastValueFrom(this.authApiService.getUserProfileByUserCode(tenantId, replaceUserCodeValue))
        userInfo = getUserProfileByUserCodeRsp.user;
      } catch (error) {
        if (error.code === 'UserNotFound') {
          console.log(error);
          reject(null);
        }
      }
      resolve(userInfo);
    })
  }

  getAddUserParams(email: string, tenantId: string) {
    return {
      tenant: null,
      tenantId: null,
      adSubscriptionId: tenantId,
      userEmail: email,
      userId: null,
      userCode: null,
      userToken: null,
      userName: null,
      userNameE: null,
      userStatus: null,
    };
  }


}
