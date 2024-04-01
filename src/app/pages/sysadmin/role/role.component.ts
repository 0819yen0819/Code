import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { SelectItem } from 'primeng/api';
import { Table } from 'primeng/table';
import { forkJoin, Observable, Subscription } from 'rxjs';

import { LoaderService } from 'src/app/core/services/loader.service';
import {
  RoleAuthGroup,
  RoleInfo,
  RolePermission,
  RoleService,
} from 'src/app/core/services/role.service';
import { ToastService } from 'src/app/core/services/toast.service';
import { UserContextService } from 'src/app/core/services/user-context.service';

@Component({
  selector: 'app-role',
  templateUrl: './role.component.html',
  styleUrls: ['./role.component.scss'],
})
export class RoleComponent implements OnInit, OnDestroy {
  @ViewChild('dt') dt: Table;

  private onLangChange$: Subscription;

  permissions: string[] = [];

  defaultTenant: string;

  tenantOptions: SelectItem[];
  selectedTenants: string;
  roleTypeOptions: SelectItem[];
  selectedRoleTypes: SelectItem[];
  roleStatusOptions: SelectItem[];
  roleName: string;

  cols: any[];
  colFuncs: any[];
  selectedCols: any[];
  data: any[];
  displayFilterDetail = false;

  displayDelDialog = false;

  editForm: RoleInfo;

  delRoleId: string;

  constructor(
    private router: Router,
    private translateService: TranslateService,
    private roleService: RoleService,
    private loaderService: LoaderService,
    private toastService: ToastService,
    private userContextService: UserContextService
  ) {
    if (this.userContextService.user$.getValue) {
      this.permissions = this.userContextService.getMenuUrlPermission(
        this.router.url
      );
      console.log('permissions: ', this.permissions);
    }
    this.onLangChange$ = this.translateService.onLangChange.subscribe(() => {
      this.initColumns();
      this.initTenantOptions();
      this.initRoleTypeOptions();
      this.changeFilterDetail();
    });
  }

  ngOnInit(): void {
    this.loaderService.show();

    this.defaultTenant = this.userContextService.user$.getValue()?.tenant;

    this.roleTypeOptions = [
      // {label: '請選擇', value: null},
      // {label: '預設角色', value: "DEFAULT"},
      // {label: '一般角色', value: "GENERAL"},
      // {label: '系統管理員', value: "ADMIN"},
    ];

    this.initTenantOptions();
    this.initRoleTypeOptions();

    this.initColumns();

    this.changeFilterDetail();
    this.data = [];

    //# TK-35854
    // this.initData();

    this.loaderService.hide();
  }

  initColumns() {
    this.cols = [];
    this.cols = this.translateService.instant('Role.Columns');
    this.colFuncs = this.translateService.instant('Role.ColumnFunctions');
    this.colFuncs = this.colFuncs.filter((x) =>
      this.permissions.includes(x.field)
    );
  }

  initRoleTypeOptions() {
    this.roleTypeOptions = [];
    this.roleTypeOptions.push.apply(
      this.roleTypeOptions,
      this.translateService.instant('Role.Options.DefaultNull')
    );
    this.roleTypeOptions.push.apply(
      this.roleTypeOptions,
      this.translateService.instant('Role.Options.RoleType')
    );

    this.roleStatusOptions = this.translateService.instant(
      'Role.Options.RoleStatus'
    );
  }

  initTenantOptions() {
    this.loaderService.show();

    this.tenantOptions = [];
    this.tenantOptions.push.apply(
      this.tenantOptions,
      this.translateService.instant('Role.Options.DefaultNull')
    );

    this.roleService
      .getAllTenants()
      .subscribe({
        next: (rsp) => {
          if (rsp?.status != 200) {
            return;
          }

          rsp.body?.tenants?.forEach((x) => {
            let item: SelectItem = {
              label: x.tenant,
              value: x.tenant,
            };
            this.tenantOptions.push(item);
          });
          this.selectedTenants = this.defaultTenant;
        },
        error: (rsp) => {
          console.log(rsp || 'error');
          this.toastService.error('System.Message.Error');
        },
      })
      .add(() => {
        this.loaderService.hide();
      });
  }

  showFilter() {
    this.displayFilterDetail = true;
  }

  changeFilterDetail() {
    this.selectedCols = this.cols.filter((x) => {
      return x.isDefault;
    });
    this.colFuncs?.forEach((x) => {
      this.selectedCols.push(x);
    });
  } // end changeFilterDetail

  resetCondition() {
    this.data = new Array();
    this.selectedTenants = '';
    this.selectedRoleTypes = [];
    this.roleName = '';
  }

  initData() {
    this.loaderService.show();

    this.data = [];

    let model = {
      tenant: (this.selectedTenants || '') == '' ? null : this.selectedTenants,
      roleType:
        (this.selectedRoleTypes || '') == '' ? null : this.selectedRoleTypes,
      roleName: this.roleName,
    };

    this.roleService
      .getRoles(model)
      .subscribe({
        next: (rsp) => {
          if (rsp?.status != 200) {
            return;
          }

          rsp.body?.roles?.forEach((x) => {
            let role: RoleInfo = x;
            let item = Object.assign({}, role);
            this.data.push(item);
          });
          this.dt.reset();
        },
        error: (rsp) => {
          console.log(rsp || 'error');
          this.toastService.error('System.Message.Error');
        },
      })
      .add(() => {
        this.loaderService.hide();
      });
  }

  clickAddRole() {
    this.resetEditData();
    let editData = {
      action: 'add',
      editForm: this.editForm,
    };
    this.roleService.setEditData(JSON.stringify(editData));

    this.router.navigate(['/sysadmin/role/create-role-step1']);
  }

