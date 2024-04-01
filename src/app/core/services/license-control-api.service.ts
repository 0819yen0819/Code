import { HttpClient, HttpHeaders, HttpParams, HttpResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AUECCNLERules, ECCNLERules } from '../model/eccn-info';
import { LanguageService } from './language.service';
import { UserContextService } from './user-context.service';

const baseUrl = `${environment.apiUrl}/license-control${environment.apiPathPrefix}`;

const APIM_AUTH_HEADER: HttpHeaders = new HttpHeaders({
  'Ocp-Apim-Subscription-Key': environment.apiKey,
});

@Injectable({
  providedIn: 'root',
})
export class LicenseControlApiService {
  constructor(
    private http: HttpClient,
    private userContextService: UserContextService,
    private languageService: LanguageService
  ) { }

  eccnCheck(model: any): Observable<any> {
    const url = `${baseUrl}/common/eccnCheck`;
    const userToken = this.userContextService.user$.getValue().userToken;
    const headerslocal = APIM_AUTH_HEADER.append('accept', 'application/json')
      .append('Content-Type', 'application/json')
      .append('userToken', userToken);

    // const response = this.http.post(url, model, { headers: headerslocal, observe: 'events' });
    const response = this.http.post(url, model, { headers: headerslocal });
    return response;
  }

  getLazyLicenseMasterByConditions(model: any): Observable<any> {
    const url = `${baseUrl}/common/getLazyLicenseMasterByConditions`;
    const userToken = this.userContextService.user$.getValue().userToken;
    const headerslocal = APIM_AUTH_HEADER.append('accept', 'application/json')
      .append('Content-Type', 'application/json')
      .append('userToken', userToken);
    model.tenant = this.userContextService.user$.getValue().tenant;
    model.userCode = this.userContextService.user$.getValue().userCode;
    model.userEmail = this.userContextService.user$.getValue().userEmail;
    // const response = this.http.post(url, model, { headers: headerslocal, observe: 'events' });
    const response = this.http.post(url, model, { headers: headerslocal });
    return response;
  }

  licenseMasterImpView(model: any): Observable<any> {
    const url = `${baseUrl}/common/licenseMasterView`;
    const userToken = this.userContextService.user$.getValue().userToken;
    const headerslocal = APIM_AUTH_HEADER.append('accept', 'application/json')
      .append('Content-Type', 'application/json')
      .append('userToken', userToken);

    // const response = this.http.post(url, model, { headers: headerslocal, observe: 'events' });
    const response = this.http.post(url, model, { headers: headerslocal });
    return response;
  }

  licenseMasterImpModify(model: any): Observable<any> {
    const url = `${baseUrl}/common/licenseMasterImpModify`;
    const userToken = this.userContextService.user$.getValue().userToken;
    const headerslocal = APIM_AUTH_HEADER.append('accept', 'application/json')
      .append('Content-Type', 'application/json')
      .append('userToken', userToken);

    // const response = this.http.post(url, model, { headers: headerslocal, observe: 'events' });
    const response = this.http.post(url, model, { headers: headerslocal });
    return response;
  }

  licenseMasterImpDelete(seq: any): Observable<any> {
    const url = `${baseUrl}/common/licenseMasterDelete/${seq}`;
    const userToken = this.userContextService.user$.getValue().userToken;
    const headerslocal = APIM_AUTH_HEADER.append('accept', 'application/json')
      .append('Content-Type', 'application/json')
      .append('userToken', userToken);

    const response = this.http.delete(url, { headers: headerslocal });
    return response;
  }

  licenseMasterEUCModify(model: any): Observable<any> {
    const url = `${baseUrl}/common/licenseMasterEucModify`;
    const userToken = this.userContextService.user$.getValue().userToken;
    const headerslocal = APIM_AUTH_HEADER.append('accept', 'application/json')
      .append('Content-Type', 'application/json')
      .append('userToken', userToken);

    const response = this.http.post(url, model, { headers: headerslocal });
    return response;
  }

  licenseMasterDelete(seq: any): Observable<any> {
    const url = `${baseUrl}/common/licenseMasterDelete/${seq}`;
    const userToken = this.userContextService.user$.getValue().userToken;
    const headerslocal = APIM_AUTH_HEADER.append('accept', 'application/json')
      .append('Content-Type', 'application/json')
      .append('userToken', userToken);

    const response = this.http.delete(url, { headers: headerslocal });
    return response;
  }

