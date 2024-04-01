import { CommonModule } from '@angular/common';
import { ModuleWithProviders, NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { TranslateModule, TranslateStore } from '@ngx-translate/core';
import { DirectivesModule } from '../core/directives/directives.module';

@NgModule({
  declarations: [],
  imports: [CommonModule, DirectivesModule],
  exports: [
    TranslateModule,
    FormsModule,
    ReactiveFormsModule,
    DirectivesModule,
  ],
  providers: [TranslateStore],
})
export class SharedModule {
  static forRoot(): ModuleWithProviders<SharedModule> {
    return {
      ngModule: SharedModule,
    };
  }
}
