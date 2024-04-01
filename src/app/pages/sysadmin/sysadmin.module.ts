import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { PrimengModule } from '../../shared/primeng.module';
import { SysadminRoutingModule } from './sysadmin-routing.module';
import { AuthgroupComponent } from './authgroup/authgroup.component';
import { RoleComponent } from './role/role.component';
import { SharedModule } from 'src/app/shared/shared.module';
import { CreateRoleStep1Component } from './role/create-role-step1/create-role-step1.component';
import { CreateRoleStep2Component } from './role/create-role-step2/create-role-step2.component';
import { CreateRoleStep3Component } from './role/create-role-step3/create-role-step3.component';

@NgModule({
  declarations: [
    AuthgroupComponent,
    RoleComponent,
    CreateRoleStep1Component,
    CreateRoleStep2Component,
    CreateRoleStep3Component
  ],
  imports: [
    CommonModule,
    PrimengModule,
    SysadminRoutingModule,
    SharedModule
  ]
})
export class SysadminModule { }
