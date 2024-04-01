import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { SelectItem } from 'primeng/api';
import { Table } from 'primeng/table';

import { PickList } from 'primeng/picklist';
import { lastValueFrom, Subscription } from 'rxjs';
import { ResponseCodeEnum } from 'src/app/core/enums/ResponseCodeEnum';
import {
  AuthGroupInfo,
  AuthGroupMember,
  AuthGroupService,
} from 'src/app/core/services/auth-group.service';
import { LoaderService } from 'src/app/core/services/loader.service';
import { SessionService } from 'src/app/core/services/session.service';
import { ToastService } from 'src/app/core/services/toast.service';
import { UserContextService } from 'src/app/core/services/user-context.service';

@Component({
  selector: 'app-authgroup',
  templateUrl: './authgroup.component.html',
  styleUrls: ['./authgroup.component.scss'],
})
export class AuthgroupComponent implements OnInit, OnDestroy {
  @ViewChild('dt') dt: Table;
  @ViewChild('pickList1') pickList1: PickList;

  title: string;

  private onLangChange$: Subscription;

  permissions: string[] = [];

  defaultTenant: string;

  tenantOptions: SelectItem[];
  selectedTenants: string;

  authGroupTypeOptions: SelectItem[];
  selectedAuthGroupTypes: SelectItem[];
  authGroupName: string;

  isDefaultOptions: SelectItem[];

  cols: any[];
  colFuncs: any[];
  selectedCols: any[];
  data: any[];
  displayFilterDetail = false;

  displayEditDialog = false;
  displayDelDialog = false;
  displayViewDialog = false;

  // addSelectedTenants: SelectItem[];
  editSelectedTenants: SelectItem[];

  editDialogTitle: string;

  editForm: AuthGroupInfo;
  viewForm: AuthGroupInfo;

  delAuthGroupId: string;

  action: string;
  submitted: boolean = false;
  tenantRequired: boolean;
  authGroupNameRequired: boolean;
  authGroupNameExists: boolean;
  authGroupTypeRequired: boolean;
  authGroupNameOverLength: boolean;
  authGroupDescOverLength: boolean;

  filterCharacter: string;

  constructor(
    private router: Router,
    private translateService: TranslateService,
    private authGroupService: AuthGroupService,
    private toastService: ToastService,
    private loaderService: LoaderService,
    private sessionService: SessionService,
    private userContextService: UserContextService
  ) {
    if (this.userContextService.user$.getValue) {
      this.permissions = this.userContextService.getMenuUrlPermission(
        this.router.url
      );
      console.log('permissions: ', this.permissions);
    }
    this.onLangChange$ = this.translateService.onLangChange.subscribe(() => {
      this.initAuthGroupOptions();
      this.initTenantOptions();
      this.initColumns();
      this.changeFilterDetail();
    });

    this.title = this.userContextService.getMenuUrlTitle(this.router.url);
    // console.log(this.permissions);
  }

  ngOnInit(): void {
    this.loaderService.show();

    this.defaultTenant = this.userContextService.user$.getValue()?.tenant;

    this.initAuthGroupOptions();
    this.initTenantOptions();
    this.initColumns();

    this.changeFilterDetail();

    this.data = [];

    //# TK-35854
    // this.initData();

    this.resetEditDialog();

    this.loaderService.hide();
  }

  initColumns() {
    this.cols = this.translateService.instant('AuthGroup.Columns');
    let colFuns = this.translateService.instant('AuthGroup.ColumnFunctions');
    this.colFuncs = colFuns.filter((x) => this.permissions.includes(x.field));
  }

  initAuthGroupOptions() {
    this.authGroupTypeOptions = [];
    this.authGroupTypeOptions.push.apply(
      this.authGroupTypeOptions,
      this.translateService.instant('AuthGroup.Options.DefaultNull')
    );
    this.authGroupTypeOptions.push.apply(
      this.authGroupTypeOptions,
      this.translateService.instant('AuthGroup.Options.AuthGroupType')
    );

    this.isDefaultOptions = this.translateService.instant(
      'AuthGroup.Options.IsDefault'
    );
  }

