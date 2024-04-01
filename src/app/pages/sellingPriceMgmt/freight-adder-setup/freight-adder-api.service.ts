import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { LanguageService } from 'src/app/core/services/language.service';
import { UserContextService } from 'src/app/core/services/user-context.service';
import { environment } from 'src/environments/environment';

const baseUrl = `${environment.apiUrl}/selling-price${environment.apiPathPrefix}`;

const APIM_AUTH_HEADER: HttpHeaders = new HttpHeaders({
  'Ocp-Apim-Subscription-Key': environment.apiKey,
});

@Injectable({
  providedIn: 'root'
})
export class FreightAdderApiService {

  constructor(
    private http: HttpClient,
    private userContextService: UserContextService,
    private languageService: LanguageService
  ) { }

  queryFreightAdder(model: any) {
    const url = `${baseUrl}/queryFreightAdder`;
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

  saveFreightAdder(model: any) {
    const url = `${baseUrl}/saveFreightAdder`;
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

  deleteFreightAdder(model: any) {
    const url = `${baseUrl}/deleteFreightAdder`;
    const userToken = this.userContextService.user$.getValue().userToken;
    const headerslocal = APIM_AUTH_HEADER
      .append('accept', 'application/json')
      .append('Content-Type', 'application/json')
      .append('userToken', userToken)
      .append('userLang', this.languageService.getLang())
      .append('userTimeZone', Intl.DateTimeFormat().resolvedOptions().timeZone)
 
    const response = this.http.delete(url, {
      headers: headerslocal,
      observe: 'events',
      body: model
    });
    return response;
  }

  updateFreightAdder(model: any) {
    const url = `${baseUrl}/updateFreightAdder`;
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
}
