import { HttpClient, HttpHeaders, HttpResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ItemInfo } from '../model/item-info';
import { LanguageService } from './language.service';
import { LoaderService } from './loader.service';
import { ToastService } from './toast.service';
import { UserContextService } from './user-context.service';
import { ItemBrandCtg } from '../model/item-brand-ctg';

const baseUrl = `${environment.apiUrl}/common${environment.apiPathPrefix}`;

const APIM_AUTH_HEADER: HttpHeaders = new HttpHeaders({
  'Ocp-Apim-Subscription-Key': environment.apiKey,
});

@Injectable({
  providedIn: 'root',
})
export class CommonApiService {
  constructor(
    private http: HttpClient,
    private userContextService: UserContextService,
    private loaderService: LoaderService,
    private toastService: ToastService,
    private languageService: LanguageService
  ) { }

  countryQuery(): Observable<any> {
    const userLang = this.languageService.getLang();
    const url = `${baseUrl}/countryQuery/${userLang}`;
    const userToken = this.userContextService.user$.getValue().userToken;
    const headerslocal = APIM_AUTH_HEADER.append('accept', 'application/json')
      .append('Content-Type', 'application/json')
      .append('userToken', userToken);

    return this.http.get(url, { headers: headerslocal });
  }

  idGenerator(idName: string): Observable<any> {
    const url = `${baseUrl}/idGenerator/${idName}`;
    const userToken = this.userContextService.user$.getValue().userToken;
    const headerslocal = APIM_AUTH_HEADER.append('accept', 'application/json')
      .append('Content-Type', 'application/json')
      .append('userToken', userToken);

    return this.http.get(url, { headers: headerslocal });
  }

  generateIdList(idName: string, howMany: number): Observable<any> {
    const url = `${baseUrl}/generateIdList/${idName}/${howMany}`;
    const userToken = this.userContextService.user$.getValue().userToken;
    const headerslocal = APIM_AUTH_HEADER.append('accept', 'application/json')
      .append('Content-Type', 'application/json')
      .append('userToken', userToken);

    return this.http.get(url, { headers: headerslocal });
  }

  downloadFile(fileId: number) {
    const userToken = this.userContextService.user$.getValue().userToken;
    const url = `${baseUrl}/file/download/${fileId}`;
    const headerslocal = APIM_AUTH_HEADER.append('accept', 'application/json')
      .append('Content-Type', 'application/json')
      .append('userToken', userToken);

    this.http
      .get(url, {
        headers: headerslocal,
        responseType: 'blob',
        observe: 'response',
      })
      .subscribe({
        next: (res: HttpResponse<any>) => {
          if (res === undefined || res.headers === undefined) return;

          let theFile = new Blob([res.body], {
            type: res.headers.get('Content-Type'),
          });
          let url = window.URL.createObjectURL(theFile);
          const anchor = document.createElement('a');
          let contentDisposition = res.headers.get('Content-Disposition');
          let filename =
            this.getFilenameFromContentDisposition(contentDisposition);
          console.log(filename);
          anchor.download = filename;
          anchor.href = url;
          anchor.click();
          setTimeout(() => {
            this.loaderService.hide();
          }, 1000);
        },
        error: (e) => {
          console.log(e);
          this.loaderService.hide();
          this.toastService.error('System.Message.Error');
        },
      });
  }

  private getFilenameFromContentDisposition(
    contentDisposition: string
  ): string {
    const regex = /filename="(?<filename>[^,;]+)";/g;
    const match = regex.exec(contentDisposition);
    const filename = match.groups.filename;
    return filename;
  }

  customerQueryByPrefix(custPrefix: string): Observable<any> {
    const tenant = this.userContextService.user$.getValue().tenant;
    const url = `${baseUrl}/customerQueryByPrefix/${tenant}/${custPrefix}`;
    const userToken = this.userContextService.user$.getValue().userToken;
    const headerslocal = APIM_AUTH_HEADER.append('accept', 'application/json')
      .append('Content-Type', 'application/json')
      .append('userToken', userToken);

    return this.http.get(url, { headers: headerslocal });
  }

