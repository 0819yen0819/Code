import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnInit,
  Output
} from '@angular/core';
import { FormGroup } from '@angular/forms';
import { BehaviorSubject, delay } from 'rxjs';
import { TableCol } from 'src/app/core/model/data-table-cols';
import { DataTableParams } from 'src/app/core/model/data-table-view';
import { DialogSettingParams } from 'src/app/core/model/selector-dialog-params';
import { ERPEXPDOInfo } from './../../../../../core/model/exp-ref-info';
import { ToastService } from './../../../../../core/services/toast.service';
import { AddSc047V2ItemByRefInitService } from './services/add-sc047-v2-item-by-ref-init.service';
import { AddSc047V2ItemByRefProcessService } from './services/add-sc047-v2-item-by-ref-process.service';

@Component({
  selector: 'app-add-sc047-v2-item-by-ref-dialog',
  templateUrl: './add-sc047-v2-item-by-ref-dialog.component.html',
  styleUrls: ['./add-sc047-v2-item-by-ref-dialog.component.scss'],
})
export class AddSc047V2ItemByRefDialogComponent implements OnInit, OnChanges {
  @Input() settingParams: DialogSettingParams;
  @Output() outputResult: EventEmitter<any[]> = new EventEmitter<any[]>();

  formGroup!: FormGroup;

  dialogSetting!: BehaviorSubject<DialogSettingParams>;

  //> data table settings
  dataTableSettings!: DataTableParams;

  refDataFromERP!: ERPEXPDOInfo[];
  selectedRefData!: any[];

  selectedRefDataErrorMsg: string[];

  itemCols!: TableCol[];

  isLoading!: boolean;
  isEmpty!: boolean;
  isCleanSelected!: boolean;
  isSelectedPass!: boolean;

  constructor(
    private addSc047V2ItemByRefInitService: AddSc047V2ItemByRefInitService,
    private addSc047V2ItemByRefProcessService: AddSc047V2ItemByRefProcessService,
    private toastService: ToastService
  ) {}

  ngOnInit(): void {
    //> init dialog setting
    this.dialogSetting = new BehaviorSubject<DialogSettingParams>({
      title: '',
      visiable: false,
      modal: true,
      maximized: true,
      draggable: false,
      resizeable: true,
      blockScroll: true,
    });

    this.dataTableSettings =
      this.addSc047V2ItemByRefInitService.onInitDataTableSettings();

    this.formGroup = this.addSc047V2ItemByRefInitService.onInitForm();
    this.itemCols = this.addSc047V2ItemByRefInitService.onInitTableCols();

    this.onInitParams();
  }

  ngOnChanges(): void {
    if (this.dialogSetting) {
      this.dialogSetting.next({
        ...this.dialogSetting.getValue(),
        ...this.settingParams,
      });

      if (this.settingParams.visiable) {
        this.formGroup.reset();
        this.onInitParams();
        this.onSearchKeywordCleanEvent();
      }
    }
  }

  onCloseDialogHandler(): void {
    this.isCleanSelected = true;

    this.dialogSetting.next({
      ...this.dialogSetting.getValue(),
      ...{ visiable: false },
    });
  }

  onInitParams(): void {
    this.isEmpty = false;
    this.isLoading = false;
    this.isCleanSelected = false;
    this.isSelectedPass = false;
    this.selectedRefData = new Array<ERPEXPDOInfo>();
    this.refDataFromERP = new Array<ERPEXPDOInfo>();
    this.selectedRefDataErrorMsg = new Array<string>();
    this.dataTableSettings.data = this.settingParams
      ? this.settingParams.data
      : null;
  }

  //> 關鍵字清理重整事件 active by special key down event
  onSearchKeyDownHandler(key: KeyboardEvent): void {
    if (key.code === 'Backspace' || key.code === 'Delete') {
      this.onSearchKeywordCleanEvent();
    }

    if (key.code === 'Enter' && this.formGroup.valid) {
      this.onSearchRefSubmit();
    }
  }

  onAddItemByRefDialogCallback(data: ERPEXPDOInfo[]) {
    this.selectedRefDataErrorMsg = new Array<string>();
    this.selectedRefData = data;
    for (const data of this.selectedRefData) {
      if (
        data.license &&
        data.quantity &&
        data.license.controlQty &&
        data.quantity > data.license.controlQty
      ) {
        this.isSelectedPass = false;
        break;
      }
      if (!data.license || !data.quantity) {
        this.isSelectedPass = false;
        break;
      }
      this.isSelectedPass = true;
    }

    if (!this.isSelectedPass) {
      for (const data of this.selectedRefData) {
        if (
          data.quantity &&
          data.license.controlQty &&
          data.quantity > data.license.controlQty
        ) {
          this.selectedRefDataErrorMsg.push(
            `Item：${data.part_no}，License：${data.license.licenseNo}`
          );
        }
      }
    }
  }

  //> 關鍵字清理重整事件
  onSearchKeywordCleanEvent(): void {
    this.formGroup.get('keyword').setValue(null);
    this.formGroup.enable({ onlySelf: true });
    this.refDataFromERP = new Array<ERPEXPDOInfo>();
  }

  onSearchRefSubmit(): void {
    this.isLoading = true;
    this.refDataFromERP = new Array<ERPEXPDOInfo>();
    this.addSc047V2ItemByRefProcessService
      .getRefListFromERP$({
        ...this.settingParams.data,
        ...{
          trxNo: this.formGroup.get('keyword').value,
        },
      })
      .pipe(delay(250))
      .subscribe({
        next: (res) => {
          for (const [i, data] of res.entries()) {
            data.key = i;
          }

          this.refDataFromERP = res;
          this.isLoading = false;

          if (this.refDataFromERP.length === 0) {
            this.isEmpty = true;
          }
        },
        error: (err) => {
          this.isLoading = false;
          console.error(err.message);
          this.toastService.error(err.message);
        },
      });
  }

  onSelectedRefSubmit(): void {
    for (const data of this.selectedRefData) {
      data.license = data.license.licenseNo;
      data.refShipment = data.trx_no;
      data.productCode = data.part_no;
    }

    this.outputResult.emit(this.selectedRefData);
    this.onCloseDialogHandler();
  }
}
