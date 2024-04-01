import { DatePipe } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { ActivatedRoute, Params, Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { SelectItem } from 'primeng/api';
import {
  BehaviorSubject,
  filter,
  from,
  mergeMap,
  Observable,
  Subject,
  take,
  takeLast,
  takeUntil,
  takeWhile,
} from 'rxjs';
import { ImpexpHandlerService } from './services/impexp-handler.service';
import { ImpexpInitService } from './services/impexp-init.service';

import { ReassignDialogService } from 'src/app/core/components/reassign-dialog/reassign-dialog.service';
import { LicenseFormStatusEnum } from 'src/app/core/enums/license-form-status';
import { FormTypeEnum } from 'src/app/core/enums/license-name';
import { SelectorItemType } from 'src/app/core/enums/selector-item-type';
import { AttachedLink } from 'src/app/core/model/attached-add-about';
import { AuditAction } from 'src/app/core/model/audit-action';
import { ConsigneeInfo } from 'src/app/core/model/consignee-info';
import { TableCol } from 'src/app/core/model/data-table-cols';
import {
  DataTableParams,
  DataTableSettings,
} from 'src/app/core/model/data-table-view';
import { ERPEXPDOInfo } from 'src/app/core/model/exp-ref-info';
import { FormLogInfo } from 'src/app/core/model/form-log-info';
import { ImpLicenseItemInfo } from 'src/app/core/model/item-info';
import {
  DialogSettingParams,
  SelectorDialogParams,
} from 'src/app/core/model/selector-dialog-params';
import { AuditHistoryLog } from 'src/app/core/model/sign-off-history';
import { UserDepts } from 'src/app/core/model/user-depts';
import { CommonApiService } from 'src/app/core/services/common-api.service';
import { IntegrateService } from 'src/app/core/services/integrate.service';
import { LicenseControlApiService } from 'src/app/core/services/license-control-api.service';
import { LoaderService } from 'src/app/core/services/loader.service';
import { MyFlowService } from 'src/app/core/services/my-flow.service';
import { ObjectFormatService } from 'src/app/core/services/object-format.service';
import { environment } from 'src/environments/environment';
import { AuditActionControlService } from '../services/audit-action-control.service';
import { CurFormStatusService } from '../services/cur-form-status.service';
import { SessionService } from './../../../core/services/session.service';
import { UserContextService } from './../../../core/services/user-context.service';
import { CurFormInfoService } from './../services/cur-form-info.service';
import { ImpexpProcessService } from './services/impexp-process.service';

@Component({
  selector: 'app-impexp',
  templateUrl: './impexp.component.html',
  styleUrls: ['./impexp.component.scss'],
})
export class ImpexpComponent implements OnInit, OnDestroy {
  private unsubscribeEvent = new Subject();
  FormTypeEnum = FormTypeEnum

  formGroup!: FormGroup;

  formType!: string;
  curUserDept!: UserDepts;
  curFormNo!: string;
  curFormTypeId!: string;
  curSelectType!: string;
  curURL!: string;
  curFormStatus!: {
    status: string;
    formNo?: string;
    success?: boolean;
  };
  curFlowingStatus!: string;

  //> exist form cache data for approving event
  curFormContentFromDB!: BehaviorSubject<any>;

  isWarehouseMember!: boolean;
  isCurFormPass!: boolean;
  isTaskStarter!: boolean;

  isReOpenItemEditDialog!: boolean;
  storeTempItemEditData!: any;

  //> item queue wait to back-end
  itemQueue!: BehaviorSubject<any[]>;
  itemTableCols!: TableCol[];

  //> imp am item dialog params
  impItemAMDialogParams!: SelectorDialogParams;
  impItemAMDialogMode!: string;
  selectedImpItemInfo!: ImpLicenseItemInfo;

  //> exp am item dialog params
  expItemAMDialogParams!: SelectorDialogParams;
  expItemAMDialogMode!: string;
  selectedExpItemInfo!: any;

  //> exp add item by ref dialog params
  expItemRefDialogParams!: DialogSettingParams;

  //> selector dialog params
  selectorDialogParams!: SelectorDialogParams;

  //> apply action dialog params
  applyDialogParams!: DialogSettingParams;

  //> form options
  warehouseOptions!: SelectItem<string>[];
  userTypeOptions!: SelectItem<string>[];
  hkConsigneeOptions!: SelectItem<ConsigneeInfo>[];
  expTypeOptions!: SelectItem<string>[];

  //> data table settings
  dataTableSettings!: DataTableParams;

  //> notice check dialog params
  noticeCheckDialogParams!: DialogSettingParams;
  //> error message list
  noticeContentList!: string[];

  //> attached link/file list
  attachedLinkList!: BehaviorSubject<AttachedLink[]>;
  attachedFileList!: BehaviorSubject<File[]>;

  //> placeholders
  shipToCodePlaceholder!: string;
  deliverToCodePlaceholder!: string;

  isEditAndSubmitPage = false;

  constructor(
    private activatedRoute: ActivatedRoute,
    private sessionService: SessionService,
    private translateService: TranslateService,
    private licenseControlApiService: LicenseControlApiService,
    private userContextService: UserContextService,
    private objectFormatService: ObjectFormatService,
    private loaderService: LoaderService,
    public router: Router,
    private myFlowService: MyFlowService,
    private curFormStatusService: CurFormStatusService,
    private auditActionControlService: AuditActionControlService,
    private commonApiService: CommonApiService,
    private curFormInfoService: CurFormInfoService,
    public reassignDialogService: ReassignDialogService,
    private datePipe: DatePipe,
    private impexpProcessService: ImpexpProcessService,
    private integrateService: IntegrateService,
    private impexpInitService: ImpexpInitService,
    private impexpHandlerService: ImpexpHandlerService
  ) { }

  ngOnInit(): void {
    this.formGroup = this.impexpInitService.onInitForm();

    this.isWarehouseMember = false;
    this.isTaskStarter = true;
    this.isReOpenItemEditDialog = false;

    this.userTypeOptions = this.impexpInitService.onInitUserTypeOptions();

    this.isTaskStarter = true;
    this.isWarehouseMember = false;

    //> init item table cols
    this.itemTableCols = new Array<TableCol>();

    //> init item list
    this.itemQueue = new BehaviorSubject<any[]>([]);
    this.warehouseOptions = new Array<SelectItem<string>>();
    this.hkConsigneeOptions = new Array<SelectItem<ConsigneeInfo>>();
    this.attachedLinkList = new BehaviorSubject<AttachedLink[]>([]);
    this.attachedFileList = new BehaviorSubject<File[]>([]);

    this.curFormContentFromDB = new BehaviorSubject<any>({});

    this.auditActionControlService
      .onAuditActionHandler()
      .pipe(takeUntil(this.unsubscribeEvent))
      .subscribe(async (res) => {
        //# TK-25695
        this.noticeContentList = new Array<string>();
        if (this.router.url.includes('approving') && res) {
          if (res.action === 'approve' || (res.action === 'addAssignee' && this.isTaskStarter)) {
            if (this.formType === FormTypeEnum.LICENSE_IMP) {
              this.noticeContentList =
                await this.impexpProcessService.onIMPFormChecker(
                  this.curFormNo,
                  this.curFormTypeId,
                  this.formGroup,
                  this.itemQueue.getValue(),
                  res.action === 'approve' && !this.isTaskStarter
                );
            } else {
              this.noticeContentList =
                await this.impexpProcessService.onEXPFormChecker(
                  this.curFormNo,
                  this.curFormTypeId,
                  this.formGroup,
                  this.itemQueue.getValue(),
                  res.action === 'approve' && !this.isTaskStarter
                );
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
          } else {
            this.onImpEXPFormApproveHandler(res);
          }
        }
      });

    //> re-render when translate change
    this.translateService.onLangChange
      .pipe(takeUntil(this.unsubscribeEvent))
      .subscribe(() => {
        this.onInitTableSettings();
        this.onInitShippingTypeOption();
        this.onInitFormPalceHolder();
        this.onInitItemTableCol();
        this.onInitWareHouseInfoList();
      });

    this.curFormStatusService
      .getCurFormStatus()
      .pipe(takeUntil(this.unsubscribeEvent))
      .subscribe((res) => {
        this.curFormStatus = res;
      });

    this.formGroup.valueChanges
      .pipe(
        takeWhile(
          () => this.curFormStatus.status == LicenseFormStatusEnum.DRAFT
        ),
        takeUntil(this.unsubscribeEvent)
      )
      .subscribe(() => {
        this.onInitFormPalceHolder();
        this.onFormStatusHandler();
      });

    this.onRouterWatcher();

    this.onInitTableSettings();
    this.onInitWareHouseInfoList();
    this.onInitShippingTypeOption();
    this.onInitFormPalceHolder();
    this.onFormStatusHandler();
  }

  ngOnDestroy(): void {
    this.curFormInfoService.resetCurFormInfo();
    this.curFormStatusService.resetCurFormStatus();
    this.unsubscribeEvent.next(null);
    this.unsubscribeEvent.complete();
  }

  onInitFormPalceHolder(): void {
    [this.shipToCodePlaceholder, this.deliverToCodePlaceholder] =
      this.impexpInitService.onInitFormPalceHolder(
        this.formType,
        this.formGroup
      );
  }

  onInitShippingTypeOption(): void {
    this.expTypeOptions = this.impexpInitService.onInitShippingTypeOptions();
  }

  //> switch page mode ( edit / draft / approve ) by currrent url
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

    //> get target imp/exp license form info
    const getTargetLicenseInfo$ = (formNo: string | undefined) =>
      new Observable<any>((obs) => {
        if (formNo != undefined) {
          this.licenseControlApiService
            .getTargetLicenseInfo(formNo)
            .pipe(takeLast(1))
            .subscribe((res) => {
              obs.next(res);
              obs.complete();
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

    //> 抓取當前 URL，判斷該表單狀態
    this.activatedRoute.queryParams
      .pipe(takeUntil(this.unsubscribeEvent))
      .subscribe((params: Params) => {
        if (params['editAndSubmit']) {
          this.isEditAndSubmitPage = true;
        }

        if (params['type'] === FormTypeEnum.LICENSE_IMP) {
          this.formType = FormTypeEnum.LICENSE_IMP;
          this.formGroup.get('vcType').setValue('V');
        }

        if (params['type'] === FormTypeEnum.LICENSE_EXP) {
          this.formType = FormTypeEnum.LICENSE_EXP;
          this.formGroup.get('vcType').setValue('C');
        }

        if (params['queryFormNo'] && !this.isEditAndSubmitPage) {
          //>-----------------------------------------
          //> re-set up value by already existing data
          this.loaderService.show();
          getTargetLicenseInfo$(params['queryFormNo']).subscribe((formInfo) => {
            //> 當 url parameters 不含 type 進行資料獲取並重導向
            if (params['type'] == undefined) {
              if (formInfo.ieType == 'I') {
                this.router.navigateByUrl(`${this.router.url}&type=imp`);
              } else {
                this.router.navigateByUrl(`${this.router.url}&type=exp`);
              }
            }
            //> 獲取 Audit Log by 單號
            else {
              //> 儲存單子內容
              this.curFormInfoService.setCurFormInfo(formInfo);
              this.curFormContentFromDB.next(formInfo);

              //> 取得單子歷程
              getFlowAuditLog$(
                params['queryFormNo'],
                formInfo.formTypeId
              ).subscribe((auditLog) => {
                auditLog.sort((a, b) =>
                  a.receiveTime > b.receiveTime ? 1 : -1
                );

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

                this.hkConsigneeOptions = new Array<
                  SelectItem<ConsigneeInfo>
                >();

                //> 取得單子狀態
                getFormStatus$(
                  params['queryFormNo'],
                  formInfo.formTypeId
                ).subscribe((res) => {
                  if (
                    res !==
                    LicenseFormStatusEnum.DRAFT[0].toUpperCase() +
                      LicenseFormStatusEnum.DRAFT.slice(1)
                  ) {
                    this.curFormStatusService.setCurFormStatus({
                      status: LicenseFormStatusEnum.APPROVE,
                      formNo: params['queryFormNo'],
                    });

                    //> 確認當前人員是否為倉管
                    for (const log of auditLog) {
                      if (
                        log.signerCode ==
                          this.userContextService.user$.getValue().userCode &&
                        log.stepName === 'Warehouse' &&
                        log.status === 'Approving'
                      ) {
                        this.isWarehouseMember = true;
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

                    //#--------------------- Check Current User Role Start  ---------------------#//
                    //> 確認 user 當前角色
                    this.isTaskStarter = false;

                    if (this.router.url.includes('approving')) {
                      if (
                        (auditLog[auditLog.length - 1].authorizerCode ===
                          this.userContextService.user$.getValue().userCode ||
                          auditLog[auditLog.length - 1].assigneeCode ===
                            this.userContextService.user$.getValue()
                              .userCode) &&
                        auditLog[auditLog.length - 1].stepNumber === 1 &&
                        auditLog[auditLog.length - 1].stepName === 'Application'
                      ) {
                        //> 退回第一關且開啟為本人，則可以進行全部修改
                        this.isTaskStarter = true;
                        this.formGroup.enable();
                        this.formGroup
                          .get('consigneeKit')
                          .disable({ onlySelf: true });
                        this.onInitTableSettings();
                      } else if (this.isWarehouseMember) {
                        //> 當前為倉管者，開啟該欄位編輯
                        this.formGroup
                          .get('consigneeKit')
                          .enable({ onlySelf: true });

                        this.onInitTableSettings();
                      } else {
                        this.onInitTableSettings();
                      }
                    }
                  }

                  //#--------------------- Check Current User Role End  ---------------------#//

                  //> 壓值回表單
                  for (const formKey of Object.keys(
                    this.formGroup.getRawValue()
                  )) {
                    this.formGroup
                      .get(formKey)
                      .setValue(
                        formInfo[formKey] === undefined
                          ? null
                          : formInfo[formKey]
                      );
                  }

                  this.formGroup.get('consigneeKit').setValue({
                    consignee: formInfo['consignee'],
                    address: formInfo['consigneeAddress'],
                  });

                  //> 壓值回表單 item
                  //> item info re-format

                  for (const item of formInfo.datas) {
                    item.key = item.lineId;
                    item.startDate = !item.startDate
                      ? null
                      : this.objectFormatService.DateFormat(
                          new Date(item.startDate),
                          '/'
                        );
                    item.endDate = !item.endDate
                      ? null
                      : this.objectFormatService.DateFormat(
                          new Date(item.endDate),
                          '/'
                        );
                  }

                  //#--------------------- Check Newest Bafa Info Start  ---------------------#//
                  if (
                    this.router.url.includes('approving') ||
                    (this.curFormStatus &&
                      this.curFormStatus.status ===
                        LicenseFormStatusEnum.DRAFT &&
                      this.router.url.includes('queryFormNo'))
                  ) {
                    from(formInfo.datas)
                      .pipe(
                        filter(
                          (item: any) => item.productCode && item.bafaLicense
                        ),
                        mergeMap((item: any) =>
                          this.impexpProcessService.onBAFASearch$(
                            this.formType === FormTypeEnum.LICENSE_IMP
                              ? 'I'
                              : 'E',
                            item.productCode,
                            item.bafaLicense
                          )
                        )
                      )
                      .subscribe((res) => {
                        for (const item of formInfo.datas.filter(
                          (item: {
                            productCode: string;
                            bafaLicense: string;
                          }) =>
                            item.productCode === res.productCode &&
                            item.bafaLicense === res.BAFALicense
                        )) {
                          item.bafaBalQty = res.balanceQty;
                          item.bafaTotalQty = res.quantity;
                        }
                      });
                  }
                  //#--------------------- Check Newest Bafa Info End  ---------------------#//

                  //> 壓 item
                  this.itemQueue.next(
                    formInfo.datas.map((x) => {
                      return {
                        ...x,
                        key: x.lineId,
                        quantity: this.objectFormatService.ParseThousandFormat(
                          x.quantity
                        ),
                        price: this.objectFormatService.ParseThousandFormat(
                          x.price
                        ),
                        licenseQty:
                          this.objectFormatService.ParseThousandFormat(
                            x.licenseQty
                          ),
                        bafaBalQty:
                          this.objectFormatService.ParseThousandFormat(
                            x.bafaBalQty
                          ),
                        bafaTotalQty:
                          this.objectFormatService.ParseThousandFormat(
                            x.bafaTotalQty
                          ),
                      };
                    })
                  );

                  //> 初始化 Table header
                  this.onInitItemTableCol();

                  //> re-init form placeholder & hk consignee list
                  //> when form status is approve, after reading and assiging value to form field
                  this.onInitFormPalceHolder();
                  this.onInitHKConsigneeList();
                  this.onInitWareHouseInfoList();
                  this.onFormStatusHandler();

                  this.loaderService.hide();
                });
              });
            }
          });
        }

        //*************** 當前頁面為複製重送 Start ****************/
        if (params['queryFormNo'] && this.isEditAndSubmitPage) {
          //>-----------------------------------------
          //> re-set up value by already existing data
          this.loaderService.show();
          getTargetLicenseInfo$(params['queryFormNo']).subscribe((formInfo) => {
            this.curFormInfoService.setCurFormInfo(formInfo);
            this.curFormContentFromDB.next(formInfo);

            this.curFormStatusService.setCurFormStatus({
              status: LicenseFormStatusEnum.APPLY,
              formNo: params['queryFormNo'],
            });

            this.hkConsigneeOptions = new Array<SelectItem<ConsigneeInfo>>();

            //> 壓值回表單
            for (const formKey of Object.keys(this.formGroup.getRawValue())) {
              this.formGroup
                .get(formKey)
                .setValue(
                  formInfo[formKey] === undefined ? null : formInfo[formKey]
                );
            }

            this.formGroup.get('consigneeKit').setValue({
              consignee: formInfo['consignee'],
              address: formInfo['consigneeAddress'],
            });

            //> item info re-format
            for (const item of formInfo.datas) {
              item.specialLabel = 'N';
              item.key = item.lineId;
              item.startDate =
                item.startDate == undefined
                  ? null
                  : this.objectFormatService.DateFormat(
                      new Date(item.startDate),
                      '/'
                    );
              item.endDate = item.endDate = null;

              if (this.router.url.includes('editAndSubmit')) {
                item.startDate = this.datePipe.transform(
                  new Date(),
                  'yyyy-MM-dd'
                );
                item.endDate = null;
                item.license = null;
                item.licenseQty = null;
                item.bafaLicense = null;
                item.bafaLicenseQty = null;
                item.bafaTotalQty = null;
                item.bafaBalQty = null;
              }
            }

            //> 壓 item
            this.itemQueue.next(
              formInfo.datas.map((x) => {
                return {
                  ...x,
                  key: x.lineId,
                  quantity: this.objectFormatService.ParseThousandFormat(
                    x.quantity
                  ),
                  price: this.objectFormatService.ParseThousandFormat(x.price),
                  licenseQty: this.objectFormatService.ParseThousandFormat(
                    x.licenseQty
                  ),
                  bafaBalQty: this.objectFormatService.ParseThousandFormat(
                    x.bafaBalQty
                  ),
                  bafaTotalQty: this.objectFormatService.ParseThousandFormat(
                    x.bafaTotalQty
                  ),
                };
              })
            );

            //> 初始化 Table header
            this.onInitItemTableCol();

            //> re-init form placeholder & hk consignee list
            //> when form status is approve, after reading and assiging value to form field
            this.onInitFormPalceHolder();
            this.onInitHKConsigneeList();
            this.onFormStatusHandler();

            this.loaderService.hide();
          });
        }
        //*************** 當前頁面為複製重送 End ****************/
      });
  }

  //> init item table settings
  onInitTableSettings(): void {
    this.dataTableSettings = this.impexpInitService.onInitTableSettings(
      this.curFormStatus.status,
      this.isTaskStarter,
      this.isWarehouseMember
    );
  }

  //> init warehouse options
  onInitWareHouseInfoList(): void {
    const getIELicenseRules$ = (model: any): Observable<any> =>
      new Observable<
        {
          label?: string;
          value?: string;
          ruleCode: string;
          rulesCategoryRuleItemCn: string;
          rulesCategoryRuleItemEn: string;
        }[]
      >((obs) => {
        this.commonApiService
          .queryRuleSetup(model)
          .pipe(takeLast(1))
          .subscribe({
            next: (res) => {
              const warehouseList = new Array<{
                ruleCode: string;
                rulesCategoryRuleItemCn: string;
                rulesCategoryRuleItemEn: string;
              }>();
              for (const rule of res.ruleList) {
                warehouseList.push({
                  ruleCode: rule.ruleCode,
                  rulesCategoryRuleItemCn: rule.rulesCategoryRuleItemCn,
                  rulesCategoryRuleItemEn: rule.rulesCategoryRuleItemEn,
                });
              }
              obs.next(warehouseList);
              obs.complete();
            },
            error: (err) => {
              console.error(err);
              obs.next([]);
              obs.complete();
            },
          });
      });
    getIELicenseRules$(
      this.objectFormatService.ObjectClean({
        tenant: this.userContextService.user$.getValue().tenant,
        msgFrom: 'ImportExportForm',
        trackingId:
          this.formType === FormTypeEnum.LICENSE_IMP
            ? 'IMPLicense'
            : 'EXPLicense',
        tenantPermissionList: [this.userContextService.user$.getValue().tenant],
        ruleId:
          this.formType === FormTypeEnum.LICENSE_IMP
            ? 'IMPLicense'
            : 'EXPLicense',
        flag:
          (!this.router.url.includes('approving') &&
            this.curFormStatus.status === LicenseFormStatusEnum.DRAFT) ||
          this.isTaskStarter
            ? 'Y'
            : null,
      })
    ).subscribe((rules) => {
      const warehouseList = rules.map((rule) => {
        if (this.translateService.currentLang == 'zh-tw') {
          rule.label = rule.rulesCategoryRuleItemCn;
          rule.value = rule.ruleCode;
          delete rule.ruleCode;
          delete rule.rulesCategoryRuleItemCn;
          delete rule.rulesCategoryRuleItemEn;
        } else {
          rule.label = rule.rulesCategoryRuleItemEn;
          rule.value = rule.ruleCode;
          delete rule.ruleCode;
          delete rule.rulesCategoryRuleItemCn;
          delete rule.rulesCategoryRuleItemEn;
        }
        return rule;
      });

      this.warehouseOptions = warehouseList;

      //> 當單子為草稿 或是 第一關
      if (
        (!this.router.url.includes('approving') &&
          this.curFormStatus.status === LicenseFormStatusEnum.DRAFT) ||
        this.isTaskStarter
      ) {
        //> 長度為1的時候直接壓值
        if (this.warehouseOptions.length === 1) {
          this.formGroup
            .get('country')
            .setValue(this.warehouseOptions[0].value);
        }

        if (
          this.formGroup.get('country').value &&
          this.warehouseOptions.filter(
            (x) => x.value === this.formGroup.get('country').value
          ).length === 0
        ) {
          this.formGroup.get('country').setValue(null);
        }
      }
    });
  }

  //> init HK Consignee List
  onInitHKConsigneeList(): void {
    const getHKConsigneeList$ = (): Observable<ConsigneeInfo[]> =>
      new Observable<ConsigneeInfo[]>((obs) => {
        this.licenseControlApiService
          .getConsigneeByOuCode(this.formGroup.get('ouCode').value)
          .pipe(takeLast(1))
          .subscribe({
            next: (res) => {
              obs.next(res.consigneeDatas);
              obs.complete();
            },
            error: (err) => {
              console.error(err);
              obs.next([]);
              obs.complete();
            },
          });
      });

    this.hkConsigneeOptions = new Array<SelectItem<ConsigneeInfo>>();
    this.formGroup.get('consignee').setValue(null);
    this.formGroup.get('consigneeAddress').setValue(null);

    if (
      this.formGroup.get('ouCode').value &&
      this.formGroup.get('country').value &&
      this.formGroup.get('country').value.includes('HK')
    ) {
      getHKConsigneeList$().subscribe((res) => {
        this.hkConsigneeOptions = new Array<SelectItem<ConsigneeInfo>>();
        for (const data of res) {
          this.hkConsigneeOptions = [
            ...this.hkConsigneeOptions,
            {
              label: data.consignee,
              value: data,
            },
          ];
        }

        if (this.hkConsigneeOptions.length === 1) {
          this.formGroup
            .get('consignee')
            .setValue(this.hkConsigneeOptions[0].value.consignee);
          this.formGroup
            .get('consigneeAddress')
            .setValue(this.hkConsigneeOptions[0].value.address);
        }
      });
    }
  }

  //> init common table view col event
  onInitItemTableCol(): void {
    //> based on itemQueue object key
    this.itemTableCols = this.impexpInitService.onInitItemTableCol(
      this.formType
    );

    if (
      this.formGroup.get('country').value &&
      this.formGroup.get('country').value.toString().includes('HK')
    ) {

      for (const col of this.itemTableCols) {
        if (col.field === 'price') {
          if (this.formType === FormTypeEnum.LICENSE_IMP) {
            col.label = this.translateService.instant(
              'LicenseMgmt.IMPEXP.Cols.IMP.usdPrice'
            );
          } else {
            col.label = this.translateService.instant(
              'LicenseMgmt.IMPEXP.Cols.EXP.usdPrice'
            );
          }
        }
      }
    }
  }

  //> open add item dialog event
  onOpenAddItemDialogEvent(): void {
    if (this.formType == FormTypeEnum.LICENSE_IMP) {
      this.noticeContentList =
        this.impexpProcessService.onOpenIMPLineItemPreChecker(this.formGroup);

      if (this.noticeContentList.length > 0) {
        this.noticeCheckDialogParams = {
          title: this.translateService.instant(
            'LicenseMgmt.Common.Title.Notification'
          ),
          visiable: true,
          mode: 'error',
        };
      } else {
        this.impItemAMDialogParams = {
          title: this.translateService.instant(
            'LicenseMgmt.Common.Title.AddItemInfo'
          ),
          type: SelectorItemType.ITEM,
          visiable: true,
          data: {
            ouCode: this.formGroup.get('ouCode').value,
            vcType: this.formGroup.get('vcType').value,
            vcCode: this.formGroup.get('vcCode').value,
            country: this.formGroup.get('country').value,
            ieType: 'I',
            isWarehouseMember: this.isWarehouseMember,
            isTaskStarter: this.isTaskStarter,
            formStatus: this.curFormStatus,
          },
        };
        this.impItemAMDialogMode = 'add';
      }
    } else {
      this.noticeContentList =
        this.impexpProcessService.onOpenEXPLineItemPreChecker(this.formGroup);

      if (this.noticeContentList.length > 0) {
        this.noticeCheckDialogParams = {
          title: this.translateService.instant(
            'LicenseMgmt.Common.Title.Notification'
          ),
          visiable: true,
          mode: 'error',
        };
      } else {
        this.expItemAMDialogParams = {
          title: this.translateService.instant(
            'LicenseMgmt.Common.Title.AddItemInfo'
          ),
          type: SelectorItemType.ITEM,
          visiable: true,
          data: {
            country: this.formGroup.get('country').value,
            ouCode: this.formGroup.get('ouCode').value,
            vcType: this.formGroup.get('vcType').value,
            vcCode: this.formGroup.get('vcCode').value,
            ieType: 'E',
            orgId: this.formGroup.get('ouCode').value,
            targetNo: this.formGroup.get('vcCode').value,
            address: this.formGroup.get('shipToAddress').value,
            deliverTo: this.formGroup.get('deliverToAddress').value,
            isWarehouseMember: this.isWarehouseMember,
            isTaskStarter: this.isTaskStarter,
            formStatus: this.curFormStatus,
          },
        };
        this.expItemAMDialogMode = 'add';
      }
    }
  }

  //> open add item by ref ( from ERP ) dialog event
  onOpenAddItemByRefDialog(): void {
    this.noticeContentList =
      this.impexpProcessService.onOpenRefDialogPreChecker(
        this.formType,
        this.formGroup
      );

    if (this.noticeContentList.length > 0) {
      this.noticeCheckDialogParams = {
        title: this.translateService.instant(
          'LicenseMgmt.Common.Title.Notification'
        ),
        visiable: true,
        mode: 'error',
      };
    } else {
      this.expItemRefDialogParams = {
        title: '',
        visiable: true,
        data: {
          orgId: this.formGroup.get('ouCode').value,
          vctype: this.formGroup.get('vcType').value,
          targetNo: this.formGroup.get('vcCode').value,
          address: this.formGroup.get('shipToAddress').value,
          deliverTo: this.formGroup.get('deliverToAddress').value,
        },
      };
    }
  }

  //> open selector dialog event
  onOpenSelectorDialogEvent(type: string): void {
    this.curSelectType = type;

    this.selectorDialogParams = {
      ...this.impexpProcessService.onOpenSelectorDialogParser(
        this.formType,
        type,
        this.formGroup
      ),
      visiable: true,
    };
  }

  //> open selector dialog callback
  onSelectorDialogCallback(result: SelectItem<any>): void {
    if (result.value !== null) {
      this.formGroup = this.impexpProcessService.onSelectorDialogCallback(
        this.curSelectType,
        result,
        this.formType,
        this.formGroup
      );
    }
  }

  //> open edit item dialog callback
  onEditSelectedDataCallback(data: any) {
    let title: string =
      this.translateService.currentLang == 'zh-tw'
        ? '修改 Item 相關資料'
        : 'Edit Item Info';

    if (this.formType == FormTypeEnum.LICENSE_IMP) {
      this.noticeContentList =
        this.impexpProcessService.onOpenIMPLineItemPreChecker(this.formGroup);

      if (this.noticeContentList.length > 0) {
        this.noticeCheckDialogParams = {
          title: this.translateService.instant(
            'LicenseMgmt.Common.Title.Notification'
          ),
          visiable: true,
          mode: 'error',
        };
      } else {
        this.impItemAMDialogMode = 'edit';
        this.selectedImpItemInfo = data;

        this.impItemAMDialogParams = {
          title: title,
          type: SelectorItemType.ITEM,
          visiable: true,
          data: {
            country: this.formGroup.get('country').value,
            ouCode: this.formGroup.get('ouCode').value,
            vcType: this.formGroup.get('vcType').value,
            vcCode: this.formGroup.get('vcCode').value,
            isWarehouseMember: this.isWarehouseMember,
            isTaskStarter: this.isTaskStarter,
            formStatus: this.curFormStatus,
          },
        };
      }
    } else {
      this.noticeContentList =
        this.impexpProcessService.onOpenEXPLineItemPreChecker(this.formGroup);

      if (this.noticeContentList.length > 0) {
        this.noticeCheckDialogParams = {
          title: this.translateService.instant(
            'LicenseMgmt.Common.Title.Notification'
          ),
          visiable: true,
          mode: 'error',
        };
      } else {
        this.expItemAMDialogMode = 'edit';
        this.selectedExpItemInfo = data;

        this.expItemAMDialogParams = {
          title: title,
          type: SelectorItemType.ITEM,
          visiable: true,
          data: {
            country: this.formGroup.get('country').value,
            ouCode: this.formGroup.get('ouCode').value,
            vcType: this.formGroup.get('vcType').value,
            vcCode: this.formGroup.get('vcCode').value,
            address: this.formGroup.get('shipToAddress').value,
            deliverTo: this.formGroup.get('deliverToAddress').value,
            isWarehouseMember: this.isWarehouseMember,
            isTaskStarter: this.isTaskStarter,
            formStatus: this.curFormStatus,
          },
        };
      }
    }
  }

  //> get output data after delete behavior and update cur item data list
  onAfterModifiedDataCallback(data: any): void {
    let index = 0;
    this.itemQueue.next(
      data.map((x) => {
        return {
          ...x,
          lineId: index++,
          key: index,
          quantity: this.objectFormatService.ParseThousandFormat(x.quantity),
          price: this.objectFormatService.ParseThousandFormat(x.price),
          licenseQty: this.objectFormatService.ParseThousandFormat(
            x.licenseQty
          ),
          bafaBalQty: this.objectFormatService.ParseThousandFormat(
            x.bafaBalQty
          ),
          bafaTotalQty: this.objectFormatService.ParseThousandFormat(
            x.bafaTotalQty
          ),
        };
      })
    );
  }

  //> imp:open item add dialog callback
  onImpItemAMDialogCallback(data: any): void {
    this.impItemParseProcess(data);
    this.onInitItemTableCol();
  }

  private impItemParseProcess(data: any): void {
    if (!data.productCode) {
      data.itemInfo = null;
    }
    if (this.impItemAMDialogMode == 'add') {
      this.itemQueue.next(
        [
          ...this.itemQueue.getValue(),
          {
            productCode: data.productCode,
            quantity: this.objectFormatService.ParseThousandFormat(
              data.quantity
            ),
            price: this.objectFormatService.ParseThousandFormat(data.price),
            eccn:
              data.itemInfo && data.itemInfo.eccn
                ? data.itemInfo.eccn
                : data.eccn,
            ccats:
              data.itemInfo && data.itemInfo.ccats
                ? data.itemInfo.ccats
                : data.ccats,
            shipFrom: data.shipFrom,
            remark: data.remark,
            specialFlag: data.specialLabel === 'N' ? 'N' : 'Y',
            specialLabel: data.specialLabel,
            license: data.license,
            licenseQty: this.objectFormatService.ParseThousandFormat(
              data.licenseQty
            ),
            bafaLicense: data.bafaLicense,
            bafaBalQty: this.objectFormatService.ParseThousandFormat(
              data.bafaBalQty
            ),
            bafaTotalQty: this.objectFormatService.ParseThousandFormat(
              data.bafaTotalQty
            ),
            startDate: this.objectFormatService.DateFormat(
              new Date(data.startDate),
              '/'
            ),
            endDate: !data.endDate
              ? null
              : this.objectFormatService.DateFormat(
                  new Date(data.endDate),
                  '/'
                ),
          },
        ].map((x, i) => {
          return {
            ...x,
            lineId: i + 1,
            key: i + 1,
            quantity: this.objectFormatService.ParseThousandFormat(x.quantity),
            price: this.objectFormatService.ParseThousandFormat(x.price),
            licenseQty: this.objectFormatService.ParseThousandFormat(
              x.licenseQty
            ),
            bafaBalQty: this.objectFormatService.ParseThousandFormat(
              x.bafaBalQty
            ),
            bafaTotalQty: this.objectFormatService.ParseThousandFormat(
              x.bafaTotalQty
            ),
          };
        })
      );
    } else {
      //> update exist item data
      if (
        this.itemQueue
          .getValue()
          .filter(
            (item) =>
              ((item.productCode && item.productCode === data.productCode) ||
                (!item.productCode &&
                  item.ccats &&
                  item.ccats === data.ccats)) &&
              item.license &&
              item.license === data.license &&
              item.lineId !== data.lineId
          ).length === 0
      ) {
        this.itemQueue.next(
          this.itemQueue.getValue().map((item) =>
            item.lineId === this.selectedImpItemInfo.lineId
              ? {
                  ...this.selectedImpItemInfo,
                  productCode: data.productCode,
                  eccn:
                    data.itemInfo && data.itemInfo.eccn
                      ? data.itemInfo.eccn
                      : data.eccn,
                  ccats:
                    data.itemInfo && data.itemInfo.ccats
                      ? data.itemInfo.ccats
                      : data.ccats,
                  shipFrom: data.shipFrom,
                  remark: data.remark,
                  quantity: this.objectFormatService.ParseThousandFormat(
                    data.quantity
                  ),
                  price: this.objectFormatService.ParseThousandFormat(
                    data.price
                  ),
                  specialFlag: data.specialLabel === 'N' ? 'N' : 'Y',
                  specialLabel: data.specialLabel,
                  license: data.license,
                  licenseQty: this.objectFormatService.ParseThousandFormat(
                    data.licenseQty
                  ),
                  bafaLicense: data.bafaLicense,
                  bafaBalQty: this.objectFormatService.ParseThousandFormat(
                    data.bafaBalQty
                  ),
                  bafaTotalQty: this.objectFormatService.ParseThousandFormat(
                    data.bafaTotalQty
                  ),
                  startDate: this.objectFormatService.DateFormat(
                    new Date(data.startDate),
                    '/'
                  ),
                  endDate: !data.endDate
                    ? null
                    : this.objectFormatService.DateFormat(
                        new Date(data.endDate),
                        '/'
                      ),
                }
              : {
                  ...item,
                  quantity: this.objectFormatService.ParseThousandFormat(
                    item.quantity
                  ),
                  price: this.objectFormatService.ParseThousandFormat(
                    item.price
                  ),
                  licenseQty: this.objectFormatService.ParseThousandFormat(
                    item.licenseQty
                  ),
                  bafaBalQty: this.objectFormatService.ParseThousandFormat(
                    item.bafaBalQty
                  ),
                  bafaTotalQty: this.objectFormatService.ParseThousandFormat(
                    item.bafaTotalQty
                  ),
                }
          )
        );
      } else {
        if (
          this.itemQueue
            .getValue()
            .filter((item) => !data.productCode && item.ccats === data.ccats)
            .length > 0
        ) {
          this.noticeContentList = [
            this.translateService.instant(
              'LicenseMgmt.Common.Hint.DupCCATsLicenseError'
            ),
          ];
        } else {
          this.noticeContentList = [
            this.translateService.instant(
              'LicenseMgmt.Common.Hint.DupItemLicenseError'
            ),
          ];
        }
        this.noticeCheckDialogParams = {
          title: this.translateService.instant(
            'LicenseMgmt.Common.Title.Notification'
          ),
          visiable: true,
          mode: 'error',
        };
        this.isReOpenItemEditDialog = true;
        this.storeTempItemEditData = data;
      }
    }
  }

  //> exp:open item add dialog callback
  onExpItemAMDialogCallback(data: any): void {
    this.expItemParseProcess(data);
    this.onInitItemTableCol();
  }

  private expItemParseProcess(data: any): void {
    if (!data.productCode) {
      data.itemInfo = null;
    }
    if (this.expItemAMDialogMode == 'add') {
      this.itemQueue.next(
        [
          ...this.itemQueue.getValue(),
          {
            productCode: data.productCode,
            quantity: this.objectFormatService.ParseThousandFormat(
              data.quantity
            ),
            price: this.objectFormatService.ParseThousandFormat(data.price),
            eccn:
              data.itemInfo && data.itemInfo.eccn
                ? data.itemInfo.eccn
                : data.eccn,
            ccats:
              data.itemInfo && data.itemInfo.ccats
                ? data.itemInfo.ccats
                : data.ccats,
            deliveryNo: data.deliveryNo,
            refShipment: data.refShipment,
            remark: data.remark,
            license: data.license,
            licenseQty: this.objectFormatService.ParseThousandFormat(
              data.licenseQty
            ),
            bafaLicense: data.bafaLicense,
            bafaBalQty: this.objectFormatService.ParseThousandFormat(
              data.bafaBalQty
            ),
            bafaTotalQty: this.objectFormatService.ParseThousandFormat(
              data.bafaTotalQty
            ),
            startDate: this.objectFormatService.DateFormat(
              new Date(data.startDate),
              '/'
            ),
            endDate: !data.endDate
              ? null
              : this.objectFormatService.DateFormat(
                  new Date(data.endDate),
                  '/'
                ),
          },
        ].map((x, i) => {
          return {
            ...x,
            lineId: i + 1,
            key: i + 1,
            quantity: this.objectFormatService.ParseThousandFormat(x.quantity),
            price: this.objectFormatService.ParseThousandFormat(x.price),
            licenseQty: this.objectFormatService.ParseThousandFormat(
              x.licenseQty
            ),
            bafaBalQty: this.objectFormatService.ParseThousandFormat(
              x.bafaBalQty
            ),
            bafaTotalQty: this.objectFormatService.ParseThousandFormat(
              x.bafaTotalQty
            ),
          };
        })
      );
    } else {
      //> update exist item data
      if (
        this.itemQueue
          .getValue()
          .filter(
            (item) =>
              ((item.productCode && item.productCode === data.productCode) ||
                (!item.productCode &&
                  item.ccats &&
                  item.ccats === data.ccats)) &&
              item.license &&
              item.license === data.license &&
              item.lineId !== data.lineId
          ).length === 0
      ) {
        this.itemQueue.next(
          this.itemQueue.getValue().map((item) =>
            item.lineId == this.selectedExpItemInfo.lineId
              ? {
                  ...this.selectedExpItemInfo,
                  productCode: data.productCode,
                  quantity: this.objectFormatService.ParseThousandFormat(
                    data.quantity
                  ),
                  price: this.objectFormatService.ParseThousandFormat(
                    data.price
                  ),
                  eccn:
                    data.itemInfo && data.itemInfo.eccn
                      ? data.itemInfo.eccn
                      : data.eccn,
                  ccats:
                    data.itemInfo && data.itemInfo.ccats
                      ? data.itemInfo.ccats
                      : data.ccats,
                  deliveryNo: data.deliveryNo,
                  refShipment: data.refShipment,
                  remark: data.remark,
                  license: data.license,
                  licenseQty: this.objectFormatService.ParseThousandFormat(
                    data.licenseQty
                  ),
                  bafaLicense: data.bafaLicense,
                  bafaBalQty: this.objectFormatService.ParseThousandFormat(
                    data.bafaBalQty
                  ),
                  bafaTotalQty: this.objectFormatService.ParseThousandFormat(
                    data.bafaTotalQty
                  ),
                  startDate: this.objectFormatService.DateFormat(
                    new Date(data.startDate),
                    '/'
                  ),
                  endDate: !data.endDate
                    ? null
                    : this.objectFormatService.DateFormat(
                        new Date(data.endDate),
                        '/'
                      ),
                }
              : {
                  ...item,
                  quantity: this.objectFormatService.ParseThousandFormat(
                    item.quantity
                  ),
                  price: this.objectFormatService.ParseThousandFormat(
                    item.price
                  ),
                  licenseQty: this.objectFormatService.ParseThousandFormat(
                    item.licenseQty
                  ),
                  bafaBalQty: this.objectFormatService.ParseThousandFormat(
                    item.bafaBalQty
                  ),
                  bafaTotalQty: this.objectFormatService.ParseThousandFormat(
                    item.bafaTotalQty
                  ),
                }
          )
        );
      } else {
        if (
          this.itemQueue
            .getValue()
            .filter((item) => !data.productCode && item.ccats === data.ccats)
            .length > 0
        ) {
          this.noticeContentList = [
            this.translateService.instant(
              'LicenseMgmt.Common.Hint.DupCCATsLicenseError'
            ),
          ];
        } else {
          this.noticeContentList = [
            this.translateService.instant(
              'LicenseMgmt.Common.Hint.DupItemLicenseError'
            ),
          ];
        }
        this.noticeCheckDialogParams = {
          title: this.translateService.instant(
            'LicenseMgmt.Common.Title.Notification'
          ),
          visiable: true,
          mode: 'error',
        };

        this.isReOpenItemEditDialog = true;
        this.storeTempItemEditData = data;
      }
    }
  }

  onUpdateIMPEXPItembyBatch(itemList: any[]): void {
    let index = 0;
    this.itemQueue.next(
      itemList.map((x) => {
        return {
          ...x,
          lineId: index++,
          key: index,
          quantity: this.objectFormatService.ParseThousandFormat(x.quantity),
          price: this.objectFormatService.ParseThousandFormat(x.price),
          licenseQty: this.objectFormatService.ParseThousandFormat(
            x.licenseQty
          ),
          bafaBalQty: this.objectFormatService.ParseThousandFormat(
            x.bafaBalQty
          ),
          bafaTotalQty: this.objectFormatService.ParseThousandFormat(
            x.bafaTotalQty
          ),
        };
      })
    );
  }

  //> 取得 EXP Item From ERP Ref
  onExpItemFromRefCallback(expItemList: any): void {
    for (const data of expItemList) {
      this.itemQueue.next(
        [
          ...this.itemQueue.getValue(),
          {
            productCode: data.productCode,
            quantity: this.objectFormatService.ParseThousandFormat(
              data.quantity
            ),
            price: null,
            eccn: data.eccn == undefined ? null : data.eccn,
            ccats: data.ccats == undefined ? null : data.ccats,
            deliveryNo: data.refShipment,
            refShipment: null,
            remark: data.remark,
            license: null,
            licenseQty: null,
            bafaLicense: null,
            bafaBalQty: null,
            bafaTotalQty: null,
            startDate: this.objectFormatService.DateFormat(new Date(), '/'),
            endDate: null,
          },
        ].map((x, i) => {
          return {
            ...x,
            lineId: i + 1,
            key: i + 1,
            quantity: this.objectFormatService.ParseThousandFormat(x.quantity),
            price: this.objectFormatService.ParseThousandFormat(x.price),
            licenseQty: this.objectFormatService.ParseThousandFormat(
              x.licenseQty
            ),
            bafaBalQty: this.objectFormatService.ParseThousandFormat(
              x.bafaBalQty
            ),
            bafaTotalQty: this.objectFormatService.ParseThousandFormat(
              x.bafaTotalQty
            ),
          };
        })
      );
    }

    this.onInitItemTableCol();
  }

  //> user dept change handler
  onCurFormNoHandler(value: string): void {
    this.curFormNo = value;
    this.sessionService.setItem('CurFormNo', value);
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
  }

  //> user type change handler
  onUserTypeHandler(): void {
    this.formGroup = this.impexpHandlerService.onUserTypeHandler(
      this.formGroup
    );
  }

  //> country change handler
  onCountryChangeHandler(): void {
    if (
      this.formGroup.get('country').value &&
      !this.formGroup.get('country').value.includes('HK')
    ) {
      this.hkConsigneeOptions = new Array<SelectItem<ConsigneeInfo>>();
      this.formGroup = this.impexpHandlerService.onCountryChangeHandler(
        this.formGroup
      );
    }
    this.onInitItemTableCol();
  }

  //> HK Consignee change handler
  onHKConsigneeChangeHandler(data: SelectItem<ConsigneeInfo>): void {
    this.formGroup = this.impexpHandlerService.onHKConsigneeChangeHandler(
      this.formGroup,
      data
    );
  }

  //> OU Code change handler
  onOUCodeChangeHandler(): void {
    if (
      this.curFormStatus.status == LicenseFormStatusEnum.DRAFT ||
      this.isTaskStarter
    ) {
      this.hkConsigneeOptions = new Array<SelectItem<ConsigneeInfo>>();
      this.formGroup = this.impexpHandlerService.onOUCodeChangeHandler(
        this.formGroup
      );
    }
  }

  //> vc Code change handler
  onVCCodeChangeHandler(): void {
    if (
      this.curFormStatus.status == LicenseFormStatusEnum.DRAFT ||
      this.isTaskStarter
    ) {
      this.formGroup = this.impexpHandlerService.onVCCodeChangeHandler(
        this.formGroup
      );
    }
  }

  //> recevie attached link component output result
  onAttachedLinkHandler(data: AttachedLink[]): void {
    this.attachedLinkList.next(data);
  }

  //> recevie attached File component output result
  onAttachedFileHandler(data: File[]): void {
    this.attachedFileList.next(data);
  }

  onFormStatusHandler(): void {
    if (
      !this.router.url.includes('queryFormNo') ||
      this.curFormStatus.status == LicenseFormStatusEnum.DRAFT
    ) {
      this.formGroup.get('consigneeKit').disable({ onlySelf: true });
      if (
        !this.formGroup.get('oOuCode').value ||
        !this.formGroup.get('vcCode').value
      ) {
        this.formGroup.get('shipToCode').disable({ onlySelf: true });
        this.formGroup.get('deliverToCode').disable({ onlySelf: true });
      } else {
        this.formGroup.get('shipToCode').enable({ onlySelf: true });
        this.formGroup.get('deliverToCode').enable({ onlySelf: true });
      }
    } else {
      if (
        this.router.url.includes('licenseMgmt/approving') &&
        this.router.url.includes('queryFormNo') &&
        this.isWarehouseMember
      ) {
        this.formGroup.get('consigneeKit').enable({ onlySelf: true });
      } else {
        this.formGroup.get('consigneeKit').disable({ onlySelf: true });
      }
    }
  }

  //> form submit event
  //> mode:apply ( 新單/草稿單 )
  //> type: 送新單( apply ) or 草稿單 ( draft )
  onFormSubmitHandler(type: string, cosigner?: string[]): void {
    let itemList = new Array();
    for (let [index, item] of this.itemQueue.getValue().entries()) {
      delete item.key;
      item = {
        ...item,
        lineId: index + 1,
        startDate: this.objectFormatService.DateFormat(item.startDate),
        endDate: this.objectFormatService.DateFormat(item.endDate),
        quantity: this.objectFormatService.RecorveryThousandFormat(
          item.quantity
        ),
        price: this.objectFormatService.RecorveryThousandFormat(item.price),
        licenseQty: this.objectFormatService.RecorveryThousandFormat(
          item.licenseQty
        ),
        bafaBalQty: this.objectFormatService.RecorveryThousandFormat(
          item.bafaBalQty
        ),
        bafaTotalQty: this.objectFormatService.RecorveryThousandFormat(
          item.bafaTotalQty
        ),
      };
      itemList.push(this.objectFormatService.ObjectClean(item));
    }

    if (this.hkConsigneeOptions.length === 0) {
      this.formGroup
        .get('consignee')
        .setValue(
          this.formGroup.get('ouName').value
            ? this.formGroup
                .get('ouName')
                .value.substring(
                  this.formGroup.get('ouName').value.indexOf('_') + 1
                )
            : null
        );
    }

    const formValue = this.formGroup.value;

    for (const key of Object.keys(formValue)) {
      if (typeof formValue[key] === 'string') {
        formValue[key] = formValue[key].trim();
      }
    }

    let submitModel = {
      ...{
        tenant: this.userContextService.user$.getValue().tenant,
        action: type,
        formNo: this.curFormNo,
        userCode: this.userContextService.user$.getValue().userCode,
        userName: this.userContextService.user$.getValue().userName,
        deptCode: this.curUserDept.deptCode,
        deptName: this.curUserDept.deptnameTw,
        creationDate: new Date().getTime(),
        datas: itemList,
        shipToCode: this.formGroup.get('shipToCode').value,
        deliverToCode: this.formGroup.get('deliverToCode').value,
      },
      ...formValue,
    };

    submitModel = this.objectFormatService.ObjectClean(submitModel);

    if (submitModel.action === 'addAssignee') {
      submitModel.cosigner = cosigner;
    }

    if (this.formType == FormTypeEnum.LICENSE_IMP) {
      submitModel = {
        ...submitModel,
        ...{ ieType: 'I' },
      };

      this.onImpFormApplyHandler(type, submitModel);
    } else {
      submitModel = {
        ...submitModel,
        ...{ ieType: 'E' },
      };

      this.onExpFormApplyHandler(type, submitModel);
    }
  }

  onFormCancelSubmitHandler(): void {
    this.integrateService.cancelOnClick();
  }

  async onOpenApplyAddAssigneeEvent(): Promise<void> {
    if (this.formType === FormTypeEnum.LICENSE_IMP) {
      this.noticeContentList = await this.impexpProcessService.onIMPFormChecker(
        this.curFormNo,
        this.curFormTypeId,
        this.formGroup,
        this.itemQueue.getValue()
      );

      this.onFormValidNotice();
    } else {
      this.noticeContentList = new Array<string>();
      if (
        this.itemQueue.getValue().length > 0 &&
        this.formGroup.get('country').value === 'SG'
      ) {
        this.noticeContentList = await this.impexpProcessService.onEXPFormChecker(
          this.curFormNo,
          this.curFormTypeId,
          this.formGroup,
          this.itemQueue.getValue()
        );
        this.loaderService.show();
        this.impexpProcessService
          .onGetDOItemFromERP(this.formGroup, this.itemQueue.getValue())
          .subscribe(async (res) => {
            this.noticeContentList = [
              ...this.noticeContentList,
              ...this.onCheckItemProcess([].concat.apply([], await res)),
            ];
            this.onFormValidNotice();
          });
      } else {
        this.noticeContentList = await this.impexpProcessService.onEXPFormChecker(
          this.curFormNo,
          this.curFormTypeId,
          this.formGroup,
          this.itemQueue.getValue()
        );

        this.onFormValidNotice();
      }
    }
  }

  private onFormValidNotice(): void {
    if (this.noticeContentList.length === 0) {
      this.applyDialogParams = {
        title: this.translateService.instant(
          'LicenseMgmt.Common.Title.Notification'
        ),
        visiable: true,
      };

      this.curFormStatusService.setCurFormStatus({
        ...this.curFormStatus,
        ...{ success: true },
      });
    } else {
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
    }
  }

  //> on add assignee when apply form
  onApplyDialogCallback(result: { action: string; cosigners: string[] }): void {
    this.onFormSubmitHandler(result.action, result.cosigners);
  }

  //> on imp form apply/draft sendding event handler
  async onImpFormApplyHandler(type: string, model: any): Promise<void> {
    if (type == 'Apply' || type == 'addAssignee') {
      this.noticeContentList = await this.impexpProcessService.onIMPFormChecker(
        this.curFormNo,
        this.curFormTypeId,
        this.formGroup,
        this.itemQueue.getValue()
      );

      if (this.noticeContentList.length > 0) {
        this.noticeCheckDialogParams = {
          title: this.translateService.instant(
            'LicenseMgmt.Common.Title.Notification'
          ),
          visiable: true,
          mode: 'error',
        };
        for (const item of this.itemQueue.getValue()) {
          item.key = item.lineId + 1;
        }
      } else {
        this.saveLicenseForm(LicenseFormStatusEnum.APPLY, model);
      }
    } else {
      this.saveLicenseForm(LicenseFormStatusEnum.DRAFT, model);
    }
  }

  //> on exp form apply/draft sendding event handler
  async onExpFormApplyHandler(type: string, model: any): Promise<void> {
    if (type == 'Apply' || type == 'addAssignee') {
      this.noticeContentList = new Array<string>();
      this.noticeContentList = await this.impexpProcessService.onEXPFormChecker(
        this.curFormNo,
        this.curFormTypeId,
        this.formGroup,
        this.itemQueue.getValue()
      );

      if (this.noticeContentList.length > 0) {
        this.noticeCheckDialogParams = {
          title: this.translateService.instant(
            'LicenseMgmt.Common.Title.Notification'
          ),
          visiable: true,
          mode: 'error',
        };
        for (const item of this.itemQueue.getValue()) {
          item.key = item.lineId + 1;
        }
      } else {
        this.loaderService.show();
        if (this.formGroup.get('country').value === 'SG') {
          this.impexpProcessService
            .onGetDOItemFromERP(this.formGroup, this.itemQueue.getValue())
            .subscribe(async (res) => {
              this.noticeContentList = [
                ...this.noticeContentList,
                ...this.onCheckItemProcess([].concat.apply([], await res)),
              ];
              if (this.noticeContentList.length > 0) {
                this.noticeCheckDialogParams = {
                  title: this.translateService.instant(
                    'LicenseMgmt.Common.Title.Notification'
                  ),
                  visiable: true,
                  mode: 'error',
                };
              } else {
                this.saveLicenseForm(LicenseFormStatusEnum.APPLY, model);
              }
            });
        } else {
          this.saveLicenseForm(LicenseFormStatusEnum.APPLY, model);
        }
      }
    } else {
      this.saveLicenseForm(LicenseFormStatusEnum.DRAFT, model);
    }
  }

  private saveLicenseForm(type: LicenseFormStatusEnum, model): void {
    const saveLicenseForm$ = (model): Observable<any> =>
      new Observable<any>((obs) => {
        this.licenseControlApiService
          .postSaveLicense(model)
          .pipe(takeLast(1))
          .subscribe({
            next: () => {
              obs.next(true);
              obs.complete();
            },
            error: (err) => {
              console.error(err);
              obs.next(false);
              obs.complete();
            },
          });
      });

    this.loaderService.show();

    this.curFormStatusService.setCurFormStatus({
      status: type,
      formNo: model.formNo,
    });

    saveLicenseForm$(model).subscribe((status) => {
      this.onImpExpFormApplyNoticeHandler(status, model);
    });
  }

  //> on apply/draft form after sendding event notice handler
  onImpExpFormApplyNoticeHandler(status: boolean, model: any): void {
    this.loaderService.hide();
    this.noticeContentList = new Array<string>();

    let prefixTypeText = '';

    if (model.ieType == 'I') {
      prefixTypeText = `${this.translateService.instant(
        'LicenseMgmt.FormType.Imp'
      )}`;
    } else {
      prefixTypeText = `${this.translateService.instant(
        'LicenseMgmt.FormType.Exp'
      )}`;
    }

    if (status) {
      this.curFormStatusService.setCurFormStatus({
        ...this.curFormStatus,
        ...{ success: true },
      });
      if (environment.storeRedirectUrlPrefix == 'local') {
        if (model.action == 'Apply' || model.action == 'addAssignee') {
          this.noticeContentList.push(
            `${prefixTypeText}：${model.formNo} ${this.translateService.instant(
              'LicenseMgmt.Common.Hint.ApplySuccess'
            )}`
          );
        } else {
          this.noticeContentList.push(
            `${prefixTypeText}：${model.formNo} ${this.translateService.instant(
              'LicenseMgmt.Common.Hint.DraftSuccess'
            )}`
          );
        }
      } else {
        if (model.action == 'Apply' || model.action == 'addAssignee') {
          window.open(
            `${environment.storeRedirectUrlPrefix}?entryUrl=myforms/success&type=${this.curFormNo}&formTypeId=${this.curFormTypeId}`,
            '_self'
          );
        } else {
          window.open(
            `${environment.storeRedirectUrlPrefix}?entryUrl=myforms/search`,
            '_self'
          );
        }
      }
    } else {
      if (model.action == 'Apply' || model.action == 'addAssignee') {
        this.noticeContentList.push(
          `${prefixTypeText}：${model.formNo} ${this.translateService.instant(
            'LicenseMgmt.Common.Hint.ApplyFailed'
          )}`
        );
      } else {
        this.noticeContentList.push(
          `${prefixTypeText}：${model.formNo} ${this.translateService.instant(
            'LicenseMgmt.Common.Hint.DraftFailed'
          )}`
        );
      }
      this.curFormStatusService.setCurFormStatus({
        ...this.curFormStatus,
        ...{ success: false },
      });
    }
    this.noticeCheckDialogParams = {
      title: this.translateService.instant(
        'LicenseMgmt.Common.Title.Notification'
      ),
      visiable: true,
      mode: 'error',
    };
  }

  //> on imp/exp form approving sendding event handler
  onImpEXPFormApproveHandler(auditActionModel: AuditAction): void {
    let formatModel = this.curFormContentFromDB.getValue();
    let itemList = new Array();
    delete formatModel.message;
    delete formatModel.code;
    delete formatModel.userName;
    delete formatModel.datas;

    for (let [index, item] of this.itemQueue.getValue().entries()) {
      delete item.key;
      item = this.objectFormatService.ObjectClean(item);
      item['lineId'] = index + 1;
      itemList.push({
        ...item,
        ...this.objectFormatService.ObjectClean({
          bafaLicenseQty: this.isWarehouseMember
            ? this.objectFormatService.RecorveryThousandFormat(item.licenseQty)
            : null,
          startDate: new Date(item.startDate).getTime(),
          endDate: new Date(item.endDate).getTime(),
          quantity: this.objectFormatService.RecorveryThousandFormat(
            item.quantity
          ),
          price: this.objectFormatService.RecorveryThousandFormat(item.price),
          licenseQty: this.objectFormatService.RecorveryThousandFormat(
            item.licenseQty
          ),
          bafaBalQty: this.objectFormatService.RecorveryThousandFormat(
            item.bafaBalQty
          ),
          bafaTotalQty: this.objectFormatService.RecorveryThousandFormat(
            item.bafaTotalQty
          ),
        }),
      });
    }

    if (this.hkConsigneeOptions.length === 0) {
      this.formGroup
        .get('consignee')
        .setValue(
          this.formGroup.get('ouName').value
            ? this.formGroup
                .get('ouName')
                .value.substring(
                  this.formGroup.get('ouName').value.indexOf('_') + 1
                )
            : null
        );
    }

    const formValue = this.objectFormatService.ObjectClean(
      this.formGroup.getRawValue()
    );

    for (const key of Object.keys(formValue)) {
      if (typeof formValue[key] === 'string') {
        formValue[key] = formValue[key].trim();
      }
    }

    formatModel = {
      ...formatModel,
      ...{
        tenant: this.userContextService.user$.getValue().tenant,
        userCode: this.userContextService.user$.getValue().userCode,
        deptCode: this.curUserDept.deptCode,
        deptName: this.curUserDept.deptnameTw,
        formNo: this.curFormNo,
        datas: itemList,
      },
      ...formValue,
      ...auditActionModel,
    };

    this.loaderService.show();
    //# TK-25695
    if (
      (formatModel.action === 'approve' ||
        formatModel.action === 'addAssignee') &&
      this.formGroup.get('country').value === 'SG'
    ) {
      this.impexpProcessService
        .onGetDOItemFromERP(this.formGroup, this.itemQueue.getValue())
        .subscribe(async (res) => {
          this.noticeContentList = [
            ...this.noticeContentList,
            ...this.onCheckItemProcess([].concat.apply([], await res)),
          ];
          if (this.noticeContentList.length > 0) {
            this.noticeCheckDialogParams = {
              title: this.translateService.instant(
                'LicenseMgmt.Common.Title.Notification'
              ),
              visiable: true,
              mode: 'error',
            };
          } else {
            this.approveLicense(formatModel);
          }
        });
    } else if (
      formatModel.action === 'approve' ||
      formatModel.action === 'addAssignee'
    ) {
      if (this.noticeContentList.length > 0) {
        this.noticeCheckDialogParams = {
          title: this.translateService.instant(
            'LicenseMgmt.Common.Title.Notification'
          ),
          visiable: true,
          mode: 'error',
        };
      } else {
        this.approveLicense(formatModel);
      }
    } else {
      this.approveLicense(formatModel);
    }
  }

  private approveLicense(formatModel): void {
    delete formatModel.consigneeKit;

    this.loaderService.show();
    this.licenseControlApiService
      .postApproveLicense(this.objectFormatService.ObjectClean(formatModel))
      .pipe(takeLast(1))
      .subscribe({
        next: () => {
          this.loaderService.hide();

          const prefixTypeText =
            formatModel.ieType == 'I'
              ? `${this.translateService.instant('LicenseMgmt.FormType.Imp')}`
              : `${this.translateService.instant('LicenseMgmt.FormType.Exp')}`;

          this.curFormStatusService.setCurFormStatus({
            ...this.curFormStatus,
            ...{ success: true },
          });

          if (environment.storeRedirectUrlPrefix == 'local') {
            this.noticeContentList = new Array<string>();
            this.noticeContentList.push(
              `${prefixTypeText}：${
                formatModel.formNo
              } ${this.translateService.instant(
                'LicenseMgmt.Common.Hint.ApproveSuccess'
              )}`
            );
            //> prevent notice dialog open
            this.noticeCheckDialogParams = {
              visiable: true,
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

          const prefixTypeText =
            formatModel.ieType == 'I'
              ? `${this.translateService.instant('LicenseMgmt.FormType.Imp')}`
              : `${this.translateService.instant('LicenseMgmt.FormType.Exp')}`;

          //> init notice content list
          this.noticeContentList = new Array<string>();
          this.noticeContentList.push(
            `${prefixTypeText}：${
              formatModel.formNo
            } ${this.translateService.instant(
              'LicenseMgmt.Common.Hint.ApproveFailed'
            )}`
          );
          //> prevent notice dialog open
          this.noticeCheckDialogParams = {
            visiable: true,
            mode: 'error',
          };

          this.curFormStatusService.setCurFormStatus({
            ...this.curFormStatus,
            ...{ success: false },
          });
        },
      });
  }

  //> reload current page for reset form header
  //> active this when notice dialog closed
  onRedirectHandler(): void {
    if (!this.isReOpenItemEditDialog) {
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
    } else {
      this.isReOpenItemEditDialog = false;

      let title: string = '';

      if (this.translateService.currentLang == 'zh-tw') {
        title = '修改 Item 相關資料';
      } else {
        title = 'Edit Item Info';
      }
      if (this.formType === FormTypeEnum.LICENSE_IMP) {
        this.impItemAMDialogMode = 'edit';
        this.selectedImpItemInfo = this.storeTempItemEditData;

        this.impItemAMDialogParams = {
          title: title,
          type: SelectorItemType.ITEM,
          visiable: true,
          data: {
            country: this.formGroup.get('country').value,
            ouCode: this.formGroup.get('ouCode').value,
            vcType: this.formGroup.get('vcType').value,
            vcCode: this.formGroup.get('vcCode').value,
            isWarehouseMember: this.isWarehouseMember,
            isTaskStarter: this.isTaskStarter,
            formStatus: this.curFormStatus,
          },
        };
      } else {
        this.expItemAMDialogMode = 'edit';
        this.selectedExpItemInfo = this.storeTempItemEditData;

        this.expItemAMDialogParams = {
          title: title,
          type: SelectorItemType.ITEM,
          visiable: true,
          data: {
            country: this.formGroup.get('country').value,
            ouCode: this.formGroup.get('ouCode').value,
            vcType: this.formGroup.get('vcType').value,
            vcCode: this.formGroup.get('vcCode').value,
            address: this.formGroup.get('shipToAddress').value,
            deliverTo: this.formGroup.get('deliverToAddress').value,
            isWarehouseMember: this.isWarehouseMember,
            isTaskStarter: this.isTaskStarter,
            formStatus: this.curFormStatus,
          },
        };
      }
    }
  }

  private onCheckItemProcess(ERPDOItemList: ERPEXPDOInfo[]): string[] {
    const checkFailItemList = new Array<string>();
    for (const item of this.itemQueue.getValue()) {
      if (
        item.deliveryNo &&
        ERPDOItemList.filter((data) => data.part_no === item.productCode)
          .length === 0
      ) {
        checkFailItemList.push(
          `${item.productCode}：${this.translateService.instant(
            'LicenseMgmt.Common.Hint.EXPDOError'
          )}`
        );
      }
    }
    this.loaderService.hide();
    return checkFailItemList;
  }

  onSelectorClean() {
    this.formGroup.get('endUserCode').setValue(null);
    this.formGroup.get('endUser').setValue(null);
  }

  get consigneeTitle() {
    return this.formType === FormTypeEnum.LICENSE_IMP
      ? this.translateService.instant('LicenseMgmt.IMPEXP.Label.ImpConsignee')
      : this.translateService.instant('LicenseMgmt.IMPEXP.Label.ExpConsignee');
  }

  get addressTitle() {
    return this.formType === FormTypeEnum.LICENSE_IMP
      ? 'Consignee address'
      : 'Exporter address';
  }

  getEditAndSubmitEmitter(e: any) {
    (window as any).open(
      window.location.href + '&editAndSubmit=true',
      '_blank'
    );
  }
}
