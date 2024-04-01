import { Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { SelectItem } from 'primeng/api';
import { lastValueFrom } from 'rxjs';
import { AuthApiService } from 'src/app/core/services/auth-api.service';

@Injectable({
  providedIn: 'root'
})
export class SoaControlSetupByUserService {
  private _groupOptions: SelectItem[];
  private _flagOptions: SelectItem[];
  private _flagOptionsWithDefault: SelectItem[];
  private _cvOptions: SelectItem[] = [
    { value: 'Customer', label: 'Customer' },
    { value: 'Vendor', label: 'Vendor' }
  ];

  private groupInfo: any;

  filteredOus; // auto-complete suggest;

  constructor(
    private authApiService: AuthApiService,
    private translateService: TranslateService
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

  /**
   * OU Autocomplete fun
   *
   * @param event
   */
  async filterOu(event) {
    let filtered: any[] = [];
    let query = event.query;

    let rsp = await lastValueFrom(this.authApiService.ouQueryByPrefix(query,'Y'));
    for (let ou of rsp.ouList) {
      filtered.push(ou);
    }

    this.filteredOus = filtered;
  }

  /**
   * OU Autocomplete fun
   *
   * @param event
   */
  async filterOuByGroup(event, groupName: string) {
    let filtered: any[] = [];
    let query = event.query;

    let rsp = await lastValueFrom(this.authApiService.ouQueryByPrefixAndGroup(query, groupName));
    for (let ou of rsp.ouList) {
      filtered.push(ou);
    }

    this.filteredOus = filtered;
  }

  getGroupCodeByGroupName(name: string) {
    return this.groupInfo.filter(item => item.groupName === name)[0].groupCode;
  }

  getRandomKey() {
    return window.crypto.getRandomValues(new Uint32Array(1))[0];
  }

  dateFormat(timeStamp: Date, showHMS: boolean = true) {
    let date = new Date(timeStamp);
    const dateFormat = `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`
    if (showHMS) { return dateFormat + ` ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}:${date.getSeconds().toString().padStart(2, '0')}` }
    else { return dateFormat };
  }

  /**
   * 初始化Group下拉選項
   *
   */
  private async initGroupOptions() {
    this._groupOptions = [{
      label: this.translateService.instant('Input.PlaceHolder.PleaseSelect'),
      value: null
    }];

    let rsp = await lastValueFrom(this.authApiService.groupQuery());
    this.groupInfo = rsp.groupList;
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
    this._flagOptions = this.translateService.instant('SoaControlSetup.Options.flagOptions');
  }

  private initFlagOptionsWithDefault() {
    this._flagOptionsWithDefault = this.translateService.instant('SoaControlSetup.Options.flagOptionsWithDefault');
  }
}
