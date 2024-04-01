import { Component, HostListener, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { MenuItem, SelectItem } from 'primeng/api';
import { Subscription } from 'rxjs';

import { ToastService } from 'src/app/core/services/toast.service';
import { DplFailHeader } from './../../../core/model/dpl-fail-header';
import { DplFailLine } from './../../../core/model/dpl-fail-line';
import { DplFailApiService } from './../../../core/services/dpl-fail-api.service';
import { MyFlowService } from './../../../core/services/my-flow.service';
import { environment } from 'src/environments/environment';
import { IntegrateService } from 'src/app/core/services/integrate.service';
import { LoaderService } from 'src/app/core/services/loader.service';
import * as html2pdf from 'html2pdf.js';
import { StoreBatchEditEntryService } from '../../storeBatchEditEntry/store-batch-edit-entry.service';

@Component({
  selector: 'app-dpl-fail',
  templateUrl: './dpl-fail.component.html',
  styleUrls: ['./dpl-fail.component.scss'],
})
export class DplFailComponent implements OnInit {
  private onLangChange$: Subscription;
  private loginStateSubscription$: Subscription;
  breadcrumbItems: MenuItem[];
  displaySubmitDetail = false;
  linkVal: string;
  linkItem = [];
  selectedRadio3: string;
  chipVals: string[];
  options: SelectItem[];
  formTypeId: string;
  queryFormNo: string;
  backUrl: string;
  cols: any[];
  selectedCols: any[];
  headerData: DplFailHeader = new DplFailHeader();
  lineData: DplFailLine[];
  displayFilterDetail = false;

  historyCols: any[];
  historyData: any[];

  fileCols: any[];
  fileData: any[];
  urlCols: any[];

  waitApproveList!: string[];
  waitAssigneeList!: string[];

  constructor(
    private activatedRoute: ActivatedRoute,
    private myFlowService: MyFlowService,
    private dplFailApiService: DplFailApiService,
    private translateService: TranslateService,
    private toastService: ToastService,
    public integrateService: IntegrateService,
    private loaderService: LoaderService,
    public storeBatchEditEntryService : StoreBatchEditEntryService
  ) {
    this.activatedRoute.queryParams.subscribe((params) => {
      this.queryFormNo = params['queryFormNo'] ?? null;
      this.backUrl = params['backUrl'] ?? null;
    });

    this.onLangChange$ = this.translateService.onLangChange.subscribe(() => {
      this.setBreadcrumbItems();
    });

    this.setBreadcrumbItems();
    this.waitApproveList = new Array<string>();
    this.waitAssigneeList = new Array<string>();
  }

  ngOnInit(): void {
    this.storeBatchEditEntryService.postMessageToParent('FormInit');
    this.recoverUserSetting();
    this.dplFailApiService.getDplFail(this.queryFormNo).subscribe({
      next: (rsp) => {
        this.formTypeId = rsp.formTypeId;
        this.integrateService.init(rsp.formTypeId);
        // console.log('queryData rsp => ' + JSON.stringify(rsp));
        this.headerData = rsp;
        this.lineData = rsp.lines;
        // console.log('queryData: ' + JSON.stringify(this.headerData));

        // 取得auditLog
        this.myFlowService.getFlowAuditLog(this.queryFormNo,this.formTypeId).subscribe({
          next: (rsp) => {
            for (const log of rsp) {
              if (log.status === 'Approving') {
                this.waitApproveList.push(
                  `${log['signerNameEn'].trim()} ${log[
                    'signerNameCn'
                  ].trim()} ( ${log['signerCode'].trim()} )`
                );
              }

              if (log.status === 'Assignee') {
                this.waitAssigneeList.push(
                  `${log['signerNameEn'].trim()} ${log[
                    'signerNameCn'
                  ].trim()} ( ${log[
                    'signerCode'
                  ].trim()} ) ${this.translateService.instant(
                    'LicenseMgmt.Common.Hint.AuditApprovingConSigneeSuffix'
                  )}`
                );
              }
            }

            this.historyData = rsp.filter(
              (x) =>
                x.status === 'Submitted' ||
                x.status === 'Approve' ||
                x.status === 'Reject' ||
                x.status === 'Rollback' ||
                x.status === 'Resolve' ||
                x.status === 'Cancel'
            );
            // console.log('aduitLog: ' + JSON.stringify(this.historyData));
          },
          error: (rsp) => {
            console.log(rsp);
            this.toastService.error('System.Message.Error');
          },
        });

        // 取得formFile
        this.myFlowService.getFormFile(this.queryFormNo,this.formTypeId).subscribe({
          next: (rsp) => {
            this.fileData = rsp;
            // console.log('fileData: ' + JSON.stringify(this.fileData));
          },
          error: (rsp) => {
            console.log(rsp);
            this.toastService.error('System.Message.Error');
          },
        });

        this.historyCols = [
          { field: 'stepNumber', header: 'stepNumber' },
          { field: 'completeTime', header: 'Time' },
          { field: 'signerCode', header: 'User Name' },
          { field: 'signerDeptName', header: 'Dept' },
          { field: 'remark', header: 'Action' },
          { field: 'signComment', header: 'Opinion' },
          { field: 'signerPhoneNumber', header: 'Ext/Mobile' },
        ];

        this.fileCols = [
          { field: 'uploadDate', header: 'UploadDate' },
          { field: 'fileName', header: 'File Name' },
          { field: 'uploadName', header: 'User Name' },
        ];

        this.urlCols = [
          { field: 'uploadDate', header: 'UploadDate' },
          { field: 'url', header: 'Url' },
          { field: 'uploadName', header: 'User Name' },
        ];

        this.cols = [
          { field: 'dplName', header: 'dplName', isDefault: true },
          {
            field: 'dplAddress',
            header: 'dplAddress',
            isDisabled: true,
            isDefault: true,
          },
          {
            field: 'dplResult',
            header: 'dplResult',
            isDisabled: true,
            isDefault: true,
          },
          { field: 'ebcResult', header: 'ebcResult', isDefault: true },
          { field: 'matchCategory', header: 'matchCategory', isDefault: true },
          { field: 'matchPercent', header: 'matchPercent', isDefault: true },
          { field: 'sourceList', header: 'sourceList', isDefault: true },
        ];
        this.changeFilterDetail();
      },
      error: (rsp) => {
        console.log(rsp);
        this.toastService.error('System.Message.Error');
      },
    });

  }

  showFilter() {
    this.displayFilterDetail = true;
  }
  changeFilterDetail() {
    this.selectedCols = this.cols.filter((x) => {
      return x.isDefault;
    });
  } // end changeFilterDetail

  backBtnClick() {
    // console.log('backUrl => ' + this.backUrl);
    if (this.backUrl !== null) {
      window.location.href = (environment.storeRedirectUrlPrefix + "?entryUrl=" + this.backUrl);
    } else {
      window.location.href = (environment.storeRedirectUrlPrefix + "?entryUrl=myforms/search");
    }
  }

  private setBreadcrumbItems(): void {
    this.breadcrumbItems = this.translateService.instant(
      'BreadcrumbItems.Backstage'
    );
  }

  downloadFile(seq: number) {
    let url = this.myFlowService.downloadFile(seq);
    return false;
  }

  openLink(url: string) {
    if (!this.isValidURL(url))
      return false;

    (window as any).open(url, '_blank');
    return false;
  }

  isValidURL(url: string): boolean {
    if (url === undefined || !url)
      return false;

    if (!url.startsWith('http://') && !url.startsWith('https://'))
      return false;

    var res = url.match(/(http(s)?:\/\/.)?(www\.)?[-a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_\+.~#?&//=]*)/g);
    return (res !== null)
  };

  statusDesc(status) {
    return this.translateService.instant('DPL_Hold_Fail.statusDesc.' + status);
  }

  onReminderSend(): void {
    this.myFlowService.formUgentSendEmail(this.queryFormNo, this.formTypeId);
  }

  extendForm = false;

  recoverUserSetting() {
    const user_extend_form = document.cookie.split("user_extend_form=");
    if (user_extend_form[1]) { this.extendForm = (user_extend_form[1][0] ?? '') === "t" ? true : false; }
    else { this.extendForm = true; }
  }

  extendFormOnClick() {
    this.extendForm = !this.extendForm;
    document.cookie = `user_extend_form=${this.extendForm.toString()}`;
  }

  get extendBtnLabel() {
    return this.extendForm ? this.translateService.instant('Button.Label.PackUp') : this.translateService.instant('Button.Label.Extend')
  }

  exportPdf(){
    const extendStatus = this.extendForm;

    this.extendForm = true;
    this.loaderService.show();

    setTimeout(() => { // 待 repaint 完成
      const element = document.getElementById('dplhold-search-full-content');
      const opt = {
        margin:       1,
        filename:     `${this.queryFormNo}.pdf`,
        image:        { type: 'jpeg', quality: 0.98 },
        html2canvas:  { scale: 1.5,dpi: 192,letterRendering: true,allowTaint: true },
        jsPDF:        { unit: 'mm', format: 'a1', orientation: 'portrait',compress: true}
      };
  
      html2pdf().from(element).set(opt).save()
      .then(()=>{
        this.extendForm = extendStatus;
        this.loaderService.hide();
      }).catch(()=>{
        this.extendForm = extendStatus;
        this.loaderService.hide();
      });
    }, 3000); 

  }

  // 嵌入
  @HostListener('window:popstate')
  onPopState() {
    this.storeBatchEditEntryService.postMessageToParent('popstate')
  }
}
