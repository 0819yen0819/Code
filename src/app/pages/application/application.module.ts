import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { PrimengModule } from '../../shared/primeng.module';
import { ApplicationRoutingModule } from './application-routing.module';
import { MyApplicationComponent } from './my-application/my-application.component';
import { PendingApprovalComponent } from './pending-approval/pending-approval.component';
import { PendingApprovalDetailComponent } from './pending-approval-detail/pending-approval-detail.component';
import { NewApplicationComponent } from './new-application/new-application.component';
import { PendingFailedComponent } from './pending-failed/pending-failed.component';
import { SharedModule } from 'src/app/shared/shared.module';
import { AutoCompleteModule } from 'primeng/autocomplete';

@NgModule({
  declarations: [
    MyApplicationComponent,
    PendingApprovalComponent,
    PendingApprovalDetailComponent,
    NewApplicationComponent,
    PendingFailedComponent
  ],
  imports: [
    CommonModule,
    PrimengModule,
    ApplicationRoutingModule,
    SharedModule,
    AutoCompleteModule
  ]
})
export class ApplicationModule { }
