import { DateInputHandlerService } from './../../../../core/services/date-input-handler.service';
import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnInit,
  Output
} from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { TranslateService } from '@ngx-translate/core';
import { SelectItem } from 'primeng/api';
import { BehaviorSubject, Observable, takeLast } from 'rxjs';
import { ResponseCodeEnum } from 'src/app/core/enums/ResponseCodeEnum';
import { SelectorItemType } from 'src/app/core/enums/selector-item-type';
import { ItemInfo } from 'src/app/core/model/item-info';
import {
  DialogSettingParams,
  SelectorDialogParams
} from 'src/app/core/model/selector-dialog-params';
import { VenCusInfo } from 'src/app/core/model/ven-cus-info';
import { CommonApiService } from 'src/app/core/services/common-api.service';
import { LicenseControlApiService } from 'src/app/core/services/license-control-api.service';
import { ObjectFormatService } from 'src/app/core/services/object-format.service';
import { ToastService } from 'src/app/core/services/toast.service';
import { UserContextService } from 'src/app/core/services/user-context.service';
import { LoaderService } from './../../../../core/services/loader.service';

@Component({
  selector: 'app-sc047-add-record-dialog',
  templateUrl: './sc047-add-record-dialog.component.html',
  styleUrls: ['./sc047-add-record-dialog.component.scss'],
})
export class Sc047AddRecordDialogComponent implements OnInit, OnChanges {
  @Input() settingParams: DialogSettingParams;
  @Output() onSubmit: EventEmitter<any> = new EventEmitter<any>();

  formGroup!: FormGroup;
  dialogSetting!: BehaviorSubject<DialogSettingParams>;

  curSelectorType!: string;

  //> selector dialog params
  selectorDialogParams!: SelectorDialogParams;

  userTypeOptions!: SelectItem<string>[];
  editFlagOptions: SelectItem<string>[];
  warehouseOptions!: SelectItem<string>[];

  isFormSubmit!: boolean;

  //>判斷中文
  CHRepgex = /\p{sc=Han}/u;
  CHSignRepgex = /[\u3105-\u3129\u02CA\u02C7\u02CB\u02D9]/;
  //>只限大於0正整數
  posIntRegex = /^\+?[1-9][0-9]*$/;
  //>大於等於0的浮點數
  posFloatRegex = /^[0-9]+(?:\.[0-9]+)?$/;

  oouKit!: {
    displayOu: string;
    groupCode: string;
    groupName: string;
    ouCode: string;
    ouName: string;
    ouShortName: string;
  };

  ouKit!: {
    displayOu: string;
    groupCode: string;
    groupName: string;
    ouCode: string;
    ouName: string;
    ouShortName: string;
  };

  vcKit!: VenCusInfo;

  constructor(
    private translateService: TranslateService,
    private formBuilder: FormBuilder,
    private objectFormatService: ObjectFormatService,
    private commonApiService: CommonApiService,
    private userContextService: UserContextService,
    private licenseControlApiService: LicenseControlApiService,
    private toastService: ToastService,
    private loaderService: LoaderService,
    private dateInputHandlerService:DateInputHandlerService
  ) {}

  ngOnInit(): void {
    //> init dialog setting
    this.dialogSetting = new BehaviorSubject<SelectorDialogParams>({
      title: '',
      type: SelectorItemType.NONE,
      visiable: false,
      modal: true,
      maximized: true,
      draggable: false,
      resizeable: true,
      blockScroll: true,
    });

    this.onInitParams();
    this.onInitOptions();
  }

  ngOnChanges(): void {
    if (this.dialogSetting) {
      this.dialogSetting.next({
        ...this.dialogSetting.getValue(),
        ...this.settingParams,
      });

      if (this.settingParams && this.settingParams.visiable) {
        this.onInitParams();
        this.onInitOptions();
      }
    }
  }

  onInitParams(): void {
    this.formGroup = this.formBuilder.group({
      oouCode: [null, [Validators.required]],
      oouName: [null],
      ouCode: [null, [Validators.required]],
      ouName: [null],
      productCode: [null, [Validators.required]],
      eccn: [null],
      proviso: [null],
      ccats: [null],
      licenseNo: [null, [Validators.required]],
      vcType: [null, [Validators.required]],
      vcNo: [null, [Validators.required]],
      vcName: [null, [Validators.required]],
      //> >=0的浮點數
      price: [null],
      //> 大於0的正整數
      quantity: [null, [Validators.required]],
      //> 轉 unix
      startDate: [null, [Validators.required]],
      //> 轉 unix
      endDate: [null, [Validators.required]],
      //> 只能有英數
      endUseRmk: [null, [Validators.required]],
      shipToAddress: [null, [Validators.required]],
      deliveryToAddress: [null],
      activeFlag: [null, [Validators.required]],
      //> default HK
      countryCode: [null],
      remark: [null],
    });

    //> Set Defualt Form Value
    this.formGroup.get('vcType').setValue('C');
    this.formGroup.get('activeFlag').setValue('Y');

    this.isFormSubmit = false;
  }

