import { filter } from 'rxjs/operators';
import { MyFlowService } from 'src/app/core/services/my-flow.service';
import { Injectable } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { TranslateService } from '@ngx-translate/core';
import { SelectItem } from 'primeng/api';
import { finalize, lastValueFrom, Observable, take, takeLast } from 'rxjs';
import { FormTypeEnum } from 'src/app/core/enums/license-name';
import { SelectorItemType } from 'src/app/core/enums/selector-item-type';
import { ERPEXPDOInfo } from 'src/app/core/model/exp-ref-info';
import { ExpLicenseItemInfo } from 'src/app/core/model/item-info';
import { LicenseControlApiService } from 'src/app/core/services/license-control-api.service';
import { ObjectFormatService } from 'src/app/core/services/object-format.service';
import { UserContextService } from 'src/app/core/services/user-context.service';

@Injectable({
  providedIn: 'root',
})
export class ImpexpProcessService {
  constructor(
    private licenseControlApiService: LicenseControlApiService,
    private userContextService: UserContextService,
    private translateService: TranslateService,
    private objectFormatService: ObjectFormatService,
    private myFlowService: MyFlowService
  ) {}

  getEXPDOAPIParamsFromERP$ = (): Observable<any> =>
    new Observable<any>((obs) => {
      this.licenseControlApiService
        .licenseRule(this.userContextService.user$.getValue().tenant)
        .pipe(takeLast(1))
        .subscribe(
          (res: {
            licenseRules: {
              ruleDesc: string;
              ruleId: string;
              ruleType: string;
              ruleVal: string;
              tenant: string;
            }[];
          }) => {
            obs.next({
              key: res.licenseRules.filter(
                (data) => data.ruleId === 'LICENSE-EXPORT-REFSHIPMENT-KEY'
              )[0].ruleVal,
              url: res.licenseRules.filter(
                (data) => data.ruleId === 'LICENSE-EXPORT-REFSHIPMENT-URL'
              )[0].ruleVal,
            });
            obs.complete();
          }
        );
    });

  expDOList$ = (
    apiParams: {
      key: string;
      url: string;
    },
    model: {
      trxNo: string;
      address: string;
      orgId: string;
      targetNo: string;
      vctype: string;
      deliverTo?: string;
    }
  ): Observable<ERPEXPDOInfo[]> =>
    new Observable<ERPEXPDOInfo[]>((obs) => {
      this.licenseControlApiService
        .getEXPDOListFromERP(apiParams, model)
        .pipe(takeLast(1))
        .subscribe({
          next: (res: { xxomLicenseShipment: ERPEXPDOInfo[] | null }) => {
            if (res.xxomLicenseShipment === null) {
              obs.next([]);
            } else {
              obs.next(res.xxomLicenseShipment);
            }
            obs.complete();
          },
          error: (err) => {
            console.error(err);
            obs.next([]);
            obs.complete();
          },
        });
    });

