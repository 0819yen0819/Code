import { DateInputHandlerService } from './../../../core/services/date-input-handler.service';
import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { TranslateService } from '@ngx-translate/core';
import { LazyLoadEvent, SelectItem } from 'primeng/api';
import { forkJoin, lastValueFrom, Observable, Subscription } from 'rxjs';

import { Router } from '@angular/router';
import { Table } from 'primeng/table';
import { CommonApiService } from '../../../core/services/common-api.service';
import { DplBlackApiService } from '../../../core/services/dpl-black-api.service';
import { DplCheckApiService } from '../../../core/services/dpl-check-api.service';
import { LanguageService } from '../../../core/services/language.service';
import { LicenseControlApiService } from '../../../core/services/license-control-api.service';
import { LoaderService } from '../../../core/services/loader.service';
import { ToastService } from '../../../core/services/toast.service';
import { UserContextService } from './../../../core/services/user-context.service';
import { EccnCheckRequest } from './bean/eccn-check-request';
import { OnlineRequestParty } from './bean/online-request-party';
import { PrecisioinOnlineRequest } from './bean/precision-online-request';
import { SampleOutLogQueryRequest } from './bean/sample-out-log-query-request';
import { SampleOutLogSaveRequest } from './bean/sample-out-log-save-request';
import { asciiValidator } from './validator/ascii-validator';

@Component({
  selector: 'app-sample-out-dpl',
  templateUrl: './sample-out-dpl.component.html',
  styleUrls: ['./sample-out-dpl.component.scss'],
})
export class SampleOutDPLComponent implements OnInit, OnDestroy {
  private onLangChange$: Subscription;
  private loginStateSubscription$: Subscription;

  countryOptions: SelectItem[];
  @ViewChild('lazyTable') lazyTable: Table;
  @ViewChild('fileUpload') fileUpload: any;

  displayResult = false;
  cols: any[];
  selectedCols: any[];
  data: any[];
  cloneData: any[];

  tenant: string;
  singleForm: FormGroup;
  formSubmitted: boolean = false;

  queryBaseDate: Date;
  startDate: Date;
  endDate: Date;

  precisionDisplayMsg: string;
  eccnDisplayMsg: string;

  displayDialog: boolean = false;
  dialogMsg: string;

  displayFilter = false;

  isSuccess: boolean = false;
  isEccnSuccess: boolean = false;
  isPrecisionSuccess: boolean = false;

  totalRecords: number;

  sortField: string;
  sortOrder: number;
  first: number = 0;

  globalFilter: string = '';

  constructor(
    private router: Router,
    private formBuilder: FormBuilder,
    private userContextService: UserContextService,
    private licenseControlApiService: LicenseControlApiService,
    private dplCheckApiService: DplCheckApiService,
    private dplBlackApiService: DplBlackApiService,
    private commonApiService: CommonApiService,
    private translateService: TranslateService,
    private toastService: ToastService,
    private languageService: LanguageService,
    private loaderService: LoaderService,
    private dateInputHandlerService: DateInputHandlerService
  ) {
    this.onLangChange$ = this.translateService.onLangChange.subscribe(() => {
      this.initColumns();
      this.changeFilter();
      this.initCountryOptions();
      this.doCountryQuery();
      this.loaderService.hide();
    });

    this.translateService
      .use(this.languageService.getLang())
      .subscribe((next) => {});
  }

  ngOnInit(): void {
    this.loginStateSubscription$ = this.userContextService.user$.subscribe(
      (res) => {
        // console.log(res);
      }
    );

    this.tenant = this.userContextService.user$.getValue().tenant;

    let myDate = new Date();
    this.queryBaseDate = new Date(
      myDate.getUTCFullYear(),
      myDate.getUTCMonth(),
      myDate.getUTCDate()
    );
    this.changeQueryDate(5);

    this.initColumns();

    this.data = [];

    this.singleForm = this.formBuilder.group({
      custNameE: ['', [Validators.required, asciiValidator()]],
      country: ['', Validators.required],
      addressLine: ['', [Validators.required, asciiValidator()]],
      eccn: ['', Validators.required],
    });

    this.changeFilter();

    this.initCountryOptions();

    this.doCountryQuery();
    this.loaderService.hide();
  }

  initColumns() {
    this.cols = this.translateService.instant('SampleOutDPL.Columns');
  }

  initCountryOptions() {
    this.countryOptions = [];
    this.countryOptions.push.apply(
      this.countryOptions,
      this.translateService.instant('SampleOutDPL.Options.countryOptions')
    );
  }

  async doCountryQuery() {
    let rsp = await lastValueFrom(this.commonApiService.countryQuery());
    for (var country of rsp.countryList) {
      this.countryOptions.push({
        label: country.displayCountry,
        value: country.shortCode,
      });
    }
  }

