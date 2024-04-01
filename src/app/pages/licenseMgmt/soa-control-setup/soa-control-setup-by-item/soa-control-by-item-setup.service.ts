import { LicenseControlApiService } from 'src/app/core/services/license-control-api.service';
import { CommonApiService } from 'src/app/core/services/common-api.service';
import { Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { SelectItem } from 'primeng/api';
import { lastValueFrom } from 'rxjs';
import { ItemBrandCtg } from 'src/app/core/model/item-brand-ctg';

@Injectable({
  providedIn: 'root',
})
export class SoaControlSetupByItemService {
  private _flagOptions: SelectItem[];
  private _flagOptionsWithDefault: SelectItem[];
  private _cvOptions: SelectItem[] = [
    { value: 'Customer', label: 'Customer' },
    { value: 'Vendor', label: 'Vendor' },
  ];

  // auto-complete suggest;
  searchItemObs;
  cacheFilterItem;
  filteredBrand;
  filteredCtg1;
  filteredCtg2;
  filteredCtg3;
  filteredECCN;
  filteredItem;

  constructor(
    private licenseControlApiService: LicenseControlApiService,
    private translateService: TranslateService,
    private commonApiService: CommonApiService
  ) {
    this.init();
  }

  get flagOptions() {
    return this._flagOptions;
  }

  get flagOptionsWithDefault() {
    return this._flagOptionsWithDefault;
  }

  get cvOptions() {
    return this._cvOptions;
  }

  init() {
    this.initEccnOptions();
    this.initFlagOptions();
    this.initFlagOptionsWithDefault();
  }

  getRandomKey() {
    return window.crypto.getRandomValues(new Uint32Array(1))[0];
  }

  dateFormat(timeStamp: Date, showHMS: boolean = true) {
    let date = new Date(timeStamp);
    const dateFormat = `${date.getFullYear()}-${
      date.getMonth() + 1
    }-${date.getDate()}`;
    if (showHMS) {
      return (
        dateFormat +
        ` ${date.getHours().toString().padStart(2, '0')}:${date
          .getMinutes()
          .toString()
          .padStart(2, '0')}:${date.getSeconds().toString().padStart(2, '0')}`
      );
    } else {
      return dateFormat;
    }
  }

  async filterBrandforCache(event) {
    const filtered: any[] = [];

    if (event) {
      const rsp = await lastValueFrom(
        this.commonApiService.brandQueryByPrefix(event.query ?? event)
      );
      for (const brand of rsp.brandList) {
        filtered.push({
          label: brand.name,
          value: brand.code,
        });
      }
    }
  }

  async filterItemforCache(event) {
    const filtered: any[] = [];

    if (event) {
      this.searchItemObs && this.searchItemObs.unsubscribe();
      this.searchItemObs = this.commonApiService
        .getFuzzyItemList(event.query ?? event)
        .pipe()
        .subscribe((rsp) => {
          for (const item of rsp.productList) {
            filtered.push({
              label: item.invItemNo,
              value: item.invItemNo,
            });
          }

          this.cacheFilterItem = [
            ...[
              {
                label: 'All Item',
                value: 0,
              },
            ],
            ...filtered,
          ];
        });
    }
  }

  async filterBrand(event) {
    const filtered: any[] = [];

    if (event) {
      const rsp = await lastValueFrom(
        this.commonApiService.brandQueryByPrefix(event.query ?? event)
      );
      for (const brand of rsp.brandList) {
        filtered.push({
          label: brand.name,
          value: brand.code,
        });
      }
    }

    this.filteredBrand = filtered;
  }

  async filterItem(event) {
    const filtered: any[] = [];

    if (event) {
      this.searchItemObs && this.searchItemObs.unsubscribe();
      this.searchItemObs = this.commonApiService
        .getFuzzyItemList(event.query ?? event)
        .pipe()
        .subscribe((rsp) => {
          for (const item of rsp.productList) {
            filtered.push({
              label: item.invItemNo,
              value: item.invItemNo,
            });
          }

          this.filteredItem = filtered;
        });
    }
  }

  async initCtg1Options(target: ItemBrandCtg) {
    const filtered: any[] = [];

    const rsp = await lastValueFrom(
      this.commonApiService.getItemCtgByBrand(target)
    );
    for (const brand of rsp.brandList) {
      if (brand.ctg1) {
        filtered.push({
          label: brand.ctg1,
          value: brand.ctg1,
        });
      }
    }

    this.filteredCtg1 = filtered;
  }
  async initCtg2Options(target: ItemBrandCtg) {
    const filtered: any[] = [];

    const rsp = await lastValueFrom(
      this.commonApiService.getItemCtgByBrand(target)
    );
    for (const brand of rsp.brandList) {
      if (brand.ctg2) {
        filtered.push({
          label: brand.ctg2,
          value: brand.ctg2,
        });
      }
    }

    this.filteredCtg2 = filtered;
  }
  async initCtg3Options(target: ItemBrandCtg) {
    const filtered: any[] = [];

    const rsp = await lastValueFrom(
      this.commonApiService.getItemCtgByBrand(target)
    );
    for (const brand of rsp.brandList) {
      if (brand.ctg3) {
        filtered.push({
          label: brand.ctg3,
          value: brand.ctg3,
        });
      }
    }

    this.filteredCtg3 = filtered;
  }
  private async initEccnOptions() {
    const filtered: any[] = [];

    const rsp = await lastValueFrom(
      this.licenseControlApiService.getECCNList()
    );
    for (const eccn of rsp.eccnList) {
      filtered.push({
        label: eccn,
        value: eccn,
      });
    }

    this.filteredECCN = filtered;
  }

  private initFlagOptions() {
    this._flagOptions = this.translateService.instant(
      'SoaControlSetup.Options.flagOptions'
    );
  }

  private initFlagOptionsWithDefault() {
    this._flagOptionsWithDefault = this.translateService.instant(
      'SoaControlSetup.Options.flagOptionsWithDefault'
    );
  }
}
