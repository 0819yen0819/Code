import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { RedirectRoutingModule } from './redirect-routing.module';
import { RedirectComponent } from './redirect.component';
// import { AppCommonModule } from 'src/app/app.common.module';
import { HttpClient } from '@angular/common/http';
import { TranslateLoader, TranslateModule } from '@ngx-translate/core';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { CommonComponentModule } from 'src/app/core/components/common-component.module';

export function HttpLoaderFactory(http: HttpClient) {
  return new TranslateHttpLoader(http);
}

@NgModule({
  declarations: [RedirectComponent],
  imports: [
    CommonModule,
    RedirectRoutingModule,
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
export class RedirectModule {}
