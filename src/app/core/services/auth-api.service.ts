import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { OUGroupInfo } from '../model/ou-group';
import { UserInfo } from '../model/user-info';
import { UserContextService } from './user-context.service';

const baseUrl = `${environment.apiUrl}/auth${environment.apiPathPrefix}`;

const APIM_AUTH_HEADER: HttpHeaders = new HttpHeaders({
  'Ocp-Apim-Subscription-Key': environment.apiKey,
});

@Injectable({
  providedIn: 'root',
})
export class AuthApiService {
  constructor(
    private http: HttpClient,
    private userContextService: UserContextService
  ) { }

  getUserEmpDataByTenantAndCode(
    userTenant: string,
    userCode: string
  ): Observable<any> {
    const url = `${baseUrl}/emp/${userCode}/${userTenant}`;
    const headerslocal = APIM_AUTH_HEADER.append(
      'accept',
      'application/json'
    ).append('Content-Type', 'application/json');

    const response = this.http.get(url, {
      headers: headerslocal,
      observe: 'events',
    });
    return response;
  }

  getUserProfileByAdSubscriptionIdAndEmail(model: any): Observable<any> {
    const url = `${baseUrl}/getUserProfileByAdSubscriptionIdAndEmail/${model.userEmail}`;
    const headerslocal = APIM_AUTH_HEADER.append('accept', 'application/json')
      .append('Content-Type', 'application/json')
      .append('adSubscriptionId', model.adSubscriptionId);

    const response = this.http.get(url, {
      headers: headerslocal,
      observe: 'events',
    });
    return response;
  }

  getUserProfileByEmail(model: any): Observable<any> {
    const url = `${baseUrl}/getUserProfileByEmail/${model.userEmail}`;
    const headerslocal = APIM_AUTH_HEADER.append('accept', 'application/json')
      .append('Content-Type', 'application/json')
      .append('tenantId', model.tenantId);

    const response = this.http.get(url, {
      headers: headerslocal,
      observe: 'events',
    });
    return response;
  }

  getUserProfile(model: any): Observable<any> {
    const url = `${baseUrl}/user`;
    const userToken = this.userContextService.user$.getValue().userToken;
    const headerslocal = APIM_AUTH_HEADER.append('accept', 'application/json')
      .append('Content-Type', 'application/json')
      .append('userToken', userToken);

    const response = this.http.post(url, model, {
      headers: headerslocal,
      observe: 'events',
    });
    return response;
  }

  getUserMenuList(): Observable<any> {
    const url = `${baseUrl}/getUserMenuList`;
    const userToken = this.userContextService.user$.getValue().userToken;
    const headerslocal = APIM_AUTH_HEADER.append('accept', 'application/json')
      .append('Content-Type', 'application/json')
      .append('userToken', userToken);

    return this.http.get(url, { headers: headerslocal });
  }

  getUserMenuUrlPermissionList(userInfo: UserInfo): Observable<any> {
    const url = `${baseUrl}/permission/menuUrl`;

    const headerslocal = APIM_AUTH_HEADER.append('accept', 'application/json')
      .append('Content-Type', 'application/json')
      .append('userToken', userInfo.userToken);

    return this.http.get(url, { headers: headerslocal });
  }

  getAllEmpByTenant(tenant: string, empData: string): Observable<any> {
    const url = `${baseUrl}/getAllEmp/${tenant}/${empData}`;
    const userToken = this.userContextService.user$.getValue().userToken;
    const headerslocal = APIM_AUTH_HEADER.append('accept', 'application/json')
      .append('Content-Type', 'application/json')
      .append('userToken', userToken);

    return this.http.get(url, { headers: headerslocal, observe: 'events' });
  }

  getSupervisorUser(tenant: string, empCode: string): Observable<any> {
    const url = `${baseUrl}/getSupervisorUser/${tenant}/${empCode}`;
    const userToken = this.userContextService.user$.getValue().userToken;
    const headerslocal = APIM_AUTH_HEADER.append('accept', 'application/json')
      .append('Content-Type', 'application/json')
      .append('userToken', userToken);

    return this.http.get(url, { headers: headerslocal, observe: 'events' });
  }

