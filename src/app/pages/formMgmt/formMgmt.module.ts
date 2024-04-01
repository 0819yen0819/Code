import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AppCommonModule } from 'src/app/app.common.module';

import { PrimengModule } from '../../shared/primeng.module';
import { BlacklistRoutingModule } from './formMgmt-routing.module';
import { SharedModule } from 'src/app/shared/shared.module';
import { FormTypeAuthComponent } from './form-type-auth/form-type-auth.component';
import { DelegationComponent } from './delegation/delegation.component';
import { FormFileQueryComponent } from './form-file-query/form-file-query.component';
import { AutoCompleteModule } from 'primeng/autocomplete';

@NgModule({
  declarations: [
    FormTypeAuthComponent,
    FormFileQueryComponent,
    DelegationComponent
  ],
  imports: [
    CommonModule,
    AppCommonModule,
    PrimengModule,
    BlacklistRoutingModule,
    AutoCompleteModule,
    SharedModule
  ]
})
export class FormMgmtModule { }
