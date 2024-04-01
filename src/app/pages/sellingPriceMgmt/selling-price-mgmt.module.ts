import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';

import { AppCommonModule } from 'src/app/app.common.module';
import { PrimengModule } from 'src/app/shared/primeng.module';
import { SharedModule } from 'src/app/shared/shared.module';

import { CommonComponentModule } from 'src/app/core/components/common-component.module';
import { SellingPriceMgmtRoutingModule } from './selling-price-mgmt-routing';
import { SalesMarginToleranceSetupComponent } from './sales-margin-tolerance-setup/sales-margin-tolerance-setup.component';
import { SalesMarginToleranceSetupDialogComponent } from './sales-margin-tolerance-setup/sales-margin-tolerance-setup-dialog/sales-margin-tolerance-setup-dialog.component';
import { SalesMarginToleranceUploadDialogComponent } from './sales-margin-tolerance-setup/sales-margin-tolerance-upload-dialog/sales-margin-tolerance-upload-dialog.component';
import { FreightAdderSetupComponent } from './freight-adder-setup/freight-adder-setup.component';
import { FreightQueryConditionComponent } from './freight-adder-setup/freight-query-condition/freight-query-condition.component';
import { FreightAdderAddDialogComponent } from './freight-adder-setup/freight-adder-add-dialog/freight-adder-add-dialog.component';
import { FreightAdderEditDialogComponent } from './freight-adder-setup/freight-adder-edit-dialog/freight-adder-edit-dialog.component';

@NgModule({
  declarations: [
    SalesMarginToleranceSetupComponent,
    SalesMarginToleranceSetupDialogComponent,
    SalesMarginToleranceUploadDialogComponent,
    FreightAdderSetupComponent,
    FreightQueryConditionComponent,
    FreightAdderAddDialogComponent,
    FreightAdderEditDialogComponent,
  ],
  imports: [
    CommonModule,
    PrimengModule,
    SellingPriceMgmtRoutingModule,
    SharedModule,
    AppCommonModule,
    CommonComponentModule,
  ],
  providers: [

  ],
})
export class SellingPriceModule {}