  addUserProfileByEmail(model: any): Observable<any> {
    const url = `${baseUrl}/user/add`;
    const headerslocal = APIM_AUTH_HEADER.append('accept', 'application/json')
      .append('Content-Type', 'application/json')
      .append('adSubscriptionId', model.adSubscriptionId);

    const body = JSON.stringify(model);

    return this.http.post(url, body, {
      headers: headerslocal,
      observe: 'events',
    });
  }

  getAllTenants(): Observable<any> {
    const url = `${baseUrl}/tenant/query`;
    const headerslocal = APIM_AUTH_HEADER.append(
      'accept',
      'application/json'
    ).append('Content-Type', 'application/json');

    let model = {};
    const body = JSON.stringify(model);

    return this.http.post(url, body, {
      headers: headerslocal,
      observe: 'events',
    });
  }

  getAuthGroups(model: any): Observable<any> {
    const url = `${baseUrl}/authGroup/query`;
    const headerslocal = APIM_AUTH_HEADER.append(
      'accept',
      'application/json'
    ).append('Content-Type', 'application/json');

    const body = JSON.stringify(model);

    return this.http.post(url, body, {
      headers: headerslocal,
      observe: 'events',
    });
  }

  queryAuthGroupMembers(model: any): Observable<any> {
    const url = `${baseUrl}/authGroup/member/query`;
    const headerslocal = APIM_AUTH_HEADER.append(
      'accept',
      'application/json'
    ).append('Content-Type', 'application/json');

    const body = JSON.stringify(model);

    return this.http.post(url, body, {
      headers: headerslocal,
      observe: 'events',
    });
  }

  queryAvailableMembers(model: any): Observable<any> {
    const url = `${baseUrl}/authGroup/member/query/available`;
    const headerslocal = APIM_AUTH_HEADER.append(
      'accept',
      'application/json'
    ).append('Content-Type', 'application/json');

    const body = JSON.stringify(model);

    return this.http.post(url, body, {
      headers: headerslocal,
      observe: 'events',
    });
  }

  checkAuthGroupNameExists(model: any): Observable<any> {
    const url = `${baseUrl}/authGroup/existName`;
    const headerslocal = APIM_AUTH_HEADER.append(
      'accept',
      'application/json'
    ).append('Content-Type', 'application/json');

    const body = JSON.stringify(model);

    return this.http.post(url, body, {
      headers: headerslocal,
      observe: 'events',
    });
  }

  saveAuthGroupAndMembers(model: any): Observable<any> {
    const url = `${baseUrl}/authGroup/member/save`;
    const headerslocal = APIM_AUTH_HEADER.append(
      'accept',
      'application/json'
    ).append('Content-Type', 'application/json');

    const body = JSON.stringify(model);

    return this.http.post(url, body, {
      headers: headerslocal,
      observe: 'events',
    });
  }

  deleteAuthGroup(model: any): Observable<any> {
    const url = `${baseUrl}/authGroup/${model.authGroupId}`;
    const headerslocal = APIM_AUTH_HEADER.append(
      'accept',
      'application/json'
    ).append('Content-Type', 'application/json');

    return this.http.delete(url, { headers: headerslocal, observe: 'events' });
  }

  getRoles(model: any): Observable<any> {
    const url = `${baseUrl}/role/query`;
    const headerslocal = APIM_AUTH_HEADER.append(
      'accept',
      'application/json'
    ).append('Content-Type', 'application/json');

    const body = JSON.stringify(model);

    return this.http.post(url, body, {
      headers: headerslocal,
      observe: 'events',
    });
  }