  async onIMPFormChecker(
    formNo: string,
    formTypeId: string,
    form: FormGroup,
    itemList: any[],
    isCheckItem: boolean = false
  ): Promise<string[]> {
    let noticeContentList = new Array<string>();
    if (!form.get('oOuCode').value) {
      noticeContentList.push(
        `${this.translateService.instant(
          'Input.PlaceHolder.PleaseSelect'
        )} ${this.translateService.instant(
          'LicenseMgmt.IMPEXP.Label.Receiving_Shipping_OU_IMP'
        )}`
      );
    }

    if (!form.get('ouCode').value) {
      noticeContentList.push(
        `${this.translateService.instant(
          'Input.PlaceHolder.PleaseSelect'
        )} ${this.translateService.instant(
          'LicenseMgmt.IMPEXP.Label.Receiving_Shipping_Inventory_OU_IMP'
        )}`
      );
    }

    if (!form.get('country').value) {
      noticeContentList.push(
        `${this.translateService.instant(
          'Input.PlaceHolder.PleaseSelect'
        )} ${this.translateService.instant(
          'LicenseMgmt.IMPEXP.Label.Warehouse_Location'
        )}`
      );
    }

    if (!form.get('vcCode').value) {
      noticeContentList.push(
        `${this.translateService.instant(
          'Input.PlaceHolder.PleaseSelect'
        )} ${this.translateService.instant('LicenseMgmt.IMPEXP.Label.CV')}`
      );
    }

    if (form.get('comment').value && form.get('comment').value.length > 250) {
      noticeContentList.push(
        this.translateService.instant('LicenseMgmt.Common.Hint.OpinionUpto250')
      );
    }

    if (
      form.get('endUse').value &&
      !new RegExp(
        '^[A-Za-z0-9 ]+$',
        'gm'
      ).test(form.get('endUse').value)
    ) {
      noticeContentList.push(
        `${this.translateService.instant(
          'LicenseMgmt.IMPEXP.Hint.EndUseAllowNumAndEng'
        )}`
      );
    }

    if (itemList.length == 0) {
      noticeContentList.push(
        `${this.translateService.instant(
          'Input.PlaceHolder.PleaseSelect'
        )} Item`
      );
    }

    if (form.get('country').value === 'HK' && itemList.length > 0) {
      for (const item of itemList) {
        if (!item.price || (item.price && item.price.toString().length === 0)) {
          // noticeContentList.push(
          //   `${this.translateService.instant(
          //     'LicenseMgmt.IMPEXP.Hint.WarehouseHKPriceRequired'
          //   )}`
          // );
          // break;
          if (item.productCode) {
            noticeContentList.push(
              `Item：${item.productCode} ${this.translateService.instant(
                'LicenseMgmt.Common.Hint.NotKeyIn'
              )} Price (USD)`
            );
          } else {
            noticeContentList.push(
              `CCATs：${item.ccats} ${this.translateService.instant(
                'LicenseMgmt.Common.Hint.NotKeyIn'
              )} Price (USD)`
            );
          }
        }
      }
    }

    if (isCheckItem) {
      noticeContentList = [
        ...noticeContentList,
        ...this.onVerifyItemProcess(itemList),
      ];
    }

    const attachedFileNum = await lastValueFrom(
      this.getTargetFormAttacheds(formNo, formTypeId)
    );

    if (
      form.get('country').value === 'HK' &&
      attachedFileNum === 0 &&
      itemList.filter((x) => x.productCode).map((x) => x.productCode).length > 0
    ) {
      const noRecordResult = await lastValueFrom(
        this.checkLicenseMasterViewRecord('IMPORT', itemList)
      );
      for (const result of noRecordResult.results) {
        if (result.hasRecord === 'N') {
          noticeContentList.push(
            `Item：${result.productCode} ${this.translateService.instant(
              'LicenseMgmt.IMPEXP.Hint.ItemNoRecord'
            )}`
          );
        }
      }
    }

    return noticeContentList;
  }

