import { Injectable } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { ActivatedRoute, Params } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { SelectItem } from 'primeng/api';
import { Observable, Subject, takeLast, takeUntil } from 'rxjs';
import { LicenseFormStatusEnum } from 'src/app/core/enums/license-form-status';
import { SelectorItemType } from 'src/app/core/enums/selector-item-type';
import { OUInfo } from 'src/app/core/model/ou-info';
import { DialogSettingParams } from 'src/app/core/model/selector-dialog-params';
import { AuditHistoryLog } from 'src/app/core/model/sign-off-history';
import { LicenseControlApiService } from 'src/app/core/services/license-control-api.service';
import { MyFlowService } from 'src/app/core/services/my-flow.service';
import { UserContextService } from 'src/app/core/services/user-context.service';
import { ObjectFormatService } from '../../../../core/services/object-format.service';
import { CurFormInfoService } from '../../services/cur-form-info.service';
import { CurFormStatusService } from '../../services/cur-form-status.service';

@Injectable({
  providedIn: 'root',
})
export class Sc047V2ProcessService {
  protected noticeContentList!: string[];
  protected noticeCheckDialogParams!: DialogSettingParams;

  private unSubscribeEvent = new Subject();

  constructor(
    private curFormStatusService: CurFormStatusService,
    private activatedRoute: ActivatedRoute,
    private myFlowService: MyFlowService,
    private userContextService: UserContextService,
    private licenseControlApiService: LicenseControlApiService,
    private curFormInfoService: CurFormInfoService,
    private objectFormatService: ObjectFormatService,
    private translateService: TranslateService
  ) {}

  onSelectorCallbackParser(
    form: FormGroup,
    selectType: string,
    result: SelectItem<any>
  ): [FormGroup, OUInfo] {
    let ouInfo: OUInfo | null = null;
    if (result.value) {
      if (
        selectType === SelectorItemType.OOU &&
        result.value.ouCode !== form.get('oOuCode').value
      ) {
        form.get('oOuCode').setValue(result.value.ouCode);
        form.get('oOuName').setValue(result.value.displayOu);
        form = this.campareOOUAndOUHandler(form);
      } else if (
        selectType === SelectorItemType.OU &&
        result.value.ouCode !== form.get('ouCode').value
      ) {
        ouInfo = result.value;
        form.get('ouCode').setValue(result.value.ouCode);
        form.get('ouName').setValue(result.value.displayOu);
        form = this.campareOOUAndOUHandler(form);
      } else if (selectType === SelectorItemType.CUS_ADDRESS_QUERY_SHIP) {
        form.get('shipToId').setValue(result.value.addressId);
        form.get('shipToCode').setValue(result.value.location);
        form.get('shipToAddress').setValue(result.value.addressLineCn);
        form.get('shipToAddressE').setValue(result.value.addressLineEg);
      } else if (selectType === SelectorItemType.CUS_ADDRESS_QUERY_ADDRESS) {
        form.get('deliverToId').setValue(result.value.addressId);
        form.get('deliverToCode').setValue(result.value.location);
        form.get('deliverToAddress').setValue(result.value.addressLineCn);
        form.get('deliverToAddressE').setValue(result.value.addressLineEg);
      } else {
        form
          .get('vcCode')
          .setValue(
            result.value.customerNo
              ? result.value.customerNo
              : result.value.vendorCode
          );
        form.get('vcName').setValue(result.label);
      }
    }

    return [form, ouInfo];
  }

  onFormChangeHanlder(
    type: 'vcType' | 'vcCode' | 'country' | 'ouCode',
    form: FormGroup
  ): FormGroup {
    if (type === 'vcType') {
      form.get('vcCode').setValue(null);
      form.get('vcName').setValue(null);
    }

    if (type === 'vcCode') {
      form.get('shipToId').setValue(null);
      form.get('shipToCode').setValue(null);
      form.get('shipToAddress').setValue(null);
      form.get('shipToAddressE').setValue(null);
      form.get('deliverToId').setValue(null);
      form.get('deliverToCode').setValue(null);
      form.get('deliverToAddress').setValue(null);
      form.get('deliverToAddressE').setValue(null);
    }

    if (type === 'country') {
      form.get('consignee').setValue(null);
      form.get('consigneeAddress').setValue(null);
    }

    if (type === 'ouCode') {
      form.get('shipToId').setValue(null);
      form.get('shipToCode').setValue(null);
      form.get('shipToAddress').setValue(null);
      form.get('shipToAddressE').setValue(null);
      form.get('deliverToId').setValue(null);
      form.get('deliverToCode').setValue(null);
      form.get('deliverToAddress').setValue(null);
      form.get('deliverToAddressE').setValue(null);
      form.get('consignee').setValue(null);
      form.get('consigneeAddress').setValue(null);
    }

    return form;
  }

