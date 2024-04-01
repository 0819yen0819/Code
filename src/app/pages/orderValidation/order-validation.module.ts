import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { OrderValidationRoutingModule } from './order-validation-routing.module';
import { SocComponent } from './soc/soc.component';
import { PrimengModule } from 'src/app/shared/primeng.module';
import { SharedModule } from 'src/app/shared/shared.module';
import { SocApplierInfoComponent } from './soc/soc-applier-info/soc-applier-info.component';
import { SocApplicationComponent } from './soc/soc-application/soc-application.component';
import { TranslateModule } from '@ngx-translate/core';
import { SocItemsComponent } from './soc/soc-items/soc-items.component';
import { CommonComponentModule } from 'src/app/core/components/common-component.module';
import { SocWithdrawComponent } from './soc/soc-withdraw/soc-withdraw.component';
import { NsoComponent } from './nso/nso.component';
import { NsoApplicationComponent } from './nso/nso-application/nso-application.component';
import { NsoItemsComponent } from './nso/nso-items/nso-items.component';
import { NsoHeaderInfoComponent } from './nso/nso-header-info/nso-header-info.component';
import { PcfComponent } from './pcf/pcf.component';
import { PcfHeaderComponent } from './pcf/pcf-header/pcf-header.component';
import { PcfInformationComponent } from './pcf/pcf-information/pcf-information.component';
import { PcfLinesComponent } from './pcf/pcf-lines/pcf-lines.component';
import { DirectivesModule } from 'src/app/core/directives/directives.module';
import { PcfLinesMtnComponent } from './pcf/pcf-lines/pcf-lines-mtn/pcf-lines-mtn.component';
import { PcfLinesReadonlyTableComponent } from './pcf/pcf-lines/pcf-lines-readonly-table/pcf-lines-readonly-table.component';
import { SovApproveDialogComponent } from './components/approve-dialog/approve-dialog.component';
import { SovHistoryLogComponent } from './components/history-log/history-log.component';
import { SovApproveAttachedDialogComponent } from './components/attached-file-log/approve-add-attached-dialog/approve-add-attached-dialog.component';
import { SovAttachedFileLogComponent } from './components/attached-file-log/attached-file-log.component';
import { SovDataTableViewerComponent } from './components/data-table-viewer/data-table-viewer.component';
import { SovDataTableColSelectorComponent } from './components/data-table-col-selector-dialog/data-table-col-selector-dialog.component';
import { SovDtViewerDropdownComponent } from './components/data-table-viewer/dt-viewer-dropdown/dt-viewer-dropdown.component';
@NgModule({
  declarations: [
    SocComponent,
    SocApplierInfoComponent,
    SocApplicationComponent,
    SocItemsComponent,
    SocWithdrawComponent,
    NsoComponent,
    NsoApplicationComponent,
    NsoItemsComponent,
    NsoHeaderInfoComponent,
    PcfComponent,
    PcfHeaderComponent,
    PcfInformationComponent,
    PcfLinesComponent,
    PcfLinesMtnComponent,
    PcfLinesReadonlyTableComponent,
    SovApproveDialogComponent,
    SovHistoryLogComponent,
    SovApproveAttachedDialogComponent,
    SovAttachedFileLogComponent,
    SovDataTableViewerComponent,
    SovDataTableColSelectorComponent,
    SovDtViewerDropdownComponent
  ],
  imports: [
    CommonModule,
    OrderValidationRoutingModule,
    PrimengModule,
    SharedModule,
    TranslateModule,
    CommonComponentModule,
    DirectivesModule
  ]
})
export class OrderValidationModule { }
