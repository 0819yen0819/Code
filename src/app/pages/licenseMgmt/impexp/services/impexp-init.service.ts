import { Injectable } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { SelectItem } from 'primeng/api';
import { LicenseFormStatusEnum } from 'src/app/core/enums/license-form-status';
import { FormTypeEnum } from 'src/app/core/enums/license-name';
import { TableCol } from '../../../../core/model/data-table-cols';
import {
  DataTableParams,
  DataTableSettings,
} from './../../../../core/model/data-table-view';

@Injectable({
  providedIn: 'root',
})
export class ImpexpInitService {
  constructor(
    private formBuilder: FormBuilder,
    private translateService: TranslateService,
    private router: Router
  ) {}

  //> 初始化表單
  onInitForm(): FormGroup {
    const formGroup = this.formBuilder.group({
      oOuCode: [null],
      oOuName: [null],
      ouCode: [null],
      ouName: [null],
      shipmentType: [null],
      country: [null],
      vcType: [null],
      vcCode: [null],
      vcName: [null],
      shipToId: [null],
      shipToCode: [null],
      shipToAddress: [null],
      shipToAddressE: [null],
      deliverToId: [null],
      deliverToCode: [null],
      deliverToAddress: [null],
      deliverToAddressE: [null],
      siteUseId: [null],
      endUse: [null],
      endUserCode: [null],
      endUser: [null],
      endUserAddress: [null],
      consigneeKit: [null],
      consignee: [null],
      consigneeAddress: [null],
      comment: [null],
    });

    return formGroup;
  }

  //> 初始化用戶類別選項
  onInitUserTypeOptions(): SelectItem<string>[] {
    const userTypeOption = [
      {
        label: 'Customer',
        value: 'C',
      },
      {
        label: 'Vendor',
        value: 'V',
      },
    ];

    return userTypeOption;
  }

  onInitFormPalceHolder(formType: string, form: FormGroup): [string, string] {
    let shipToCodePlaceholder = '';
    let deliverToCodePlaceholder = '';
    if (formType === FormTypeEnum.LICENSE_IMP) {
      if (!form.get('ouCode').value || !form.get('vcCode').value) {
        shipToCodePlaceholder = this.translateService.instant(
          'LicenseMgmt.IMPEXP.PlaceHolder.PlzSelectOOUAndCVIMP'
        );
        deliverToCodePlaceholder = this.translateService.instant(
          'LicenseMgmt.IMPEXP.PlaceHolder.PlzSelectOOUAndCVIMP'
        );
      } else {
        shipToCodePlaceholder = `${this.translateService.instant(
          'Input.PlaceHolder.PleaseSelect'
        )} Ship To Code`;
        deliverToCodePlaceholder = `${this.translateService.instant(
          'Input.PlaceHolder.PleaseSelect'
        )} Deliver To Code`;
      }
    } else {
      if (!form.get('oOuCode').value || !form.get('vcCode').value) {
        shipToCodePlaceholder = this.translateService.instant(
          'LicenseMgmt.IMPEXP.PlaceHolder.PlzSelectOOUAndCVEXP'
        );

        deliverToCodePlaceholder = this.translateService.instant(
          'LicenseMgmt.IMPEXP.PlaceHolder.PlzSelectOOUAndCVEXP'
        );
      } else {
        shipToCodePlaceholder = `${this.translateService.instant(
          'Input.PlaceHolder.PleaseSelect'
        )} Ship To Code`;
        deliverToCodePlaceholder = `${this.translateService.instant(
          'Input.PlaceHolder.PleaseSelect'
        )} Deliver To Code`;
      }
    }

    return [shipToCodePlaceholder, deliverToCodePlaceholder];
  }

  onInitShippingTypeOptions(): any[] {
    const expTypeOptions: any[] = [
      {
        label: `${this.translateService.instant(
          'DropDown.PlaceHolder.PleaseChoose'
        )} ${this.translateService.instant(
          'LicenseMgmt.IMPEXP.Label.Shipping_Type'
        )}`,
        value: null,
      },
      {
        label: `${this.translateService.instant(
          'LicenseMgmt.IMPEXP.Option.AJB_Shipping'
        )}`,
        value: 'AJB',
      },
      {
        label: `${this.translateService.instant(
          'LicenseMgmt.IMPEXP.Option.General_Shipping'
        )}`,
        value: 'Normal',
      },
    ];

    return expTypeOptions;
  }

  //> init item table settings
  onInitTableSettings(
    formStatus: string,
    isTaskStarter: boolean,
    isWarehouseMember: boolean
  ): DataTableParams {
    const dataTableSettings = new DataTableSettings();

    dataTableSettings.isShowNoDataInfo = true;
    dataTableSettings.isScrollable = true;
    dataTableSettings.isFuzzySearchMode = true;
    dataTableSettings.isColSelectorMode = true;
    dataTableSettings.isSortMode = true;

    if (formStatus == LicenseFormStatusEnum.DRAFT || isTaskStarter) {
      dataTableSettings.isDeleteMode = true;
      dataTableSettings.isEditedMode = true;
      dataTableSettings.noDataConText = this.translateService.instant(
        'LicenseMgmt.Common.Hint.AddProductFirst'
      );
    } else if (isWarehouseMember && this.router.url.includes('approving')) {
      //> 倉管者關閉Table刪除功能
      dataTableSettings.isEditedMode = true;
      dataTableSettings.noDataConText = this.translateService.instant(
        'LicenseMgmt.Common.Hint.NoResult'
      );
    } else {
      //> 非倉管者關閉Table編輯功能
      dataTableSettings.noDataConText = this.translateService.instant(
        'LicenseMgmt.Common.Hint.NoResult'
      );
    }

    return dataTableSettings;
  }

  //> init common table view col event
  onInitItemTableCol(formType: string): TableCol[] {
    const tableCols = new Array<TableCol>();

    let transCols = {};

    let defaultCol = new Array<string>();

    if (formType === FormTypeEnum.LICENSE_IMP) {
      transCols = this.translateService.instant('LicenseMgmt.IMPEXP.Cols.IMP');
      defaultCol = [
        'key',
        'productCode',
        'quantity',
        'price',
        'eccn',
        'ccats',
        'specialLabel',
        'shipFrom',
        'remark',
        'license',
        'licenseQty',
        'bafaLicense',
        'bafaBalQty',
        'bafaTotalQty',
        'startDate',
        'endDate',
      ];
    } else {
      transCols = this.translateService.instant('LicenseMgmt.IMPEXP.Cols.EXP');
      defaultCol = [
        'key',
        'productCode',
        'quantity',
        'price',
        'eccn',
        'ccats',
        'remark',
        'deliveryNo',
        'refShipment',
        'license',
        'licenseQty',
        'bafaLicense',
        'bafaBalQty',
        'bafaTotalQty',
        'startDate',
        'endDate',
      ];
    }

    for (const col of defaultCol) {
      tableCols.push(
        col === 'key'
          ? {
              label: transCols[col],
              field: col,
              isFittedCol: true,
            }
          : {
              label: transCols[col],
              field: col,
            }
      );
    }

    return tableCols;
  }
}
