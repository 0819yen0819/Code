import { Injectable } from '@angular/core';
import { SelectItem } from 'primeng/api';
import { Observable } from 'rxjs';
import { SpecialImportLicenseInfo } from 'src/app/core/model/special_import_license_info';
import { UserContextService } from 'src/app/core/services/user-context.service';
import { DtViewerDropdownProcessService } from './dt-viewer-dp-process.service';

@Injectable({
  providedIn: 'root',
})
export class DtViewerDropdownInitService {
  constructor(
    private dtViewerDropdownProcessService: DtViewerDropdownProcessService,
    private userContextService: UserContextService
  ) {}

  onTableDropdownOptionsInit(tag: string, dataInfo: any): Observable<any> {
    let obs: Observable<any>;
    switch (tag) {
      case 'sc-item-pick-by-ref':
        obs = this.getSCItemIMPLicense(dataInfo.orgId, dataInfo.part_no);
        break;

      default:
        break;
    }

    return obs;
  }

  private getSCItemIMPLicense(
    ouCode: string,
    productCode: string
  ): Observable<SelectItem<SpecialImportLicenseInfo>[]> {
    return this.dtViewerDropdownProcessService.onQuerySpecialImportLicense({
      tenant: this.userContextService.user$.getValue().tenant,
      ouCode: ouCode,
      productCode: productCode,
      action: 'formQuery',
      active: 'Y',
    });
  }
}
