import { LicenseHistoryResponse } from '../../bean/license-history-response';
import { Component, EventEmitter, Input, OnDestroy, OnInit, Output } from "@angular/core";
import { TranslateService } from "@ngx-translate/core";
import { LicenseControlApiService } from "src/app/core/services/license-control-api.service";
import { LoaderService } from "src/app/core/services/loader.service";
import { ToastService } from "src/app/core/services/toast.service";
import { UserContextService } from 'src/app/core/services/user-context.service';

@Component({
  selector: 'app-view-history-popup',
  templateUrl: './view-history-popup.component.html',
  styleUrls: ['./view-history-popup.component.scss']
})
export class ViewHistoryPopupComponent implements OnInit, OnDestroy {

  @Input() visible: boolean;
  @Output() visibleChange = new EventEmitter<boolean>();

  @Input() queryParam: any;

  colsHistory: any[];
  selectedColsHistory: any[];
  licenseHistoryRsp: LicenseHistoryResponse = new LicenseHistoryResponse();

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
    this.changeFilterHistory();
  }

  initColumns() {
    this.colsHistory = this.translateService.instant('ImpExpLicenseMtn.HistoryColums');
  }

  changeFilterHistory() {
    this.selectedColsHistory = this.colsHistory.filter(x => { return x.isDefault; });
  }

  viewHistory() {
    //# BI-31169-TK-31171
    //# add formNo key ( only SC047 )
    let model = {};
    if (this.queryParam.licenseType === 'SC047') {
      model = {
        tenant: this.userContextService.user$.getValue().tenant,
        licenseType: this.queryParam.licenseType,
        licenseNo: this.queryParam.licenseNo,
        ouCode:
          this.queryParam.ouCode.toUpperCase() === 'ALL'
            ? '0'
            : this.queryParam.ouCode,
        ouGroup:
          this.queryParam.ouGroup.toUpperCase() === 'ALL'
            ? '0'
            : this.queryParam.ouGroup,
        vcNo: this.queryParam.vcNo,
        productCode: this.queryParam.productCode,
        formNo: this.queryParam.formNo,
      };
    } else {
      model = {
        tenant: this.userContextService.user$.getValue().tenant,
        licenseType: this.queryParam.licenseType,
        licenseNo: this.queryParam.licenseNo,
        ouCode:
          this.queryParam.ouCode.toUpperCase() === 'ALL'
            ? '0'
            : this.queryParam.ouCode,
        ouGroup:
          this.queryParam.ouGroup.toUpperCase() === 'ALL'
            ? '0'
            : this.queryParam.ouGroup,
        vcNo: this.queryParam.vcNo,
        productCode: this.queryParam.productCode,
      };
    }
    this.loaderService.show();
    this.licenseControlApiService.queryLicenseHistory(model).subscribe({
      next: rsp => {
        this.licenseHistoryRsp = rsp;
        this.loaderService.hide()
      },
      error: rsp => {
        console.log(rsp);
        this.loaderService.hide()
        this.toastService.error('System.Message.Error');
      }
    });
  }

  closeHistory() {
    this.visible = false;
    this.visibleChange.emit(this.visible);
  }

  ngOnDestroy(): void {

  }
}