  async onEXPFormChecker(
    formNo: string,
    formTypeId: string,
    form: FormGroup,
    itemList: any[],
    isCheckItem: boolean = false
  ): Promise<string[]> {
    let noticeContentList = new Array<string>();

    if (!form.get('oOuCode').value) {
      noticeContentList.push(
        `${this.translateService.instant(
          'Input.PlaceHolder.PleaseSelect'
        )} ${this.translateService.instant(
          'LicenseMgmt.IMPEXP.Label.Receiving_Shipping_OU_EXP'
        )}`
      );
    }

    if (!form.get('shipmentType').value) {
      noticeContentList.push(
        `${this.translateService.instant(
          'Input.PlaceHolder.PleaseSelect'
        )} ${this.translateService.instant(
          'LicenseMgmt.IMPEXP.Label.Shipping_Type'
        )}`
      );
    }

    if (!form.get('ouCode').value) {
      noticeContentList.push(
        `${this.translateService.instant(
          'Input.PlaceHolder.PleaseSelect'
        )} ${this.translateService.instant(
          'LicenseMgmt.IMPEXP.Label.Receiving_Shipping_Inventory_OU_EXP'
        )}`
      );
    }

    if (!form.get('country').value) {
      noticeContentList.push(
        `${this.translateService.instant(
          'Input.PlaceHolder.PleaseSelect'
        )} ${this.translateService.instant(
          'LicenseMgmt.IMPEXP.Label.Warehouse_Location'
        )}`
      );
    }

    if (!form.get('vcCode').value) {
      noticeContentList.push(
        `${this.translateService.instant(
          'Input.PlaceHolder.PleaseSelect'
        )} ${this.translateService.instant('LicenseMgmt.IMPEXP.Label.CV')}`
      );
    }

    if (!form.get('shipToAddress').value) {
      noticeContentList.push(
        `${this.translateService.instant(
          'Input.PlaceHolder.PleaseEnter'
        )} Ship To Address`
      );
    }

    if (!form.get('shipToAddressE').value) {
      noticeContentList.push(
        `${this.translateService.instant(
          'Input.PlaceHolder.PleaseEnter'
        )} Ship To Address (English)`
      );
    }

    if (
      (form.get('shipToAddressE').value &&
        RegExp(/\p{sc=Han}/u).test(form.get('shipToAddressE').value)) ||
      RegExp(/[\u3105-\u3129\u02CA\u02C7\u02CB\u02D9]/).test(
        form.get('shipToAddressE').value
      )
    ) {
      noticeContentList.push(
        `Ship To Address (English) ${this.translateService.instant(
          'LicenseMgmt.Common.Hint.NotAllowedChinese'
        )}`
      );
    }

    if (
      form.get('deliverToAddress').value &&
      !form.get('deliverToAddressE').value &&
      form.get('vcType').value == 'C'
    ) {
      noticeContentList.push(
        `${this.translateService.instant(
          'Input.PlaceHolder.PleaseEnter'
        )} Deliver To Address (English)`
      );
    }

    if (
      (form.get('deliverToAddressE').value &&
        RegExp(/\p{sc=Han}/u).test(form.get('deliverToAddressE').value)) ||
      RegExp(/[\u3105-\u3129\u02CA\u02C7\u02CB\u02D9]/).test(
        form.get('deliverToAddressE').value
      )
    ) {
      noticeContentList.push(
        `Deliver To Address (English) ${this.translateService.instant(
          'LicenseMgmt.Common.Hint.NotAllowedChinese'
        )}`
      );
    }

    if (
      !form.get('endUse').value ||
      form.get('endUse').value.replaceAll(' ', '').replaceAll('　', '').length === 0
    ) {
      noticeContentList.push(
        `${this.translateService.instant(
          'Input.PlaceHolder.PleaseEnter'
        )} End Use`
      );
    }

    if (
      form.get('endUse').value &&
      !new RegExp(
        '^[A-Za-z0-9 ]+$',
        'gm'
      ).test(form.get('endUse').value)
    ) {
      noticeContentList.push(
        `${this.translateService.instant(
          'LicenseMgmt.IMPEXP.Hint.EndUseAllowNumAndEng'
        )}`
      );
    }

    if (itemList.length == 0) {
      noticeContentList.push(
        `${this.translateService.instant(
          'Input.PlaceHolder.PleaseSelect'
        )} Item`
      );
    }

    if (form.get('country').value === 'HK' && itemList.length > 0) {
      for (const item of itemList) {
        if (!item.price || (item.price && item.price.toString().length === 0)) {
          // noticeContentList.push(
          //   `${this.translateService.instant(
          //     'LicenseMgmt.IMPEXP.Hint.WarehouseHKPriceRequired'
          //   )}`
          // );
          // break;
          if (item.productCode) {
            noticeContentList.push(
              `Item：${item.productCode} ${this.translateService.instant(
                'LicenseMgmt.Common.Hint.NotKeyIn'
              )} Price (USD)`
            );
          } else {
            noticeContentList.push(
              `CCATs：${item.ccats} ${this.translateService.instant(
                'LicenseMgmt.Common.Hint.NotKeyIn'
              )} Price (USD)`
            );
          }
        }
      }
    }

    if (form.get('country').value === 'SG' && itemList.length > 0) {
      for (const item of itemList) {
        if (!item.deliveryNo) {
          noticeContentList.push(
            `Item：${item.productCode} ${this.translateService.instant(
              'LicenseMgmt.Common.Hint.NotKeyIn'
            )} Delivery No.`
          );
        }
      }
    }

    if (isCheckItem) {
      noticeContentList = [
        ...noticeContentList,
        ...this.onVerifyItemProcess(itemList),
      ];
    }

    const attachedFileNum = await lastValueFrom(
      this.getTargetFormAttacheds(formNo, formTypeId)
    );

    if (
      form.get('country').value === 'HK' &&
      attachedFileNum === 0 &&
      itemList.filter((x) => x.productCode).map((x) => x.productCode).length > 0
    ) {
      const noRecordResult = await lastValueFrom(
        this.checkLicenseMasterViewRecord('EXPORT', itemList)
      );
      for (const result of noRecordResult.results) {
        if (result.hasRecord === 'N') {
          noticeContentList.push(
            `Item：${result.productCode} ${this.translateService.instant(
              'LicenseMgmt.IMPEXP.Hint.ItemNoRecord'
            )}`
          );
        }
      }
    }

    return noticeContentList;
  }

