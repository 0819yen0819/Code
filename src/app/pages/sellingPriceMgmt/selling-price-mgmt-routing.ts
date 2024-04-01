import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AsyncDownloadComponent } from 'src/app/core/components/async-download/async-download.component';
import { SalesMarginToleranceSetupComponent } from './sales-margin-tolerance-setup/sales-margin-tolerance-setup.component';
import { FreightAdderSetupComponent } from './freight-adder-setup/freight-adder-setup.component';

const routes: Routes = [
  { path: 'sales-margin-tolerance-setup', component: SalesMarginToleranceSetupComponent },
  { path: 'freight-adder-setup', component: FreightAdderSetupComponent },
  {
    path: 'download',
    children: [
      { path: '', component: AsyncDownloadComponent }
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class SellingPriceMgmtRoutingModule {}
