import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnInit,
  Output,
} from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { BehaviorSubject } from 'rxjs';
import { SelectorItemType } from 'src/app/core/enums/selector-item-type';
import {
  AddItemInfoCallback,
  EUCItemInfo,
  ShowItemInfo,
} from 'src/app/core/model/euc-item-info';
import { SelectorDialogParams } from 'src/app/core/model/selector-dialog-params';

@Component({
  selector: 'app-am-euc-item-dialog',
  templateUrl: './am-euc-item-dialog.component.html',
  styleUrls: ['./am-euc-item-dialog.component.scss'],
})
export class AmEucItemDialogComponent implements OnInit, OnChanges {
  @Input() settingParams: SelectorDialogParams;
  @Input() mode!: string;
  @Input() selectedData!: EUCItemInfo;
  @Input() sampleFileNo: number; // 多筆新增 -> 範本檔案編號
  @Input() enabledSelectAllItem: boolean = false;
  @Output() outputResult: EventEmitter<{
    mode: string;
    data: AddItemInfoCallback | ShowItemInfo;
  }> = new EventEmitter<{
    mode: string;
    data: AddItemInfoCallback | ShowItemInfo;
  }>();

  dialogSetting!: BehaviorSubject<SelectorDialogParams>;

  singleAddTabTitle!: string;
  singleModifyTabTitle!: string;
  multiAddTabTitle!: string;

  closeNotice!: boolean;

  constructor(private translateService: TranslateService) {}

  ngOnInit(): void {
    //> init dialog setting
    this.dialogSetting = new BehaviorSubject<SelectorDialogParams>({
      title: '',
      type: SelectorItemType.NONE,
      visiable: false,
      modal: true,
      maximized: true,
      draggable: false,
      resizeable: true,
      blockScroll: true,
    });

    this.closeNotice = true;
  }

  //> component value change event handler
  ngOnChanges(): void {
    if (this.dialogSetting) {
      this.dialogSetting.next({
        ...this.dialogSetting.getValue(),
        ...this.settingParams,
      });
    }
    if (this.settingParams && this.settingParams.visiable) {
      this.closeNotice = false;

      this.singleAddTabTitle = this.translateService.instant(
        'LicenseMgmt.Common.Tabs.SingleAdd'
      );
      this.singleModifyTabTitle = this.translateService.instant(
        'LicenseMgmt.Common.Tabs.SingleModify'
      );
      this.multiAddTabTitle = this.translateService.instant(
        'LicenseMgmt.Common.Tabs.MultiAdd'
      );
    }
  }

  onSingleItemCallback(data: AddItemInfoCallback): void {
    if (data.itemID !== null) {
      this.outputResult.emit({ mode: 'single', data: data });
    }
    this.onCloseAddItemDialogEvent();
  }

  onMultiItemCallback(data: ShowItemInfo): void {
    if (data !== null) {
      this.outputResult.emit({ mode: 'multi', data: data });
    }
    this.onCloseAddItemDialogEvent();
  }

  onCloseAddItemDialogEvent(): void {
    //> close item add dialog
    this.closeNotice = true;

    this.dialogSetting.next({
      ...this.dialogSetting.getValue(),
      ...{ visiable: false },
    });
  }
}
