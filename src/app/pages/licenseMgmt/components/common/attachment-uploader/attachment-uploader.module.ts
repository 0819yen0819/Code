import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AttachmentUploaderComponent } from './attachment-uploader.component';
import { AttachmentUploaderDialogComponent } from './attachment-uploader-dialog/attachment-uploader-dialog.component';
import { CommonComponentModule } from 'src/app/core/components/common-component.module';
import { PrimengModule } from 'src/app/shared/primeng.module';
import { SharedModule } from 'src/app/shared/shared.module';


@NgModule({
  declarations: [
    AttachmentUploaderComponent,
    AttachmentUploaderDialogComponent
  ],
  imports: [
    CommonModule,
    CommonComponentModule,
    PrimengModule,
    SharedModule
  ],
  exports:[
    AttachmentUploaderComponent,
    AttachmentUploaderDialogComponent,
  ]
})
export class AttachmentUploaderModule { }
