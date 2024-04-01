import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { AuthgroupComponent } from './authgroup/authgroup.component';
import { RoleComponent } from './role/role.component';
import { CreateRoleStep1Component } from './role/create-role-step1/create-role-step1.component';
import { CreateRoleStep2Component } from './role/create-role-step2/create-role-step2.component';
import { CreateRoleStep3Component } from './role/create-role-step3/create-role-step3.component';

const routes: Routes = [
  {

    path: 'authgroup',
    children: [
      { path: 'main', component: AuthgroupComponent },
    ]
  },
  {

    path: 'role',
    children: [
      { path: 'main', component: RoleComponent },
      { path: 'create-role-step1', component: CreateRoleStep1Component },
      { path: 'create-role-step2', component: CreateRoleStep2Component },
      { path: 'create-role-step3', component: CreateRoleStep3Component },
    ]
  },
  {
    path: '',
    redirectTo: 'role/main'
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class SysadminRoutingModule { }
