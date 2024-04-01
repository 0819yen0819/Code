import { Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { lastValueFrom } from 'rxjs';
import { ItemBrandCtg } from 'src/app/core/model/item-brand-ctg';
import { AuthApiService } from 'src/app/core/services/auth-api.service';
import { CommonApiService } from 'src/app/core/services/common-api.service';

@Injectable({
  providedIn: 'root'
})
export class FreightAdderSetupService {

  constructor(
    private translateService: TranslateService,
    private authApiService: AuthApiService,
    private commonApiService: CommonApiService
  ) { }

  getGroupOptions(needPls: boolean = true, needAll: boolean = true) {
    return new Promise<any>(async (resolve, reject) => {
      let groupOptions = [];
      if (needPls) {
        groupOptions = [{
          label: this.translateService.instant('DropDown.PlaceHolder.PleaseChoose'),
          value: null
        }];
      }
      let rsp = await lastValueFrom(this.authApiService.groupQuery());
      for (let group of rsp.groupList) {
        groupOptions.push({
          label: group.groupName,
          value: group.groupCode,
        });
      }
      if (!needAll) {
        groupOptions = groupOptions.filter(group => group.value !== 'ALL')
      }

      resolve(groupOptions);
    })
  }

  getCtg1Options(target: ItemBrandCtg) {
    return new Promise<any>((resolve, reject) => {
      const filtered: any[] = [];
      this.commonApiService.getItemCtgByBrand(target).subscribe(rsp => {
        for (const brand of rsp.brandList) {
          if (brand.ctg1) {
            filtered.push({
              label: brand.ctg1,
              value: brand.ctg1,
            });
          }
        }
        resolve(filtered);
      })
    });
  }

}
