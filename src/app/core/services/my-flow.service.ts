import { TranslateService } from '@ngx-translate/core';
import { NoticeCheckHandlerService } from './notice-check-handler.service';
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpResponse } from '@angular/common/http';
import { Observable, finalize, of } from 'rxjs';
import { environment } from '../../../environments/environment';
import { UserContextService } from './user-context.service';
import { ToastService } from 'src/app/core/services/toast.service';
import { LanguageService } from './language.service';
import { LoaderService } from './loader.service';

const baseUrl = `${environment.workflowApiUrl}${environment.apiPathPrefix}`;

const APIM_AUTH_HEADER: HttpHeaders = new HttpHeaders({
  'Ocp-Apim-Subscription-Key': environment.apiKey,
});

@Injectable({
  providedIn: 'root',
})
export class MyFlowService {
  constructor(
    private http: HttpClient,
    private userContextService: UserContextService,
    private loaderService: LoaderService,
    private toastService: ToastService,
    private languageService: LanguageService,
    private noticeCheckHandlerService: NoticeCheckHandlerService,
    private translateService: TranslateService
  ) { }

  getMyFlow(model: any): Observable<any> {
    const url = `${baseUrl}/myFlow/getMyFlowByConditions`;
    const userToken = this.userContextService.user$.getValue().userToken;
    const headerslocal = APIM_AUTH_HEADER.append('accept', 'application/json')
      .append('Content-Type', 'application/json')
      .append('userToken', userToken);
    // console.log("url : " + url);
    console.log('model : ' + JSON.stringify(model));

    const response = this.http.post(url, model, { headers: headerslocal });
    return response;
  }

  getLazyMyFlow(model: any): Observable<any> {
    const url = `${baseUrl}/myFlow/getLazyMyFlowByConditions`;
    const userToken = this.userContextService.user$.getValue().userToken;
    const headerslocal = APIM_AUTH_HEADER.append('accept', 'application/json')
      .append('Content-Type', 'application/json')
      .append('userToken', userToken);
    const userLang = this.languageService.getLang();
    model.params.userLang = userLang;
    // console.log("url : " + url);
    console.log('model : ' + JSON.stringify(model));

    const response = this.http.post(url, model, { headers: headerslocal });
    return response;
  }

  getMyAuditFlow(model: any): Observable<any> {
    const url = `${baseUrl}/myFlow/getMyFlowByAuditConditions`;
    const userToken = this.userContextService.user$.getValue().userToken;
    const headerslocal = APIM_AUTH_HEADER.append('accept', 'application/json')
      .append('Content-Type', 'application/json')
      .append('userToken', userToken);
    // console.log("url : " + url);
    console.log('model : ' + JSON.stringify(model));

    const response = this.http.post(url, model, { headers: headerslocal });
    return response;
  }

  getLazyMyAuditFlow(model: any): Observable<any> {
    const url = `${baseUrl}/myFlow/getLazyMyFlowByAuditConditions`;
    const userToken = this.userContextService.user$.getValue().userToken;
    const headerslocal = APIM_AUTH_HEADER.append('accept', 'application/json')
      .append('Content-Type', 'application/json')
      .append('userToken', userToken);
    const userLang = this.languageService.getLang();
    model.params.userLang = userLang;
    // console.log("url : " + url);
    console.log('model : ' + JSON.stringify(model));

    const response = this.http.post(url, model, { headers: headerslocal });
    return response;
  }

  downloadMyFlow(model: any): Observable<any> {
    const url = `${baseUrl}/myFlow/downloadMyFlowByConditions`;
    const userToken = this.userContextService.user$.getValue().userToken;
    const headerslocal = APIM_AUTH_HEADER.append('accept', 'application/json')
      .append('Content-Type', 'application/json')
      .append('userToken', userToken);
    // console.log("url : " + url);
    console.log('model : ' + JSON.stringify(model));

    const response = this.http.post(url, model, { headers: headerslocal });
    return response;
  }

