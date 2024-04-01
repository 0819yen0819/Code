import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { SelectItem } from 'primeng/api';
import { DialogSettingParams } from 'src/app/core/model/selector-dialog-params';

@Component({
  selector: 'app-soa-control-setup-by-item-update-dialog',
  templateUrl: './soa-control-setup-by-item-update-dialog.component.html',
  styleUrls: ['./soa-control-setup-by-item-update-dialog.component.scss'],
})
export class SoaControlSetupByItemUpdateDialogComponent implements OnInit {
  @Input() settingParams: DialogSettingParams;
  @Output() outputUpdateInfo: EventEmitter<any> = new EventEmitter<any>();
  dialogSetting: DialogSettingParams;
  statusOptions: SelectItem<string>[];
  statusSelected: string = 'Y';

  constructor() {
    this.dialogSetting = {
      title: '',
      visiable: false,
      modal: true,
      maximized: true,
      draggable: false,
      resizeable: true,
      blockScroll: true,
    };
    this.statusOptions = [
      { label: 'Y', value: 'Y' },
      { label: 'N', value: 'N' },
      { label: 'ALL', value: '0' },
    ];
  }

  ngOnInit(): void { }

  ngOnChanges(): void {
    //> when any changes, reset dialog setting params
    if (this.settingParams && this.settingParams.visiable) {
      this.dialogSetting = {
        ...this.dialogSetting,
        ...this.settingParams,
      };
    }
  }

  onOutputUpdateInfo(isCancel = false): void {
    if (isCancel) {
      this.outputUpdateInfo.emit(null);
    } else {
      this.outputUpdateInfo.emit({
        specialApproval: this.statusSelected,
      });
    }

    this.onDialogClosed();
  }

  onDialogClosed(): void {
    this.dialogSetting = {
      ...this.dialogSetting,
      ...{ visiable: false },
    };
  }
}
