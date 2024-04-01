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
import { BehaviorSubject, Observable, Subject, takeLast } from 'rxjs';
import { skipWhile, takeUntil } from 'rxjs/operators';
import { SelectorItemType } from 'src/app/core/enums/selector-item-type';
import { EUCItemInfo } from 'src/app/core/model/euc-item-info';
import { SelectorDialogParams } from 'src/app/core/model/selector-dialog-params';
import { CommonApiService } from 'src/app/core/services/common-api.service';
import { DateInputHandlerService } from 'src/app/core/services/date-input-handler.service';
import { CurFormStatusService } from 'src/app/pages/licenseMgmt/services/cur-form-status.service';

@Component({
  selector: 'app-am-euc-single-item',
  templateUrl: './am-euc-single-item.component.html',
  styleUrls: ['./am-euc-single-item.component.scss'],
})
export class AmEucSingleItemAddComponent implements OnInit, OnChanges, OnDestroy {
  @Input() selectedData!: any;
  @Input() mode!: string;
  @Input() isTCSUMember!: string;
  @Input() isParentDialogClose: boolean;
  @Output() outputSingleItem: EventEmitter<EUCItemInfo> =
    new EventEmitter<EUCItemInfo>();

  private unsubscribeEvent = new Subject();

  formGroup!: FormGroup;

  curFormStatus!: any;

  //> item-selector dialog callback
  selectedITargetItem!: BehaviorSubject<EUCItemInfo>;

  //> target item info
  targetItemInfo!: BehaviorSubject<EUCItemInfo | null>;

  //> loading target item info status
  isLoading!: boolean;

  //> selector dialog params
  selectorDialogParams!: SelectorDialogParams;

  //>submit btn label value
  submitBtnLabel!: string;

  constructor(
    private formbuilder: FormBuilder,
    private commonApiService: CommonApiService,
    private translateService: TranslateService,
    private curFormStatusService: CurFormStatusService,
    private dateInputHandlerService:DateInputHandlerService
  ) { }

  ngOnInit(): void {
    //> init form structure
    this.formGroup = this.formbuilder.group({
      itemID: [null, [Validators.required]],
      startDate: [null, [Validators.required]],
      endDate: [null, [Validators.required]],
      ctmPo: [null],
      project: [null],
      quantity: [
        null,
        [Validators.required, Validators.pattern(/^\+?[1-9][0-9]*$/)],
      ],
    });

    //> init selected target item from selector dialog
    this.selectedITargetItem = new BehaviorSubject<EUCItemInfo>(null);

    //> init selected target item info
    this.targetItemInfo = new BehaviorSubject<EUCItemInfo | null>(null);

    //>init loading status
    this.isLoading = false;

    //> active subscriber of selected target item change event on component init
    this.selectedITargetItem
      .pipe(
        skipWhile((itemInfo) => itemInfo == null),
        takeUntil(this.unsubscribeEvent)
      )
      .subscribe((itemInfo) => {
        if (this.mode == 'add') {
          this.isLoading = true;
        }
        this.getTargetItemInfo(itemInfo.invItemNo);
      });

    this.curFormStatusService
      .getCurFormStatus()
      .pipe(takeUntil(this.unsubscribeEvent))
      .subscribe((formStatus) => {
        this.curFormStatus = formStatus;
      });

    this.onInitDateSelector();
  }

  ngOnChanges(): void {
    if (this.mode == 'edit') {
      this.submitBtnLabel = this.translateService.instant(
        'Button.Label.Modify'
      );
    } else {
      this.submitBtnLabel = this.translateService.instant('Button.Label.Add');
    }

    try {
      this.targetItemInfo.next(null);
      this.formGroup.reset();
      this.onInitDateSelector();
    } catch { }

    if (this.selectedData && this.mode == 'edit') {
      this.targetItemInfo.next(this.selectedData);

      this.selectedITargetItem.next({
        ...this.selectedData,
        ...{ invItemNo: this.selectedData.productCode },
      });

      this.formGroup.get('itemID').setValue(this.selectedData.productCode);
      this.formGroup.get('ctmPo').setValue(this.selectedData.ctmPo);
      this.formGroup.get('project').setValue(this.selectedData.project);
      this.formGroup.get('quantity').setValue(this.selectedData.quantity);
      this.formGroup
        .get('startDate')
        .setValue(new Date(this.selectedData.periodFrom));
      this.formGroup
        .get('endDate')
        .setValue(new Date(this.selectedData.periodTo));

      if (this.isTCSUMember) {
        this.formGroup.get('itemID').disable({ onlySelf: true });
      }
    }
  }

  //> component destory event handler
  ngOnDestroy(): void {
    this.unsubscribeEvent.next(null);
    this.unsubscribeEvent.complete();
  }

  //> form submit event
  onFormSubmit(): void {
    //> format type of date value to unix timestamp

    this.formGroup
      .get('startDate')
      .setValue(new Date(this.formGroup.get('startDate').value).getTime());
    this.formGroup
      .get('endDate')
      .setValue(new Date(this.formGroup.get('endDate').value).getTime());

    //> submit form value to parent component
    this.outputSingleItem.emit({
      ...this.selectedData,
      ...this.formGroup.getRawValue(),
      ...{ itemInfo: { ...this.targetItemInfo.getValue() } },
    });

    this.onCloseAddItemDialog();
  }

  //> init start/end date
  onInitDateSelector(): void {
    this.formGroup
      .get('startDate')
      .setValue(new Date(new Date().setHours(0, 0, 0, 0)));
    this.formGroup
      .get('endDate')
      .setValue(
        new Date(
          new Date(new Date().setHours(0, 0, 0, 0)).setFullYear(
            new Date().getFullYear() + 2
          )
        )
      );
  }

  //> close add item dialog event
  onCloseAddItemDialog(): void {
    //> reset item add dialog view
    this.targetItemInfo.next(null);
    this.formGroup.reset();
    this.outputSingleItem.emit({
      ...this.selectedData,
      ...this.formGroup.getRawValue(),
      ...{ itemInfo: null },
    });
  }

  //> get target item info (Accurate)
  getTargetItemInfo(itemNo: EUCItemInfo['invItemNo']): void {
    const getTargetItemInfo$ = (
      itemNo: EUCItemInfo['invItemNo']
    ): Observable<EUCItemInfo> =>
      new Observable<EUCItemInfo>((obs) => {
        this.commonApiService
          .getTargetItemInfo(itemNo)
          .pipe(takeLast(1))
          .subscribe((res) => {
            obs.next(res.itemInfo);
          });
      });

    getTargetItemInfo$(itemNo).subscribe((res) => {
      this.targetItemInfo.next(res);
      this.isLoading = false;
    });
  }

  //> open selector dialog handler
  onOpenSelectorDialogEvent(): void {
    this.selectorDialogParams = {
      title: `${this.translateService.instant('Dialog.Header.Choose')} Item`,
      type: SelectorItemType.ITEM,
      visiable: true,
    };
  }

  //> open selector dialog callback event
  onSelectorDialogCallback(result: SelectItem<EUCItemInfo>): void {
    if (result.value !== null) {
      this.selectedITargetItem.next(result.value);
      this.formGroup.get('itemID').setValue(result.value.invItemNo);
    } else {
      this.isLoading = false;
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