  downloadLazyMyFlow(model: any): Observable<any> {
    const url = `${baseUrl}/myFlow/downloadLazyMyFlowByConditions`;
    const userToken = this.userContextService.user$.getValue().userToken;
    const headerslocal = APIM_AUTH_HEADER.append('accept', 'application/json')
      .append('Content-Type', 'application/json')
      .append('userToken', userToken);
    // console.log("url : " + url);
    console.log('model : ' + JSON.stringify(model));

    const response = this.http.post(url, model, { headers: headerslocal });
    return response;
  }

  getFlowAuditLog(formNo: string, formTypeId?: string): Observable<any> {
    const url = `${baseUrl}/formAuditLog/${formNo}?formTypeId=${formTypeId}`;
    const userToken = this.userContextService.user$.getValue().userToken;
    const headerslocal = APIM_AUTH_HEADER.append('accept', 'application/json')
      .append('Content-Type', 'application/json')
      .append('userToken', userToken);

    return this.http.get(url, { headers: headerslocal });
  }

  getFormLog(formNo: string, formTypeId?: string): Observable<any> {
    const url = `${baseUrl}/formLog/getFormLog/${formNo}?formTypeId=${formTypeId}`;
    const userToken = this.userContextService.user$.getValue().userToken;
    const headerslocal = APIM_AUTH_HEADER.append('accept', 'application/json')
      .append('Content-Type', 'application/json')
      .append('userToken', userToken);

    return this.http.get(url, { headers: headerslocal });
  }

  getFormFile(formNo: string, formTypeId?: string): Observable<any> {
    const url = `${baseUrl}/formLog/getFormFileByFormNo/${formNo}?formTypeId=${formTypeId}`;
    const userToken = this.userContextService.user$.getValue().userToken;
    const headerslocal = APIM_AUTH_HEADER.append('accept', 'application/json')
      .append('Content-Type', 'application/json')
      .append('userToken', userToken);

    return this.http.get(url, { headers: headerslocal });
  }

  uploadFile(formNo: string, file: File): Observable<any> {
    const url = `${baseUrl}/formLog/formFile/uploadFile`;
    const userToken = this.userContextService.user$.getValue().userToken;
    const headerslocal = APIM_AUTH_HEADER.append(
      'accept',
      'application/json'
    ).append('Content-Type', 'application/json');
    // .append('userToken', userToken);

    const formData: FormData = new FormData();
    formData.append('file', file);
    formData.append('formNo', formNo);

    const response = this.http.post(url, formData, {
      headers: APIM_AUTH_HEADER,
    });
    return response;
  }

  addFormFile(model: any): Observable<any> {
    const url = `${baseUrl}/formLog/formFile/addFormLog`;
    const userToken = this.userContextService.user$.getValue().userToken;
    const headerslocal = APIM_AUTH_HEADER.append('accept', 'application/json')
      .append('Content-Type', 'application/json')
      .append('userToken', userToken);
    model = {
      ...model,
      tenant: this.userContextService.user$.getValue().tenant,
    };
    const response = this.http.post(url, model, { headers: headerslocal });
    return response;
  }

  uploadFormFileUrl(model: any): Observable<any> {
    const url = `${baseUrl}/formLog/formFile/addFormFileUrl`;
    const userToken = this.userContextService.user$.getValue().userToken;
    const headerslocal = APIM_AUTH_HEADER.append('accept', 'application/json')
      .append('Content-Type', 'application/json')
      .append('userToken', userToken);
    model = {
      ...model,
      tenant: this.userContextService.user$.getValue().tenant,
    };
    const response = this.http.post(url, model, { headers: headerslocal });
    return response;
  }