  uploadHandler(event) {
    this.loaderService.show();
    const formData: FormData = new FormData();

    for (let file of event.files) {
      formData.append('file', file);
    }

    this.dplBlackApiService.multiCheck(formData).subscribe({
      next: (rsp) => {
        this.loaderService.hide();
        this.isSuccess = true;
        //上傳檔案成功，結果會透過mail發送
        this.dialogMsg = this.translateService.instant(
          'SampleOutDPL.Message.UploadSuccessfully'
        );
        this.displayDialog = true;
        this.fileUpload.clear();
      },
      error: (rsp) => {
        this.isSuccess = false;
        console.log(rsp);
        // if (rsp?.status == 500 && rsp.error?.code === ResponseCodeEnum.SAMPLE_OUT_BLANK) {
        if (rsp?.status == 500 && rsp.error?.code) {
          this.dialogMsg = rsp.error?.message;
          this.displayDialog = true;
        }
        this.loaderService.hide();
      },
    });
  }

  onUploadError(event) {
    console.error('onUploadError', event.error);
    this.dialogMsg = 'System.Message.Error';
    this.displayDialog = true;
  }

  private async doPrecisionOnline(): Promise<any> {
    let asyncResult = await lastValueFrom(
      this.commonApiService.generateIdList('PrecisionAddressId', 2)
    );

    let precisionOnlineReq = new PrecisioinOnlineRequest();

    precisionOnlineReq.sourceReferenceKey1 =
      this.singleForm.get('country').value;
    precisionOnlineReq.sourceReferenceKey2 = this.tenant + asyncResult.ids[0];
    precisionOnlineReq.tenant = this.tenant;
    let party = new OnlineRequestParty();
    party.partyId = this.tenant + asyncResult.ids[1];
    party.custNameE = this.singleForm.get('custNameE').value.substr(0, 80);
    party.addressLine = this.singleForm.get('addressLine').value.substr(0, 120);
    party.country = this.singleForm.get('country').value;
    precisionOnlineReq.parties.push(party);
    return await lastValueFrom(
      this.dplCheckApiService.precisionOnline(precisionOnlineReq)
    );
  }

  private doSingleQuery(): Observable<any> {
    let eccnCheckReq = new EccnCheckRequest();
    eccnCheckReq.eccn = this.singleForm.get('eccn').value;
    eccnCheckReq.tenant = this.tenant;

    const precisionOnline = this.doPrecisionOnline();
    const eccnCheck = this.licenseControlApiService.eccnCheck(eccnCheckReq);

    return forkJoin([precisionOnline, eccnCheck]);
  }

  onSingleFormSubmit() {
    this.formSubmitted = true;
    if (this.singleForm.invalid) {
      return;
    }

    this.loaderService.show();

    this.doSingleQuery().subscribe({
      next: (rsp) => {
        if (rsp) {
          let precisionRes = rsp[0];
          let eccnRes = rsp[1];
          let sampleOutLogSaveReq = new SampleOutLogSaveRequest();
          sampleOutLogSaveReq.tenant = this.tenant;
          sampleOutLogSaveReq.userCode =
            this.userContextService.user$.getValue().userCode;
          sampleOutLogSaveReq.userName =
            this.userContextService.user$.getValue().userName;
          sampleOutLogSaveReq.userNameE =
            this.userContextService.user$.getValue().userNameE;
          sampleOutLogSaveReq.custNameE =
            this.singleForm.get('custNameE').value;
          sampleOutLogSaveReq.country = this.singleForm.get('country').value;
          sampleOutLogSaveReq.addressLine =
            this.singleForm.get('addressLine').value;
          sampleOutLogSaveReq.resultsStatus = precisionRes.resultsStatus;
          sampleOutLogSaveReq.eccn = this.singleForm.get('eccn').value;
          sampleOutLogSaveReq.exportFlag = eccnRes.exportFlag;
          sampleOutLogSaveReq.runNumber = precisionRes.runNumber;
          lastValueFrom(
            this.dplBlackApiService.sampleOutLogSave(sampleOutLogSaveReq)
          );

          if (
            precisionRes.resultsStatus == 'PASS' &&
            eccnRes.exportFlag == 'N'
          ) {
            this.isSuccess = true;
            this.dialogMsg = '檢核正常, 可進行出貨';
            this.displayDialog = true;
          }

          if (
            precisionRes.resultsStatus !== 'PASS' ||
            eccnRes.exportFlag == 'Y'
          ) {
            this.isSuccess = false;
            this.dialogMsg =
              '不可出貨, 請聯繫TCSU(Feeling Hung, ext. 85252)';
            this.displayDialog = true;
          }

          if (eccnRes.exportFlag == 'Y') {
            this.isEccnSuccess = false;
            this.eccnDisplayMsg =
              '此為管制料號, 不可出貨! 必須聯繫控股貿易合規服務處(Feeling Hung, ext. 85252)';
          } else {
            this.isEccnSuccess = true;
            this.eccnDisplayMsg = '非管制料號';
          }

          if (precisionRes.resultsStatus == 'PASS') {
            this.isPrecisionSuccess = true;
            this.precisionDisplayMsg =
              '非管制名單客戶/ Compliance run number: ' +
              precisionRes.runNumber;
          } else {
            this.isPrecisionSuccess = false;
            this.precisionDisplayMsg =
              '此客戶疑似管制名單不可出貨! 必須聯繫控股貿易合規服務處Compliance run number: ' +
              precisionRes.runNumber +
              '(Feeling Hung, ext. 85252)';
          }
        }
        this.loaderService.hide();
      },
      error: (rsp) => {
        if (rsp) {
          console.log(rsp);
        }
        this.loaderService.hide();
        this.toastService.error('System.Message.Error');
      },
    });
  }

