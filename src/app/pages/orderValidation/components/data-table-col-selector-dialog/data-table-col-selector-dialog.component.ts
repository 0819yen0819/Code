import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnInit,
  Output
} from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { TableCol } from 'src/app/core/model/data-table-cols';
import { DialogSettingParams } from 'src/app/core/model/selector-dialog-params';

@Component({
  selector: 'sov-app-common-data-table-col-selector',
  templateUrl: './sov-data-table-col-selector-dialog.component.html',
  styleUrls: ['./sov-data-table-col-selector-dialog.component.scss'],
})
export class SovDataTableColSelectorComponent implements OnInit, OnChanges {
  @Input() tableCols!: TableCol[];
  @Input() settingParams: DialogSettingParams;
  @Output() outputColSelected: EventEmitter<string[]> = new EventEmitter<
    string[]
  >();
  dialogSetting!: BehaviorSubject<DialogSettingParams>;
  seletedCols!: string[];

  constructor() {}

  ngOnInit(): void {
    this.dialogSetting = new BehaviorSubject<DialogSettingParams>({
      title: '',
      visiable: false,
      modal: true,
      maximized: true,
      draggable: false,
      resizeable: true,
      blockScroll: true,
    });
    this.seletedCols = new Array<string>();
  }

  ngOnChanges(): void {
    if (this.dialogSetting) {
      this.dialogSetting.next({
        ...this.dialogSetting.getValue(),
        ...this.settingParams,
      });

      if (this.dialogSetting.getValue().visiable) {
        if (this.seletedCols.length == 0) {
          this.onResetSelectedCols();
        }
      }
    }
  }

  onSelectedColChange(): void {
    this.outputColSelected.emit(this.seletedCols);
  }

  onDialogClosed(): void {
    this.dialogSetting.next({
      ...this.dialogSetting.getValue(),
      ...{ visiable: false },
    });
  }

  onResetSelectedCols(): void {
    this.seletedCols = new Array<string>();
    this.tableCols.forEach((col) => {
      this.seletedCols.push(col.field);
    });
    this.outputColSelected.emit(this.seletedCols);
  }
}
