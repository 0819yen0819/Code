import { DateInputHandlerService } from './../../../../core/services/date-input-handler.service';
import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  Output,
} from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { SelectItem } from 'primeng/api';
import {
  DialogSettingParams,
  SelectorDialogParams,
} from 'src/app/core/model/selector-dialog-params';
import { VenCusInfo } from 'src/app/core/model/ven-cus-info';
import { getDialogDefault } from '../soa-control-setup-by-user/soa-control-setup-by-user-init';
import { SoaExclusionControlSetupService } from '../soa-exclusion-control/soa-exclusion-control-setup.service';

@Component({
  selector: 'app-soa-exclusion-control-dialog',
  templateUrl: './soa-exclusion-control-dialog.component.html',
  styleUrls: ['./soa-exclusion-control-dialog.component.scss'],
})
export class SoaExclusionControlDialogComponent implements OnChanges {
  @Input() showDialog = false;
  @Input() editObj = null;
  @Output() saveEmitter = new EventEmitter<any>();
  @Output() closeDialog = new EventEmitter<any>();

  formValue;
  selectorDialogParams: SelectorDialogParams;

  noticeCheckDialogParams: DialogSettingParams;
  noticeContentList: string[] = [];

  constructor(
    public soaExclusionControlSetupService: SoaExclusionControlSetupService,
    private translateService: TranslateService,
    private dateInputHandlerService: DateInputHandlerService
  ) {}

  ngOnChanges(): void {
    if (this.showDialog === true) {
      this.setFormValue();
    }
  }

  saveOnClick() {
    if (!this.saveCheck()) {
      return this.showNoticeDialog('error');
    }
    this.saveEmitter.emit(this.getEmitObj());
    this.onHideDetailDialog();
  }

  onHideDetailDialog() {
    this.showDialog = false;
    this.formValue = null;
    this.closeDialog.emit(true);
  }

  async setFormValue() {
    if (this.editObj) {
      const vcCodeTmp = this.editObj.vcCode;

      this.formValue = JSON.parse(JSON.stringify(this.editObj));
      this.formValue.vcCode = null; // avoid to default preview is vcCode , should be label

      this.formValue.brand = {
        label: this.formValue.brand,
        value: this.formValue.brand,
      };

      this.formValue.validFrom = new Date(this.formValue.validFrom);

      // recover vc label
      this.formValue.vcCode = vcCodeTmp;
      this.formValue.vcLabel = `${this.editObj.vcCode} - (${this.editObj.vcName})`;
    } else {
      this.formValue = JSON.parse(JSON.stringify(getDialogDefault));
      this.formValue.key = this.soaExclusionControlSetupService.getRandomKey();
      this.formValue.flag = 'Y';
      this.formValue.validFrom = new Date();
    }
  }

  /**
   * 廠商名單被點擊
   */
  cvSelectDialogOnOpen(): void {
    if (!this.formValue.vcType) {
      return;
    }
    this.selectorDialogParams = {
      title: `${this.translateService.instant('Dialog.Header.Choose')} ${
        this.formValue.vcType
      }`,
      type: this.formValue.vcType.toLowerCase() + '_all',
      visiable: true,
    };
  }

  /**
   * 廠商名單回傳
   *
   * @param result
   */
  onSelectorDialogCallback(result: SelectItem<VenCusInfo>): void {
    this.formValue.vcCode = result;
    this.formValue.vcName =
      result.value.customerName || result.value.vendorName;
  }

  vcTypeChange() {
    this.formValue.vcCode = 0;
    this.formValue.vcLabel = 'ALL (ALL)';
  }

  private saveCheck() {
    this.noticeContentList = new Array<string>();
    const shouldNotBeNull = this.translateService.instant(
      'SoaControlSetup.Msg.NotAllowEmpty'
    );

    const groupEmpty = !this.formValue.group;
    if (groupEmpty) {
      this.noticeContentList.push(`Group ${shouldNotBeNull}`);
    }

    const brandEmpty = !this.formValue.brand;
    if (brandEmpty) {
      this.noticeContentList.push(`Brand ${shouldNotBeNull}`);
    }

    const flagEmpty = !this.formValue.flag;
    if (flagEmpty) {
      this.noticeContentList.push(
        `${this.translateService.instant(
          'SoaControlSetup.Label.Flag'
        )} ${shouldNotBeNull}`
      );
    }

    const vcLabelEmpty =
      !this.formValue.vcLabel && !this.formValue.vcCode?.label;
    if (vcLabelEmpty) {
      this.noticeContentList.push(
        `${this.translateService.instant(
          'SoaControlSetup.Label.CustomerVendorType'
        )} ${shouldNotBeNull}`
      );
    }

    const vaildFromEmpty = !this.formValue.validFrom;
    if (vaildFromEmpty) {
      this.noticeContentList.push(
        `${this.translateService.instant(
          'SoaControlSetup.Label.ValidFrom'
        )} ${shouldNotBeNull}`
      );
    }

    return this.noticeContentList.length === 0;
  }

  private showNoticeDialog(mode: string) {
    if (!(this.noticeContentList.length > 0)) {
      return;
    }
    this.noticeCheckDialogParams = {
      title: this.translateService.instant(
        'LicenseMgmt.Common.Title.Notification'
      ),
      visiable: true,
      mode: mode,
    };
  }

  private getEmitObj() {
    if (this.editObj) {
      this.formValue.mode = 'edit';
    } else {
      this.formValue.mode = 'add';
    }
    return this.formValue;
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
    this.formValue[key] =
      this.dateInputHandlerService.getDate() ?? this.formValue[key];
    this.dateInputHandlerService.clean();
  }
  //#------------------end------------------
}
