import { ObjectFormatService } from 'src/app/core/services/object-format.service';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { SelectItem } from 'primeng/api';
import { BehaviorSubject, lastValueFrom, skipWhile, Subject, take, takeLast, takeUntil } from 'rxjs';
import { ReassignDialogService } from 'src/app/core/components/reassign-dialog/reassign-dialog.service';
import { LicenseFormStatusEnum } from 'src/app/core/enums/license-form-status';
import { FormTypeEnum } from 'src/app/core/enums/license-name';
import { SelectorItemType } from 'src/app/core/enums/selector-item-type';
import { AuditAction } from 'src/app/core/model/audit-action';
import { ConsigneeInfo } from 'src/app/core/model/consignee-info';
import { TableCol } from 'src/app/core/model/data-table-cols';
import { OUInfo } from 'src/app/core/model/ou-info';
import { UserDepts } from 'src/app/core/model/user-depts';
import { IntegrateService } from 'src/app/core/services/integrate.service';
import { environment } from 'src/environments/environment';
import { AuditActionControlService } from '../services/audit-action-control.service';
import { CurFormStatusService } from '../services/cur-form-status.service';
import { DataTableSettings } from './../../../core/model/data-table-view';
import {
  DialogSettingParams,
  SelectorDialogParams
} from './../../../core/model/selector-dialog-params';
import { LoaderService } from './../../../core/services/loader.service';
import { Sc047V2FlowService } from './services/sc047-v2-flow.service';
import { Sc047V2InitService } from './services/sc047-v2-init.service';
import { Sc047V2ProcessService } from './services/sc047-v2-process.service';
import { MyApplicationService } from 'src/app/core/services/my-application.service';
import { AgentInfoTableService } from 'src/app/core/components/agent-info-table/agent-info-table.service';

@Component({
  selector: 'app-sc047-v2',
  templateUrl: './sc047-v2.component.html',
  styleUrls: ['./sc047-v2.component.scss'],
})
export class Sc047V2Component implements OnInit, OnDestroy {
  private unSubscribeEvent = new Subject();

  formType!: string;
  formGroup!: FormGroup;
  curFormTypeId!: string;
  //> 當前表單狀態
  curUserDept!: UserDepts;
  curFormNo!: string;
  curSelectType!: string;
  curFormStatus!: {
    status: string;
    formNo?: string;
    success?: boolean;
  };
  curOUInfo: OUInfo;
  curFlowingStatus!:string
  curUserRole!:any

  isTaskStarter!: boolean;
  isWarehouseMember!: boolean;

  shipmentTypeOptions!: SelectItem<string>[];
  userTypeOptions!: SelectItem<string>[];
  hkConsigneeOptions!: BehaviorSubject<SelectItem<ConsigneeInfo>[]>;
  warehouseOptions!: SelectItem<string>[];

  shipToCodePlaceholder!: string;
  deliverToCodePlaceholder!: string;

  dataTableSettings!: DataTableSettings;

  //> item queue
  itemQueue!: BehaviorSubject<any[]>;
  //> item table col
  itemTableCols!: TableCol[];
  //> item key
  itemQueueKeyNum!: number;

  noticeCheckDialogParams!: DialogSettingParams;
  noticeContentList!: string[];

  //> am item dialog params
  itemAMDialogParams!: DialogSettingParams;
  storeSelectedItemInfo!: any;

  //> selector dialog params
  selectorDialogParams!: SelectorDialogParams;

  //> apply mode dialog params
  applyDialogParams!: DialogSettingParams;

  refERPDialogParams: DialogSettingParams;

  constructor(
    public translateService: TranslateService,
    public reassignDialogService: ReassignDialogService,
    private curFormStatusService: CurFormStatusService,
    private sc047V2InitService: Sc047V2InitService,
    private sc047V2ProcessService: Sc047V2ProcessService,
    private sc047V2FlowService: Sc047V2FlowService,
    private integrateService: IntegrateService,
    private loaderService: LoaderService,
    public router: Router,
    private auditActionControlService: AuditActionControlService,
    private objectFormatService:ObjectFormatService,
    private myApplicationService : MyApplicationService,
    private agentInfoTableService : AgentInfoTableService
  ) {}

