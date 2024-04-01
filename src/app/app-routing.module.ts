import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { MsalGuard } from '@azure/msal-angular';
import { AuthGuard } from './core/guards/auth.guard';
import { ErrorComponent } from './shared/error/error.component';

const routes: Routes = [
  {
    path: '',
    canActivate: [AuthGuard],
    loadChildren: () => import('src/app/shared/layout/layout.module').then(mod => mod.LayoutModule)
  },
  {
    path: 'login',
    loadChildren: () => import('src/app/pages/login/login.module').then(mod => mod.LoginModule)
  },
  {
    path: 'redirect',
    canActivate: [MsalGuard],
    loadChildren: () => import('src/app/pages/redirect/redirect.module').then(m => m.RedirectModule)
  },
  {
    path: 'batchEditFormEntry',
    loadChildren: () => import('src/app/pages/storeBatchEditEntry/store-batch-edit-entry.module').then(m => m.StoreBatchEditEntryModule)
  },
  // {
  //   path: 'home',
  //   loadChildren: () => import('./shared/layout/layout.module').then(mod => mod.LayoutModule)
  // },
  {
    path: 'error',
    component: ErrorComponent
  },
  // {
  //   path: '',
  //   redirectTo: '/login',
  //   pathMatch: 'full'
  // }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
