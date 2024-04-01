import { DateInputHandlerService } from './../../../../core/services/date-input-handler.service';
import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnInit,
  Output,
} from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { SelectItem } from 'primeng/api';
import {
  DialogSettingParams,
  SelectorDialogParams,
} from 'src/app/core/model/selector-dialog-params';
import { VenCusInfo } from 'src/app/core/model/ven-cus-info';
import { SoaControlSetupByUserService } from '../soa-control-setup-by-user/soa-control-by-user-setup.service';
import { getDialogDefault } from '../soa-control-setup-by-user/soa-control-setup-by-user-init';

@Component({
  selector: 'app-soa-control-by-user-dialog',
  templateUrl: './soa-control-by-user-dialog.component.html',
  styleUrls: ['./soa-control-by-user-dialog.component.scss'],
})
export class SoaControlByUserDialogComponent implements OnInit, OnChanges {
  @Input() showDialog = false;
  @Input() editObj = null;
  @Output() saveEmitter = new EventEmitter<any>();
  @Output() closeDialog = new EventEmitter<any>();

  formValue;
  selectorDialogParams: SelectorDialogParams;

  noticeCheckDialogParams: DialogSettingParams;
  noticeContentList: string[] = [];

  showLoader: boolean = false;

  constructor(
    public SoaControlSetupByUserService: SoaControlSetupByUserService,
    private translateService: TranslateService,
    private dateInputHandlerService: DateInputHandlerService
  ) {}

  /**
   * 編輯模式下禁用
   */
  get editDisabled() {
    return this.editObj !== null;
  }

  ngOnInit(): void {}

  ngOnChanges(): void {
    if (this.showDialog === true) {
      this.setFormValue();
    }
  }

  async setFormValue() {
    if (this.editObj) {
      this.showLoader = true;

      const vcCodeTmp = this.editObj.vcCode;

      this.formValue = JSON.parse(JSON.stringify(this.editObj));
      this.formValue.vcCode = null; // avoid to default preview is vcCode , should be label
      // recover ouCode
      const model = { query: this.formValue.ouCode };
      await this.SoaControlSetupByUserService.filterOu(model);
      this.formValue.ouCode = this.SoaControlSetupByUserService.filteredOus[0];
      this.formValue.validFrom = new Date(this.formValue.validFrom);
      // recover ouName
      this.formValue.ouName =
        this.SoaControlSetupByUserService.filteredOus[0].ouName;

      // recover vc label
      this.formValue.vcCode = vcCodeTmp;
      this.formValue.vcLabel = `${this.editObj.vcCode} - (${this.editObj.vcName})`;

      this.showLoader = false;
    } else {
      const allOuInfo = {
        displayOu: '0_ALL OU',
        groupCode: 'ALL',
        groupName: 'ALL',
        ouCode: '0',
        ouName: 'ALL OU',
        ouShortName: '0',
      };

      this.formValue = JSON.parse(JSON.stringify(getDialogDefault));
      this.formValue.key = this.SoaControlSetupByUserService.getRandomKey();
      this.formValue.flag = 'Y';
      this.formValue.ouCode = allOuInfo;
      this.formValue.ouName = allOuInfo.ouName;
      this.formValue.validFrom = new Date();
    }
  }

  ouOnSelect() {
    if (this.formValue.ouCode.ouCode !== '0') {
      this.formValue.group = this.formValue.ouCode.groupName;
    }
    this.formValue.ouName = this.formValue.ouCode.ouName;
  }

  groupChange() {
    if (this.formValue.ouCode.ouCode !== '0') {
      this.formValue.ouCode = '';
      this.formValue.ouName = '';
    }
  }

  /**
   * 儲存
   */
  saveOnClick() {
    if (!this.saveCheck()) {
      return this.showNoticeDialog('error');
    }
    this.saveEmitter.emit(this.getEmitObj());
  }

  onHideDetailDialog(e) {
    this.showDialog = false;
    this.formValue = null;
    this.closeDialog.emit(true);
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
    this.formValue.vcCode = null;
  }

  /**
   * 沒選autoComplete的話.清空input內容
   *
   * @param event
   */
  onBlurOu(event) {
    if (this.formValue.ouCode?.ouCode === undefined) {
      this.formValue.ouCode = undefined;
    }
  }

  /**
   * 儲存前檢查
   * @returns
   */
  private saveCheck() {
    this.noticeContentList = new Array<string>();
    const shouldNotBeNull = this.translateService.instant(
      'SoaControlSetup.Msg.NotAllowEmpty'
    );

    const groupEmpty = !this.formValue.group;
    if (groupEmpty) {
      this.noticeContentList.push(`Group ${shouldNotBeNull}`);
    }

    const ouCodeEmpty = !this.formValue.ouCode;
    if (ouCodeEmpty) {
      this.noticeContentList.push(`OU Code ${shouldNotBeNull}`);
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

  private getEmitObj() {
    if (this.editObj) {
      this.formValue.mode = 'edit';
    } else {
      this.formValue.mode = 'add';
    }
    return this.formValue;
  }

  /**
   * 打開訊息框
   * @returns
   */
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
