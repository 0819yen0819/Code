import { Injectable } from '@angular/core';
import { SelectItem } from 'primeng/api';
import { Observable, takeLast } from 'rxjs';
import { SpecialImportLicenseInfo } from 'src/app/core/model/special_import_license_info';
import { LicenseControlApiService } from 'src/app/core/services/license-control-api.service';

@Injectable({
  providedIn: 'root',
})
export class AmSc047ItemProcessService {
  constructor(private licenseControlApiService: LicenseControlApiService) {}

  onQuerySpecialImportLicense(model: {
    tenant: string;
    ouCode: string;
    productCode: string;
    action: string;
    active: string;
  }): Observable<SelectItem<SpecialImportLicenseInfo>[]> {
    const getFuzzyQuerySpecialImportLicenseList$ = (model: {
      tenant: string;
      ouCode: string;
      productCode: string;
      action: string;
      active: string;
    }): Observable<SelectItem<SpecialImportLicenseInfo>[]> =>
      new Observable<SelectItem<SpecialImportLicenseInfo>[]>((obs) => {
        this.licenseControlApiService
          .querySpecialImportLicense(model)
          .pipe(takeLast(1))
          .subscribe({
            next: (res) => {
              const result = new Array<SelectItem<SpecialImportLicenseInfo>>();
              for (const data of res.datas) {
                result.push({
                  label: data.descript,
                  value: data,
                });
              }
              obs.next(result);
              obs.complete();
            },
            error: (err) => {
              console.error(err);
              obs.next([]);
              obs.complete();
            },
          });
      });

    return getFuzzyQuerySpecialImportLicenseList$(model);
  }
}
