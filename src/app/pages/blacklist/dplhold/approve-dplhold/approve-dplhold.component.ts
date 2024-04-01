import { Component, HostListener, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import {
  ConfirmationService,
  MenuItem,
  SelectItem,
} from 'primeng/api';
import { forkJoin, lastValueFrom, Subscription } from 'rxjs';
import { UserContextService } from './../../../../core/services/user-context.service';

import { ToastService } from 'src/app/core/services/toast.service';
import { AuditLog } from './../../../../core/model/audit-log';
import { DplHoldData } from './../../../../core/model/dpl-hold-data';
import { FormFile } from './../../../../core/model/form-file';
import { AuthApiService } from './../../../../core/services/auth-api.service';
import { DplHoldApiService } from './../../../../core/services/dpl-hold-api.service';
import { MyFlowService } from './../../../../core/services/my-flow.service';
import { MyApplicationService } from 'src/app/core/services/my-application.service';
import { environment } from 'src/environments/environment';
import { FileUpload } from 'primeng/fileupload';
import { LoaderService } from 'src/app/core/services/loader.service';
import { IntegrateService } from 'src/app/core/services/integrate.service';
import * as html2pdf from 'html2pdf.js';
import { StoreBatchEditEntryService } from 'src/app/pages/storeBatchEditEntry/store-batch-edit-entry.service';
import { AgentInfoTableService } from 'src/app/core/components/agent-info-table/agent-info-table.service';

FileUpload.prototype.formatSize = function (bytes) {
  if (bytes == 0) {
    return '0 B';
  }
  var k = 1024,
    dm = 1,
    sizes = ['B', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'],
    i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

@Component({
  selector: 'app-approve-dplhold',
  templateUrl: './approve-dplhold.component.html',
  styleUrls: ['./approve-dplhold.component.scss'],
})
export class ApproveDplholdComponent implements OnInit {
  private onLangChange$: Subscription;
  private loginStateSubscription$: Subscription;
  @ViewChild('fileUpload') fileUpload: FileUpload;

  breadcrumbItems: MenuItem[];

  queryFormNo: string;
  queryData: DplHoldData = new DplHoldData();
  action: string = 'approve';
  salesDepts: any[];
  salesDept: string;
  aduitLog: AuditLog;
  uploadedFiles: any[] = [];
  historyCols;
  historyData: AuditLog;
  comment: string;
  whiteListFlag: boolean = false;
  whiteListFlag2: boolean = false;
  whiteListFlag3: boolean = false;
  uploadFile: File;
  url: string;
  linkList: string;
  linkItem = [];
  loginUserEmail: string;
  fileCols;
  urlCols;
  fileData: FormFile;
  stepNumber: number;
  cosignerOptions: SelectItem[];
  cosigners: string[];
  rollbackStepOptions: SelectItem[];
  rollbackStep: string;
  isAssigneeTask: boolean = false;
  displaySubmitDetail = false;
  cosignerFilter: string = '1';
  formTypeId: string;
  validUrl: boolean = true;
  filteredSigners: any[];
  signer: any;
  signers: any[];
  displayAddFileOrLink: boolean = false;
  requiredSigner: boolean = false;
  displayBillTo: boolean = false;
  displayShipTo: boolean = false;
  displayDeliverTo: boolean = false;
  displayBillToAddToWhiteList: boolean = false;
  displayShipToAddToWhiteList: boolean = false;
  displayDeliverToAddToWhiteList: boolean = false;
  backUrl: string;
  actionList: string[] = [];

  waitApproveList!: string[];
  waitAssigneeList!: string[];

  constructor(
    private activatedRoute: ActivatedRoute,
    private router: Router,
    private userContextService: UserContextService,
    private myFlowService: MyFlowService,
    private dplHoldApiService: DplHoldApiService,
    private translateService: TranslateService,
    private toastService: ToastService,
    private confirmationService: ConfirmationService,
    private authApiService: AuthApiService,
    private myApplicationService: MyApplicationService,
    private loaderService: LoaderService,
    public integrateService: IntegrateService,
    public storeBatchEditEntryService: StoreBatchEditEntryService,
    private agentInfoTableService : AgentInfoTableService
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
        this.agentInfoTableService.setFormTypeId(this.formTypeId);
        this.integrateService.init(rsp.formTypeId);
        this.queryData = rsp;
        this.salesDept = this.queryData.salesDept;
        this.dplHoldApiService
          .getSalesDepts(this.queryData.salesCode, this.queryData.tenant)
          .subscribe({
            next: (rsp) => {
              // console.log('rsp body => ' + JSON.stringify(rsp));
              this.salesDepts = rsp.map(function (obj) {
                return { label: obj.dept.deptnameTw, value: obj.dept.deptId };
              });

              setTimeout(() => {
                rsp.forEach((element) => {
                  if (element.isPrimary === 'true') {
                    this.salesDept = element.dept.deptId;
                  }
                });
              });
            },
            error: (rsp) => {
              console.log('getSalesDepts error : ' + rsp);
              this.toastService.error('System.Message.Error');
            },
          });

        this.queryCosigner(this.cosignerFilter);

        this.whiteListFlag = this.queryData.addToWhiteList1 === 'Y' ? true : false;
        this.whiteListFlag2 = this.queryData.addToWhiteList2 === 'Y' ? true : false;
        this.whiteListFlag3 = this.queryData.addToWhiteList3 === 'Y' ? true : false;

        if (this.queryData.addressId1 != null && this.queryData.addressline1 != null) {
          this.displayBillTo = true;
          if (this.queryData.resultsStatus1 !== 'PASS') {
            this.displayBillToAddToWhiteList = true;
          }
        }

        if (this.queryData.addressId2 != null && this.queryData.addressline2 != null) {
          this.displayShipTo = true;
          if (this.queryData.resultsStatus2 !== 'PASS') {
            this.displayShipToAddToWhiteList = true;
          }
        }

        if (this.queryData.addressId3 != null && this.queryData.addressline3 != null) {
          this.displayDeliverTo = true;
          if (this.queryData.resultsStatus3 !== 'PASS') {
            this.displayDeliverToAddToWhiteList = true;
          }
        }

        // console.log('user====> ' + this.userContextService.user$.getValue().userCode);
        this.myFlowService.getFlowAuditLog(this.queryFormNo, this.formTypeId).subscribe({
          next: (rsp) => {
            // console.log('form log rsp: ' + JSON.stringify(rsp));
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
            rsp.forEach((element) => {
              if (element.status === 'Approving') {
                this.stepNumber = element.stepNumber;
              }

              if (
                element.status === 'Assignee' &&
                element.signerCode ===
                this.userContextService.user$.getValue().userCode
              ) {
                this.isAssigneeTask = true;
                this.action = 'resolve';
              }
            });
            let mRollBackFilter = rsp.filter((x) => x.status === 'Approving' || x.status === 'Assignee');
            let maxStepNumber = mRollBackFilter.reduce((op, item) => op = op > item.stepNumber ? op : item.stepNumber, 0)

            this.rollbackStepOptions = rsp
              .filter((x) => x.status === 'Approve' && x.stepNumber < maxStepNumber)
              .map(function (obj) {
                // console.log('Approve step : ' + JSON.stringify(obj));
                return {
                  label: 'Step.' + obj.stepNumber + ' : ' + obj.signerCode + ' ' + obj.signerNameEn + ' / ' + obj.signerNameCn,
                  value: obj.returnStep,
                };
              });

            // distinct
            this.rollbackStepOptions = this.rollbackStepOptions.filter(
              (thing, i, arr) => arr.findIndex((t) => t.value === thing.value) === i
            );
            // console.log('aduitLog: ' + JSON.stringify(this.historyData));
          },
          error: (rsp) => {
            console.log('getFlowAuditLog error :' + rsp);
            this.toastService.error('System.Message.Error');
          },
        });

        this.gteFormFile();

        this.historyCols = [
          { field: 'stepNumber', header: 'stepNumber' },
          { field: 'completeTime', header: 'Time' },
          // { field: 'authorizerCode', header: 'Authorizer Name' },
          { field: 'signerCode', header: 'Signer Name' },
          { field: 'signerDeptName', header: 'Dept' },
          { field: 'remark', header: 'Action' },
          { field: 'signComment', header: 'Opinion' },
          { field: 'signerPhoneNumber', header: 'Ext/Mobile' },
        ];

        this.fileCols = [
          { field: 'uploadDate', header: 'UploadDate' },
          { field: 'fileName', header: 'File Name' },
          { field: 'uploadName', header: 'User Name' },
          { field: 'delete', header: 'Action' },
        ];

        this.urlCols = [
          { field: 'uploadDate', header: 'UploadDate' },
          { field: 'url', header: 'Url' },
          { field: 'uploadName', header: 'User Name' },
          { field: 'delete', header: 'Action' },
        ];

        this.loginUserEmail = this.userContextService.user$.getValue().userEmail;

        this.checkPermissionApproveForm();

        this.getDplHoldApprovingActions();
      },
      error: (rsp) => {
        console.log('getDplHold error : ' + JSON.stringify(rsp));
        this.toastService.error('System.Message.Error');
      },
    });

  }

  private setBreadcrumbItems(): void {
    this.breadcrumbItems = this.translateService.instant(
      'BreadcrumbItems.Backstage'
    );
  }

  onUpload(event) {
    let filenames = [];
    for (let file of event.files) {
      filenames.push(file.name);
    }

    if (this.hasDuplicates(filenames)) {
      this.toastService.error('Duplicate filename');
      return;
    }

    this.loaderService.show();
    const multiUpload = {};
    let idx = 0;

    for (let file of event.files) {
      multiUpload[idx] = this.uploadSingle(file);
      idx++;
    }
    forkJoin(multiUpload).subscribe({
      next: (rsp) => {
        console.log(rsp);
        this.gteFormFile();
        this.displayAddFileOrLink = false;
        this.fileUpload.clear();
      },
      error: (rsp) => {
        this.loaderService.hide();
      }
    });
  }

  uploadSingle(file: any): Promise<any> {
    return new Promise((resolve, reject) => {
      this.myFlowService.uploadFile(this.queryData.formNo, file).subscribe({
        next: (rsp) => {
          const params = {
            formNo: this.queryData.formNo,
            fileId: rsp.fileId,
            fileName: rsp.fileName,
            filePath: rsp.filePath,
            formTypeId:this.formTypeId
          };
          this.myFlowService.addFormFile(params).subscribe({
            next: (rsp) => {
              this.toastService.success('File Uploaded.');
              resolve('File Uploaded.');
            },
            error: (rsp) => {
              console.log('uploadFile error : ' + JSON.stringify(rsp));
              this.toastService.error('System.Message.Error');
              reject('System.Message.Error');
            },
          });
        },
        error: (rsp) => {
          if (rsp?.status == 500 && rsp.error?.code) {
            let message = this.translateService.instant('DPL_Hold.Message.' + rsp.error?.code);
            this.toastService.error(file.name + ' ' + message);
            resolve(file.name + ' ' + message);
          } else {
            this.toastService.error('System.Message.Error');
            reject('System.Message.Error');
          }
        },
      });
    })
  }

  hasDuplicates<T>(arr: T[]): boolean {
    return new Set(arr).size < arr.length;
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

  delLink(target, i) {
    target.splice(i, 1);
  }

  addLink(target) {
    if (!this.isValidURL(this.linkList)) {
      this.validUrl = false;
      return;
    } else {
      this.validUrl = true;
    }
    if (this.linkList) {
      // target.unshift(this.linkList);
      this.url = this.linkList;
      this.linkList = '';
    }

    const params = {
      formNo: this.queryData.formNo,
      url: this.url,
      formTypeId:this.formTypeId
    };

    this.myFlowService.uploadFormFileUrl(params).subscribe({
      next: (rsp) => {
        // console.log('submit result : ' + JSON.stringify( rsp));
        this.toastService.success('Url Uploaded.');
        // this.messageService.add({ severity: 'Success', summary: 'Success', detail: 'File Uploaded.' });
        this.url = '';
        this.gteFormFile();
      },
      error: (rsp) => {
        console.log(rsp);
        this.toastService.error('System.Message.Error');
      },
    });
  }

  isValidURL(url: string): boolean {
    if (url === undefined || !url)
      return false;

    if (!url.startsWith('http://') && !url.startsWith('https://'))
      return false;

    var res = url.match(/(http(s)?:\/\/.)?(www\.)?[-a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_\+.~#?&//=]*)/g);
    return (res !== null)
  };

  async submitBtnClick(): Promise<void> {
    this.requiredSigner = false;
    if (this.action === 'addCosigner') {
      if (!this.signer) {
        this.requiredSigner = true;
        return;
      }
      this.cosigners = [];
      this.cosigners.push(this.signer.staffCode);
    } else if (this.action === 'addAssignee') {
      if (!this.signers || this.signers.length < 1) {
        this.requiredSigner = true;
        return;
      }
      this.cosigners = [];
      for (var emp of this.signers) {
        this.cosigners.push(emp.staffCode);
      }
    }

    const agentCheckRsp = await this.agentCheck();
    if (!agentCheckRsp){return;}

    this.confirmationService.confirm({
      header: this.translateService.instant('DPL_Hold.Label.Confirm'),
      message: this.translateService.instant('DPL_Hold.Label.ConfirmSubmit'),
      accept: () => {
        this.loaderService.show();
        const userCode = this.userContextService.user$.getValue().userCode;
        // console.log('userCode => ' + userCode);
        const params = {
          formNo: this.queryData.formNo,
          deptId: this.salesDept,
          whiteListFlag: this.whiteListFlag,
          whiteListFlag2: this.whiteListFlag2,
          whiteListFlag3: this.whiteListFlag3,
          action: this.action,
          cosigner: this.cosigners,
          comment: this.comment,
          tenant: this.queryData.tenant,
          ouCode: this.queryData.ouCode,
          activityId: this.rollbackStep,
          stepNumber: this.stepNumber,
          userCode: userCode,
        };

        console.log('param => ' + JSON.stringify(params));
        this.dplHoldApiService.workflowAction(params).subscribe({
          next: (rsp) => {
            this.storeBatchEditEntryService.postMessageToParent('Form Destroy');
            console.log('submit result : ' + JSON.stringify(rsp));
            this.toastService.success(this.translateService.instant('DPL_Hold.Message.SubmitSuccess'));
            // this.messageService.add({ severity: 'Success', summary: 'Success', detail: 'Approve.' });
            // this.router.navigate(['blacklistMgmt/dpl-success'], {
            //   queryParams: { queryFormNo: this.queryFormNo },
            // });
            window.location.href = environment.storeRedirectUrlPrefix + '?entryUrl=myforms/success&type=' + this.queryData.formNo + '&formTypeId=' + this.formTypeId;
          },
          error: (rsp) => {
            console.log('submit error : ' + JSON.stringify(rsp));
            // this.toastService.error('送出失敗!');
            this.toastService.error(rsp.error.message);
            this.router.navigate([this.router.url], { queryParams: {}, });
          },
        })
          .add(() => {
            this.loaderService.hide();
          });
      },
    });
  }


  cancelBtnClick() {
    // window.location.href = (environment.storeRedirectUrlPrefix + "?entryUrl=myforms/approval");
    // this.router.navigate(['applicationMgmt/pending'], { queryParams: {} });
    this.displaySubmitDetail = false;
    this.validUrl = true;
    this.linkList = undefined;
    this.displayAddFileOrLink = false;
  }

  deleteBtnClick(seq: number) {
    this.myFlowService.deleteFormFileOrUrl(seq).subscribe({
      next: (rsp) => {
        // console.log('submit result : ' + JSON.stringify( rsp));
        this.toastService.success('Delete Success.');
        // this.messageService.add({ severity: 'Success', summary: 'Success', detail: 'File Uploaded.' });
        this.url = '';
        this.gteFormFile();
      },
      error: (rsp) => {
        console.log('delete form file error : ' + JSON.stringify(rsp));
        this.toastService.error('System.Message.Error');
      },
    });
  }

  backBtnClick() {
    //window.location.href = (environment.storeRedirectUrlPrefix + "?entryUrl=myforms/approval")
    // this.router.navigate(['applicationMgmt/pending'], { queryParams: {} });
    if (this.backUrl !== null) {
      window.location.href = (environment.storeRedirectUrlPrefix + "?entryUrl=" + this.backUrl);
    } else {
      window.location.href = (environment.storeRedirectUrlPrefix + "?entryUrl=myforms/approval");
    }
  }

  filterChange(event) {
    let empdata = event.filter === '' ? '1' : event.filter;
    this.queryCosigner(empdata);
  }

  gteFormFile() {

    // 取得formFile
    this.myFlowService.getFormFile(this.queryFormNo,this.formTypeId).subscribe({
      next: (rsp) => {
        this.fileData = rsp;
        // console.log('fileData: ' + JSON.stringify(this.fileData));
        this.loaderService.hide();
      },
      error: (rsp) => {
        console.log(rsp);
        this.toastService.error('System.Message.Error');
        this.loaderService.hide();
      },
    });
  }

  queryCosigner(empData: string) {
    this.authApiService
      .getAllEmpByTenant(this.queryData.tenant, empData)
      .subscribe({
        next: (rsp) => {
          // console.log('getAllEmp body => ' + JSON.stringify(rsp.body));
          if (rsp.body !== undefined) {
            this.cosignerOptions = rsp.body.map(function (obj) {
              // console.log('Approve step : ' + JSON.stringify(obj));
              return {
                label: obj.staffCode + ' ' + obj.fullName + ' ' + obj.nickName,
                value: obj.staffCode,
              };
            });
          }
        },
        error: (rsp) => {
          console.log('getAllEmpByTenant error : ' + JSON.stringify(rsp));
          this.toastService.error('System.Message.Error');
        },
      });
  }

  async filterSigner(event) {

    let filtered: any[] = [];
    let query = event.query.replaceAll('/', '').replaceAll('%', '');
    if (query.length < 1) {
      this.filteredSigners = filtered;
      return;
    }

    let rsp = await lastValueFrom(
      this.authApiService.getAllEmpByTenant(this.queryData.tenant, query)
    );

    for (var emp of rsp.body) {
      emp.displaySigner = emp.staffCode + ' ' + emp.fullName + ' ' + emp.nickName;
      filtered.push(emp);
    }

    this.filteredSigners = filtered;

  }

  onBlurSigner(event) {
    // 沒選autoComplete的話.清空input內容
    if (this.signer === undefined || this.signer.staffCode === undefined) {
      this.signer = undefined;
    }
  }

  async checkPermissionApproveForm() {
    const model = JSON.parse('{}');
    model.tenant = this.userContextService.user$.getValue().tenant;
    model.staffCode = this.userContextService.user$.getValue().userCode;
    model.formNo = this.queryFormNo;
    model.formTypeId = this.formTypeId;
    let rsp = await lastValueFrom(this.myApplicationService.checkPermissionApproveForm(model));
    if (!rsp.approving) {
      let url = rsp.viewUrl;
      this.router.navigate([url], { queryParams: { queryFormNo: this.queryFormNo } });
      // window.location.href = (environment.storeRedirectUrlPrefix + "?entryUrl=myforms/approval");
    }
  }

  statusDesc(status) {
    return this.translateService.instant('DPL_Hold_Fail.statusDesc.' + status);
  }

  async getDplHoldApprovingActions() {
    let rsp = await lastValueFrom(this.dplHoldApiService.getDplHoldApprovingActions(this.queryFormNo));
    this.actionList = rsp.actionList;
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
      const element = document.getElementById('dplhold-approving-full-content');
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
  
  actionHistory = '';
  agentInfoArr = [];
  actionOnChange(){
    const actionChange = this.actionHistory !== this.action;
    if (actionChange){ this.agentInfoArr = [];} // 清空代理人資訊
    this.actionHistory = this.action;
  }

  onFieldSelectAlready() {
    this.agentInfoArr = [this.signer.staffCode];
  }

  addAssigneeOnSelect(){
    this.agentInfoArr = this.signers?.map((item:any)=>item.staffCode)
  }

  onAssigneeFieldKeyDown(event: KeyboardEvent, field: string){
    if (event.key == 'Backspace' || event.key == 'Delete') {
      this.agentInfoArr = this.signers?.map((item:any)=>item.staffCode)
    }
  }
  
  onCosignerKeyDownHandler(event: KeyboardEvent, field: string){
    if (event.key == 'Backspace' || event.key == 'Delete') {
      this.signer = "";
      this.agentInfoArr = [];
    }
  }
 
  agentCheck(){
    return new Promise((resolve, reject) => {
      const agents:string[] = [];
      this.agentInfoArr.forEach((userCode:any) => {
        const agentInfo = this.agentInfoTableService.getAgentInfo(userCode)
        if(agentInfo){agents.push(agentInfo?.userName);}
     }); 

     if (agents.length  === 0 ) {resolve(true)}
     else{
      this.confirmationService.confirm({
        message: agents.join(' , ') + this.translateService.instant('AgentInfoHint.Hint'),
        header: 'Confirm',
        icon: 'pi pi-exclamation-triangle',
        key: "agentCheckConfirmDialog",
        accept: () => { resolve(true);  },
        reject: () => {  resolve(false); }
      });
     } 
    });
  }

}