  private checkLicenseMasterViewRecord(
    licenseType: string,
    itemList: any[]
  ): Observable<{
    licenseType: string;
    results: {
      productCode: string;
      hasRecord: 'Y' | 'N';
    }[];
  }> {
    const noRecordItemList = new Observable<{
      licenseType: string;
      results: {
        productCode: string;
        hasRecord: 'Y' | 'N';
      }[];
    }>((obs) => {
      this.licenseControlApiService
        .checkLicenseMasterViewRecord({
          tenant: this.userContextService.user$.getValue().tenant,
          licenseType: licenseType,
          productCode: itemList
            .filter((x) => x.productCode)
            .map((x) => x.productCode),
        })
        .pipe(
          finalize(() => {
            obs.complete();
          })
        )
        .subscribe({
          next: (res) => {
            obs.next({
              licenseType: res.body.licenseType,
              results: res.body.results,
            });
          },
          error: (err) => {
            console.error(err);
            obs.next({
              licenseType: '',
              results: [
                {
                  productCode: 'ERROR',
                  hasRecord: 'N',
                },
              ],
            });
          },
        });
    });

    return noRecordItemList;
  }

  private getTargetFormAttacheds(
    formNo: string,
    formTypeId?: string
  ): Observable<number> {
    const fileNum = new Observable<number>((obs) => {
      this.myFlowService
        .getFormFile(formNo, formTypeId)
        .pipe(
          finalize(() => {
            obs.complete();
          })
        )
        .subscribe({
          next: (res) => {
            obs.next(res.filter((x) => x.type === 'File').length);
          },
          error: (err) => {
            console.error(err);
            obs.next(0);
          },
        });
    });

    return fileNum;
  }

  onOpenIMPLineItemPreChecker(form: FormGroup): string[] {
    const noticeContentList = new Array<string>();

    if (!form.get('ouCode').value) {
      noticeContentList.push(
        `${this.translateService.instant(
          'LicenseMgmt.IMPEXP.Hint.SelectOUFirstIMP'
        )}`
      );
    }

    if (!form.get('country').value) {
      noticeContentList.push(
        `${this.translateService.instant(
          'LicenseMgmt.IMPEXP.Hint.SelectWarehouseFirst'
        )}`
      );
    }

    if (!form.get('vcCode').value) {
      noticeContentList.push(
        `${this.translateService.instant(
          'LicenseMgmt.IMPEXP.Hint.SelectCVFirst'
        )}`
      );
    }

    return noticeContentList;
  }