  licenseMasterSoaModify(model: any): Observable<any> {
    const url = `${baseUrl}/common/licenseMasterSoaModify`;
    const userToken = this.userContextService.user$.getValue().userToken;
    const headerslocal = APIM_AUTH_HEADER.append('accept', 'application/json')
      .append('Content-Type', 'application/json')
      .append('userToken', userToken);

    const response = this.http.post(url, model, { headers: headerslocal });
    return response;
  }

  licenseRule(tenant: string): Observable<any> {
    const url = `${baseUrl}/common/licenseRule/${tenant}`;
    const userToken = this.userContextService.user$.getValue().userToken;
    const headerslocal = APIM_AUTH_HEADER.append('accept', 'application/json')
      .append('Content-Type', 'application/json')
      .append('userToken', userToken);

    const response = this.http.get(url, { headers: headerslocal });
    return response;
  }

  getTargetECCNLERuleList(req: {
    action: string;
    eccn?: ECCNLERules['eccn'];
    flag?: ECCNLERules['flag'];
  }): Observable<any> {
    const tenant = this.userContextService.user$.getValue().tenant;
    const userLang = this.languageService.getLang();
    const url = `${baseUrl}/license/getLicenseExceptionRule`;
    const userToken = this.userContextService.user$.getValue().userToken;
    const headerslocal = APIM_AUTH_HEADER.append('accept', 'application/json')
      .append('Content-Type', 'application/json')
      .append('userToken', userToken);

    const model = {
      tenant: tenant,
      userLang: userLang,
      userTimeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      ...req,
    };

    const response = this.http.post(url, model, { headers: headerslocal });
    return response;
  }

  getMultiItemListByFile(formNo: string, file: File): Observable<any> {
    const tenant = this.userContextService.user$.getValue().tenant;
    const url = `${baseUrl}/license/eucLicenseListUpload/${tenant}/${formNo}`;
    const userLang = this.languageService.getLang();
    const userToken = this.userContextService.user$.getValue().userToken;

    const headerslocal = APIM_AUTH_HEADER.append('accept', 'application/json')
      .append('userToken', userToken)
      .append('userLang', userLang);

    const formData = new FormData();
    formData.append('file', file);

    const response = this.http.post(url, formData, { headers: headerslocal });
    return response;
  }

  getItemEccn(model: any): Observable<any> {
    const url = `${baseUrl}/common/getItemEccn`;
    const userToken = this.userContextService.user$.getValue().userToken;
    const headerslocal = APIM_AUTH_HEADER.append('accept', 'application/json')
      .append('Content-Type', 'application/json')
      .append('userToken', userToken);

    const response = this.http.post(url, model, { headers: headerslocal });
    return response;
  }

  auECCNLERule(req: AUECCNLERules) {
    const tenant = this.userContextService.user$.getValue().tenant;
    const email = this.userContextService.user$.getValue().userEmail;
    const url = `${baseUrl}/license/saveLicenseExceptionRule`;
    const userToken = this.userContextService.user$.getValue().userToken;
    const headerslocal = APIM_AUTH_HEADER.append('accept', 'application/json')
      .append('Content-Type', 'application/json')
      .append('userToken', userToken)
      .append('userLang', this.languageService.getLang());

    let model = {};

    if (req.saveType == 'I') {
      model = {
        tenant: tenant,
        createdBy: email,
        ...req,
      };
    } else {
      model = {
        tenant: tenant,
        lastUpdatedBy: email,
        ...req,
      };
    }

    const response = this.http.post(url, model, { headers: headerslocal });
    return response;
  }

  getTargetEUCInfo(formNo: string): Observable<any> {
    const tenant = this.userContextService.user$.getValue().tenant;
    const url = `${baseUrl}/license/queryEUC/${tenant}/${formNo}`;
    const userToken = this.userContextService.user$.getValue().userToken;
    const headerslocal = APIM_AUTH_HEADER.append('accept', 'application/json')
      .append('Content-Type', 'application/json')
      .append('userToken', userToken);

    const response = this.http.get(url, { headers: headerslocal });
    return response;
  }

  postSaveEUC(model): Observable<any> {
    const url = `${baseUrl}/license/saveEUC`;
    const userToken = this.userContextService.user$.getValue().userToken;
    const headerslocal = APIM_AUTH_HEADER.append('accept', 'application/json')
      .append('Content-Type', 'application/json')
      .append('userToken', userToken);

    model.header['userCode'] =
      this.userContextService.user$.getValue().userCode;
    model.header['userName'] =
      this.userContextService.user$.getValue().userName;

    const response = this.http.post(url, model, { headers: headerslocal });
    return response;
  }