  getTargetFormInfo(): Observable<any> {
    //> get target sc license form info
    const getTargetSCLicenseInfo$ = () =>
      new Observable<any>((obs) => {
        this.activatedRoute.queryParams
          .pipe(takeUntil(this.unSubscribeEvent))
          .subscribe((params: Params) => {
            if (params['queryFormNo']) {
              this.licenseControlApiService
                .getTargetSCLicenseInfo(params['queryFormNo'])
                .pipe(takeLast(1))
                .subscribe((res) => {
                  //> 儲存表單資訊進 cache
                  this.curFormInfoService.setCurFormInfo(res);
                  obs.next(res);
                  obs.complete();
                });
            } else {
              obs.next(null);
              obs.complete();
            }
          });
      });

    return getTargetSCLicenseInfo$();
  }

  checkFormStatus(formTypeId:string): Observable<boolean> {
    //> get target form audit log by form's no
    const getFlowAuditLog$ = (formNo: string | undefined) =>
      new Observable<AuditHistoryLog[]>((obs) => {
        if (formNo) {
          this.myFlowService
            .getFlowAuditLog(formNo,formTypeId)
            .pipe(takeLast(1))
            .subscribe((res) => {
              obs.next(res);
              obs.complete();
            });
        } else {
          obs.next([]);
          obs.complete();
        }
      });

    const returnCheckNotice$ = () =>
      new Observable<boolean>((obs) => {
        obs.next(false);
        this.activatedRoute.queryParams
          .pipe(takeUntil(this.unSubscribeEvent))
          .subscribe((params: Params) => {
            if (params['queryFormNo']) {
              getFlowAuditLog$(params['queryFormNo']).subscribe((auditLog) => {
                auditLog.sort((a, b) => (a.seq > b.seq ? 1 : -1));

                //> set up current form status
                if (auditLog.length == 0) {
                  //> set draft status
                  this.curFormStatusService.setCurFormStatus({
                    status: LicenseFormStatusEnum.DRAFT,
                    formNo: params['queryFormNo'],
                  });
                } else {
                  //> set approve status
                  this.curFormStatusService.setCurFormStatus({
                    status: LicenseFormStatusEnum.APPROVE,
                    formNo: params['queryFormNo'],
                  });
                }

                obs.next(true);
                obs.complete();
              });
            }
            obs.next(true);
            obs.complete();
          });
      });

    return returnCheckNotice$();
  }

  checkUserRole$(formTypeId:string): Observable<{
    taskStarter: boolean;
    warehouseMember: boolean;
  }> {
    //> get target form audit log by form's no
    const getFlowAuditLog$ = (formNo: string | undefined) =>
      new Observable<AuditHistoryLog[]>((obs) => {
        if (formNo) {
          this.myFlowService
            .getFlowAuditLog(formNo,formTypeId)
            .pipe(takeLast(1))
            .subscribe((res) => {
              obs.next(res);
              obs.complete();
            });
        } else {
          obs.next([]);
          obs.complete();
        }
      });

    const checkUserRole$ = () =>
      new Observable<any>((obs) => {
        this.activatedRoute.queryParams
          .pipe(takeUntil(this.unSubscribeEvent))
          .subscribe((params: Params) => {
            const userRole = {
              taskStarter: false,
              warehouseMember: false,
            };
            if (params['queryFormNo']) {
              getFlowAuditLog$(params['queryFormNo']).subscribe((auditLog) => {
                if (auditLog.length > 0) {
                  auditLog.sort((a, b) => (a.seq > b.seq ? 1 : -1));

                  if (
                    (auditLog[auditLog.length - 1].authorizerCode ===
                      this.userContextService.user$.getValue().userCode ||
                      auditLog[auditLog.length - 1].assigneeCode ===
                        this.userContextService.user$.getValue().userCode) &&
                    auditLog[auditLog.length - 1].stepNumber === 1 &&
                    auditLog[auditLog.length - 1].stepName === 'Application'
                  ) {
                    userRole.taskStarter = true;
                  } else {
                    for (const log of auditLog) {
                      if (
                        log.signerCode ==
                          this.userContextService.user$.getValue().userCode &&
                        log.stepName === 'Warehouse' &&
                        log.status === 'Approving'
                      ) {
                        userRole.warehouseMember = true;
                        break;
                      }
                    }
                  }
                }

                obs.next(userRole);
                obs.complete();
              });
            } else {
              obs.next(userRole);
              obs.complete();
            }
          });
      });

    return checkUserRole$();
  }

