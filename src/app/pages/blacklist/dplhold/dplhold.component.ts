import { Component, HostListener, OnInit } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { MenuItem } from 'primeng/api';

import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';

import { ToastService } from 'src/app/core/services/toast.service';
import { AuditLog } from './../../../core/model/audit-log';
import { DplHoldData } from './../../../core/model/dpl-hold-data';
import { FormFile } from './../../../core/model/form-file';
import { DplHoldApiService } from './../../../core/services/dpl-hold-api.service';
import { MyFlowService } from './../../../core/services/my-flow.service';
import { environment } from 'src/environments/environment';
import { ReassignDialogService } from 'src/app/core/components/reassign-dialog/reassign-dialog.service';
import { IntegrateService } from 'src/app/core/services/integrate.service';
import * as html2pdf from 'html2pdf.js';
import { LoaderService } from 'src/app/core/services/loader.service';
import { StoreBatchEditEntryService } from '../../storeBatchEditEntry/store-batch-edit-entry.service';

@Component({
  selector: 'app-dplhold',
  templateUrl: './dplhold.component.html',
  styleUrls: ['./dplhold.component.scss'],
})
export class DPLHoldComponent implements OnInit {
  private onLangChange$: Subscription;
  private loginStateSubscription$: Subscription;
  // private userToken: string;

  breadcrumbItems: MenuItem[];
  formTypeId:string;
  queryFormNo: string;
  backUrl: string;
  queryData: DplHoldData = new DplHoldData();
  selectedRadio: string = '';
  chipVals: string[] = ['Value', 'Value 02'];
  aduitLog: AuditLog;
  whiteListFlag: boolean = false;
  whiteListFlag2: boolean = false;
  whiteListFlag3: boolean = false;

  historyCols;
  historyData: AuditLog;

  fileCols;
  urlCols;
  fileData: FormFile;

  displayBillTo: boolean = false;
  displayShipTo: boolean = false;
  displayDeliverTo: boolean = false;
  displayBillToAddToWhiteList: boolean = false;
  displayShipToAddToWhiteList: boolean = false;
  displayDeliverToAddToWhiteList: boolean = false;

  waitApproveList!: string[];
  waitAssigneeList!: string[];

  constructor(
    private activatedRoute: ActivatedRoute,
    private router: Router,
    private myFlowService: MyFlowService,
    private dplHoldApiService: DplHoldApiService,
    private translateService: TranslateService,
    private toastService: ToastService,
    public reassignDialogService: ReassignDialogService,
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
    this.dplHoldApiService.getDplHold(this.queryFormNo).subscribe({
      next: (rsp) => {
        if (rsp.trxType === 'EndCust') {
          this.router.navigateByUrl(
            this.router.url.replace('dpl', 'dpl-end-cust')
          );
        }
        this.formTypeId = rsp.formTypeId;
        this.reassignDialogService.init(rsp.formNo, rsp.formTypeId);
        this.integrateService.init(rsp.formTypeId);
        this.queryData = rsp;
        console.log('queryData: ' + JSON.stringify(this.queryData));
        this.whiteListFlag =
          this.queryData.addToWhiteList1 === 'Y' ? true : false;
        this.whiteListFlag2 =
          this.queryData.addToWhiteList2 === 'Y' ? true : false;
        this.whiteListFlag3 =
          this.queryData.addToWhiteList3 === 'Y' ? true : false;

        if (this.queryData.addressId1 != null && this.queryData.addressline1 != null) {
          this.displayBillTo = true;
          this.displayBillToAddToWhiteList = true;
        }

        if (this.queryData.addressId2 != null && this.queryData.addressline2 != null) {
          this.displayShipTo = true;
          this.displayShipToAddToWhiteList = true;
        }

        if (this.queryData.addressId3 != null && this.queryData.addressline3 != null) {
          this.displayDeliverTo = true;
          this.displayDeliverToAddToWhiteList = true;
        }

        // 取得auditLog
        this.getHisotryLog();

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

      },
      error: (rsp) => {
        console.log(rsp);
        this.toastService.error('System.Message.Error');
      },
    });


  }

  backBtnClick() {
    // console.log('backUrl => ' + this.backUrl);
    //window.location.href = (environment.storeRedirectUrlPrefix + "?entryUrl=myforms/search")
    // this.router.navigate([this.backUrl], { queryParams: {} });
    //window.location.href = (environment.storeRedirectUrlPrefix + "?entryUrl=myforms/search")
    if (this.backUrl !== null) {
      window.location.href = (environment.storeRedirectUrlPrefix + "?entryUrl=" + this.backUrl);
    } else {
      window.location.href = (environment.storeRedirectUrlPrefix + "?entryUrl=myforms/search");
    }
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


  private setBreadcrumbItems(): void {
    this.breadcrumbItems = this.translateService.instant(
      'BreadcrumbItems.Backstage'
    );
  }

  statusDesc(status) {
    return this.translateService.instant('DPL_Hold_Fail.statusDesc.' + status);
  }

  getHisotryLog() {
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
      },
      error: (rsp) => {
        console.log(rsp);
        this.toastService.error('System.Message.Error');
      },
    });
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