  postApproveEUC(model): Observable<any> {
    const url = `${baseUrl}/license/approveEUC`;
    const userToken = this.userContextService.user$.getValue().userToken;
    const headerslocal = APIM_AUTH_HEADER.append('accept', 'application/json')
      .append('Content-Type', 'application/json')
      .append('userToken', userToken);

    const response = this.http.post(url, model, { headers: headerslocal });
    return response;
  }

  getTargetLicenseInfo(formNo: string): Observable<any> {
    const tenant = this.userContextService.user$.getValue().tenant;
    const url = `${baseUrl}/license/queryLicenseForm/${tenant}/${formNo}`;
    const userToken = this.userContextService.user$.getValue().userToken;
    const headerslocal = APIM_AUTH_HEADER.append('accept', 'application/json')
      .append('Content-Type', 'application/json')
      .append('userToken', userToken);

    const response = this.http.get(url, { headers: headerslocal });
    return response;
  }

  postSaveLicense(model): Observable<any> {
    const url = `${baseUrl}/license/saveLicenseForm`;
    const userToken = this.userContextService.user$.getValue().userToken;
    const headerslocal = APIM_AUTH_HEADER.append('accept', 'application/json')
      .append('Content-Type', 'application/json')
      .append('userToken', userToken);

    const response = this.http.post(url, model, { headers: headerslocal });
    return response;
  }

  postApproveLicense(model): Observable<any> {
    const url = `${baseUrl}/license/approveLicenseForm`;
    const userToken = this.userContextService.user$.getValue().userToken;
    const headerslocal = APIM_AUTH_HEADER.append('accept', 'application/json')
      .append('Content-Type', 'application/json')
      .append('userToken', userToken);

    const response = this.http.post(url, model, { headers: headerslocal });
    return response;
  }

  shipFromAddressQueryByPrefix(model: any): Observable<any> {
    const url = `${baseUrl}/license/shipFromAddressQueryByPrefix`;
    const userToken = this.userContextService.user$.getValue().userToken;
    const headerslocal = APIM_AUTH_HEADER.append('accept', 'application/json')
      .append('Content-Type', 'application/json')
      .append('userToken', userToken);

    return this.http.post(url, model, { headers: headerslocal });
  }

  querySpecialImportLicense(model: any): Observable<any> {
    const url = `${baseUrl}/license/querySpecialImportLicense`;
    const userToken = this.userContextService.user$.getValue().userToken;
    const headerslocal = APIM_AUTH_HEADER.append('accept', 'application/json')
      .append('Content-Type', 'application/json')
      .append('userToken', userToken);

    return this.http.post(url, model, { headers: headerslocal });
  }

  licenseHistory(licenseNo: string): Observable<any> {
    const url = `${baseUrl}/common/licenseHistory/${licenseNo}`;
    const userToken = this.userContextService.user$.getValue().userToken;
    const headerslocal = APIM_AUTH_HEADER.append('accept', 'application/json')
      .append('Content-Type', 'application/json')
      .append('userToken', userToken);

    const response = this.http.get(url, { headers: headerslocal });
    return response;
  }

  getECCNList(): Observable<any> {
    const tenant = this.userContextService.user$.getValue().tenant;
    const url = `${baseUrl}/license/getEccnList/${tenant}`;
    const userToken = this.userContextService.user$.getValue().userToken;
    const headerslocal = APIM_AUTH_HEADER.append('accept', 'application/json')
      .append('Content-Type', 'application/json')
      .append('userToken', userToken);

    const response = this.http.get(url, { headers: headerslocal });
    return response;
  }

  getTargetBAFAInfo(ieType: string, productCode: string): Observable<any> {
    const tenant = this.userContextService.user$.getValue().tenant;
    const url = `${baseUrl}/license/queryBAFALicense`;
    const userToken = this.userContextService.user$.getValue().userToken;
    const headerslocal = APIM_AUTH_HEADER.append('accept', 'application/json')
      .append('Content-Type', 'application/json')
      .append('userToken', userToken);

    let queryParams = new HttpParams({
      fromObject: { tenant: tenant, ieType: ieType, productCode: productCode },
    });

    const response = this.http.get(url, {
      headers: headerslocal,
      params: queryParams,
    });
    return response;
  }

