import { DateInputHandlerService } from './../../../../../../core/services/date-input-handler.service';
import { ObjectFormatService } from 'src/app/core/services/object-format.service';
import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  Output
} from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { SelectItem } from 'primeng/api';
import {
  BehaviorSubject,
  Observable,
  skipWhile,
  Subject,
  takeLast,
  takeUntil
} from 'rxjs';
import { LicenseFormStatusEnum } from 'src/app/core/enums/license-form-status';
import { SelectorItemType } from 'src/app/core/enums/selector-item-type';
import { ImpLicenseItemInfo, ItemInfo } from 'src/app/core/model/item-info';
import {
  DialogSettingParams,
  SelectorDialogParams
} from 'src/app/core/model/selector-dialog-params';
import { CommonApiService } from 'src/app/core/services/common-api.service';
import { LicenseControlApiService } from 'src/app/core/services/license-control-api.service';

@Component({
  selector: 'app-am-imp-single-item',
  templateUrl: './am-imp-single-item.component.html',
  styleUrls: ['./am-imp-single-item.component.scss'],
})
export class AmImpSingleItemComponent implements OnInit, OnChanges, OnDestroy {
  @Input() settingParams: SelectorDialogParams;
  @Input() mode!: string;
  @Input() selectedData!: ImpLicenseItemInfo;
  @Output() outputResult: EventEmitter<any> = new EventEmitter<any>();

  private unsubscribeEvent = new Subject();

  formGroup!: FormGroup;

  //> selector dialog params
  selectorDialogParams!: SelectorDialogParams;

  //> target item info
  targetItemInfo!: BehaviorSubject<ItemInfo | null>;

  //> item-selector dialog callback
  selectedITargetItem!: BehaviorSubject<ItemInfo | null>;

  //> ship-from-selector dialog callback
  selectedITargetShipFrom!: BehaviorSubject<ItemInfo | null>;

  //> special condition options
  specialConditionOptions!: SelectItem<string>[];

  //> loading target item info status
  isLoading!: boolean;

  //>submit btn label value
  submitBtnLabel!: string;

  //> end date selector limit date
  minDate!: Date;

  //> notice check dialog params
  noticeCheckDialogParams!: DialogSettingParams;
  //> error message list
  noticeContentList!: string[];

  bafaLicensePlaceholder!: string;

  constructor(
    private formbuilder: FormBuilder,
    private commonApiService: CommonApiService,
    private translateService: TranslateService,
    private router: Router,
    private licenseControlApiService: LicenseControlApiService,
    private dateInputHandlerService:DateInputHandlerService,
    private objectFormatService:ObjectFormatService
  ) {}

  ngOnInit(): void {
    //> init form structure
    this.formGroup = this.formbuilder.group({
      productCode: [null],
      ccats: [null],
      quantity: [
        null,
        [Validators.required, Validators.pattern(/^\+?[1-9][0-9]*$/)],
      ],
      shipFrom: [null, [Validators.required]],
      specialFlag: [null],
      specialLabel: [null],
      price: [null, [Validators.pattern(/^\d+(\.\d+)?$/)]],
      license: [null],
      licenseQty: [null],
      bafaLicense: [null],
      bafaBalQty: [null],
      bafaTotalQty: [null],
      startDate: [null, [Validators.required]],
      endDate: [null],
      remark: [null],
    });

    //>init loading status
    this.isLoading = false;

    //> init min Date limit
    this.minDate = new Date();

    //> init special condition options
    this.specialConditionOptions = [
      { label: 'N', value: 'N' },
      { label: 'Y_SC047', value: 'Y_SC047' },
      { label: 'Y_SC054', value: 'Y_SC054' },
    ];

    //> init selected target item from selector dialog
    this.selectedITargetItem = new BehaviorSubject<ItemInfo>(null);

    //> init selected target item from selector dialog
    this.selectedITargetShipFrom = new BehaviorSubject<any>(null);

    //> init selected target item info
    this.targetItemInfo = new BehaviorSubject<ItemInfo | null>(null);

    this.bafaLicensePlaceholder = '';

    //> active subscriber of selected target item change event on component init
    this.selectedITargetItem
      .pipe(
        skipWhile((itemInfo) => itemInfo == null),
        takeUntil(this.unsubscribeEvent)
      )
      .subscribe((itemInfo) => {
        if (itemInfo) {
          this.formGroup.get('productCode').disable({ onlySelf: true });
          this.getTargetItemInfo(itemInfo.invItemNo);
        }
      });

    this.formGroup.valueChanges
      .pipe(takeUntil(this.unsubscribeEvent))
      .subscribe((form) => {
        if (
          this.settingParams.data &&
          this.settingParams.data.isWarehouseMember
        ) {
          this.formGroup.get('license').addValidators([Validators.required]);
          this.formGroup
            .get('license')
            .updateValueAndValidity({ onlySelf: true });

          if (!form.license) {
            this.formGroup.get('licenseQty').disable({ onlySelf: true });
          } else {
            this.formGroup.get('licenseQty').enable({ onlySelf: true });
            this.formGroup
              .get('licenseQty')
              .setValidators([Validators.required]);
            this.formGroup
              .get('licenseQty')
              .updateValueAndValidity({ onlySelf: true });
          }
        }

        if (!form.productCode) {
          this.bafaLicensePlaceholder = `${this.translateService.instant(
            'LicenseMgmt.IMPEXP.Hint.ProductSelectFirst'
          )}`;
          this.formGroup.get('bafaLicense').disable({ onlySelf: true });
        } else {
          this.bafaLicensePlaceholder = `${this.translateService.instant(
            'Input.PlaceHolder.PleaseSelect'
          )} BAFA#`;
          this.formGroup.get('bafaLicense').enable({ onlySelf: true });
        }

        if (!form.startDate) {
          this.formGroup.get('endDate').disable({ onlySelf: true });
        } else {
          this.formGroup.get('endDate').enable({ onlySelf: true });
        }
      });
  }

