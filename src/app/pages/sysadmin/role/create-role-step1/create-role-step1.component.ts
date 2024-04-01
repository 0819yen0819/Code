import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { MenuItem, SelectItem } from 'primeng/api';
import { LoaderService } from './../../../../core/services/loader.service';

import { TranslateService } from '@ngx-translate/core';
import { lastValueFrom, Subscription } from 'rxjs';

import { PickList } from 'primeng/picklist';
import {
  RoleAuthGroup,
  RoleInfo,
  RoleService,
} from 'src/app/core/services/role.service';
import { ToastService } from 'src/app/core/services/toast.service';
import { UserContextService } from 'src/app/core/services/user-context.service';

@Component({
  selector: 'app-create-role-step1',
  templateUrl: './create-role-step1.component.html',
  styleUrls: ['./create-role-step1.component.scss'],
})
export class CreateRoleStep1Component implements OnInit, OnDestroy {
  @ViewChild('pickList') pickList: PickList;

  private onLangChange$: Subscription;

  private editDataChange$: Subscription;
  private editData: any;

  stepItems: MenuItem[];
  activeIndex: number = 0;

  defaultTenant: string;

  tenantOptions: SelectItem[];
  roleTypeOptions: SelectItem[];
  roleStatusOptions: SelectItem[];
  status: string;

  action: string;
  editForm: RoleInfo;

  title: string;

  submitted: boolean = false;
  tenantRequired: boolean = false;
  roleNameRequired: boolean = false;
  roleNameExists: boolean = false;
  roleTypeRequired: boolean = false;
  roleStatusRequired: boolean = false;
  roleNameOverLength: boolean = false;
  roleDescOverLength: boolean = false;

  sourceFilterValue: string;

  constructor(
    private router: Router,
    private roleService: RoleService,
    private translateService: TranslateService,
    private toastService: ToastService,
    private loaderService: LoaderService,
    private userContextService: UserContextService
  ) {
    this.onLangChange$ = this.translateService.onLangChange.subscribe(() => {
      this.initStepItems();
      this.initTenantOptions();
      this.initRoleTypeOptions();
    });
  }

  ngOnInit(): void {
    this.defaultTenant = this.userContextService.user$.getValue()?.tenant;

    this.title =
      this.action === 'edit'
        ? this.translateService.instant('Role.Title.EditRole')
        : this.translateService.instant('Role.Title.AddRole');

    this.initStepItems();

    this.roleTypeOptions = [];

    this.initTenantOptions();
    this.initRoleTypeOptions();

    this.editDataChange$ = this.roleService.editData$.subscribe((val) => {
      this.editData = val == null ? {} : JSON.parse(val);
    });

    this.action = !this.editData?.action ? 'add' : this.editData?.action;
    this.editForm = this.editData?.editForm

    if(this.editForm.availableGroups.length == 0 &&  this.editForm.roleAuthGroups.length == 0){
      this.queryRoleAuthGroups();
    }
    
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

    let tenantOptions = [];
    tenantOptions.push.apply(
      tenantOptions,
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
            tenantOptions.push(item);
          });
          this.tenantOptions = tenantOptions.slice(0);
          this.editForm.tenant = this.editForm.tenant
            ? this.editForm.tenant
            : this.defaultTenant;
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

  resetValidate() {
    this.submitted = false;

    this.tenantRequired = false;
    this.roleNameRequired = false;
    this.roleNameExists = false;
    this.roleTypeRequired = false;
    this.roleStatusRequired = false;
    this.roleNameOverLength = false;
    this.roleDescOverLength = false;
  }

  validateRoleName(): Promise<boolean> {
    return new Promise((resolve, reject) => {
      console.debug('validateRoleName');
      this.resetValidate();

      this.submitted = true;
      if (!this.editForm.tenant) {
        this.tenantRequired = true;
      }
      if (!this.editForm.roleName) {
        this.roleNameRequired = true;
      }
      if (this.editForm.roleName.length > 100) {
        this.roleNameOverLength = true;
      }
      if (this.editForm.roleDesc.length > 300) {
        this.roleDescOverLength = true;
      }
      if (
        this.tenantRequired ||
        this.roleNameRequired ||
        this.roleNameOverLength ||
        this.roleDescOverLength
      ) {
        return resolve(false);
      }

      this.roleNameExists = false;

      let model = {
        tenant: this.editForm.tenant,
        roleId: this.editForm.roleId,
        roleName: this.editForm.roleName,
      };

      lastValueFrom(this.roleService.checkRoleNameExists(model)).then((x) => {
        this.roleNameExists = x;
        if (this.roleNameExists) {
          return resolve(false);
        }

        this.submitted = false;
        this.loaderService.hide();

        return resolve(true);
      });
    });
  }