  downloadLazyLicenseMasterByConditions(model: any): Observable<any> {
    const url = `${baseUrl}/common/downloadLazyLicenseMasterByConditions`;
    const userToken = this.userContextService.user$.getValue().userToken;
    const headerslocal = APIM_AUTH_HEADER.append('accept', 'application/json')
      .append('Content-Type', 'application/json')
      .append('userToken', userToken);
    model.tenant = this.userContextService.user$.getValue().tenant;
    model.userCode = this.userContextService.user$.getValue().userCode;
    model.userEmail = this.userContextService.user$.getValue().userEmail;
    model.userLang = this.languageService.getLang();
    // const response = this.http.post(url, model, { headers: headerslocal, observe: 'events' });
    const response = this.http.post(url, model, { headers: headerslocal });
    return response;
  }

  getConsigneeByOuCode(ouCode: string): Observable<any> {
    const tenant = this.userContextService.user$.getValue().tenant;
    const url = `${baseUrl}/license/queryConsigneeByOuCode/${tenant}/${ouCode}`;
    const userToken = this.userContextService.user$.getValue().userToken;
    const headerslocal = APIM_AUTH_HEADER.append('accept', 'application/json')
      .append('Content-Type', 'application/json')
      .append('userToken', userToken);

    const response = this.http.get(url, { headers: headerslocal });
    return response;
  }

  queryLicenseHistory(model: any): Observable<any> {
    const url = `${baseUrl}/common/queryLicenseHistory`;
    const userToken = this.userContextService.user$.getValue().userToken;
    const headerslocal = APIM_AUTH_HEADER.append('accept', 'application/json')
      .append('Content-Type', 'application/json')
      .append('userToken', userToken);

    const response = this.http.post(url, model, { headers: headerslocal });
    return response;
  }

  queryImportLicenseDataByFormNo(model: any): Observable<any> {
    const url = `${baseUrl}/license/queryImportLicenseDataByFormNo`;
    const userToken = this.userContextService.user$.getValue().userToken;
    const tenant = this.userContextService.user$.getValue().tenant;

    const headerslocal = APIM_AUTH_HEADER.append('accept', 'application/json')
      .append('Content-Type', 'application/json')
      .append('userToken', userToken);

    model = {
      ...model,
      ...{ tenant: tenant },
    };
    const response = this.http.post(url, model, { headers: headerslocal });
    return response;
  }

  //> for save apply/draft sc047/054 form
  postSaveSCLicense(model): Observable<any> {
    const url = `${baseUrl}/license/saveScLicenseForm`;
    const userToken = this.userContextService.user$.getValue().userToken;
    const headerslocal = APIM_AUTH_HEADER.append('accept', 'application/json')
      .append('Content-Type', 'application/json')
      .append('userToken', userToken);

    const response = this.http.post(url, model, { headers: headerslocal });
    return response;
  }

  //> for get target sc047/054 form info
  getTargetSCLicenseInfo(formNo: string): Observable<any> {
    const tenant = this.userContextService.user$.getValue().tenant;
    const url = `${baseUrl}/license/queryScLicenseForm/${tenant}/${formNo}`;
    const userToken = this.userContextService.user$.getValue().userToken;
    const headerslocal = APIM_AUTH_HEADER.append('accept', 'application/json')
      .append('Content-Type', 'application/json')
      .append('userToken', userToken);

    const response = this.http.get(url, { headers: headerslocal });
    return response;
  }

  postApproveSCLicense(model): Observable<any> {
    const url = `${baseUrl}/license/approveScLicenseForm`;
    const userToken = this.userContextService.user$.getValue().userToken;
    const headerslocal = APIM_AUTH_HEADER.append('accept', 'application/json')
      .append('Content-Type', 'application/json')
      .append('userToken', userToken);

    const response = this.http.post(url, model, { headers: headerslocal });
    return response;
  }

  getIMPMultiItemListByFile(formNo: string, file: File): Observable<any> {
    const tenant = this.userContextService.user$.getValue().tenant;
    const url = `${baseUrl}/license/importLicenseItemUpload/${tenant}/${formNo}`;
    const userLang = this.languageService.getLang();
    const userToken = this.userContextService.user$.getValue().userToken;

    const headerslocal = APIM_AUTH_HEADER.append('accept', 'application/json')
      .append('userToken', userToken)
      .append('userLang', userLang);

    const formData = new FormData();
    formData.append('file', file);

    const response = this.http.post(url, formData, { headers: headerslocal });
    return response;
  }

