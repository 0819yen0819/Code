import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { PrimengModule } from '../primeng.module';
import { LayoutRoutingModule } from './layout-routing.module';
import { MainComponent } from './main/main.component';
import { SharedModule } from '../shared.module';

@NgModule({
  declarations: [MainComponent],
  imports: [CommonModule, PrimengModule, LayoutRoutingModule, SharedModule],
})
export class LayoutModule {}
