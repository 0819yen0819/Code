import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  Output,
} from '@angular/core';
import { ActivatedRoute, Params, Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { SelectItem } from 'primeng/api';
import {
  BehaviorSubject,
  combineLatestWith,
  lastValueFrom,
  Observable,
  Subject,
  take,
  takeLast,
  takeUntil,
} from 'rxjs';
import { ReassignDialogService } from 'src/app/core/components/reassign-dialog/reassign-dialog.service';
import { LicenseFormStatusEnum } from 'src/app/core/enums/license-form-status';
import { FormLogInfo } from 'src/app/core/model/form-log-info';
import { DialogSettingParams } from 'src/app/core/model/selector-dialog-params';
import { AuditHistoryLog } from 'src/app/core/model/sign-off-history';
import { UserDepts } from 'src/app/core/model/user-depts';
import { UserInfo } from 'src/app/core/model/user-info';
import { AuthApiService } from 'src/app/core/services/auth-api.service';
import { CommonApiService } from 'src/app/core/services/common-api.service';
import { EditAndSubmitService } from 'src/app/core/services/edit-and-submit.service';
import { IntegrateService } from 'src/app/core/services/integrate.service';
import { MyApplicationService } from 'src/app/core/services/my-application.service';
import { MyFlowService } from 'src/app/core/services/my-flow.service';
import { UserContextService } from 'src/app/core/services/user-context.service';
import { FormTypeEnum } from '../../../../../core/enums/license-name';
import { LanguageService } from '../../../../../core/services/language.service';
import { CurFormInfoService } from '../../../services/cur-form-info.service';
import { CurFormStatusService } from './../../../services/cur-form-status.service';
import { AgentInfoTableService } from 'src/app/core/components/agent-info-table/agent-info-table.service';

@Component({
  selector: 'app-common-license-form-header',
  templateUrl: './license-form-header.component.html',
  styleUrls: ['./license-form-header.component.scss'],
})
export class LicenseFormHeaderComponent
  implements OnInit, OnChanges, OnDestroy
{
  private unSubscribeEvent = new Subject();

  //> get license type from parent component
  @Input() formType!: string;
  @Input() enabledEditAndSubmit: boolean = false;

  @Output() editAndSubmitEmitter: EventEmitter<boolean> =
    new EventEmitter<boolean>();

  //> sent current user dept id to parent component
  @Output() outputUserDeptInfo: EventEmitter<UserDepts> =
    new EventEmitter<UserDepts>();

  @Output() outputCurFormNo: EventEmitter<string> = new EventEmitter<string>();
  @Output() outputCurFormTypeId: EventEmitter<string> =
    new EventEmitter<string>();

  //> license form title
  mainTitle!: string;

  //> date object
  today!: Date;

  //> user info object
  userInfo!: BehaviorSubject<any>;
  userDeptsOptions!: BehaviorSubject<SelectItem<UserDepts>[]>;
  curUserDept!: UserDepts;
  curformStatus!: any;
  curformInfo!: any;

  //>form No
  formNo!: string;
  //>form No
  formTypeId!: string;

  //>form audit action dialog dialog params
  formAuditActionDialogParams!: DialogSettingParams;

  routerHandler!: Router;
  redirectPath!: string;
  isNoApplyPageStatus!: boolean;
  isTaskStarter!: boolean;

  waitApproveOrAssigneeList!: string[];
  isApproveOrAssignee!: boolean;
  isEditAndSubmit!: boolean;

  formStatusDict!: any;

  constructor(
    private userContextService: UserContextService,
    private authApiService: AuthApiService,
    private languageService: LanguageService,
    private commonApiService: CommonApiService,
    private activatedRoute: ActivatedRoute,
    private translateService: TranslateService,
    private router: Router,
    private myFlowService: MyFlowService,
    private curFormStatusService: CurFormStatusService,
    private curFormInfoService: CurFormInfoService,
    private myApplicationService: MyApplicationService,
    public reassignDialogService: ReassignDialogService,
    public integrateService: IntegrateService,
    public editAndSubmitService: EditAndSubmitService,
    private agentInfoTableService : AgentInfoTableService
  ) {
    //> init params
    this.userInfo = new BehaviorSubject<UserInfo | null>(null);
    this.userDeptsOptions = new BehaviorSubject<SelectItem<UserDepts>[]>([]);
    this.formNo = undefined;
    this.formTypeId = undefined;
    this.today = new Date();

    this.waitApproveOrAssigneeList = new Array();
    this.isApproveOrAssignee = false;

    this.routerHandler = this.router;
  }

  ngOnChanges(): void {
    //> get current url params
    this.activatedRoute.queryParams
      .pipe(take(1))
      .subscribe((params: Params) => {
        this.checkEnabledExtend();
        //> 取得 back URL param from URL
        this.redirectPath = params['backUrl'] ? params['backUrl'] : '';

        //> 取得 是否為複製重送單
        this.isEditAndSubmit =
          params['editAndSubmit'] === 'true' || params['editAndSubmit'] === true
            ? true
            : false;

        //> 從 URL 取單號
        if (params['queryFormNo']) {
          this.formNo = params['queryFormNo'];
          this.reassignDialogService.init(this.formNo, this.formTypeId);
          this.outputCurFormNo.emit(params['queryFormNo']);

          this.isNoApplyPageStatus = true;
        } else {
          this.isNoApplyPageStatus = false;
        }

        //> pre load 表單狀態 i18n
        this.onInitFormStatusDict();
        this.onInitFormInfo();
      });
  }

  ngOnInit(): void {
    this.recoverUserSetting();
    //> 初始化表單號
    this.onInitFormNoHandler();

    //> 因觸發在 change i18n 時，不會造成多重賦值問題
    this.translateService.onLangChange
      .pipe(takeUntil(this.unSubscribeEvent))
      .subscribe(() => {
        this.onInitFormStatusDict();
        this.onInitFormInfo();
        if (
          (this.curformStatus &&
            this.curformStatus.status == LicenseFormStatusEnum.DRAFT) ||
          this.isTaskStarter
        ) {
          this.onDraftInitUserDeptHandler();
        } else {
          this.onApproveInitUserDeptHandler();
        }
      });
  }

  ngOnDestroy(): void {
    this.unSubscribeEvent.next(null);
    this.unSubscribeEvent.complete();
  }

  //> cache 表單狀態
  private onInitFormStatusDict(): void {
    this.formStatusDict = this.translateService.instant('LicenseMgmt.Status');
  }

  //> 回壓表單原部門資訊
  private setOriDeptProcess(): void {
    const formDeptInfo = {
      tenant: this.userContextService.user$.getValue().tenant,
      deptCode: this.curformInfo.deptCode,
      deptnameEn: this.curformInfo.deptName,
      deptnameCn: this.curformInfo.deptName,
      deptnameTw: this.curformInfo.deptName,
    };

    //> 如果表單有給 userDeptCode
    if (formDeptInfo.deptCode) {
      this.userDeptsOptions.next([
        {
          label: `${formDeptInfo.tenant}-${formDeptInfo.deptnameTw}`,
          value: formDeptInfo,
        },
      ]);
    } else {
      //> 如果表單沒給 userDeptCode

      this.userDeptsOptions.next([
        {
          label: `${formDeptInfo.tenant}-`,
          value: formDeptInfo,
        },
      ]);
    }
    this.curUserDept = formDeptInfo;

    this.outputUserDeptInfo.emit(formDeptInfo);
  }

  //> 從 DB 讀取 起單者部門資訊
  private setUserDeptOptionFromDB(): void {
    const userAgentDept$ = (
      tenant: UserInfo['tenant'],
      userCode: UserInfo['userCode']
    ): Observable<any> =>
      new Observable<any>((obs) => {
        this.authApiService
          .getUserEmpDataByTenantAndCode(tenant, userCode)
          .pipe(takeLast(1))
          .subscribe((res) => {
            obs.next(res.body);
            obs.complete();
          });
      });

    const userDeptInfo = {
      tenant: this.userContextService.user$.getValue().tenant,
      deptCode: this.curformInfo.deptCode,
      deptnameEn: this.curformInfo.deptName,
      deptnameCn: this.curformInfo.deptName,
      deptnameTw: this.curformInfo.deptName,
    };

    userAgentDept$(
      this.userContextService.user$.getValue().tenant,
      this.curformInfo.userCode
    ).subscribe((userInfo) => {
      let userDepts: UserDepts[] = new Array<UserDepts>();
      userInfo.empDepts.forEach(
        (deptData: {
          dept: {
            deptId: string;
            deptnameEn: string;
            deptnameCn: string;
            deptnameTw: string;
          };
        }) => {
          userDepts.push({
            tenant: userInfo.tenant,
            deptCode: deptData.dept.deptId,
            deptnameEn: deptData.dept.deptnameEn,
            deptnameCn: deptData.dept.deptnameCn,
            deptnameTw: deptData.dept.deptnameTw,
          });
        }
      );

      this.userDeptsOptions.next(new Array<SelectItem<UserDepts>>());
      userDepts.forEach((data) => {
        if (this.translateService.currentLang === 'zh-tw') {
          this.userDeptsOptions.next([
            ...this.userDeptsOptions.getValue(),
            {
              label: `${data.tenant}-${data.deptnameTw}`,
              value: data,
            },
          ]);
        } else {
          this.userDeptsOptions.next([
            ...this.userDeptsOptions.getValue(),
            {
              label: data.deptnameEn
                ? `${data.tenant}-${data.deptnameEn}`
                : `${data.tenant}-${data.deptnameTw}`,
              value: data,
            },
          ]);
        }
      });

      //> 回壓表單部門
      if (
        this.userDeptsOptions
          .getValue()
          .find((dept) => dept.value.deptCode === userDeptInfo.deptCode)
      ) {
        //> 如果跟來源同部門則回壓
        this.curUserDept = this.userDeptsOptions
          .getValue()
          .find((dept) => dept.value.deptCode === userDeptInfo.deptCode).value;
      } else {
        //> 如果跟來源無符合則回壓第一個
        this.curUserDept = this.userDeptsOptions.getValue()[0].value;
      }

      this.outputUserDeptInfo.emit(this.curUserDept);
    });
  }

  //> 壓入草稿單 User Dept
  private onDraftInitUserDeptHandler(deptCode?: string | null): void {
    //> get user's depts
    const userAgentDept$ = (
      tenant: UserInfo['tenant'],
      userCode: UserInfo['userCode']
    ): Observable<UserDepts[]> =>
      new Observable<UserDepts[]>((obs) => {
        this.authApiService
          .getUserEmpDataByTenantAndCode(tenant, userCode)
          .pipe(takeLast(1))
          .subscribe((res) => {
            let userDepts: UserDepts[] = new Array<UserDepts>();

            res.body.empDepts.forEach(
              (deptData: {
                dept: {
                  deptId: string;
                  deptnameEn: string;
                  deptnameCn: string;
                  deptnameTw: string;
                };
              }) => {
                userDepts.push({
                  tenant: res.body.tenant,
                  deptCode: deptData.dept.deptId,
                  deptnameEn: deptData.dept.deptnameEn,
                  deptnameCn: deptData.dept.deptnameCn,
                  deptnameTw: deptData.dept.deptnameTw,
                });
              }
            );

            obs.next(userDepts);
            obs.complete();
          });
      });

    if (this.userInfo) {
      userAgentDept$(
        this.userInfo.getValue().tenant,
        this.userInfo.getValue().userCode
      ).subscribe((userDept) => {
        //>get current language status
        const curLangStatus: string = this.languageService.getLang();
        this.userDeptsOptions.next(new Array<SelectItem<UserDepts>>());
        //> init user depts options

        userDept.forEach((data) => {
          if (curLangStatus === 'zh-tw') {
            this.userDeptsOptions.next([
              ...this.userDeptsOptions.getValue(),
              {
                label: `${data.tenant}-${data.deptnameTw}`,
                value: data,
              },
            ]);
          } else {
            this.userDeptsOptions.next([
              ...this.userDeptsOptions.getValue(),
              {
                label: data.deptnameEn
                  ? `${data.tenant}-${data.deptnameEn}`
                  : `${data.tenant}-${data.deptnameTw}`,
                value: data,
              },
            ]);
          }
        });

        if (deptCode && !this.isEditAndSubmit) {
          try {
            this.curUserDept = this.userDeptsOptions
              .getValue()
              .find((dept) => dept.value.deptCode === deptCode).value;
          } catch (err) {}
        } else {
          this.curUserDept = this.userDeptsOptions.getValue()[0].value;
        }

        this.outputUserDeptInfo.emit(this.curUserDept);
      });
    }
  }

  //> 壓入簽核單 起單者部門
  private onApproveInitUserDeptHandler(): void {
    const userAgentDept$ = (
      tenant: UserInfo['tenant'],
      userCode: UserInfo['userCode']
    ): Observable<any> =>
      new Observable<any>((obs) => {
        this.authApiService
          .getUserEmpDataByTenantAndCode(tenant, userCode)
          .pipe(takeLast(1))
          .subscribe((res) => {
            obs.next(res.body);
            obs.complete();
          });
      });
    userAgentDept$(
      this.userContextService.user$.getValue().tenant,
      this.curformInfo.userCode
    ).subscribe((userInfo) => {
      let userDepts: UserDepts[] = new Array<UserDepts>();
      userInfo.empDepts.forEach(
        (deptData: {
          dept: {
            deptId: string;
            deptnameEn: string;
            deptnameCn: string;
            deptnameTw: string;
          };
        }) => {
          userDepts.push({
            tenant: userInfo.tenant,
            deptCode: deptData.dept.deptId,
            deptnameEn: deptData.dept.deptnameEn,
            deptnameCn: deptData.dept.deptnameCn,
            deptnameTw: deptData.dept.deptnameTw,
          });
        }
      );

      const formDeptInfo = userDepts.find(
        (dept) => dept.deptCode == this.curformInfo.deptCode
      );

      if (this.translateService.currentLang === 'zh-tw') {
        this.userDeptsOptions.next([
          {
            label: `${formDeptInfo.tenant}-${formDeptInfo.deptnameTw}`,
            value: formDeptInfo,
          },
        ]);
      } else {
        this.userDeptsOptions.next([
          {
            label: formDeptInfo.deptnameEn
              ? `${formDeptInfo.tenant}-${formDeptInfo.deptnameEn}`
              : `${formDeptInfo.tenant}-${formDeptInfo.deptnameTw}`,
            value: formDeptInfo,
          },
        ]);
      }
    });
  }

  //> 壓表單標題
  private async onInitFormInfo(): Promise<void> {
    const getFormTitleInfo$ = (
      formType: string
    ): Observable<{
      title: string;
      formTypeId: string;
    }> =>
      new Observable<{
        title: string;
        formTypeId: string;
      }>((obs) => {
        this.myApplicationService
          .getFormTitleInfo(formType)
          .pipe(takeLast(1))
          .subscribe({
            next: (res) => {
              if (this.translateService.currentLang == 'zh-tw') {
                obs.next({
                  title: res.body.formTypeNameC,
                  formTypeId: res.body.formTypeId,
                });
              } else {
                obs.next({
                  title: res.body.formTypeNameE,
                  formTypeId: res.body.formTypeId,
                });
              }

              obs.complete();
            },
            error: (err) => {
              console.error(err);
              obs.next({
                title: '',
                formTypeId: '',
              });
              obs.complete();
            },
          });
      });

    let formInfo = null;

    if (this.formType === FormTypeEnum.EUC_S) {
      formInfo = await lastValueFrom(getFormTitleInfo$('License_EUC'));
    }
    if (this.formType === FormTypeEnum.LICENSE_IMP) {
      formInfo = await lastValueFrom(getFormTitleInfo$('License_Import'));
    }
    if (this.formType === FormTypeEnum.LICENSE_EXP) {
      formInfo = await lastValueFrom(getFormTitleInfo$('License_Export'));
    }
    if (this.formType === FormTypeEnum.SC047) {
      formInfo = await lastValueFrom(getFormTitleInfo$('License_SC047'));
    }
    if (this.formType === FormTypeEnum.SOA) {
      formInfo = await lastValueFrom(getFormTitleInfo$('License_SOA'));
    }
    if (this.formType === FormTypeEnum.ICP) {
      formInfo = await lastValueFrom(getFormTitleInfo$('License_ICP'));
    }

    if (formInfo) {
      this.mainTitle = formInfo.title;
      this.formTypeId = formInfo.formTypeId;
      this.agentInfoTableService.setFormTypeId(this.formTypeId);
      this.integrateService.init(formInfo.formTypeId);
      this.reassignDialogService.init(this.formNo, this.formTypeId);
      this.outputCurFormTypeId.emit(this.formTypeId);
      this.checkFormStatus();
    }
  }

  //> 確認表單狀態，若以結單強制重導向
  private checkFormStatus(): void {
    const userAgentDept$ = (
      tenant: UserInfo['tenant'],
      userCode: UserInfo['userCode']
    ): Observable<any> =>
      new Observable<any>((obs) => {
        this.authApiService
          .getUserEmpDataByTenantAndCode(tenant, userCode)
          .pipe(takeLast(1))
          .subscribe((res) => {
            obs.next(res.body);
            obs.complete();
          });
      });

    //> 取得表單歷程
    const getFlowAuditLog$ = (formNo: string, formTypeId: string) =>
      new Observable<AuditHistoryLog[]>((obs) => {
        if (formNo) {
          this.myFlowService
            .getFlowAuditLog(formNo, formTypeId)
            .pipe(takeLast(1))
            .subscribe((res) => {
              obs.next(res);
              obs.complete();
            });
        } else {
          obs.next([]);
          obs.complete();
        }
      });

    //> 取得當前表單狀態
    const curFormStatus$ = this.curFormStatusService
      .getCurFormStatus()
      .pipe(takeUntil(this.unSubscribeEvent));

    //> 取得當前表單資訊
    const curFormInfo$ = this.curFormInfoService
      .getCurFormInfo()
      .pipe(takeUntil(this.unSubscribeEvent));

    const getFormStatus$ = (
      formNo: string,
      formTypeId: string
    ): Observable<any> =>
      new Observable<any>((obs) => {
        this.myFlowService
          .getFormLog(formNo, formTypeId)
          .pipe(takeLast(1))
          .subscribe({
            next: (res: FormLogInfo) => {
              obs.next(res);
              obs.complete();
            },
            error: (err) => {
              console.error(err);
              obs.next('');
              obs.complete();
            },
          });
      });
    //> 確認當前單子是否已經結案
    getFormStatus$(this.formNo, this.formTypeId).pipe(takeLast(1)).subscribe((res) => {
      //> 當表單狀態為 Approve or Reject 表示已經結案
      //> 跳轉至該單的查詢畫面
      if (
        this.router.url.includes('approving') &&
        (res.status === 'Approve' || res.status === 'Reject')
      ) {
        this.router.navigateByUrl(this.router.url.replace('approving-', ''));
      }

      //> 回壓表單標題+狀態
      if (
        this.router.url.includes('queryFormNo') &&
        !this.isEditAndSubmit &&
        this.mainTitle.substring(
          this.mainTitle.length - 1,
          this.mainTitle.length
        ) !== ')'
      ) {
        this.mainTitle += ` (${this.formStatusDict[res.status]})`;
      }
    });

    getFlowAuditLog$(this.formNo, this.formTypeId)
      .pipe(take(1))
      .subscribe((auditLog) => {
        auditLog.sort((a, b) => (a.seq > b.seq ? 1 : -1));
        //> 有簽核歷程
        //> 表示該單正在 Flowing

        const unSubscribeEvent = new Subject();

        curFormStatus$
          .pipe(combineLatestWith(curFormInfo$), takeUntil(unSubscribeEvent))
          .subscribe((formStatus) => {
            this.curformStatus = formStatus[0];
            this.curformInfo = formStatus[1];

            //> 審核單 ( 且非複製重送草稿單 )
            if (auditLog.length > 0 && !this.isEditAndSubmit) {
              //> 塞入等待簽核(包含加簽)者
              for (const log of auditLog) {
                if (log.status === 'Approving' || log.status === 'Assignee') {
                  this.waitApproveOrAssigneeList.push(log.signerCode);
                }
              }

              //> 確認當前 user 是否為 簽核(加簽)者
              if (
                this.waitApproveOrAssigneeList.includes(
                  this.userContextService.user$.getValue().userCode
                )
              ) {
                this.isApproveOrAssignee = true;
              }

              //> 取得表單現狀資訊
              if (
                this.curformStatus &&
                this.curformStatus.status === LicenseFormStatusEnum.APPROVE &&
                this.curformInfo
              ) {
                unSubscribeEvent.next(null);
                unSubscribeEvent.complete();

                if (
                  !this.router.url.includes('approving') &&
                  this.router.url.includes('queryFormNo')
                ) {
                  //> 查詢頁面
                  this.setOriDeptProcess();
                } else if (
                  (auditLog[auditLog.length - 1].authorizerCode ===
                    this.userContextService.user$.getValue().userCode ||
                    auditLog[auditLog.length - 1].assigneeCode ===
                      this.userContextService.user$.getValue().userCode) &&
                  auditLog[auditLog.length - 1].stepNumber === 1 &&
                  auditLog[auditLog.length - 1].stepName === 'Application'
                ) {
                  //> 判斷當前是否為第一關 ( ReAssign ) 且開啟者為起單人 ( 申請/簽核中 )
                  this.isTaskStarter = true;
                  this.userInfo.next({
                    ...this.userInfo.getValue(),
                    tenant: this.userContextService.user$.getValue().tenant,
                    userCode: this.curformInfo.userCode,
                  });

                  //> 退回第一關需要可重新選擇部門
                  //> 根據表單回壓部門
                  this.setUserDeptOptionFromDB();
                } else {
                  //> 非第一關
                  this.isTaskStarter = false;
                  this.setOriDeptProcess();
                }

                //> 回壓表單日期
                this.today = this.curformInfo.creationDate;

                //> 取得申請人資訊
                userAgentDept$(
                  this.userContextService.user$.getValue().tenant,
                  this.curformInfo.userCode
                ).subscribe((userInfo) => {
                  this.userInfo.next({
                    userCode: userInfo.staffCode,
                    userName: userInfo.fullName,
                    userNameE: userInfo.nickName,
                  });
                });
              }
            } else {
              //> 新申請單 or 草稿單
              this.isTaskStarter = true;
              this.userInfo.next(this.userContextService.user$.getValue());

              //> 草稿單，回壓原資料
              if (this.curformInfo) {
                this.onDraftInitUserDeptHandler(this.curformInfo.deptCode);
              } else {
                //> 新申請單
                this.onDraftInitUserDeptHandler();
              }
            }
          });
      });
  }

  //> init form no
  onInitFormNoHandler(): void {
    //#-------------------------
    //! ICP 由系統拋單
    //! 所以不需要從前端拿取單號
    //#-------------------------
    //> init license form no by license type
    if (!this.isNoApplyPageStatus || this.isEditAndSubmit) {
      if (this.formType === FormTypeEnum.EUC_S) {
        this.onGetFormNoByType('EUCForm');
      } else if (
        this.formType === FormTypeEnum.LICENSE_IMP ||
        this.formType === FormTypeEnum.LICENSE_EXP ||
        this.formType === FormTypeEnum.SC047 ||
        this.formType === FormTypeEnum.ICP
      ) {
        this.onGetFormNoByType('LicenseForm');
      } else if (this.formType === FormTypeEnum.SOA) {
        this.onGetFormNoByType('SOAForm');
      }
    }
  }

  //> 根據單別取得對應單號
  onGetFormNoByType(formType: string): void {
    const getFormID$ = (formName: string): Observable<string> =>
      new Observable<string>((obs) => {
        this.commonApiService
          .idGenerator(formName)
          .pipe(takeLast(1))
          .subscribe((res) => {
            obs.next(res.id);
          });
      });

    //> output current form no.
    getFormID$(formType).subscribe((res) => {
      this.formNo = res;
      this.integrateService.init(this.formTypeId);
      this.reassignDialogService.init(this.formNo, this.formTypeId);
      this.outputCurFormNo.emit(res);
    });
  }

  //> user dept change handler
  onUserDeptIdHandler(event: {
    originalEvent: PointerEvent;
    value: UserDepts;
  }): void {
    //> set current user dept id when user depts select change

    this.outputUserDeptInfo.emit(event.value);
  }

  //> open audit action dialog
  onAuditActionDialogHandler(): void {
    this.formAuditActionDialogParams = {
      title: this.translateService.instant('Dialog.Header.Approve'),
      visiable: true,
      data: {
        formNo: this.formNo,
        formTypeId: this.formTypeId,
      },
    };
  }

  editAndSubmitOnClick() {
    this.editAndSubmitEmitter.emit(true);
  }

  get showEditAndSubmit() {
    if (!this.userInfo.getValue()) {
      return false;
    } else {
      return (
        !this.router.url.includes('approving') &&
        this.userInfo.getValue().userCode ===
          this.userContextService.user$.getValue().userCode &&
        this.enabledEditAndSubmit
      );
    }
  }

  // v---展開---v
  @Output() extendBtnOnClick: EventEmitter<boolean> = new EventEmitter<boolean>();
  extendFormPermission = false; // 是否有權限使用展開&收起
  extendForm = false; // 展開&收起 狀態 flag
  extendFormOnClick() {
    this.extendForm = !this.extendForm;
    document.cookie = `user_extend_form=${this.extendForm.toString()}`;
    this.extendBtnOnClick.emit(this.extendForm)
  }

  @Output() exportPdf: EventEmitter<boolean> = new EventEmitter<boolean>();
  exportPdfOnClick(){
    this.exportPdf.emit(true);
  }

  // 恢復先前設定
  recoverUserSetting() {
    const user_extend_form = document.cookie.split("user_extend_form=");
    if (user_extend_form[1]) { this.extendForm = (user_extend_form[1][0] ?? '') === "t" ? true : false; }
    else { this.extendForm = true; }
  }

  // 取得權限
  private checkEnabledExtend(){
    const allowFormsType = ['ICP'];
    const fullURL = window.location.href;
    this.extendFormPermission = allowFormsType.some(type => fullURL.includes(type));
  }

  get extendBtnLabel() {
    return this.extendForm ? this.translateService.instant('Button.Label.PackUp') : this.translateService.instant('Button.Label.Extend')
  }
  // ^---展開---^

}
