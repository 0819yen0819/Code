import { DatePipe } from '@angular/common';
import { Injectable } from '@angular/core';
import { AuthApiService } from 'src/app/core/services/auth-api.service';

@Injectable({
  providedIn: 'root'
})
export class SalesMarginToleranceSetupDialogService {

  constructor(
    private authApiService: AuthApiService,
    private datePipe: DatePipe
  ) { }

  getAddTemplate() {
    return {
      ouGroup: 'ALL',
      status: 'Y',
      ou: { ouCode: 0, ouName: 'ALL OU', displayOu: '0_ALL OU' },
      customer: { value: 0, name: 'ALL (ALL)', displayCustomer: '0 - ALL (ALL)' },
      brand: { value: 'ALL', label: 'ALL' },
      productCode: { value: 0, label: 'ALL' }
    }
  }

  getRecoverTemplate(e: any) {
    let result = JSON.parse(JSON.stringify(e));
    result.ou = { displayOu: e.ouCode + '_' + e.ouName, ouCode: e.ouCode, ouName: e.ouName };
    result.customer = { value: e.custCode, name: e.custName, displayCustomer: e.custCode + ' - ' + e.custName };
    result.brand = { value: e.brand, label: e.brand };
    result.productCode = e.productCode == '0' ? { value: e.productCode, label: 'ALL' } : { value: e.productCode, label: e.productCode };
    result.endCustomer = e.endCustomer;
    result.fromDate = (e.fromDate != null && e.fromDate != undefined) ? new Date(e.fromDate) : null;
    result.toDate = (e.toDate != null && e.toDate != undefined) ? new Date(e.toDate) : null;
    return result;
  }
  
}
