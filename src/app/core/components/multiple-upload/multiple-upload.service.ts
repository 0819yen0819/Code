import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { LanguageService } from '../../services/language.service';
import { UserContextService } from '../../services/user-context.service';
import { environment } from 'src/environments/environment';

const APIM_AUTH_HEADER: HttpHeaders = new HttpHeaders({ 'Ocp-Apim-Subscription-Key': environment.apiKey });

@Injectable({
  providedIn: 'root'
})
export class MultipleUploadService {

  constructor(
    private http: HttpClient,
    private userContextService: UserContextService,
    private languageService: LanguageService
  ) { }

  itemUpload(file: any, targetUrl: string) {
    const lang = this.languageService.getLang();
    const baseUrl = `${environment.apiUrl}/license-control${environment.apiPathPrefix}`;
    const url = `${baseUrl}${targetUrl}`;
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