  onInitOptions(): void {
    const getIELicenseRules$ = (
      model: any
    ): Observable<
      {
        label?: string;
        value?: string;
        ruleCode: string;
        rulesCategoryRuleItemCn: string;
        rulesCategoryRuleItemEn: string;
      }[]
    > =>
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

    this.editFlagOptions = [
      { label: 'Y', value: 'Y' },
      { label: 'N', value: 'N' },
    ];

    this.warehouseOptions = new Array();
    getIELicenseRules$({
      tenant: this.userContextService.user$.getValue().tenant,
      msgFrom: 'SC047Form',
      trackingId: 'SCLicense',
      tenantPermissionList: [this.userContextService.user$.getValue().tenant],
      ruleId: 'SCLicense',
      flag:'Y'
    }).subscribe((rules) => {
      const warehouseList = rules
        .map((rule) => {
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

      for (const warehouse of warehouseList) {
        this.warehouseOptions = [
          ...this.warehouseOptions,
          {
            label: warehouse.label,
            value: warehouse.value,
          },
        ];
      }

      if (this.warehouseOptions.length === 1) {
        this.formGroup
          .get('countryCode')
          .setValue(this.warehouseOptions[0].value);
      }
    });
  }

  onDialogCloseEvent(): void {
    this.dialogSetting.next({
      ...this.dialogSetting.getValue(),
      ...{ visiable: false },
    });
  }

  onVCTypChangeeHandler(): void {
    this.formGroup.get('vcNo').setValue(null);
    this.formGroup.get('vcName').setValue(null);
  }

  //> open selector dialog handler
  onOpenSelectorDialogEvent(type: string): void {
    let title: string = '';
    let searchType: string = SelectorItemType.NONE;
    this.curSelectorType = type;

    if (this.curSelectorType == SelectorItemType.OOU) {
      title = `${this.translateService.instant(
        'Dialog.Header.Choose'
      )} Orders OU`;
      searchType = SelectorItemType.OOU;
    } else if (this.curSelectorType == SelectorItemType.OU) {
      title = `${this.translateService.instant(
        'Dialog.Header.Choose'
      )} Shipping OU`;
      searchType = SelectorItemType.OU;
    } else if (this.curSelectorType === SelectorItemType.ITEM) {
      title = `${this.translateService.instant('Dialog.Header.Choose')} Item`;
      searchType = SelectorItemType.ITEM;
    } else if (this.curSelectorType == SelectorItemType.ALLOOU) {
      title = `${this.translateService.instant(
        'Dialog.Header.Choose'
      )} Orders OU`;
      searchType = SelectorItemType.ALLOOU;
    } else if (this.curSelectorType == SelectorItemType.ALLOU) {
      title = `${this.translateService.instant(
        'Dialog.Header.Choose'
      )} Shipping OU`;
      searchType = SelectorItemType.ALLOU;
    } else {
      if (this.formGroup.get('vcType').value == 'C') {
        title = `${this.translateService.instant(
          'Dialog.Header.Choose'
        )} Custormer`;
        searchType = SelectorItemType.CUSTOMER;
      } else {
        title = `${this.translateService.instant(
          'Dialog.Header.Choose'
        )} Vendor`;
        searchType = SelectorItemType.VENDOR;
      }
    }

    this.selectorDialogParams = {
      title: title,
      type: searchType,
      visiable: true,
    };
  }

  //> open selector dialog callback event
  onSelectorDialogCallback(result: SelectItem<any>): void {
    const getTargetItemInfo$ = (
      itemNo: ItemInfo['invItemNo']
    ): Observable<ItemInfo> =>
      new Observable<ItemInfo>((obs) => {
        this.commonApiService
          .getTargetItemInfo(itemNo)
          .pipe(takeLast(1))
          .subscribe((res) => {
            obs.next(res.itemInfo);
          });
      });

    if (result.value) {
      if (
        this.curSelectorType === SelectorItemType.OOU &&
        result.value.ouCode !== this.formGroup.get('oouCode').value
      ) {
        this.oouKit = result.value;
        this.formGroup.get('oouCode').setValue(this.oouKit.ouCode);
        this.formGroup
          .get('oouName')
          .setValue(
            `${this.oouKit.ouCode} - ${this.oouKit.ouName}(${this.oouKit.ouShortName})`
          );
      } else if (
        this.curSelectorType === SelectorItemType.OU &&
        result.value.ouCode !== this.formGroup.get('ouCode').value
      ) {
        this.ouKit = result.value;
        this.formGroup.get('ouCode').setValue(this.ouKit.ouCode);
        this.formGroup
          .get('ouName')
          .setValue(
            `${this.ouKit.ouCode} - ${this.ouKit.ouName}(${this.ouKit.ouShortName})`
          );
      }else if (
        this.curSelectorType === SelectorItemType.ALLOOU &&
        result.value.ouCode !== this.formGroup.get('oouCode').value
      ) {
        this.oouKit = result.value;
        this.formGroup.get('oouCode').setValue(this.oouKit.ouCode);
        this.formGroup
          .get('oouName')
          .setValue(
            `${this.oouKit.ouCode} - ${this.oouKit.ouName}(${this.oouKit.ouShortName})`
          );
      } else if (
        this.curSelectorType === SelectorItemType.ALLOU &&
        result.value.ouCode !== this.formGroup.get('ouCode').value
      ) {
        this.ouKit = result.value;
        this.formGroup.get('ouCode').setValue(this.ouKit.ouCode);
        this.formGroup
          .get('ouName')
          .setValue(
            `${this.ouKit.ouCode} - ${this.ouKit.ouName}(${this.ouKit.ouShortName})`
          );
      } else if (this.curSelectorType === SelectorItemType.ITEM) {
        this.formGroup.get('productCode').setValue(result.value.invItemNo);
        getTargetItemInfo$(result.value.invItemNo).subscribe((res) => {
          this.formGroup.get('eccn').setValue(res.eccn ? res.eccn : null);
          this.formGroup.get('ccats').setValue(res.ccats ? res.ccats : null);
          this.formGroup
            .get('proviso')
            .setValue(res.proviso ? res.proviso : null);
        });
      } else if (this.curSelectorType === SelectorItemType.CUSTOMER) {
        this.vcKit = result.value;
        this.formGroup
          .get('vcNo')
          .setValue(
            result.value.customerNo
              ? result.value.customerNo
              : result.value.vendorCode
          );
        this.formGroup.get('vcName').setValue(result.label);
      }
    }
  }
  onFormSubmit(): void {
    this.isFormSubmit = true;

    const oouName = this.oouKit ? this.oouKit.ouName : null;

    const ouName = this.ouKit ? this.ouKit.ouName : null;

    let vcName: string = !this.vcKit
      ? null
      : this.vcKit.customerName
      ? this.vcKit.customerName
      : this.vcKit.vendorName;

    let vcNameE: string = !this.vcKit
      ? null
      : this.vcKit.customerNameEg
      ? this.vcKit.customerNameEg
      : this.vcKit.vendorEngName;

    vcName = vcName ? vcName.trim() : null;
    vcNameE = vcNameE ? vcNameE.trim() : null;

    let formModel = {
      ...{
        action: 'ADD',
        tenant: this.userContextService.user$.getValue().tenant,
        userEmail: this.userContextService.user$.getValue().userEmail,
        detail: {
          ...this.objectFormatService.ObjectClean(this.formGroup.getRawValue()),
          ...{
            oouName: oouName,
            ouName: ouName,
            vcName: vcName,
            vcNameE: vcNameE,
            startDate: new Date(
              this.formGroup.get('startDate').value
            ).getTime(),
            endDate: new Date(this.formGroup.get('endDate').value).getTime(),
            vcOu: {
              ouCode: this.formGroup.get('vcNo').value,
              ouName: vcName,
            },
            product: {
              code: this.formGroup.get('productCode').value,
            },
            addOu: {
              ouCode: this.formGroup.get('ouCode').value,
            },
            addOOu: {
              ouCode: this.formGroup.get('oouCode').value,
            },
            endUserOu: {
              ouCode: null,
            },
          },
        },
      },
    };

    if (
      this.formGroup.get('price').value &&
      !this.posIntRegex.test(this.formGroup.get('price').value)
    ) {
      return;
    } else if (
      this.formGroup.valid &&
      this.posIntRegex.test(this.formGroup.get('quantity').value) &&
      !this.CHRepgex.test(this.formGroup.get('endUseRmk').value) &&
      !this.CHSignRepgex.test(this.formGroup.get('endUseRmk').value)
    ) {
      this.loaderService.show();
      this.licenseControlApiService
        .licenseMasterSc047Modify(formModel)
        .pipe(takeLast(1))
        .subscribe({
          next: (res) => {
            this.loaderService.hide();
            if (res.code === ResponseCodeEnum.LICENSEMASTER_ALREADY_EXISTS) {
              this.toastService.error(
                'Sc047LicenseMtn.Message.LicenseMasterExists'
              );
            } else {
              this.toastService.success('Sc047LicenseMtn.Message.AddSuccess');
              this.onSubmit.emit();
              this.onDialogCloseEvent();
            }
          },
          error: (err) => {
            this.loaderService.hide();
            console.error(err);
            this.toastService.error('Sc047LicenseMtn.Message.AddFailed');
          },
        });
    }
  }

    //#-----------------start------------------
  //# for date picker input format event
  onCheckDateHandler(): void {
    if (
      new Date(
        new Date(this.formGroup.controls.startDate.value).setHours(0, 0, 0, 0)
      ).getTime() >=
      new Date(
        new Date(this.formGroup.controls.endDate.value).setHours(23, 59, 59, 0)
      ).getTime()
    ) {
      this.formGroup.controls.endDate.setValue(null);
    }
  }

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
}
