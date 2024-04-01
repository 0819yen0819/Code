import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { environment } from '../../../environments/environment';
import { UserContextService } from './user-context.service';

const baseUrl = `${environment.apiUrl}/dpl-check${environment.apiPathPrefix}`;

const APIM_AUTH_HEADER: HttpHeaders = new HttpHeaders({ 'Ocp-Apim-Subscription-Key': environment.apiKey });

@Injectable({
  providedIn: 'root'
})
export class DplCheckApiService {

  constructor(
    private http: HttpClient,
    private userContextService: UserContextService
  ) { }

  precisionOnline(model: any): Observable<any> {

    const url = `${baseUrl}/common/precisionOnline`;
    const userToken = this.userContextService.user$.getValue().userToken;
    const headerslocal = APIM_AUTH_HEADER
      .append('accept', 'application/json')
      .append('Content-Type', 'application/json')
      .append('userToken', userToken);

    // const response = this.http.post(url, model, { headers: headerslocal, observe: 'events' });
    return this.http.post(url, model, { headers: headerslocal });
  }

}
