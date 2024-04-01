import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { MenuItem } from 'primeng/api';
import { Subscription } from 'rxjs';

import { TranslateService } from '@ngx-translate/core';
import { LoaderService } from 'src/app/core/services/loader.service';
import {
  RoleInfo,
  RolePermission,
  RoleService,
} from 'src/app/core/services/role.service';
import { ToastService } from 'src/app/core/services/toast.service';

@Component({
  selector: 'app-create-role-step2',
  templateUrl: './create-role-step2.component.html',
  styleUrls: ['./create-role-step2.component.scss'],
})
export class CreateRoleStep2Component implements OnInit, OnDestroy {
  private editDataChange$: Subscription;
  private onLangChange$: Subscription;
  private editData: any;

  permissions: any[] = [];
  rolePermissions: [];
  rolePermissionsHashmap: any;
  subscribedDesc: any;

  stepItems: MenuItem[];
  activeIndex: number = 1;

  isExpandAll: boolean = true;

  action: string;
  editForm: RoleInfo;

  title: string;

  constructor(
    private router: Router,
    private roleService: RoleService,
    private translateService: TranslateService,
    private loaderService: LoaderService,
    private toastService: ToastService
  ) {
    this.onLangChange$ = this.translateService.onLangChange.subscribe(() => {
      this.initStepItems();
      this.initSubscribedDesc();
      console.log('currentLang: ', this.translateService.currentLang);
    });
  }

  ngOnInit(): void {
    this.initStepItems();
    this.initSubscribedDesc();

    this.editDataChange$ = this.roleService.editData$.subscribe((val) => {
      this.editData = val == null ? {} : JSON.parse(val);
    });

    this.action = !this.editData?.action ? 'add' : this.editData?.action;
    // this.editForm = this.editData?.editForm ? this.editData.editForm : new RoleInfo();
    this.editForm = this.editData?.editForm
      ? this.editData.editForm
      : this.router.navigate(['/sysadmin/role/main']);

    this.initData();
  }

  initStepItems() {
    // this.stepItems = [
    //   { label: '角色設定&選擇群組' },
    //   { label: '功能權限設定' },
    //   { label: '設定確認' },
    // ];
    this.stepItems = this.translateService.instant('Role.StepItems');
  }

  initData() {
    this.buildPermission();
  }

  buildPermission() {
    if (this.editForm.availablePermissions.length == 0) {
      this.editForm.availablePermissions = [];
      this.editForm.rolePermissions = [];
    }

    let model = {
      // tenant: (this.editSelectedTenants || '') == '' ?  null : this.editSelectedTenants,
      tenant: this.editForm.tenant,
      roleId: this.editForm.roleId,
      roleName: this.editForm.roleName,
      roleType: this.editForm.roleType,
    };

    this.roleService
      .queryRolePermissions(model)
      .subscribe({
        next: (rsp) => {
          if (rsp?.status != 200) {
            return;
          }
          let availablePermissions = [];
          rsp.body?.availablePermissions?.forEach((x) => {
            let permission: RolePermission = x;
            availablePermissions.push(permission);
          });

          let rolePermissions = [];
          rsp.body?.rolePermissions?.forEach((x) => {
            let permission: string = x.permissionId;
            rolePermissions.push(permission);
          });

          if (this.editForm.availablePermissions.length == 0) {
            this.editForm.availablePermissions = availablePermissions.slice(0);
            this.editForm.rolePermissions = rolePermissions.slice(0);
            this.permissions = availablePermissions.slice(0);
          }

          //[{第一層ID, 第二層全部子ID}]
          this.rolePermissionsHashmap = new Map<string, string[]>();
          availablePermissions.forEach((item) => {
            let subPermissions1 = item.subPermissions;
            subPermissions1.forEach((item1) => {
              let permissionId1 = item1.permissionId;
              let subPermissions2 = item1.subPermissions;
              let permissionsArrays = [];
              subPermissions2.forEach((item2) => {
                let permissionId2 = item2.permissionId;
                permissionsArrays.push(permissionId2);
              });
              this.rolePermissionsHashmap.set(permissionId1, permissionsArrays);
            });
          });
        },
        error: (rsp) => {
          console.debug(rsp || 'error');
          this.toastService.error('System.Message.Error');
        },
      })
      .add(() => {
        this.loaderService.hide();
      });
  }

