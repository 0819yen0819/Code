import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';

@Component({
  selector: 'app-soa-item-batch-edit',
  templateUrl: './soa-item-batch-edit.component.html',
  styleUrls: ['./soa-item-batch-edit.component.scss']
})
export class SoaItemBatchEditComponent implements OnInit {
  formGroup: FormGroup;
  deductionOptions = ['N', 'Y'];
  qtyWarning: boolean = false;

  @Output() batchOnSave: EventEmitter<any> = new EventEmitter<any>();
  @Output() batchOnCancel: EventEmitter<boolean> = new EventEmitter<boolean>();

  constructor(
    private formBuilder: FormBuilder
  ) { }

  ngOnInit(): void {
    this.initForm();
  }

  initForm() {
    this.formGroup = this.formBuilder.group({
      deduction: ['N'],
      qty: [null],
    });
  }

  saveOnClick() {
    if (!this.submitCheckPass()) { return; }; 
    this.batchOnSave.emit(this.formGroup.value);
  }
 
  cancelOnClick() {
    this.batchOnCancel.emit(true);
  }

  submitCheckPass() {
    if (this.formGroup.get('deduction').value === 'N') { return true }
    else {
      this.qtyWarning = !(this.formGroup.get('deduction').value === 'Y' && this.formGroup.get('qty').value > 0);
      return !this.qtyWarning;
    }
  }

  deductChange() {
    this.formGroup.get('deduction').value === 'Y' ? this.formGroup.get('qty')?.setValue(0) : this.formGroup.get('qty')?.setValue(null);
    this.qtyWarning = false; // 避免一打開就顯示紅框
  } 
}