  queryRoleAuthGroups(model: any): Observable<any> {
    const url = `${baseUrl}/role/authGroup/query`;
    const headerslocal = APIM_AUTH_HEADER.append(
      'accept',
      'application/json'
    ).append('Content-Type', 'application/json');

    const body = JSON.stringify(model);

    return this.http.post(url, body, {
      headers: headerslocal,
      observe: 'events',
    });
  }

  queryRoleAvailableGroups(model: any): Observable<any> {
    const url = `${baseUrl}/role/authGroup/query/available`;
    const headerslocal = APIM_AUTH_HEADER.append(
      'accept',
      'application/json'
    ).append('Content-Type', 'application/json');

    const body = JSON.stringify(model);

    return this.http.post(url, body, {
      headers: headerslocal,
      observe: 'events',
    });
  }

  queryRolePermissions(model: any): Observable<any> {
    const url = `${baseUrl}/role/permission/query`;
    const headerslocal = APIM_AUTH_HEADER.append(
      'accept',
      'application/json'
    ).append('Content-Type', 'application/json');

    const body = JSON.stringify(model);

    return this.http.post(url, body, {
      headers: headerslocal,
      observe: 'events',
    });
  }

  checkRoleNameExists(model: any): Observable<any> {
    const url = `${baseUrl}/role/existName`;
    const headerslocal = APIM_AUTH_HEADER.append(
      'accept',
      'application/json'
    ).append('Content-Type', 'application/json');

    const body = JSON.stringify(model);

    return this.http.post(url, body, {
      headers: headerslocal,
      observe: 'events',
    });
  }

  saveRole(model: any): Observable<any> {
    const url = `${baseUrl}/role/save`;
    const headerslocal = APIM_AUTH_HEADER.append(
      'accept',
      'application/json'
    ).append('Content-Type', 'application/json');

    const body = JSON.stringify(model);

    return this.http.post(url, body, {
      headers: headerslocal,
      observe: 'events',
    });
  }

  deleteRole(model: any): Observable<any> {
    const url = `${baseUrl}/role/${model.roleId}`;
    const headerslocal = APIM_AUTH_HEADER.append(
      'accept',
      'application/json'
    ).append('Content-Type', 'application/json');

    return this.http.delete(url, { headers: headerslocal, observe: 'events' });
  }

  ouQueryByPrefix(ouPrefix: string,enableSearchAllOU : string = 'N'): Observable<any> {
    const tenant = this.userContextService.user$.getValue().tenant;
    const url = `${baseUrl}/ouQueryByPrefix/${tenant}/${ouPrefix}?enableSearchAllOU=${enableSearchAllOU}`;
    const userToken = this.userContextService.user$.getValue().userToken;
    const headerslocal = APIM_AUTH_HEADER.append('accept', 'application/json')
      .append('Content-Type', 'application/json')
      .append('userToken', userToken);

    return this.http.get(url, { headers: headerslocal });
  }

  ouQueryByPrefixAndGroup(
    ouPrefix: string = null,
    groupName: string = null
  ): Observable<any> {
    const model = JSON.parse('{}');
    const tenant = this.userContextService.user$.getValue().tenant;
    const url = `${baseUrl}/ouQuery`;
    const userToken = this.userContextService.user$.getValue().userToken;
    const headerslocal = APIM_AUTH_HEADER.append('accept', 'application/json')
      .append('Content-Type', 'application/json')
      .append('userToken', userToken);

    model.tenant = tenant;
    model.groupName = groupName;
    model.ouPrefix = ouPrefix;

    return this.http.post(url, model, { headers: headerslocal });
  }

  groupQuery(): Observable<any> {
    const tenant = this.userContextService.user$.getValue().tenant;
    const url = `${baseUrl}/groupQuery/${tenant}`;
    const userToken = this.userContextService.user$.getValue().userToken;
    const headerslocal = APIM_AUTH_HEADER.append('accept', 'application/json')
      .append('Content-Type', 'application/json')
      .append('userToken', userToken);

    return this.http.get(url, { headers: headerslocal });
  }

