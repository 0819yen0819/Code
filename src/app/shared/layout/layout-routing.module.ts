import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AsyncDownloadComponent } from 'src/app/core/components/async-download/async-download.component';

import { MainComponent } from './main/main.component';

const routes: Routes = [
  {
    path: '',
    component: MainComponent,
    children: [
      {
        path: 'home',
        // loadChildren: () => import('../../pages/home/home.module').then(mod => mod.HomeModule)
      },
      {
        path: 'blacklistMgmt',
        loadChildren: () => import('../../pages/blacklist/blacklist.module').then(mod => mod.BlacklistModule)
      },
      {
        path: 'applicationMgmt',
        loadChildren: () => import('../../pages/application/application.module').then(mod => mod.ApplicationModule)
      },
      {
        path: 'formMgmt',
        loadChildren: () => import('../../pages/formMgmt/formMgmt.module').then(mod => mod.FormMgmtModule)
      },
      {
        path: 'licenseMgmt',
        loadChildren: () => import('../../pages/licenseMgmt/licenseMgmt.module').then(mod => mod.LicenseMgmtModule)
      },
      {
        path: 'sysadmin',
        loadChildren: () => import('../../pages/sysadmin/sysadmin.module').then(mod => mod.SysadminModule)
      },
      {
        path: 'orderValidation',
        loadChildren: () => import('../../pages/orderValidation/order-validation.module').then(mod => mod.OrderValidationModule)
      },
      {
        path: 'sellingPriceMgmt',
        loadChildren: () => import('../../pages/sellingPriceMgmt/selling-price-mgmt.module').then(mod => mod.SellingPriceModule)
      },
      {
        path: 'validationException/download',
        component: AsyncDownloadComponent,
      },
      {
        path: '',
        redirectTo: 'home'
      },
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class LayoutRoutingModule { }
