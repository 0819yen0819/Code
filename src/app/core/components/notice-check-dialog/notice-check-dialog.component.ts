import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnInit,
  Output,
} from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { DialogSettingParams } from 'src/app/core/model/selector-dialog-params';

@Component({
  selector: 'app-common-notice-check-dialog',
  templateUrl: './notice-check-dialog.component.html',
  styleUrls: ['./notice-check-dialog.component.scss'],
})
export class NoticeCheckDialogComponent implements OnInit, OnChanges {
  @Input() settingParams!: DialogSettingParams;
  @Input() contentList!: string[];
  @Output() closeNotice: EventEmitter<boolean> = new EventEmitter<boolean>();
  dialogSetting!: BehaviorSubject<DialogSettingParams>;

  constructor() {}

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
  }

  ngOnChanges(): void {
    //> when any changes, reset dialog setting params
    if (this.dialogSetting && this.contentList?.length !== 0) {
      this.dialogSetting.next({
        ...this.dialogSetting.getValue(),
        ...this.settingParams,
      });
    }
  }

  //> on dialog close event
  onDialogClosed(): void {
    this.dialogSetting.next({
      ...this.dialogSetting.getValue(),
      ...{ visiable: false },
    });

    this.contentList = new Array<string>();
    this.closeNotice.emit(true);
  }
}
