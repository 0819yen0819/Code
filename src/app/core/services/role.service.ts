import { Injectable } from '@angular/core';
import { BehaviorSubject, map, Observable } from 'rxjs';
import { AuthApiService } from './auth-api.service';
import { ToastService } from './toast.service';

@Injectable({
  providedIn: 'root'
})

export class RoleService {

  public editData$: BehaviorSubject<any> = new BehaviorSubject<any>(null);

  constructor(
    private authApiService: AuthApiService,
    private toastService: ToastService,
  ) {}

  getAllTenants(): Observable<any> {
    return this.authApiService.getAllTenants();
  }

  getRoles(model: any): Observable<any> {
    return this.authApiService.getRoles(model);
  }

  queryRoleAuthGroups(model: any): Observable<any> {
    return this.authApiService.queryRoleAuthGroups(model);
  }

  queryRoleAvailableGroups(model: any): Observable<any> {
    return this.authApiService.queryRoleAvailableGroups(model);
  }

  queryRolePermissions(model: any): Observable<any> {
    return this.authApiService.queryRolePermissions(model);
  }

  checkRoleNameExists(model: any): Observable<boolean> {
    return this.authApiService.checkRoleNameExists(model)
      .pipe(map(x => x.body));
  }

  saveRole(model: any): Observable<any> {
    return this.authApiService.saveRole(model);
  }

  deleteRole(model: any): Observable<any> {
    return this.authApiService.deleteRole(model);
  }

  setEditData(data: any) {
    this.editData$.next(data);
  }

  buildPermissionData(role: RoleInfo): any {
    const permissionData = {
      availablePermissions: [],
      rolePermissions: []
    }

    let model = {
      tenant: role.tenant,
      roleId: role.roleId,
      roleName: role.roleName,
      roleType: role.roleType,
    };

    this.queryRolePermissions(model).subscribe({
      next: rsp => {
        if (rsp?.status != 200) {
          return;
        }

        rsp.body?.availablePermissions?.forEach( x => {
          let permission: RolePermission = x;
          permissionData.availablePermissions.push(permission);
        });

        rsp.body?.rolePermissions?.forEach( x => {
          let permission: RolePermission = x;
          permissionData.rolePermissions.push(permission);
        });
      },
      error: rsp => {
        console.log(rsp || 'error');
        this.toastService.error('System.Message.Error');
      }
    });

    return permissionData;
  }

}

export class RoleInfo {

  tenant: string;
  roleId: string;
  roleDesc: string;
  roleName: string;
  roleType: string;
  status: string;
  lastUpdatedBy: string;
  lastUpdatedDate: Date;

  availableGroups: RoleAuthGroup[] = [];
  roleAuthGroups: RoleAuthGroup[] = [];

  availablePermissions: RolePermission[] = [];
  rolePermissions: string[] = [];
}

export class RoleAuthGroup {

  authGroupId: string;
  authGroupType: string;
  authGroupName: string;
  authGroupDesc: string;
  isDefault: string;

}

export class RolePermission {

  permissionId: string;
  permissionName: string;
  permissionDesc: string;
  permissionUrl: string;

}
