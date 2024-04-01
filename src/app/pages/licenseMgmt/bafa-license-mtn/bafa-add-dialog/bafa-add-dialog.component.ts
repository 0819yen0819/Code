import { DateInputHandlerService } from './../../../../core/services/date-input-handler.service';
import { Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { TranslateService } from '@ngx-translate/core';
import { SelectItem } from 'primeng/api';
import { DialogSettingParams, SelectorDialogParams } from 'src/app/core/model/selector-dialog-params';
import { SelectorItemType } from 'src/app/core/enums/selector-item-type';
import { UserContextService } from 'src/app/core/services/user-context.service';
@Component({
  selector: 'app-bafa-add-dialog',
  templateUrl: './bafa-add-dialog.component.html',
  styleUrls: ['./bafa-add-dialog.component.scss']
})
export class BafaAddDialogComponent implements OnInit, OnChanges {
  @Output() closeDialog = new EventEmitter<any>();
  @Output() submitData = new EventEmitter<any>();
  @Input() showDialog = true;
  @Input() editObj: any;

  formData: FormGroup;
  flagOptions: SelectItem[] = this.translateService.instant('SoaControlSetup.Options.flagOptions');
  selectorDialogParams!: SelectorDialogParams;
  uploadApiUrl: string;
  noticeCheckDialogParams: DialogSettingParams;
  noticeContentList: string[] = [];

  constructor(
    private formBuilder: FormBuilder,
    private translateService: TranslateService,
    private userContextService: UserContextService,
    private dateInputHandlerService:DateInputHandlerService
  ) { }

  get isEditMode() {
    return !!this.editObj;
  }

  get isAddMode() {
    return !!!this.editObj;
  }

  get title(){
    return this.isAddMode ?  this.translateService.instant('BafaLicenseMtn.Label.AddBafaLicense') :  this.translateService.instant('BafaLicenseMtn.Label.EditBafaLicense')
  }

  get tabTitle(){
    return this.isAddMode ?  this.translateService.instant('LicenseMgmt.Common.Tabs.SingleAdd') :   this.translateService.instant('LicenseMgmt.Common.Tabs.SingleModify')
  }


  ngOnInit(): void {
    this.uploadApiUrl = `/license/uploadBafaLicense/${this.userContextService.user$.getValue().tenant}/${this.userContextService.user$.getValue().userEmail}`
  }

  ngOnChanges(changes: SimpleChanges): void {
    this.editObj ? this.recoverFormData() : this.initForm();
  }

  close() {
    this.initForm();
    this.closeDialog.emit();
  }

  confirmOnClick() {
    if (!this.submitCheckPass()) { return this.showNoticeDialog(); }
    this.submitData.emit(this.formData.value);
    this.close();
  }

  showItemSelectDialog() {
    if (this.isEditMode) { return; }
    this.selectorDialogParams = {
      title: `${this.translateService.instant('Dialog.Header.Choose')} Item`,
      type: SelectorItemType.ITEM,
      visiable: true,
    };
  }

  async onSelectorDialogCallback(e) {
    this.formData.get('item').setValue(e.value.invItemNo);
  }

  /**
   * 初始化Form參數
   */
  private initForm() {
    this.formData = this.formBuilder.group({
      license: ['', Validators.required],
      item: ['', Validators.required],
      startDate: [new Date(), Validators.required],
      endDate: ['', Validators.required],
      qty: [0, Validators.required],
      remark: [''],
      flag: ['Y', Validators.required]
    });
  }

  /**
   * 還原Form參數
   */
  private recoverFormData() {
    this.formData = this.formBuilder.group({
      license: [this.editObj.bafaLicense, Validators.required],
      item: [this.editObj.productCode, Validators.required],
      startDate: [new Date(this.editObj.approveDate), Validators.required],
      endDate: [new Date(this.editObj.endDate), Validators.required],
      qty: [this.editObj.quantity || 0, Validators.required],
      remark: [this.editObj.remark],
      flag: [this.editObj.active, Validators.required]
    });
  }

  private showNoticeDialog() {
    if (!(this.noticeContentList.length > 0)) { return; }
    this.noticeCheckDialogParams = {
      title: this.translateService.instant('LicenseMgmt.Common.Title.Notification'),
      visiable: true,
      mode:'error'
    };
  }

  private submitCheckPass() {
    this.noticeContentList = [];

    const licenseIsNull = !this.formData.get('license').value;
    if (licenseIsNull) { this.noticeContentList.push(this.translateService.instant('BafaLicenseMtn.Msg.PleaseInputLicense'))}

    const itemIsNull = !this.formData.get('item').value;
    if (itemIsNull) { this.noticeContentList.push(this.translateService.instant('BafaLicenseMtn.Msg.PleaseInputItem'))}

    const startDateIsNull = !this.formData.get('startDate').value;
    if (startDateIsNull) { this.noticeContentList.push(this.translateService.instant('BafaLicenseMtn.Msg.PleaseInputStartDate'))}

    const endDateIsNull = !this.formData.get('endDate').value;
    if (endDateIsNull) { this.noticeContentList.push(this.translateService.instant('BafaLicenseMtn.Msg.PleaseInputEndDate'))}

    const qtyIsNull = !this.formData.get('qty').value && this.formData.get('qty').value !== 0;
    if (qtyIsNull) { this.noticeContentList.push(this.translateService.instant('BafaLicenseMtn.Msg.PleaseInputEndQty'))}

    const dateIsNotNull = this.formData.get('startDate').value && this.formData.get('endDate').value;
    const dateIsInvalid = this.formData.get('startDate').value > this.formData.get('endDate').value;
    if (dateIsNotNull && dateIsInvalid) {
      this.noticeContentList.push(this.translateService.instant('BafaLicenseMtn.Msg.InvalidEndDate'));
    }

    return this.noticeContentList.length === 0;
  }

    //#-----------------start------------------
  //# for date picker input format event
  onCheckDateHandler(): void {
    if (
      new Date(
        new Date(this.formData.controls.startDate.value).setHours(0, 0, 0, 0)
      ).getTime() >=
      new Date(
        new Date(this.formData.controls.endDate.value).setHours(23, 59, 59, 0)
      ).getTime()
    ) {
      this.formData.controls.endDate.setValue(null);
    }
  }

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
