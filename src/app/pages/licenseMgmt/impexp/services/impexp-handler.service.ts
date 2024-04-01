import { Injectable } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { SelectItem } from 'primeng/api';
import { ConsigneeInfo } from 'src/app/core/model/consignee-info';

@Injectable({
  providedIn: 'root',
})
export class ImpexpHandlerService {
  constructor() {}

  onUserTypeHandler(form: FormGroup): FormGroup {
    form.get('vcCode').setValue(null);
    form.get('vcName').setValue(null);

    return form;
  }

  onCountryChangeHandler(form: FormGroup): FormGroup {
    form.get('consignee').setValue(null);
    form.get('consigneeAddress').setValue(null);

    return form;
  }

  onHKConsigneeChangeHandler(
    form: FormGroup,
    consigneeInfo: SelectItem<ConsigneeInfo>
  ): FormGroup {

    if (!consigneeInfo.value) {
      form.get('consignee').setValue(null);
      form.get('consigneeAddress').setValue(null);
    } else {
      form.get('consignee').setValue(consigneeInfo.value.consignee);
      form.get('consigneeAddress').setValue(consigneeInfo.value.address);
    }
    return form;
  }

  onOUCodeChangeHandler(form: FormGroup): FormGroup {
    form.get('shipToId').setValue(null);
    form.get('shipToCode').setValue(null);
    form.get('shipToAddress').setValue(null);
    form.get('shipToAddressE').setValue(null);
    form.get('deliverToId').setValue(null);
    form.get('deliverToCode').setValue(null);
    form.get('deliverToAddress').setValue(null);
    form.get('deliverToAddressE').setValue(null);
    form.get('consignee').setValue(null);
    form.get('consigneeAddress').setValue(null);
    return form;
  }

  onVCCodeChangeHandler(form: FormGroup): FormGroup {

    form.get('shipToId').setValue(null);
    form.get('shipToCode').setValue(null);
    form.get('shipToAddress').setValue(null);
    form.get('shipToAddressE').setValue(null);
    form.get('deliverToId').setValue(null);
    form.get('deliverToCode').setValue(null);
    form.get('deliverToAddress').setValue(null);
    form.get('deliverToAddressE').setValue(null);
    return form;
  }
}
