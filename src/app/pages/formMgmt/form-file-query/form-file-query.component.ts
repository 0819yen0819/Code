import { DateInputHandlerService } from './../../../core/services/date-input-handler.service';
import { Component, OnInit, ViewChild } from '@angular/core';
import { Table } from 'primeng/table';
import { LazyLoadEvent, SelectItem } from 'primeng/api';
import { TranslateService } from '@ngx-translate/core';
import { ToastService } from 'src/app/core/services/toast.service';
import { lastValueFrom, Subscription } from 'rxjs';
import { Router } from '@angular/router';
import { UserContextService } from 'src/app/core/services/user-context.service';
import { FormFileQueryRequest } from './bean/form-file-query-request';
import { MyApplicationService } from 'src/app/core/services/my-application.service';
import { LanguageService } from 'src/app/core/services/language.service';
import { LoaderService } from 'src/app/core/services/loader.service';
import { MyFlowService } from 'src/app/core/services/my-flow.service';
import { AuthApiService } from 'src/app/core/services/auth-api.service';

@Component({
  selector: 'app-form-file-query',
  templateUrl: './form-file-query.component.html',
  styleUrls: ['./form-file-query.component.scss']
})
export class FormFileQueryComponent implements OnInit {

  @ViewChild('lazyTable') lazyTable: Table;

  private onLangChange$: Subscription;

  permissions: string[] = [];
  formNameOptions: SelectItem[];

  displayFilter = false;
  cols: any[];
  selectedCols: any[];

  data: any[];
  cloneData: any[];
  totalRecords: number;
  displayResult = false;

  queryReq: FormFileQueryRequest = new FormFileQueryRequest();

  sortField: string;
  sortOrder: number;
  first: number = 0;
  globalFilter: string = '';

  selectedEmp: any;
  filteredEmps: any[];

  formTypePermissionList: any[];

  constructor(
    private router: Router,
    private translateService: TranslateService,
    private toastService: ToastService,
    private loaderService: LoaderService,
    private myApplicationService: MyApplicationService,
    private myFlowService: MyFlowService,
    private authApiService: AuthApiService,
    private languageService: LanguageService,
    private userContextService: UserContextService,
    private dateInputHandlerService:DateInputHandlerService
  ) {
    if (this.userContextService.user$.getValue) {
      this.permissions = this.userContextService.getMenuUrlPermission(this.router.url);
      console.log('permissions: ', this.permissions);
    }
    this.onLangChange$ = this.translateService.onLangChange.subscribe(() => {
      this.initTranslateCharacter();
      this.changeFilter();
      this.doQueryFormType();
    })

  }

  async ngOnInit() {
    this.initTranslateCharacter();
    this.changeFilter();
    await this.doQueryFormType();
    //# TK-35854
    // this.composeQueryReq();
    // this.displayResult = true;

  }

  initTranslateCharacter() {
    this.cols = this.translateService.instant('FormFileQuery.Columns');
  }

  resetBtnClick() {
    this.displayResult = false;
    this.composeQueryReq();
  }

  composeQueryReq() {
    this.queryReq = new FormFileQueryRequest();
    this.queryReq.formTypePermissionList = this.formTypePermissionList;
    let myDate = new Date();
    this.queryReq.tenant = this.userContextService.user$.getValue().tenant;
    this.queryReq.endDate = new Date(myDate.getUTCFullYear(), myDate.getUTCMonth(), myDate.getUTCDate());
    this.queryReq.startDate = new Date(this.queryReq.endDate.getFullYear(), this.queryReq.endDate.getMonth() - 3, this.queryReq.endDate.getDate());
    // this.queryReq.uploadBy = this.userContextService.user$.getValue().userEmail;

    this.selectedEmp = JSON.parse('{}');
    // this.selectedEmp.staffCode = this.userContextService.user$.getValue().userCode;
    // this.selectedEmp.fullName = this.userContextService.user$.getValue().userName;
    // this.selectedEmp.nickName = this.userContextService.user$.getValue().userNameE;
    // this.selectedEmp.email = this.userContextService.user$.getValue().userEmail;
    // this.selectedEmp.displayName = this.selectedEmp.staffCode + '/' + this.selectedEmp.fullName + '/' + this.selectedEmp.nickName;

  }

  searchBtnClick(): void {
    this.composeQueryReq();
    this.composeAutoCompleteReq();

    if (this.displayResult) {
      this.resetLazySort();
    } else {
      setTimeout(() => {
        this.displayResult = true;
      });
    }
  }

