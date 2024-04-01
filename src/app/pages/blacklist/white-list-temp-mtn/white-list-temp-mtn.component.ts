import { DateInputHandlerService } from './../../../core/services/date-input-handler.service';
import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { LazyLoadEvent, SelectItem } from 'primeng/api';
import { Table } from 'primeng/table';
import { Subscription } from 'rxjs';
import { DplBlackApiService } from 'src/app/core/services/dpl-black-api.service';
import { ToastService } from 'src/app/core/services/toast.service';
import { CommonApiService } from '../../../core/services/common-api.service';
import { LanguageService } from '../../../core/services/language.service';
import { LoaderService } from '../../../core/services/loader.service';
import { UserContextService } from './../../../core/services/user-context.service';
import { WhiteListTempMtnModifyRequest } from './bean/white-list-temp-mtn-modify-request';
import { WhiteListTempMtnQueryRequest } from './bean/white-list-temp-mtn-query-request';
import { TableStatusKeepService } from 'src/app/core/services/table-status-keep.service';

@Component({
  selector: 'app-white-list-temp-mtn',
  templateUrl: './white-list-temp-mtn.component.html',
  styleUrls: ['./white-list-temp-mtn.component.scss'],
})
export class WhiteListTempMtnComponent implements OnInit, OnDestroy {
  private onLangChange$: Subscription;
  private loginStateSubscription$: Subscription;

  @ViewChild('lazyTable') lazyTable: Table;

  @ViewChild('fileUpload') fileUpload: any;

  permissions: string[] = [];

  flagOptions: SelectItem[];
  flag2Options: SelectItem[];

  displayResult: boolean = false;

  displayDialog: boolean = false;
  dialogMsg: string;

  cols: any[];
  selectedCols: any[];

  data: any[];
  cloneData: any[];
  selectedData: any[];
  editData: any[];

  displayFilter: boolean = false;

  queryReq: WhiteListTempMtnQueryRequest = new WhiteListTempMtnQueryRequest();

  totalRecords: number;

  displayUpload: boolean = false;

  modifyStatus: boolean = false;

  isSuccess: boolean = false;

  displayEditTable: boolean = false;

  sortField: string;
  sortOrder: number;
  first: number = 0;

  globalFilter: string = '';

  constructor(
    private router: Router,
    private userContextService: UserContextService,
    private languageService: LanguageService,
    private translateService: TranslateService,
    private toastService: ToastService,
    private dplBlackApiService: DplBlackApiService,
    private commonApiService: CommonApiService,
    private loaderService: LoaderService,
    private dateInputHandlerService:DateInputHandlerService,
    public tableStatusKeepService : TableStatusKeepService
  ) {
    if (this.userContextService.user$.getValue) {
      this.permissions = this.userContextService.getMenuUrlPermission(
        this.router.url
      );
      console.log('permissions: ', this.permissions);
    }
    this.onLangChange$ = this.translateService.onLangChange.subscribe(() => {
      // this.setBreadcrumbItems();
      this.initOptions();
      this.initColumns();
      this.changeFilter();
      // 會trigger LAZY-TABLE的onLazyLoad event
      this.displayResult = true;
    });

    this.translateService
      .use(this.languageService.getLang())
      .subscribe((next) => {});
  }

  ngOnInit(): void {
    this.composeQueryReq();

    this.initOptions();

    this.flag2Options = [
      { label: 'Y', value: 'Y' },
      { label: 'N', value: 'N' },
    ];

    this.initColumns();

    this.changeFilter();

    //# TK-35854
    // 會trigger LAZY-TABLE的onLazyLoad event
    //this.displayResult = true;
  }

  initColumns() {
    this.cols = this.translateService.instant('WhiteListTempMtn.Columns');
  }

  initOptions() {
    this.flagOptions = this.translateService.instant(
      'WhiteListTempMtn.Options.flagOptions'
    );
  }

  /**
   * 查詢按鈕 Click 事件
   */
  searchBtnClick(): void {
    this.tableStatusKeepService.resetPageEvent();
    if (this.displayResult) {
      this.resetLazySort();
    } else {
      setTimeout(() => {
        this.displayResult = true;
      });
    }
  }

