import { Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-bafa-detail-dialog',
  templateUrl: './bafa-detail-dialog.component.html',
  styleUrls: ['./bafa-detail-dialog.component.scss']
})
export class BafaDetailDialogComponent implements OnInit, OnChanges {
  @Input() data: any;
  @Input() visible: boolean;
  @Output() visibleChange = new EventEmitter<boolean>();

  exportLicenseData: any = [];
  importLicenseData: any = [];

  exportColumns = null;
  importColumns = null;

  constructor(
    private translateService: TranslateService
  ) { }

  ngOnInit(): void {
    this.initColumns();
  }

  initColumns() {
    this.exportColumns = this.translateService.instant('BafaLicenseMtn.ExportHistoryColumns');
    this.importColumns = this.translateService.instant('BafaLicenseMtn.ImportHistoryColumns');
  }

  closeHistory() {
    this.visible = false;
    this.visibleChange.emit(this.visible);
  }

  ngOnChanges(changes: SimpleChanges): void {
    this.initColumns()

    this.importLicenseData = [];
    this.exportLicenseData = [];

    if (this.visible) {
      this.data.data.forEach(element => {
        element.ieType === 'I' ? this.importLicenseData.push(element) : this.exportLicenseData.push(element);
      });
    }
  }

}
