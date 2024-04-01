import { Injectable } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { SelectItem } from 'primeng/api';
import { Observable, take } from 'rxjs';
import { LicenseFormStatusEnum } from 'src/app/core/enums/license-form-status';
import { SelectorItemType } from 'src/app/core/enums/selector-item-type';
import { ConsigneeInfo } from 'src/app/core/model/consignee-info';
import { TableCol } from 'src/app/core/model/data-table-cols';
import { CommonApiService } from 'src/app/core/services/common-api.service';
import { LicenseControlApiService } from 'src/app/core/services/license-control-api.service';
import { UserContextService } from 'src/app/core/services/user-context.service';
import { CurFormStatusService } from 'src/app/pages/licenseMgmt/services/cur-form-status.service';
import { DataTableSettings } from '../../../../core/model/data-table-view';
import { ObjectFormatService } from './../../../../core/services/object-format.service';

@Injectable({
  providedIn: 'root',
})
export class Sc047V2InitService {
  constructor(
    private formBuilder: FormBuilder,
    private translateService: TranslateService,
    private userContextService: UserContextService,
    private licenseControlApiService: LicenseControlApiService,
    private commonApiService: CommonApiService,
    private curFormStatusService: CurFormStatusService,
    private router: Router,
    private objectFormatService: ObjectFormatService
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
      endUse: [null],
      registerNumber: [null],
      consigneeKit: [null],
      consignee: [null],
      consigneeAddress: [null],
      comment: [null],
    });

    formGroup.get('vcType').setValue('C');

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

  //> 初始化出貨型態
  onInitShipmentTypeOptions(): SelectItem<string>[] {
    const shipmentTypeOption = [
      {
        label: `${this.translateService.instant(
          'DropDown.PlaceHolder.PleaseChoose'
        )} ${this.translateService.instant(
          'LicenseMgmt.SC047.Label.Shipping_Type'
        )}`,
        value: null,
      },
      {
        label: `${this.translateService.instant(
          'LicenseMgmt.SC047.Option.AJB_Shipping'
        )}`,
        value: 'AJB',
      },
      {
        label: `${this.translateService.instant(
          'LicenseMgmt.SC047.Option.General_Shipping'
        )}`,
        value: 'Normal',
      },
    ];

    return shipmentTypeOption;
  }

  //> 初始化表單 placeholder
  onInitFormPlaceholder(form: FormGroup): {
    shipToCode: string;
    deliverToCode: string;
  } {
    if (!form.get('oOuCode').value || !form.get('vcCode').value) {
      return {
        shipToCode: this.translateService.instant(
          'LicenseMgmt.SC047.PlaceHolder.PlzSelectOUAndCV'
        ),
        deliverToCode: this.translateService.instant(
          'LicenseMgmt.SC047.PlaceHolder.PlzSelectOUAndCV'
        ),
      };
    } else {
      return {
        shipToCode: `${this.translateService.instant(
          'Input.PlaceHolder.PleaseSelect'
        )} Ship To Code`,
        deliverToCode: `${this.translateService.instant(
          'Input.PlaceHolder.PleaseSelect'
        )} Deliver To Code`,
      };
    }
  }

  //> 初始化 篩選器 dialog title
  onInitSelectorTitle(type: string): string {
    let title = '';
    if (type === SelectorItemType.OOU) {
      title = `${this.translateService.instant(
        'Input.PlaceHolder.Choose'
      )} ${this.translateService.instant(
        'LicenseMgmt.SC047.Label.Purchasing_Orders_OU'
      )}`;
    } else if (type === SelectorItemType.OU) {
      title = `${this.translateService.instant(
        'Input.PlaceHolder.Choose'
      )} ${this.translateService.instant(
        'LicenseMgmt.SC047.Label.Receiving_Shipping_OU'
      )}`;
    } else if (type === SelectorItemType.END_USER) {
      title = `${this.translateService.instant(
        'Input.PlaceHolder.Choose'
      )} End User`;
    } else if (type === SelectorItemType.CUS_ADDRESS_QUERY_ADDRESS) {
      title = `${this.translateService.instant(
        'Input.PlaceHolder.Choose'
      )} Deliver To Code`;
    } else if (type === SelectorItemType.CUS_ADDRESS_QUERY_SHIP) {
      title = `${this.translateService.instant(
        'Input.PlaceHolder.Choose'
      )} Ship To Code`;
    } else if (type === SelectorItemType.SPECIAL_IMPORT_LICENSE) {
      title = `${this.translateService.instant(
        'Input.PlaceHolder.Choose'
      )} Import License Number`;
    } else if (type === SelectorItemType.CUSTOMER) {
      title = `${this.translateService.instant(
        'Input.PlaceHolder.Choose'
      )} Custormer`;
    } else if (type === SelectorItemType.VENDOR) {
      title = `${this.translateService.instant(
        'Input.PlaceHolder.Choose'
      )} Vendor`;
    }

    return title;
  }

  //> init Consignee
  onInitHKConsigneeList(
    form: FormGroup
  ): Observable<SelectItem<ConsigneeInfo>[]> {
    const getHKConsigneeList$ = (
      form: FormGroup
    ): Observable<SelectItem<ConsigneeInfo>[]> =>
      new Observable<SelectItem<ConsigneeInfo>[]>((obs) => {
        this.licenseControlApiService
          .getConsigneeByOuCode(form.get('ouCode').value)
          .pipe(take(1))
          .subscribe({
            next: (res) => {
              const hkConsigneeOptions = new Array<SelectItem<ConsigneeInfo>>();
              for (const data of res.consigneeDatas) {
                hkConsigneeOptions.push({
                  label: data.consignee,
                  value: data,
                });
              }
              obs.next(hkConsigneeOptions);
              obs.complete();
            },
            error: (err) => {
              console.error(err);
              obs.next([]);
              obs.complete();
            },
          });
      });

    return getHKConsigneeList$(form);
  }

  //> init warehouse
  onInitWareHouseOptions(
    curFormStatus: any,
    isTaskStarter: boolean
  ): Observable<SelectItem<string>[]> {
    const getIELicenseRules$ = (model: any): Observable<SelectItem<string>[]> =>
      new Observable<SelectItem<string>[]>((obs) => {
        this.commonApiService
          .queryRuleSetup(model)
          .pipe(take(1))
          .subscribe({
            next: (res) => {
              const warehouseList = res.ruleList.map((rule) => {
                if (this.translateService.currentLang == 'zh-tw') {
                  rule.label = rule.rulesCategoryRuleItemCn;
                  rule.value = rule.ruleCode;
                } else {
                  rule.label = rule.rulesCategoryRuleItemEn;
                  rule.value = rule.ruleCode;
                }

                for (const key of Object.keys(rule)) {
                  if (key !== 'label' && key !== 'value') {
                    delete rule[key];
                  }
                }
                return rule;
              });

              obs.next(warehouseList);
              obs.complete();
            },
            error: (err) => {
              console.error(err);
              obs.next([]);
              obs.complete();
            },
          });
      });

    return getIELicenseRules$(
      this.objectFormatService.ObjectClean({
        tenant: this.userContextService.user$.getValue().tenant,
        msgFrom: 'SC047Form',
        trackingId: 'SCLicense',
        tenantPermissionList: [this.userContextService.user$.getValue().tenant],
        ruleId: 'SCLicense',
        flag:
          (!this.router.url.includes('approving') &&
            curFormStatus.status === LicenseFormStatusEnum.DRAFT) ||
          isTaskStarter
            ? 'Y'
            : null,
      })
    );
  }

  //> init data table settings
  onInitTableSettings(
    userRole: {
      taskStarter: boolean;
      warehouseMember: boolean;
    } = {
      taskStarter: true,
      warehouseMember: false,
    }
  ): DataTableSettings {
    const tableSettings = new DataTableSettings();

    //> init common table view settings
    tableSettings.isShowNoDataInfo = true;
    tableSettings.isScrollable = true;
    tableSettings.isFuzzySearchMode = true;
    tableSettings.isColSelectorMode = true;
    tableSettings.isSortMode = true;

    if (
      this.curFormStatusService.currentFormStatus.getValue().status ===
        LicenseFormStatusEnum.DRAFT ||
      userRole.taskStarter
    ) {
      //> 起單者
      //> 草稿單
      tableSettings.isDeleteMode = true;
      tableSettings.isEditedMode = true;
      tableSettings.noDataConText = this.translateService.instant(
        'LicenseMgmt.Common.Hint.AddProductFirst'
      );
    } else if (
      this.router.url.includes('approving') &&
      userRole.warehouseMember
    ) {
      //> 倉管者關閉Table刪除功能
      tableSettings.isEditedMode = true;
      tableSettings.noDataConText = this.translateService.instant(
        'LicenseMgmt.Common.Hint.NoResult'
      );
    } else {
      //> 非倉管者關閉Table編輯功能
      tableSettings.noDataConText = this.translateService.instant(
        'LicenseMgmt.Common.Hint.NoResult'
      );
    }

    return tableSettings;
  }

  //> init data table cols
  onInitTableCols(): TableCol[] {
    const tableCols = new Array<TableCol>();

    let transCols = this.translateService.instant('LicenseMgmt.SC047.Cols');
    let defaultCol = [
      'key',
      'productCode',
      'ccats',
      'license',
      'quantity',
      'refShipment',
      'receipt',
      'remark',
    ];

    for (const col of defaultCol) {
      tableCols.push({
        label: transCols[col],
        field: col,
      });
    }

    return tableCols;
  }
}