  downloadBtnClick(): void {
    this.queryReq.action = 'DOWNLOAD';
    this.loaderService.show();
    this.dplBlackApiService.whiteListTempMtnQuery(this.queryReq).subscribe({
      next: (rsp) => {
        this.queryReq.action = '';
        this.commonApiService.downloadFile(rsp.fileId);
      },
      error: (e) => {
        this.queryReq.action = '';
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

  async onLazyLoad(event: LazyLoadEvent) {
    await this.tableStatusKeepService.delay(1);

    event.first = this.tableStatusKeepService.get(this.tableStatusKeepService.tableStatusKeepEnum.PageEvent)?.first;
    event.rows = this.tableStatusKeepService.get(this.tableStatusKeepService.tableStatusKeepEnum.PageEvent)?.rows;
    this.queryReq.lazyLoadEvent = event;
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
      this.dplBlackApiService.whiteListTempMtnQuery(this.queryReq).subscribe({
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
    this.tableStatusKeepService.keep(this.tableStatusKeepService.tableStatusKeepEnum.PageEvent,event);
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

  resetBtnClick() {
    this.displayResult = false;
    this.selectedData = undefined;
    this.composeQueryReq();
    this.first = 0;
    this.sortField = undefined;
    this.sortOrder = undefined;
  }

  showFilter() {
    this.displayFilter = true;
  }

  changeFilter() {
    this.selectedCols = this.cols.filter((x) => {
      return x.isDefault;
    });
    if (this.permissions.includes('edit')) {
      this.selectedCols.unshift({
        field: 'checkbox',
        header: '',
        css: 'icon-col',
        maxWidth: '2%',
        textAlign: 'left',
      });
    }
  }

  resetFilter() {
    this.selectedCols = this.cols.filter((x) => {
      return x.isDefault;
    });
  }

  composeQueryReq() {
    this.queryReq = new WhiteListTempMtnQueryRequest();
    this.queryReq.tenant = this.userContextService.user$.getValue().tenant;
  }

  onChangeFlag(event): void {
    this.editData.forEach(function (data) {
      data.flag = event;
    });
  }

  onInputEndDate(event:InputEvent): void {
    this.dateInputHandlerService.concat(event.data);
  }

  onSelectEndDate(value): void {
    let displayDate = this.formatDate(value);

    this.editData.forEach(function (data) {
      data.displayEndDate = displayDate;
    });
  }


  onCloseEndDate(): void {
    if(this.dateInputHandlerService.getDate()){
      this.editData.forEach((data)=> {
        data.displayEndDate = this.formatDate(this.dateInputHandlerService.getDate());
      });
    }

    this.dateInputHandlerService.clean();
  }

  onClickFlag(event): void {
    let value = event.target.innerText;
    if (value === '') {
      return;
    }
    this.editData.forEach(function (data) {
      data.flag = value;
    });
  }

  onBlur(event): void {
    this.dateInputHandlerService.clean();
    let dateValue = event.target.value;
    var checkDate = dateValue.match(
      /^\d{4}\/(0?[1-9]|1[012])\/(0?[1-9]|[12][0-9]|3[01])$/
    );
    if (checkDate) {
      let displayDate = this.formatDate(dateValue);
      this.editData.forEach(function (data) {
        data.displayEndDate = displayDate;
      });
    } else {
      // this.toastService.warn('請輸入正確日期。(格式yyyy/mm/dd)');
    }
  }

  formatDate(date): string {
    var d = new Date(date),
      month = '' + (d.getMonth() + 1),
      day = '' + d.getDate(),
      year = d.getFullYear();

    if (month.length < 2) month = '0' + month;
    if (day.length < 2) day = '0' + day;

    return [year, month, day].join('/');
  }

  editInTable(): void {
    if (this.selectedData === undefined || this.selectedData.length < 1) {
      this.isSuccess = false;
      this.dialogMsg = this.translateService.instant(
        'Dialog.Message.SelectAtLeastOne'
      );
      this.displayDialog = true;
      return;
    }
    this.editData = JSON.parse(JSON.stringify(this.selectedData));
    this.displayResult = false;
    this.displayEditTable = true;
  }

  saveEditTable(): void {
    this.loaderService.show();
    let modifyReq = new WhiteListTempMtnModifyRequest();
    modifyReq.userEmail = this.userContextService.user$.getValue().userEmail;
    modifyReq.tenant = this.userContextService.user$.getValue().tenant;
    modifyReq.detailList = this.editData;

    this.dplBlackApiService.whiteListTempMtnModify(modifyReq).subscribe({
      next: (rsp) => {
        this.isSuccess = true;
        this.dialogMsg = this.translateService.instant(
          'Dialog.Message.SuccessfullySaved'
        );
        this.displayDialog = true;
        this.loaderService.hide();
        this.selectedData = undefined;
        this.editData = undefined;
        this.displayResult = true;
        this.displayEditTable = false;
      },
      error: (rsp) => {
        if (rsp) {
          console.log(rsp);
        }
        this.toastService.error('System.Message.Error');
        this.loaderService.hide();
      },
    });
  }

  cancelEditTable(): void {
    this.displayResult = true;
    this.displayEditTable = false;
  }

  uploadExcel(): void {
    this.displayUpload = true;
  }

  uploadHandler(event) {
    this.loaderService.show();
    const formData: FormData = new FormData();

    for (let file of event.files) {
      formData.append('file', file);
    }

    this.dplBlackApiService.whiteListTempMtnUpload(formData).subscribe({
      next: (rsp) => {
        this.loaderService.hide();
        this.isSuccess = true;
        this.dialogMsg = this.translateService.instant(
          'WhiteListTempMtn.Message.UploadSuccessfully'
        );
        this.displayDialog = true;
        this.fileUpload.clear();
      },
      error: (rsp) => {
        this.isSuccess = false;
        console.log(rsp);
        // if (rsp?.status == 500 && rsp.error?.code === ResponseCodeEnum.SAMPLE_OUT_BLANK) {
        if (rsp?.status == 500 && rsp.error?.code) {
          if (rsp.error?.errors && rsp.error.errors.length > 0) {
            this.dialogMsg = rsp.error.errors.join('\r\n');
          } else {
            this.dialogMsg = rsp.error?.message;
          }
          this.displayDialog = true;
        }
        this.loaderService.hide();
      },
    });
  }

  onUploadError(event) {
    console.error('onUploadError', event.error);
    // this.toastService.error('System.Message.Error');
    this.dialogMsg = 'System.Message.Error';
    this.displayDialog = true;
  }

  onHideUploadDialog(event: any) {
    this.fileUpload.clear();
  }

  downloadSample() {
    // db fileLog的fileId
    this.commonApiService.downloadFile(2);
  }


  selectedFileList:File[] =[]; // p-fileload target file array
  fileTypeLimit = '.xlsx';

  onDropHandler(event){ // for file drop
    this.selectedFileList = event.files;
  }

  onDropError(event){
    this.showDialog(event);
  }

  onFileSelect(event){  // for file select
    this.selectedFileList = [...this.selectedFileList]; // avoid to primeNG default list opt.
    const fileErrorHint = this.isAcceptFile(event.currentFiles[0],this.fileTypeLimit);
    if (fileErrorHint){
      this.showDialog(fileErrorHint)
      this.selectedFileList = [];
    }else{
      this.selectedFileList = event.currentFiles;
    }
  }

  private isAcceptFile(file:File,acceptFileType:string = '',maxFileSize:number = 40 * 1024 * 1024 ){
    const fileType = file.name?.split('.')?.pop() || '';
    const fileSizeAccept = file.size < maxFileSize ;
    const fileTypeAccept = acceptFileType.split(',').includes('.' + fileType) || acceptFileType === ''
    if (!fileSizeAccept){return 'SampleOutDPL.Message.FileSizeExceed'}
    if (!fileTypeAccept){return 'SampleOutDPL.Message.NotAllowThisUploadFileType'}
    return null;
  }

  private showDialog(label:string){
    this.dialogMsg = this.translateService.instant(label);
    this.displayDialog = true;
  }

  ngOnDestroy(): void {
    [this.onLangChange$, this.loginStateSubscription$].forEach(
      (subscription: Subscription) => {
        if (subscription != null || subscription != undefined)
          subscription.unsubscribe();
      }
    );
  }

   //#-----------------start------------------
  //# for date picker input format event

  onCheckDateHandler(): void {
    if (
      new Date(
        new Date(this.queryReq.startDate).setHours(0, 0, 0, 0)
      ).getTime() >=
      new Date(
        new Date(this.queryReq.endDate).setHours(23, 59, 59, 0)
      ).getTime()
    ) {
      this.queryReq.endDate = null;
    }
  }

  onDatePickerInput(event: InputEvent): void {
    this.dateInputHandlerService.concat(event.data);
  }

  onDatePickerSelectAndBlur(): void {
    this.dateInputHandlerService.clean();
  }

  onDatePickerClose(key:string): void {
    this.queryReq = {
      ...this.queryReq,
      [key]: this.dateInputHandlerService.getDate() ?? this.queryReq[key],
    };
    this.dateInputHandlerService.clean();
  }
  //#------------------end------------------
}
