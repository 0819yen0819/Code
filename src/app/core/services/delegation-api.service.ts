import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

const baseUrl = `${environment.apiUrl}/auth${environment.apiPathPrefix}`;

const APIM_AUTH_HEADER: HttpHeaders = new HttpHeaders({
  'Ocp-Apim-Subscription-Key': environment.apiKey,
});

@Injectable({
  providedIn: 'root',
})
export class DelegationApiService {
  constructor(private http: HttpClient) {}

  getAgentInfos(model: any): Observable<any> {
    const url = `${baseUrl}/agentInfo/getAgent`;
    const headerslocal = APIM_AUTH_HEADER.append(
      'accept',
      'application/json'
    )
    .append('Content-Type', 'application/json')
    .append('userTimeZone', Intl.DateTimeFormat().resolvedOptions().timeZone);

    const body = JSON.stringify(model);
    console.log('model : ' + body);
    return this.http.post(url, body, {
      headers: headerslocal,
      observe: 'events',
    });
  }

  getAgentInfoDetail(agentInfoDetailId: any): Observable<any> {
    const url = `${baseUrl}/agentInfo/getAgentDetail/${agentInfoDetailId}`;
    const headerslocal = APIM_AUTH_HEADER.append(
      'accept',
      'application/json'
    ).append('Content-Type', 'application/json');
    console.log('agentInfoDetailId : ' + agentInfoDetailId);
    return this.http.get(url, { headers: headerslocal, observe: 'events' });
  }

  saveAgentInfos(model: any): Observable<any> {
    const url = `${baseUrl}/agentInfo/saveAgent`;
    const headerslocal = APIM_AUTH_HEADER.append(
      'accept',
      'application/json'
    ).append('Content-Type', 'application/json');

    const body = JSON.stringify(model);
    console.log('model : ' + body);
    return this.http.post(url, body, {
      headers: headerslocal,
      observe: 'events',
    });
  }
}
