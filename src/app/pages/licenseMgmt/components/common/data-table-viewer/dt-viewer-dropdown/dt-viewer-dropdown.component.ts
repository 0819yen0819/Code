import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { SelectItem } from 'primeng/api';
import { DtViewerDropdownInitService } from './services/dt-viewer-dp-init.service';

@Component({
  selector: 'app-dt-viewer-dropdown',
  templateUrl: './dt-viewer-dropdown.component.html',
  styleUrls: ['./dt-viewer-dropdown.component.scss'],
})
export class DtViewerDropdownComponent implements OnInit {
  //# 使用該 Table 的 Component's Tag
  @Input() tag: string;
  //# 輔助查詢資料的 Data，通常來源至原始 Component
  @Input() supportData: any;
  //# Table Target Row Data
  @Input() data: any;
  @Output() outputValue: EventEmitter<any> = new EventEmitter<any>();

  value!: any;
  options!: SelectItem<any>[];
  isEmpty!: boolean;

  constructor(
    private dtViewerDropdownInitService: DtViewerDropdownInitService,
    private translateService: TranslateService
  ) {}

  ngOnInit(): void {
    this.value = null;
    this.isEmpty = false;

    //> 根據 Tag，進入不同流程
    switch (this.tag) {
      case 'sc-item-pick-by-ref':
        this.dtViewerDropdownInitService
          .onTableDropdownOptionsInit(this.tag, {
            ...this.supportData,
            ...this.data,
          })
          .subscribe((res) => {
            this.generateOptions(res);
          });
        break;

      default:
        break;
    }
  }

  onSelectedChange(): void {
    //> 根據 Tag，Output 資料
    switch (this.tag) {
      case 'sc-item-pick-by-ref':
        this.outputValue.emit(this.value);
        break;
      default:
        break;
    }
  }
  /**
   * 根據傳入資料進行 options list 製造
   *
   * @private
   * @param {SelectItem<any>[]} options
   * @memberof DtViewerDropdownComponent
   */
  private generateOptions(options: SelectItem<any>[]): void {
    this.options = options;

    if (this.options.length === 0) {
      this.isEmpty = true;
      this.options = [
        ...[
          {
            label: `${this.translateService.instant(
              'DropDown.PlaceHolder.NoData'
            )}`,
            value: null,
          },
        ],
      ];
    } else if (this.options.length === 1) {
      this.value = this.options[0];
    } else {
      this.options = [
        ...[
          {
            label: `${this.translateService.instant(
              'DropDown.PlaceHolder.PleaseChoose'
            )}`,
            value: null,
          },
          ...this.options,
        ],
      ];
      this.value = null;
    }
  }
}
