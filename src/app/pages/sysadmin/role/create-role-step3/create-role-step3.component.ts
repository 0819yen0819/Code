import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { MenuItem, SelectItem } from 'primeng/api';
import { Subscription } from 'rxjs';
import { ResponseCodeEnum } from 'src/app/core/enums/ResponseCodeEnum';

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
  selector: 'app-create-role-step3',
  templateUrl: './create-role-step3.component.html',
  styleUrls: ['./create-role-step3.component.scss'],
})
export class CreateRoleStep3Component implements OnInit, OnDestroy {
  private editDataChange$: Subscription;
  private onLangChange$: Subscription;
  private editData: any;

  selectedPermissions: string[];

  roleTypeOptions: SelectItem[];
  roleStatusOptions: SelectItem[];

  stepItems: MenuItem[];
  activeIndex: number = 2;

  isExpandAll: boolean = true;

  action: string;
  editForm: RoleInfo;

  title: string;

  constructor(
    private router: Router,
    private userContextService: UserContextService,
    private roleService: RoleService,
    private toastService: ToastService,
    private loaderService: LoaderService,
    private translateService: TranslateService
  ) {
    this.onLangChange$ = this.translateService.onLangChange.subscribe(() => {
      this.initStepItems();
    });
  }

  ngOnInit(): void {
    this.initStepItems();

    this.initRoleTypeOptions();

    this.editDataChange$ = this.roleService.editData$.subscribe((val) => {
      this.editData = val == null ? {} : JSON.parse(val);
    });

    this.action = !this.editData?.action ? 'add' : this.editData?.action;
    // this.editForm = this.editData?.editForm ? this.editData.editForm : new RoleInfo();
    this.editForm = this.editData?.editForm
      ? this.editData.editForm
      : this.router.navigate(['/sysadmin/role/main']);

    this.selectedPermissions = [];
    this.editForm.rolePermissions.forEach((x) => {
      this.selectedPermissions.push(x);
    });
  }

  initStepItems() {
    // this.stepItems = [
    //   { label: '角色設定&選擇群組' },
    //   { label: '功能權限設定' },
    //   { label: '設定確認' },
    // ];
    this.stepItems = this.translateService.instant('Role.StepItems');
  }

  initRoleTypeOptions() {
    let roleTypeOptions = [];
    roleTypeOptions.push.apply(
      roleTypeOptions,
      this.translateService.instant('Role.Options.DefaultNull')
    );
    roleTypeOptions.push.apply(
      roleTypeOptions,
      this.translateService.instant('Role.Options.RoleType')
    );
    this.roleTypeOptions = roleTypeOptions.slice(0);

    this.roleStatusOptions = this.translateService.instant(
      'Role.Options.RoleStatus'
    );
  }

  saveData() {
    this.loaderService.show();

    let roleAuthGroups: RoleAuthGroup[] = [];
    this.editForm.roleAuthGroups.forEach((x) => {
      let roleAuthGroup: RoleAuthGroup = new RoleAuthGroup();
      roleAuthGroup.authGroupId = x.authGroupId;
      roleAuthGroups.push(roleAuthGroup);
    });

    let rolePermissions: RolePermission[] = [];
    this.selectedPermissions.forEach((x) => {
      let rolePermission: RolePermission = new RolePermission();
      rolePermission.permissionId = x;
      rolePermissions.push(rolePermission);
    });

    let model = {
      tenant: this.editForm.tenant,
      roleId: this.editForm.roleId,
      roleName: this.editForm.roleName,
      roleDesc: this.editForm.roleDesc,
      roleType: this.editForm.roleType,
      userEmail: this.userContextService.user$.getValue().userEmail,
      roleAuthGroups: roleAuthGroups,
      rolePermissions: rolePermissions,
    };

    this.roleService
      .saveRole(model)
      .subscribe({
        next: (rsp) => {
          if (rsp?.status != 200) {
            return;
          }
          if (this.action === 'add') {
            this.toastService.success('Role.Message.AddSuccess');
          } else {
            this.toastService.success('Role.Message.EditSuccess');
          }
        },
        error: (rsp) => {
          console.debug(rsp || 'error');
          if (
            rsp?.status == 500 &&
            rsp.error?.code === ResponseCodeEnum.ROLENAME_ALREADY_EXISTS
          ) {
            this.toastService.error('AuthGroup.Message.RoleNameExists');
          } else {
            this.toastService.error('System.Message.Error');
          }
        },
      })
      .add(() => {
        this.loaderService.hide();
        this.router.navigate(['/sysadmin/role/main']);
      });
  }

  cancelEdit() {
    this.router.navigate(['/sysadmin/role/main']);
  }

  previousStep() {
    let modifiedData = {
      action: this.action,
      editForm: this.editForm,
    };
    this.roleService.setEditData(JSON.stringify(modifiedData));

    this.router.navigate(['/sysadmin/role/create-role-step2']);
  }

  complete() {
    if (this.action === 'add' || this.action === 'edit') {
      this.saveData();
      return;
    }
    this.router.navigate(['/sysadmin/role/main']);
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

  getAuthGroupTypeDesc(val) {
    let options = this.translateService.instant('Role.Options.AuthGroupType');
    let desc = options.filter((x) => x.value === val).map((v) => v.label);
    return desc?.length > 0 ? desc[0] : '';
  }

  getIsDefaultDesc(val) {
    let options = this.translateService.instant(
      'Role.Options.AuthGroupIsDefault'
    );
    let desc = options.filter((x) => x.value === val).map((v) => v.label);
    return desc?.length > 0 && desc[0] !== '' ? ' (' + desc[0] + ')' : '';
  }

  ngOnDestroy(): void {
    [this.editDataChange$, this.onLangChange$].forEach(
      (subscription: Subscription) => {
        if (subscription != null || subscription != undefined)
          subscription.unsubscribe();
      }
    );
  }
}