  ngOnChanges(): void {
    if (this.formGroup) {
      this.formGroup.reset();

      //> init selected target item info
      this.targetItemInfo = new BehaviorSubject<ItemInfo | null>(null);

      this.formGroup.get('startDate').setValue(new Date());
      this.formGroup.get('specialFlag').setValue('N');
      this.formGroup.get('specialLabel').setValue('N');

      //> 當審核人員身分為倉管，才能開放
      this.formGroup.get('license').disable({ onlySelf: true });
      this.formGroup.get('licenseQty').disable({ onlySelf: true });
      this.formGroup.get('specialLabel').disable({ onlySelf: true });
      this.formGroup.get('startDate').disable({ onlySelf: true });
      this.formGroup.get('endDate').disable({ onlySelf: true });

      if (this.mode == 'edit') {
        this.submitBtnLabel = this.translateService.instant(
          'Button.Label.Modify'
        );
        this.targetItemInfo.next(this.selectedData);

        if (this.selectedData.productCode) {
          this.getTargetItemInfo(this.selectedData.productCode);
        }

        this.formGroup
          .get('productCode')
          .setValue(this.selectedData.productCode);
        this.formGroup.get('ccats').setValue(this.selectedData.ccats);
        this.formGroup.get('quantity').setValue(this.objectFormatService.RecorveryThousandFormat(this.selectedData.quantity));
        this.formGroup
          .get('specialFlag')
          .setValue(this.selectedData.specialFlag);
        this.formGroup
          .get('specialLabel')
          .setValue(this.selectedData.specialLabel);
        this.formGroup.get('shipFrom').setValue(this.selectedData.shipFrom);
        this.formGroup.get('license').setValue(this.selectedData.license);
        this.formGroup.get('licenseQty').setValue(this.objectFormatService.RecorveryThousandFormat(this.selectedData.licenseQty));
        this.formGroup
          .get('startDate')
          .setValue(new Date(this.selectedData.startDate));

        this.formGroup.get('price').setValue(this.objectFormatService.RecorveryThousandFormat(this.selectedData.price));
        this.formGroup
          .get('bafaLicense')
          .setValue(this.selectedData.bafaLicense);
        this.formGroup.get('bafaBalQty').setValue(this.objectFormatService.RecorveryThousandFormat(this.selectedData.bafaBalQty));
        this.formGroup
          .get('bafaTotalQty')
          .setValue(this.objectFormatService.RecorveryThousandFormat(this.selectedData.bafaTotalQty));
        this.formGroup
          .get('startDate')
          .setValue(
            this.selectedData.startDate
              ? new Date(this.selectedData.startDate)
              : null
          );
        this.formGroup
          .get('endDate')
          .setValue(
            this.selectedData.endDate
              ? new Date(this.selectedData.endDate)
              : null
          );
        this.formGroup.get('remark').setValue(this.selectedData.remark);

        this.minDate = new Date(this.selectedData.startDate);

        if (this.formGroup.get('productCode').value) {
          this.getCurBAFAInfo();
        }

        //> 根據是否是倉管修改表單開放
        if (this.router.url.includes('approving')) {
          this.formGroup.disable();
          if (this.settingParams.data.isTaskStarter) {
            this.formGroup.enable();
            this.formGroup.get('license').disable({ onlySelf: true });
            this.formGroup.get('licenseQty').disable({ onlySelf: true });
            this.formGroup.get('specialLabel').disable({ onlySelf: true });
            this.formGroup.get('startDate').disable({ onlySelf: true });
            this.formGroup.get('endDate').disable({ onlySelf: true });
          } else if (this.settingParams.data.isWarehouseMember) {
            this.formGroup.disable();
            this.formGroup.get('license').enable({ onlySelf: true });
            this.formGroup.get('licenseQty').enable({ onlySelf: true });
            this.formGroup.get('bafaLicense').enable({ onlySelf: true });
            this.formGroup.get('specialLabel').enable({ onlySelf: true });
            this.formGroup.get('startDate').enable({ onlySelf: true });
            this.formGroup.get('endDate').enable({ onlySelf: true });

            //# TK-21665
            this.formGroup.get('remark').enable({ onlySelf: true });
            this.formGroup.get('license').addValidators([Validators.required]);
            this.formGroup
              .get('licenseQty')
              .addValidators([Validators.required]);
            this.formGroup
              .get('specialLabel')
              .addValidators([Validators.required]);
            this.formGroup
              .get('startDate')
              .addValidators([Validators.required]);
            this.formGroup.get('endDate').addValidators([Validators.required]);

            this.formGroup.updateValueAndValidity();
          }
        }
      } else {
        if (this.targetItemInfo) {
          this.targetItemInfo.next(null);
        }
        this.submitBtnLabel = this.translateService.instant('Button.Label.Add');
      }

      if (this.router.url.includes('editAndSubmit')) {
        this.formGroup.get('startDate').setValue(new Date());
        this.formGroup.get('endDate').setValue(null);
      }
    }
  }

