import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnInit,
  Output,
} from '@angular/core';
import { SelectItem } from 'primeng/api';
import { BehaviorSubject } from 'rxjs';
import { SelectorItemType } from 'src/app/core/enums/selector-item-type';
import { SelectorDialogParams } from 'src/app/core/model/selector-dialog-params';

@Component({
  selector: 'app-common-selector-dialog',
  templateUrl: './selector-dialog.component.html',
  styleUrls: ['./selector-dialog.component.scss'],
})
export class ItemSelectorDialogComponent implements OnInit, OnChanges {
  @Input() settingParams: SelectorDialogParams;
  @Output() outputResult: EventEmitter<SelectItem<string>> = new EventEmitter<
    SelectItem<string>
  >();
  dialogSetting!: BehaviorSubject<SelectorDialogParams>;

  constructor() {}

  ngOnInit(): void { 
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
  }

  //>selector by type dialog callback event
  onSubComponentResultCallback(result: SelectItem<string>): void {
    this.dialogSetting.next({
      ...this.dialogSetting.getValue(),
      ...{ visiable: false },
    });

    this.outputResult.emit(result);
  }

  ngOnChanges(): void {
    if (this.dialogSetting) {
      this.dialogSetting.next({
        ...this.dialogSetting.getValue(),
        ...this.settingParams,
      });
    }
  }
}
