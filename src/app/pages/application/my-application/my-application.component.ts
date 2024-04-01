import { DatePipe } from '@angular/common';
import { AfterViewInit, ChangeDetectorRef, Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { LazyLoadEvent, MenuItem, SelectItem } from 'primeng/api';
import { Table } from 'primeng/table';
import { lastValueFrom, Subscription } from 'rxjs';
import { AuthApiService } from 'src/app/core/services/auth-api.service';
import { LanguageService } from 'src/app/core/services/language.service';
import { ToastService } from 'src/app/core/services/toast.service';
import { CommonApiService } from '../../../core/services/common-api.service';
import { LoaderService } from '../../../core/services/loader.service';
import { MyApplicationQueryParam } from '../bean/my-application-query-param';
import { MyApplicationQueryRequest } from '../bean/my-application-query-request';
import { TrackFormLogQueryRequest } from '../bean/track-form-log-query-request';
import { MyApplicationService } from './../../../core/services/my-application.service';
import { UserContextService } from './../../../core/services/user-context.service';

@Component({
  selector: 'app-my-application',
  templateUrl: './my-application.component.html',
  styleUrls: ['./my-application.component.scss'],
})
export class MyApplicationComponent implements OnInit, OnDestroy, AfterViewInit {
  private onLangChange$: Subscription;

  @ViewChild('lazyTable') lazyTable: Table;
  @ViewChild('lazyTableTrackForm') lazyTableTrackForm: Table;

  permissions: string[] = [];

  formName: string;
  status: string;
  formNo: string;
  startDate: Date = new Date();
  endDate: Date = new Date();

  cols: any[];
  colFuncs: any[];
  selectedCols: any[];
  data: any[];
  cloneData: any[];
  displayFilterDetail = false;
  breadcrumbItems: MenuItem[];
  formNameOptions: SelectItem[];
  statusOptions: SelectItem[];

  queryReq: MyApplicationQueryRequest = new MyApplicationQueryRequest();
  totalRecords: number;

  sortField: string;
  sortOrder: number;
  first: number = 0;
  globalFilter: string = '';

  selectedData: any[];
  displayResult: boolean = false;

  displayDelDialog = false;
  delFormNo: string;
  statusDesc: any;

  searchType: string;
  searchTypeOptions: SelectItem[];
  trackFormFormTypeId: string;
  trackFormFormNameOptions: SelectItem[];
  trackFormFormNo: string;
  trackFormStartDate: Date = new Date();
  trackFormEndDate: Date = new Date();
  trackFormStatus: string;
  trackFormStatusOptions: SelectItem[];
  trackFormSubject: string;
  trackFormCols: any[];
  selectedTrackFormCols: any[];
  trackFormData: any[];
  trackFormCloneData: any[];
  trackFormTotalRecords: number;
  trackFormSortField: string;
  trackFormSortOrder: number;
  trackFormFirst: number = 0;
  trackFormGlobalFilter: string = '';
  trackFormDisplayResult: boolean = false;
  trackFormSelectedData: any[];
  displayFilterDetailTrackForm = false;
  trackFormApplicant: string;
  trackFormApplicantOptions: SelectItem[];
  trackFormOwner: string;
  trackFormOwnerOptions: SelectItem[];
  trackFormSelectedApplicant: any;
  trackFormFilteredApplicants: any[];
  trackFormSelectCorps: any[];
  trackFormFilteredCorps: any[];
  formTypePermissionList: any[];
  applicantList: any[];
  ownerList: any[];
  queryReqTrackForm: TrackFormLogQueryRequest = new TrackFormLogQueryRequest();
  trackFormApplicantRequired = false;
  trackFormOwnerRequired = false;
  trackFormAPreviousSearchType: string;
  trackFormKeywords: string[];

  constructor(
    private router: Router,

    private userContextService: UserContextService,
    private myApplicationService: MyApplicationService,
    private translateService: TranslateService,
    private toastService: ToastService,
    private datePipe: DatePipe,
    private commonApiService: CommonApiService,
    private languageService: LanguageService,
    private loaderService: LoaderService,
    private authApiService: AuthApiService,
    private changeDetectorRef: ChangeDetectorRef,
  ) {
    if (this.userContextService.user$.getValue) {
      this.permissions = this.userContextService.getMenuUrlPermission(
        this.router.url
      );
      console.log('permissions: ', this.permissions);
    }
    this.onLangChange$ = this.translateService.onLangChange.subscribe(() => {
      this.setBreadcrumbItems();
      this.initColumns();
      this.changeFilterDetail();
      this.initOptions();
      this.onChangeSearchType('');
    });

    let today = new Date();
    this.endDate = new Date(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate());
    this.startDate = new Date(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate());
    this.startDate.setMonth(this.startDate.getMonth() - 6);
    this.setBreadcrumbItems();
    this.trackFormEndDate = new Date(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate());
    this.trackFormStartDate = new Date(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate());
    this.trackFormStartDate.setMonth(this.trackFormStartDate.getMonth() - 12);
  }

  ngOnInit(): void {
    this.composeQueryReq();

    // 會trigger LAZY-TABLE的onLazyLoad event
    this.displayResult = true;

    this.myApplicationService.getFormTypes().subscribe({
      next: (rsp) => {
        // console.log('rsp: ' + rsp);

        this.formNameOptions = rsp.map(function (obj) {
          // console.log(obj);
          return { label: obj.formTypeNameE, value: obj.formTypeNameE };
        });
      },
      error: (rsp) => {
        console.log(rsp);
        this.toastService.error('System.Message.Error');
      },
    });

    // this.statusOptions = [
    //   { label: 'Please Choose', value: '' },
    //   { label: 'Draft', value: 'Draft' },
    //   { label: 'Approving', value: 'Approving' },
    //   { label: 'Approve', value: 'Approve' },
    //   { label: 'Reject', value: 'Reject' },
    // ];
    this.initOptions();

    this.initColumns();

    this.resetFilterDetail();
    this.changeFilterDetail();
    this.searchBtnClick();
    this.searchType = 'General';
    this.trackFormStatus = 'Approving';
    this.initOptions();
    this.onChangeSearchType('');
    // this.trackFormSelectedApplicant = JSON.parse('{}');
    // this.trackFormSelectedApplicant.staffCode = this.userContextService.user$.getValue().userCode;
    // this.trackFormSelectedApplicant.fullName = this.userContextService.user$.getValue().userName;
    // this.trackFormSelectedApplicant.nickName = this.userContextService.user$.getValue().userNameE;
    // this.trackFormSelectedApplicant.email = this.userContextService.user$.getValue().userEmail;
    // this.trackFormSelectedApplicant.displayName = this.trackFormSelectedApplicant.staffCode + '/' + this.trackFormSelectedApplicant.fullName + '/' + this.trackFormSelectedApplicant.nickName;
    // this.searchBtnClickTrackForm();
  }

  composeQueryReq() {
    this.queryReq = new MyApplicationQueryRequest();
    this.queryReq.params = new MyApplicationQueryParam();
    this.queryReq.params.tenant =
      this.userContextService.user$.getValue().tenant;
    this.selectedData = undefined;
  }

  composeQueryReqTrackForm() {
    this.queryReqTrackForm = new TrackFormLogQueryRequest();

  }

  initColumns() {
    this.cols = this.translateService.instant('MyApplication.Columns');
    this.colFuncs = this.translateService.instant(
      'MyApplication.ColumnFunctions'
    );
    // this.colFuncs = this.colFuncs.filter((x) =>
    //   this.permissions.includes(x.field)
    // );
    this.trackFormCols = this.translateService.instant('MyApplication.TrackFormColumns');
  }

  /**
   * 查詢按鈕 Click 事件
   */
  searchBtnClick(): void {
    const userEmail = this.userContextService.user$.getValue().userEmail;
    // const params = {
    //   "params": {
    //     userCode: userEmail,
    //     endDate: this.endDate == null ? null : this.datePipe.transform(this.endDate, 'yyyy/MM/dd'),
    //     formName: this.formName,
    //     formNo: this.formNo,
    //     startDate: this.startDate == null ? null : this.datePipe.transform(this.startDate, 'yyyy/MM/dd'),
    //     status: this.status
    //   }
    // };

    // this.myApplicationService.getMyApplication(params).subscribe({
    //   next: rsp => {
    //     console.log('query result : ' + JSON.stringify(rsp));

    //     this.data = rsp;
    //   },
    //   error: rsp => {
    //     console.log(rsp);
    //     this.toastService.error('System.Message.Error');
    //   }
    // });
    this.queryReq.params.userCode = userEmail;
    // this.queryReq.params.endDate =
    //   this.endDate == null
    //     ? null
    //     : this.datePipe.transform(this.endDate, 'yyyy/MM/dd');
    this.queryReq.params.endDate = this.endDate;
    this.queryReq.params.formName = this.formName;
    this.queryReq.params.formNo = this.formNo;
    // this.queryReq.params.startDate =
    //   this.startDate == null
    //     ? null
    //     : this.datePipe.transform(this.startDate, 'yyyy/MM/dd');
    this.queryReq.params.startDate = this.startDate;
    this.queryReq.params.status = this.status;
    if (this.displayResult) {
      this.resetLazySort();
    } else {
      setTimeout(() => {
        this.displayResult = true;
      });
    }
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
    this.queryReq.params.userLang = this.languageService.getLang();
    setTimeout(() => {
      this.loaderService.show();
      this.myApplicationService.getLazyMyApplication(this.queryReq).subscribe({
        next: (rsp) => {
          console.log(rsp)
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
    if (this.lazyTable !== undefined) {
      this.lazyTable.sortOrder = undefined;
      this.lazyTable.sortField = undefined;
      this.lazyTable.first = 0;
      this.lazyTable.rows = 10;
      this.lazyTable.reset();
    }
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

  downloadBtnClick(): void {
    const userEmail = this.userContextService.user$.getValue().userEmail;
    const userLang = this.languageService.getLang();
    const tenant = this.userContextService.user$.getValue().tenant;
    const params = {
      params: {
        userCode: userEmail,
        endDate: this.endDate,
          // this.endDate == null
          //   ? null
          //   : this.datePipe.transform(this.endDate, 'yyyy/MM/dd'),
        formName: this.formName,
        formNo: this.formNo,
        startDate: this.startDate,
          // this.startDate == null
          //   ? null
          //   : this.datePipe.transform(this.startDate, 'yyyy/MM/dd'),
        status: this.status,
        userLang: userLang,
        userTimeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        tenant: tenant,
      },
    };
    this.loaderService.show();
    this.myApplicationService.downloadMyForm(params).subscribe({
      next: (rsp) => {
        this.commonApiService.downloadFile(rsp.fileId);
      },
      error: (e) => {
        console.error(e);
        this.loaderService.hide();
        this.toastService.error('System.Message.Error');
      },
    });
  }

  downloadBtnClickTrackForm(): void {
    this.validateEditFormTrackForm().then((x) => {
      if (!x) {
        return;
      }
      this.composeAutoCompleteReTrackForm();
      this.loaderService.show();
      this.myApplicationService.downloadLazyTrackFormLogByConditions(this.queryReqTrackForm).subscribe({
        next: (rsp) => {
          this.commonApiService.downloadFile(rsp.fileId);
        },
        error: (e) => {
          console.error(e);
          this.loaderService.hide();
          this.toastService.error('System.Message.Error');
        },
      });
    });
  }

  resetBtnClick() {
    var today = new Date();
    this.formName = '';
    this.formNo = '';
    // this.endDate = new Date();
    this.endDate = new Date(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate());
    this.status = '';
    // this.startDate = today;
    this.startDate = new Date(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate());
    this.startDate.setMonth(this.startDate.getMonth() - 6);
    // this.startDate.setMonth(today.getMonth() - 6);
    this.displayResult = false;
    this.composeQueryReq();
    this.first = 0;
    this.sortField = undefined;
    this.sortOrder = undefined;

    var trackFormToday = new Date();
    this.trackFormFormTypeId = '';
    this.trackFormFormNo = '';
    this.searchType = 'General';
    this.trackFormStatus = 'Approving';
    this.trackFormSubject = '';
    this.trackFormEndDate = new Date(trackFormToday.getUTCFullYear(), trackFormToday.getUTCMonth(), trackFormToday.getUTCDate());;
    this.trackFormStartDate = new Date(trackFormToday.getUTCFullYear(), trackFormToday.getUTCMonth(), trackFormToday.getUTCDate());;
    this.trackFormStartDate.setMonth(this.trackFormStartDate.getMonth() - 12);
    // this.trackFormStartDate = trackFormToday;
    // this.trackFormStartDate.setMonth(trackFormToday.getMonth() - 12);
    // this.trackFormEndDate = new Date();
    this.trackFormDisplayResult = false;
    this.composeQueryReqTrackForm();
    this.trackFormFirst = 0;
    this.trackFormSortField = undefined;
    this.trackFormSortOrder = undefined;
    this.trackFormSelectCorps = [];
    this.onChangeSearchType('');
    this.trackFormKeywords = [];
  }

  showFilter() {
    this.displayFilterDetail = true;
  }
  resetFilterDetail() {
    // console.warn('displayFilterDetail', this.displayFilterDetail);
    this.selectedCols = this.cols.filter((x) => {
      return x.isDefault;
    });
  } // end changeFilterDetail

  private setBreadcrumbItems(): void {
    this.breadcrumbItems = this.translateService.instant(
      'BreadcrumbItems.Backstage'
    );
  }

  changeFilterDetail() {
    this.selectedCols = this.cols.filter((x) => {
      return x.isDefault;
    });
    this.colFuncs?.forEach((x) => {
      this.selectedCols.push(x);
    });
    this.selectedTrackFormCols = this.trackFormCols.filter((x) => {
      return x.isDefault;
    });
  } // end changeFilterDetail

  viewPage(url: string, formNo: string) {
    this.router.navigate([url], {
      queryParams: {
        queryFormNo: formNo,
        backUrl: 'applicationMgmt/my-application',
      },
    });
    return false;
  }

  editPage(form) {
    const url = form.viewUrl;
    const formNo = form.formNo;
    this.router.navigate([url], { queryParams: { queryFormNo: formNo } });
    return false;
  }

  clickDeleteForm(form) {
    this.delFormNo = form.formNo;
    this.displayDelDialog = true;
  }

  deleteForm() {
    if (this.delFormNo) {
      this.loaderService.show();
      this.myApplicationService
        .deleteMyForm({ formNo: this.delFormNo })
        .subscribe({
          next: (rsp) => {
            if (rsp?.status != 200) {
              return;
            }

            this.toastService.success('MyApplication.Message.DelSuccess');
            this.searchBtnClick();
          },
          error: (rsp) => {
            console.log(rsp);
            this.toastService.error('System.Message.Error');
          },
        })
        .add(() => {
          this.loaderService.hide();
        });
      this.loaderService.hide();
    }
    this.displayDelDialog = false;
  }

  initOptions() {
    this.searchTypeOptions = this.translateService.instant('MyApplication.Options.searchTypeOptions');
    this.trackFormStatusOptions = this.translateService.instant('MyApplication.Options.trackFormStatusOptions');
    this.statusOptions = this.translateService.instant('MyApplication.Options.StatusOptions');
    this.statusDesc = this.translateService.instant('MyApplication.statusDesc');
  }

  onChangeSearchType(event): void {
    this.trackFormApplicantRequired = false;
    this.trackFormOwnerRequired = false;
    this.doQueryFormType();
    this.doQueryApplicantAndOwner();
  }

  async doQueryFormType() {
    this.trackFormFormNameOptions = [];
    if (this.searchType === 'General') {
      const model = JSON.parse('{}');
      model.tenant = this.userContextService.user$.getValue().tenant;
      model.email = this.userContextService.user$.getValue().userEmail;
      model.staffCode = this.userContextService.user$.getValue().userCode;
      model.permissionType = 'SEARCH';
      let rsp = await lastValueFrom(this.myApplicationService.getAuthFormTypes(model));
      this.formTypePermissionList = rsp.formTypePermissionList;

      if (this.languageService.getLang() === 'zh-tw') {
        this.trackFormFormNameOptions = rsp.formTypePermissionList.map(function (obj) {
          return { label: obj.formTypeNameC, value: obj.formTypeId };
        });
      } else {
        this.trackFormFormNameOptions = rsp.formTypePermissionList.map(function (obj) {
          return { label: obj.formTypeNameE, value: obj.formTypeId };
        });
      }

    } else {
      let rsp = await lastValueFrom(this.myApplicationService.getFormTypes());
      this.formTypePermissionList = rsp;

      if (this.languageService.getLang() === 'zh-tw') {
        this.trackFormFormNameOptions = rsp.map(function (obj) {
          return { label: obj.formTypeNameC, value: obj.formTypeId };
        });
      } else {
        this.trackFormFormNameOptions = rsp.map(function (obj) {
          return { label: obj.formTypeNameE, value: obj.formTypeId };
        });
      }

    }
    this.trackFormFormNameOptions.sort(function (a, b) {
      var nameA = a.label.toUpperCase(); // ignore upper and lowercase
      var nameB = b.label.toUpperCase(); // ignore upper and lowercase
      if (nameA < nameB) return -1;
      if (nameA > nameB) return 1;
      return 0; // names must be equal
    });

  }

  async doQueryApplicantAndOwner() {
    this.trackFormApplicantOptions = [];
    this.trackFormOwnerOptions = [];
    this.trackFormSelectedApplicant = undefined;
    this.trackFormApplicant = '';
    this.trackFormOwner = '';
    let userCode = this.userContextService.user$.getValue().userCode;
    let tenant = this.userContextService.user$.getValue().tenant;
    this.applicantList = [];
    this.ownerList = [];

    if (this.searchType === 'General') {

    } else if (this.searchType === 'SupervisorApplicant' || this.searchType === 'SupervisorOwner') {
      this.authApiService.getSupervisorUser(tenant, userCode).subscribe({
        next: (rsp) => {
          if (rsp.body !== undefined && rsp.body.length > 0) {
            let staffCodes = rsp.body.map(function (obj) {
              return obj.staffCode
            });
            if (this.searchType === 'SupervisorApplicant') {
              this.applicantList = staffCodes;
              this.trackFormApplicantOptions = rsp.body.map(function (obj) {
                return {
                  label: obj.staffCode + ' ' + obj.fullName + ' ' + obj.nickName,
                  value: obj.staffCode,
                };
              });
              this.trackFormApplicant = 'All';
              this.trackFormApplicantOptions.unshift(this.translateService.instant('MyApplication.Options.trackFormApplicantOptions')[0]);
            } else if (this.searchType === 'SupervisorOwner') {
              this.ownerList = staffCodes;
              this.trackFormOwnerOptions = rsp.body.map(function (obj) {
                return {
                  label: obj.staffCode + ' ' + obj.fullName + ' ' + obj.nickName,
                  value: obj.staffCode,
                };
              });
              this.trackFormOwner = 'All';
              this.trackFormOwnerOptions.unshift(this.translateService.instant('MyApplication.Options.trackFormOwnerOptions')[0]);
            }
          }
        },
        error: (rsp) => {
          console.log('getSupervisorApplicant error : ' + JSON.stringify(rsp));
          this.toastService.error('System.Message.Error');
        },

      });

    }
    // else if (this.searchType === 'SupervisorOwner') {
    //   this.authApiService.getSupervisorUser(tenant, userCode).subscribe({
    //     next: (rsp) => {
    //       if (rsp.body !== undefined && rsp.body.length > 0) {
    //         this.trackFormOwnerOptions = rsp.body.map(function (obj) {
    //           return {
    //             label: obj.staffCode + ' ' + obj.fullName + ' ' + obj.nickName,
    //             value: obj.staffCode,
    //           };
    //         });
    //         this.trackFormOwnerOptions.unshift(this.translateService.instant('MyApplication.Options.trackFormOwnerOptions')[0]);
    //         this.trackFormOwner = 'All';
    //       }
    //     },
    //     error: (rsp) => {
    //       console.log('getSupervisorOwner error : ' + JSON.stringify(rsp));
    //       this.toastService.error('System.Message.Error');
    //     },
    //   });
    // }
    else {
      //預設都是ALL
      // this.trackFormApplicantOptions = this.translateService.instant('MyApplication.Options.trackFormApplicantOptions');
      // this.trackFormOwnerOptions = this.translateService.instant('MyApplication.Options.trackFormOwnerOptions');
      // this.trackFormApplicant = 'All';
      // this.trackFormOwner = 'All';
    }
  }

  /**
   * 查詢按鈕 Click 事件
   */
  searchBtnClickTrackForm(): void {
    this.validateEditFormTrackForm().then((x) => {
      if (!x) {
        return;
      }
      this.composeAutoCompleteReTrackForm();
      console.log('queryReqTrackForm: ', this.queryReqTrackForm);
      if (this.trackFormDisplayResult) {
        this.resetLazySortTrackForm();
      } else {
        setTimeout(() => {
          this.trackFormDisplayResult = true;
        });
      }
    });

  }

  composeAutoCompleteReTrackForm() {
    this.composeQueryReqTrackForm();
    this.queryReqTrackForm.searchType = this.searchType;
    this.queryReqTrackForm.formTypeId = this.trackFormFormTypeId;
    this.queryReqTrackForm.formNo = this.trackFormFormNo;
    this.queryReqTrackForm.applicant = this.trackFormApplicant;
    // this.queryReqTrackForm.applicantList = [];
    this.queryReqTrackForm.owner = this.trackFormOwner;
    // this.queryReqTrackForm.ownerList = [];
    if (this.searchType === 'General') {
      this.queryReqTrackForm.applicant = this.trackFormSelectedApplicant !== undefined ? this.trackFormSelectedApplicant.staffCode : '';
    } else if (this.searchType === 'SupervisorApplicant') {
      this.queryReqTrackForm.applicantList = this.applicantList;
      if (this.queryReqTrackForm.applicant !== 'All') {
        this.queryReqTrackForm.applicantList = [];
        this.queryReqTrackForm.applicantList.push(this.queryReqTrackForm.applicant);
      }
    } else if (this.searchType === 'SupervisorOwner') {
      this.queryReqTrackForm.ownerList = this.ownerList;
      if (this.queryReqTrackForm.owner !== 'All') {
        this.queryReqTrackForm.ownerList = [];
        this.queryReqTrackForm.ownerList.push(this.queryReqTrackForm.owner);
      }
    }
    // this.queryReqTrackForm.startDate = this.trackFormStartDate == null ? null : this.datePipe.transform(this.trackFormStartDate, 'yyyy/MM/dd');
    // this.queryReqTrackForm.endDate = this.trackFormEndDate == null ? null : this.datePipe.transform(this.trackFormEndDate, 'yyyy/MM/dd');
    this.queryReqTrackForm.startDate = this.trackFormStartDate;
    this.queryReqTrackForm.endDate = this.trackFormEndDate;
    this.queryReqTrackForm.status = this.trackFormStatus;
    this.queryReqTrackForm.subject = this.trackFormSubject;
    this.queryReqTrackForm.keywords = this.trackFormKeywords;
    if (this.trackFormSelectCorps !== undefined) {
      this.queryReqTrackForm.ouCodeList = this.trackFormSelectCorps.map(function (obj) {
        return obj.ouCode;
      });
    }
    this.queryReqTrackForm.formTypePermissionList = this.formTypePermissionList;
  }

  filterLazyTrackForm(globalFilter: string) {
    this.trackFormData = [];
    for (var i = 0; i < this.trackFormCloneData.length; i++) {
      for (var j = 0; j < this.selectedTrackFormCols.length; j++) {
        try {
          if (this.trackFormCloneData[i][this.selectedTrackFormCols[j].field] === undefined)
            continue;
          var value = this.trackFormCloneData[i][this.selectedTrackFormCols[j].field];
          if (value.toLowerCase().indexOf(globalFilter.toLowerCase()) !== -1) {
            this.trackFormData.push(this.trackFormCloneData[i]);
            break;
          }
        } catch (e) {
          console.log(e);
        }
      }
    }
    return;
  }

  onLazyLoadTrackForm(event: LazyLoadEvent) {
    this.queryReqTrackForm.lazyLoadEvent = event;
    if (event && event.sortField && this.lazyTableTrackForm && this.trackFormData && (event.sortField !== this.trackFormSortField || event.sortOrder !== this.trackFormSortOrder)) {
      this.trackFormData = this.sortArrayData(this.trackFormData, event.sortField, event.sortOrder);
      this.lazyTableTrackForm.first = this.trackFormFirst;
      return;
    }
    this.queryReqTrackForm.userLang = this.languageService.getLang();
    setTimeout(() => {
      this.loaderService.show();
      this.myApplicationService.getLazyTrackFormLogByConditions(this.queryReqTrackForm).subscribe({
        next: (rsp) => {
          this.trackFormData = rsp.resultList;
          this.trackFormCloneData = rsp.resultList;
          this.filterLazyTrackForm(this.trackFormGlobalFilter);
          this.trackFormTotalRecords = rsp.totalRecords;
          this.trackFormDisplayResult = true;
          this.loaderService.hide();
          this.trackFormData = this.sortArrayData(this.trackFormData, event.sortField, event.sortOrder);
        },
        error: (e) => {
          console.error(e);
          this.loaderService.hide();
          this.toastService.error('System.Message.Error');
        }
      });
    });
  }

  onSortTrackForm(event) {
    this.trackFormSortField = event.field;
    this.trackFormSortOrder = event.order;
  }

  onPageTrackForm(event) {
    this.trackFormFirst = event.first;
  }

  resetLazySortTrackForm() {
    if (this.lazyTableTrackForm !== undefined) {
      this.lazyTableTrackForm.sortOrder = undefined;
      this.lazyTableTrackForm.sortField = undefined;
      this.lazyTableTrackForm.first = 0;
      this.lazyTableTrackForm.rows = 10;
      this.lazyTableTrackForm.reset();
    }
  }

  showFilterTrackForm() {
    this.displayFilterDetailTrackForm = true;
  }

  resetFilterDetailTrackForm() {
    this.selectedTrackFormCols = this.trackFormCols.filter((x) => {
      return x.isDefault;
    });
  }

  async filterTrackFormApplicant(event) {

    let filtered: any[] = [];
    let query = event.query.replaceAll('/', '');

    let rsp = await lastValueFrom(this.authApiService.getAllEmpByTenant(this.userContextService.user$.getValue().tenant, query));
    for (var emp of rsp.body) {
      emp.displayName = emp.staffCode + '/' + emp.fullName + '/' + emp.nickName;
      filtered.push(emp);
    }

    this.trackFormFilteredApplicants = filtered;
  }

  onBlurTrackFormApplicant(event) {

    // 沒選autoComplete的話.清空input內容
    if (this.trackFormSelectedApplicant === undefined || this.trackFormSelectedApplicant.email === undefined) {
      this.trackFormSelectedApplicant = undefined;
      // this.queryReq.uploadBy = undefined;
    }
  }

  async filterTrackFormCorp(event) {

    let filtered: any[] = [];
    let query = event.query.replaceAll('/', '').trim();
    if (query === '') {
      return;
    }
    let rsp = await lastValueFrom(this.authApiService.ouQueryByPrefix(query));
    for (var ou of rsp.ouList) {
      filtered.push(ou);
    }

    this.trackFormFilteredCorps = filtered;
  }

  validateEditFormTrackForm(): Promise<boolean> {
    return new Promise((resolve, reject) => {
      this.resetValidate();
      if (this.searchType === 'General') {

      } else if (this.searchType === 'SupervisorApplicant' || this.searchType === 'AssistantApplicant' || this.searchType === 'ResignApplicant') {
        if (!this.trackFormApplicant || this.trackFormApplicant == '') {
          this.trackFormApplicantRequired = true;
        }
      } else if (this.searchType === 'SupervisorOwner' || this.searchType === 'AssistantOwner' || this.searchType === 'ResignOwner') {
        if (!this.trackFormOwner || this.trackFormOwner == '') {
          this.trackFormOwnerRequired = true;
        }
      }

      if (this.trackFormApplicantRequired || this.trackFormOwnerRequired) {
        console.log('valid');
        return resolve(false);
      }
      return resolve(true);
    });
  }

  resetValidate() {
    this.trackFormApplicantRequired = false;
    this.trackFormOwnerRequired = false;
  }

  ngAfterViewInit(): void {
    this.changeDetectorRef.detectChanges();
  }

  ngAfterContentChecked() {
    this.changeDetectorRef.detectChanges();
  }

  translateFormType(data: any) {
    if (this.languageService.getLang() === 'zh-tw') {
      return data.formTypeNameC;
    }
    return data.formTypeNameE;
  }

  ngOnDestroy(): void {
    [this.onLangChange$].forEach((subscription: Subscription) => {
      if (subscription != null || subscription != undefined)
        subscription.unsubscribe();
    });
  }
}
