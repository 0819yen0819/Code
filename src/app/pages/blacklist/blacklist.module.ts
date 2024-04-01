import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AppCommonModule } from 'src/app/app.common.module';

import { PrimengModule } from '../../shared/primeng.module';
import { BlacklistRoutingModule } from './blacklist-routing.module';
import { DPLHoldComponent } from './dplhold/dplhold.component';
import { SampleOutDPLComponent } from './sample-out-dpl/sample-out-dpl.component';
import { ApproveDplholdComponent } from './dplhold/approve-dplhold/approve-dplhold.component';
import { DplResultComponent } from './dpl-result/dpl-result.component';
import { BlackMtnComponent } from './black-mtn/black-mtn.component';
import { WhiteListMtnComponent } from './white-list-mtn/white-list-mtn.component';
import { WhiteListTempMtnComponent } from './white-list-temp-mtn/white-list-temp-mtn.component';
import { NonEarItemMtnComponent } from './non-ear-item-mtn/non-ear-item-mtn.component';
import { SharedModule } from 'src/app/shared/shared.module';
import { DplFailComponent } from './dpl-fail/dpl-fail.component';
import { ApproveDplFailComponent } from './dpl-fail/approve-dpl-fail/approve-dpl-fail.component';
import { AutoCompleteModule } from 'primeng/autocomplete';
import { DplSuccessComponent } from './dpl-success/dpl-success.component';
import { CommonComponentModule } from 'src/app/core/components/common-component.module';
import { DplEndCustComponent } from './dpl-end-cust/dpl-end-cust.component';
import { ApprovingDplEndCustComponent } from './dpl-end-cust/approving-dpl-end-cust/approving-dpl-end-cust.component';
import { AttachmentUploaderModule } from '../licenseMgmt/components/common/attachment-uploader/attachment-uploader.module';

@NgModule({
  declarations: [
    DPLHoldComponent,
    SampleOutDPLComponent,
    ApproveDplholdComponent,
    BlackMtnComponent,
    WhiteListMtnComponent,
    WhiteListTempMtnComponent,
    NonEarItemMtnComponent,
    DplResultComponent,
    DplFailComponent,
    DplSuccessComponent,
    ApproveDplFailComponent,
    DplEndCustComponent,
    ApprovingDplEndCustComponent
  ],
  imports: [
    CommonModule,
    AppCommonModule,
    PrimengModule,
    BlacklistRoutingModule,
    AutoCompleteModule,
    SharedModule,
    CommonComponentModule,
    AttachmentUploaderModule
  ]
})
export class BlacklistModule { }