  getEXPMultiItemListByFile(formNo: string, file: File): Observable<any> {
    const tenant = this.userContextService.user$.getValue().tenant;
    const url = `${baseUrl}/license/exportLicenseItemUpload/${tenant}/${formNo}`;
    const userLang = this.languageService.getLang();
    const userToken = this.userContextService.user$.getValue().userToken;

    const headerslocal = APIM_AUTH_HEADER.append('accept', 'application/json')
      .append('userToken', userToken)
      .append('userLang', userLang);

    const formData = new FormData();
    formData.append('file', file);

    const response = this.http.post(url, formData, { headers: headerslocal });
    return response;
  }

  getICPCheckRules(): Observable<any> {
    const tenant = this.userContextService.user$.getValue().tenant;
    const url = `${baseUrl}/license/getICPCheck/${tenant}`;
    const userToken = this.userContextService.user$.getValue().userToken;
    const headerslocal = APIM_AUTH_HEADER.append('accept', 'application/json')
      .append('Content-Type', 'application/json')
      .append('userToken', userToken);

    const response = this.http.get(url, { headers: headerslocal });
    return response;
  }

  getTargetICPForm(formNo: string): Observable<any> {
    const tenant = this.userContextService.user$.getValue().tenant;
    const url = `${baseUrl}/license/getICPForm`;
    const userToken = this.userContextService.user$.getValue().userToken;
    const headerslocal = APIM_AUTH_HEADER.append('accept', 'application/json')
      .append('Content-Type', 'application/json')
      .append('userToken', userToken);
    const model = {
      tenant: tenant,
      formNo: formNo,
    };

    const response = this.http.post(url, model, { headers: headerslocal });
    return response;
  }

  postSaveICPForm(model): Observable<any> {
    const url = `${baseUrl}/license/saveICPForm`;
    const userToken = this.userContextService.user$.getValue().userToken;
    const headerslocal = APIM_AUTH_HEADER.append('accept', 'application/json')
      .append('Content-Type', 'application/json')
      .append('userToken', userToken);

    const response = this.http.post(url, model, { headers: headerslocal });
    return response;
  }

  postApproveICPForm(model): Observable<any> {
    const url = `${baseUrl}/license/approveICPForm`;
    const userToken = this.userContextService.user$.getValue().userToken;
    const headerslocal = APIM_AUTH_HEADER.append('accept', 'application/json')
      .append('Content-Type', 'application/json')
      .append('userToken', userToken);

    const response = this.http.post(url, model, { headers: headerslocal });
    return response;
  }

  getTargetECCNList(req: {
    action: string;
    eccn?: ECCNLERules['eccn'];
    activeFlag?: ECCNLERules['flag'];
  }): Observable<any> {
    const tenant = this.userContextService.user$.getValue().tenant;
    const userLang = this.languageService.getLang();
    const url = `${baseUrl}/license/queryAllEccnByPrefix`;
    const userToken = this.userContextService.user$.getValue().userToken;
    const headerslocal = APIM_AUTH_HEADER.append('accept', 'application/json')
      .append('Content-Type', 'application/json')
      .append('userToken', userToken)
      .append('userLang', userLang)
      .append('userTimeZone', Intl.DateTimeFormat().resolvedOptions().timeZone);

    const model = {
      tenant: tenant,
      ...req,
    };

    const response = this.http.post(url, model, { headers: headerslocal });
    return response;
  }

  addECCNListByFile(file: File): Observable<any> {
    const tenant = this.userContextService.user$.getValue().tenant;
    const userEmail = this.userContextService.user$.getValue().userEmail;
    const url = `${baseUrl}/license/uploadEccn/${tenant}/${userEmail}`;
    const userLang = this.languageService.getLang();
    const userToken = this.userContextService.user$.getValue().userToken;

    const headerslocal = APIM_AUTH_HEADER.append('accept', 'application/json')
      .append('userToken', userToken)
      .append('userLang', userLang);

    const formData = new FormData();
    formData.append('file', file);

    const response = this.http.post(url, formData, { headers: headerslocal });
    return response;
  }

  addECCNStatus(eccn: string): Observable<any> {
    const tenant = this.userContextService.user$.getValue().tenant;
    const userEmail = this.userContextService.user$.getValue().userEmail;
    const url = `${baseUrl}/license/saveEccn`;
    const userLang = this.languageService.getLang();
    const userToken = this.userContextService.user$.getValue().userToken;

    const headerslocal = APIM_AUTH_HEADER.append('accept', 'application/json')
      .append('userToken', userToken)
      .append('userLang', userLang);

    const model = {
      tenant: tenant,
      eccn: eccn,
      createdBy: userEmail,
    };

    const response = this.http.post(url, model, { headers: headerslocal });
    return response;
  }