  initTenantOptions() {
    this.loaderService.show();

    this.tenantOptions = [];
    this.tenantOptions.push.apply(
      this.tenantOptions,
      this.translateService.instant('AuthGroup.Options.DefaultNull')
    );

    this.authGroupService
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
        },
        error: (rsp) => {
          console.debug(rsp || 'error');
          this.toastService.error('System.Message.Error');
        },
      })
      .add(() => {
        this.selectedTenants = this.defaultTenant;
        this.loaderService.hide();
      });
  }

  resetCondition() {
    //# TK-35854
    this.data = new Array();
    this.selectedTenants = this.defaultTenant;
    this.selectedAuthGroupTypes = [];
    this.authGroupName = '';
  }

  initData() {
    this.loaderService.show();

    this.data = [];

    let model = {
      tenant: (this.selectedTenants || '') == '' ? null : this.selectedTenants,
      authGroupType:
        (this.selectedAuthGroupTypes || '') == ''
          ? null
          : this.selectedAuthGroupTypes,
      authGroupName: this.authGroupName,
    };

    this.authGroupService
      .getAuthGroups(model)
      .subscribe({
        next: (rsp) => {
          if (rsp?.status != 200) {
            return;
          }

          rsp.body?.authGroups?.forEach((x) => {
            let authGroup: AuthGroupInfo = x;
            this.data.push(authGroup);
          });

          this.dt.reset();
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

  getAuthGroupTypeDesc(val) {
    let authGroupTypeDesc = this.authGroupTypeOptions
      .filter((x) => x.value === val)
      .map((v) => v.label);
    return authGroupTypeDesc?.length > 0 ? authGroupTypeDesc[0] : '';
  }

  getIsDefaultDesc(val) {
    let isDefaultDesc = this.isDefaultOptions
      .filter((x) => x.value === val)
      .map((v) => v.label);
    return isDefaultDesc?.length > 0 ? isDefaultDesc[0] : '';
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

  resetEditDialog() {
    this.editDialogTitle =
      this.action === 'edit'
        ? this.translateService.instant('AuthGroup.Title.EditAuthGroup')
        : this.translateService.instant('AuthGroup.Title.AddAuthGroup');

    this.editForm = {
      tenant: this.defaultTenant,
      authGroupId: null,
      authGroupName: '',
      authGroupDesc: '',
      authGroupType: '',
      isDefault: 'N',

      availableMembers: [],
      authGroupMembers: [],
    };

    this.editForm.tenant = this.editForm.tenant
      ? this.editForm.tenant
      : this.defaultTenant;
  }

  clickAddAuthGroup() {
    this.action = 'add';
    this.editDialogTitle = this.translateService.instant(
      'AuthGroup.Title.AddAuthGroup'
    );

    this.resetEditDialog();

    this.displayEditDialog = true;
  }

  clickEditAuthGroup(data) {
    this.loaderService.show();

    this.action = 'edit';
    this.editDialogTitle = this.translateService.instant(
      'AuthGroup.Title.EditAuthGroup'
    );

    Object.assign(this.editForm, data);

    this.changeAuthGroupType();

    this.displayEditDialog = true;
  }

  clickViewAuthGroup(data) {
    this.loaderService.show();

    this.action = 'view';

    this.editDialogTitle = this.translateService.instant(
      'AuthGroup.Title.ViewAuthGroup'
    );

    Object.assign(this.editForm, data);

    this.changeAuthGroupType();

    this.displayViewDialog = true;
  }

  closeEditDialog() {
    this.displayEditDialog = false;
    this.resetEditDialog();
    this.pickList1.resetFilter();
  }

  closeViewDialog() {
    this.displayViewDialog = false;
    // this.resetEditDialog();
  }

  resetValidate() {
    this.submitted = false;

    this.tenantRequired = false;
    this.authGroupNameRequired = false;
    this.authGroupNameExists = false;
    this.authGroupTypeRequired = false;
    this.authGroupNameOverLength = false;
    this.authGroupDescOverLength = false;
  }

  validateAuthGroupName(): Promise<boolean> {
    return new Promise((resolve, reject) => {
      console.debug('validateAuthGroupName');
      this.resetValidate();

      this.submitted = true;
      if (!this.editForm.tenant) {
        this.tenantRequired = true;
      }
      if (!this.editForm.authGroupName) {
        this.authGroupNameRequired = true;
      }
      if (this.editForm.authGroupName.length > 100) {
        this.authGroupNameOverLength = true;
      }
      if (this.editForm.authGroupDesc.length > 300) {
        this.authGroupDescOverLength = true;
      }
      if (
        this.tenantRequired ||
        this.authGroupNameRequired ||
        this.authGroupNameOverLength ||
        this.authGroupDescOverLength
      ) {
        return resolve(false);
      }

      this.authGroupNameExists = false;

      let model = {
        tenant: this.editForm.tenant,
        authGroupId: this.editForm.authGroupId,
        authGroupName: this.editForm.authGroupName,
      };

      lastValueFrom(this.authGroupService.checkAuthGroupNameExists(model)).then(
        (x) => {
          this.authGroupNameExists = x;
          if (this.authGroupNameExists) {
            return resolve(false);
          }

          this.submitted = false;
          return resolve(true);
        }
      );
    });
  }

  validateEditForm(): Promise<boolean> {
    return new Promise((resolve, reject) => {
      console.debug('validateEditForm');

      this.validateAuthGroupName().then((x) => {
        if (!x) {
          return resolve(false);
        }

        if (!this.editForm.authGroupType || this.editForm.authGroupType == '') {
          this.authGroupTypeRequired = true;
        }

        if (
          this.tenantRequired ||
          this.authGroupNameRequired ||
          this.authGroupNameExists ||
          this.authGroupTypeRequired
        ) {
          return resolve(false);
        }
        return resolve(true);
      });
    });
  }

  async changeAuthGroupType() {
    if (!this.editForm.authGroupType || this.editForm.authGroupType == '') {
      return;
    }

    this.loaderService.show();

    const validate = await this.validateAuthGroupName();
    if (!validate) {
      this.loaderService.hide();
      return;
    }

    if (this.action === 'add') {
      this.loaderService.hide();
      return;
    }

    this.editForm.availableMembers = [];
    this.editForm.authGroupMembers = [];

    let model = {
      tenant: this.editForm.tenant,
      authGroupId: this.editForm.authGroupId,
      authGroupName: this.editForm.authGroupName,
      authGroupType: this.editForm.authGroupType,
    };

    this.pickList1.resetFilter();

    this.authGroupService
      .queryAuthGroupMembers(model)
      .subscribe({
        next: (rsp) => {
          if (rsp?.status != 200) {
            return;
          }

          let availableMembers = [];
          rsp.body?.availableMembers?.forEach((x) => {
            let member: AuthGroupMember = x;
            availableMembers.push(member);
          });

          let authGroupMembers = [];
          rsp.body?.authGroupMembers?.forEach((x) => {
            let member: AuthGroupMember = x;
            authGroupMembers.push(member);
          });
          this.editForm.authGroupMembers = authGroupMembers.slice(0);
          this.editForm.availableMembers = availableMembers.slice(0);
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

  validateAndSaveData() {
    this.validateEditForm().then((x) => {
      if (!x) {
        return;
      }

      this.saveData();
    });
  }

  saveData() {
    if (this.editForm.authGroupMembers.length < 1) {
      this.toastService.info('AuthGroup.Message.MemberRequired');
      return;
    }

    this.loaderService.show();

    let authGroup: AuthGroupInfo = this.editForm;
    let model: any = Object.assign({}, authGroup);
    model.isDefault = model.isDefault || 'N';
    let members: any[] = [];
    this.editForm.authGroupMembers.forEach((x) => {
      let member = {
        memberId: x.memberId,
        memberType: x.memberType,
        authGroupId: x.authGroupId,
      };
      members.push(member);
    });
    model.authGroupMembers = members;

    this.authGroupService
      .saveAuthGroupAndMembers(model)
      .subscribe({
        next: (rsp) => {
          if (rsp?.status != 200) {
            return;
          }
          this.resetEditDialog();

          if (this.action === 'add') {
            this.toastService.success('AuthGroup.Message.AddSuccess');
          } else if (this.action === 'edit') {
            this.toastService.success('AuthGroup.Message.EditSuccess');
          }

          this.closeEditDialog();
          this.initData();
        },
        error: (rsp) => {
          console.debug(rsp || 'error');
          if (
            rsp?.status == 500 &&
            rsp.error?.code === ResponseCodeEnum.AUTHGROUPNAME_ALREADY_EXISTS
          ) {
            this.toastService.error('AuthGroup.Message.AuthGroupNameExists');
          } else {
            this.toastService.error('System.Message.Error');
          }
        },
      })
      .add(() => {
        this.loaderService.hide();
      });
  }

  clickDeleteAuthGroup(authGroup) {
    this.action = 'del';

    this.delAuthGroupId = authGroup.authGroupId;
    this.displayDelDialog = true;
  }

  deleteAuthGroup() {
    if (this.delAuthGroupId) {
      this.loaderService.show();

      this.authGroupService
        .deleteAuthGroup({ authGroupId: this.delAuthGroupId })
        .subscribe({
          next: (rsp) => {
            if (rsp?.status != 200) {
              return;
            }
            this.toastService.success('AuthGroup.Message.DelSuccess');
            this.initData();
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
    this.displayDelDialog = false;
    this.initData();
  }

  async onSourceFilter() {
    const filterValue = this.pickList1.filterValueSource;
    if (!filterValue || filterValue == '') {
      return;
    }
    if (!this.editForm.authGroupType || this.editForm.authGroupType == '') {
      return;
    }

    this.loaderService.show();

    const validate = await this.validateAuthGroupName();
    if (!validate) {
      this.loaderService.hide();
      return;
    }

    this.editForm.availableMembers = [];

    let model = {
      tenant: this.editForm.tenant,
      authGroupId: this.editForm.authGroupId,
      authGroupName: this.editForm.authGroupName,
      authGroupType: this.editForm.authGroupType,
      keyword: filterValue,
    };

    this.authGroupService
      .queryAvailableMembers(model)
      .subscribe({
        next: (rsp) => {
          if (rsp?.status != 200) {
            return;
          }

          let availableMembers = [];
          rsp.body?.availableMembers?.forEach((x) => {
            let member: AuthGroupMember = x;
            availableMembers.push(member);
          });

          let newAvailableMembers = [];
          availableMembers.forEach((x) => {
            let member: AuthGroupMember = x;
            let memberId = member.memberId;
            if (
              this.editForm.authGroupMembers.filter(function (e) {
                return e.memberId === memberId;
              }).length <= 0
            ) {
              newAvailableMembers.push(member);
            }
          });

          this.editForm.availableMembers = newAvailableMembers.slice(0);
          this.pickList1.filterValueSource = '';
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

  ngOnDestroy(): void {
    [this.onLangChange$].forEach((subscription: Subscription) => {
      if (subscription != null || subscription != undefined)
        subscription.unsubscribe();
    });
  }
}