  resetEditData() {
    this.editForm = new RoleInfo();
    this.editForm.tenant = this.defaultTenant;
    this.editForm.roleName = '';
    this.editForm.roleDesc = '';
    this.editForm.roleType = 'GENERAL';
    this.editForm.status = 'ACTIVATE';
  }

  changeRoleType() {
    this.loaderService.show();

    this.editForm.availableGroups = [];
    this.editForm.roleAuthGroups = [];

    let model = {
      // tenant: (this.editSelectedTenants || '') == '' ?  null : this.editSelectedTenants,
      tenant: this.editForm.tenant,
      roleId: this.editForm.roleId,
      roleName: this.editForm.roleName,
      roleType: this.editForm.roleType,
    };

    this.roleService
      .queryRoleAuthGroups(model)
      .subscribe({
        next: (rsp) => {
          if (rsp?.status != 200) {
            return;
          }

          let availableGroups = [];
          rsp.body?.availableGroups?.forEach((x) => {
            let group: RoleAuthGroup = x;
            availableGroups.push(group);
          });

          let selectedGroups = [];
          rsp.body?.authGroupMembers?.forEach((x) => {
            let group: RoleAuthGroup = x;
            selectedGroups.push(group);
          });
          this.editForm.roleAuthGroups = selectedGroups.slice(0);
          this.editForm.availableGroups = availableGroups.slice(0);
        },
        error: (rsp) => {
          console.log(rsp || 'error');
          this.toastService.error('System.Message.Error');
        },
      })
      .add(() => {
        this.loaderService.hide();
      });
  }

  clickEditRole(role) {
    this.loaderService.show();
    if (!role.tenant || role.tenant === '') {
      role.tenant = this.defaultTenant;
    }
    this.editForm = role;
    this.buildRoleData(role, 'edit');
  }

  clickViewRole(role) {
    this.loaderService.show();

    this.editForm = Object.assign(new RoleInfo(), role);
    this.buildRoleData(role, 'view');
  }

  async buildRoleData(role: RoleInfo, action: string) {
    console.info('buildRoleData...');

    this.queryRoleData(role)
      .subscribe({
        next: (rsp) => {
          let roleAuthGroupsRsp = rsp[0];
          let rolePermissionsRsp = rsp[1];

          let availableGroups = [];
          roleAuthGroupsRsp.body?.availableGroups?.forEach((x) => {
            let group: RoleAuthGroup = x;
            availableGroups.push(group);
          });

          let roleAuthGroups = [];
          roleAuthGroupsRsp.body?.roleAuthGroups?.forEach((x) => {
            let group: RoleAuthGroup = x;
            roleAuthGroups.push(group);
          });
          this.editForm.roleAuthGroups = roleAuthGroups.slice(0);
          this.editForm.availableGroups = availableGroups.slice(0);

          let availablePermissions = [];
          rolePermissionsRsp.body?.availablePermissions?.forEach((x) => {
            let permission: RolePermission = x;
            availablePermissions.push(permission);
          });

          let rolePermissions = [];
          rolePermissionsRsp.body?.rolePermissions?.forEach((x) => {
            let permission: string = x.permissionId;
            rolePermissions.push(permission);
          });
          this.editForm.availablePermissions = availablePermissions.slice(0);
          this.editForm.rolePermissions = rolePermissions.slice(0);
        },
        error: (rsp) => {
          console.log(rsp || 'error');
          this.toastService.error('System.Message.Error');
        },
        complete: () => {
          let editData = {
            action: action,
            editForm: this.editForm,
          };

          this.roleService.setEditData(JSON.stringify(editData));

          if (action === 'add' || action === 'edit') {
            this.router.navigate(['/sysadmin/role/create-role-step1']);
          } else if (action === 'view') {
            this.router.navigate(['/sysadmin/role/create-role-step3']);
          }
        },
      })
      .add(() => {
        this.loaderService.hide();
      });
  }

  queryRoleData(role: RoleInfo): Observable<any> {
    let model = {
      tenant: role.tenant,
      roleId: role.roleId,
      roleName: role.roleName,
      roleType: role.roleType,
    };

    let queryRoleAuthGroups = this.roleService.queryRoleAuthGroups(model);
    let queryRolePermissions = this.roleService.queryRolePermissions(model);

    return forkJoin([queryRoleAuthGroups, queryRolePermissions]);
  }

  clickDeleteRole(role) {
    this.delRoleId = role.roleId;
    this.displayDelDialog = true;
  }

  deleteRole() {
    if (this.delRoleId) {
      this.loaderService.show();

      this.roleService
        .deleteRole({ roleId: this.delRoleId })
        .subscribe({
          next: (rsp) => {
            if (rsp?.status != 200) {
              return;
            }

            this.toastService.success('Role.Message.DelSuccess');
            this.initData();
          },
          error: (rsp) => {
            console.log(rsp);
            this.toastService.error('System.Message.Error');
          },
        })
        .add(() => {
          this.loaderService.hide();
        });
    }
    this.displayDelDialog = false;
  }

  getRoleTypeDesc(val) {
    let desc = this.roleTypeOptions
      .filter((x) => x.value === val)
      .map((v) => v.label);
    return desc?.length > 0 ? desc[0] : '';
  }

  getRoleStatusDesc(val) {
    let desc = this.roleStatusOptions
      .filter((x) => x.value === val)
      .map((v) => v.label);
    return desc?.length > 0 ? desc[0] : '';
  }

  ngOnDestroy(): void {
    [this.onLangChange$].forEach((subscription: Subscription) => {
      if (subscription != null || subscription != undefined)
        subscription.unsubscribe();
    });
  }
}