  //> component destory event handler
  ngOnDestroy(): void {
    this.unsubscribeEvent.next(null);
    this.unsubscribeEvent.complete();
  }

  //> get target item info (Accurate)
  getTargetItemInfo(itemNo: ItemInfo['invItemNo']): void {
    const getTargetItemInfo$ = (
      itemNo: ItemInfo['invItemNo']
    ): Observable<ItemInfo> =>
      new Observable<ItemInfo>((obs) => {
        this.commonApiService
          .getTargetItemInfo(itemNo)
          .pipe(takeLast(1))
          .subscribe({
            next: (res) => {
              obs.next(res.itemInfo);
              obs.complete();
            },
            error: (err) => {
              console.error(err);
              if (
                (this.settingParams &&
                  this.settingParams.data &&
                  this.settingParams.data.formStatus.status ===
                    LicenseFormStatusEnum.DRAFT) ||
                this.settingParams.data.isTaskStarter
              ) {
                this.formGroup.get('productCode').enable({ onlySelf: true });
              }
              this.noticeContentList = [err.message];
              this.noticeCheckDialogParams = {
                title: this.translateService.instant(
                  'LicenseMgmt.Common.Title.Notification'
                ),
                visiable: true,
                mode: 'error',
              };
            },
          });
      });

    this.isLoading = true;
    getTargetItemInfo$(itemNo).subscribe((res) => {
      if (
        (this.settingParams &&
          this.settingParams.data &&
          this.settingParams.data.formStatus.status ===
            LicenseFormStatusEnum.DRAFT) ||
        this.settingParams.data.isTaskStarter
      ) {
        this.formGroup.get('productCode').enable({ onlySelf: true });
      }
      this.targetItemInfo.next(res);
      this.isLoading = false;
    });
  }

  onCleanSelectedItem(): void {
    this.targetItemInfo.next(null);
    this.selectedITargetItem.next(null);
    this.formGroup.get('productCode').setValue(null);

    this.bafaLicensePlaceholder = `${this.translateService.instant(
      'LicenseMgmt.IMPEXP.Hint.ProductSelectFirst'
    )}`;
    this.formGroup.get('bafaLicense').disable({ onlySelf: true });
    this.formGroup.get('bafaLicense').setValue(null);
    this.formGroup.get('bafaBalQty').setValue(null);
    this.formGroup.get('bafaTotalQty').setValue(null);
    this.onCleanCCATs();
  }

