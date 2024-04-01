import { DateInputHandlerService } from './../../../../../../core/services/date-input-handler.service';
import { ObjectFormatService } from './../../../../../../core/services/object-format.service';
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
  concatMap,
  Observable,
  skipWhile,
  Subject,
  takeLast,
  takeUntil
} from 'rxjs';
import { LicenseFormStatusEnum } from 'src/app/core/enums/license-form-status';
import { SelectorItemType } from 'src/app/core/enums/selector-item-type';
import { ExpLicenseItemInfo, ItemInfo } from 'src/app/core/model/item-info';
import {
  DialogSettingParams,
  SelectorDialogParams
} from 'src/app/core/model/selector-dialog-params';
import { CommonApiService } from 'src/app/core/services/common-api.service';
import { LicenseControlApiService } from 'src/app/core/services/license-control-api.service';
import { ImpexpProcessService } from 'src/app/pages/licenseMgmt/impexp/services/impexp-process.service';

@Component({
  selector: 'app-am-exp-single-item',
  templateUrl: './am-exp-single-item.component.html',
  styleUrls: ['./am-exp-single-item.component.scss'],
})
export class AmExpSingleItemComponent implements OnInit, OnChanges, OnDestroy {
  @Input() settingParams: SelectorDialogParams;
  @Input() mode!: string;
  @Input() selectedData!: ExpLicenseItemInfo;
  @Output() outputResult: EventEmitter<any> = new EventEmitter<any>();

  private unsubscribeEvent = new Subject();

  formGroup!: FormGroup;

  //> selector dialog params
  selectorDialogParams!: SelectorDialogParams;

  //> target item info
  targetItemInfo!: BehaviorSubject<ItemInfo | null>;

  //> item-selector dialog callback
  selectedITargetItem!: BehaviorSubject<ItemInfo | null>;

  //> special condition options
  specialConditionOptions!: SelectItem<string>[];

  //> loading target item info status
  isLoading!: boolean;

