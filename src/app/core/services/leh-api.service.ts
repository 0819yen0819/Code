import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { UserContextService } from './user-context.service';
import { environment } from '../../../environments/environment';

const APIM_AUTH_HEADER: HttpHeaders = new HttpHeaders({ 'Ocp-Apim-Subscription-Key': environment.apiKey });

@Injectable({
  providedIn: 'root'
})
export class LehApiService {

  constructor(
    private http: HttpClient,
    private userContextService: UserContextService,
  ) { }

  getLehHold(formNo: string): Observable<any> {
    const baseUrl = `${environment.apiUrl}/license-control${environment.apiPathPrefix}`;
    const tenant = this.userContextService.user$.getValue().tenant;
    const url = `${baseUrl}/license/getLicenseExceptionHold/${tenant}/${formNo}`;
    const userToken = this.userContextService.user$.getValue().userToken;
    const headerslocal = APIM_AUTH_HEADER
      .append('accept', 'application/json')
      .append('Content-Type', 'application/json')
      .append('userToken', userToken);

    return this.http.get(url, { headers: headerslocal });
  }

  getFormStatus(formNo: string,formTypeId?:string): Observable<any> {
    const baseUrl = `${environment.workflowApiUrl}${environment.apiPathPrefix}`;
    const url = `${baseUrl}/formLog/getFormLog/${formNo}?formTypeId=${formTypeId}`;
    const userToken = this.userContextService.user$.getValue().userToken;
    const headerslocal = APIM_AUTH_HEADER
      .append('accept', 'application/json')
      .append('Content-Type', 'application/json')
      .append('userToken', userToken);

    return this.http.get(url, { headers: headerslocal });
  }

  approvalLeh(model: any) {
    const baseUrl = `${environment.apiUrl}/license-control${environment.apiPathPrefix}`;
    const url = `${baseUrl}/license/approveLicenseExceptionHold`;
    const userToken = this.userContextService.user$.getValue().userToken;
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

  getFormType(formType: string) {
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
