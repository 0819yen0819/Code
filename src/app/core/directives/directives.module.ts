import { NgModule } from '@angular/core';
import { DndUploadDirective } from './dnd-upload/dnd-upload.directive';
import { HtmlCollapseDirective } from './html-collapse/html-collapse.directive';
import { DndUploadPureDirective } from './dnd-upload-pure/dnd-upload-pure.directive';
@NgModule({
  imports: [],
  declarations: [DndUploadDirective, HtmlCollapseDirective, DndUploadPureDirective],
  exports: [DndUploadDirective, HtmlCollapseDirective,DndUploadPureDirective],
})
export class DirectivesModule {}
