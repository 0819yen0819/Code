import { Injectable } from '@angular/core';
import { lastValueFrom } from 'rxjs';
import { AuthApiService } from 'src/app/core/services/auth-api.service';
import { CommonApiService } from 'src/app/core/services/common-api.service';


@Injectable({
  providedIn: 'root'
})
export class FreightAdderAutocompleteService {

  constructor(
    private authApiService: AuthApiService,
    private commonApiService: CommonApiService
  ) { }

  filterOu(event, groupName) {
    if (groupName === '請選擇' || groupName === 'Please choose') { groupName = 'ALL' };
    return new Promise<any>((resolve, reject) => {
      this.authApiService.ouQueryByPrefixAndGroup(event.query, groupName).subscribe(x => {
        const filtered: any[] = [];
        for (let ou of x.ouList) { filtered.push(ou); }
        resolve(filtered);
      })
    });
  }

  filterBrand(event) {
    return new Promise<any>((resolve, reject) => {
      this.commonApiService.brandQueryByPrefix(event.query).subscribe(x => {
        const filtered: any[] = [];
        for (const brand of x.brandList) { filtered.push({ label: brand.name, value: brand.code, }); }
        resolve(filtered);
      });
    })
  }

  filterCustomer(event) {
    return new Promise<any>((resolve, reject) => {
      this.commonApiService.getFuzzyActiveCustomerAllList(event.query).subscribe(x => {
        const filtered: any[] = [];
        for (let customer of x.customerList) { filtered.push({ label: `${customer.customerNo} - ${customer.customerName} (${customer.customerNameEg})`, value: customer.customerNo, }); }
        resolve(filtered);
      });
    })
  }

  filterVendor(event) {
    return new Promise<any>((resolve, reject) => {
      this.commonApiService.getFuzzyActiveVendorAllList(event.query).subscribe(x => {
        const filtered: any[] = [];
        for (let vendor of x.vendorList) { filtered.push({ label: `${vendor.vendorCode} - ${vendor.vendorName} (${vendor.vendorEngName})`, value: vendor.vendorCode, }); }
        resolve(filtered);
      });
    })
  }

  filterEndCustomer(event, formValue, groupName) {
    if (groupName === '請選擇' || groupName === 'Please choose') { groupName = 'ALL' };
    return new Promise<any>((resolve, reject) => {
      const request = {
        ouGroup: groupName,
        ouCode: formValue.ou?.ouCode,
        brand: formValue.brand?.value,
        keyword: event.query
      };

      this.commonApiService.queryEndCustomer(request).subscribe(x => {
        const filtered: any[] = [];
        for (let endCustomer of x.endCustomerList) { filtered.push(endCustomer); }
        resolve(filtered);
      });
    })
  }

  filterProductCode(event) {
    const filtered: any[] = [];

    return new Promise<any>((resolve, reject) => {

      this.commonApiService.productQueryByPrefix("",event.query).subscribe((rsp) => {
        for (const item of rsp.productList) {
          filtered.push({
            label: item.code,
            value: item.code,
          });
        }

        resolve(filtered)
      });
    })
  }

  dropdownEndCustomer(event, formValue, groupName) {
    return new Promise<any>((resolve, reject) => {
      const brandEmpty = !(formValue.brand && formValue.brand?.value)
      const ouEmpty = !(formValue.ou && formValue.ou?.ouCode)
      const groupEmpty = !groupName

      if (brandEmpty || ouEmpty || groupEmpty) {
        resolve([]);
      }
      else {
        const request = {
          ouGroup: groupName,
          ouCode: formValue.ou?.ouCode,
          brand: formValue.brand?.value,
          keyword: event.query
        };
        lastValueFrom(this.commonApiService.queryEndCustomer(request))
          .then(x => {
            const filtered: any[] = [];
            for (let endCustomer of x.endCustomerList) {
              filtered.push({
                label: endCustomer.endCustomerName,
                value: endCustomer.endCustomerName,
              });
            }
            resolve(filtered);
          }).catch((err) => resolve([]))
      }
    })
  }

}
