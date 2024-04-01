import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { ConfirmationService as NGConfirmationService } from 'primeng/api';

@Component({
  selector: 'app-soc-withdraw',
  templateUrl: './soc-withdraw.component.html',
  styleUrls: ['./soc-withdraw.component.scss']
})
export class SocWithdrawComponent implements OnInit {
  @Input() dialogOpen: boolean;
  @Output() dialogClose = new EventEmitter<any>();
  @Output() dialogSubmit = new EventEmitter<any>();
  
  comment:string = '';

  constructor(
    private ngConfirmationService: NGConfirmationService,
    private translateService: TranslateService
  ) { }

  ngOnInit(): void {
  }

  onFormSubmit(): void {
    // 打開確認送出dialog
    this.ngConfirmationService.confirm({
      message: this.translateService.instant('LicenseMgmt.Common.Hint.QSubmit'),
      header: 'Confirm',
      icon: 'pi pi-exclamation-triangle',
      accept: () => { 
        this.dialogSubmit.emit(this.comment);
      }
    });
  }

  /**
   * p-dialog close 機制 patch function
   */
  close() {
    this.dialogClose.emit();
  }
  
  
}
