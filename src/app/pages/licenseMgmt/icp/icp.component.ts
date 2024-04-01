import { DateInputHandlerService } from './../../../core/services/date-input-handler.service';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { ActivatedRoute, Params, Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { SelectItem } from 'primeng/api';
import {
  BehaviorSubject,
  Observable,
  skipWhile,
  Subject,
  take,
  takeLast,
  takeUntil,
  zip,
} from 'rxjs';
import { ReassignDialogService } from 'src/app/core/components/reassign-dialog/reassign-dialog.service';
import { LicenseFormStatusEnum } from 'src/app/core/enums/license-form-status';
import { FormTypeEnum } from 'src/app/core/enums/license-name';
import { AuditAction } from 'src/app/core/model/audit-action';
import { ICPRuleInfo } from 'src/app/core/model/icp-rule-info';
import { DialogSettingParams } from 'src/app/core/model/selector-dialog-params';
import { AuditHistoryLog } from 'src/app/core/model/sign-off-history';
import { UserDepts } from 'src/app/core/model/user-depts';
import { SimpleUserInfo } from 'src/app/core/model/user-info';
import { LicenseControlApiService } from 'src/app/core/services/license-control-api.service';
import { LoaderService } from 'src/app/core/services/loader.service';
import { MyFlowService } from 'src/app/core/services/my-flow.service';
import { ObjectFormatService } from 'src/app/core/services/object-format.service';
import { UserContextService } from 'src/app/core/services/user-context.service';
import { environment } from 'src/environments/environment';
import { AuditActionControlService } from '../services/audit-action-control.service';
import { CurFormInfoService } from '../services/cur-form-info.service';
import { CurFormStatusService } from '../services/cur-form-status.service';
import { AuthApiService } from './../../../core/services/auth-api.service';
import { IcpProcessService } from './icp-process.service';
import * as html2pdf from 'html2pdf.js';
import { AgentInfoTableService } from 'src/app/core/components/agent-info-table/agent-info-table.service';
@Component({
  selector: 'app-icp',
  templateUrl: './icp.component.html',
  styleUrls: ['./icp.component.scss'],
})
export class IcpComponent implements OnInit, OnDestroy {
  private unsubscribeEvent = new Subject();

  formGroup!: FormGroup;
  //> 表單類型
  formType!: string;

  //> 當前表單狀態
  curUserDept!: UserDepts;
  curFormNo!: string;
  curFormTypeId!: string;
  curFormStatus!: {
    status: string;
    formNo?: string;
    success?: boolean;
  };

  //>是否為起單人
  isTaskStarter!: boolean;

  //> notice check dialog params
  noticeCheckDialogParams!: DialogSettingParams;
  //> error message list
  noticeContentList!: string[];

  //> 鎖定篩選人員 autocomplete 輸入事件
  isEmpFieldLock!: boolean;

  //> 當前 All Set 選擇器狀態
  curAllSetStatus!: string | null;

  curEmpInfo!: SelectItem<SimpleUserInfo>;
  curFlowingStatus!: string;

  //> Customer type Option
  customerTypeOptiom!: SelectItem<string>[];
  //> ICP Rule Switch Option
  stateOptions!: SelectItem<string>[];

  //> 模糊查詢 EMP 資料選項
  fuzzyEmpInfosOptions!: BehaviorSubject<SelectItem<SimpleUserInfo>[]>;

  //> ICP Check Rules
  icpCheckRules!: BehaviorSubject<ICPRuleInfo[]>;

  routerInfo!: Router;

  constructor(
    private activatedRoute: ActivatedRoute,
    private translateService: TranslateService,
    private formBuilder: FormBuilder,
    private licenseControlApiService: LicenseControlApiService,
    private userContextService: UserContextService,
    private objectFormatService: ObjectFormatService,
    private loaderService: LoaderService,
    private router: Router,
    private myFlowService: MyFlowService,
    private curFormStatusService: CurFormStatusService,
    private auditActionControlService: AuditActionControlService,
    private curFormInfoService: CurFormInfoService,
    private icpProcessService: IcpProcessService,
    private authApiService: AuthApiService,
    public reassignDialogService: ReassignDialogService,
    private dateInputHandlerService: DateInputHandlerService,
    private agentInfoTableService : AgentInfoTableService
  ) {}

  ngOnInit(): void {
    //> 指定表單為 ICP
    this.formType = FormTypeEnum.ICP;

    //> Init all set selector value
    this.curAllSetStatus = null;

    //> Init 負責人員 AutoComplete Lock Status
    this.isEmpFieldLock = false;

    //> Init 當前人員狀態
    this.isTaskStarter = true;

    //> Init form fields
    this.formGroup = this.formBuilder.group({
      ouCode: [null],
      ouName: [null],
      custCode: [null],
      custName: [null],
      source: [null],
      empCode: [null],
      empName: [null],
      companyName: [null],
      custAddress: [null],
      trxDate: [null],
      trxNo: [null],
      shipToAddress: [null],
      exportControlItem: [null],
      isNew: [null],
    });

    //> Init Emp Info Options
    this.fuzzyEmpInfosOptions = new BehaviorSubject<
      SelectItem<SimpleUserInfo>[]
    >([]);

    this.icpCheckRules = new BehaviorSubject<ICPRuleInfo[]>([]);

    this.routerInfo = this.router;

    this.onInitDropdownOptionEvent();
    this.onRouterWatcher();

    //> 監聽當前表單狀態
    this.curFormStatusService
      .getCurFormStatus()
      .pipe(takeUntil(this.unsubscribeEvent))
      .subscribe((res) => {
        this.curFormStatus = res;
      });

    this.translateService.onLangChange
      .pipe(takeUntil(this.unsubscribeEvent))
      .subscribe(() => {
        this.onInitDropdownOptionEvent();
      });

    //> 監聽 audit action 回傳，並進行 Approve
    this.auditActionControlService
      .onAuditActionHandler()
      .pipe(
        takeUntil(this.unsubscribeEvent),
        skipWhile((res) => res === null)
      )
      .subscribe((res) => {
        if (this.router.url.includes('approving')) {
          this.onFormSubmit(res);
        }
      });
  }

  ngOnDestroy(): void {
    this.unsubscribeEvent.next(null);
    this.unsubscribeEvent.complete();
  }

  //> switch page mode ( edit / draft / approve ) by currrent url
  onRouterWatcher(): void {
    //> get target form audit log by form's no
    const getFlowAuditLog$ = (
      formNo: string,
      formTypeId: string
    ): Observable<any> =>
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

    //> get target imp/exp license form info
    const getTargetICPForm$ = (formNo: string | undefined): Observable<any> =>
      new Observable<any>((obs) => {
        if (formNo != undefined) {
          this.licenseControlApiService
            .getTargetICPForm(formNo)
            .pipe(takeLast(1))
            .subscribe((res) => {
              obs.next(res);
              obs.complete();
            });
        }
      });

    //> get ICP Check Rules form Backend
    const getICPCheckRules$ = (): Observable<any> =>
      new Observable((obs) => {
        this.icpProcessService.getICPCheckRules().subscribe((res) => {
          obs.next(res);
          obs.complete();
        });
      });

    //> 取得當前 URL Params
    this.activatedRoute.queryParams
      .pipe(takeUntil(this.unsubscribeEvent))
      .subscribe((params: Params) => {
        if (params['queryFormNo']) {
          //> 打開畫面 Loading Mask
          this.loaderService.show();

          //> 讀取原單內容
          //> 讀取單子歷程
          zip(
            getTargetICPForm$(params['queryFormNo']),
            getICPCheckRules$()
          ).subscribe((res) => {
            //> 關閉畫面 Loading Mask
            this.loaderService.hide();

            const formInfo = res[0];
            let icpCheckRules = res[1];

            //> 儲存單子內容
            this.curFormInfoService.setCurFormInfo(formInfo);
            getFlowAuditLog$(
              params['queryFormNo'],
              formInfo.formTypeId
            ).subscribe((auditLog) => {
              //> ReSort 單子歷程 by seq
              auditLog.sort((a, b) => (a.seq > b.seq ? 1 : -1));
              //> set up current license status
              if (auditLog.length === 0) {
                this.curFormStatusService.setCurFormStatus({
                  status: LicenseFormStatusEnum.DRAFT,
                  formNo: params['queryFormNo'],
                });
              } else {
                this.curFormStatusService.setCurFormStatus({
                  status: LicenseFormStatusEnum.APPROVE,
                  formNo: params['queryFormNo'],
                });
              }

              //> 檢查是否為起單者
              //> 篩選人員鎖操作在 html 裡面
              this.isTaskStarter =
                this.icpProcessService.checkIsTaskStarter(auditLog);
              //>避免狀況：起單者在檢視畫面欄位被開啟
              if (this.isTaskStarter && this.router.url.includes('approving')) {
                this.formGroup.enable();
              } else {
                this.formGroup.disable();
              }
            });

            //> 壓值回表單 start  ----------
            for (const formKey of Object.keys(this.formGroup.value)) {
              if (formKey === 'trxDate') {
                this.formGroup
                  .get(formKey)
                  .setValue(new Date(formInfo[formKey]));
              } else {
                this.formGroup
                  .get(formKey)
                  .setValue(
                    formInfo[formKey] === undefined ? null : formInfo[formKey]
                  );
              }
            }

            const empName = this.formGroup.get('empName').value;
            this.curEmpInfo = {
              label: `${this.formGroup.get('empCode').value} ${
                this.formGroup.get('empName').value
              }`,
              value: {
                staffCode: this.formGroup.get('empCode').value,
                fullName: empName.substring(0, empName.indexOf('/') - 1),
                nickName: empName.substring(empName.indexOf('/') + 2),
              },
            };

            this.fuzzyEmpInfosOptions.next([
              {
                label: `${this.formGroup.get('empCode').value} ${
                  this.formGroup.get('empName').value
                }`,
                value: this.curEmpInfo.value,
              },
            ]);

            this.isEmpFieldLock = true;
            //> 壓值回表單 end  ----------

            //> 壓回 ICP Rules Check status
            icpCheckRules = this.icpProcessService.reParseICPRulesStatusToData(
              icpCheckRules,
              formInfo.checkTrue ? formInfo.checkTrue.split(',') : [],
              formInfo.checkFalse ? formInfo.checkFalse.split(',') : []
            );
            this.icpCheckRules.next(icpCheckRules);
            this.checkAllICPStatus();
          });
        }
      });
  }

  //> on init dropdown option
  onInitDropdownOptionEvent(): void {
    //> Init ICP Rule Switch Option
    this.stateOptions = [
      { label: 'Y', value: 'Y' },
      { label: 'N', value: 'N' },
    ];

    this.customerTypeOptiom = [
      {
        label: this.translateService.instant(
          'LicenseMgmt.ICP.Option.NewCustomer'
        ),
        value: 'Y',
      },
      {
        label: this.translateService.instant(
          'LicenseMgmt.ICP.Option.OldCustomer'
        ),
        value: 'N',
      },
    ];
  }

  //> user dept change handler
  onCurFormNoHandler(value: string): void {
    this.curFormNo = value;
    this.curFormStatusService
      .getCurFormStatus$(this.curFormNo, this.curFormTypeId)
      .then((obs) => {
        obs.pipe(take(1)).subscribe((res) => {
          this.curFlowingStatus = res;
        });
      });
  }

  //> user dept change handler
  onCurUserDeptHandler(value: UserDepts): void {
    this.curUserDept = value;
  }

  //> form type id change handler
  onFormTypeIdHandler(value: string): void {
    this.curFormTypeId = value;
    this.agentInfoTableService.setFormTypeId(this.curFormTypeId);
  }

  //> on ICP all set selector change event
  onAllSetSelectorHandler(event): void {
    this.icpCheckRules.next(
      this.icpProcessService.resetRulesStatus(
        this.icpCheckRules.getValue(),
        event.value
      )
    );
  }

  //> on ICP single selector change event
  onSingleSelectorHandler(): void {
    this.checkAllICPStatus();
  }

  //> get simple emp info by keyword ( fuzzy search )
  onEmpFilterHandler(event): void {
    const getFuzzyEmpInfo$ = (keyword: string): Observable<SimpleUserInfo[]> =>
      new Observable<SimpleUserInfo[]>((obs) => {
        const tenant = this.userContextService.user$.getValue().tenant;

        if (keyword != '' && keyword != undefined) {
          this.authApiService
            .getAllEmpByTenant(tenant, keyword)
            .pipe(skipWhile((data) => data.type == 0))
            .subscribe((res) => {
              obs.next(res.body);
              obs.complete();
            });
        } else {
          obs.next([]);
          obs.complete();
        }
      });

    getFuzzyEmpInfo$(event.query).subscribe((empInfos) => {
      this.fuzzyEmpInfosOptions.next([]);

      for (const empInfo of empInfos) {
        if (
          this.fuzzyEmpInfosOptions
            .getValue()
            .findIndex((data) => data.value.staffCode == empInfo.staffCode) ==
          -1
        ) {
          this.fuzzyEmpInfosOptions.next([
            ...this.fuzzyEmpInfosOptions.getValue(),
            {
              label: `${empInfo.staffCode} ${empInfo.fullName} / ${empInfo.nickName}`,
              value: empInfo,
            },
          ]);
        }
      }
    });
  }

  //> watch form field keydown event handler
  onFieldKeyDownHandler(event: KeyboardEvent): void {
    if (
      (event.key == 'Backspace' || event.key == 'Delete') &&
      this.router.url.includes('approving')
    ) {
      this.isEmpFieldLock = false;
      this.curEmpInfo = null;
      this.formGroup.get('empCode').setValue(null);
      this.formGroup.get('empName').setValue(null);
    }
  }

  onFieldBlurHandler(): void {
    if (!this.formGroup.get('empCode').value) {
      this.isEmpFieldLock = false;
      this.curEmpInfo = null;
      this.formGroup.get('empCode').setValue(null);
      this.formGroup.get('empName').setValue(null);
    }
  }

  //> reload current page for reset form header
  //> active this when notice dialog closed
  onRedirectHandler(): void {
    if (
      (this.curFormStatus.status == LicenseFormStatusEnum.DRAFT ||
        this.curFormStatus.status == LicenseFormStatusEnum.APPLY ||
        this.curFormStatus.status == LicenseFormStatusEnum.APPROVE) &&
      this.curFormStatus.success
    ) {
      if (environment.storeRedirectUrlPrefix == 'local') {
        this.router.navigate(['/', 'applicationMgmt', 'my-application']);
      } else {
        window.open(
          `${environment.storeRedirectUrlPrefix}?entryUrl=myforms/search`,
          '_self'
        );
      }
    }
  }

  //> 監聽 curEmpInfo 值變化事件
  onCurEmpInfoWather(event): void {
    if (event !== null && event.value) {
      this.isEmpFieldLock = true;
      this.formGroup.get('empCode').setValue(event.value.staffCode);
      this.formGroup
        .get('empName')
        .setValue(`${event.value.fullName} / ${event.value.nickName}`);
    } else {
      this.formGroup.get('empCode').setValue(null);
      this.formGroup.get('empName').setValue(null);
    }
  }

  onFormSubmit(auditActionModel: AuditAction): void {
    this.noticeContentList = [];
    //> 檢核 ICP Form & ICP Rules
    if (
      auditActionModel.action === 'approve' ||
      (auditActionModel.action === 'addAssignee' && this.isTaskStarter)
    ) {
      this.noticeContentList = this.icpProcessService.validICPForm(
        this.formGroup,
        this.icpCheckRules.getValue()
      );
    }

    let icpModel = {
      ...{
        tenant: this.userContextService.user$.getValue().tenant,
        userCode: this.userContextService.user$.getValue().userCode,
        formNo: this.curFormNo,
        deptCode: this.curUserDept.deptCode,
        deptName: this.curUserDept.deptnameTw,
      },
      ...this.objectFormatService.ObjectClean(this.formGroup.value),
      ...auditActionModel,
      ...{ trxDate: new Date(this.formGroup.get('trxDate').value).getTime() },
      ...this.icpProcessService.parseICPRulesStatus(
        this.icpCheckRules.getValue()
      ),
    };

    //> 如果有錯誤資訊，顯示對話窗，阻擋流程
    if (this.noticeContentList.length > 0 && icpModel.action == 'approve') {
      this.noticeCheckDialogParams = {
        title: this.translateService.instant(
          'LicenseMgmt.Common.Title.Notification'
        ),
        visiable: true,
        mode: 'error',
      };
      this.curFormStatusService.setCurFormStatus({
        ...this.curFormStatus,
        ...{ success: false },
      });
    } else {
      this.noticeCheckDialogParams = {
        visiable: false,
      };

      this.loaderService.show();

      this.licenseControlApiService
        .postApproveICPForm(icpModel)
        .pipe(takeLast(1))
        .subscribe({
          next: () => {
            this.loaderService.hide();
            this.curFormStatusService.setCurFormStatus({
              ...this.curFormStatus,
              ...{ success: true },
            });
            //> init notice content list
            if (environment.storeRedirectUrlPrefix == 'local') {
              this.noticeContentList = new Array<string>();
              this.noticeContentList.push(
                `ICP：${icpModel.formNo} ${this.translateService.instant(
                  'LicenseMgmt.Common.Hint.ApproveSuccess'
                )}`
              );
              //> prevent notice dialog open
              this.noticeCheckDialogParams = {
                title: this.translateService.instant(
                  'LicenseMgmt.Common.Title.Notification'
                ),
                visiable: true,
                mode: 'success',
              };
            } else {
              window.open(
                `${environment.storeRedirectUrlPrefix}?entryUrl=myforms/success&type=${this.curFormNo}&formTypeId=${this.curFormTypeId}`,
                '_self'
              );
            }
          },
          error: (err) => {
            console.error(err);
            this.loaderService.hide();
            this.curFormStatusService.setCurFormStatus({
              ...this.curFormStatus,
              ...{ success: false },
            });
            //> init notice content list
            this.noticeContentList = new Array<string>();
            this.noticeContentList.push(
              `ICP：${icpModel.formNo} ${this.translateService.instant(
                'LicenseMgmt.Common.Hint.ApproveFailed'
              )}`
            );
            //> prevent notice dialog open
            this.noticeCheckDialogParams = {
              visiable: true,
              mode: 'error',
            };
          },
        });
    }
  }

  //> 檢測 ICP Rules Status 是否全部統一
  private checkAllICPStatus(): void {
    //> return All ICP Rules / All Set Status
    const result = this.icpProcessService.checkAllICPStatus(
      this.icpCheckRules.getValue()
    );
    this.icpCheckRules.next(result[0]);
    this.curAllSetStatus = result[1];
  }

  //#-----------------start------------------
  //# for date picker input format event
  onDatePickerInput(event: InputEvent): void {
    this.dateInputHandlerService.concat(event.data);
  }

  onDatePickerSelectAndBlur(): void {
    this.dateInputHandlerService.clean();
  }

  onDatePickerClose(key: string): void {
    this.formGroup.controls[key].setValue(
      this.dateInputHandlerService.getDate() ??
        this.formGroup.controls[key].value
    );
    this.dateInputHandlerService.clean();
  }
  //#------------------end------------------

  // 恢復先前設定
  recoverUserSetting() {
    const user_extend_form = document.cookie.split("user_extend_form=");
    if (user_extend_form[1]) { this.extendForm = (user_extend_form[1][0] ?? '') === "t" ? true : false; }
    else { this.extendForm = true; }
  }

  extendForm = false;
  getExtendBtnOnClick(e){
    this.extendForm = e;
  }
  
  exportPdf(){
    const extendStatus = this.extendForm;

    this.extendForm = true;
    this.loaderService.show();

    setTimeout(() => { // 待 repaint 完成
      const element = document.getElementById('icp-full-content');
      const opt = {
        margin:       1,
        filename:     `${this.curFormNo}.pdf`,
        image:        { type: 'jpeg', quality: 0.98 },
        html2canvas:  { scale: 2 },
        jsPDF:        { unit: 'mm', format: 'a1', orientation: 'portrait'}
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
}
