import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { PendingApprovalComponent } from './pending-approval/pending-approval.component';
import { PendingApprovalDetailComponent } from './pending-approval-detail/pending-approval-detail.component';
import { PendingFailedComponent } from './pending-failed/pending-failed.component';
import { NewApplicationComponent } from './new-application/new-application.component';
import { MyApplicationComponent } from './my-application/my-application.component';

const routes: Routes = [
  {

    path: 'pending',
    children: [
      { path: '', component: PendingApprovalComponent },
      { path: 'detail', component: PendingApprovalDetailComponent },
      { path: 'failed', component: PendingFailedComponent },
    ]
  },
  {

    path: 'new',
    children: [
      { path: '', component: NewApplicationComponent },
    ]
  },
  {

    path: 'my-application',
    children: [
      { path: '', component: MyApplicationComponent },
    ]
  },
  {
    path: '',
    redirectTo: 'pending'
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ApplicationRoutingModule { }
