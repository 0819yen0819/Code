import { Injectable } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { DialogSettingParams } from 'src/app/core/model/selector-dialog-params';

@Injectable({
  providedIn: 'root',
})
export class AmSc047ItemInitService {
  constructor(private formBuilder: FormBuilder) {}

  onInitForm(): FormGroup {
    const formGroup = this.formBuilder.group({
      productCode: [null],
      ccats:[null],
      quantity: [
        null,
        [Validators.required, Validators.pattern(/^\+?[1-9][0-9]*$/)],
      ],
      licenseKit:[null,[Validators.required]],
      license:[null,[Validators.required]],
      refFormNo:[null,[Validators.required]],
      scFlagType:[null],
      receipt: [null],
      remark: [null],
    });

    return formGroup;
  }

  onInitDialogSettings(): DialogSettingParams {
    return {
      title: '',
      visiable: false,
      modal: true,
      maximized: true,
      draggable: false,
      resizeable: true,
      blockScroll: true,
    };
  }
}