  onOpenEXPLineItemPreChecker(form: FormGroup): string[] {
    const noticeContentList = new Array<string>();

    if (!form.get('ouCode').value) {
      noticeContentList.push(
        `${this.translateService.instant(
          'LicenseMgmt.IMPEXP.Hint.SelectOUFirstEXP'
        )}`
      );
    }

    if (!form.get('country').value) {
      noticeContentList.push(
        `${this.translateService.instant(
          'LicenseMgmt.IMPEXP.Hint.SelectWarehouseFirst'
        )}`
      );
    }

    if (!form.get('vcCode').value) {
      noticeContentList.push(
        `${this.translateService.instant(
          'LicenseMgmt.IMPEXP.Hint.SelectCVFirst'
        )}`
      );
    }

    if (!form.get('shipToAddress').value) {
      noticeContentList.push(
        `${this.translateService.instant(
          'LicenseMgmt.IMPEXP.Hint.SelectShipToAddressFirst'
        )}`
      );
    }

    return noticeContentList;
  }

  onOpenRefDialogPreChecker(formType: string, form: FormGroup): string[] {
    const noticeContentList = new Array<string>();

    if (!form.get('ouCode').value) {
      noticeContentList.push(
        `${
          formType === FormTypeEnum.LICENSE_IMP
            ? this.translateService.instant(
                'LicenseMgmt.IMPEXP.Hint.SelectOUFirstIMP'
              )
            : this.translateService.instant(
                'LicenseMgmt.IMPEXP.Hint.SelectOUFirstEXP'
              )
        }`
      );
    }

    if (!form.get('vcCode').value) {
      noticeContentList.push(
        `${this.translateService.instant(
          'LicenseMgmt.IMPEXP.Hint.SelectCVFirst'
        )}`
      );
    }

    if (!form.get('country').value) {
      noticeContentList.push(
        `${this.translateService.instant(
          'LicenseMgmt.IMPEXP.Hint.SelectWarehouseFirst'
        )}`
      );
    }

    if (!form.get('shipToAddress').value) {
      noticeContentList.push(
        `${this.translateService.instant(
          'LicenseMgmt.IMPEXP.Hint.SelectShipToAddressFirst'
        )}`
      );
    }

    return noticeContentList;
  }

  onGetDOItemFromERP(
    form: FormGroup,
    itemList: ExpLicenseItemInfo[]
  ): Observable<any> {
    const promiseArr = new Array();
    return new Observable<any>((obs) => {
      this.getEXPDOAPIParamsFromERP$().subscribe((api) => {
        for (const item of itemList.filter((data) => data.deliveryNo)) {
          const promiseObj = lastValueFrom(
            this.expDOList$(api, {
              trxNo: item.deliveryNo,
              address: form.get('shipToAddress').value,
              deliverTo: form.get('deliverToAddress').value,
              orgId: form.get('ouCode').value,
              targetNo: form.get('vcCode').value,
              vctype: form.get('vcType').value,
            })
          );
          promiseArr.push(promiseObj);
        }

        obs.next(Promise.all(promiseArr));
        obs.complete();
      });
    });
  }

