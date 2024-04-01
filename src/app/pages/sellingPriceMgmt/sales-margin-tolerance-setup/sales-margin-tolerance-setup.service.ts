import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { UserContextService } from '../../../core/services/user-context.service';
import { LanguageService } from '../../../core/services/language.service';
import { lastValueFrom, Observable } from 'rxjs';
import { TranslateService } from '@ngx-translate/core';
import { AuthApiService } from 'src/app/core/services/auth-api.service';

@Injectable({
  providedIn: 'root'
})
export class SalesMarginToleranceSetupService {

  constructor(
    private http: HttpClient,
    private userContextService: UserContextService,
    private languageService: LanguageService,
    private translateService: TranslateService,
    private authApiService: AuthApiService,
  ) { }

  /**
    * 初始化Group下拉選項
    *
    */
  async initGroupOptions(needPls: boolean = true, needAll: boolean = true){
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
        value: group.groupName,
      });
    }
    if (!needAll) {
      groupOptions = groupOptions.filter(group => group.value !== 'ALL')
    }
    return groupOptions;
  }
}
