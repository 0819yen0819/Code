import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { LanguageService } from './language.service';
import { UserContextService } from './user-context.service';
import { environment } from '../../../environments/environment';
import { Observable } from 'rxjs';

const baseUrl = `${environment.apiUrl}/license-control${environment.apiPathPrefix}`;

const APIM_AUTH_HEADER: HttpHeaders = new HttpHeaders({ 'Ocp-Apim-Subscription-Key': environment.apiKey });

@Injectable({
  providedIn: 'root'
})
export class BafaLicenseMtnService {

  constructor(
    private http: HttpClient,
    private userContextService: UserContextService,
    private languageService: LanguageService
  ) { }

  queryBafaByConditions(model: any): Observable<any> {
    const url = `${baseUrl}/license/queryBafaByConditions`;
    const userToken = this.userContextService.user$.getValue().userToken;
    const userLang = this.languageService.getLang();
    const headerslocal = APIM_AUTH_HEADER
      .append('accept', 'application/json')
      .append('Content-Type', 'application/json')
      .append('userLang', userLang)
      .append('userToken', userToken);

    return this.http.post(url, model, { headers: headerslocal });
  }

  addBafaLicense(model: any): Observable<any> {
    const url = `${baseUrl}/license/addBafaLicense`;
    const userToken = this.userContextService.user$.getValue().userToken;
    const userLang = this.languageService.getLang();
    const headerslocal = APIM_AUTH_HEADER
      .append('accept', 'application/json')
      .append('Content-Type', 'application/json')
      .append('userLang', userLang)
      .append('userToken', userToken);

    return this.http.post(url, model, { headers: headerslocal });
  }

  updateBafaLicense(model: any): Observable<any> {
    const url = `${baseUrl}/license/updateBafaLicense`;
    const userToken = this.userContextService.user$.getValue().userToken;
    const userLang = this.languageService.getLang();
    const headerslocal = APIM_AUTH_HEADER
      .append('accept', 'application/json')
      .append('Content-Type', 'application/json')
      .append('userLang', userLang)
      .append('userToken', userToken);

    return this.http.post(url, model, { headers: headerslocal });
  }

  downloadBafaByConditions(model: any): Observable<any> {
    const url = `${baseUrl}/license/downloadBafaByConditions`;
    const userToken = this.userContextService.user$.getValue().userToken;
    const userLang = this.languageService.getLang();
    const headerslocal = APIM_AUTH_HEADER
      .append('accept', 'application/json')
      .append('Content-Type', 'application/json')
      .append('userLang', userLang)
      .append('userToken', userToken);

    return this.http.post(url, model, { headers: headerslocal });
  }

  queryBafaLicenseDetail(model: any): Observable<any> {
    const url = `${baseUrl}/license/queryBafaLicenseDetail`;
    const userToken = this.userContextService.user$.getValue().userToken;
    const userLang = this.languageService.getLang();
    const headerslocal = APIM_AUTH_HEADER
      .append('accept', 'application/json')
      .append('Content-Type', 'application/json')
      .append('userLang', userLang)
      .append('userToken', userToken)
      .append('userTimeZone', Intl.DateTimeFormat().resolvedOptions().timeZone)

    return this.http.post(url, model, { headers: headerslocal });
  }
}