  onOpenSelectorDialogParser(
    formType: string,
    selectType: string,
    form: FormGroup
  ): {
    title: string;
    type: string;
    data?: any;
  } {
    let titlePrefix: string =
      this.translateService.currentLang == 'zh-tw' ? '選擇' : 'Choose';
    let title = '';
    let searchType = '';
    let data = null;

    if (selectType == SelectorItemType.OOU) {
      if (formType === FormTypeEnum.LICENSE_IMP) {
        title = `${titlePrefix} ${this.translateService.instant(
          'LicenseMgmt.IMPEXP.Label.Receiving_Shipping_OU_IMP'
        )}`;
      } else {
        title = `${titlePrefix} ${this.translateService.instant(
          'LicenseMgmt.IMPEXP.Label.Receiving_Shipping_OU_EXP'
        )}`;
      }
      searchType = SelectorItemType.OOU;
    } else if (selectType == SelectorItemType.OU) {
      if (formType === FormTypeEnum.LICENSE_IMP) {
        title = `${titlePrefix} ${this.translateService.instant(
          'LicenseMgmt.IMPEXP.Label.Receiving_Shipping_Inventory_OU_IMP'
        )}`;
      } else {
        title = `${titlePrefix} ${this.translateService.instant(
          'LicenseMgmt.IMPEXP.Label.Receiving_Shipping_Inventory_OU_EXP'
        )}`;
      }
      searchType = SelectorItemType.OU;
    } else if (selectType == SelectorItemType.END_USER) {
      title = `${titlePrefix} End User`;
      searchType = SelectorItemType.CUSTOMER;
    } else if (selectType == SelectorItemType.HK_CONSIGNEE) {
      title = `${titlePrefix} Exporter/Consignee ( ${this.translateService.instant(
        'LicenseMgmt.IMPEXP.Label.ExpImpConsignee'
      )} )`;
      searchType = SelectorItemType.HK_CONSIGNEE;
    } else if (selectType == SelectorItemType.CUS_SHIP_TO_ADDRESS) {
      title = `${titlePrefix} Ship To Code`;
      searchType = SelectorItemType.CUS_SHIP_TO_ADDRESS;
      data = {
        custNo: form.get('vcCode').value,
        ouCode: form.get('oOuCode').value,
      };
    } else if (selectType == SelectorItemType.CUS_DELIVER_TO_ADDRESS) {
      title = `${titlePrefix} Deliver To Code`;
      searchType = SelectorItemType.CUS_DELIVER_TO_ADDRESS;
      data = {
        custNo: form.get('vcCode').value,
        ouCode: form.get('oOuCode').value,
      };
    } else if (selectType == SelectorItemType.CUS_ADDRESS_QUERY_SHIP) {
      title = `${titlePrefix} Ship To Code`;
      searchType = SelectorItemType.CUS_ADDRESS_QUERY_SHIP;
      data = {
        custNo: form.get('vcCode').value,
        ouCode: form.get('oOuCode').value,
      };
    } else if (selectType == SelectorItemType.CUS_ADDRESS_QUERY_ADDRESS) {
      title = `${titlePrefix} Deliver To Code`;
      searchType = SelectorItemType.CUS_ADDRESS_QUERY_ADDRESS;
      data = {
        custNo: form.get('vcCode').value,
        ouCode: form.get('oOuCode').value,
      };
    } else {
      if (form.get('vcType').value == 'C') {
        title = `${titlePrefix} Custormer`;
        searchType = SelectorItemType.CUSTOMER;
      } else {
        title = `${titlePrefix} Vendor`;
        searchType = SelectorItemType.VENDOR;
      }
    }

    return this.objectFormatService.ObjectClean({
      title: title,
      type: searchType,
      data: data,
    });
  }

