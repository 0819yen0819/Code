import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { UserContextService } from './user-context.service';
import { environment } from '../../../environments/environment';
import { LanguageService } from './language.service';
import { OUGroupInfo } from '../model/ou-group';
import { Observable } from 'rxjs';

const APIM_AUTH_HEADER: HttpHeaders = new HttpHeaders({
  'Ocp-Apim-Subscription-Key': environment.apiKey,
});

@Injectable({
  providedIn: 'root',
})
export class SoaApiService {
  constructor(
    private http: HttpClient,
    private userContextService: UserContextService,
    private languageService: LanguageService
  ) {}

  getFormTitle(formType: string) {
    const tenant = this.userContextService.user$.getValue().tenant;
    const baseUrl = `${environment.workflowApiUrl}${environment.apiPathPrefix}`;
    const url = `${baseUrl}/formLog/getFormType/${formType}?tenant=${tenant}`;
    const userToken = this.userContextService.user$.getValue().userToken;
    const headerslocal = APIM_AUTH_HEADER.append('accept', 'application/json')
      .append('Content-Type', 'application/json')
      .append('userToken', userToken);

    const response = this.http.get(url, {
      headers: headerslocal,
      observe: 'events',
    });
    return response;
  }

  getSOA(formNo: string) {
    const baseUrl = `${environment.apiUrl}/license-control${environment.apiPathPrefix}`;
    const tenant = this.userContextService.user$.getValue().tenant;
    const url = `${baseUrl}/license/getSOAForm/${tenant}/${formNo}`;
    const userToken = this.userContextService.user$.getValue().userToken;
    const headerslocal = APIM_AUTH_HEADER.append('accept', 'application/json')
      .append('Content-Type', 'application/json')
      .append('userToken', userToken);

    const response = this.http.get(url, {
      headers: headerslocal,
      observe: 'events',
    });
    return response;
  }

  saveSOA(model: any) {
    const baseUrl = `${environment.apiUrl}/license-control${environment.apiPathPrefix}`;
    const url = `${baseUrl}/license/saveSOAForm`;
    const userToken = this.userContextService.user$.getValue().userToken;
    const headerslocal = APIM_AUTH_HEADER.append('accept', 'application/json')
      .append('Content-Type', 'application/json')
      .append('userToken', userToken);

    const response = this.http.post(url, model, {
      headers: headerslocal,
      observe: 'events',
    });
    return response;
  }

  approveSOA(model: any) {
    const baseUrl = `${environment.apiUrl}/license-control${environment.apiPathPrefix}`;
    const url = `${baseUrl}/license/approveSOAForm`;
    const userToken = this.userContextService.user$.getValue().userToken;
    const headerslocal = APIM_AUTH_HEADER.append('accept', 'application/json')
      .append('Content-Type', 'application/json')
      .append('userToken', userToken);

    const response = this.http.post(url, model, {
      headers: headerslocal,
      observe: 'events',
    });
    return response;
  }

  itemUploadSOA(file: any, formNo: string) {
    const lang = this.languageService.getLang();
    const tenant = this.userContextService.user$.getValue().tenant;
    const baseUrl = `${environment.apiUrl}/license-control${environment.apiPathPrefix}`;
    const url = `${baseUrl}/license/soaItemUpload/${tenant}/${formNo}`;
    const userToken = this.userContextService.user$.getValue().userToken;

    const headerslocal = APIM_AUTH_HEADER.append('accept', 'application/json')
      .append('userToken', userToken)
      .append('userLang', lang);

    const formData = new FormData();
    formData.append('file', file);

    const response = this.http.post(url, formData, {
      headers: headerslocal,
      observe: 'events',
    });
    return response;
  }

