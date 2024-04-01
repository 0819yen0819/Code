import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { FormTypeAuthComponent } from './form-type-auth/form-type-auth.component';
import { DelegationComponent } from './delegation/delegation.component';
import { FormFileQueryComponent } from './form-file-query/form-file-query.component';

const routes: Routes = [
  {
    path: '',
    redirectTo: 'form-type-auth'
  },
  {
    path: 'form-type-auth',
    children: [
      { path: '', component: FormTypeAuthComponent },
    ]
  },
  {
    path: 'maintain/delegation',
    children: [
      { path: '', component: DelegationComponent },
    ]
  },
  {
    path: 'form-file-query',
    children: [
      { path: '', component: FormFileQueryComponent },
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class BlacklistRoutingModule { }