  previousStep() {
    let modifiedData = {
      action: this.action,
      editForm: this.editForm,
    };
    this.roleService.setEditData(JSON.stringify(modifiedData));

    this.router.navigate(['/sysadmin/role/create-role-step1']);
  }

  cancelEdit() {
    this.router.navigate(['/sysadmin/role/main']);
  }

  nextStep() {
    if (this.editForm.rolePermissions.length < 1) {
      this.toastService.info('Role.Message.PermissionRequired');
      return;
    }

    let modifiedData = {
      action: this.action,
      editForm: this.editForm,
    };
    this.roleService.setEditData(JSON.stringify(modifiedData));

    this.router.navigate(['/sysadmin/role/create-role-step3']);
  }

  onChangeCheckBox(permissionIdArray, event: any) {
    // console.log(permissionIdArray.length);
    let checkStatus = false;
    //第二層
    if (permissionIdArray.length >= 2) {
      // console.log('檢查第二層');
      const permissionId1 = permissionIdArray[0];
      const permissionId2 = permissionIdArray[1];
      // console.log('permissionId2: ', permissionId2);
      if (
        this.editForm.rolePermissions.findIndex((e) => e === permissionId2) !==
        -1
      ) {
        checkStatus = true;
      }
      if (this.rolePermissionsHashmap.has(permissionId1)) {
        const permissions = this.rolePermissionsHashmap.get(permissionId1);
        // console.log('permissions: ', permissions);
        //勾了第二層，第一層也要打勾
        if (
          checkStatus &&
          !this.editForm.rolePermissions.includes(permissionId1)
        ) {
          this.editForm.rolePermissions.push(permissionId1);
        }
        //判斷第二層若全不勾，第一層不需勾選
        if (!checkStatus) {
          var allCheckStatus = false;
          permissions.forEach((item) => {
            if (this.editForm.rolePermissions.includes(item)) {
              allCheckStatus = true;
              return;
            }
          });
          //第二層全不勾，第一層有勾選，需要把第一層取消勾選
          if (
            !allCheckStatus &&
            this.editForm.rolePermissions.includes(permissionId1)
          ) {
            const index = this.editForm.rolePermissions.indexOf(
              permissionId1,
              0
            );
            if (index > -1) {
              this.editForm.rolePermissions.splice(index, 1);
            }
          }
        }
      }
    }
    //第一層
    else if (permissionIdArray.length >= 1) {
      // console.log('檢查第一層');
      const permissionId1 = permissionIdArray[0];
      if (
        this.editForm.rolePermissions.findIndex((e) => e === permissionId1) !==
        -1
      ) {
        checkStatus = true;
      }
      if (this.rolePermissionsHashmap.has(permissionId1)) {
        const permissions = this.rolePermissionsHashmap.get(permissionId1);
        // console.log('permissions: ', permissions);
        permissions.forEach((item) => {
          //全勾
          if (checkStatus && !this.editForm.rolePermissions.includes(item)) {
            this.editForm.rolePermissions.push(item);
          }
          //全不勾
          else if (
            !checkStatus &&
            this.editForm.rolePermissions.includes(item)
          ) {
            const index = this.editForm.rolePermissions.indexOf(item, 0);
            if (index > -1) {
              this.editForm.rolePermissions.splice(index, 1);
            }
          }
        });
      }
    } else {
      return;
    }
    // console.log('checkStatus: ', checkStatus);
  }

  getSubscribedDesc(val) {
    let desc = this.subscribedDesc
      .filter((x) => x.value === val)
      .map((v) => v.label);
    return desc?.length > 0 ? desc[0] : '';
  }

  initSubscribedDesc() {
    this.subscribedDesc = {};
    this.subscribedDesc = this.translateService.instant('Role.SubscribedDesc');
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