   async ngOnInit(): Promise<void> {
    //> 設定本表單類型
    this.formType = FormTypeEnum.SC047;

    const formTitleRes = await lastValueFrom(this.myApplicationService.getFormTitleInfo("License_SC047"));
    this.curFormTypeId = (formTitleRes as any).body.formTypeId;
    this.agentInfoTableService.setFormTypeId(this.curFormTypeId);

    //> 初始化 SC Form
    this.formGroup = this.sc047V2InitService.onInitForm();

    this.dataTableSettings = new DataTableSettings();

    //> 初始化通知訊息 Array
    this.noticeContentList = new Array();

    //> init 當前人員狀態
    this.isWarehouseMember = false;
    this.isTaskStarter = true;

    //> init item list
    this.itemQueue = new BehaviorSubject<any[]>([]);

    //> init item table cols
    this.itemTableCols = new Array<TableCol>();

    //> init item key index
    this.itemQueueKeyNum = 0;

    //> init option list
    this.hkConsigneeOptions = new BehaviorSubject<SelectItem<ConsigneeInfo>[]>(
      []
    );

    //> init warehouse list
    this.warehouseOptions = new Array<SelectItem<string>>();

    //> check current form status
    this.sc047V2ProcessService
      .checkFormStatus(this.curFormTypeId)
      .pipe(skipWhile((isCheckDone) => !isCheckDone))
      .subscribe(() => {
        //# Bugfix 檢視 Table Setting
        this.onGetCurFormInfoAndStatus();
      });

    //> 監聽當前表單狀態
    this.curFormStatusService
      .getCurFormStatus()
      .pipe(takeUntil(this.unSubscribeEvent))
      .subscribe((res) => {
        this.curFormStatus = res;
        //> 對當前使用者設定對的 table settings
        this.dataTableSettings =
          this.sc047V2InitService.onInitTableSettings(this.curUserRole);
      });

    //> 監聽表單變化
    this.formGroup.valueChanges
      .pipe(takeUntil(this.unSubscribeEvent))
      .subscribe(() => {
        this.onInitStaticOptions();
        this.onInitFormPlaceholder();
        this.onFormControlHandler();
      });

    //> 監聽語系變化
    this.translateService.onLangChange
      .pipe(takeUntil(this.unSubscribeEvent))
      .subscribe(() => {
        this.onInitStaticOptions();
        this.onInitFormPlaceholder();
        this.onInitWarehouseOption();
        this.onInitTableCols();
        this.onGetCurFormInfoAndStatus();
      });

    this.auditActionControlService
      .onAuditActionHandler()
      .pipe(
        takeUntil(this.unSubscribeEvent),
        skipWhile((res) => res === null)
      )
      .subscribe((res) => {
        if (this.router.url.includes('approving')) {
          this.onFormSubmitHandler('Approve', null, res);
        }
      });

    //> init form related
    this.onInitStaticOptions();
    this.onInitFormPlaceholder();
    this.onInitWarehouseOption();
    this.onInitTableCols();
  }

  ngOnDestroy(): void {
    this.unSubscribeEvent.next(null);
    this.unSubscribeEvent.complete();
  }

  //> init static option list
  onInitStaticOptions(): void {
    this.userTypeOptions = this.sc047V2InitService.onInitUserTypeOptions();
    this.shipmentTypeOptions =
      this.sc047V2InitService.onInitShipmentTypeOptions();
  }

