import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { StoreBatchEditEntryComponent } from './store-batch-edit-entry.component';

const routes: Routes = [
  {
    path: '',
    component: StoreBatchEditEntryComponent
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class StoreBatchEditEntryRoutingModule { }
