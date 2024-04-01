import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpEventType, HttpParams } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { environment } from '../../../environments/environment';
import { UserContextService } from './user-context.service';
import { LanguageService } from './language.service';

const baseUrl = `${environment.workflowApiUrl}${environment.apiPathPrefix}`;

const APIM_AUTH_HEADER: HttpHeaders = new HttpHeaders({ 'Ocp-Apim-Subscription-Key': environment.apiKey });

@Injectable({
  providedIn: 'root'
})
export class FormTypeApiService {

  constructor(
    private http: HttpClient,
    private userContextService: UserContextService,
    private languageService: LanguageService,
  ) { }

  getCategories(): Observable<any> {
    const url = `${baseUrl}/formType/getAllFormTypeCategories`;
    const userToken = this.userContextService.user$.getValue().userToken;
    const headerslocal = APIM_AUTH_HEADER
      .append('accept', 'application/json')
      .append('Content-Type', 'application/json')
      .append('userToken', userToken);

      return this.http.get(url, { headers: headerslocal });
  }

  getFormTypeCategories(): Observable<any> {
    const url = `${baseUrl}/formType/getFormTypeCategories`;
    const userToken = this.userContextService.user$.getValue().userToken;
    const headerslocal = APIM_AUTH_HEADER
      .append('accept', 'application/json')
      .append('Content-Type', 'application/json')
      .append('userToken', userToken);

      return this.http.get(url, { headers: headerslocal });
  }

  getFormTypes(model: any): Observable<any> {
    const url = `${baseUrl}/formType/getFormTypeByConditions`;
    const userToken = this.userContextService.user$.getValue().userToken;
    const headerslocal = APIM_AUTH_HEADER
      .append('accept', 'application/json')
      .append('Content-Type', 'application/json')
      .append('userToken', userToken);
    console.log("model : " + JSON.stringify(model));
    const body = JSON.stringify(model);

    const response = this.http.post(url, body, { headers: headerslocal, observe: 'events' });
    return response;
  }

  saveFormType(model: any): Observable<any> {
    const url = `${baseUrl}/formType/saveFormType`;
    const userToken = this.userContextService.user$.getValue().userToken;
    const userLang = this.languageService.getLang();
    const headerslocal = APIM_AUTH_HEADER
      .append('accept', 'application/json')
      .append('Content-Type', 'application/json')
      .append('userToken', userToken)
      .append('userLang', userLang);
      console.log("url : " + url);
    console.log("model : " + JSON.stringify(model));

    const response = this.http.post(url, model, { headers: headerslocal });
    return response;
  }
}
