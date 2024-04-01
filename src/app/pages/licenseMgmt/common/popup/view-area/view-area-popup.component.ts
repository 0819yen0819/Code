import { GetItemEccnResponse } from '../../bean/get-item-eccn-response';
import { Component, EventEmitter, Input, OnDestroy, OnInit, Output } from "@angular/core";
import { TranslateService } from "@ngx-translate/core";
import { LicenseControlApiService } from "src/app/core/services/license-control-api.service";
import { LoaderService } from "src/app/core/services/loader.service";
import { ToastService } from "src/app/core/services/toast.service";
import { UserContextService } from "src/app/core/services/user-context.service";

@Component({
  selector: 'app-view-area-popup',
  templateUrl: './view-area-popup.component.html',
  styleUrls: ['./view-area-popup.component.scss']
})
export class ViewAreaPopupComponent implements OnInit, OnDestroy {

  @Input() visible: boolean;
  @Output() visibleChange = new EventEmitter<boolean>();

  @Input() productCode: string;

  getItemEccnRsp: GetItemEccnResponse = new GetItemEccnResponse();
  colsAreaEccn: any[];
  selectedColsAreaEccn: any[];

  constructor(
    private userContextService: UserContextService,
    private translateService: TranslateService,
    private toastService: ToastService,
    private loaderService: LoaderService,
    private licenseControlApiService: LicenseControlApiService,
  ) {

  }

  ngOnInit(): void {
    this.initColumns();
    this.changeFilterAreaEccn();
  }

  initColumns() {
    this.colsAreaEccn = this.translateService.instant('ImpExpLicenseMtn.AreaEccnColums');

  }

  changeFilterAreaEccn() {
    this.selectedColsAreaEccn = this.colsAreaEccn.filter(x => { return x.isDefault; });
  }

  viewArea() {
    if (this.productCode) {
      this.loaderService.show();
      let model = {
        'tenant': this.userContextService.user$.getValue().tenant,
        'productCode': this.productCode
      };
      this.licenseControlApiService.getItemEccn(model).subscribe({
        next: rsp => {
          this.getItemEccnRsp = rsp;
          this.loaderService.hide()
        },
        error: rsp => {
          console.log(rsp);
          this.loaderService.hide()
          this.toastService.error('System.Message.Error');
        }
      });
    }
  }

  closeArea() {
    this.visible = false;
    this.visibleChange.emit(this.visible);
  }

  ngOnDestroy(): void {

  }
}