  //> Ref Item checking status
  isRefChecking!: boolean;

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
    private impexpProcessService: ImpexpProcessService,
    private licenseControlApiService: LicenseControlApiService,
    private objectFormatService: ObjectFormatService,
    private dateInputHandlerService:DateInputHandlerService
  ) { }

  ngOnInit(): void {
    //> init form structure
    this.formGroup = this.formbuilder.group({
      productCode: [null],
      ccats: [null],
      quantity: [
        null,
        [Validators.required, Validators.pattern(/^\+?[1-9][0-9]*$/)],
      ],
      deliveryNo: [null],
      refShipment: [null],
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

    //> init ref checking status
    this.isRefChecking = false;

    //> init min Date limit
    this.minDate = new Date();

    //> init selected target item from selector dialog
    this.selectedITargetItem = new BehaviorSubject<ItemInfo>(null);

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

  //> component value change event handler
  ngOnChanges(): void {
    if (this.formGroup) {
      this.formGroup.reset();

      //> init ref checking status
      this.isRefChecking = false;

      //> init selected target item info
      this.targetItemInfo = new BehaviorSubject<ItemInfo | null>(null);

      this.formGroup.get('startDate').setValue(new Date());

      //> 當審核人員身分為倉管，才能開放
      this.formGroup.get('license').disable({ onlySelf: true });
      this.formGroup.get('licenseQty').disable({ onlySelf: true });
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
        this.formGroup.get('deliveryNo').setValue(this.selectedData.deliveryNo);
        this.formGroup
          .get('refShipment')
          .setValue(this.selectedData.refShipment);
        this.formGroup.get('price').setValue(this.objectFormatService.RecorveryThousandFormat(this.selectedData.price));
        this.formGroup.get('license').setValue(this.selectedData.license);
        this.formGroup.get('licenseQty').setValue(this.objectFormatService.RecorveryThousandFormat(this.selectedData.licenseQty));
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

        if (this.router.url.includes('approving')) {
          //> 根據是否是倉管修改表單開放
          this.formGroup.disable();
          if (this.settingParams.data.isTaskStarter) {
            this.formGroup.enable();
            this.formGroup.get('license').disable({ onlySelf: true });
            this.formGroup.get('licenseQty').disable({ onlySelf: true });
            this.formGroup.get('startDate').disable({ onlySelf: true });
            this.formGroup.get('endDate').disable({ onlySelf: true });
          } else if (this.settingParams.data.isWarehouseMember) {
            this.formGroup.disable();
            this.formGroup.get('license').enable({ onlySelf: true });
            this.formGroup.get('licenseQty').enable({ onlySelf: true });
            this.formGroup.get('bafaLicense').enable({ onlySelf: true });
            this.formGroup.get('startDate').enable({ onlySelf: true });
            this.formGroup.get('endDate').enable({ onlySelf: true });

            //# TK-21665
            this.formGroup.get('remark').enable({ onlySelf: true });
            this.formGroup.get('license').addValidators([Validators.required]);
            this.formGroup
              .get('licenseQty')
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
        this.formGroup.get('license').setValue(null);
        this.formGroup.get('licenseQty').setValue(null);
      }
    }
  }

  //> component destory event handler
  ngOnDestroy(): void {
    this.unsubscribeEvent.next(null);
    this.unsubscribeEvent.complete();
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
            ieType: 'E',
            productCode: this.formGroup.get('productCode').value,
          },
        },
      };
    }
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
      } else {
        this.formGroup.get('bafaLicense').setValue(result.value.BAFALicense);
        this.formGroup.get('bafaBalQty').setValue(result.value.balanceQty);
        this.formGroup.get('bafaTotalQty').setValue(result.value.quantity);
      }
    }
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

  onCloseAddItemDialogEvent(): void {
    //> reset item add dialog view
    this.targetItemInfo.next(null);
    this.formGroup.reset();
    this.outputResult.emit();
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

  private onPreCheckDOItem(): void {
    //> 當 DO 有值時，預先做檢核
    this.isRefChecking = true;
    this.impexpProcessService
      .getEXPDOAPIParamsFromERP$()
      .pipe(
        concatMap((res) =>
          this.impexpProcessService.expDOList$(res, this.objectFormatService.ObjectClean({
            trxNo: this.formGroup.get('deliveryNo').value
              ? this.formGroup.get('deliveryNo').value.toString().trim()
              : this.formGroup.get('deliveryNo').value,
            deliverTo: this.settingParams.data.deliverTo,
            address: this.settingParams.data.address,
            orgId: this.settingParams.data.ouCode,
            targetNo: this.settingParams.data.vcCode,
            vctype: this.settingParams.data.vcType,
          }))
        )
      )
      .subscribe((res) => {
        this.isRefChecking = false;
        //> 檢核成功
        if (
          res.filter(
            (data) => data.part_no === this.formGroup.get('productCode').value
          ).length > 0
        ) {
          this.outputResult.emit({
            ...this.selectedData,
            ...this.formGroup.getRawValue(),
            ...{
              deliveryNo: this.formGroup.get('deliveryNo').value
                ? this.formGroup.get('deliveryNo').value.toString().trim()
                : this.formGroup.get('deliveryNo').value,
            },
            ...{ itemInfo: { ...this.targetItemInfo.getValue() } },
          });
        }
        //>檢核失敗
        else {
          this.noticeContentList = [
            this.translateService.instant('LicenseMgmt.Common.Hint.EXPDOError'),
          ];
          this.noticeCheckDialogParams = {
            title: this.translateService.instant(
              'LicenseMgmt.Common.Title.Notification'
            ),
            visiable: true,
            mode: 'error',
          };
          this.formGroup.get('startDate').setValue(new Date());
        }
      });
  }

  //> form submit event
  onFormSubmit(): void {
    //> submit form value to parent component
    this.formGroup
      .get('startDate')
      .setValue(new Date(this.formGroup.get('startDate').value).getTime());

    if (this.formGroup.get('endDate').value != null) {
      this.formGroup
        .get('endDate')
        .setValue(new Date(this.formGroup.get('endDate').value).getTime());
    }

    //> 檢核 ref shipment
    if (
      this.formGroup.get('deliveryNo').value &&
      this.settingParams &&
      this.settingParams.data &&
      this.settingParams.data.country === 'SG'
    ) {
      this.onPreCheckDOItem();
    } else {
      if (this.formGroup.get('productCode').value) {
        this.outputResult.emit({
          ...this.selectedData,
          ...this.formGroup.getRawValue(),
          ...{
            deliveryNo: this.formGroup.get('deliveryNo').value
              ? this.formGroup.get('deliveryNo').value.toString().trim()
              : this.formGroup.get('deliveryNo').value,
          },
          ...{ itemInfo: { ...this.targetItemInfo.getValue() } },
        });
      } else {
        this.outputResult.emit({
          ...this.selectedData,
          ...this.formGroup.getRawValue(),
          ...{
            deliveryNo: this.formGroup.get('deliveryNo').value
              ? this.formGroup.get('deliveryNo').value.toString().trim()
              : this.formGroup.get('deliveryNo').value,
          },
          ...{ eccn: null },
        });
      }
    }
  }

  private getCurBAFAInfo(): void {
    const getFuzzyBAFAList$ = (): Observable<any[]> =>
      new Observable<any[]>((obs) => {
        this.licenseControlApiService
          .getTargetBAFAInfo('E', this.selectedData.productCode)
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