  brandQueryByPrefix(brandPrefix: string, showALLBrand: string = 'Y'): Observable<any> {
    const model = JSON.parse('{}');
    const tenant = this.userContextService.user$.getValue().tenant;
    const url = `${baseUrl}/brandQueryByPrefix`;
    const userToken = this.userContextService.user$.getValue().userToken;
    const headerslocal = APIM_AUTH_HEADER.append('accept', 'application/json')
      .append('Content-Type', 'application/json')
      .append('userToken', userToken);

    model.tenant = tenant;
    model.brandPrefix = brandPrefix;
    model.showALLBrand = showALLBrand

    return this.http.post(url, model, { headers: headerslocal });
  }

  productQueryByPrefix(brand: string, productPrefix: string): Observable<any> {
    const model = JSON.parse('{}');
    const tenant = this.userContextService.user$.getValue().tenant;
    const url = `${baseUrl}/productQueryByPrefix`;
    const userToken = this.userContextService.user$.getValue().userToken;
    const headerslocal = APIM_AUTH_HEADER.append('accept', 'application/json')
      .append('Content-Type', 'application/json')
      .append('userToken', userToken);

    model.tenant = tenant;
    model.brand = brand;
    model.productPrefix = productPrefix;

    return this.http.post(url, model, { headers: headerslocal });
  }

  vendorQueryByPrefix(custPrefix: string): Observable<any> {
    const tenant = this.userContextService.user$.getValue().tenant;
    const url = `${baseUrl}/vendorQueryByPrefix/${tenant}/${custPrefix}`;
    const userToken = this.userContextService.user$.getValue().userToken;
    const headerslocal = APIM_AUTH_HEADER.append(
      'accept',
      'application/json'
    ).append('userToken', userToken);

    return this.http.get(url, { headers: headerslocal });
  }

  getFuzzyActiveCustomerList(keyword: string): Observable<any> {
    const tenant = this.userContextService.user$.getValue().tenant;
    const url = `${baseUrl}/activeCustomerQueryByPrefix/${tenant}/${keyword}`;
    const userToken = this.userContextService.user$.getValue().userToken;
    const headerslocal = APIM_AUTH_HEADER.append('accept', 'application/json')
      .append('Content-Type', 'application/json')
      .append('userToken', userToken);

    return this.http.get(url, { headers: headerslocal });
  }

  getFuzzyActiveVendorList(keyword: string): Observable<any> {
    const tenant = this.userContextService.user$.getValue().tenant;
    const url = `${baseUrl}/activeVendorQueryByPrefix/${tenant}/${keyword}`;
    const userToken = this.userContextService.user$.getValue().userToken;
    const headerslocal = APIM_AUTH_HEADER.append('accept', 'application/json')
      .append('Content-Type', 'application/json')
      .append('userToken', userToken);

    return this.http.get(url, { headers: headerslocal });
  }

  getFuzzyItemList(keyword: string): Observable<any> {
    const tenant = this.userContextService.user$.getValue().tenant;
    const url = `${baseUrl}/itemQueryByPrefix`;
    const userToken = this.userContextService.user$.getValue().userToken;
    const headerslocal = APIM_AUTH_HEADER.append('accept', 'application/json')
      .append('Content-Type', 'application/json')
      .append('userToken', userToken);

    return this.http.post(
      url,
      {
        tenant: tenant,
        keyword: keyword,
      },
      { headers: headerslocal }
    );
  }

  getTargetItemInfo(itemNo: ItemInfo['invItemNo']): Observable<any> {
    const tenant = this.userContextService.user$.getValue().tenant;
    const url = `${baseUrl}/checkProductCode`;
    const userToken = this.userContextService.user$.getValue().userToken;
    const headerslocal = APIM_AUTH_HEADER.append('accept', 'application/json')
      .append('Content-Type', 'application/json')
      .append('userToken', userToken);

    return this.http.post(
      url,
      {
        tenant: tenant,
        produceCode: itemNo,
      },
      { headers: headerslocal }
    );
  }

