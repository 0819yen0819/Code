import {
  Component,
  Input,
  OnChanges,
  OnInit,
  Output,
  EventEmitter,
} from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { BehaviorSubject } from 'rxjs';
import { SelectorItemType } from 'src/app/core/enums/selector-item-type';
import { SelectorDialogParams } from 'src/app/core/model/selector-dialog-params';

@Component({
  selector: 'app-am-eccn-status-dialog',
  templateUrl: './am-eccn-status-dialog.component.html',
  styleUrls: ['./am-eccn-status-dialog.component.scss'],
})
export class AmEccnStatusDialogComponent implements OnInit, OnChanges {
  @Input() settingParams: SelectorDialogParams;
  @Output() reloadNotice = new EventEmitter<any>();

  dialogSetting!: BehaviorSubject<SelectorDialogParams>;

  singleAddTabTitle!: string;
  singleModifyTabTitle!: string;
  multiAddTabTitle!: string;

  isDialogClose!: boolean;

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

    this.isDialogClose = true;
  }

  ngOnChanges(): void {
    if (this.dialogSetting) {
      this.dialogSetting.next({
        ...this.dialogSetting.getValue(),
        ...this.settingParams,
      });

      if (this.settingParams.visiable) {
        this.isDialogClose = false;
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
  }

  onCloseAddItemDialogEvent(): void {
    this.isDialogClose = true;
    this.dialogSetting.next({
      ...this.dialogSetting.getValue(),
      ...{ visiable: false },
    });
  }
}
