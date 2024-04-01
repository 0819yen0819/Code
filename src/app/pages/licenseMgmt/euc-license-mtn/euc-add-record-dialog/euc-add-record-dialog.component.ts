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
import { BehaviorSubject, Observable, take, takeLast } from 'rxjs';
import { ResponseCodeEnum } from 'src/app/core/enums/ResponseCodeEnum';
import { SelectorItemType } from 'src/app/core/enums/selector-item-type';
import { OUGroupInfo } from 'src/app/core/model/ou-group';
import { OUInfoByTenant } from 'src/app/core/model/ou-info-by-tenant';
import { SelectorDialogParams } from 'src/app/core/model/selector-dialog-params';
import { VenCusInfo } from 'src/app/core/model/ven-cus-info';
import { AuthApiService } from 'src/app/core/services/auth-api.service';
import { CommonApiService } from 'src/app/core/services/common-api.service';
import { LicenseControlApiService } from 'src/app/core/services/license-control-api.service';
import { ToastService } from 'src/app/core/services/toast.service';
import { UserContextService } from 'src/app/core/services/user-context.service';
import { ItemInfo } from './../../../../core/model/item-info';
import { LoaderService } from './../../../../core/services/loader.service';
import { ObjectFormatService } from './../../../../core/services/object-format.service';

@Component({
  selector: 'app-euc-add-record-dialog',
  templateUrl: './euc-add-record-dialog.component.html',
  styleUrls: ['./euc-add-record-dialog.component.scss'],
})
export class EucAddRecordDialogComponent implements OnInit, OnChanges {
  @Input() settingParams: SelectorDialogParams;
  @Output() onSubmit: EventEmitter<any> = new EventEmitter<any>();

  formGroup!: FormGroup;
  dialogSetting!: BehaviorSubject<SelectorDialogParams>;

  //> selector dialog params
  selectorDialogParams!: SelectorDialogParams;

  editFlagOptions: SelectItem<string>[];
  userTypeOptions!: SelectItem<string>[];
  eUserTypeOptions!: SelectItem<string>[];
  eUseTypeOptions!: SelectItem<string>[];
  ouGroupsOptions!: BehaviorSubject<SelectItem<OUGroupInfo['groupCode']>[]>;
  //> sub-group list by group code
  tanentOUsList!: BehaviorSubject<OUInfoByTenant[]>;

  isFormSubmit!: boolean;

  posIntRegex = /^\+?[1-9][0-9]*$/;

  vcKit!: VenCusInfo;

  constructor(
    private authApiService: AuthApiService,
    private commonApiService: CommonApiService,
    private translateService: TranslateService,
    private formBuilder: FormBuilder,
    private objectFormatService: ObjectFormatService,
    private licenseControlApiService: LicenseControlApiService,
    private toastService: ToastService,
    private userContextService: UserContextService,
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
    this.onInitTypeOptions();
  }

  ngOnChanges(): void {
    if (this.dialogSetting) {
      this.dialogSetting.next({
        ...this.dialogSetting.getValue(),
        ...this.settingParams,
      });

      if (this.settingParams && this.settingParams.visiable) {
        this.onInitParams();
        this.onInitTypeOptions();
      }
    }
  }

  onInitParams(): void {
    this.formGroup = this.formBuilder.group({
      groupCode: [null, [Validators.required]],
      vcType: [null, [Validators.required]],
      vcNo: [null, [Validators.required]],
      vcName: [null, [Validators.required]],
      productCode: [null, [Validators.required]],
      eccn: [null],
      proviso: [null],
      ccats: [null],
      licenseNo: [null, [Validators.required]],
      quantity: [null, [Validators.required]],
      activeFlag: [null, [Validators.required]],
      endUserType: [null, [Validators.required]],
      endUseType: [null, [Validators.required]],
      startDate: [null, [Validators.required]],
      endDate: [null, [Validators.required]],
      remark: [null],
    });

    this.tanentOUsList = new BehaviorSubject<OUInfoByTenant[]>([]);
    this.ouGroupsOptions = new BehaviorSubject<
      SelectItem<OUGroupInfo['groupCode']>[]
    >([]);

    this.isFormSubmit = false;

    //> Set Defualt Form Value
    this.formGroup.get('vcType').setValue('C');
    this.formGroup.get('endUserType').setValue('N');
    this.formGroup.get('endUseType').setValue('Y');
    this.formGroup
      .get('startDate')
      .setValue(new Date(new Date().setHours(0, 0, 0, 0)));
    this.formGroup
      .get('endDate')
      .setValue(
        new Date(
          new Date(
            new Date().setFullYear(new Date().getFullYear() + 2)
          ).setDate(new Date().getDate() - 1)
        )
      );

    this.formGroup.get('activeFlag').setValue('Y');
  }