  onSelectorDialogCallback(
    selectType: string,
    result: SelectItem<any>,
    formType: string,
    form: FormGroup
  ): FormGroup {
    if (
      selectType == SelectorItemType.OOU &&
      result.value.ouCode !== form.get('oOuCode').value
    ) {
      form.get('oOuCode').setValue(result.value.ouCode);
      form.get('oOuName').setValue(result.value.displayOu);
      form = this.campareOOUAndOUHandler(formType, form);
    } else if (
      selectType == SelectorItemType.OU &&
      result.value.ouCode !== form.get('ouCode').value
    ) {
      form.get('ouCode').setValue(result.value.ouCode);
      form.get('ouName').setValue(result.value.displayOu);
      form = this.campareOOUAndOUHandler(formType, form);
    } else if (selectType == SelectorItemType.END_USER) {
      form.get('endUserCode').setValue(result.value.customerNo);
      form
        .get('endUser')
        .setValue(
          `${result.value.customerName} / ${result.value.customerNameEg}`
        );
    } else if (selectType == SelectorItemType.CUS_SHIP_TO_ADDRESS) {
      form.get('shipToId').setValue(result.value.siteUseId);
      form.get('shipToCode').setValue(result.value.location);
      form.get('shipToAddress').setValue(result.value.addressLineCn);
      form.get('shipToAddressE').setValue(result.value.addressLineEg);
    } else if (selectType == SelectorItemType.CUS_DELIVER_TO_ADDRESS) {
      form.get('deliverToId').setValue(result.value.siteUseId);
      form.get('deliverToCode').setValue(result.value.location);
      form.get('deliverToAddress').setValue(result.value.addressLineCn);
      form.get('deliverToAddressE').setValue(result.value.addressLineEg);
    } else if (selectType == SelectorItemType.CUS_ADDRESS_QUERY_SHIP) {
      form.get('shipToId').setValue(result.value.siteUseId);
      form.get('shipToCode').setValue(result.value.location);
      form.get('shipToAddress').setValue(result.value.addressLineCn);
      form.get('shipToAddressE').setValue(result.value.addressLineEg);
    } else if (selectType == SelectorItemType.CUS_ADDRESS_QUERY_ADDRESS) {
      form.get('deliverToId').setValue(result.value.siteUseId);
      form.get('deliverToCode').setValue(result.value.location);
      form.get('deliverToAddress').setValue(result.value.addressLineCn);
      form.get('deliverToAddressE').setValue(result.value.addressLineEg);
    } else {
      form
        .get('vcCode')
        .setValue(
          result.value.customerNo === undefined
            ? result.value.vendorCode
            : result.value.customerNo
        );
      form.get('vcName').setValue(result.label);
    }

    return form;
  }

  onBAFASearch$(
    ieType: 'I' | 'E',
    productCode: string,
    bafaLicense: string
  ): Observable<any> {
    const getFuzzyBAFAList$ = (
      ieType: 'I' | 'E',
      productCode: string,
      bafaLicense: string
    ): Observable<any[]> =>
      new Observable<any[]>((obs) => {
        this.licenseControlApiService
          .getTargetBAFAInfo(ieType, productCode)
          .pipe(take(1))
          .subscribe({
            next: (res) => {
              obs.next(
                res.datas.filter(
                  (item: any) => item.BAFALicense === bafaLicense
                )[0]
              );
              obs.complete();
            },
            error: (err) => {
              console.error(err);
              obs.next([]);
              obs.complete();
            },
          });
      });

    return getFuzzyBAFAList$(ieType, productCode, bafaLicense);
  }

  private onVerifyItemProcess(itemList: any[]): string[] {
    const noticeContentList = new Array<string>();

    for (const item of itemList) {
      const itemInValidMsgs = new Array<string>();
      if (!item.license) {
        itemInValidMsgs.push(' License#');
      }
      if (!item.licenseQty) {
        itemInValidMsgs.push(' License QTY');
      }
      if (!item.startDate) {
        itemInValidMsgs.push(' Start Date');
      }
      if (!item.endDate) {
        itemInValidMsgs.push(' End Date');
      }

      if (itemInValidMsgs.length > 0) {
        noticeContentList.push(
          `${item.productCode ? 'Item' : 'CCATs'} ${
            item.productCode ? item.productCode : item.ccats
          } ${this.translateService.instant(
            'LicenseMgmt.Common.Hint.NotKeyIn'
          )}：${itemInValidMsgs.toString()}`
        );
      }
    }

    return noticeContentList;
  }

  private campareOOUAndOUHandler(formType: string, form: FormGroup): FormGroup {
    if (
      formType === FormTypeEnum.LICENSE_EXP &&
      form.get('oOuCode').value &&
      form.get('ouCode').value
    ) {
      if (form.get('oOuCode').value === form.get('ouCode').value) {
        form.get('shipmentType').setValue('Normal');
      } else {
        form.get('shipmentType').setValue('AJB');
      }
    }

    return form;
  }
}