  composeAutoCompleteReq() {
    if (this.selectedEmp !== undefined)
      this.queryReq.uploadBy = this.selectedEmp.email;

  }

  onLazyLoad(event: LazyLoadEvent) {
    this.queryReq.lazyLoadEvent = event;
    if (event && event.sortField && this.lazyTable && this.data && (event.sortField !== this.sortField || event.sortOrder !== this.sortOrder)) {
      this.data = this.sortArrayData(this.data, event.sortField, event.sortOrder);
      this.lazyTable.first = this.first;
      return;
    }
    setTimeout(() => {
      this.loaderService.show();
      this.myApplicationService.formFileQuery(this.queryReq).subscribe({
        next: (rsp) => {
          this.data = rsp.resultList;
          this.cloneData = rsp.resultList;
          this.filterLazy(this.globalFilter);
          this.totalRecords = rsp.totalRecords;
          this.displayResult = true;
          this.loaderService.hide();
          this.data = this.sortArrayData(this.data, event.sortField, event.sortOrder);
        },
        error: (e) => {
          console.error(e);
          this.loaderService.hide();
          this.toastService.error('System.Message.Error');
        }
      });
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
          if ((value.toLowerCase()).indexOf(globalFilter.toLowerCase()) !== -1) {
            this.data.push(this.cloneData[i]);
            break;
          }
        } catch (e) { console.log(e) };
      }
    }
    return;
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
        return arrayData.sort((a, b) => ((a[field] != null ? a[field] : '') < (b[field] != null ? b[field] : '') ? -1 : 1));
      } else {
        return arrayData.sort((a, b) => ((a[field] != null ? a[field] : '') > (b[field] != null ? b[field] : '') ? -1 : 1));
      }
    }
    return arrayData;
  }

  showFilter() {
    this.displayFilter = true;
  }

  changeFilter() {
    this.selectedCols = this.cols.filter(x => { return x.isDefault; });
  }

  async doQueryFormType() {
    const model = JSON.parse('{}');
    model.tenant = this.userContextService.user$.getValue().tenant;
    model.email = this.userContextService.user$.getValue().userEmail;
    model.staffCode = this.userContextService.user$.getValue().userCode;
    model.permissionType = 'SEARCH';
    let rsp = await lastValueFrom(this.myApplicationService.getAuthFormTypes(model));
    this.formTypePermissionList = rsp.formTypePermissionList;

    if (this.languageService.getLang() === 'zh-tw') {
      this.formNameOptions = rsp.formTypePermissionList.map(function (obj) {
        return { label: obj.formTypeNameC, value: obj.formTypeId };
      });
    } else {
      this.formNameOptions = rsp.formTypePermissionList.map(function (obj) {
        return { label: obj.formTypeNameE, value: obj.formTypeId };
      });
    }
  }

  viewPage(url: string, formNo: string) {
    this.router.navigate([url], { queryParams: { queryFormNo: formNo, backUrl: 'formMgmt/form-file-query' } });
    // this.router.navigate([url], { queryParams: { queryFormNo: formNo } });
    return false;
  }

  downloadFile(seq: number) {
    let url = this.myFlowService.downloadFile(seq);
    return false;
  }

  async filterEmp(event) {

    let filtered: any[] = [];
    let query = event.query.replaceAll('/', '');

    let rsp = await lastValueFrom(this.authApiService.getAllEmpByTenant(this.queryReq.tenant, query));
    for (var emp of rsp.body) {
      emp.displayName = emp.staffCode + '/' + emp.fullName + '/' + emp.nickName;
      filtered.push(emp);
    }

    this.filteredEmps = filtered;
  }

  onBlurEmp(event) {

    // 沒選autoComplete的話.清空input內容
    if (this.selectedEmp === undefined || this.selectedEmp.email === undefined) {
      this.selectedEmp = undefined;
      this.queryReq.uploadBy = undefined;
    }
  }

  ngOnDestroy(): void {
    [
      this.onLangChange$
    ].forEach((subscription: Subscription) => {
      if (subscription != null || subscription != undefined)
        subscription.unsubscribe();
    });
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

  onDatePickerClose(key: string): void {
    this.queryReq = {
      ...this.queryReq,
      [key]: this.dateInputHandlerService.getDate() ?? this.queryReq[key],
    };
    this.dateInputHandlerService.clean();
  }
  //#------------------end------------------
}
