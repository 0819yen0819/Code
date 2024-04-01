import { DatePipe } from '@angular/common';
import { Injectable } from '@angular/core';
import { Validators } from '@angular/forms';
import { lastValueFrom } from 'rxjs';
import { AuthApiService } from 'src/app/core/services/auth-api.service';
import { allItemTemplate } from '../../soa/soa-support/component/add-item/add-item.const';

@Injectable({
  providedIn: 'root'
})
export class AmSoaMtnDialogService {

  constructor(
    private authApiService: AuthApiService,
    private datePipe: DatePipe
  ) { }

  getAddTemplate() {
    const allItem = allItemTemplate; 

    return {
      group: ['', Validators.required],
      oOuCode: ['', Validators.required],
      item: [allItem.label, Validators.required],
      itemInfo: [allItem],
      quantity: [{ value: 'N' , disabled: true }, Validators.required], // 扣量 ('Y' , 'N')
      isOrigin: ['', Validators.required],
      eccn: [''],
      license: ['', Validators.required],
      ccats: [''],
      proviso: [''],
      vcType: ['', Validators.required],
      vcName: ['', Validators.required],
      vcInfo: [''],
      applyQty: [{ value: 0 , disabled: true }, Validators.required], // 扣量 (ex.123)
      startDate: ['', Validators.required],
      endDate: ['', Validators.required],
      flag: ['Y', Validators.required],
      remark: [''],
      brand:[''],
      ctg1:[''],
      ctg2:[''],
      ctg3:[''],
      specialApproval: ['N', Validators.required]
    }
  }

  getRecoverTemplate(e: any) {
    const groupTemp = {
      displayOu: e.oouCode === "0" ? "0_ALL OU" : `${e.oouCode}_${e.oouName}`,
      groupCode: "ALL" || e.oouCode,
      groupName: "ALL" || e.oouName,
      ouCode: "0" || e.ouCode,
      ouName: "ALL OU" || e.ouName,
      ouShortName: e.oouCode === "0" ? "0" : e.ouName
    }

    let isOrigin = e.isOriginal;
    if (isOrigin === '正本') { isOrigin = 'Y' }
    else if (isOrigin === '副本') { isOrigin = 'N' } 
    
    const allItem = allItemTemplate;
    const isAllItem = e.productCode === '0' && !e.brand && !e.eccn;
    return {
      group: [{ value: '', disabled: true }],
      oOuCode: [{ value: '', disabled: true }],
      item: [e.productCode === '0' ? allItem.label : e.productCode, Validators.required],
      itemInfo: [isAllItem ? allItem : null],
      isOrigin: [{ value: isOrigin, disabled: true }, Validators.required],
      eccn: [e.eccn],
      license: [{ value: e.licenseNo, disabled: true }],
      ccats: [e.ccats],
      proviso: [e.proviso],
      vcType: [e.vcType === 'C' ? 'Customer' : 'Vendor', Validators.required],
      vcName: [`${e.vcNo} - ${e.vcName} (${e.vcNameE})`, Validators.required],
      vcInfo: [''],
      quantity: [{ value: isAllItem ? 'N' : e.quantityFlag, disabled: isAllItem }, Validators.required],// 扣量 ('Y' , 'N')
      applyQty: [{ value: isAllItem || (e.quantityFlag === 'N')  ? 0 : e.quantity || 0, disabled: isAllItem  || (e.quantityFlag === 'N')}, Validators.required],// 扣量 (ex.123)
      startDate: [new Date(e.startDate), Validators.required],
      endDate: [new Date(e.endDate), Validators.required],
      flag: [e.activeFlag, Validators.required],
      brand:[e.brand],
      ctg1:[e.ctg1],
      ctg2:[e.ctg2],
      ctg3:[e.ctg3],
      specialApproval:e.specialApproval
    }
  }

  addDays(date, days, mode: 'Y' | 'D') {
    const day = mode === 'Y' ? + days * 365 : + days
    const targetDate = new Date();
    targetDate.setDate(date.getDate() + day);
    return targetDate;
  }
}
