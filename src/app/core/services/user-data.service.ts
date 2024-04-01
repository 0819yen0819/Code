import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { UserInfo } from '../model/user-info';

import { AuthApiService } from './auth-api.service';

@Injectable({
  providedIn: 'root',
})

/**
 * user service class
 */
export class UserDataService {
  constructor(private authApiService: AuthApiService) {}

  getUserProfileByEmail(userInfo: UserInfo): Observable<any> {
    return this.authApiService.getUserProfileByAdSubscriptionIdAndEmail(
      userInfo
    );
  }
}
