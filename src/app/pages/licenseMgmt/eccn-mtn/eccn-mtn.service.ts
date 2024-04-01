import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { UserContextService } from 'src/app/core/services/user-context.service';
import { environment } from 'src/environments/environment';

const APIM_AUTH_HEADER: HttpHeaders = new HttpHeaders({ 'Ocp-Apim-Subscription-Key': environment.apiKey });

@Injectable({
  providedIn: 'root'
})
export class EccnMtnService {

  constructor(
    private http: HttpClient,
    private userContextService: UserContextService,
  ) { }

  getECCNlist(model: any) {
    const baseUrl = `${environment.apiUrl}/license-control${environment.apiPathPrefix}`;
    const url = `${baseUrl}/license/queryAreaEccnByPrefix`;
    const userToken = this.userContextService.user$.getValue().userToken;
    model.tenant = this.userContextService.user$.getValue().tenant;
    model.userTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    model.userLang = "Zh-TW";
    const headerslocal = APIM_AUTH_HEADER
      .append('accept', 'application/json')
      .append('Content-Type', 'application/json')
      .append('userToken', userToken);

    const response = this.http.post(url, model, {
      headers: headerslocal,
      observe: 'events',
    });
    return response;
  }

  saveAreaEccn(model: any) {
    const baseUrl = `${environment.apiUrl}/license-control${environment.apiPathPrefix}`;
    const url = `${baseUrl}/license/saveAreaEccn`;
    const userToken = this.userContextService.user$.getValue().userToken;

    model.tenant = this.userContextService.user$.getValue().tenant;
    model.createdBy = this.userContextService.user$.getValue().userEmail;

    const headerslocal = APIM_AUTH_HEADER
      .append('accept', 'application/json')
      .append('Content-Type', 'application/json')
      .append('userToken', userToken);

    const response = this.http.post(url, model, {
      headers: headerslocal,
      observe: 'events',
    });
    return response;
  }

  editAreaEccn(model: any) {
    const baseUrl = `${environment.apiUrl}/license-control${environment.apiPathPrefix}`;
    const url = `${baseUrl}/license/updateAreaEccn`;
    const userToken = this.userContextService.user$.getValue().userToken;

    model.tenant = this.userContextService.user$.getValue().tenant;
    model.createdBy = this.userContextService.user$.getValue().userEmail;

    const headerslocal = APIM_AUTH_HEADER
      .append('accept', 'application/json')
      .append('Content-Type', 'application/json')
      .append('userToken', userToken);

    const response = this.http.post(url, model, {
      headers: headerslocal,
      observe: 'events',
    });
    return response;
  }

  deleteAreaEccn(model: any) {
    const baseUrl = `${environment.apiUrl}/license-control${environment.apiPathPrefix}`;
    const url = `${baseUrl}/license/delAreaEccn`;
    const userToken = this.userContextService.user$.getValue().userToken;

    model.tenant = this.userContextService.user$.getValue().tenant;

    const headerslocal = APIM_AUTH_HEADER
      .append('accept', 'application/json')
      .append('Content-Type', 'application/json')
      .append('userToken', userToken);

    const response = this.http.post(url, model, {
      headers: headerslocal,
      observe: 'events',
    });
    return response;
  }
}
