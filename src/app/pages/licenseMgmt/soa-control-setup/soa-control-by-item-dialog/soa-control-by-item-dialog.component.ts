import { DateInputHandlerService } from './../../../../core/services/date-input-handler.service';
import { UserContextService } from 'src/app/core/services/user-context.service';
import { SoaControlSetupByItemService } from './../soa-control-setup-by-item/soa-control-by-item-setup.service';
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
import { getDialogDefault } from '../soa-control-setup-by-user/soa-control-setup-by-user-init';

@Component({
  selector: 'app-soa-control-by-item-dialog',
  templateUrl: './soa-control-by-item-dialog.component.html',
  styleUrls: ['./soa-control-by-item-dialog.component.scss'],
})
export class SoaControlByItemDialogComponent implements OnInit, OnChanges {
  @Input() showDialog = false;
  @Input() editObj = null;
  @Output() saveEmitter = new EventEmitter<any>();
  @Output() closeDialog = new EventEmitter<any>();

  formValue;
  selectorDialogParams: SelectorDialogParams;

  noticeCheckDialogParams: DialogSettingParams;
  noticeContentList: string[] = [];

  showLoader: boolean = false;

   specialApprovalOptions =  [
    {
      "label": "Y",
      "value": "Y"
    },
    {
      "label": "N",
      "value": "N"
    },
    {
      "label": "ALL",
      "value": "0"
    }
  ]
  constructor(
    private translateService: TranslateService,
    public soaControlSetupByItemService: SoaControlSetupByItemService,
    private userContextService: UserContextService,
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
      if (this.formValue.specialApproval === "ALL") {this.formValue.specialApproval = "0"}
      this.formValue.vcCode = null; // avoid to default preview is vcCode , should be label
      // recover vc label
      this.formValue.vcCode = vcCodeTmp;

      if (this.formValue.vcCode === 'All') {
        this.formValue.vcLabel = `0 - ${this.editObj.vcName}`;
      } else {
        this.formValue.vcLabel = `${this.editObj.vcCode} - (${this.editObj.vcName})`;
      }
      this.formValue.brand = {
        label: this.formValue.brand,
        value: this.formValue.brand,
      };
      this.formValue.item = {
        label: this.formValue.productCode,
        value: this.formValue.productCode,
      };
      this.formValue.validFrom = new Date(this.formValue.validFrom);
      await this.soaControlSetupByItemService.filterItem(
        this.formValue.item.value
      );
      await this.soaControlSetupByItemService.filterBrand(
        this.formValue.brand.value
      );
      await this.soaControlSetupByItemService.initCtg1Options({
        tenant: this.userContextService.user$.getValue().tenant,
        brand: this.formValue.brand.value,
      });
      await this.soaControlSetupByItemService.initCtg2Options({
        tenant: this.userContextService.user$.getValue().tenant,
        brand: this.formValue.brand.value,
        ctg1: this.formValue.ctg1,
      });
      await this.soaControlSetupByItemService.initCtg3Options({
        tenant: this.userContextService.user$.getValue().tenant,
        brand: this.formValue.brand.value,
        ctg1: this.formValue.ctg1,
        ctg2: this.formValue.ctg2,
      });
      this.showLoader = false;
    } else {
      this.formValue = JSON.parse(JSON.stringify(getDialogDefault));
      this.formValue.specialApproval = 'N';
      this.formValue.item = {
        label: 'All Item',
        value: 0,
      };
      this.formValue.vcCode = 0;
      this.formValue.vcLabel = '0 - ALL (ALL)';
      this.formValue.key = this.soaControlSetupByItemService.getRandomKey();
      this.formValue.flag = 'Y';
      this.formValue.validFrom = new Date();
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
    this.formValue.vcCode = 0;
    this.formValue.vcLabel = 'ALL (ALL)';
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

    if (typeof this.formValue.item === 'object') {
      this.formValue.item = this.formValue.item.value;
    }
    if (typeof this.formValue.brand === 'object') {
      this.formValue.brand = this.formValue.brand.value;
    }

    //> 還原 vcCode to DB
    if (this.formValue.vcCode === 'All') {
      this.formValue.vcCode = 0;
    }

    if (this.formValue.item === 'All Item') {
      this.formValue.item = '0';
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

  onBrandSelect(): void {
    this.formValue.ctg1 = null;
    this.formValue.ctg2 = null;
    this.formValue.ctg3 = null;
    if (this.formValue.brand.value) {
      this.soaControlSetupByItemService.initCtg1Options({
        tenant: this.userContextService.user$.getValue().tenant,
        brand: this.formValue.brand.value,
      });
    }
  }

  onCtg1Select(): void {
    this.formValue.ctg2 = null;
    this.formValue.ctg3 = null;
    if (this.formValue.brand.value && this.formValue.ctg1) {
      this.soaControlSetupByItemService.initCtg2Options({
        tenant: this.userContextService.user$.getValue().tenant,
        brand: this.formValue.brand.value,
        ctg1: this.formValue.ctg1,
      });
    }
  }

  onCtg2Select(): void {
    this.formValue.ctg3 = null;
    if (
      this.formValue.brand.value &&
      this.formValue.ctg1 &&
      this.formValue.ctg2
    ) {
      this.soaControlSetupByItemService.initCtg3Options({
        tenant: this.userContextService.user$.getValue().tenant,
        brand: this.formValue.brand.value,
        ctg1: this.formValue.ctg1,
        ctg2: this.formValue.ctg2,
      });
    }
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
