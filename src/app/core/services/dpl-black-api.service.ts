import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { UserContextService } from './user-context.service';
import { LanguageService } from './language.service';

const baseUrl = `${environment.apiUrl}/dpl-check${environment.apiPathPrefix}`;

const APIM_AUTH_HEADER: HttpHeaders = new HttpHeaders({ 'Ocp-Apim-Subscription-Key': environment.apiKey });

@Injectable({
  providedIn: 'root'
})
export class DplBlackApiService {

  constructor(
    private http: HttpClient,
    private userContextService: UserContextService,
    private languageService: LanguageService
  ) { }

  sampleOutLogSave(model: any): Observable<any> {
    const url = `${baseUrl}/dplBlack/sampleOutLogSave`;
    const userToken = this.userContextService.user$.getValue().userToken;
    const userLang = this.languageService.getLang();
    const headerslocal = APIM_AUTH_HEADER
      .append('accept', 'application/json')
      .append('Content-Type', 'application/json')
      .append('userLang', userLang)
      .append('userToken', userToken);

    return this.http.post(url, model, { headers: headerslocal });
  }

  sampleOutLogQuery(model: any): Observable<any> {
    const url = `${baseUrl}/dplBlack/sampleOutLogQuery`;
    const userToken = this.userContextService.user$.getValue().userToken;
    const userLang = this.languageService.getLang();
    const headerslocal = APIM_AUTH_HEADER
      .append('accept', 'application/json')
      .append('Content-Type', 'application/json')
      .append('userLang', userLang)
      .append('userToken', userToken);

    model.userLang = userLang;
    model.userTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    return this.http.post(url, model, { headers: headerslocal });
  }

  multiCheck(formData: FormData): Observable<any> {
    const url = `${baseUrl}/dplBlack/multiCheck/${this.userContextService.user$.getValue().tenant}/${this.userContextService.user$.getValue().userEmail}`;
    const userToken = this.userContextService.user$.getValue().userToken;
    const userLang = this.languageService.getLang();
    const headerslocal = APIM_AUTH_HEADER
      .append('userLang', userLang)
      .append('userToken', userToken);

    return this.http.post(url, formData, { headers: headerslocal });
  }

  dplResultQuery(model: any): Observable<any> {
    const url = `${baseUrl}/dplBlack/dplResultQuery`;
    const userToken = this.userContextService.user$.getValue().userToken;
    const userLang = this.languageService.getLang();
    const headerslocal = APIM_AUTH_HEADER
      .append('accept', 'application/json')
      .append('Content-Type', 'application/json')
      .append('userLang', userLang)
      .append('userToken', userToken);

    model.userLang = userLang;
    model.userTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    return this.http.post(url, model, { headers: headerslocal });
  }

  dplResultDetail(model: any): Observable<any> {
    const url = `${baseUrl}/dplBlack/dplResultDetail`;
    const userToken = this.userContextService.user$.getValue().userToken;
    const userLang = this.languageService.getLang();
    const headerslocal = APIM_AUTH_HEADER
      .append('accept', 'application/json')
      .append('Content-Type', 'application/json')
      .append('userLang', userLang)
      .append('userToken', userToken);

    model.userLang = userLang;
    model.userTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    return this.http.post(url, model, { headers: headerslocal });
  }

  dplBatchQuery(model: any): Observable<any> {
    const url = `${baseUrl}/dplBlack/dplBatchQuery`;
    const userToken = this.userContextService.user$.getValue().userToken;
    const userLang = this.languageService.getLang();
    const headerslocal = APIM_AUTH_HEADER
      .append('accept', 'application/json')
      .append('Content-Type', 'application/json')
      .append('userLang', userLang)
      .append('userToken', userToken);

    model.userLang = userLang;
    model.userTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    return this.http.post(url, model, { headers: headerslocal });
  }

  dplBatchDetail(model: any): Observable<any> {
    const url = `${baseUrl}/dplBlack/dplBatchDetail`;
    const userToken = this.userContextService.user$.getValue().userToken;
    const userLang = this.languageService.getLang();
    const headerslocal = APIM_AUTH_HEADER
      .append('accept', 'application/json')
      .append('Content-Type', 'application/json')
      .append('userLang', userLang)
      .append('userToken', userToken);

    model.userLang = userLang;
    model.userTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    return this.http.post(url, model, { headers: headerslocal });
  }

  blackMtnQuery(model: any): Observable<any> {
    const url = `${baseUrl}/dplBlack/blackMtnQuery`;
    const userToken = this.userContextService.user$.getValue().userToken;
    const userLang = this.languageService.getLang();
    const headerslocal = APIM_AUTH_HEADER
      .append('accept', 'application/json')
      .append('Content-Type', 'application/json')
      .append('userLang', userLang)
      .append('userToken', userToken);

    model.userLang = userLang;
    model.userTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    return this.http.post(url, model, { headers: headerslocal });
  }

  blackMtnView(model: any): Observable<any> {
    const url = `${baseUrl}/dplBlack/blackMtnView`;
    const userToken = this.userContextService.user$.getValue().userToken;
    const userLang = this.languageService.getLang();
    const headerslocal = APIM_AUTH_HEADER
      .append('accept', 'application/json')
      .append('Content-Type', 'application/json')
      .append('userLang', userLang)
      .append('userToken', userToken);

    return this.http.post(url, model, { headers: headerslocal });
  }

  blackMtnModify(model: any): Observable<any> {
    const url = `${baseUrl}/dplBlack/blackMtnModify`;
    const userToken = this.userContextService.user$.getValue().userToken;
    const userLang = this.languageService.getLang();
    const headerslocal = APIM_AUTH_HEADER
      .append('accept', 'application/json')
      .append('Content-Type', 'application/json')
      .append('userLang', userLang)
      .append('userToken', userToken);

    model.userLang = userLang;
    model.userTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    return this.http.post(url, model, { headers: headerslocal });
  }

