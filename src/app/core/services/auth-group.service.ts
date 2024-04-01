import { Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { AuthApiService } from './auth-api.service';

@Injectable({
  providedIn: 'root'
})

export class AuthGroupService {

  constructor(
    private authApiService: AuthApiService,
  ) {}

  getAllTenants(): Observable<any> {
    return this.authApiService.getAllTenants();
  }

  getAuthGroups(model: any): Observable<any> {
    return this.authApiService.getAuthGroups(model);
  }

  queryAuthGroupMembers(model: any): Observable<any> {
    return this.authApiService.queryAuthGroupMembers(model);
  }

  queryAvailableMembers(model: any): Observable<any> {
    return this.authApiService.queryAvailableMembers(model);
  }

  checkAuthGroupNameExists(model: any): Observable<boolean> {
    return this.authApiService.checkAuthGroupNameExists(model)
      .pipe(map(x => x.body));
  }

  saveAuthGroupAndMembers(model: any): Observable<any> {
    return this.authApiService.saveAuthGroupAndMembers(model);
  }

  deleteAuthGroup(model: any): Observable<any> {
    return this.authApiService.deleteAuthGroup(model);
  }

}

export class AuthGroupInfo {

  tenant: string;
  authGroupId: string;
  authGroupDesc: string;
  authGroupName: string;
  authGroupType: string;
  isDefault: string;

  availableMembers: AuthGroupMember[] = [];
  authGroupMembers: AuthGroupMember[] = [];
}

export class AuthGroupMember {

  // seq: number;
  memberType: string;
  memberId: string;
  memberDesc: string;
  authGroupId: string;

}