  updateItemList(
    mode: string,
    itemList: {
      key?: number;
      productCode: string;
      quantity: string | number;
      license?: string;
      refFormNo?: string;
      refShipment?: string;
      receipt: string;
      ccats?: string;
      remark?: string;
      scFlagType?: string;
    }[],
    updateItem: {
      key?: number;
      productCode: string;
      quantity: string | number;
      license?: string;
      refFormNo?: string;
      refShipment?: string;
      receipt: string;
      ccats?: string;
      remark?: string;
      scFlagType?: string;
    },
    oriData?: {
      key?: number;
      productCode: string;
      quantity: string | number;
      license?: string;
      refFormNo?: string;
      refShipment?: string;
      receipt: string;
      ccats?: string;
      remark?: string;
      scFlagType?: string;
    }
  ):
    | {
        key?: number;
        productCode: string;
        quantity: string | number;
        license?: string;
        refFormNo?: string;
        refShipment?: string;
        receipt: string;
        ccats?: string;
        remark?: string;
        scFlagType?: string;
      }[]
    | boolean {
    if (mode === 'add') {
      if (
        itemList.filter(
          (x) =>
            x.productCode === updateItem.productCode &&
            x.license === updateItem.license
        ).length === 0
      ) {
        //> 加入項 item & license "不存在"佇列中
        itemList = [
          ...itemList,
          this.objectFormatService.ObjectClean({
            productCode: updateItem.productCode,
            ccats: updateItem.ccats,
            quantity: this.objectFormatService.ParseThousandFormat(
              updateItem.quantity
            ),
            license: updateItem.license,
            refFormNo: updateItem.refFormNo,
            refShipment: updateItem.refShipment,
            receipt: updateItem.receipt,
            remark: updateItem.remark,
            scFlagType: updateItem.scFlagType,
          }),
        ];

        return itemList.map((x, i) => {
          return {
            ...x,
            key: i + 1,
            quantity: this.objectFormatService.ParseThousandFormat(
              x.quantity
            ),
          };
        });
      } else {
        return false;
      }
    }

    if (mode === 'edit') {
      itemList = itemList.map((x) =>
        x.productCode === oriData.productCode && x.license === oriData.license
          ? this.objectFormatService.ObjectClean({
              key: oriData.key,
              productCode: updateItem.productCode,
              ccats: updateItem.ccats,
              quantity: this.objectFormatService.ParseThousandFormat(
                updateItem.quantity
              ),
              license: updateItem.license,
              refFormNo: updateItem.refFormNo,
              refShipment: updateItem.refShipment,
              receipt: updateItem.receipt,
              remark: updateItem.remark,
              scFlagType: updateItem.scFlagType,
            })
          : {
              ...x,
              quantity: this.objectFormatService.ParseThousandFormat(
                x.quantity
              ),
            }
      );

      return itemList;
    }
  }