  onSingleFormReset() {
    this.formSubmitted = false;
    this.singleForm.reset();
    this.precisionDisplayMsg = '';
    this.eccnDisplayMsg = '';
  }

  onLogFormSubmit() {
    if (this.displayResult) {
      this.resetLazySort();
    } else {
      setTimeout(() => {
        this.displayResult = true;
      });
    }
  }

  onLogFormReset() {
    this.displayResult = false;
    this.data = [];
    this.changeQueryDate(5);
    this.first = 0;
    this.sortField = undefined;
    this.sortOrder = undefined;
  }

  downloadBtnClick(): void {
    let req = new SampleOutLogQueryRequest();
    req.action = 'DOWNLOAD';
    req.tenant = this.tenant;
    req.userCode = this.userContextService.user$.getValue().userCode;
    req.startDate = this.startDate;
    req.endDate = this.endDate;
    req.permissionCode = this.userContextService.getMenuUrlPermission(
      this.router.url
    );

    this.loaderService.show();
    this.dplBlackApiService.sampleOutLogQuery(req).subscribe({
      next: (rsp) => {
        req.action = '';
        this.commonApiService.downloadFile(rsp.fileId);
      },
      error: (e) => {
        console.error(e);
        this.loaderService.hide();
        this.toastService.error('System.Message.Error');
      },
    });
  }

  filterLazy(globalFilter: string) {
    this.data = [];
    for (var i = 0; i < this.cloneData.length; i++) {
      for (var j = 0; j < this.selectedCols.length; j++) {
        try {
          if (this.cloneData[i][this.selectedCols[j].field] === undefined)
            continue;
          var value = this.cloneData[i][this.selectedCols[j].field];
          if (value.toLowerCase().indexOf(globalFilter.toLowerCase()) !== -1) {
            this.data.push(this.cloneData[i]);
            break;
          }
        } catch (e) {
          console.log(e);
        }
      }
    }
    return;
  }

  onLazyLoad(event: LazyLoadEvent) {
    let req = new SampleOutLogQueryRequest();
    req.tenant = this.tenant;
    req.userCode = this.userContextService.user$.getValue().userCode;
    req.startDate = this.startDate;
    req.endDate = this.endDate;
    req.permissionCode = this.userContextService.getMenuUrlPermission(
      this.router.url
    );
    req.lazyLoadEvent = event;

    if (
      event &&
      event.sortField &&
      this.lazyTable &&
      this.data &&
      (event.sortField !== this.sortField || event.sortOrder !== this.sortOrder)
    ) {
      this.data = this.sortArrayData(
        this.data,
        event.sortField,
        event.sortOrder
      );
      this.lazyTable.first = this.first;
      return;
    }
    setTimeout(() => {
      this.loaderService.show();
      this.dplBlackApiService.sampleOutLogQuery(req).subscribe({
        next: (rsp) => {
          this.data = rsp.resultList;
          this.cloneData = rsp.resultList;
          this.filterLazy(this.globalFilter);
          this.totalRecords = rsp.totalRecords;
          this.displayResult = true;
          this.loaderService.hide();
          this.data = this.sortArrayData(
            this.data,
            event.sortField,
            event.sortOrder
          );
        },
        error: (e) => {
          console.error(e);
          this.loaderService.hide();
          this.toastService.error('System.Message.Error');
        },
      });
    });
  }

  onSort(event) {
    this.sortField = event.field;
    this.sortOrder = event.order;
  }

  onPage(event) {
    this.first = event.first;
  }

  resetLazySort() {
    this.lazyTable.sortOrder = undefined;
    this.lazyTable.sortField = undefined;
    this.lazyTable.first = 0;
    this.lazyTable.rows = 10;
    this.lazyTable.reset();
  }

