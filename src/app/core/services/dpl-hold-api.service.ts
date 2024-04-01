import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpEventType, HttpParams } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { environment } from '../../../environments/environment';
import { UserContextService } from './user-context.service';
import { ToastService } from 'src/app/core/services/toast.service';
import { LanguageService } from './language.service';

const baseUrl = `${environment.apiUrl}/dpl-check${environment.apiPathPrefix}`;

const APIM_AUTH_HEADER: HttpHeaders = new HttpHeaders({ 'Ocp-Apim-Subscription-Key': environment.apiKey });

@Injectable({
  providedIn: 'root'
})
export class DplHoldApiService {

  constructor(
    private http: HttpClient,
    private userContextService: UserContextService,
    private languageService: LanguageService
  ) { }

  getDplHold(model: any): Observable<any> {
    const url = `${baseUrl}/dplHold/query/${model}`;
    const userToken = this.userContextService.user$.getValue().userToken;
    const headerslocal = APIM_AUTH_HEADER
      .append('accept', 'application/json')
      .append('Content-Type', 'application/json')
      .append('userToken', userToken);

    return this.http.get(url, { headers: headerslocal });
  }

  getSalesDepts(empCode: string, tenant: string): Observable<any> {
    const url = `${baseUrl}/dplHold/getSalesDepts/${empCode}/${tenant}`;
    console.log(url);
    const userToken = this.userContextService.user$.getValue().userToken;
    const headerslocal = APIM_AUTH_HEADER
      .append('accept', 'application/json')
      .append('Content-Type', 'application/json')
      .append('userToken', userToken);

    return this.http.get(url, { headers: headerslocal });
  }

  workflowAction(model: any): Observable<any> {
    const url = `${environment.apiUrl}/dpl-check${environment.apiPathPrefix}/dplHold/approveDplHold`;
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

  getDplHoldApprovingActions(formNo: string): Observable<any> {
    const url = `${baseUrl}/dplHold/getDplHoldApprovingActions/${formNo}`;
    const userToken = this.userContextService.user$.getValue().userToken;
    const headerslocal = APIM_AUTH_HEADER
      .append('accept', 'application/json')
      .append('Content-Type', 'application/json')
      .append('userToken', userToken);

    return this.http.get(url, { headers: headerslocal });
  }
  
}