  validFormProcess(form: FormGroup, itemList: any[]): string[] {
    const noticeContentList: string[] = new Array<string>();

    for (const key of Object.keys(form.getRawValue())) {
      const value = form.getRawValue()[key];

      if (typeof value === 'string') {
        if (value.trim() === '') {
          form.get(key).setValue(null);
        }
      }
    }

    if (!form.get('oOuCode').value) {
      noticeContentList.push(
        `${this.translateService.instant(
          'Input.PlaceHolder.PleaseSelect'
        )} ${this.translateService.instant(
          'LicenseMgmt.SC047.Label.Purchasing_Orders_OU'
        )}`
      );
    }

    if (!form.get('ouCode').value) {
      noticeContentList.push(
        `${this.translateService.instant(
          'Input.PlaceHolder.PleaseSelect'
        )} ${this.translateService.instant(
          'LicenseMgmt.SC047.Label.Receiving_Shipping_OU'
        )}`
      );
    }

    if (!form.get('country').value) {
      noticeContentList.push(
        `${this.translateService.instant(
          'Input.PlaceHolder.PleaseSelect'
        )} ${this.translateService.instant(
          'LicenseMgmt.SC047.Label.Warehouse_Location'
        )}`
      );
    }

    if (!form.get('shipmentType').value) {
      noticeContentList.push(
        `${this.translateService.instant(
          'Input.PlaceHolder.PleaseSelect'
        )} ${this.translateService.instant(
          'LicenseMgmt.SC047.Label.Shipping_Type'
        )}`
      );
    }

    if (!form.get('vcCode').value) {
      noticeContentList.push(
        `${this.translateService.instant(
          'Input.PlaceHolder.PleaseSelect'
        )} ${this.translateService.instant('LicenseMgmt.SC047.Label.CV')}`
      );
    }

    if (!form.get('shipToAddress').value) {
      noticeContentList.push(
        `${this.translateService.instant(
          'Input.PlaceHolder.PleaseEnter'
        )} Ship To Address`
      );
    }

    if (!form.get('shipToAddressE').value && form.get('vcType').value == 'C') {
      noticeContentList.push(
        `${this.translateService.instant(
          'Input.PlaceHolder.PleaseEnter'
        )} Ship To Address (English)`
      );
    }

    if (
      form.get('shipToAddressE').value &&
      (RegExp(/\p{sc=Han}/u).test(form.get('shipToAddressE').value) ||
        RegExp(/[\u3105-\u3129\u02CA\u02C7\u02CB\u02D9]/).test(
          form.get('deliverToAddressE').value
        ))
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
      form.get('deliverToAddressE').value &&
      (RegExp(/\p{sc=Han}/u).test(form.get('deliverToAddressE').value) ||
        RegExp(/[\u3105-\u3129\u02CA\u02C7\u02CB\u02D9]/).test(
          form.get('deliverToAddressE').value
        ))
    ) {
      noticeContentList.push(
        `Deliver To Address (English) ${this.translateService.instant(
          'LicenseMgmt.Common.Hint.NotAllowedChinese'
        )}`
      );
    }

    if (!form.get('endUse').value) {
      noticeContentList.push(
        `${this.translateService.instant(
          'Input.PlaceHolder.PleaseEnter'
        )} End Use`
      );
    }

    if (
      form.get('endUse').value &&
      !RegExp(/^[A-Za-z0-9 ]+$/gm).test(form.get('endUse').value)
    ) {
      noticeContentList.push(
        `${this.translateService.instant(
          'LicenseMgmt.SC047.Hint.EndUseAllowNumAndEng'
        )}`
      );
    }

    if (form.get('comment').value && form.get('comment').value.length > 250) {
      noticeContentList.push(
        `${this.translateService.instant(
          'LicenseMgmt.Common.Hint.OpinionUpto250'
        )}`
      );
    }

    if (itemList.length == 0) {
      noticeContentList.push(
        `${this.translateService.instant(
          'Input.PlaceHolder.PleaseSelect'
        )} Item`
      );
    } else {
      for (const item of itemList) {
        if (item.license) {
          if (!item.quantity) {
            noticeContentList.push(
              `Item：${item.productCode} ${this.translateService.instant(
                'LicenseMgmt.SC047.Hint.FillItemQTY'
              )}`
            );
          }
        } else {
          noticeContentList.push(
            `Item：${item.productCode} ${this.translateService.instant(
              'LicenseMgmt.SC047.Hint.FillItemIMPLicense'
            )}`
          );
        }
      }
    }

    return noticeContentList;
  }

  private campareOOUAndOUHandler(form: FormGroup): FormGroup {
    if (form.get('oOuCode').value && form.get('ouCode').value) {
      if (form.get('oOuCode').value === form.get('ouCode').value) {
        form.get('shipmentType').setValue('Normal');
      } else {
        form.get('shipmentType').setValue('AJB');
      }
    }

    return form;
  }
}
