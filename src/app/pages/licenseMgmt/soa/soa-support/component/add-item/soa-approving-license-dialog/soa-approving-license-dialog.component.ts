import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-soa-approving-license-dialog',
  templateUrl: './soa-approving-license-dialog.component.html',
  styleUrls: ['./soa-approving-license-dialog.component.scss']
})
export class SoaApprovingLicenseDialogComponent implements OnInit {
  @Input() showDialog = false;
  @Input() inputData;
  @Output() closeDialog = new EventEmitter<any>();

  private onLangChange$: Subscription;
  inputColumns = this.translateService.instant('SOA.ApprovingLicense.Table');

  constructor(private translateService: TranslateService) { }

  ngOnInit(): void {
    this.onLangChange$ = this.translateService.onLangChange.subscribe(() => { 
      this.inputColumns = this.translateService.instant('SOA.ApprovingLicense.Table'); 
    });
  }

  ngOnDestroy(): void {
    [this.onLangChange$].forEach(
      (subscription: Subscription) => {
        if (subscription != null || subscription != undefined)
          subscription.unsubscribe();
      }
    );
  }

  close() {
    this.closeDialog.emit();
  }

}