  onCleanCCATs(): void {
    this.formGroup.get('ccats').setValue(null);
  }

  //> open selector dialog callback event
  onSelectorDialogCallback(result: SelectItem<any>): void {
    if (result.value !== null) {
      if (this.selectorDialogParams.type == SelectorItemType.ITEM) {
        this.selectedITargetItem.next(result.value);
        this.formGroup.get('productCode').setValue(result.value.invItemNo);
        this.formGroup.get('ccats').setValue(null);
        this.formGroup.get('bafaLicense').setValue(null);

        this.formGroup.get('bafaLicense').enable({ onlySelf: true });

        this.bafaLicensePlaceholder = `${this.translateService.instant(
          'Input.PlaceHolder.PleaseSelect'
        )} BAFA#`;
      } else if (this.selectorDialogParams.type == SelectorItemType.BAFA) {
        this.formGroup.get('bafaLicense').setValue(result.value.BAFALicense);
        this.formGroup.get('bafaBalQty').setValue(result.value.balanceQty);
        this.formGroup.get('bafaTotalQty').setValue(result.value.quantity);
      } else {
        this.formGroup.get('shipFrom').setValue(result.value);
      }
    }
  }

  //> open selector dialog handler
  onOpenSelectorDialogEvent(type: string): void {
    if (type == SelectorItemType.ITEM) {
      this.selectorDialogParams = {
        title: `${this.translateService.instant('Dialog.Header.Choose')} Item`,
        type: SelectorItemType.ITEM,
        visiable: true,
      };
    } else if (type == SelectorItemType.BAFA) {
      this.selectorDialogParams = {
        title: `${this.translateService.instant(
          'Dialog.Header.Choose'
        )} BAFA License`,
        type: SelectorItemType.BAFA,
        visiable: true,
        data: {
          ...this.settingParams.data,
          ...{
            ieType: 'I',
            productCode: this.formGroup.get('productCode').value,
          },
        },
      };
    } else {
      this.selectorDialogParams = {
        title: `${this.translateService.instant(
          'Dialog.Header.Choose'
        )} Ship form Address`,
        type: SelectorItemType.SHIP_FROM_ADDRESS,
        visiable: true,
        data: this.settingParams.data,
      };
    }
  }

  //> close add item dialog event
  onCloseAddItemDialogEvent(): void {
     //> reset item add dialog view
    this.targetItemInfo.next(null);
    this.formGroup.reset();
    this.outputResult.emit();
  }

  //> form submit event
  onFormSubmit(): void {
    //> submit form value to parent component

    this.formGroup
      .get('startDate')
      .setValue(new Date(this.formGroup.get('startDate').value).getTime());

    this.formGroup
      .get('endDate')
      .setValue(
        this.formGroup.get('endDate').value == null
          ? null
          : new Date(this.formGroup.get('endDate').value).getTime()
      );

    if (this.formGroup.get('productCode').value) {
      this.outputResult.emit({
        ...this.selectedData,
        ...this.formGroup.getRawValue(),
        ...{ itemInfo: { ...this.targetItemInfo.getValue() } },
      });
    } else {
      this.outputResult.emit({
        ...this.selectedData,
        ...this.formGroup.getRawValue(),
        ...{ eccn: null },
      });
    }
  }

  private getCurBAFAInfo(): void {
    const getFuzzyBAFAList$ = (): Observable<any[]> =>
      new Observable<any[]>((obs) => {
        this.licenseControlApiService
          .getTargetBAFAInfo('I', this.selectedData.productCode)
          .pipe(takeLast(1))
          .subscribe({
            next: (res) => {
              obs.next(res.datas);
              obs.complete();
            },
            error: (err) => {
              console.error(err);
              obs.next([]);
              obs.complete();
            },
          });
      });
    if (this.formGroup.get('bafaLicense').value) {
      getFuzzyBAFAList$().subscribe((res) => {
        this.formGroup
          .get('bafaBalQty')
          .setValue(
            res.filter(
              (x) => x.BAFALicense === this.formGroup.get('bafaLicense').value
            )[0].balanceQty
          );
        this.formGroup
          .get('bafaTotalQty')
          .setValue(
            res.filter(
              (x) => x.BAFALicense === this.formGroup.get('bafaLicense').value
            )[0].quantity
          );
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
