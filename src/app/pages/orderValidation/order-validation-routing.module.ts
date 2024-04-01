import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { SocComponent } from './soc/soc.component';
import { NsoComponent } from './nso/nso.component';
import { PcfComponent } from './pcf/pcf.component';

const routes: Routes = [
  {
    path: 'soc',
    component: SocComponent,
  },
  {
    path: 'approving-soc',
    component: SocComponent,
  },
  {
    path: 'nso',
    component: NsoComponent,
  },
  {
    path: 'approving-nso',
    component: NsoComponent,
  },
  {
    path: 'pcf',
    component: PcfComponent,
  },
  {
    path: 'approving-pcf',
    component: PcfComponent,
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class OrderValidationRoutingModule { }
