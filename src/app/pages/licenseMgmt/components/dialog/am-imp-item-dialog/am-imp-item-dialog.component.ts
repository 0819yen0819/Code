import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnInit,
  Output
} from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { BehaviorSubject } from 'rxjs';
import { SelectorItemType } from 'src/app/core/enums/selector-item-type';
import { SelectorDialogParams } from 'src/app/core/model/selector-dialog-params';

@Component({
  selector: 'app-am-imp-item-dialog',
  templateUrl: './am-imp-item-dialog.component.html',
  styleUrls: ['./am-imp-item-dialog.component.scss'],
})
export class AmImpItemDialogComponent implements OnInit, OnChanges {
  @Input() settingParams: SelectorDialogParams;
  @Input() mode!: string;
  @Input() selectedData!: any;
  @Output() outputResult: EventEmitter<{
    mode: string;
    data: any;
  }> = new EventEmitter<{
    mode: string;
    data: any;
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
  ngOnChanges(): void {
    if (this.dialogSetting) {
      this.dialogSetting.next({
        ...this.dialogSetting.getValue(),
        ...this.settingParams,
      });

      if (this.settingParams.visiable) {
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
  }

  onItembyFileCallback(data: any) {
    if (data) {
      data.ccats = data.ccats ? data.ccats.toString().trim() : null;
      data.license = data.license ? data.license.toString().trim() : null;
      data.shipFrom = data.shipFrom ? data.shipFrom.toString().trim() : null;
      this.outputResult.emit(data);
    }
    this.onCloseAddItemDialogEvent();
  }

  onCloseAddItemDialogEvent(): void {
    this.closeNotice = true;
    this.dialogSetting.next({
      ...this.dialogSetting.getValue(),
      ...{ visiable: false },
    });
  }
}