  onInitTypeOptions(): void {
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

    this.editFlagOptions = [
      { label: 'Y', value: 'Y' },
      { label: 'N', value: 'N' },
    ];

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

    if (type === SelectorItemType.ITEM) {
      title = `${this.translateService.instant('Dialog.Header.Choose')} Item`;
      searchType = SelectorItemType.ITEM;
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
    if (result.value.invItemNo) {
      this.formGroup.get('productCode').setValue(result.value.invItemNo);
      getTargetItemInfo$(result.value.invItemNo).subscribe((res) => {
        this.formGroup.get('eccn').setValue(res.eccn ? res.eccn : null);
        this.formGroup.get('ccats').setValue(res.ccats ? res.ccats : null);
        this.formGroup
          .get('proviso')
          .setValue(res.proviso ? res.proviso : null);
      });
    } else if (result.value) {
      this.formGroup
        .get('vcNo')
        .setValue(
          result.value.customerNo
            ? result.value.customerNo
            : result.value.vendorCode
        );
      this.formGroup.get('vcName').setValue(result.label);
      this.vcKit = result.value;
    }
  }

  onFormSubmit(): void {
    this.isFormSubmit = true;

    //# vcOu Object 要有 ouCode / ouName
    //# product Object 要有 code
    //# EUC 無下列事件，ouCode 皆為 null
    //# addOu / addOOu / endUserOu Object 要有 ouCode
    const ouGroupLabel =
      this.ouGroupsOptions
        .getValue()
        .filter((data) => data.value === this.formGroup.get('groupCode').value)
        .length > 0
        ? this.ouGroupsOptions
            .getValue()
            .filter(
              (data) => data.value === this.formGroup.get('groupCode').value
            )[0].label
        : '';

    let vcName: string = !this.vcKit
      ? this.settingParams.data.vcName
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

    const startDate = new Date(this.formGroup.get('startDate').value).getTime();
    const endDate = new Date(this.formGroup.get('endDate').value).getTime();

    const formModel = {
      action: 'ADD',
      tenant: this.userContextService.user$.getValue().tenant,
      userEmail: this.userContextService.user$.getValue().userEmail,
      detail: {
        ...this.objectFormatService.ObjectClean(this.formGroup.getRawValue()),
        ...{
          tenant: this.userContextService.user$.getValue().tenant,
          licenseType: 'EUC',
          startDate: startDate,
          endDate: endDate,

          vcName: vcName,
          vcNameE: vcNameE,
          government:
            this.formGroup.get('endUserType').value === 'Y' ? 'Y' : 'N',
          civilianEndUser:
            this.formGroup.get('endUserType').value === 'Y' ? 'N' : 'Y',
          civilianEndUse: this.formGroup.get('endUseType').value,
          ouGroup: ouGroupLabel,
        },
        ...{
          vcOu: {
            ouCode: this.formGroup.get('vcNo').value,
            ouName: vcName,
          },
          product: {
            code: this.formGroup.get('productCode').value,
          },
          addOu: {
            ouCode: null,
          },
          addOOu: {
            ouCode: null,
          },
          endUserOu: {
            ouCode: null,
          },
        },
      },
    };

    delete formModel.detail.endUserType;
    delete formModel.detail.endUseType;
    delete formModel.detail.groupCode;

    if (
      this.formGroup.valid &&
      this.posIntRegex.test(this.formGroup.get('quantity').value)
    ) {
      this.loaderService.show();
      this.licenseControlApiService
        .licenseMasterEUCModify(formModel)
        .pipe(takeLast(1))
        .subscribe({
          next: (res) => {
            this.loaderService.hide();
            if (res.code === ResponseCodeEnum.LICENSEMASTER_ALREADY_EXISTS) {
              this.toastService.error(
                'EucLicenseMtn.Message.LicenseMasterExists'
              );
            } else {
              this.toastService.success('EucLicenseMtn.Message.AddSuccess');
              this.onDialogCloseEvent();
              this.onSubmit.emit();
            }
          },
          error: (err) => {
            this.loaderService.hide();
            console.error(err);
            this.toastService.error(
              err.error.errors ? err.error.errors[0] : err.message
            );
            this.toastService.error('EucLicenseMtn.Message.AddFailed');
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
