import { NgModule } from '@angular/core';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ErrorComponent } from './shared/error/error.component';

@NgModule({
    imports: [
      ConfirmDialogModule
    ],
    exports: [
        FormsModule,
        ReactiveFormsModule
    ],
    declarations: [
        ErrorComponent
    ]
})
export class AppCommonModule {

}