  deleteFormFileOrUrl(seq: any): Observable<any> {
    const url = `${baseUrl}/formLog/formFile/deleteFormFile/${seq}`;
    const userToken = this.userContextService.user$.getValue().userToken;
    const headerslocal = APIM_AUTH_HEADER.append('accept', 'application/json')
      .append('Content-Type', 'application/json')
      .append('userToken', userToken);

    const response = this.http.delete(url, { headers: headerslocal });
    return response;
  }

  downloadFile(seq: number) {
    const userToken = this.userContextService.user$.getValue().userToken;
    const url = `${baseUrl}/formLog/formFile/file/download/${seq}`;
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
          console.log('download filename : ' + filename);
          anchor.download = decodeURIComponent(filename);
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

  getProcessForecasting(formTypeId: string, formNo: string): Observable<any> {
    const url = `${baseUrl}/formLog/getProcessForecasting`;
    const userToken = this.userContextService.user$.getValue().userToken;
    const headerslocal = APIM_AUTH_HEADER.append('accept', 'application/json')
    .append('Content-Type', 'application/json')
    .append('userToken', userToken);
    const model = {
      tenant: this.userContextService.user$.getValue().tenant,
      formTypeId: formTypeId,
      formNo: formNo
    };
    const response = this.http.post(url, model, { headers: headerslocal });
    return response;
  }

  queryFlowStatus(formNo: string): Observable<any> {
    const url = `${baseUrl}/formLog/queryFlowStatus/${formNo}`;
    const userToken = this.userContextService.user$.getValue().userToken;
    const headerslocal = APIM_AUTH_HEADER.append('accept', 'application/json')
      .append('Content-Type', 'application/json')
      .append('userToken', userToken);
 
    return this.http.get(url, { headers: headerslocal });
  }

  private getFilenameFromContentDisposition(
    contentDisposition: string
  ): string {
    const regex = /filename="(?<filename>[^,;]+)";/g;
    const match = regex.exec(contentDisposition);
    const filename = match.groups.filename;
    return filename;
  }

  formUgentSendEmail(formNo: string, formTypeId: string): void {
    const url = `${baseUrl}/urgent`;
    const userToken = this.userContextService.user$.getValue().userToken;
    const headerslocal = APIM_AUTH_HEADER.append('accept', 'application/json')
      .append('Content-Type', 'application/json')
      .append('userToken', userToken);
    const model = {
      formNo: formNo,
      formTypeId: formTypeId,
      tenant: this.userContextService.user$.getValue().tenant,
      sentFrom: this.userContextService.user$.getValue().userEmail,
    };

    this.loaderService.show();
    this.http.post(url, model, { headers: headerslocal }).pipe(finalize(() => {
      this.loaderService.hide()
    })).subscribe({
      next: (res) => {
        console.warn(res)
        this.noticeCheckHandlerService.openNoticeDialog(
          this.translateService.instant('LicenseMgmt.Common.Title.Notification'),
          'success',
          this.translateService.instant('LicenseMgmt.Common.Hint.ReminderSend'),
        )
      },
      error: (err) => {
        console.error(err)
        this.noticeCheckHandlerService.openNoticeDialog(
          this.translateService.instant('LicenseMgmt.Common.Title.Notification'),
          'error',
          this.translateService.instant('LicenseMgmt.Common.Hint.ReminderSendFailed'),
        )
      }
    })
  }

  getFormTypeByPost(formTypeId: string): Observable<any> {
    const url = `${baseUrl}/formLog/getFormType`;
    const model = {
      tenant: this.userContextService.user$.getValue()?.tenant === 'WPGH' ? 'WPG' : this.userContextService.user$.getValue()?.tenant,
      formTypeId: formTypeId
    }

    const userToken = this.userContextService.user$.getValue().userToken;
    const headerslocal = APIM_AUTH_HEADER.append('accept', 'application/json')
      .append('Content-Type', 'application/json')
      .append('userToken', userToken);

    const response = this.http.post(url,model, {
      headers: headerslocal,
      observe: 'response',
    });
    return response;
  }
}