  querySoaCustomer(model: any) {
    const baseUrl = `${environment.apiUrl}/license-control${environment.apiPathPrefix}`;
    const url = `${baseUrl}/license/querySoaCustomer`;
    const userToken = this.userContextService.user$.getValue().userToken;

    const headerslocal = APIM_AUTH_HEADER.append('accept', 'application/json')
      .append('Content-Type', 'application/json')
      .append('userToken', userToken)
      .append('userLang', this.languageService.getLang())
      .append('userTimeZone', Intl.DateTimeFormat().resolvedOptions().timeZone);

    const response = this.http.post(url, model, {
      headers: headerslocal,
      observe: 'events',
    });
    return response;
  }

  querySoaItem(model: any) {
    const baseUrl = `${environment.apiUrl}/license-control${environment.apiPathPrefix}`;
    const url = `${baseUrl}/license/querySoaItem`;
    const userToken = this.userContextService.user$.getValue().userToken;

    const headerslocal = APIM_AUTH_HEADER.append('accept', 'application/json')
      .append('Content-Type', 'application/json')
      .append('userToken', userToken)
      .append('userLang', this.languageService.getLang())
      .append('userTimeZone', Intl.DateTimeFormat().resolvedOptions().timeZone);

    const response = this.http.post(url, model, {
      headers: headerslocal,
      observe: 'events',
    });
    return response;
  }

  saveSoaCustomer(model: any) {
    const baseUrl = `${environment.apiUrl}/license-control${environment.apiPathPrefix}`;
    const url = `${baseUrl}/license/saveSoaCustomer`;
    const userToken = this.userContextService.user$.getValue().userToken;

    const headerslocal = APIM_AUTH_HEADER.append('accept', 'application/json')
      .append('Content-Type', 'application/json')
      .append('userToken', userToken)
      .append('userLang', this.languageService.getLang());

    const response = this.http.post(url, model, {
      headers: headerslocal,
      observe: 'events',
    });
    return response;
  }

  saveSoaItem(model: any) {
    const baseUrl = `${environment.apiUrl}/license-control${environment.apiPathPrefix}`;
    const url = `${baseUrl}/license/saveSoaItem`;
    const userToken = this.userContextService.user$.getValue().userToken;

    const headerslocal = APIM_AUTH_HEADER.append('accept', 'application/json')
      .append('Content-Type', 'application/json')
      .append('userToken', userToken)
      .append('userLang', this.languageService.getLang());

    const response = this.http.post(url, model, {
      headers: headerslocal,
      observe: 'events',
    });
    return response;
  }

  updateSoaCustomer(model: any) {
    const baseUrl = `${environment.apiUrl}/license-control${environment.apiPathPrefix}`;
    const url = `${baseUrl}/license/updateSoaCustomer`;
    const userToken = this.userContextService.user$.getValue().userToken;
    const headerslocal = APIM_AUTH_HEADER.append('accept', 'application/json')
      .append('Content-Type', 'application/json')
      .append('userToken', userToken)
      .append('userLang', this.languageService.getLang());

    const response = this.http.post(url, model, {
      headers: headerslocal,
      observe: 'events',
    });
    return response;
  }

  updateSoaItem(model: any) {
    const baseUrl = `${environment.apiUrl}/license-control${environment.apiPathPrefix}`;
    const url = `${baseUrl}/license/updateSoaItem`;
    const userToken = this.userContextService.user$.getValue().userToken;
    const headerslocal = APIM_AUTH_HEADER.append('accept', 'application/json')
      .append('Content-Type', 'application/json')
      .append('userToken', userToken)
      .append('userLang', this.languageService.getLang());

    const response = this.http.post(url, model, {
      headers: headerslocal,
      observe: 'events',
    });
    return response;
  }

  delSoaCustomer(model: any) {
    const baseUrl = `${environment.apiUrl}/license-control${environment.apiPathPrefix}`;
    const url = `${baseUrl}/license/delSoaCustomer`;
    const userToken = this.userContextService.user$.getValue().userToken;
    const headerslocal = APIM_AUTH_HEADER.append('accept', 'application/json')
      .append('Content-Type', 'application/json')
      .append('userToken', userToken)
      .append('userLang', this.languageService.getLang());

    const response = this.http.delete(url, {
      headers: headerslocal,
      observe: 'events',
      body: model,
    });
    return response;
  }