  queryItemMasterByInvItemNos(invItemNos: any[]): Observable<any> {
    const model = JSON.parse('{}');
    const url = `${baseUrl}/queryItemMasterByInvItemNos`;
    const userToken = this.userContextService.user$.getValue().userToken;
    const headerslocal = APIM_AUTH_HEADER.append('accept', 'application/json')
      .append('Content-Type', 'application/json')
      .append('userToken', userToken);

    model.tenant = this.userContextService.user$.getValue().tenant;
    model.invItemNoList = invItemNos;

    return this.http.post(url, model, { headers: headerslocal });
  }

  activeCustomerQueryByPrefix(custPrefix: string): Observable<any> {
    const tenant = this.userContextService.user$.getValue().tenant;
    const url = `${baseUrl}/activeCustomerQueryByPrefix/${tenant}/${custPrefix}`;
    const userToken = this.userContextService.user$.getValue().userToken;
    const headerslocal = APIM_AUTH_HEADER.append('accept', 'application/json')
      .append('Content-Type', 'application/json')
      .append('userToken', userToken);

    return this.http.get(url, { headers: headerslocal });
  }

  activeVendorQueryByPrefix(custPrefix: string): Observable<any> {
    const tenant = this.userContextService.user$.getValue().tenant;
    const url = `${baseUrl}/activeVendorQueryByPrefix/${tenant}/${custPrefix}`;
    const userToken = this.userContextService.user$.getValue().userToken;
    const headerslocal = APIM_AUTH_HEADER.append('accept', 'application/json')
      .append('Content-Type', 'application/json')
      .append('userToken', userToken);

    return this.http.get(url, { headers: headerslocal });
  }

  activeProductQueryByPrefix(productPrefix: string): Observable<any> {
    const model = JSON.parse('{}');
    const tenant = this.userContextService.user$.getValue().tenant;
    const url = `${baseUrl}/activeProductQueryByPrefix`;
    const userToken = this.userContextService.user$.getValue().userToken;
    const headerslocal = APIM_AUTH_HEADER.append('accept', 'application/json')
      .append('Content-Type', 'application/json')
      .append('userToken', userToken);

    model.tenant = tenant;
    model.productPrefix = productPrefix;

    return this.http.post(url, model, { headers: headerslocal });
  }

  customerShipToAddressQueryByPrefix(model: any): Observable<any> {
    const url = `${baseUrl}/customerShipToAddressQueryByPrefix`;
    const userToken = this.userContextService.user$.getValue().userToken;
    const headerslocal = APIM_AUTH_HEADER.append('accept', 'application/json')
      .append('Content-Type', 'application/json')
      .append('userToken', userToken);

    // const response = this.http.post(url, model, { headers: headerslocal, observe: 'events' });
    const response = this.http.post(url, model, { headers: headerslocal });
    return response;
  }

  customerDeliverToAddressQueryByPrefix(model: any): Observable<any> {
    const url = `${baseUrl}/customerDeliverToAddressQueryByPrefix`;
    const userToken = this.userContextService.user$.getValue().userToken;
    const headerslocal = APIM_AUTH_HEADER.append('accept', 'application/json')
      .append('Content-Type', 'application/json')
      .append('userToken', userToken);

    const response = this.http.post(url, model, { headers: headerslocal });
    return response;
  }

  queryRuleSetup(model: any): Observable<any> {
    const tenant = this.userContextService.user$.getValue().tenant;
    const url = `${baseUrl}/queryRuleSetup`;
    const userToken = this.userContextService.user$.getValue().userToken;
    const headerslocal = APIM_AUTH_HEADER.append('accept', 'application/json')
      .append('Content-Type', 'application/json')
      .append('userToken', userToken);
    model.tenant = tenant;
    model.msgFrom = 'RuleSetting';

    // const response = this.http.post(url, model, { headers: headerslocal, observe: 'events' });
    const response = this.http.post(url, model, { headers: headerslocal });
    return response;
  }

  ruleSetupView(model: any): Observable<any> {
    const url = `${baseUrl}/ruleSetupView`;
    const userToken = this.userContextService.user$.getValue().userToken;
    const headerslocal = APIM_AUTH_HEADER.append('accept', 'application/json')
      .append('Content-Type', 'application/json')
      .append('userToken', userToken);

    // const response = this.http.post(url, model, { headers: headerslocal, observe: 'events' });
    const response = this.http.post(url, model, { headers: headerslocal });
    return response;
  }