  updateECCNStatus(activeFlag: string, eccnList: string[]): Observable<any> {
    const tenant = this.userContextService.user$.getValue().tenant;
    const userEmail = this.userContextService.user$.getValue().userEmail;
    const url = `${baseUrl}/license/updateEccn`;
    const userLang = this.languageService.getLang();
    const userToken = this.userContextService.user$.getValue().userToken;

    const headerslocal = APIM_AUTH_HEADER.append('accept', 'application/json')
      .append('userToken', userToken)
      .append('userLang', userLang);

    const model = {
      tenant: tenant,
      activeFlag: activeFlag,
      updatedBy: userEmail,
      eccnList: eccnList,
    };

    const response = this.http.post(url, model, { headers: headerslocal });
    return response;
  }

  getEXPDOListFromERP(
    apiParams: { key: string; url: string },
    model: {
      address: string;
      orgId: string;
      targetNo: string;
      trxNo: string;
      vctype: string;
    }
  ): Observable<any> {
    const ERP_AUTH_HEADER: HttpHeaders = new HttpHeaders({
      'Ocp-Apim-Subscription-Key': apiParams.key,
    });

    const headerslocal = ERP_AUTH_HEADER.append('accept', 'application/json');

    const response = this.http.post(apiParams.url, model, {
      headers: headerslocal,
    });
    return response;
  }

  deleteLicenseMasterBySeq(seq: any): Observable<any> {
    const url = `${baseUrl}/common/licenseMasterDelete/${seq}`;
    const userToken = this.userContextService.user$.getValue().userToken;
    const headerslocal = APIM_AUTH_HEADER.append('accept', 'application/json')
      .append('Content-Type', 'application/json')
      .append('userToken', userToken);

    const response = this.http.delete(url, { headers: headerslocal });
    return response;
  }

  getTargetIMPFormItemListNo(formNo: string): Observable<any> {
    const tenant = this.userContextService.user$.getValue().tenant;
    const url = `${baseUrl}/license/downloadImpLicense`;
    const userLang = this.languageService.getLang();
    const userToken = this.userContextService.user$.getValue().userToken;
    const headerslocal = APIM_AUTH_HEADER.append('accept', 'application/json')
      .append('userToken', userToken)
      .append('userLang', userLang)
      .append('userTimeZone', Intl.DateTimeFormat().resolvedOptions().timeZone);

    const model = {
      tenant: tenant,
      formNo: formNo,
    };

    const response = this.http.post(url, model, {
      headers: headerslocal,
    });
    return response;
  }

  getTargetEXPFormItemListNo(formNo: string): Observable<any> {
    const tenant = this.userContextService.user$.getValue().tenant;
    const url = `${baseUrl}/license/downloadExpLicense`;
    const userLang = this.languageService.getLang();
    const userToken = this.userContextService.user$.getValue().userToken;
    const headerslocal = APIM_AUTH_HEADER.append('accept', 'application/json')
      .append('userToken', userToken)
      .append('userLang', userLang)
      .append('userTimeZone', Intl.DateTimeFormat().resolvedOptions().timeZone);

    const model = {
      tenant: tenant,
      formNo: formNo,
    };

    const response = this.http.post(url, model, {
      headers: headerslocal,
    });
    return response;
  }

  getTargetSCFormItemListNo(formNo: string): Observable<any> {
    const tenant = this.userContextService.user$.getValue().tenant;
    const url = `${baseUrl}/license/downloadScLicense`;
    const userLang = this.languageService.getLang();
    const userToken = this.userContextService.user$.getValue().userToken;
    const headerslocal = APIM_AUTH_HEADER.append('accept', 'application/json')
      .append('userToken', userToken)
      .append('userLang', userLang)
      .append('userTimeZone', Intl.DateTimeFormat().resolvedOptions().timeZone);

    const model = {
      tenant: tenant,
      formNo: formNo,
    };

    const response = this.http.post(url, model, {
      headers: headerslocal,
    });
    return response;
  }

  renewIMPFormItemListbyFile(formNo: string, file: File): Observable<any> {
    const tenant = this.userContextService.user$.getValue().tenant;
    const url = `${baseUrl}/license/updateImpLicenseByUpload?tenant=${tenant}&formNo=${formNo}`;
    const userLang = this.languageService.getLang();
    const userToken = this.userContextService.user$.getValue().userToken;
    const headerslocal = APIM_AUTH_HEADER.append('accept', 'application/json')
      .append('userToken', userToken)
      .append('userLang', userLang)
      .append('userTimeZone', Intl.DateTimeFormat().resolvedOptions().timeZone);

    const formData = new FormData();
    formData.append('file', file);

    const response = this.http.post(url, formData, {
      headers: headerslocal,
    });

    return response;
  }

