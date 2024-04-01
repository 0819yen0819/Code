import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { StoreBatchEditEntryRoutingModule } from './store-batch-edit-entry-routing.module';
// import { AppCommonModule } from 'src/app/app.common.module';
import { HttpClient } from '@angular/common/http';
import { TranslateLoader, TranslateModule } from '@ngx-translate/core';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { CommonComponentModule } from 'src/app/core/components/common-component.module'; 

import { StoreBatchEditEntryComponent } from './store-batch-edit-entry.component';

export function HttpLoaderFactory(http: HttpClient) {
  return new TranslateHttpLoader(http);
}

@NgModule({
  declarations: [StoreBatchEditEntryComponent],
  imports: [
    CommonModule,
    StoreBatchEditEntryRoutingModule,
    ProgressSpinnerModule,
    CommonComponentModule,
    // AppCommonModule,
    TranslateModule.forChild({
      loader: {
        provide: TranslateLoader,
        useFactory: HttpLoaderFactory,
        deps: [HttpClient],
      },
      isolate: false,
    }),
  ],
})
export class StoreBatchEditEntryModule { }