  ruleSetupModify(model: any): Observable<any> {
    const url = `${baseUrl}/ruleSetupModify`;
    const userToken = this.userContextService.user$.getValue().userToken;
    const headerslocal = APIM_AUTH_HEADER.append('accept', 'application/json')
      .append('Content-Type', 'application/json')
      .append('userToken', userToken);

    // const response = this.http.post(url, model, { headers: headerslocal, observe: 'events' });
    const response = this.http.post(url, model, { headers: headerslocal });
    return response;
  }

  getFuzzyActiveCustomerAllList(keyword: string): Observable<any> {
    const tenant = this.userContextService.user$.getValue().tenant;
    const url = `${baseUrl}/activeCustomerQueryByPrefixAppendAll/${tenant}/${keyword}`;
    const userToken = this.userContextService.user$.getValue().userToken;
    const headerslocal = APIM_AUTH_HEADER.append('accept', 'application/json')
      .append('Content-Type', 'application/json')
      .append('userToken', userToken);

    return this.http.get(url, { headers: headerslocal });
  }

  getFuzzyActiveVendorAllList(keyword: string): Observable<any> {
    const tenant = this.userContextService.user$.getValue().tenant;
    const url = `${baseUrl}/activeVendorQueryByPrefixAppendAll/${tenant}/${keyword}`;
    const userToken = this.userContextService.user$.getValue().userToken;
    const headerslocal = APIM_AUTH_HEADER.append('accept', 'application/json')
      .append('Content-Type', 'application/json')
      .append('userToken', userToken);

    return this.http.get(url, { headers: headerslocal });
  }

  customerAddressQueryForLicense(model: any): Observable<any> {
    const url = `${baseUrl}/customerAddressQueryForLicense`;
    const userToken = this.userContextService.user$.getValue().userToken;
    const headerslocal = APIM_AUTH_HEADER.append('accept', 'application/json')
      .append('Content-Type', 'application/json')
      .append('userToken', userToken);

    const response = this.http.post(url, model, { headers: headerslocal });
    return response;
  }

  getItemCtgByBrand(itemBrand: ItemBrandCtg): Observable<any> {
    const url = `${baseUrl}/queryBrandCtg`;
    const userToken = this.userContextService.user$.getValue().userToken;
    const headerslocal = APIM_AUTH_HEADER.append('accept', 'application/json')
      .append('Content-Type', 'application/json')
      .append('userToken', userToken);
    const response = this.http.post(url, itemBrand, { headers: headerslocal });
    return response;
  }

  queryBrandCtg(model): Observable<any> {
    const tenant = this.userContextService.user$.getValue().tenant;
    const url = `${baseUrl}/queryBrandCtg`;
    const userToken = this.userContextService.user$.getValue().userToken;
    const headerslocal = APIM_AUTH_HEADER.append('accept', 'application/json')
      .append('Content-Type', 'application/json')
      .append('userToken', userToken);

    model.tenant = tenant;

    return this.http.post(url, model, { headers: headerslocal });
  }

  queryEndCustomer(model): Observable<any> {

    const tenant = this.userContextService.user$.getValue().tenant;
    const url = `${baseUrl}/queryEndCustomer`;

    model.tenant = tenant;
    return this.http.post(url, model, { headers: this.getCommonHttpHeader() });
  }

  getCommonHttpHeader() {
    const userToken = this.userContextService.user$.getValue().userToken;
    const headerslocal = APIM_AUTH_HEADER.append('accept', 'application/json')
      .append('Content-Type', 'application/json')
      .append('userToken', userToken);
    return headerslocal;
  }

  currencyCodeQueryByPrefix(currencyPrefix: string = ''): Observable<any> {
    const tenant = this.userContextService.user$.getValue().tenant;
    const url = `${baseUrl}/currencyCodeQueryByPrefix`;
    const userToken = this.userContextService.user$.getValue().userToken;
    const headerslocal = APIM_AUTH_HEADER.append('accept', 'application/json')
      .append('Content-Type', 'application/json')
      .append('userToken', userToken);

    const model = {
      tenant: tenant,
      curPrefix: currencyPrefix
    }

    return this.http.post(url, model, { headers: headerslocal });
  }
}
