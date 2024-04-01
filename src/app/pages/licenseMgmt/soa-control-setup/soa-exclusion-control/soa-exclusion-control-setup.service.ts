import { Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { SelectItem } from 'primeng/api';
import { lastValueFrom } from 'rxjs';
import { AuthApiService } from '../../../../core/services/auth-api.service';
import { CommonApiService } from 'src/app/core/services/common-api.service';

@Injectable({
  providedIn: 'root',
})
export class SoaExclusionControlSetupService {
  private _groupOptions: SelectItem[];
  private _flagOptions: SelectItem[];
  private _flagOptionsWithDefault: SelectItem[];
  private _cvOptions: SelectItem[] = [
    { value: 'Customer', label: 'Customer' },
    { value: 'Vendor', label: 'Vendor' },
  ];

  private groupInfo: any;

  filteredBrand;

  constructor(
    private authApiService: AuthApiService,
    private translateService: TranslateService,
    private commonApiService: CommonApiService
  ) {
    this.init();
  }

  get groupOptions() {
    return this._groupOptions;
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
    this.subscribeLangChange();
    this.initGroupOptions();
    this.initFlagOptions();
    this.initFlagOptionsWithDefault();
  }

  subscribeLangChange() {
    this.translateService.onLangChange.subscribe(() => {
      this.initGroupOptions();
    });
  }

  getGroupCodeByGroupName(name: string) {
    return this.groupInfo.filter((item) => item.groupName === name)[0]
      .groupCode;
  }

  getRandomKey(): number {
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

  /**
   * 初始化Group下拉選項
   *
   */
  private async initGroupOptions() {
    this._groupOptions = [
      {
        label: this.translateService.instant('Input.PlaceHolder.PleaseSelect'),
        value: null,
      },
    ];

    let rsp = await lastValueFrom(this.authApiService.groupQuery());
    this.groupInfo = rsp.groupList;
    this._groupOptions = new Array();
    for (let group of this.groupInfo) {
      if (group.groupCode !== 'ALL') {
        this._groupOptions.push({
          label: group.groupName,
          value: group.groupName,
        });
      }
    }
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
