import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { environment } from '../../../environments/environment';
import { UserContextService } from './user-context.service';
import { LanguageService } from './language.service';

const baseUrl = `${environment.workflowApiUrl}${environment.apiPathPrefix}`;

const APIM_AUTH_HEADER: HttpHeaders = new HttpHeaders({
  'Ocp-Apim-Subscription-Key': environment.apiKey,
});

@Injectable({
  providedIn: 'root',
})
export class MyApplicationService {
  constructor(
    private http: HttpClient,
    private userContextService: UserContextService,
    private languageService: LanguageService
  ) {}

  getMyApplication(model: any): Observable<any> {
    const url = `${baseUrl}/myForm/getMyFormByConditions`;
    const userToken = this.userContextService.user$.getValue().userToken;
    const headerslocal = APIM_AUTH_HEADER.append('accept', 'application/json')
      .append('Content-Type', 'application/json')
      .append('userToken', userToken);
    console.log('model : ' + JSON.stringify(model));

    const response = this.http.post(url, model, { headers: headerslocal });
    return response;
  }

  getFormTypes(): Observable<any> {
    const url = `${baseUrl}/formLog/getAllTypes`;
    const userToken = this.userContextService.user$.getValue().userToken;
    const headerslocal = APIM_AUTH_HEADER.append('accept', 'application/json')
      .append('Content-Type', 'application/json')
      .append('userToken', userToken);

    return this.http.get(url, { headers: headerslocal });
  }

  downloadMyForm(model: any): Observable<any> {
    const url = `${baseUrl}/myForm/downloadMyFormByConditions`;
    const userToken = this.userContextService.user$.getValue().userToken;
    const headerslocal = APIM_AUTH_HEADER.append('accept', 'application/json')
      .append('Content-Type', 'application/json')
      .append('userToken', userToken);
    // console.log("url : " + url);
    console.log('model : ' + JSON.stringify(model));

    const response = this.http.post(url, model, { headers: headerslocal });
    return response;
  }

  getLazyMyApplication(model: any): Observable<any> {
    const url = `${baseUrl}/myForm/getLazyMyFormByConditions`;
    const userToken = this.userContextService.user$.getValue().userToken;
    const headerslocal = APIM_AUTH_HEADER.append('accept', 'application/json')
      .append('Content-Type', 'application/json')
      .append('userToken', userToken);
    const userLang = this.languageService.getLang();
    model.params.userLang = userLang;
    model.params.userTimeZone =
      Intl.DateTimeFormat().resolvedOptions().timeZone;
    const response = this.http.post(url, model, { headers: headerslocal });
    return response;
  }

  formFileQuery(model: any): Observable<any> {
    const url = `${baseUrl}/formLog/formFileQuery`;
    const userToken = this.userContextService.user$.getValue().userToken;
    const headerslocal = APIM_AUTH_HEADER.append('accept', 'application/json')
      .append('Content-Type', 'application/json')
      .append('userToken', userToken);
    const userLang = this.languageService.getLang();
    model.userLang = userLang;
    model.userTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    model.userCode = this.userContextService.user$.getValue().userCode;
    model.userEmail = this.userContextService.user$.getValue().userEmail;
    const response = this.http.post(url, model, { headers: headerslocal });
    return response;
  }

  deleteMyForm(model: any): Observable<any> {
    const url = `${baseUrl}/myForm/deleteMyForm/${model.formNo}`;
    const headerslocal = APIM_AUTH_HEADER.append(
      'accept',
      'application/json'
    ).append('Content-Type', 'application/json');

    return this.http.delete(url, { headers: headerslocal, observe: 'events' });
  }

  getAuthFormTypes(model: any): Observable<any> {
    const url = `${baseUrl}/permission/getPermissionListByUser`;
    const userToken = this.userContextService.user$.getValue().userToken;
    const headerslocal = APIM_AUTH_HEADER.append('accept', 'application/json')
      .append('Content-Type', 'application/json')
      .append('userToken', userToken);

    return this.http.post(url, model, { headers: headerslocal });
  }

  getLazyTrackFormLogByConditions(model: any): Observable<any> {
    const url = `${baseUrl}/myForm/getLazyTrackFormLogByConditions`;
    const userToken = this.userContextService.user$.getValue().userToken;
    const headerslocal = APIM_AUTH_HEADER.append('accept', 'application/json')
      .append('Content-Type', 'application/json')
      .append('userToken', userToken);
    model.tenant = this.userContextService.user$.getValue().tenant;
    const userLang = this.languageService.getLang();
    model.userLang = userLang;
    model.userTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    model.userCode = this.userContextService.user$.getValue().userCode;
    model.userEmail = this.userContextService.user$.getValue().userEmail;
    const response = this.http.post(url, model, { headers: headerslocal });
    return response;
  }

  checkPermissionApproveForm(model: any): Observable<any> {
    const url = `${baseUrl}/permission/checkPermissionApproveForm`;
    const userToken = this.userContextService.user$.getValue().userToken;
    const headerslocal = APIM_AUTH_HEADER.append('accept', 'application/json')
      .append('Content-Type', 'application/json')
      .append('userToken', userToken);

    return this.http.post(url, model, { headers: headerslocal });
  }

  downloadLazyTrackFormLogByConditions(model: any): Observable<any> {
    const url = `${baseUrl}/myForm/downloadLazyTrackFormLogByConditions`;
    const userToken = this.userContextService.user$.getValue().userToken;
    const headerslocal = APIM_AUTH_HEADER.append('accept', 'application/json')
      .append('Content-Type', 'application/json')
      .append('userToken', userToken);
    model.tenant = this.userContextService.user$.getValue().tenant;
    const userLang = this.languageService.getLang();
    model.userLang = userLang;
    model.userTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    model.userCode = this.userContextService.user$.getValue().userCode;
    model.userEmail = this.userContextService.user$.getValue().userEmail;

    const response = this.http.post(url, model, { headers: headerslocal });
    return response;
  }

  getFormTitleInfo(formType: string): Observable<any> {
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
}
