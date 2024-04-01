import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { DPLHoldComponent } from './dplhold/dplhold.component';
import { DplFailComponent } from './dpl-fail/dpl-fail.component';
import { DplSuccessComponent } from './dpl-success/dpl-success.component';
import { ApproveDplholdComponent } from './dplhold/approve-dplhold/approve-dplhold.component';
import { ApproveDplFailComponent } from './dpl-fail/approve-dpl-fail/approve-dpl-fail.component';
import { SampleOutDPLComponent } from './sample-out-dpl/sample-out-dpl.component';
import { DplResultComponent } from './dpl-result/dpl-result.component';
import { BlackMtnComponent } from './black-mtn/black-mtn.component';
import { WhiteListMtnComponent } from './white-list-mtn/white-list-mtn.component';
import { WhiteListTempMtnComponent } from './white-list-temp-mtn/white-list-temp-mtn.component';
import { NonEarItemMtnComponent } from './non-ear-item-mtn/non-ear-item-mtn.component';
import { CheckResultDownloadComponent } from './check-result-download/check-result-download.component';
import { DplEndCustComponent } from './dpl-end-cust/dpl-end-cust.component';
import { ApprovingDplEndCustComponent } from './dpl-end-cust/approving-dpl-end-cust/approving-dpl-end-cust.component';


const routes: Routes = [
  {

    path: 'dpl',
    children: [
      { path: '', component: DPLHoldComponent },
    ]
  },
  {

    path: 'dpl-fail',
    children: [
      { path: '', component: DplFailComponent },
    ]
  },
  {
    path: 'dpl-result',
    children: [
      { path: '', component: DplResultComponent },
    ]
  },
  {
    path: 'dpl-success',
    children: [
      { path: '', component: DplSuccessComponent },
    ]
  },
  {
    path: 'black-mtn',
    children: [
      { path: '', component: BlackMtnComponent },
    ]
  },
  {
    path: 'white-list-mtn',
    children: [
      { path: '', component: WhiteListMtnComponent },
    ]
  },
  {
    path: 'white-list-temp-mtn',
    children: [
      { path: '', component: WhiteListTempMtnComponent },
    ]
  },
  {
    path: 'non-ear-item-mtn',
    children: [
      { path: '', component: NonEarItemMtnComponent },
    ]
  },
  {
    path: 'approving-dpl',
    children: [
      { path: '', component: ApproveDplholdComponent },
    ]
  },
  {
    path: 'approving-dpl-fail',
    children: [
      { path: '', component: ApproveDplFailComponent },
    ]
  },
  {
    path: 'dpl-end-cust',
    children: [
      { path: '', component: DplEndCustComponent },
    ]
  },
  {
    path: 'approving-dpl-end-cust',
    children: [
      { path: '', component: ApprovingDplEndCustComponent },
    ]
  },
  {
    path: 'sample-out-dpl',
    children: [
      { path: '', component: SampleOutDPLComponent },
    ]
  },
  {
    path: 'check-result-download',
    children: [
      { path: '', component: CheckResultDownloadComponent },
    ]
  },
  {
    path: '',
    redirectTo: 'sample-out-dpl'
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class BlacklistRoutingModule { }
