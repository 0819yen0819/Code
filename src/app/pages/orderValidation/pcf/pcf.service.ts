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
export class PcfService {

  constructor(
    private http: HttpClient,
    private userContextService: UserContextService,
    private languageService: LanguageService
  ) { }

  getFormTitle() {
    const baseUrl = `${environment.workflowApiUrl}${environment.apiPathPrefix}`;
    const url = `${baseUrl}/formLog/getFormType/SO-M-C_WorstPrice?tenant=${this.userContextService.user$.getValue().tenant}`;
    const userToken = this.userContextService.user$.getValue().userToken;
    const headerslocal = APIM_AUTH_HEADER
      .append('accept', 'application/json')
      .append('Content-Type', 'application/json')
      .append('userToken', userToken) 

    const response = this.http.get(url, {
      headers: headerslocal,
      observe: 'events',
    });
    return response;
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
      
  getPCForm(formNo:string) {
    const baseUrl = `${environment.apiUrl}/standard-order${environment.apiPathPrefix}`;
    const url = `${baseUrl}/Workflow/getPriceControlForm`;

    const userToken = this.userContextService.user$.getValue().userToken;
    const headerslocal = APIM_AUTH_HEADER
      .append('accept', 'application/json')
      .append('Content-Type', 'application/json')
      .append('userToken', userToken);

    const model = {
      tenant: this.userContextService.user$.getValue().tenant,
      formNo: formNo,
      userCode: this.userContextService.user$.getValue().userCode
    }
    
    return this.http.post(url, model, { headers: headerslocal, observe: 'events' });
  }

  
  approvePriceControlForm(model:any) {
    const baseUrl = `${environment.apiUrl}/standard-order${environment.apiPathPrefix}`;
    const url = `${baseUrl}/Workflow/approvePriceControlForm`;

    const userToken = this.userContextService.user$.getValue().userToken;
    const headerslocal = APIM_AUTH_HEADER
      .append('accept', 'application/json')
      .append('Content-Type', 'application/json')
      .append('userToken', userToken)
      .append('userLang', this.languageService.getLang());
    
    return this.http.post(url, model, { headers: headerslocal, observe: 'events' });
  }

  exportPriceControlForm(formNo:string) {
    const baseUrl = `${environment.apiUrl}/standard-order${environment.apiPathPrefix}`;
    const url = `${baseUrl}/Workflow/exportPriceControlForm`;

    const userToken = this.userContextService.user$.getValue().userToken;
    const headerslocal = APIM_AUTH_HEADER
      .append('accept', 'application/json')
      .append('Content-Type', 'application/json')
      .append('userToken', userToken); 

    const model = {
      tenant: this.userContextService.user$.getValue().tenant,
      formNo: formNo,
      userCode: this.userContextService.user$.getValue().userCode,
      userLang: this.languageService.getLang(),
      userTimeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
    }
    
    return this.http.post(url, model, { headers: headerslocal, observe: 'events' });
  }


  uploadPriceControlForm(formNo:string,file:any) {

    const tenant  = this.userContextService.user$.getValue().tenant;
    const userCode = this.userContextService.user$.getValue().userCode
    const lang = this.languageService.getLang();
    const baseUrl = `${environment.apiUrl}/standard-order${environment.apiPathPrefix}`;
    const url = `${baseUrl}/Workflow/uploadPriceControlForm?tenant=${tenant}&userLang=${lang}&formNo=${formNo}&userCode=${userCode}`;
    const userToken = this.userContextService.user$.getValue().userToken;

    const headersLocal = APIM_AUTH_HEADER
      .append('accept', 'application/json')
      .append('userToken', userToken)
      .append('userLang', lang)

    const formData = new FormData();
    formData.append('file', file);

    const response = this.http.post(url, formData, {
      headers: headersLocal,
      observe: 'events',
    });
    return response;
  }


}
