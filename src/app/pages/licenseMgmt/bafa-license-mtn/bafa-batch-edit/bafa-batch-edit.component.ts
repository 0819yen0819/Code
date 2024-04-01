import { DateInputHandlerService } from './../../../../core/services/date-input-handler.service';
import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { TranslateService } from '@ngx-translate/core';
import { SelectItem } from 'primeng/api';

@Component({
  selector: 'app-bafa-batch-edit',
  templateUrl: './bafa-batch-edit.component.html',
  styleUrls: ['./bafa-batch-edit.component.scss']
})
export class BafaBatchEditComponent implements OnInit {
  @Output() closeDialog = new EventEmitter<any>();
  @Output() submitData = new EventEmitter<any>();

  flagOptions: SelectItem[];
  formData: FormGroup;

  constructor(
    private formBuilder: FormBuilder,
    private translateService: TranslateService,
    private dateInputHandlerService:DateInputHandlerService
  ) { }

  ngOnInit(): void {
    this.initOptions();
    this.initForm();
  }

  initOptions() {
    this.flagOptions = this.translateService.instant('BafaLicenseMtn.Options.flagOptions');
  }

  saveOnClick() {
    this.submitData.emit(this.formData.value);
  }

  cancelOnClick() {
    this.closeDialog.emit();
  }

  private initForm() {
    this.formData = this.formBuilder.group({
      flag: [''],
      endDate: ['']
    });
  }

  //#-----------------start------------------
  //# for date picker input format event

  onDatePickerInput(event: InputEvent): void {
    this.dateInputHandlerService.concat(event.data);
  }

  onDatePickerSelectAndBlur(): void {
    this.dateInputHandlerService.clean();
  }

  onDatePickerClose(key: string): void {
    this.formData.controls[key].setValue(
      this.dateInputHandlerService.getDate() ??
        this.formData.controls[key].value
    );
    this.dateInputHandlerService.clean();
  }
  //#------------------end------------------
}