  sortArrayData(arrayData: any[], field: string, sort: number) {
    if (arrayData && field && sort) {
      if (sort && sort == 1) {
        return arrayData.sort((a, b) =>
          (a[field] != null ? a[field] : '') <
          (b[field] != null ? b[field] : '')
            ? -1
            : 1
        );
      } else {
        return arrayData.sort((a, b) =>
          (a[field] != null ? a[field] : '') >
          (b[field] != null ? b[field] : '')
            ? -1
            : 1
        );
      }
    }
    return arrayData;
  }

  changeQueryDate(type: number) {
    switch (type) {
      // today
      case 1: {
        this.startDate = new Date(this.queryBaseDate);
        this.endDate = new Date(this.queryBaseDate);
        break;
      }
      // last week
      case 2: {
        this.startDate = new Date(this.queryBaseDate);
        this.startDate.setDate(this.startDate.getDate() - 7);
        this.endDate = new Date(this.queryBaseDate);
        break;
      }
      // this month
      case 3: {
        this.startDate = new Date(
          this.queryBaseDate.getFullYear(),
          this.queryBaseDate.getMonth(),
          1
        );
        this.endDate = new Date(
          this.queryBaseDate.getFullYear(),
          this.queryBaseDate.getMonth() + 1,
          0
        );
        break;
      }
      // last month
      case 4: {
        this.startDate = new Date(
          this.queryBaseDate.getFullYear(),
          this.queryBaseDate.getMonth() - 1,
          1
        );
        this.endDate = new Date(
          this.queryBaseDate.getFullYear(),
          this.queryBaseDate.getMonth(),
          0
        );
        break;
      }
      // last 6 month
      case 5: {
        this.startDate = new Date(
          this.queryBaseDate.getFullYear(),
          this.queryBaseDate.getMonth() - 6,
          this.queryBaseDate.getDate()
        );
        this.endDate = new Date(this.queryBaseDate);
        break;
      }
    }
  }

  downloadSample() {
    // db fileLog的fileId
    this.commonApiService.downloadFile(1);
  }

  showFilter() {
    this.displayFilter = true;
  }

  changeFilter() {
    this.selectedCols = this.cols.filter((x) => {
      return x.isDefault;
    });
  }

  ngOnDestroy(): void {
    [this.onLangChange$, this.loginStateSubscription$].forEach(
      (subscription: Subscription) => {
        if (subscription != null || subscription != undefined)
          subscription.unsubscribe();
      }
    );
  }

  get singleF() {
    return this.singleForm.controls;
  }

  selectedFileList: File[] = []; // p-fileload target file array
  fileTypeLimit: string = '.xlsx,.csv,.xls';

  onDropHandler(event) {
    // for file drop
    this.selectedFileList = event.files;
  }

  onDropError(event) {
    this.showDialog(event);
  }

  onFileSelect(event) {
    // for file select
    this.selectedFileList = [...this.selectedFileList]; // avoid to primeNG default list opt.
    const fileErrorHint = this.isAcceptFile(
      event.currentFiles[0],
      this.fileTypeLimit
    );
    if (fileErrorHint) {
      this.showDialog(fileErrorHint);
      this.selectedFileList = [];
    } else {
      this.selectedFileList = event.currentFiles;
    }
  }

  private isAcceptFile(
    file: File,
    acceptFileType: string = '',
    maxFileSize: number = 40 * 1024 * 1024
  ) {
    const fileType = file.name?.split('.')?.pop() || '';
    const fileSizeAccept = file.size < maxFileSize;
    const fileTypeAccept =
      acceptFileType.split(',').includes('.' + fileType) ||
      acceptFileType === '';
    if (!fileSizeAccept) {
      return 'SampleOutDPL.Message.FileSizeExceed';
    }
    if (!fileTypeAccept) {
      return 'SampleOutDPL.Message.NotAllowThisUploadFileType';
    }
    return null;
  }

  private showDialog(label: string) {
    this.dialogMsg = this.translateService.instant(label);
    this.displayDialog = true;
  }

  //#-----------------start------------------
  //# for date picker input format event

  onCheckDateHandler(): void {
    if (
      new Date(this.startDate).getTime() >= new Date(this.endDate).getTime()
    ) {
      this.endDate = null;
    }
  }

  onDatePickerInput(event: InputEvent): void {
    this.dateInputHandlerService.concat(event.data);
  }

  onDatePickerSelectAndBlur(): void {
    this.dateInputHandlerService.clean();
  }

  onDatePickerClose(key: 'startDate' | 'endDate'): void {
    if (key === 'startDate') {
      this.startDate = this.dateInputHandlerService.getDate() ?? this.startDate;
    } else {
      this.endDate = this.dateInputHandlerService.getDate() ?? this.endDate;
    }
    this.dateInputHandlerService.clean();
  }
  //#------------------end------------------
}