  getAgentDeptByTenantAndEmpCode(
    tenant: string,
    empCode: string
  ): Observable<any> {
    const url = `${baseUrl}/dept/${tenant}/${empCode}`;
    const userToken = this.userContextService.user$.getValue().userToken;
    const headerslocal = APIM_AUTH_HEADER.append('accept', 'application/json')
      .append('Content-Type', 'application/json')
      .append('userToken', userToken);

    return this.http.get(url, { headers: headerslocal, observe: 'events' });
  }

  getOUInfoByOUGroup(groupCode: OUGroupInfo['groupCode']): Observable<any> {
    const tenant = this.userContextService.user$.getValue().tenant;
    const url = `${baseUrl}/groupOuQuery/${tenant}/${groupCode}`;
    const userToken = this.userContextService.user$.getValue().userToken;
    const headerslocal = APIM_AUTH_HEADER.append('accept', 'application/json')
      .append('Content-Type', 'application/json')
      .append('userToken', userToken);

    return this.http.get(url, { headers: headerslocal, observe: 'events' });
  }
    
  getTenantFormTypeList(): Observable<any> {
    const tenant = this.userContextService.user$.getValue().tenant;
    const url = `${baseUrl}/permission/getTenantFormTypeList/${tenant}`;
    const userToken = this.userContextService.user$.getValue().userToken;
    const headerslocal = APIM_AUTH_HEADER.append('accept', 'application/json')
      .append('Content-Type', 'application/json')
      .append('userToken', userToken);

    return this.http.get(url, { headers: headerslocal });
  }

  getUserGroupByEmail(): Observable<any> {
    const tenant = this.userContextService.user$.getValue().tenant;
    const email = this.userContextService.user$.getValue().userEmail;
    const url = `${baseUrl}/getUserGroupByEmail?tenant=${tenant}&email=${email}`;
    const userToken = this.userContextService.user$.getValue().userToken;
    const headerslocal = APIM_AUTH_HEADER.append('accept', 'application/json')
      .append('Content-Type', 'application/json')
      .append('userToken', userToken);

    return this.http.get(url, { headers: headerslocal });
  }

  getTenantByTenant(): Observable<any> {
    const tenant = this.userContextService.user$.getValue().tenant;
    const url = `${baseUrl}/tenent/${tenant}`;
    const userToken = this.userContextService.user$.getValue().userToken;
    const headerslocal = APIM_AUTH_HEADER.append('accept', 'application/json')
      .append('Content-Type', 'application/json')
      .append('userToken', userToken);

    return this.http.get(url, { headers: headerslocal });
  }

  getUserProfileByUserCode(tenantId:string,userCode): Observable<any> { 
    const url = `${baseUrl}/getUserProfileByUserCode/${userCode}`;
    const userToken = this.userContextService.user$.getValue().userToken;
    const headerslocal = APIM_AUTH_HEADER.append('accept', 'application/json')
      .append('Content-Type', 'application/json')
      .append('userToken', userToken)
      .append('tenantId',tenantId);

    return this.http.get(url, { headers: headerslocal });
  }

  
  getAgent(model:any): Observable<any> { 
    const url = `${baseUrl}/agentInfo/getAgent`;  
    const userToken = this.userContextService.user$.getValue().userToken;
    const headerslocal = APIM_AUTH_HEADER.append('accept', 'application/json')
      .append('Content-Type', 'application/json')
      .append('userToken', userToken)
      .append('userTimeZone', Intl.DateTimeFormat().resolvedOptions().timeZone)

    return this.http.post(url, model, { headers: headerslocal, observe: 'response' });
  }

  
  getEmpData(staffCode:string): Observable<any> {
    const url = `${baseUrl}/emp/${staffCode}/${this.userContextService.user$.getValue().tenant}`;
    const headerslocal = APIM_AUTH_HEADER.append(
      'accept',
      'application/json'
    ).append('Content-Type', 'application/json');

    return this.http.get(url, { headers: headerslocal });
  }
  
}