  renewEXPFormItemListbyFile(formNo: string, file: File): Observable<any> {
    const tenant = this.userContextService.user$.getValue().tenant;
    const url = `${baseUrl}/license/updateExpLicenseByUpload?tenant=${tenant}&formNo=${formNo}`;
    const userLang = this.languageService.getLang();
    const userToken = this.userContextService.user$.getValue().userToken;
    const headerslocal = APIM_AUTH_HEADER.append('accept', 'application/json')
      .append('userToken', userToken)
      .append('userLang', userLang)
      .append('userTimeZone', Intl.DateTimeFormat().resolvedOptions().timeZone);

    const formData = new FormData();
    formData.append('file', file);

    const response = this.http.post(url, formData, {
      headers: headerslocal,
    });

    return response;
  }

  renewSCFormItemListbyFile(formNo: string, file: File): Observable<any> {
    const tenant = this.userContextService.user$.getValue().tenant;
    const url = `${baseUrl}/license/updateScLicenseByUpload?tenant=${tenant}&formNo=${formNo}`;
    const userLang = this.languageService.getLang();
    const userToken = this.userContextService.user$.getValue().userToken;
    const headerslocal = APIM_AUTH_HEADER.append('accept', 'application/json')
      .append('userToken', userToken)
      .append('userLang', userLang)
      .append('userTimeZone', Intl.DateTimeFormat().resolvedOptions().timeZone);

    const formData = new FormData();
    formData.append('file', file);

    const response = this.http.post(url, formData, {
      headers: headerslocal,
    });

    return response;
  }

  licenseMasterSc047Modify(model: any): Observable<any> {
    const url = `${baseUrl}/common/licenseMasterSc047Modify`;
    const userToken = this.userContextService.user$.getValue().userToken;
    const headerslocal = APIM_AUTH_HEADER.append('accept', 'application/json')
      .append('Content-Type', 'application/json')
      .append('userToken', userToken);

    // const response = this.http.post(url, model, { headers: headerslocal, observe: 'events' });
    const response = this.http.post(url, model, { headers: headerslocal });
    return response;
  }

  getSOALazyLicenseMasterByConditions(model: any): Observable<any> {
    const url = `${baseUrl}/license/getSOALazyLicenseMasterByConditions`;
    const userToken = this.userContextService.user$.getValue().userToken;
    const headerslocal = APIM_AUTH_HEADER.append('accept', 'application/json')
      .append('Content-Type', 'application/json')
      .append('userToken', userToken);
    model.tenant = this.userContextService.user$.getValue().tenant;
    model.userCode = this.userContextService.user$.getValue().userCode;
    model.userEmail = this.userContextService.user$.getValue().userEmail;
    // const response = this.http.post(url, model, { headers: headerslocal, observe: 'events' });
    const response = this.http.post(url, model, { headers: headerslocal });
    return response;
  }

  downloadLazySOALicenseMasterByConditions(model: any): Observable<any> {
    const url = `${baseUrl}/license/downloadLazySOALicenseMasterByConditions`;
    const userToken = this.userContextService.user$.getValue().userToken;
    const headerslocal = APIM_AUTH_HEADER.append('accept', 'application/json')
      .append('Content-Type', 'application/json')
      .append('userToken', userToken)
      .append('userTimeZone', Intl.DateTimeFormat().resolvedOptions().timeZone)
      .append('userLang', this.languageService.getLang());
    model.tenant = this.userContextService.user$.getValue().tenant;
    model.userCode = this.userContextService.user$.getValue().userCode;
    model.userEmail = this.userContextService.user$.getValue().userEmail;
    // const response = this.http.post(url, model, { headers: headerslocal, observe: 'events' });
    const response = this.http.post(url, model, { headers: headerslocal });
    return response;
  }

  getSOALazyUserDataPermissionAndUserGroup(model: any): Observable<any> {
    const url = `${baseUrl}/license/getSOALazyUserDataPermissionAndUserGroup`;
    const userToken = this.userContextService.user$.getValue().userToken;
    const headerslocal = APIM_AUTH_HEADER.append('accept', 'application/json')
      .append('Content-Type', 'application/json')
      .append('userToken', userToken);
    model.tenant = this.userContextService.user$.getValue().tenant;
    model.userCode = this.userContextService.user$.getValue().userCode;
    model.userEmail = this.userContextService.user$.getValue().userEmail;
    const response = this.http.post(url, model, { headers: headerslocal });
    return response;
  }

