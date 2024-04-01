import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { LanguageService } from 'src/app/core/services/language.service';
import { UserContextService } from 'src/app/core/services/user-context.service';
import { environment } from 'src/environments/environment';

const APIM_AUTH_HEADER: HttpHeaders = new HttpHeaders({ 'Ocp-Apim-Subscription-Key': environment.apiKey });
@Injectable({
  providedIn: 'root'
})
export class SocApiService {

  constructor(
    private http: HttpClient,
    private userContextService: UserContextService,
    private languageService : LanguageService
  ) { }
  
  getFormTitle() {
    const tenant = this.userContextService.user$.getValue().tenant;
    const baseUrl = `${environment.workflowApiUrl}${environment.apiPathPrefix}`;
    const url = `${baseUrl}/formLog/getFormType/SO-STD-CHG23?tenant=${tenant}`;
    const userToken = this.userContextService.user$.getValue().userToken;
    const headerslocal = APIM_AUTH_HEADER
      .append('accept', 'application/json')
      .append('Content-Type', 'application/json')
      .append('userToken', userToken);

    const response = this.http.get(url, {
      headers: headerslocal,
      observe: 'events',
    });
    return response;
  }

    
  getSoChgForm(formNo:string) {
    const baseUrl = `${environment.apiUrl}/standard-order${environment.apiPathPrefix}`;
    const url = `${baseUrl}/Workflow/getSoChgForm`;

    const userToken = this.userContextService.user$.getValue().userToken;
    const headerslocal = APIM_AUTH_HEADER
      .append('accept', 'application/json')
      .append('Content-Type', 'application/json')
      .append('userToken', userToken);

    const model = {
      "tenant": this.userContextService.user$.getValue().tenant,
      "formNo": formNo
    }
    
    return this.http.post(url, model, { headers: headerslocal, observe: 'events' });
  }

  approveSoChgForm(model:any) {
    const baseUrl = `${environment.apiUrl}/standard-order${environment.apiPathPrefix}`;
    const url = `${baseUrl}/Workflow/approveSoChgForm`;

    const userToken = this.userContextService.user$.getValue().userToken;
    const headerslocal = APIM_AUTH_HEADER
      .append('accept', 'application/json')
      .append('Content-Type', 'application/json')
      .append('userToken', userToken)
      .append('userLang', this.languageService.getLang());
    
    return this.http.post(url, model, { headers: headerslocal, observe: 'events' });
  }

  getFlowSetting(model:any) {
    const baseUrl = `${environment.apiUrl}/standard-order${environment.apiPathPrefix}`;
    const url = `${baseUrl}/Workflow/getFlowSetting`;

    const userToken = this.userContextService.user$.getValue().userToken;
    const headerslocal = APIM_AUTH_HEADER
      .append('accept', 'application/json')
      .append('Content-Type', 'application/json')
      .append('userToken', userToken); 
    
    return this.http.post(url, model, { headers: headerslocal, observe: 'events' });
  }
}