  //> init warehouse option list
  onInitWarehouseOption() {
    this.sc047V2InitService
      .onInitWareHouseOptions(this.curFormStatus, this.isTaskStarter)
      .subscribe((res) => {
        this.warehouseOptions = res;

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

  //> init form placeholder
  onInitFormPlaceholder(): void {
    //> init form placeholder text
    this.shipToCodePlaceholder = this.sc047V2InitService.onInitFormPlaceholder(
      this.formGroup
    ).shipToCode;
    this.deliverToCodePlaceholder =
      this.sc047V2InitService.onInitFormPlaceholder(
        this.formGroup
      ).deliverToCode;
  }

  //> init HK Consignee List
  onInitHKConsigneeList(): void {
    if (
      this.formGroup.get('ouCode').value &&
      this.formGroup.get('country').value &&
      this.formGroup.get('country').value.includes('HK')
    ) {
      this.sc047V2InitService
        .onInitHKConsigneeList(this.formGroup)
        .subscribe((res) => {
          this.hkConsigneeOptions.next(res);

          if (this.hkConsigneeOptions.getValue().length === 1) {
            this.formGroup
              .get('consignee')
              .setValue(this.hkConsigneeOptions.getValue()[0].value.consignee);
            this.formGroup
              .get('consigneeAddress')
              .setValue(this.hkConsigneeOptions.getValue()[0].value.address);
          }
        });
    }
  }

  //> init table cols
  onInitTableCols(): void {
    this.itemTableCols = this.sc047V2InitService.onInitTableCols();
  }

  //> get current form info and status
  onGetCurFormInfoAndStatus(): void {
    this.loaderService.show();
    this.sc047V2ProcessService
      .checkUserRole$(this.curFormTypeId)
      .pipe(takeLast(1))
      .subscribe((userRole) => {
        //> 對當前使用者判斷角色
        this.curUserRole=userRole;
        this.isTaskStarter = userRole.taskStarter;
        this.isWarehouseMember = userRole.warehouseMember;

        //> 對當前使用者設定對的 table settings
        this.dataTableSettings =
          this.sc047V2InitService.onInitTableSettings(userRole);

        //> 對當前使用者設定對的 form settings
        //> 預先全鎖
        this.formGroup.disable();

        //> 草稿單
        if (
          this.curFormStatusService.currentFormStatus.getValue().status ===
          LicenseFormStatusEnum.DRAFT
        ) {
          this.formGroup.enable();
          this.formGroup.get('consigneeKit').disable({ onlySelf: true });
        }

        //> 起單者
        if (this.router.url.includes('approving') && userRole.taskStarter) {
          this.formGroup.enable();
          this.formGroup.get('consigneeKit').disable({ onlySelf: true });
        }

        //> Warehouse Member
        if (this.router.url.includes('approving') && this.isWarehouseMember) {
          this.formGroup.get('consigneeKit').enable({ onlySelf: true });
        }

        //> 取得當前表單內容，並回壓值
        this.sc047V2ProcessService
          .getTargetFormInfo()
          .pipe(takeLast(1))
          .subscribe((res) => {
            if (res) {
              for (const key of Object.keys(this.formGroup.getRawValue())) {
                this.formGroup.get(key).setValue(res[key]);
              }

              this.formGroup.get('consigneeKit').setValue({
                consignee: res['consignee'],
                address: res['consigneeAddress'],
              });

              //> 壓 item
              this.itemQueue.next(
                res.datas.map((x) => {
                  return {
                    ...x,
                    key: x.lineId,
                    quantity: this.objectFormatService.ParseThousandFormat(
                      x.quantity
                    ),
                  };
                })
              );

              this.onInitHKConsigneeList();
              this.onInitWarehouseOption();
            }

            this.loaderService.hide();
          });
      });
  }

  //> open selector dialog event
  onOpenSelectorDialogEvent(type: string): void {
    this.curSelectType = type;

    let data = null;

    if (this.curSelectType == SelectorItemType.CUS_ADDRESS_QUERY_ADDRESS) {
      data = {
        custNo: this.formGroup.get('vcCode').value,
        ouCode: this.formGroup.get('oOuCode').value,
      };
    }

    if (this.curSelectType == SelectorItemType.CUS_ADDRESS_QUERY_SHIP) {
      data = {
        custNo: this.formGroup.get('vcCode').value,
        ouCode: this.formGroup.get('oOuCode').value,
      };
    }

    this.selectorDialogParams = {
      title: this.sc047V2InitService.onInitSelectorTitle(this.curSelectType),
      type: this.curSelectType,
      visiable: true,
      data: data,
    };
  }

  //> open am item dialog
  onOpenAddItemDialogEvent(): void {
    if (this.formGroup.get('ouCode').value) {
      this.itemAMDialogParams = {
        title: this.translateService.instant(
          'LicenseMgmt.Common.Title.AddItemInfo'
        ),
        visiable: true,
        mode: 'add',
        data: {
          ouCode: this.formGroup.get('ouCode').value,
        },
      };
    } else {
      this.noticeContentList = [
        `${this.translateService.instant(
          'Input.PlaceHolder.PleaseSelect'
        )} ${this.translateService.instant(
          'LicenseMgmt.SC047.Label.Receiving_Shipping_OU'
        )}`,
      ];
      this.showNoticeDialogEvent('error');
    }
  }

  onOpenAddItemByRefDialog(): void {
    if (
      this.formGroup.get('ouCode').value &&
      this.formGroup.get('vcCode').value &&
      this.formGroup.get('shipToAddress').value
    ) {
      this.refERPDialogParams = {
        title: 'Pick by Ref Shiptment#',
        visiable: true,
        data: {
          orgId: this.formGroup.get('ouCode').value,
          vctype: this.formGroup.get('vcType').value,
          targetNo: this.formGroup.get('vcCode').value,
          address: this.formGroup.get('shipToAddress').value,
          deliverTo: this.formGroup.get('deliverToAddress').value,
        },
      };
    } else {
      this.noticeContentList = new Array();
      if (!this.formGroup.get('ouCode').value) {
        this.noticeContentList.push(
          this.translateService.instant('LicenseMgmt.SC047.Hint.SelectOUFirst')
        );
      }

      if (!this.formGroup.get('vcCode').value) {
        this.noticeContentList.push(
          this.translateService.instant('LicenseMgmt.SC047.Hint.SelectCVFirst')
        );
      }

      if (!this.formGroup.get('shipToAddress').value) {
        this.noticeContentList.push(
          this.translateService.instant(
            'LicenseMgmt.SC047.Hint.KeyInShipToAddressFirst'
          )
        );
      }

      this.showNoticeDialogEvent('error');
    }
  }

  //> form control handler for enable/disable controller
  onFormControlHandler(): void {
    if (
      this.formGroup.get('oOuCode').value &&
      this.formGroup.get('vcCode').value &&
      (this.curFormStatus.status === LicenseFormStatusEnum.DRAFT ||
        this.isTaskStarter)
    ) {
      this.formGroup.get('shipToCode').enable({ onlySelf: true });
      this.formGroup.get('deliverToCode').enable({ onlySelf: true });
    } else {
      this.formGroup.get('shipToCode').disable({ onlySelf: true });
      this.formGroup.get('deliverToCode').disable({ onlySelf: true });
    }
  }

  //> store current form no.
  onCurFormNoHandler(value: string): void {
    this.curFormNo = value;
    this.curFormStatusService.getCurFormStatus$(this.curFormNo).then(obs => {
      obs.pipe(take(1)).subscribe(res => { this.curFlowingStatus = res })
    })
  }

  //> store current user dept
  onCurUserDeptHandler(value: UserDepts): void {
    this.curUserDept = value;
  }

  //> vc type change handler
  onVCTypChangeeHandler(): void {
    if (
      this.curFormStatus.status == LicenseFormStatusEnum.DRAFT ||
      this.isTaskStarter
    ) {
      this.formGroup = this.sc047V2ProcessService.onFormChangeHanlder(
        'vcType',
        this.formGroup
      );
    }
  }

  //> vc code change handler
  onVCCodeChangeHandler(): void {
    if (
      this.curFormStatus.status == LicenseFormStatusEnum.DRAFT ||
      this.isTaskStarter
    ) {
      this.formGroup = this.sc047V2ProcessService.onFormChangeHanlder(
        'vcCode',
        this.formGroup
      );
    }
  }

  //> country change handler
  onCountryChangeHandler(): void {
    if (
      this.formGroup.get('country').value &&
      !this.formGroup.get('country').value.includes('HK')
    ) {
      this.hkConsigneeOptions.next(new Array<SelectItem<ConsigneeInfo>>());
      this.formGroup = this.sc047V2ProcessService.onFormChangeHanlder(
        'country',
        this.formGroup
      );
    }
  }

  //> ou code change handler
  onOUCodeChangeHandler(): void {
    if (
      this.curFormStatus.status == LicenseFormStatusEnum.DRAFT ||
      this.isTaskStarter
    ) {
      this.formGroup = this.sc047V2ProcessService.onFormChangeHanlder(
        'ouCode',
        this.formGroup
      );
      this.hkConsigneeOptions.next(new Array<SelectItem<ConsigneeInfo>>());
      this.itemQueue.next(new Array());
    }
  }

  //> HK Consignee change handler
  onHKConsigneeChangeHandler(data: SelectItem<ConsigneeInfo>): void {
    this.formGroup.get('consignee').setValue(data.value.consignee);
    this.formGroup.get('consigneeAddress').setValue(data.value.address);
  }

  //> open selector dialog callback
  onSelectorDialogCallback(result: SelectItem<any>): void {
    const callbackKit: [FormGroup, OUInfo] =
      this.sc047V2ProcessService.onSelectorCallbackParser(
        this.formGroup,
        this.curSelectType,
        result
      );

    if (callbackKit[1]) {
      [this.formGroup, this.curOUInfo] = callbackKit;
    } else {
      this.formGroup = callbackKit[0];
    }
  }

  onRenewSC047ItembyBatch(itemList: any[]): void {
    let index = 0;
    this.itemQueue.next(
      itemList.map((x) => {
        return {
          ...x,
          lineId: index++,
          key: index,
          quantity: this.objectFormatService.ParseThousandFormat(
            x.quantity
          ),
        };
      })
    );
  }

  //> data table output target data
  onSelectedTargetDataCallback(data: any): void {
    let title: string =
      this.translateService.currentLang === 'zh-tw'
        ? '修改 Item 相關資料'
        : 'Edit Item Info';

    this.storeSelectedItemInfo = data;
    this.itemAMDialogParams = {
      title: title,
      visiable: true,
      mode: 'edit',
      data: {
        isTaskStarter: this.isTaskStarter,
        isWarehouseMember: this.isWarehouseMember,
        ouCode: this.formGroup.get('ouCode').value,
        selectedItemInfo: data,
      },
    };
  }

  //> data table output target data list ( after deleted )
  onAfterDeletedDatasCallback(data: any[]): void {
    let index = 0;
    this.itemQueue.next(
      data.map((x) => {
        return {
          ...x,
          lineId: index++,
          key: index,
          quantity: this.objectFormatService.ParseThousandFormat(
            x.quantity
          ),
        };
      })
    );
  }

  //> item add/modify dialog callback
  onItemAMDialogCallback(data: any): void {
    const result = this.sc047V2ProcessService.updateItemList(
      this.itemAMDialogParams.mode,
      this.itemQueue.getValue(),
      data,
      this.storeSelectedItemInfo
    );
    if (typeof result === 'boolean') {
      //> 加入項 item & license "存在"佇列中
      this.noticeContentList = [
        `Item：${data.productCode} & License：${
          data.license
        }，${this.translateService.instant(
          'LicenseMgmt.Common.Hint.DupItemLicenseError'
        )}`,
      ];
      this.showNoticeDialogEvent('error');
    } else {
      this.itemAMDialogParams = {
        visiable: false,
      };
      this.itemQueue.next(result);
    }

    this.sc047V2InitService.onInitTableCols();
  }

  //> 接收 from ERP Ref Item
  onRefERPialogCallback(datas: any[]): void {
    let result;
    for (const data of datas) {
      result = this.sc047V2ProcessService.updateItemList(
        'add',
        this.itemQueue.getValue(),
        data
      );

      if (typeof result === 'boolean') {
        //> 加入項 item & license "存在"佇列中
        this.noticeContentList = [
          `Item：${data.productCode} & License：${
            data.license
          }，${this.translateService.instant(
            'LicenseMgmt.Common.Hint.DupItemLicenseError'
          )}`,
        ];
      } else {
        this.itemQueue.next(result);
      }
    }

    if (this.noticeContentList.length > 0) {
      this.showNoticeDialogEvent('error');
    }
  }

  onFormSubmitHandler(
    mode: 'Apply' | 'Draft' | 'Cancel' | 'ReAssign' | 'Approve',
    cosigners?: string[],
    auditAcion?: AuditAction
  ): void {
    this.noticeContentList = new Array<string>();
    if (mode !== 'Cancel') {
      if (
        mode === 'Draft' ||
        mode === 'Apply' ||
        mode === 'Approve' ||
        mode === 'ReAssign'
      ) {
        //# TK-25695
        if (
          (auditAcion &&
            (auditAcion.action === 'approve' ||
              (auditAcion.action === 'addAssignee' && this.isTaskStarter))) ||
          mode === 'Apply' ||
          mode === 'ReAssign'
        ) {
          this.noticeContentList = this.sc047V2ProcessService.validFormProcess(
            this.formGroup,
            this.itemQueue.getValue()
          );
        }

        if (this.noticeContentList.length === 0) {
          if (mode === 'Apply' || mode === 'Approve' || mode === 'Draft') {
            //> Draft / Apply / Approve
            this.loaderService.show();
            this.sc047V2FlowService
              .onFlowSubmitProcess$(
                mode,
                this.curFormNo,
                this.curUserDept,
                this.formGroup,
                this.itemQueue.getValue(),
                this.hkConsigneeOptions.getValue().length === 0 ? true : false,
                this.curOUInfo
                  ? this.curOUInfo
                  : this.formGroup.get('consignee').value,
                null,
                auditAcion
              )
              .subscribe((result) => {
                if (result) {
                  this.curFormStatusService.setCurFormStatus({
                    status: mode,
                    formNo: this.curFormNo,
                    success: true,
                  });
                } else {
                  this.curFormStatusService.setCurFormStatus({
                    status: mode,
                    formNo: this.curFormNo,
                    success: false,
                  });
                }

                this.loaderService.hide();
                this.onAfterSubmitEvent(mode);
              });
          } else {
            //> ReAssign
            if (cosigners) {
              //> Draft / Apply / Approve
              this.loaderService.show();
              this.sc047V2FlowService
                .onFlowSubmitProcess$(
                  mode,
                  this.curFormNo,
                  this.curUserDept,
                  this.formGroup,
                  this.itemQueue.getValue(),
                  this.hkConsigneeOptions.getValue().length === 0
                    ? true
                    : false,
                  this.curOUInfo
                    ? this.curOUInfo
                    : this.formGroup.get('ouName').value,
                  cosigners
                )
                .subscribe((result) => {
                  if (result) {
                    this.curFormStatusService.setCurFormStatus({
                      status: LicenseFormStatusEnum.ReAssign,
                      formNo: this.curFormNo,
                      success: true,
                    });
                  } else {
                    this.curFormStatusService.setCurFormStatus({
                      status: LicenseFormStatusEnum.ReAssign,
                      formNo: this.curFormNo,
                      success: false,
                    });
                  }

                  this.loaderService.hide();
                  this.onAfterSubmitEvent(mode);
                });
            } else {
              this.applyDialogParams = {
                title: this.translateService.instant(
                  'LicenseMgmt.Common.Title.Notification'
                ),
                visiable: true,
              };
            }
          }
        } else {
          this.showNoticeDialogEvent('error');
        }
      }
    }

    if (mode === 'Cancel') {
      this.integrateService.cancelOnClick();
    }
  }

  //> 只作用在 local 端
  onRedirectHandler(): void {
    if (
      environment.storeRedirectUrlPrefix === 'local' &&
      this.curFormStatus.success
    ) {
      if (this.curFormStatus.status === LicenseFormStatusEnum.DRAFT) {
        this.router.navigate(['/', 'applicationMgmt', 'my-application']);
      } else {
        this.router.navigate(['/', 'applicationMgmt', 'pending']);
      }
    }
  }

  private showNoticeDialogEvent(type: string = 'success'): void {
    this.noticeCheckDialogParams = {
      title: this.translateService.instant(
        'LicenseMgmt.Common.Title.Notification'
      ),
      visiable: true,
      mode: type,
    };
  }

  private onAfterSubmitEvent(
    mode: 'Apply' | 'Draft' | 'ReAssign' | 'Approve'
  ): void {
    this.integrateService.formToFlowRedirect(this.curFormNo, mode,this.curFormTypeId);
  }
}