  areaEccnNonOuCheck(model: any): Observable<any> {
    const url = `${baseUrl}/license/areaEccnNonOuCheck`;
    const userToken = this.userContextService.user$.getValue().userToken;
    const headerslocal = APIM_AUTH_HEADER.append('accept', 'application/json')
      .append('Content-Type', 'application/json')
      .append('userToken', userToken)
      .append('userTimeZone', Intl.DateTimeFormat().resolvedOptions().timeZone)
      .append('userLang', this.languageService.getLang());
    // const response = this.http.post(url, model, { headers: headerslocal, observe: 'events' });
    const response = this.http.post(url, model, { headers: headerslocal });
    return response;
  }

  getAreaFromAreaCountryMapping(): Observable<any> {
    const url = `${baseUrl}/license/getAreaFromAreaCountryMapping`;
    const userToken = this.userContextService.user$.getValue().userToken;
    const headerslocal = APIM_AUTH_HEADER.append('accept', 'application/json')
      .append('Content-Type', 'application/json')
      .append('userToken', userToken);

    const model = {
      tenant: this.userContextService.user$.getValue().tenant,
      flag: 'Y',
    };

    const response = this.http.post(url, model, { headers: headerslocal });
    return response;
  }

  getOuGroup(groupCode: string): Observable<any> {
    const baseUrl = `${environment.apiUrl}/license-control${environment.apiPathPrefix}`;
    const tenant = this.userContextService.user$.getValue().tenant;
    const url = `${baseUrl}/license/getOuGroup`;
    const userToken = this.userContextService.user$.getValue().userToken;
    const headerslocal = APIM_AUTH_HEADER.append('accept', 'application/json')
      .append('Content-Type', 'application/json')
      .append('userToken', userToken);

    let queryParams = new HttpParams({
      fromObject: { tenant: tenant, groupCode: groupCode },
    });

    const response = this.http.get(url, {
      headers: headerslocal,
      params: queryParams,
    });

    return response;
  }

  getSoaNonControlList(model: {
    tenant: string;
    vcType: string;
    vcCode: string;
    action: 'S';
    group?: string;
    brand?: string;
    flag?: string;
  }): Observable<HttpResponse<any>> {
    const url = `${baseUrl}/license/querySoaNonControl`;
    const userToken = this.userContextService.user$.getValue().userToken;
    const headerslocal = APIM_AUTH_HEADER.append('accept', 'application/json')
      .append('Content-Type', 'application/json')
      .append('userToken', userToken);

    const response = this.http.post(url, model, {
      headers: headerslocal,
      observe: 'response',
    });
    return response;
  }

  checkLicenseMasterViewRecord(model: {
    tenant: string,
    productCode: string[],
    licenseType: string
  }): Observable<any> {
    const url = `${baseUrl}/license/checkLicenseMasterRecord`;
    const userToken = this.userContextService.user$.getValue().userToken;
    const headerslocal = APIM_AUTH_HEADER.append('accept', 'application/json')
      .append('Content-Type', 'application/json')
      .append('userToken', userToken);

    const response = this.http.post(url, model, { headers: headerslocal, observe: 'response' });
    return response;
  }

  getApprovingAndApproveLicense(model): Observable<any> {
    const url = `${baseUrl}/common/getApprovingAndApproveLicense`;
    const userToken = this.userContextService.user$.getValue().userToken;
    const headerslocal = APIM_AUTH_HEADER.append('accept', 'application/json')
      .append('Content-Type', 'application/json')
      .append('userToken', userToken);

    const response = this.http.post(url, model, { headers: headerslocal });
    return response;
  }

  batchUpdateSoaItemSpecialApproval(model: {
    seqList: number[],
    specialApproval: "Y" | "N" | 0,
    createdBy: string
  }): Observable<any> {
    const url = `${baseUrl}/license/batchUpdateSoaItemSpecialApproval`;
    const userToken = this.userContextService.user$.getValue().userToken;
    const headerslocal = APIM_AUTH_HEADER.append('accept', 'application/json')
      .append('Content-Type', 'application/json')
      .append('userToken', userToken);

    const response = this.http.post(url, model, { headers: headerslocal });
    return response;
  }
}