  validateEditForm(): Promise<boolean> {
    return new Promise((resolve, reject) => {
      console.debug('validateEditForm');

      this.validateRoleName().then((x) => {
        if (!x) {
          return resolve(false);
        }

        this.submitted = true;
        if (!this.editForm.roleType || this.editForm.roleType == '') {
          this.roleTypeRequired = true;
        }

        if (!this.editForm.status || this.editForm.status == '') {
          this.roleStatusRequired = true;
        }

        if (
          this.tenantRequired ||
          this.roleNameRequired ||
          this.roleNameExists ||
          this.roleTypeRequired ||
          this.roleStatusRequired
        ) {
          return resolve(false);
        }

        this.submitted = false;
        return resolve(true);
      });
    });
  }

  async changeRoleType() {
    if (!this.editForm.roleType || this.editForm.roleType == '') {
      return;
    }
    this.loaderService.show();

    const validate = await this.validateRoleName();
    if (!validate) {
      this.loaderService.hide();
      return;
    }

    // this.pickList.resetFilter();

    // if (this.action === 'add') {
    //   this.loaderService.hide();
    //   return;
    // }

    this.queryRoleAuthGroups();
  }

  queryRoleAuthGroups() {
    this.editForm.availableGroups = [];
    this.editForm.roleAuthGroups = [];

    let model = {
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

          let roleAuthGroups = [];
          rsp.body?.roleAuthGroups?.forEach((x) => {
            let group: RoleAuthGroup = x;
            roleAuthGroups.push(group);
          });
          this.editForm.roleAuthGroups = roleAuthGroups.slice(0);
          this.editForm.availableGroups = availableGroups.slice(0);

          this.editForm.roleAuthGroups = this.sortArrayData(
            this.editForm.roleAuthGroups,
            'authGroupName',
            1
          );
          this.editForm.availableGroups = this.sortArrayData(
            this.editForm.availableGroups,
            'authGroupName',
            1
          );
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

  cancelEdit() {
    this.router.navigate(['/sysadmin/role/main']);
  }

  async nextStep() {
    if (this.editForm.roleAuthGroups.length < 1) {
      this.toastService.info('Role.Message.AuthGroupRequired');
      return;
    }

    if (!(await this.validateRoleName())) {
      return;
    }

    this.loaderService.show();

    const validate = await this.validateEditForm();
    if (!validate) {
      this.loaderService.hide();
      return;
    }

    let modifiedData = {
      action: this.action,
      editForm: this.editForm,
    };
    this.roleService.setEditData(JSON.stringify(modifiedData));

    this.router.navigate(['/sysadmin/role/create-role-step2']);
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

  sortArrayData(arrayData: any[], field: string, sort: number) {
    if (arrayData && field && sort) {
      if (sort && sort == 1) {
        return arrayData.sort((a, b) =>
          (a[field] != null ? a[field] : '') <
          (b[field] != null ? b[field] : '')
            ? -1
            : 1
        );
      } else {
        return arrayData.sort((a, b) =>
          (a[field] != null ? a[field] : '') >
          (b[field] != null ? b[field] : '')
            ? -1
            : 1
        );
      }
    }
    return arrayData;
  }

  // async onSourceFilter() {
  //   this.sourceFilterValue = this.pickList.filterValueSource;
  //   if (!this.sourceFilterValue || this.sourceFilterValue == '') {
  //     return;
  //   }
  //   if (!this.editForm.roleType || this.editForm.roleType == '') {
  //     return;
  //   }

  //   this.loaderService.show();

  //   const validate = await this.validateRoleName();
  //   if (!validate) {
  //     this.loaderService.hide();
  //     return;
  //   }

  //   this.editForm.availableGroups = [];

  //   let model = {
  //     tenant: this.editForm.tenant,
  //     roleId: this.editForm.roleId,
  //     roleName: this.editForm.roleName,
  //     roleType: this.editForm.roleType,
  //     keyword: this.sourceFilterValue
  //   };

  //   this.roleService.queryRoleAvailableGroups(model).subscribe({
  //     next: rsp => {
  //       if (rsp?.status != 200) {
  //         return;
  //       }

  //       let availableGroups = [];
  //       rsp.body?.availableGroups?.forEach(x => {
  //         let group: RoleAuthGroup = x;
  //         availableGroups.push(group);
  //       });

  //       let newAvailableMembers = [];
  //       availableGroups.forEach(x => {
  //         let group: RoleAuthGroup = x;
  //         let groupAuthGroupId = group.authGroupId;
  //         if (this.editForm.roleAuthGroups.filter(function (e) { return e.authGroupId === groupAuthGroupId; }).length <= 0) {
  //           newAvailableMembers.push(group);
  //         }
  //       });

  //       this.editForm.availableGroups = newAvailableMembers.slice(0);
  //       this.pickList.filterValueSource = "";
  //     },
  //     error: rsp => {
  //       console.log(rsp || 'error');
  //       this.toastService.error('System.Message.Error');
  //     }
  //   })
  //     .add(() => {
  //       this.loaderService.hide();
  //     });

  // }

  ngOnDestroy(): void {
    [this.editDataChange$, this.onLangChange$].forEach(
      (subscription: Subscription) => {
        if (subscription != null || subscription != undefined)
          subscription.unsubscribe();
      }
    );
  }
}
