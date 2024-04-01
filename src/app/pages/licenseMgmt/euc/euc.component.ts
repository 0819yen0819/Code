import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { ActivatedRoute, Params, Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { SelectItem } from 'primeng/api';
import {
  BehaviorSubject,
  Observable,
  retry,
  skipWhile,
  Subject,
  take,
  takeLast,
  takeUntil,
} from 'rxjs';
import { LicenseFormStatusEnum } from 'src/app/core/enums/license-form-status';
import { SelectorItemType } from 'src/app/core/enums/selector-item-type';
import { AuditAction } from 'src/app/core/model/audit-action';
import {
  DataTableParams,
  DataTableSettings,
} from 'src/app/core/model/data-table-view';
import { CommonApiService } from 'src/app/core/services/common-api.service';
import { IntegrateService } from 'src/app/core/services/integrate.service';
import { CurFormInfoService } from './../services/cur-form-info.service';

import { ReassignDialogService } from 'src/app/core/components/reassign-dialog/reassign-dialog.service';
import { EUCItemInfo, ShowItemInfo } from 'src/app/core/model/euc-item-info';
import { FormLogInfo } from 'src/app/core/model/form-log-info';
import { OUInfoByTenant } from 'src/app/core/model/ou-info-by-tenant';
import {
  DialogSettingParams,
  SelectorDialogParams,
} from 'src/app/core/model/selector-dialog-params';
import { AuditHistoryLog } from 'src/app/core/model/sign-off-history';
import { UserDepts } from 'src/app/core/model/user-depts';
import { VenCusInfo } from 'src/app/core/model/ven-cus-info';
import { LicenseControlApiService } from 'src/app/core/services/license-control-api.service';
import { LoaderService } from 'src/app/core/services/loader.service';
import { MyFlowService } from 'src/app/core/services/my-flow.service';
import { ObjectFormatService } from 'src/app/core/services/object-format.service';
import { SessionService } from 'src/app/core/services/session.service';
import { UserContextService } from 'src/app/core/services/user-context.service';
import { environment } from 'src/environments/environment';
import { TableCol } from '../../../core/model/data-table-cols';
import { AuditActionControlService } from '../services/audit-action-control.service';
import { CurFormStatusService } from '../services/cur-form-status.service';
import { FormTypeEnum } from './../../../core/enums/license-name';
import { OUGroupInfo } from './../../../core/model/ou-group';
import { AuthApiService } from './../../../core/services/auth-api.service';
import { AgentInfoTableService } from 'src/app/core/components/agent-info-table/agent-info-table.service';

@Component({
  selector: 'app-euc',
  templateUrl: './euc.component.html',
  styleUrls: ['./euc.component.scss'],
})
export class EucComponent implements OnInit, OnDestroy {
  private unsubscribeEvent = new Subject();
  formGroup!: FormGroup;

  formType!: string;
  curUserDept!: UserDepts;
  curFormNo!: string;
  curFormTypeId!: string;
  curCVLable!: string;
  curFormStatus!: {
    status: string;
    formNo?: string;
    success?: boolean;
  };
  curFlowingStatus!: string;
  curFormAuditLog!: AuditHistoryLog[];
  curFormContentFromDB!: BehaviorSubject<any>;
  curLang!: string;

  isTCSUMember!: boolean;
  isTaskStarter!: boolean;

  twoYRange!: Date[];

  //> End User type options
  userTypeOptions!: SelectItem<string>[];
  eUserTypeOptions!: SelectItem<string>[];
  eUseTypeOptions!: SelectItem<string>[];
  ouGroupsOptions!: BehaviorSubject<SelectItem<OUGroupInfo['groupCode']>[]>;

  //> selector dialog params
  selectorDialogParams!: SelectorDialogParams;

  //> apply action dialog params
  applyDialogParams!: DialogSettingParams;

  //> item add dialog params
  itemAMDialogParams!: SelectorDialogParams;
  itemAMDialogMode!: string;
  selectedItemInfo!: any;

  //> select dialog params
  eucitemAMDialogParams!: SelectorDialogParams;

  //> sub-group list by group code
  tanentOUsList!: BehaviorSubject<OUInfoByTenant[]>;

  //> item-selector dialog callback
  selectedUserInfo!: BehaviorSubject<VenCusInfo>;

  //> item queue wait to back-end
  itemQueue!: BehaviorSubject<any[]>;
  itemTableCols!: TableCol[];

  //>notice check dialog params
  noticeCheckDialogParams!: DialogSettingParams;

  //> error message list
  noticeContentList!: string[];

  //> data table settings
  dataTableSettings!: DataTableParams;

  //> exist form cache data for approving event
  cacheAuditActionStatus!: BehaviorSubject<AuditAction>;

  //> euc rule
  eucRuleInfo!: any;

  selectedDataFromTable!: any;

  //> 取代更新表單是否通過狀態，額外拉出來，避免觸發 header 重新判斷部門規則
  isFormPassed!: boolean;

  constructor(
    private formbuilder: FormBuilder,
    private authApiService: AuthApiService,
    private objectFormatService: ObjectFormatService,
    private licenseControlApiService: LicenseControlApiService,
    private activatedRoute: ActivatedRoute,
    private loaderService: LoaderService,
    private myFlowService: MyFlowService,
    private sessionService: SessionService,
    private userContextService: UserContextService,
    private auditActionControlService: AuditActionControlService,
    public router: Router,
    private translateService: TranslateService,
    private curFormStatusService: CurFormStatusService,
    private curFormInfoService: CurFormInfoService,
    private commonApiService: CommonApiService,
    public reassignDialogService: ReassignDialogService,
    private integrateService: IntegrateService,
    private agentInfoTableService : AgentInfoTableService
  ) {}

  ngOnInit(): void {
    //> get ou group by tenant
    const getGroupsByOU$ = (): Observable<OUGroupInfo[]> =>
      new Observable<OUGroupInfo[]>((obs) => {
        this.authApiService
          .groupQuery()
          .pipe(take(1))
          .subscribe((res) => {
            obs.next(res.groupList);
            obs.complete();
          });
      });

    this.curFormStatusService
      .getCurFormStatus()
      .pipe(takeUntil(this.unsubscribeEvent))
      .subscribe((res) => {
        this.curFormStatus = res;
      });

    this.isFormPassed = false;

    //> init form structure
    this.formGroup = this.formbuilder.group({
      userDept: [null],
      curstorType: ['C'],
      curstorId: [null],
      endUserType: ['N'],
      endUseType: ['Y'],
      groupId: [null],
      exp: [
        {
          value: [
            new Date(new Date().setHours(0, 0, 0, 0)),
            new Date(
              new Date(
                new Date().setFullYear(new Date().getFullYear() + 2)
              ).setDate(new Date().getDate() - 1)
            ),
          ],
          disabled: true,
        },
      ],
      remark: [null],
      comment: [null],
    });

    this.curLang = this.translateService.currentLang;

    //> init params
    this.formType = FormTypeEnum.EUC_S;

    //> init notice content array
    this.noticeContentList = new Array<string>();

    //> init form of customer/vendor label
    this.curCVLable = '';

    //>init two year range
    this.twoYRange = [
      new Date(new Date().setHours(0, 0, 0, 0)),
      new Date(
        new Date(new Date().setFullYear(new Date().getFullYear() + 2)).setHours(
          0,
          0,
          0,
          0
        )
      ),
    ];

    //> init item table cols
    this.itemTableCols = new Array<TableCol>();

    //> init behaviorSubject object
    this.ouGroupsOptions = new BehaviorSubject<
      SelectItem<OUGroupInfo['groupCode']>[]
    >([]);
    this.tanentOUsList = new BehaviorSubject<OUInfoByTenant[]>([]);
    this.selectedUserInfo = new BehaviorSubject<VenCusInfo>(null);
    this.itemQueue = new BehaviorSubject<ShowItemInfo[]>([]);

    this.curFormContentFromDB = new BehaviorSubject<any>({});
    this.cacheAuditActionStatus = new BehaviorSubject<any>({});

    this.onInitTypeOptions();
    this.onInitTableSettings();
    this.onInitEUCRuleInfo();

    //> on current lang change, rerender options
    this.translateService.onLangChange
      .pipe(takeUntil(this.unsubscribeEvent))
      .subscribe(() => {
        this.onInitTypeOptions();
        this.onInitTableSettings();
        this.curLang = this.translateService.currentLang;
      });

    //> get groups by OU and init options
    getGroupsByOU$().subscribe((groups) => {
      groups.forEach((group) => {
        if (group.groupCode != 'ALL') {
          this.ouGroupsOptions.next([
            ...this.ouGroupsOptions.getValue(),
            {
              label: group.groupName,
              value: group.groupCode,
            },
          ]);
        }
      });
    });

    this.auditActionControlService
      .onAuditActionHandler()
      .pipe(
        takeUntil(this.unsubscribeEvent),
        skipWhile((res) => res === null)
      )
      .subscribe((res) => {
        this.cacheAuditActionStatus.next(res);
        this.onFormSubmit('approve');
      });

    this.onRouterWatcher();
  }

  ngOnDestroy(): void {
    this.curFormStatusService.resetCurFormStatus();
    this.unsubscribeEvent.next(null);
    this.unsubscribeEvent.complete();
  }

  onInitTableSettings(): void {
    //> init common table view settings
    this.dataTableSettings = new DataTableSettings();
    this.dataTableSettings.isShowNoDataInfo = true;
    this.dataTableSettings.isScrollable = true;
    this.dataTableSettings.isFuzzySearchMode = true;
    this.dataTableSettings.isColSelectorMode = true;
    this.dataTableSettings.isSortMode = true;

    if (
      this.curFormStatus.status == LicenseFormStatusEnum.DRAFT ||
      this.isTaskStarter
    ) {
      this.dataTableSettings.isDeleteMode = true;
      this.dataTableSettings.isEditedMode = true;
      this.dataTableSettings.noDataConText = this.translateService.instant(
        'LicenseMgmt.Common.Hint.AddProductFirst'
      );
    } else if (this.isTCSUMember && this.router.url.includes('approving')) {
      //> TCSU關閉Table刪除功能
      this.dataTableSettings.isSelectMode = true;
      this.dataTableSettings.isEditedMode = true;
      this.dataTableSettings.noDataConText = this.translateService.instant(
        'LicenseMgmt.Common.Hint.NoResult'
      );
    } else {
      //> 非TCSU關閉Table編輯功能
      this.dataTableSettings.noDataConText = this.translateService.instant(
        'LicenseMgmt.Common.Hint.NoResult'
      );
    }
  }

  //> init type options
  onInitTypeOptions(): void {
    this.userTypeOptions = [
      {
        label: 'Customer',
        value: 'C',
      },
      {
        label: 'Vendor',
        value: 'V',
      },
    ];

    this.eUserTypeOptions = [
      {
        label: this.translateService.instant('LicenseMgmt.EUC.Option.Civ'),
        value: 'N',
      },
      {
        label: this.translateService.instant('LicenseMgmt.EUC.Option.Gov'),
        value: 'Y',
      },
    ];

    this.eUseTypeOptions = [
      {
        label: this.translateService.instant('LicenseMgmt.EUC.Option.CivUse'),
        value: 'Y',
      },
      {
        label: this.translateService.instant('LicenseMgmt.EUC.Option.NCivUse'),
        value: 'N',
      },
    ];
  }

  //> init common table view col event
  onInitItemTableCol(): void {
    //> based on itemQueue object key
    if (this.itemTableCols.length == 0) {
      const transCols = this.translateService.instant('LicenseMgmt.EUC.Cols');
      const defaultCol = [
        'productCode',
        'brand',
        'eccn',
        'ccats',
        'proviso',
        'quantity',
        'ctmPo',
        'project',
        'periodFrom',
        'periodTo',
      ];

      for (const col of defaultCol) {
        this.itemTableCols.push({
          label: transCols[col],
          field: col,
        });
      }
    }
  }

  //> init euc 正本資訊 by queryRuleSetup
  onInitEUCRuleInfo(): void {
    const getEUCRuleInfo$ = (): Observable<any> =>
      new Observable((obs) => {
        this.commonApiService
          .queryRuleSetup({
            tenant: 'WPG',
            msgFrom: 'EUCForm',
            trackingId: 'EUCLink',
            searchTenant: 'WPG',
            tenantPermissionList: ['WPG'],
            ruleId: 'EUCLink',
          })
          .pipe(takeLast(1))
          .subscribe({
            next: (res) => {
              obs.next(res.ruleList[0]);
              obs.complete();
            },
            error: (err) => {
              console.error(err);
              obs.next(null);
              obs.complete();
            },
          });
      });

    getEUCRuleInfo$().subscribe((res) => {
      this.eucRuleInfo = res;
    });
  }

  //> form submit event
  //> re-format data for api
  //> mode:apply ( 新單/草稿單 ) / approve ( 審核單 )
  //> type: 送新單( apply ) or 草稿單 ( draft )
  onFormSubmit(mode: string, type?: string): void {
    if (mode === 'Apply') {
      this.onEUCFormApplyHandler(this.onEUCModelFormatForApplyProcess(type));
    } else {
      this.onEUCFormApproveHandler(this.onEUCModelFormatForApproveProcess());
    }
  }

  //> format euc model for approve behavior
  onEUCModelFormatForApproveProcess() {
    const tenant = this.userContextService.user$.getValue().tenant;
    const userCode = this.userContextService.user$.getValue().userCode;

    const tempItem = new Array();
    for (const item of this.itemQueue.getValue()) {
      for (const key of Object.keys(item)) {
        if (item[key] === null) {
          item[key] = '';
        }
      }
      tempItem.push(item);
    }

    this.itemQueue.next(tempItem);

    let itemList = this.itemQueue.getValue();
    for (const [index, item] of itemList.entries()) {
      item.lineId = index + 1;
      delete item.key;
    }

    let vcKit = {};
    if (this.selectedUserInfo.getValue()) {
      if (this.formGroup.get('curstorType').value == 'C') {
        vcKit = {
          vcCode: this.selectedUserInfo.getValue()
            ? this.selectedUserInfo.getValue().customerNo
            : null,
          vcName: this.selectedUserInfo.getValue()
            ? `${this.selectedUserInfo.getValue().customerName}/${
                this.selectedUserInfo.getValue().customerNameEg
              }`
            : null,
        };
      } else {
        vcKit = {
          vcCode: this.selectedUserInfo.getValue()
            ? this.selectedUserInfo.getValue().vendorCode
            : null,
          vcName: this.selectedUserInfo.getValue()
            ? `${this.selectedUserInfo.getValue().vendorName}/${
                this.selectedUserInfo.getValue().vendorEngName
              }`
            : null,
        };
      }
    }

    if (!this.curCVLable) {
      vcKit = {
        vcCode: null,
        vcName: null,
      };
    }

    let groupName: string | null = null;
    try {
      groupName = this.ouGroupsOptions
        .getValue()
        .filter(
          (data) => data.value == this.formGroup.get('groupId').value
        )[0].label;
    } catch {}

    this.itemQueue.getValue().forEach((item, index) => {
      delete item.key;
      item.lineId = index + 1;
      item.periodTo = new Date(item.periodTo).getTime();
      item.periodFrom = new Date(item.periodFrom).getTime();
    });

    const eucFormModel = {
      ...{
        header: {
          ...this.curFormContentFromDB.getValue().header,
          ...this.formGroup.value,
          ...{
            tenant: tenant,
            userCode: userCode,
            formNo: this.curFormNo,
            deptCode: this.curUserDept.deptCode,
            deptName: this.curUserDept.deptnameTw,
            government:
              this.formGroup.get('endUserType').value == 'Y' ? 'Y' : 'N',
            civilianEndUser:
              this.formGroup.get('endUserType').value == 'N' ? 'Y' : 'N',
            civilianEndUse: this.formGroup.get('endUseType').value,
            vcType: this.formGroup.get('curstorType').value,
            memo: this.formGroup.get('remark').value,
            groupCode: this.formGroup.get('groupId').value,
            groupName: groupName,
          },
          ...vcKit,
          ...this.cacheAuditActionStatus.getValue(),
        },
      },
      ...{
        datas: itemList,
      },
    };

    if (eucFormModel.header.comment === null) {
      delete eucFormModel.header.comment;
    }

    eucFormModel.header.startDate = new Date(
      eucFormModel.header.startDate
    ).getTime();
    eucFormModel.header.endDate = new Date(
      eucFormModel.header.endDate
    ).getTime();

    if (eucFormModel.header.rollbackStep != null) {
      eucFormModel.header.activityId = eucFormModel.header.rollbackStep;
    }
    delete eucFormModel.header.rollbackStep;
    delete eucFormModel.header.userName;
    delete eucFormModel.header.creationDate;
    delete eucFormModel.header.curstorId;
    delete eucFormModel.header.curstorType;
    delete eucFormModel.header.groupId;
    delete eucFormModel.header.userDept;
    delete eucFormModel.header.endUseType;
    delete eucFormModel.header.endUserType;
    delete eucFormModel.header.exp;
    delete eucFormModel.header.remark;
    return eucFormModel;
  }

  //> format euc model for apply behavior
  onEUCModelFormatForApplyProcess(type: string, cosigner?: string[]) {
    //> get cur user dept from child component
    this.formGroup.value['userDept'] = this.curUserDept;
    let unixDate: number[] = new Array<number>();
    for (const date of this.formGroup.get('exp').value) {
      unixDate.push(new Date(date).getTime());
    }
    let vcCode: string | null = null;
    let vcName: string | null = null;
    if (this.formGroup.get('curstorType').value == 'C') {
      vcCode =
        this.selectedUserInfo.getValue() != null
          ? this.selectedUserInfo.getValue().customerNo
          : null;
      vcName =
        this.selectedUserInfo.getValue() != null
          ? `${this.selectedUserInfo.getValue().customerName}/${
              this.selectedUserInfo.getValue().customerNameEg
            }`
          : null;
    } else {
      vcCode =
        this.selectedUserInfo.getValue() != null
          ? this.selectedUserInfo.getValue().vendorCode
          : null;
      vcName =
        this.selectedUserInfo.getValue() != null
          ? `${this.selectedUserInfo.getValue().vendorName}/${
              this.selectedUserInfo.getValue().vendorEngName
            }`
          : null;
    }
    let groupName: string | null = null;
    try {
      groupName = this.ouGroupsOptions
        .getValue()
        .filter(
          (data) => data.value == this.formGroup.get('groupId').value
        )[0].label;
    } catch {}
    this.itemQueue.getValue().forEach((item, index) => {
      delete item.key;
      item.lineId = index + 1;
      item.periodTo = new Date(item.periodTo).getTime();
      item.periodFrom = new Date(item.periodFrom).getTime();
    });

    let eucFormModel;

    const tempItem = new Array();
    for (const item of this.itemQueue.getValue()) {
      for (const key of Object.keys(item)) {
        if (item[key] === null) {
          item[key] = '';
        }
      }
      tempItem.push(item);
    }

    //> re-build json for api
    if (!this.router.url.includes('queryFormNo')) {
      eucFormModel = {
        header: {
          action: type,
          tenant: this.curUserDept.tenant,
          formNo: this.curFormNo,
          deptCode: this.curUserDept.deptCode,
          deptName: this.curUserDept.deptnameTw,
          vcType: this.formGroup.get('curstorType').value,
          vcCode: vcCode,
          vcName: vcName,
          government:
            this.formGroup.get('endUserType').value == 'Y' ? 'Y' : 'N',
          civilianEndUser:
            this.formGroup.get('endUserType').value == 'N' ? 'Y' : 'N',
          civilianEndUse: this.formGroup.get('endUseType').value,
          groupCode: this.formGroup.get('groupId').value,
          groupName: groupName,
          memo: this.formGroup.get('remark').value,
          startDate: unixDate[0],
          endDate: unixDate[1],
          creationDate: new Date().getTime(),
          comment:
            this.formGroup.get('comment').value === null
              ? ''
              : this.formGroup.get('comment').value,
        },
        datas: tempItem,
      };
    } else {
      eucFormModel = {
        header: {
          action: type,
          tenant: this.curUserDept.tenant,
          formNo: this.curFormNo,
          deptCode: this.curUserDept.deptCode,
          deptName: this.curUserDept.deptnameTw,
          vcType: this.formGroup.get('curstorType').value,
          vcCode: this.curCVLable.substring(
            0,
            this.curCVLable.indexOf('-') - 1
          ),
          vcName: this.curCVLable.substring(this.curCVLable.indexOf('-') + 1),
          government:
            this.formGroup.get('endUserType').value == 'Y' ? 'Y' : 'N',
          civilianEndUser:
            this.formGroup.get('endUserType').value == 'N' ? 'Y' : 'N',
          civilianEndUse: this.formGroup.get('endUseType').value,
          groupCode: this.formGroup.get('groupId').value,
          groupName: groupName,
          memo: this.formGroup.get('remark').value,
          startDate: unixDate[0],
          endDate: unixDate[1],
          creationDate: new Date().getTime(),
          comment:
            this.formGroup.get('comment').value === null
              ? ''
              : this.formGroup.get('comment').value,
        },
        datas: tempItem,
      };
    }

    if (eucFormModel.header.action === 'addAssignee') {
      eucFormModel.header.cosigner = cosigner;
    }

    return eucFormModel;
  }

  //> open selector dialog handler
  onOpenSelectorDialogEvent(): void {
    let titlePrefix: string = '';

    if (this.translateService.currentLang == 'zh-tw') {
      titlePrefix = '選擇';
    } else {
      titlePrefix = 'Choose';
    }

    if (this.formGroup.get('curstorType').value === 'C') {
      this.selectorDialogParams = {
        title: `${titlePrefix} Custormer`,
        type: SelectorItemType.CUSTOMER,
        visiable: true,
      };
    }
    if (this.formGroup.get('curstorType').value === 'V') {
      this.selectorDialogParams = {
        title: `${titlePrefix} Vendor`,
        type: SelectorItemType.VENDOR,
        visiable: true,
      };
    }
  }

  //> open add item dialog event
  onOpenAddItemDialogEvent(): void {
    this.itemAMDialogParams = {
      title: this.translateService.instant(
        'LicenseMgmt.Common.Title.AddItemInfo'
      ),
      type: SelectorItemType.ITEM,
      visiable: true,
      data: {
        isTaskStarter: this.isTaskStarter,
      },
    };
    this.itemAMDialogMode = 'add';
  }

  onOpenApplyAddAssigneeEvent(): void {
    this.onFormCheck(this.onEUCModelFormatForApplyProcess('addAssignee'));

    if (this.noticeContentList.length === 0) {
      this.applyDialogParams = {
        title: this.translateService.instant('Dialog.Header.AddAssignee'),
        visiable: true,
      };

      this.isFormPassed = true;
    } else {
      this.noticeCheckDialogParams = {
        title: this.translateService.instant(
          'LicenseMgmt.Common.Title.Notification'
        ),
        visiable: true,
        mode: 'error',
      };

      this.isFormPassed = false;
    }
  }

  //> open selector dialog callback event
  onSelectorDialogCallback(result: SelectItem<VenCusInfo>): void {
    this.selectedUserInfo.next(result.value);
    this.formGroup.get('curstorId').setValue(result.value);
    this.curCVLable = `${result.label}`;
  }

  //> on add assignee when apply form
  onApplyDialogCallback(result: { action: string; cosigners: string[] }): void {
    this.onEUCFormApplyHandler(
      this.onEUCModelFormatForApplyProcess(result.action, result.cosigners)
    );
  }

  //> open item add dialog callback event
  onItemAMDialogCallback(result: { mode: string; data: any }): void {
    //> switch data process by callback mode
    if (result.mode === 'single') {
      this.onSingleItemAddHandler(result.data);
    } else {
      this.onMultiItemAddHandler(result.data);
    }
  }

  //> open edit item dialog event
  onEditTargetData(data: EUCItemInfo) {
    let title: string = '';

    if (this.translateService.currentLang == 'zh-tw') {
      title = '修改 Item 相關資料';
    } else {
      title = 'Edit Item Info';
    }

    this.itemAMDialogParams = {
      title: title,
      type: SelectorItemType.ITEM,
      visiable: true,
      data: {
        isTaskStarter: this.isTaskStarter,
        isTCSUMember: this.isTCSUMember ?? false,
      },
    };
    this.itemAMDialogMode = 'edit';
    this.selectedItemInfo = data;
  }

  //> get output data after delete behavior and update cur item data list
  onAfterDeletedDataCallback(data: any): void {
    this.itemQueue.next(data);
  }

  //> switch page mode ( edit / approve ) by currrent url
  onRouterWatcher(): void {
    //> get target form audit log by form's no
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

    //> get target euc form info
    const getTargetEUCInfo$ = (formNo: string | undefined) =>
      new Observable<any>((obs) => {
        if (formNo != undefined) {
          this.licenseControlApiService
            .getTargetEUCInfo(formNo)
            .pipe(takeLast(1))
            .subscribe((res) => {
              obs.next({
                header: res.header,
                datas: res.datas,
              });
            });
        }
      });

    const getFormStatus$ = (
      formNo: string,
      formTypeId: string
    ): Observable<string> =>
      new Observable<string>((obs) => {
        this.myFlowService
          .getFormLog(formNo, formTypeId)
          .pipe(takeLast(1))
          .subscribe({
            next: (res: FormLogInfo) => {
              obs.next(res.status);
              obs.complete();
            },
            error: (err) => {
              console.error(err);
              obs.next('');
              obs.complete();
            },
          });
      });

    //> get current url params
    this.activatedRoute.queryParams
      .pipe(takeUntil(this.unsubscribeEvent))
      .subscribe((params: Params) => {
        if (params['queryFormNo'] != undefined) {
          this.loaderService.show();

          getTargetEUCInfo$(params['queryFormNo']).subscribe((formInfo) => {
            //> 儲存單子內容
            this.curFormInfoService.setCurFormInfo(formInfo.header);
            this.curFormContentFromDB.next(formInfo);
            getFlowAuditLog$(
              params['queryFormNo'],
              formInfo.header.formTypeId
            ).subscribe((auditLog) => {
              //> 取得單子歷程
              auditLog.sort((a, b) => (a.seq > b.seq ? 1 : -1));
              //> 取得單子狀態
              getFormStatus$(
                this.curFormNo,
                formInfo.header.formTypeId
              ).subscribe((res) => {
                this.loaderService.hide();

                if (
                  res !==
                  LicenseFormStatusEnum.DRAFT[0].toUpperCase() +
                    LicenseFormStatusEnum.DRAFT.slice(1)
                ) {
                  //> set up current license status
                  if (auditLog.length == 0) {
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

                  //> 確認當前人員是否為風控
                  for (const log of auditLog) {
                    if (
                      log.signerCode ==
                        this.userContextService.user$.getValue().userCode &&
                      log.stepName === 'TCSU' &&
                      log.status === 'Approving'
                    ) {
                      this.isTCSUMember = true;
                      break;
                    }
                  }

                  //> approving and view status 預設全關
                  this.formGroup.disable();

                  //> approving and view status 預設全關
                  this.dataTableSettings = new DataTableSettings();
                  this.dataTableSettings.noDataConText =
                    this.translateService.instant(
                      'LicenseMgmt.Common.Hint.AddProductFirst'
                    );

                  this.isTaskStarter = false;

                  if (this.router.url.includes('approving')) {
                    if (
                      auditLog[auditLog.length - 1].authorizerCode ===
                        this.userContextService.user$.getValue().userCode &&
                      auditLog[auditLog.length - 1].stepNumber === 1 &&
                      auditLog[auditLog.length - 1].stepName === 'Application'
                    ) {
                      //> 退回第一關且開啟為本人，則可以進行全部修改
                      this.isTaskStarter = true;
                      this.formGroup.enable();
                      this.onInitTableSettings();
                    } else if (this.isTCSUMember) {
                      //> TCSU
                      this.formGroup
                        .get('endUserType')
                        .enable({ onlySelf: true });
                      this.formGroup
                        .get('endUseType')
                        .enable({ onlySelf: true });
                      this.onInitTableSettings();
                    } else {
                      //> 非TCSU者關閉Table編輯功能

                      this.onInitTableSettings();
                    }
                  }
                }

                //> 壓值回表單
                this.formGroup
                  .get('userDept')
                  .setValue(formInfo.header.deptCode);
                this.formGroup
                  .get('endUserType')
                  .setValue(formInfo.header.government);
                this.formGroup
                  .get('endUseType')
                  .setValue(formInfo.header.civilianEndUse);

                this.formGroup
                  .get('exp')
                  .setValue([
                    new Date(formInfo.header.startDate),
                    new Date(formInfo.header.endDate),
                  ]);
                this.formGroup.get('remark').setValue(formInfo.header.memo);

                if (formInfo.header.vcCode != undefined) {
                  this.formGroup
                    .get('curstorType')
                    .setValue(formInfo.header.vcType);
                  this.formGroup
                    .get('curstorId')
                    .setValue(formInfo.header.vcCode);
                  this.curCVLable = `${formInfo.header.vcCode} - ${formInfo.header.vcName}`;
                } else {
                  this.onUserTypeHandler();
                }

                if (formInfo.header.groupCode != undefined) {
                  this.formGroup
                    .get('groupId')
                    .setValue(formInfo.header.groupCode.toString());
                  this.onOUGroupHandler();
                }

                formInfo.datas.forEach((data) => {
                  data.key = data.lineId;
                  data.periodFrom = this.objectFormatService.DateFormat(
                    new Date(data.periodFrom),
                    '/'
                  );
                  data.periodTo = this.objectFormatService.DateFormat(
                    new Date(data.periodTo),
                    '/'
                  );
                });

                this.itemQueue.next(formInfo.datas);

                this.onInitItemTableCol();
              });
            });
          });
        }
      });
  }

  //> user type change handler
  onUserTypeHandler(): void {
    this.selectedUserInfo.next(null);
    this.curCVLable = '';
    this.formGroup.get('curstorId').setValue(null);
  }

  //> user dept change handler
  onUserDeptHandler(value: UserDepts): void {
    this.curUserDept = value;
  }

  //> form type id change handler
  onFormTypeIdHandler(value: string): void {
    this.curFormTypeId = value;
    this.agentInfoTableService.setFormTypeId(this.curFormTypeId);
  }

  //> user dept change handler
  onCurFormNoHandler(value: string): void {
    this.curFormNo = value;
    this.sessionService.setItem('CurFormNo', value);
    this.curFormStatusService
      .getCurFormStatus$(this.curFormNo, this.curFormTypeId)
      .then((obs) => {
        obs.subscribe((res) => {
          this.curFlowingStatus = res;
        });
      });
    this.curFormInfoService
      .getCurFormAuditLog$(this.curFormNo, this.curFormTypeId)
      .then((obs) => {
        obs.subscribe((res) => {
          this.curFormAuditLog = res;
        });
      });
  }

  //> ou group change handler
  onOUGroupHandler(): void {
    //> get OU info by OU group
    const getOUInfoByOUGroup$ = (
      groupCode: OUGroupInfo['groupCode']
    ): Observable<OUInfoByTenant[]> =>
      new Observable<OUInfoByTenant[]>((obs) => {
        this.licenseControlApiService
          .getOuGroup(groupCode)
          .pipe(takeLast(1))
          .subscribe({
            next: (res) => {
              obs.next(res.ouList);
              obs.complete();
            },
            error: (err) => {
              obs.next([]);
              obs.complete();
            },
          });
      });

    getOUInfoByOUGroup$(this.formGroup.get('groupId').value).subscribe(
      (res) => {
        this.tanentOUsList.next(res);
      }
    );
  }

  //> data from add item dialog callback
  //> multi item events
  onMultiItemAddHandler(datas: any[]): void {
    this.noticeContentList = new Array<string>();
    for (const data of datas) {
      if (
        this.itemQueue
          .getValue()
          .findIndex((item) => item.productCode == data.itemID) == -1
      ) {
        //> add item data
        this.itemQueue.next([
          ...this.itemQueue.getValue(),
          {
            key: data.itemID,
            productCode: data.itemID,
            brand: data.brand == undefined ? null : data.brand,
            eccn: data.eccn == undefined ? null : data.eccn,
            ccats: data.ccats == undefined ? null : data.ccats,
            proviso: data.proviso == undefined ? null : data.proviso,
            quantity: data.quantity,
            ctmPo: data.ctmPo,
            project: data.project,
            periodFrom: this.objectFormatService.DateFormat(
              data.periodFrom,
              '/'
            ),
            periodTo: this.objectFormatService.DateFormat(data.periodTo, '/'),
          },
        ]);
      } else {
        let msg = '';
        if (this.translateService.currentLang == 'zh-tw') {
          msg = `Item ID：${data.itemID} 已存在，將自動取消加入。`;
        } else {
          msg = `Item ID：${data.itemID} is already exists, will be automatically add in.`;
        }
        this.noticeContentList.push(msg);
      }
    }

    if (this.noticeContentList.length > 0) {
      this.noticeCheckDialogParams = {
        title: this.translateService.instant(
          'LicenseMgmt.Common.Title.Notification'
        ),
        visiable: true,
        mode: 'error',
      };
    }

    this.onInitItemTableCol();
  }

  //> data from batch edit callback
  onMultiItemBatchEditHandler(datas: any[]): void {
    for (const data of datas) {
      let item = this.itemQueue
        .getValue()
        .find((item) => item.productCode == data.productCode)[0];

      item = { ...item, ...data };
    }
  }

  //> data from add item dialog callback
  //> single item events
  onSingleItemAddHandler(data: any): void {
    if (
      this.itemAMDialogMode == 'add' &&
      this.itemQueue
        .getValue()
        .findIndex((item) => item.productCode == data.itemID) == -1
    ) {
      //> add item data
      this.itemQueue.next([
        ...this.itemQueue.getValue(),
        {
          key: data.itemID,
          productCode: data.itemID,
          brand: data.itemInfo.brand == undefined ? null : data.itemInfo.brand,
          eccn: data.itemInfo.eccn == undefined ? null : data.itemInfo.eccn,
          ccats: data.itemInfo.ccats == undefined ? null : data.itemInfo.ccats,
          proviso:
            data.itemInfo.proviso == undefined ? null : data.itemInfo.proviso,
          quantity: data.quantity,
          ctmPo: data.ctmPo,
          project: data.project,
          periodFrom: this.objectFormatService.DateFormat(
            new Date(data.startDate),
            '/'
          ),
          periodTo: this.objectFormatService.DateFormat(
            new Date(data.endDate),
            '/'
          ),
        },
      ]);

      this.onInitItemTableCol();
    } else if (this.itemAMDialogMode == 'edit') {
      //> update exist item data
      this.itemQueue.next(
        this.itemQueue.getValue().map((item) =>
          item.productCode == this.selectedItemInfo.productCode
            ? {
                ...item,
                ...{
                  key: data.itemID,
                  productCode: data.itemID,
                  brand:
                    data.itemInfo.brand == undefined
                      ? null
                      : data.itemInfo.brand,
                  eccn:
                    data.itemInfo.eccn == undefined ? null : data.itemInfo.eccn,
                  ccats:
                    data.itemInfo.ccats == undefined
                      ? null
                      : data.itemInfo.ccats,
                  proviso:
                    data.itemInfo.proviso == undefined
                      ? null
                      : data.itemInfo.proviso,
                  quantity: data.quantity,
                  ctmPo: data.ctmPo,
                  project: data.project,
                  periodFrom: this.objectFormatService.DateFormat(
                    new Date(data.startDate),
                    '/'
                  ),
                  periodTo: this.objectFormatService.DateFormat(
                    new Date(data.endDate),
                    '/'
                  ),
                },
              }
            : {
                ...item,
                ...{
                  key: data.itemID,
                },
              }
        )
      );
    } else {
      this.noticeContentList = new Array<string>();
      this.noticeContentList.push(
        `Item：${data.itemID} ${this.translateService.instant(
          'LicenseMgmt.Common.Hint.ItemExistError'
        )}`
      );
      this.noticeCheckDialogParams = {
        title: this.translateService.instant(
          'LicenseMgmt.Common.Title.Notification'
        ),
        visiable: true,
        mode: 'error',
      };
    }
  }

  //> euc form apply handler
  onEUCFormApplyHandler(eucFormModel: any): void {
    //> save euc form api observable
    const saveEUCForm$ = (eucFormModel: any): Observable<boolean> =>
      new Observable<boolean>((obs) => {
        this.licenseControlApiService
          .postSaveEUC(eucFormModel)
          .pipe(retry(2))
          .subscribe({
            next: () => {
              obs.next(true);
              obs.complete();
            },
            error: (err) => {
              obs.error(err.message);
              obs.complete();
            },
          });
      });

    //> verify euc form if euc form mode is Apply
    if (
      eucFormModel.header.action === 'Apply' ||
      eucFormModel.header.action === 'addAssignee'
    ) {
      this.onFormCheck(eucFormModel);
    }

    //> if notice content list > 0, show notice dialog
    if (
      (eucFormModel.header.action === 'Apply' ||
        eucFormModel.header.action === 'addAssignee') &&
      this.noticeContentList.length > 0
    ) {
      this.noticeCheckDialogParams = {
        title: this.translateService.instant(
          'LicenseMgmt.Common.Title.Notification'
        ),
        visiable: true,
        mode: 'error',
      };

      this.isFormPassed = false;

      this.itemQueue.getValue().forEach((item) => {
        item.key = item.productCode;
      });
    } else {
      this.noticeCheckDialogParams = {
        visiable: false,
      };

      this.isFormPassed = true;

      //> show loading mask
      this.loaderService.show();

      if (eucFormModel.header.formNo !== undefined) {
        saveEUCForm$(eucFormModel).subscribe({
          next: () => {
            this.loaderService.hide();
            this.onEUCFormApplyNoticeHandler(true, eucFormModel);
          },
          error: (err) => {
            console.error(err);
            this.loaderService.hide();
            this.itemQueue.getValue().forEach((item, index) => {
              item.key = item.productCode;
            });
            this.onEUCFormApplyNoticeHandler(false, eucFormModel);
          },
        });
      }
    }
  }

  //> euc form approve handler
  onEUCFormApproveHandler(eucFormModel: any): void {
    //# TK-25695
    this.noticeContentList = new Array<string>();
    if (eucFormModel.header.formNo !== undefined) {
      if (
        eucFormModel.header.action === 'approve' ||
        (eucFormModel.header.action === 'addAssignee' && this.isTaskStarter)
      ) {
        this.onFormCheck(eucFormModel);
      }

      if (this.noticeContentList.length > 0) {
        this.noticeCheckDialogParams = {
          title: this.translateService.instant(
            'LicenseMgmt.Common.Title.Notification'
          ),
          visiable: true,
          mode: 'error',
        };
        this.itemQueue.getValue().forEach((item, index) => {
          item.key = item.productCode;
        });
      } else {
        this.loaderService.show();
        this.licenseControlApiService
          .postApproveEUC(eucFormModel)
          .pipe(retry(2))
          .subscribe({
            next: () => {
              this.loaderService.hide();
              this.isFormPassed = true;
              if (environment.storeRedirectUrlPrefix == 'local') {
                //> init notice content list
                this.noticeContentList = new Array<string>();
                this.noticeContentList.push(
                  `EUC：${
                    eucFormModel.header.formNo
                  } ${this.translateService.instant(
                    'LicenseMgmt.Common.Hint.ApproveSuccess'
                  )}`
                );
                this.noticeCheckDialogParams = {
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
            error: () => {
              this.loaderService.hide();
              //> init notice content list
              this.noticeContentList = new Array<string>();
              this.noticeContentList.push(
                `EUC：${
                  eucFormModel.header.formNo
                } ${this.translateService.instant(
                  'LicenseMgmt.Common.Hint.ApproveFailed'
                )}`
              );
              //> prevent notice dialog open
              this.noticeCheckDialogParams = {
                visiable: true,
                mode: 'error',
              };
              this.isFormPassed = false;
              this.itemQueue.getValue().forEach((item, index) => {
                item.key = item.productCode;
              });
            },
          });
      }
    }
  }

  //> euc form save notice handler
  onEUCFormApplyNoticeHandler(status: boolean, eucFormModel: any): void {
    //> init notice content list
    this.noticeContentList = new Array<string>();
    //> prevent notice dialog open
    this.noticeCheckDialogParams = {
      visiable: false,
    };

    if (environment.storeRedirectUrlPrefix == 'local') {
      if (status) {
        //> save euc form success behavior
        if (eucFormModel.header.action === 'Draft') {
          this.noticeContentList.push(
            `EUC：${eucFormModel.header.formNo} ${this.translateService.instant(
              'LicenseMgmt.Common.Hint.DraftSuccess'
            )}`
          );
        } else {
          this.noticeContentList.push(
            `EUC：${eucFormModel.header.formNo} ${this.translateService.instant(
              'LicenseMgmt.Common.Hint.ApplySuccess'
            )}`
          );
        }

        this.noticeCheckDialogParams = {
          title: this.translateService.instant(
            'LicenseMgmt.Common.Title.Notification'
          ),
          visiable: true,
          mode: 'success',
        };

        this.isFormPassed = true;
      } else {
        //> save euc form failed behavior
        if (eucFormModel.header.action === 'Draft') {
          this.noticeContentList.push(
            `EUC：${eucFormModel.header.formNo} ${this.translateService.instant(
              'LicenseMgmt.Common.Hint.DraftFailed'
            )}`
          );
        } else {
          this.noticeContentList.push(
            `EUC：${eucFormModel.header.formNo} ${this.translateService.instant(
              'LicenseMgmt.Common.Hint.ApplyFailed'
            )}`
          );
        }

        this.noticeCheckDialogParams = {
          title: this.translateService.instant(
            'LicenseMgmt.Common.Title.Notification'
          ),
          visiable: true,
          mode: 'error',
        };

        this.isFormPassed = false;
      }
    } else {
      if (status) {
        this.isFormPassed = true;
        if (eucFormModel.header.action == 'Draft') {
          window.open(
            `${environment.storeRedirectUrlPrefix}?entryUrl=myforms/search`,
            '_self'
          );
        } else {
          window.open(
            `${environment.storeRedirectUrlPrefix}?entryUrl=myforms/success&type=${this.curFormNo}&formTypeId=${this.curFormTypeId}`,
            '_self'
          );
        }
      } else {
        if (eucFormModel.header.action === 'Draft') {
          this.noticeContentList.push(
            `EUC：${eucFormModel.header.formNo} ${this.translateService.instant(
              'LicenseMgmt.Common.Hint.DraftFailed'
            )}`
          );
        } else {
          this.noticeContentList.push(
            `EUC：${eucFormModel.header.formNo} ${this.translateService.instant(
              'LicenseMgmt.Common.Hint.ApplyFailed'
            )}`
          );
        }

        this.noticeCheckDialogParams = {
          title: this.translateService.instant(
            'LicenseMgmt.Common.Title.Notification'
          ),
          visiable: true,
          mode: 'error',
        };

        this.isFormPassed = false;
      }
    }
  }

  onFormCancelSubmitHandler(): void {
    this.integrateService.cancelOnClick();
  }

  onCancelSelectedDataHandler(): void {
    this.selectedDataFromTable = new Array();
  }

  onSelectedDataHandler(itemList: any[]): void {
    this.selectedDataFromTable = itemList;
  }

  //> reload current page for reset form header
  //> active this when notice dialog closed
  onRedirectHandler(): void {
    if (
      (this.curFormStatus.status == LicenseFormStatusEnum.DRAFT ||
        this.curFormStatus.status == LicenseFormStatusEnum.APPLY ||
        this.curFormStatus.status == LicenseFormStatusEnum.APPROVE) &&
      this.isFormPassed
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

  private onFormCheck(eucFormModel): void {
    //> init notice content list
    this.noticeContentList = new Array<string>();

    if (this.translateService.currentLang == 'zh-tw') {
      if (eucFormModel.datas.length == 0) {
        this.noticeContentList.push('請選擇 Item，並進行資料填寫');
      }

      if (eucFormModel.header.groupCode == null) {
        this.noticeContentList.push('請選擇 Group');
      }

      if (eucFormModel.header.vcCode == null) {
        this.noticeContentList.push('請選擇 客戶 / 廠商');
      }

      if (localStorage.getItem('fileNum') == '0') {
        this.noticeContentList.push('請上傳附件 : 客戶簽署之EUC檔案');
      }
    } else {
      if (eucFormModel.datas.length == 0) {
        this.noticeContentList.push('Please select Item(s)');
      }

      if (eucFormModel.header.groupCode == null) {
        this.noticeContentList.push('Please select Group');
      }

      if (eucFormModel.header.vcCode == null) {
        this.noticeContentList.push('Please select Customer / Vendor');
      }

      if (this.sessionService.getItem('fileNum') == 0) {
        this.noticeContentList.push(
          'Please upload attachment: EUC document that signed by Customer'
        );
      }
    }
  }
}
