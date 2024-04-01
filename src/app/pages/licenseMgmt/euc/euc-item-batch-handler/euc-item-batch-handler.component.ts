import { DateInputHandlerService } from './../../../../core/services/date-input-handler.service';
import {
  Component,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output
} from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { ObjectFormatService } from 'src/app/core/services/object-format.service';

@Component({
  selector: 'app-euc-item-batch-handler',
  templateUrl: './euc-item-batch-handler.component.html',
  styleUrls: ['./euc-item-batch-handler.component.scss'],
})
export class EucItemBatchHandlerComponent implements OnInit, OnDestroy {
  @Input() data: any[] = new Array();
  @Output() onResetSelected: EventEmitter<any> = new EventEmitter<any>();
  @Output() outputResult: EventEmitter<any[]> = new EventEmitter<any[]>();

  private unSubscribeEvent = new Subject();

  formGroup!: FormGroup;

  isLockSubmit!: boolean;

  constructor(
    private formbuilder: FormBuilder,
    private objectFormatService: ObjectFormatService,
    private dateInputHandlerService:DateInputHandlerService
  ) {}

  ngOnInit(): void {
    this.isLockSubmit = true;

    this.formGroup = this.formbuilder.group({
      startDate: [null],
      endDate: [null],
      quantity: [null, [Validators.pattern(/^\+?[1-9][0-9]*$/)]],
    });

    this.formGroup.valueChanges
      .pipe(takeUntil(this.unSubscribeEvent))
      .subscribe((res) => {
        if (res.startDate && res.endDate) {
          this.isLockSubmit = false;
        } else if (res.quantity && this.formGroup.get('quantity').valid) {
          this.isLockSubmit = false;
        } else {
          this.isLockSubmit = true;
        }
      });
  }

  ngOnDestroy(): void {
    this.unSubscribeEvent.next(null);
    this.unSubscribeEvent.complete();
  }

  onFormCancelEvent(): void {
    this.formGroup.reset();
    this.onResetSelected.emit();
  }

  onFormSubmitEvent(): void {
    for (const item of this.data) {
      delete item.key;
      if (
        this.formGroup.get('startDate').value &&
        this.formGroup.get('endDate').value
      ) {
        item.periodFrom = this.objectFormatService.DateFormat(
          this.formGroup.get('startDate').value,'/'
        );
        item.periodTo = this.objectFormatService.DateFormat(
          this.formGroup.get('endDate').value,'/'
        );
      }
      if (this.formGroup.get('quantity').value) {
        item.quantity = this.formGroup.get('quantity').value;
      }
    }

    this.outputResult.emit(this.data);
    this.onResetSelected.emit();
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
