import { Injectable } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { TranslateService } from '@ngx-translate/core';
import { TableCol } from 'src/app/core/model/data-table-cols';
import { DataTableSettings } from './../../../../../../core/model/data-table-view';

@Injectable({
  providedIn: 'root',
})
export class AddSc047V2ItemByRefInitService {
  constructor(
    private formBuilder: FormBuilder,
    private translateService: TranslateService
  ) {}

  onInitForm(): FormGroup {
    const formGroup = this.formBuilder.group({
      keyword: ['', [Validators.required]],
    });

    return formGroup;
  }

  onInitTableCols(): TableCol[] {
    const itemCols: TableCol[] = [
      {
        field: 'trx_no',
        label: 'Ref Shipment#',
      },
      {
        field: 'org_id',
        label: 'OU',
        isFittedCol: true,
      },
      {
        field: 'part_no',
        label: 'ITEM',
      },
      {
        field: 'eccn1',
        label: 'ECCN',
      },
      {
        field: 'ccats',
        label: 'CCATs',
      },
      {
        field: 'target_no',
        label: 'Customer/Vendor',
      },
      {
        field: 'ship_qty',
        label: 'SHIP_QTY',
      },
      {
        field: 'license',
        label: 'Import License No.',
        useTemplateType: 'dropdown',
      },
      {
        field: 'quantity',
        label: 'Applied QTY',
        useTemplateType: 'input',
      },
    ];

    return itemCols;
  }

  onInitDataTableSettings(): DataTableSettings {
    const dataTableSettings = new DataTableSettings();
    dataTableSettings.isFuzzySearchMode = true;
    dataTableSettings.isSelectMode = true;
    dataTableSettings.templateBelongTo='sc-item-pick-by-ref'
    dataTableSettings.noDataConText = this.translateService.instant(
      'LicenseMgmt.Common.Hint.NoResult'
    );

    return dataTableSettings;
  }
}