  whiteListTempMtnQuery(model: any): Observable<any> {
    const url = `${baseUrl}/dplBlack/whiteListTempMtnQuery`;
    const userToken = this.userContextService.user$.getValue().userToken;
    const userLang = this.languageService.getLang();
    const headerslocal = APIM_AUTH_HEADER
      .append('accept', 'application/json')
      .append('Content-Type', 'application/json')
      .append('userLang', userLang)
      .append('userToken', userToken);

    model.userLang = userLang;
    model.userTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    return this.http.post(url, model, { headers: headerslocal });
  }

  whiteListTempMtnUpload(formData: FormData): Observable<any> {
    const url = `${baseUrl}/dplBlack/whiteListTempMtnUpload/${this.userContextService.user$.getValue().tenant}/${this.userContextService.user$.getValue().userEmail}`;
    const userToken = this.userContextService.user$.getValue().userToken;
    const userLang = this.languageService.getLang();
    const headerslocal = APIM_AUTH_HEADER
      .append('userLang', userLang)
      .append('userToken', userToken);

    return this.http.post(url, formData, { headers: headerslocal });
  }

  whiteListTempMtnModify(model: any): Observable<any> {
    const url = `${baseUrl}/dplBlack/whiteListTempMtnModify`;
    const userToken = this.userContextService.user$.getValue().userToken;
    const userLang = this.languageService.getLang();
    const headerslocal = APIM_AUTH_HEADER
      .append('accept', 'application/json')
      .append('Content-Type', 'application/json')
      .append('userLang', userLang)
      .append('userToken', userToken);

    return this.http.post(url, model, { headers: headerslocal });
  }

  whiteListMtnQuery(model: any): Observable<any> {
    const url = `${baseUrl}/dplBlack/whiteListMtnQuery`;
    const userToken = this.userContextService.user$.getValue().userToken;
    const userLang = this.languageService.getLang();
    const headerslocal = APIM_AUTH_HEADER
      .append('accept', 'application/json')
      .append('Content-Type', 'application/json')
      .append('userLang', userLang)
      .append('userToken', userToken);

    model.userLang = userLang;
    model.userTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    return this.http.post(url, model, { headers: headerslocal });
  }

  whiteListMtnModify(model: any): Observable<any> {
    const url = `${baseUrl}/dplBlack/whiteListMtnModify`;
    const userToken = this.userContextService.user$.getValue().userToken;
    const userLang = this.languageService.getLang();
    const headerslocal = APIM_AUTH_HEADER
      .append('accept', 'application/json')
      .append('Content-Type', 'application/json')
      .append('userLang', userLang)
      .append('userToken', userToken);

    return this.http.post(url, model, { headers: headerslocal });
  }

  nonEarItemMtnQuery(model: any): Observable<any> {
    const url = `${baseUrl}/dplBlack/nonEarItemMtnQuery`;
    const userToken = this.userContextService.user$.getValue().userToken;
    const userLang = this.languageService.getLang();
    const headerslocal = APIM_AUTH_HEADER
      .append('accept', 'application/json')
      .append('Content-Type', 'application/json')
      .append('userLang', userLang)
      .append('userToken', userToken);

    model.userLang = userLang;
    model.userTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    return this.http.post(url, model, { headers: headerslocal });
  }

  nonEarItemMtnView(model: any): Observable<any> {
    const url = `${baseUrl}/dplBlack/nonEarItemMtnView`;
    const userToken = this.userContextService.user$.getValue().userToken;
    const userLang = this.languageService.getLang();
    const headerslocal = APIM_AUTH_HEADER
      .append('accept', 'application/json')
      .append('Content-Type', 'application/json')
      .append('userLang', userLang)
      .append('userToken', userToken);

    return this.http.post(url, model, { headers: headerslocal });
  }

  nonEarItemMtnModify(model: any): Observable<any> {
    const url = `${baseUrl}/dplBlack/nonEarItemMtnModify`;
    const userToken = this.userContextService.user$.getValue().userToken;
    const userLang = this.languageService.getLang();
    const headerslocal = APIM_AUTH_HEADER
      .append('accept', 'application/json')
      .append('Content-Type', 'application/json')
      .append('userLang', userLang)
      .append('userToken', userToken);

    model.userLang = userLang;
    return this.http.post(url, model, { headers: headerslocal });
  }

  blackCustomerQueryByPrefix(custPrefix: string): Observable<any> {
    const tenant = this.userContextService.user$.getValue().tenant;
    const url = `${baseUrl}/dplBlack/blackCustomerQueryByPrefix/${tenant}/${custPrefix}`;
    const userToken = this.userContextService.user$.getValue().userToken;
    const userLang = this.languageService.getLang();
    const headerslocal = APIM_AUTH_HEADER
      .append('accept', 'application/json')
      .append('Content-Type', 'application/json')
      .append('userLang', userLang)
      .append('userToken', userToken);

    return this.http.get(url, { headers: headerslocal });
  }

  
  nonEarItemUpload(formData: FormData): Observable<any> {
    const url = `${baseUrl}/dplBlack/nonEarItemUpload/${this.userContextService.user$.getValue().tenant}/${this.userContextService.user$.getValue().userEmail}`;
    const userToken = this.userContextService.user$.getValue().userToken;
    const userLang = this.languageService.getLang();
    const headerslocal = APIM_AUTH_HEADER
      .append('userLang', userLang)
      .append('userToken', userToken)

    return this.http.post(url, formData, { headers: headerslocal });
  }

}
