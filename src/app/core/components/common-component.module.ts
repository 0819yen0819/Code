import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReassignDialogComponent } from './reassign-dialog/reassign-dialog.component';
import { AutoCompleteModule } from 'primeng/autocomplete';
import { PrimengModule } from 'src/app/shared/primeng.module';
import { SharedModule } from 'src/app/shared/shared.module';
import { NoticeCheckDialogComponent } from './notice-check-dialog/notice-check-dialog.component';
import { MultipleUploadComponent } from './multiple-upload/multiple-upload.component';
import { ErrorHintComponent } from './error-hint/error-hint.component';
import { AccordionStepchartComponent } from 'src/app/pages/orderValidation/components/accordion-stepchart/accordion-stepchart.component';
import { AgentInfoTableComponent } from './agent-info-table/agent-info-table.component';

@NgModule({
  declarations: [
    ReassignDialogComponent,
    NoticeCheckDialogComponent,
    MultipleUploadComponent,
    ErrorHintComponent,
    AccordionStepchartComponent,
    AgentInfoTableComponent
  ],
  imports: [
    CommonModule,
    AutoCompleteModule,
    PrimengModule,
    SharedModule
  ],
  exports: [
    ReassignDialogComponent,
    NoticeCheckDialogComponent,
    MultipleUploadComponent,
    ErrorHintComponent,
    AccordionStepchartComponent,
    AgentInfoTableComponent
  ]
})
export class CommonComponentModule { }