  delSoaItem(model: any) {
    const baseUrl = `${environment.apiUrl}/license-control${environment.apiPathPrefix}`;
    const url = `${baseUrl}/license/delSoaItem`;
    const userToken = this.userContextService.user$.getValue().userToken;
    const headerslocal = APIM_AUTH_HEADER.append('accept', 'application/json')
      .append('Content-Type', 'application/json')
      .append('userToken', userToken)
      .append('userLang', this.languageService.getLang());

    const response = this.http.delete(url, {
      headers: headerslocal,
      observe: 'events',
      body: model,
    });
    return response;
  }

  getOuGroup(groupCode: OUGroupInfo['groupCode']): Observable<any> {
    const baseUrl = `${environment.apiUrl}/license-control${environment.apiPathPrefix}`;
    const tenant = this.userContextService.user$.getValue().tenant;
    const url = `${baseUrl}/license/getOuGroup`;
    const userToken = this.userContextService.user$.getValue().userToken;
    const headerslocal = APIM_AUTH_HEADER.append('accept', 'application/json')
      .append('Content-Type', 'application/json')
      .append('userToken', userToken);

    let queryParams = new HttpParams({
      fromObject: { tenant: tenant, groupCode: groupCode },
    });

    const response = this.http.get(url, {
      headers: headerslocal,
      params: queryParams,
    });

    return response;
  }

  querySoaNonControlItem(model: any) {
    const baseUrl = `${environment.apiUrl}/license-control${environment.apiPathPrefix}`;
    const url = `${baseUrl}/license/querySoaNonControl`;
    const userToken = this.userContextService.user$.getValue().userToken;

    const headerslocal = APIM_AUTH_HEADER.append('accept', 'application/json')
      .append('Content-Type', 'application/json')
      .append('userToken', userToken)
      .append('userLang', this.languageService.getLang())
      .append('userTimeZone', Intl.DateTimeFormat().resolvedOptions().timeZone);

    const response = this.http.post(url, model, {
      headers: headerslocal,
      observe: 'events',
    });
    return response;
  }

  saveSoaNonControlItem(model: any) {
    const baseUrl = `${environment.apiUrl}/license-control${environment.apiPathPrefix}`;
    const url = `${baseUrl}/license/saveSoaNonControl`;
    const userToken = this.userContextService.user$.getValue().userToken;

    const headerslocal = APIM_AUTH_HEADER.append('accept', 'application/json')
      .append('Content-Type', 'application/json')
      .append('userToken', userToken)
      .append('userLang', this.languageService.getLang());

    const response = this.http.post(url, model, {
      headers: headerslocal,
      observe: 'events',
    });
    return response;
  }

  updateSoaNonControlItem(model: any) {
    const baseUrl = `${environment.apiUrl}/license-control${environment.apiPathPrefix}`;
    const url = `${baseUrl}/license/updateSoaNonControl`;
    const userToken = this.userContextService.user$.getValue().userToken;
    const headerslocal = APIM_AUTH_HEADER.append('accept', 'application/json')
      .append('Content-Type', 'application/json')
      .append('userToken', userToken)
      .append('userLang', this.languageService.getLang());

    const response = this.http.post(url, model, {
      headers: headerslocal,
      observe: 'events',
    });
    return response;
  }

  delSoaNonControlItem(model: any) {
    const baseUrl = `${environment.apiUrl}/license-control${environment.apiPathPrefix}`;
    const url = `${baseUrl}/license/delSoaNonControl`;
    const userToken = this.userContextService.user$.getValue().userToken;
    const headerslocal = APIM_AUTH_HEADER.append('accept', 'application/json')
      .append('Content-Type', 'application/json')
      .append('userToken', userToken)
      .append('userLang', this.languageService.getLang());

    const response = this.http.delete(url, {
      headers: headerslocal,
      observe: 'events',
      body: model,
    });
    return response;
  }
}
