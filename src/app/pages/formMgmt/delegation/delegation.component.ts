import { DateInputHandlerService } from './../../../core/services/date-input-handler.service';
import { DatePipe } from '@angular/common';
import { Component, isDevMode, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { SelectItem } from 'primeng/api';
import { Table } from 'primeng/table';
import { TabView } from 'primeng/tabview';
import { Subscription, take } from 'rxjs';
import { DelegationApiService } from 'src/app/core/services/delegation-api.service';
import { ToastService } from 'src/app/core/services/toast.service';
import { AuthApiService } from './../../../core/services/auth-api.service';
import { MyApplicationService } from './../../../core/services/my-application.service';
import { UserContextService } from './../../../core/services/user-context.service';
import { LanguageService } from 'src/app/core/services/language.service';

@Component({
  selector: 'app-delegation',
  templateUrl: './delegation.component.html',
  styleUrls: ['./delegation.component.scss'],
})
export class DelegationComponent implements OnInit {
  @ViewChild('dt') dt: Table;
  @ViewChild(TabView) tabView: TabView;
  private onLangChange$: Subscription;

  permissions: string[] = [];

  selectedTabIndex: number = 0;

  options: SelectItem[];
  activeFlagOptions: SelectItem[];
  formTypeOptions: SelectItem[] = [];
  selectedActiveFlag: string = 'Y';
  agentDeptOptions: SelectItem[]; // 語系化
  agentDeptInfo; // 未語系化

  displayFilterDetail = false;
  selectedCols: any[];
  startDate: Date = new Date();
  endDate: Date = new Date();

  cols: any[];
  data: any[];

  displayEditDetail: boolean = false;
  editForm: FormGroup;
  editForm2: FormGroup;
  formSubmitted: boolean = false;

  // editform
  agentUserOptions: SelectItem[];
  supervisorUserOptions: SelectItem[];
  ouListOptions: SelectItem[];
  ouSelectedList: SelectItem[];
  agentUser: string;
  agentUser1: string;
  agentUser2: string;
  selectedAgentUser: string;

  formType: any = {};
  agentInfoId: number = null;

  // descriptions
  yesOrNoDesc: any;
  agentTypeDesc: any;
  title: string;

  showLoader: boolean = false;

  constructor(
    private router: Router,
    private translateService: TranslateService,
    private toastService: ToastService,
    private delegationApiService: DelegationApiService,
    private userContextService: UserContextService,
    private datePipe: DatePipe,
    private authApiService: AuthApiService,
    private myApplicationService: MyApplicationService,
    private formBuilder: FormBuilder,
    private dateInputHandlerService:DateInputHandlerService,
    private languageService: LanguageService
  ) {
    if (this.userContextService.user$.getValue) {
      this.permissions = this.userContextService.getMenuUrlPermission(
        this.router.url
      );
    }
    this.startDate.setMonth(this.startDate.getMonth() - 1);
    this.onLangChange$ = this.translateService.onLangChange.subscribe(() => {
      this.initTranslateCharacter();
      this.changeFilterDetail();

      if (this.agentDeptInfo) {
        // 變更部門語系
        const curLang = this.translateService.currentLang;
        this.agentDeptOptions = this.agentDeptInfo.map(function (obj) {
          return { label: curLang === 'zh-tw' ? obj.deptnameTw : obj.deptnameEn, value: obj.deptId };
        });
      }

    });
  }

  ngOnInit(): void {
    let empUserCode = this.userContextService.user$.getValue().userCode;

    this.editForm = this.formBuilder.group({
      type: ['', Validators.required],
      userCode: ['', Validators.required],
      ccMail: ['', Validators.required],
      startTime: ['', Validators.required],
      endTime: ['', Validators.required],
      agentUser: ['', Validators.required],
      formTypes: [null],
      activeFlag: ['', Validators.required],
      ouCodeList: [null],
    });

    this.editForm2 = this.formBuilder.group({
      type: ['', Validators.required],
      userCode: ['', Validators.required],
      ccMail: ['', Validators.required],
      dept: ['', Validators.required],
      startTime: ['', Validators.required],
      endTime: ['', Validators.required],
      agentUser: ['', Validators.required],
      formTypes: [null],
      activeFlag: ['', Validators.required],
    });

    this.ouSelectedList = new Array();

    this.getAllFormType();
    this.getSupervisorUser(empUserCode);
    this.initTranslateCharacter();
    this.changeFilterDetail();
    this.getOUList('');
  }

  initTranslateCharacter() {
    this.cols = [];
    this.selectedCols = [];
    this.activeFlagOptions = this.translateService.instant(
      'Delegation.Options.ActiveFlagOptions'
    );
    this.cols = this.cols = this.translateService.instant('Delegation.Columns');

    var needAdd = true;
    this.cols.forEach((e) => {
      if (e.field === 'edit') {
        needAdd = false;
      }
    });

    if (this.permissions.includes('edit') && needAdd) {
      this.cols.unshift(this.translateService.instant('Delegation.EditColums'));
    }
    this.yesOrNoDesc = this.translateService.instant(
      'Delegation.Descs.YesOrNoDesc'
    );
    this.agentTypeDesc = this.translateService.instant(
      'Delegation.Descs.AgentTypeDesc'
    );
  }

  searchBtnClick() {
    this.showLoader = true;
    this.data = [];

    let model = {
      activeFlag:
        (this.selectedActiveFlag || '') == '' ? null : this.selectedActiveFlag,
      startDate:
        this.startDate == null
          ? null
          : this.datePipe.transform(this.startDate, 'yyyy-MM-dd'),
      endDate:
        this.endDate == null
          ? null
          : this.datePipe.transform(this.endDate, 'yyyy-MM-dd'),
      tenant: this.userContextService.user$.getValue().tenant,
      userCode: this.selectedAgentUser,
      staffCode: this.userContextService.user$.getValue().userCode,
    };

    this.delegationApiService.getAgentInfos(model).subscribe({
      next: (rsp) => {
        if (rsp?.status != 200) {
          return;
        }

        rsp.body.result.forEach((e) => {
          let formTypeIds = e.formTypeIds;
          let types = formTypeIds.split(',');
          e.formTypeId = '';
          types.forEach((obj) => {
            if (obj === 'ALL') {
              e.formTypeId += obj + ',';
            } else if (this.formType[obj] !== undefined) {
              e.formTypeId += this.formType[obj] + ',';
            }
          });

          e.formTypeId = e.formTypeId.substr(0, e.formTypeId.length - 1);
        });

        this.data = rsp.body.result;

        this.dt.reset();
        this.showLoader = false;
      },
      error: (rsp) => {
        if (rsp) {
          console.error(rsp);
        }
        this.toastService.error('System.Message.Error');
        this.showLoader = false;
      },
    });
  }

  resetEditForm() {
    this.editForm.reset();
    this.editForm2.reset();
    this.title = '';
    this.agentUserFilterChange(''); // 清除代理人設定 filter欄位輸入值
  }

  resetQueryForm() {
    //# TK-35854
    this.data = new Array();
    this.selectedActiveFlag = 'Y';
    this.selectedAgentUser = this.userContextService.user$.getValue().userCode;
    this.startDate = new Date();
    this.startDate.setMonth(this.startDate.getMonth() - 1);
    this.endDate = new Date();
  }

  onHideDetailDialog(event: any) {
    this.formSubmitted = false;
    this.editForm.reset();
    this.editForm2.reset();
    this.agentUserFilterChange(''); // 清除代理人設定 filter欄位輸入值
  }

  showEdit(type: string, agentInfoId: number) {
    this.formSubmitted = false;
    this.agentInfoId = agentInfoId;
    switch (type) {
      case 'new':
        this.title = this.translateService.instant(
          'Delegation.Title.AddDelegationSetting'
        );

        this.editForm.get('type').setValue('new');
        this.editForm.get('ccMail').setValue('Y');
        this.editForm
          .get('userCode')
          .setValue(this.userContextService.user$.getValue().userCode);
        this.editForm.get('activeFlag').setValue('Y');
        this.editForm2.get('type').setValue('new');
        this.editForm2.get('ccMail').setValue('Y');
        this.editForm2
          .get('userCode')
          .setValue(this.userContextService.user$.getValue().userCode);
        this.onChangeSupervisorUser({
          value: this.userContextService.user$.getValue().userCode,
        });
        this.editForm2.get('activeFlag').setValue('Y');

        this.displayEditDetail = true;
        break;
      case 'edit':
        this.editBtnClick(agentInfoId);
        break;
      default:
        this.resetEditForm();
    }
  } // end showEdit

  closeEdit() {
    this.formSubmitted = false;
    this.displayEditDetail = false;
    this.resetEditForm();
  }

  getOUList(ouPrefix: string): void {
    this.authApiService
      .ouQueryByPrefixAndGroup(ouPrefix)
      .pipe(take(1))
      .subscribe({
        next: (res) => {
          this.ouListOptions = new Array();
          this.ouListOptions = [
            ...this.ouSelectedList,
            ...res.ouList.map(
              (ou: { ouCode: string; ouName: string; ouShortName: string }) => {
                if (
                  this.ouSelectedList.length === 0 ||
                  this.ouSelectedList.filter(
                    (x) => x.value && x.value.ouCode === ou.ouCode
                  ).length === 0
                ) {
                  return {
                    label: `${ou.ouCode} ${ou.ouName} ( ${ou.ouShortName} )`,
                    value: ou,
                  };
                } else {
                  return {
                    label: ``,
                    value: null,
                  };
                }
              }
            ),
          ];

          this.ouListOptions = this.ouListOptions.filter(
            (x) => x.value !== null
          );
        },
        error: (err) => {
          console.error(err);
          this.ouListOptions = new Array();
        },
      });
  }

  getAgentUser(empCode: string) {
    this.authApiService
      .getAllEmpByTenant(
        this.userContextService.user$.getValue().tenant,
        empCode
      )
      .subscribe({
        next: (rsp) => {
          if (rsp.body !== undefined) {
            this.agentUserOptions = rsp.body.map(function (obj) {
              return {
                label: obj.staffCode + ' ' + obj.fullName + ' ' + obj.nickName,
                value: obj.staffCode,
              };
            });
          }
        },
        error: (rsp) => {
          isDevMode() &&
            console.log('getAllEmpByTenant error : ' + JSON.stringify(rsp));
          this.toastService.error('System.Message.Error');
        },
      });
  }

  getSupervisorUser(empCode: string) {
    this.authApiService
      .getSupervisorUser(
        this.userContextService.user$.getValue().tenant,
        empCode
      )
      .subscribe({
        next: (rsp) => {
          if (rsp.body !== undefined) {
            this.supervisorUserOptions = rsp.body.map(function (obj) {
              return {
                label: obj.staffCode + ' ' + obj.fullName + ' ' + obj.nickName,
                value: obj.staffCode,
              };
            });
            this.supervisorUserOptions.unshift(
              this.translateService.instant(
                'Delegation.Options.SupervisorUserOptions'
              )[0]
            );
            this.selectedAgentUser =
              this.userContextService.user$.getValue().userCode;
          }
        },
        error: (rsp) => {
          console.error(rsp);
          this.toastService.error('System.Message.Error');
        },
      });
  }

  getAllFormType() {
    this.myApplicationService.getFormTypes().subscribe({
      next: (rsp) => {
        rsp.forEach((obj) => {
          this.formType[obj.formTypeId] = obj.formTypeNameE;
        });

        let options = rsp.map(function (obj) {
          return { label: obj.formTypeNameE, value: obj.formTypeId };
        });

        this.formTypeOptions =  options;
      },
      error: (rsp) => {
        console.error(rsp);
        this.toastService.error('System.Message.Error');
      },
    });
  }

  getAgentDept(tenant: string, userCode: string) {
    this.authApiService
      .getAgentDeptByTenantAndEmpCode(tenant, userCode)
      .subscribe({
        next: (rsp) => {
          this.agentDeptInfo = rsp.body;

          if (this.agentDeptInfo !== undefined) {
            const curLang = this.translateService.currentLang;
            this.agentDeptOptions = this.agentDeptInfo.map(function (obj) {
              const targetDept =  curLang === 'zh-tw' ? obj.deptnameTw : obj.deptnameEn;
              return { label: targetDept ? targetDept : obj.deptnameTw, value: obj.deptId };
            });

            if (this.agentDeptOptions.length > 0){
              this.editForm2.get('dept').setValue(this.agentDeptOptions[0].value);
            }
          }
        },
        error: (rsp) => {
          console.error('getAllEmpByTenant error : ' + JSON.stringify(rsp));
          this.toastService.error('System.Message.Error');
        },
      });
  }

  agentUserFilterChange(event) {
    let empdata = event.filter === '' ? '' : event.filter;
    this.getAgentUser(empdata);
  }

  onOUInfoListFilter(event: { filter: string }) {
    this.getOUList(event.filter);
  }

  onOUInfoListChange(event) {
    this.ouSelectedList = event.value.map((ou) => {
      return {
        label: `${ou.ouCode} ${ou.ouName} ( ${ou.ouShortName} )`,
        value: ou,
      };
    });
  }

  saveBtnClick(agentType: string) {
    this.showLoader = true;
    this.formSubmitted = true;
    if (
      (this.editForm.invalid && agentType == 'GENERAL') ||
      (this.editForm2.invalid && agentType == 'DEPT')
    ) {
      this.showLoader = false;
      return;
    }

    let form = this.editForm;
    if (agentType == 'DEPT') {
      form = this.editForm2;
    }

    let details = [];

    const allTypeOptions = this.formTypeOptions.map(item=>item.value);
    const targetType = !form.get('formTypes').value || form.get('formTypes').value?.length === 0 ? allTypeOptions : form.get('formTypes').value // 若沒有選代理表單，則把選項全帶入

    targetType.forEach((obj) => {
      let detail: any;
      detail = {
        agentDeptId: form.get('dept') == null ? '' : form.get('dept').value,
        agentUserCode: form.get('agentUser').value,
        startDate: form.get('startTime').value,
        endDate: form.get('endTime').value,
        formTypeId: obj,
      };

      if (agentType === 'GENERAL') {
        detail['ouCodeList'] =
          form.get('ouCodeList').value === null ||
          form.get('ouCodeList').value.length === 0
            ? ['ALL']
            : form
                .get('ouCodeList')
                .value.map((x: { ouCode: string }) => x.ouCode);
      }

      details.push(detail);
    });
    let model = {
      header: {
        activeFlag: form.get('activeFlag').value,
        agentInfoId: this.agentInfoId,
        agentType: agentType,
        ccMail: form.get('ccMail').value,
        tenant: this.userContextService.user$.getValue().tenant,
        userCode: form.get('userCode').value,
        userLang: this.languageService.getLang(),
        userTimeZone:  Intl.DateTimeFormat().resolvedOptions().timeZone
      },
      userEmail: this.userContextService.user$.getValue().userEmail,
      details: details,
    };

    this.delegationApiService.saveAgentInfos(model).subscribe({
      next: (rsp) => {
        if (rsp?.status != 200) {
          return;
        }
        this.toastService.success('Success!');
        this.closeEdit();
        this.searchBtnClick();
        this.showLoader = false;
      },
      error: (rsp) => {
        if (rsp) {
          console.error(rsp);
        }
        if (rsp?.status == 500 && rsp.error?.code) {
          const curLang = this.translateService.currentLang;
          curLang === 'zh-tw'
          ? this.toastService.error(rsp.error.message)
          : this.toastService.error(rsp.error.messageEn);
        } else {
          this.toastService.error('System.Message.Error');
        }
        // this.toastService.error('System.Message.Error');
        this.showLoader = false;
      },
    });
  }

  editBtnClick(agentInfoId: number) {
    this.showLoader = true;
    this.formSubmitted = false;
    this.agentInfoId = agentInfoId;
    this.delegationApiService.getAgentInfoDetail(agentInfoId).subscribe({
      next: (rsp) => {
        if (rsp?.status != 200) {
          return;
        }
        let detail = rsp.body.bean;

        this.authApiService
          .getAllEmpByTenant(
            this.userContextService.user$.getValue().tenant,
            detail.agentUserCode
          )
          .subscribe({
            next: (rsp) => {
              if (rsp.body !== undefined) {
                this.authApiService
                .getAgentDeptByTenantAndEmpCode(this.userContextService.user$.getValue().tenant , detail.userCode)
                .subscribe({
                  next: (deptRsp) => { // 取得該筆資料被代理者的部門資訊
                    this.agentDeptInfo = deptRsp.body;
                    const curLang = this.translateService.currentLang;
                    this.agentDeptOptions = this.agentDeptInfo?.map(function (obj) {
                      return { label: curLang === 'zh-tw' ? obj.deptnameTw : obj.deptnameEn, value: obj.deptId };
                    });

                    this.agentUserOptions = rsp.body.map(function (obj) {
                      return {
                        label:
                          obj.staffCode + ' ' + obj.fullName + ' ' + obj.nickName,
                        value: obj.staffCode,
                      };
                    });

                    setTimeout(() => {
                      let formTypes = detail.formTypeIds.split(',') || [];
                      if (formTypes.length === this.formTypeOptions.length){formTypes = [];}
                      this.title = this.translateService.instant(
                        'Delegation.Title.EditDelegationSetting'
                      );
                      let editFormData = {
                        type: 'edit',
                        userCode: detail.userCode,
                        ccMail: detail.ccMail,
                        startTime: new Date(detail.startDate),
                        endTime: new Date(detail.endDate),
                        agentUser: detail.agentUserCode,
                        formTypes: formTypes,
                        activeFlag: detail.activeFlag,
                        ouCodeList:detail.ouCodeList
                      };

                      let editFormData2 = {
                        type: 'edit',
                        userCode: detail.userCode,
                        ccMail: detail.ccMail,
                        dept: detail.agentDeptId == null ? '' : detail.agentDeptId,
                        startTime: new Date(detail.startDate),
                        endTime: new Date(detail.endDate),
                        agentUser: detail.agentUserCode,
                        formTypes: formTypes,
                        activeFlag: detail.activeFlag,
                      };

                      this.editForm.setValue(editFormData);
                      this.setupOUSelectedList(editFormData.ouCodeList)
                      this.editForm2.setValue(editFormData2);
                      if (detail.agentType === 'DEPT') {
                        this.tabViewChange(1);
                      } else {
                        this.tabViewChange(0);
                      }

                      this.displayEditDetail = true;
                      this.showLoader = false;
                    }, 1000);

                  },
                  error: (rsp) => {
                    console.error('getAllEmpByTenant error : ' + JSON.stringify(rsp));
                    this.toastService.error('System.Message.Error');
                  },
                });
              }
            },
            error: (rsp) => {
              console.error('getAllEmpByTenant error : ' + JSON.stringify(rsp));
              this.toastService.error('System.Message.Error');
              this.showLoader = false;
            },
          });
      },
      error: (rsp) => {
        if (rsp) {
          console.error(rsp);
        }
        this.toastService.error('System.Message.Error');
        this.showLoader = false;
      },
    });
  }

  setupOUSelectedList(ouList: string[]): void {
    this.authApiService
      .ouQueryByPrefixAndGroup('')
      .pipe(take(1))
      .subscribe({
        next: (res) => {
          this.editForm
            .get('ouCodeList')
            .setValue(res.ouList.filter((ou) => ouList.includes(ou.ouCode)));
        },
        error: (err) => {
          console.error(err);
          this.editForm.get('ouCodeList').setValue(null);
        },
      });
  }

  tabViewChange(index: number) {
    this.selectedTabIndex = index;
  }

  getDate(timestamp) {
    var date = new Date(timestamp);
    var year = date.getFullYear();
    var month = ('0' + (date.getMonth() + 1)).substr(-2);
    var day = ('0' + date.getDate()).substr(-2);

    var hour = ('0' + date.getHours()).substr(-2);
    var minutes = ('0' + date.getMinutes()).substr(-2);
    // 2022-05-16T16:00:00.000Z
    return new Date(
      year + '/' + month + '/' + day + 'T' + hour + ':' + minutes + ':00.000'
    );
  }

  convertToLocalDate(responseDate: any) {
    try {
      if (responseDate != null) {
        if (typeof responseDate === 'string') {
          if (String(responseDate.indexOf('T') >= 0)) {
            responseDate = responseDate.split('T')[0];
          }
          if (String(responseDate.indexOf('+') >= 0)) {
            responseDate = responseDate.split('+')[0];
          }
        }

        responseDate = new Date(responseDate);
        const newDate = new Date(
          responseDate.getFullYear(),
          responseDate.getMonth(),
          responseDate.getDate(),
          0,
          0,
          0
        );
        const userTimezoneOffset = newDate.getTimezoneOffset() * 60000;

        const finalDate: Date = new Date(
          newDate.getTime() - userTimezoneOffset
        );
        return finalDate;
      } else {
        return null;
      }
    } catch (error) {
      return responseDate;
    }
  }

  showFilter() {
    this.displayFilterDetail = true;
  }

  changeFilterDetail() {
    this.selectedCols = this.cols.filter((x) => {
      return x.isDefault;
    });
  } // end changeFilterDetail

  onChangeSupervisorUser(event): void {
    this.editForm2.get('dept').setValue('');
    this.getAgentDept(
      this.userContextService.user$.getValue().tenant,
      event.value
    );
  }

  ngOnDestroy(): void {}

  get editF() {
    return this.editForm.controls;
  }

  get editF2() {
    return this.editForm2.controls;
  }

  formTypeFilterChange(e) {
    return this.formTypeOptions.map((item) => item.value.includes(e.filter));
  }

  //#-----------------start------------------
  //# for date picker input format event

  //> check start date / end date
  onCheckDateHandler(form: FormGroup = null): void {
    if (form) {
      if (
        new Date(new Date(form.get('startTime').value)).getTime() >=
        new Date(new Date(form.get('endTime').value)).getTime()
      ) {
        form.get('endTime').setValue(null);
      }
    } else {
      if (
        new Date(new Date(this.startDate)).getTime() >=
        new Date(new Date(this.endDate)).getTime()
      ) {
        this.endDate = null;
      }
    }
  }

  onDatePickerInput(event: InputEvent): void {
    this.dateInputHandlerService.concat(event.data);
  }

  onDatePickerSelectAndBlur(): void {
    this.dateInputHandlerService.clean();
  }

  onDatePickerClose(key: 'startDate'|'endDate'): void {
    if (key==='startDate') {
      this.startDate = this.dateInputHandlerService.getDate() ?? this.startDate;
    }else{
      this.endDate = this.dateInputHandlerService.getDate() ?? this.endDate;
    }
    this.dateInputHandlerService.clean();
  }
  //#------------------end------------------
}
