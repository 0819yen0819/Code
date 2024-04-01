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
import { SelectorItemType } from 'src/app/core/enums/selector-item-type';
import { ItemInfo } from 'src/app/core/model/item-info';
import { SelectorDialogParams } from 'src/app/core/model/selector-dialog-params';
import { CommonApiService } from 'src/app/core/services/common-api.service';
import { LicenseControlApiService } from 'src/app/core/services/license-control-api.service';
import { LoaderService } from 'src/app/core/services/loader.service';

@Component({
  selector: 'app-am-sc047-item-dialog',
  templateUrl: './am-sc047-item-dialog.component.html',
  styleUrls: ['./am-sc047-item-dialog.component.scss'],
})
export class AmSc047ItemDialogComponent
  implements OnInit, OnChanges, OnDestroy
{
  @Input() settingParams: SelectorDialogParams;
  @Output() outputResult: EventEmitter<any> = new EventEmitter<any>();

  private unsubscribeEvent = new Subject();

  formGroup!: FormGroup;
  dialogSetting!: BehaviorSubject<SelectorDialogParams>;

  //> 儲存當前IMP單號，避免每次 add mode 打開都要 loading
  curFormNo!: string;

  //> loading target item info status
  isLoading!: boolean;

  //> item-selector dialog callback
  selectedTargetItem!: BehaviorSubject<ItemInfo | null>;

  //> item options
  selecteItemOptions!: BehaviorSubject<SelectItem<string>[]>;

  //> target item info
  targetItemInfo!: BehaviorSubject<ItemInfo | null>;

  //>submit btn label value
  submitBtnLabel!: string;

  constructor(
    private formbuilder: FormBuilder,
    private commonApiService: CommonApiService,
    private translateService: TranslateService,
    private licenseControlApiService: LicenseControlApiService,
    private loaderService: LoaderService
  ) {}

  ngOnInit(): void {
    //> init form structure
    this.formGroup = this.formbuilder.group({
      productCode: [null, [Validators.required]],
      quantity: [
        null,
        [Validators.required, Validators.pattern(/^\+?[1-9][0-9]*$/)],
      ],
      receipt: [null],
      remark: [null],
    });

    this.curFormNo = '';

    //>init loading status
    this.isLoading = false;

    //> init selected target item from selector dialog
    this.selectedTargetItem = new BehaviorSubject<ItemInfo>(null);

    //> init selected target item info
    this.targetItemInfo = new BehaviorSubject<ItemInfo | null>(null);

    this.selecteItemOptions = new BehaviorSubject<SelectItem<string>[]>([]);

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

    //> active subscriber of selected target item change event on component init
    this.selectedTargetItem
      .pipe(
        skipWhile((itemInfo) => itemInfo == null),
        takeUntil(this.unsubscribeEvent)
      )
      .subscribe((itemInfo) => {
        if (
          this.dialogSetting.getValue().data.mode == 'add' &&
          itemInfo != null
        ) {
          this.isLoading = true;
          this.getTargetItemInfo(itemInfo.invItemNo);
        }
      });
  }

  //> component value change event handler
  ngOnChanges(): void {
    const queryImportLicenseDataByFormNo$ = (model: {
      ouCode: string;
      formNo: string;
    }): Observable<
      {
        productCode: string;
        qty: number;
        formNo: string;
      }[]
    > =>
      new Observable<
        {
          productCode: string;
          qty: number;
          formNo: string;
        }[]
      >((obs) => {
        this.licenseControlApiService
          .queryImportLicenseDataByFormNo(model)
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

    if (this.dialogSetting) {
      this.dialogSetting.next({
        ...this.dialogSetting.getValue(),
        ...this.settingParams,
      });

      if (this.dialogSetting.getValue().visiable) {
        if (this.dialogSetting.getValue().data.mode == 'edit') {
          this.submitBtnLabel = this.translateService.instant(
            'Button.Label.Modify'
          );

          this.targetItemInfo.next(
            this.dialogSetting.getValue().data.selectedItemInfo
          );

          this.getTargetItemInfo(
            this.dialogSetting.getValue().data.selectedItemInfo.productCode
          );

          this.formGroup
            .get('productCode')
            .setValue(
              this.dialogSetting.getValue().data.selectedItemInfo.productCode
            );
          this.formGroup
            .get('quantity')
            .setValue(
              this.dialogSetting.getValue().data.selectedItemInfo.quantity
            );

          this.formGroup
            .get('receipt')
            .setValue(
              this.dialogSetting.getValue().data.selectedItemInfo.receipt
            );

          this.formGroup
            .get('remark')
            .setValue(
              this.dialogSetting.getValue().data.selectedItemInfo.remark
            );

          this.targetItemInfo.next(
            this.dialogSetting.getValue().data.selectedItemInfo
          );

          this.selectedTargetItem.next({
            ...this.dialogSetting.getValue().data.selectedItemInfo,
            ...{
              invItemNo:
                this.dialogSetting.getValue().data.selectedItemInfo.productCode,
            },
          });
        } else {
          this.formGroup.reset();
          this.targetItemInfo.next(null);
          this.selectedTargetItem.next(null);
          this.submitBtnLabel =
            this.translateService.instant('Button.Label.Add');

          if (
            this.curFormNo == '' ||
            this.curFormNo != this.dialogSetting.getValue().data.formNo
          ) {
            this.curFormNo = this.dialogSetting.getValue().data.formNo;

            const itemOptions = new Array();
            itemOptions.push({
              label: '請選擇',
              value: null,
            });

            this.loaderService.show();

            queryImportLicenseDataByFormNo$({
              ouCode: this.dialogSetting.getValue().data.ouCode,
              formNo: this.dialogSetting.getValue().data.formNo,
            }).subscribe((data) => {
              if (data.length > 0) {
                data.forEach((item) => {
                  itemOptions.push({
                    label: item.productCode,
                    value: item.productCode,
                  });
                });

                this.selecteItemOptions.next(itemOptions);
                this.loaderService.hide();
              } else {
                this.loaderService.hide();
              }
            });
          }
        }
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
          .subscribe((res) => {
            obs.next(res.itemInfo);
          });
      });

    if (this.dialogSetting.getValue().data.mode == 'add') {
      this.isLoading = true;
    }

    getTargetItemInfo$(itemNo).subscribe((res) => {
      this.targetItemInfo.next(res);
      this.isLoading = false;
    });
  }

  //> open selector dialog callback event
  onSelectorDialogCallback(result: SelectItem<any>): void {
    if (result.value !== null) {
      this.selectedTargetItem.next(result.value);
      this.formGroup.get('productCode').setValue(result.value.invItemNo);
    }
  }

  //> close selector dialog event
  onCloseAddItemDialogEvent(): void {
    //> close item add dialog
    this.dialogSetting.next({
      ...this.dialogSetting.getValue(),
      ...{ visiable: false },
    });
  }

  //> on item add mode select change event
  onItemSelectChangeHandler(): void {
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
    if (this.formGroup.get('productCode').value != null) {
      this.isLoading = true;
      getTargetItemInfo$(this.formGroup.get('productCode').value).subscribe(
        (res) => {
          this.targetItemInfo.next(res);
          this.isLoading = false;
        }
      );
    }
  }

  //> form submit event
  onFormSubmit(): void {
    //> submit form value to parent component

    const selectedData =
      this.settingParams && this.settingParams.data
        ? this.settingParams.data
        : {};

    this.outputResult.emit({
      ...selectedData,
      ...this.formGroup.getRawValue(),
      ...{ itemInfo: { ...this.targetItemInfo.getValue() } },
    });

    this.dialogSetting.next({
      ...this.dialogSetting.getValue(),
      ...{ visiable: false },
    });
  }
}
