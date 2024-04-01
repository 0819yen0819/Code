import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { environment } from '../../../environments/environment';
import { UserContextService } from './user-context.service';
import { LanguageService } from './language.service';

const baseUrl = `${environment.apiUrl}/selling-price${environment.apiPathPrefix}`;
// const baseUrl = `http://localhost:8085/selling-price-service/${environment.apiPathPrefix}`;

const APIM_AUTH_HEADER: HttpHeaders = new HttpHeaders({ 'Ocp-Apim-Subscription-Key': environment.apiKey });

@Injectable({
  providedIn: 'root'
})
export class SalesMarginToleranceApiService {

  constructor(
    private http: HttpClient,
    private userContextService: UserContextService,
    private languageService: LanguageService
  ) { }

  querySalesMargin(model: any): Observable<any> {
    const url = `${baseUrl}/sellingPrice/querySalesMarginTolerance`;
    const userToken = this.userContextService.user$.getValue().userToken;

    const headerslocal = APIM_AUTH_HEADER
      .append('accept', 'application/json')
      .append('Content-Type', 'application/json')
      .append('userToken', userToken)
      .append('userLang', this.languageService.getLang())
      .append('userTimeZone', Intl.DateTimeFormat().resolvedOptions().timeZone)

    model.userLang = this.languageService.getLang();
    console.log('qry obj:', model)

    return this.http.post(url, model, { headers: headerslocal });
  }

  saveSalesMargin(model: any): Observable<any> {
    const url = `${baseUrl}/sellingPrice/salesMarginTolerance`;
    const userToken = this.userContextService.user$.getValue().userToken;

    const headerslocal = APIM_AUTH_HEADER
      .append('accept', 'application/json')
      .append('Content-Type', 'application/json')
      .append('userToken', userToken)
      .append('userLang', this.languageService.getLang())
      .append('userTimeZone', Intl.DateTimeFormat().resolvedOptions().timeZone)

    const response = this.http.post(url, model, {
      headers: headerslocal,
      observe: 'events',
    });
    return response;
  }

  modifySalesMargin(model: any): Observable<any> {
    const url = `${baseUrl}/sellingPrice/salesMarginTolerance`;
    const userToken = this.userContextService.user$.getValue().userToken;

    const headerslocal = APIM_AUTH_HEADER
      .append('accept', 'application/json')
      .append('Content-Type', 'application/json')
      .append('userToken', userToken)
      .append('userLang', this.languageService.getLang())

    const response = this.http.patch(url, model, {
      headers: headerslocal,
      observe: 'events',
    });
    return response;
  }

  uploadSalesMargin(formData: FormData): Observable<any> {
    const tenant = this.userContextService.user$.getValue().tenant;
    const userEmail = this.userContextService.user$.getValue().userEmail;
    const url = `${baseUrl}/sellingPrice/uploadSalesMarginTolerance/${tenant}/${userEmail}`;
    const userLang = this.languageService.getLang();
    const userToken = this.userContextService.user$.getValue().userToken;

    const headerslocal = APIM_AUTH_HEADER.append('accept', 'application/json')
      .append('userToken', userToken)
      .append('userLang', userLang)
      .append('userTimeZone', Intl.DateTimeFormat().resolvedOptions().timeZone);

    return this.http.post(url, formData, { headers: headerslocal });

  }

  delSalesMargin(seq: any): Observable<any> {
    const tenant = this.userContextService.user$.getValue().tenant;
    const url = `${baseUrl}/sellingPrice/salesMarginTolerance`;
    const userToken = this.userContextService.user$.getValue().userToken;
    const headerslocal = APIM_AUTH_HEADER.append('accept', 'application/json')
      .append('Content-Type', 'application/json')
      .append('userToken', userToken);

    const response = this.http.delete(url, {
      headers: headerslocal,
      body: { seq, tenant }
    });
    return response;
  }

  downloadLazySalesMarginByConditions(model: any): Observable<any> {
    const url = `${baseUrl}/sellingPrice/downloadSalesMarginTolerance`;
    const userToken = this.userContextService.user$.getValue().userToken;
    const headerslocal = APIM_AUTH_HEADER.append('accept', 'application/json')
      .append('Content-Type', 'application/json')
      .append('userToken', userToken)
      .append('userTimeZone', Intl.DateTimeFormat().resolvedOptions().timeZone);
    model.tenant = this.userContextService.user$.getValue().tenant;
    model.userLang = this.languageService.getLang();
    model.userEmail = this.userContextService.user$.getValue().userEmail;
    // const response = this.http.post(url, model, { headers: headerslocal, observe: 'events' });
    const response = this.http.post(url, model, { headers: headerslocal });
    return response;
  }

}
