import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { BafaLicenseMtnComponent } from './bafa-license-mtn/bafa-license-mtn.component';
import { EccnMtnComponent } from './eccn-mtn/eccn-mtn.component';
import { EccnStatusMtnComponent } from './eccn-status-mtn/eccn-status-mtn.component';
import { EucLicenseMtnComponent } from './euc-license-mtn/euc-license-mtn.component';
import { EucComponent } from './euc/euc.component';
import { IcpComponent } from './icp/icp.component';
import { ImpExpLicenseMtnComponent } from './impexp-license-mtn/impexp-license-mtn.component';
import { ImpexpComponent } from './impexp/impexp.component';
import { LehComponent } from './leh/leh.component';
import { LerComponent } from './ler/ler.component';
import { RuleSetupComponent } from './rule-setup/rule-setup.component';
import { Sc047LicenseMtnComponent } from './sc047-license-mtn/sc047-license-mtn.component';
import { Sc047V2Component } from './sc047-v2/sc047-v2.component';
import { SoaControlSetupComponent } from './soa-control-setup/soa-control-setup.component';
import { SoaLicenseMtnComponent } from './soa-license-mtn/soa-license-mtn.component';
import { SoaComponent } from './soa/soa.component';
import { SoaControlSetupCheckResultDownloadComponent } from './soa-control-setup/soa-control-setup-check-result-download/soa-control-setup-check-result-download.component';

const routes: Routes = [
  { path: 'eccn-status-mtn', component: EccnStatusMtnComponent },
  {
    path: 'impexp-license-mtn',
    children: [
      { path: '', component: ImpExpLicenseMtnComponent }
    ],
  },
  {
    path: 'euc-license-mtn',
    children: [
      { path: '', component: EucLicenseMtnComponent }
    ],
  },
  {
    path: 'eccn-mtn',
    children: [{ path: '', component: EccnMtnComponent }],
  },
  {
    path: 'soa-license-mtn',
    children: [
      { path: '', component: SoaLicenseMtnComponent }
    ],
  },
  {
    path: 'sc047-license-mtn',
    children: [
      { path: '', component: Sc047LicenseMtnComponent }
    ],
  },
  {
    path: 'euc',
    component: EucComponent,
  },
  {
    path: 'approving-euc',
    component: EucComponent,
  },
  {
    path: 'license-exception-setup',
    component: LerComponent,
  },
  {
    path: 'approving-sc047',
    component: Sc047V2Component,
  },
  {
    path: 'sc047',
    component: Sc047V2Component,
  },
  {
    path: 'license',
    component: ImpexpComponent,
  },
  {
    path: 'approving-license',
    component: ImpexpComponent,
  },
  {
    path: 'approving-leh',
    component: LehComponent,
  },
  {
    path: 'leh',
    component: LehComponent,
  },
  {
    path: 'approving-soa',
    component: SoaComponent,
  },
  {
    path: 'soa',
    component: SoaComponent,
  },
  {
    path: 'icp',
    component: IcpComponent,
  },
  {
    path: 'approving-icp',
    component: IcpComponent,
  },
  {
    path: 'soa-control-setup',
    component: SoaControlSetupComponent,
  },
  {
    path: 'soa-control-setup-check-result-download',
    component: SoaControlSetupCheckResultDownloadComponent,
  },
  {
    path: 'bafa-license-mtn',
    component: BafaLicenseMtnComponent,
  },
  {
    path: 'rule-setup',
    children: [
      { path: '', component: RuleSetupComponent }
    ],
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class LicenseRoutingModule {}
