import { ChangeDetectorRef, Component, EventEmitter, Input, isDevMode, OnChanges, OnInit, Output, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, NgForm } from '@angular/forms';
import { TranslateService } from '@ngx-translate/core';
import { lastValueFrom } from 'rxjs';
import { AuthApiService } from 'src/app/core/services/auth-api.service';
import { CommonApiService } from 'src/app/core/services/common-api.service';
import { UserContextService } from 'src/app/core/services/user-context.service';
import { LoaderService } from 'src/app/core/services/loader.service';
import { SelectItem } from 'primeng/api';
import { SalesMarginToleranceSetupDialogService } from './sales-margin-tolerance-setup-dialog.service';
import { SalesMarginToleranceSetupService } from '../sales-margin-tolerance-setup.service';
import { ItemBrandCtg } from 'src/app/core/model/item-brand-ctg';
import { SalesMarginToleranceBean } from '../bean/sales-margin-tolerance-bean';
import { SalesMarginToleranceApiService } from 'src/app/core/services/sales-margin-tolerance-api.service';
import { DialogSettingParams } from 'src/app/core/model/selector-dialog-params';

@Component({
  selector: 'app-sales-margin-tolerance-setup-dialog',
  templateUrl: './sales-margin-tolerance-setup-dialog.component.html',
  styleUrls: ['./sales-margin-tolerance-setup-dialog.component.scss']
})
export class SalesMarginToleranceSetupDialogComponent implements OnInit, OnChanges {
  @ViewChild('ngForm') ngForm: NgForm;
  @Input() editObj: any;
  @Input() showDialog: boolean = false;
  @Output() saveEmitter = new EventEmitter<any>();
  @Output() closeDialog = new EventEmitter<any>();
  formGroup: FormGroup;
  formValue: any = { ouGroup: 'ALL', status: 'Y' };
  minDate: any = new Date();
  isSubmitted: boolean = false;
  showLoader: boolean = false;

  // ------ options
  groupOptions: SelectItem[] = [];
  ouOptions: any[] = [];
  endCustomerOptions: any[] = [];
  customerOptions: any[] = [];
  brandOptions: any[] = [];
  ctg1Options: any[] = [];
  itemOptions: any[] = [];
  statusOptions: SelectItem[] = [];
  //-----

  noticeCheckDialogParams: DialogSettingParams;
  noticeContentList: string[] = [];

  showError: boolean = false;

  get isAddMode() {
    return !!!this.editObj;
  }

  get isEditMode() {
    return !!this.editObj
  }

  constructor(
    private authApiService: AuthApiService,
    private translateService: TranslateService,
    private commonApiService: CommonApiService,
    private userContextService: UserContextService,
    private loaderService: LoaderService,
    private salesMarginToleranceSetupDialogService: SalesMarginToleranceSetupDialogService,
    private salesMarginToleranceSetupService: SalesMarginToleranceSetupService,
    private salesMarginToleranceApiService: SalesMarginToleranceApiService,
  ) { }

  ngOnInit(): void {
    this.subscribeLangChange();
  }

  ngOnChanges(): void {
    this.initData();
  }

  subscribeLangChange() {
  } // 訂閱語言變換

  initData() {
    this.loaderService.show();
    this.showLoader = true;
    this.salesMarginToleranceSetupService.initGroupOptions(false, true).then(rsp => {
      this.groupOptions = rsp;
      this.loaderService.hide();
    });
    this.statusOptions = this.translateService.instant('Common.Options.flagOptions');
    if (this.isAddMode) {
      this.ouOptions = [{ displayOu: '0_ALL OU', ouCode: 0, ouName: 'ALL OU' }];
      this.customerOptions = [{ value: 0, name: 'ALL (ALL)', displayCustomer: '0 - ALL (ALL)' }];
      this.brandOptions = [{ value: 0, label: 'ALL' }];
      this.itemOptions = [{ value: 0, label: 'ALL' }];
    } else {
      this.ouOptions = [{ displayOu: this.editObj.ouCode + '_' + this.editObj.ouName, ouCode: this.editObj.ouCode, ouName: this.editObj.ouName }];
      this.customerOptions = [{ value: this.editObj.custCode, name: this.editObj.custName, displayCustomer: this.editObj.custCode + ' - ' + this.editObj.custName }];
      this.brandOptions = [{ value: this.editObj.brand, label: this.editObj.brand }];
      this.itemOptions = this.editObj.productCode == '0' ? [{ value: this.editObj.productCode, label: 'ALL' }] : [{ value: this.editObj.productCode, label: this.editObj.productCode }];
      if (this.editObj.brand) {
        this.initCtg1Options({
          tenant: this.userContextService.user$.getValue().tenant,
          brand: this.editObj.brand,
        });
      }
    }

    this.isSubmitted = false;
    this.formValue = this.editObj ? this.salesMarginToleranceSetupDialogService.getRecoverTemplate(this.editObj) : this.salesMarginToleranceSetupDialogService.getAddTemplate();
    this.filterEndCustomer({ query: '' });
    isDevMode() && console.log('add or edit string', JSON.parse(JSON.stringify(this.formValue)));
    isDevMode() && console.log('add or edit obj', this.formValue);
    this.showLoader = false;
  }

  onHideDetailDialog() {
    this.closeDialog.emit(true);
  }

  async saveOnClick() {
    isDevMode() && console.log(this.getModifyModel())
    const model = this.getModifyModel();
    this.isSubmitted = true;
    if (this.ngForm.invalid) {
      // 表单存在错误
      return;
    }
    if (!this.submitCheckPass(model)) { return; }
    this.loaderService.show();

    isDevMode() && console.log(model)
    if (this.isAddMode) {
      await lastValueFrom(this.salesMarginToleranceApiService.saveSalesMargin(model)).then(rsp => {

        this.showMsgDialog('SalesMarginToleranceSetup.Msg.CreateSuccess', 'success');

      }).catch(rsp => {
        if (rsp.error?.message) {
          let msg = rsp.error.message;
          if (rsp.error.errors && rsp.error.errors.length > 0) {
            msg += ':' + rsp.error.errors;
          }
          this.showMsgDialog(msg, 'error');
        } else {
          this.showMsgDialog('System.Message.Error', 'error');
        }
      }).finally(() => {
        this.loaderService.hide();
      })
    } else {
      await lastValueFrom(this.salesMarginToleranceApiService.modifySalesMargin(model)).then(rsp => {

        this.showMsgDialog('SalesMarginToleranceSetup.Msg.EditSuccess', 'success');

      }).catch(rsp => {
        if (rsp.error?.message) {
          let msg = rsp.error.message;
          if (rsp.error.errors && rsp.error.errors.length > 0) {
            msg += ':' + rsp.error.errors;
          }
          this.showMsgDialog(msg, 'error');
        } else {
          this.showMsgDialog('System.Message.Error', 'error');
        }
      }).finally(() => {
        this.loaderService.hide();
      })
    }
  }

  private getModifyModel() {

    let modifyReq = new SalesMarginToleranceBean();
    modifyReq = {
      seq: this.formValue.seq,
      tenant: this.userContextService.user$.getValue().tenant,
      ouGroup: this.formValue.ouGroup,
      ouCode: this.formValue.ou?.ouCode,
      ouName: this.formValue.ou?.ouName,
      custCode: this.formValue.customer?.value,
      custName: this.formValue.customer?.name,
      endCustomer: this.formValue.endCustomer,
      brand: this.formValue.brand?.value,
      ctg1: this.formValue.ctg1,
      productCode: this.formValue.productCode?.value == 'ALL' ? 0 : this.formValue.productCode?.value,
      status: this.formValue.status,
      fromTolerance: this.formValue.fromTolerance,
      toTolerance: this.formValue.toTolerance,
      fromDate: this.formValue.fromDate ? new Date(this.formValue.fromDate).getTime() : null,
      toDate: this.formValue.toDate ? new Date(this.formValue.toDate).getTime() : null,

      userTimeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      createdBy: this.userContextService.user$.getValue().userEmail,
      updateBy: this.userContextService.user$.getValue().userEmail
    }
    return modifyReq;
  }

  private submitCheckPass(model: any) {
    if (model.ouGroup == null || model.ouGroup == undefined) {
      return false;
    }
    if (model.ouCode == null || model.ouCode == undefined) {
      return false;
    }
    if (model.custCode == null || model.custCode == undefined) {
      return false;
    }
    if (model.brand == null || model.brand == undefined) {
      return false;
    }
    if (model.productCode == null || model.productCode == undefined) {
      return false;
    }
    if (model.fromTolerance == null || model.fromTolerance == undefined) {
      return false;
    }
    if (model.toTolerance == null || model.toTolerance == undefined) {
      return false;
    }
    return true;
  }

  filterOu(event) {
    let filtered: any[] = [];
    let query = event.query;
    this.authApiService.ouQueryByPrefixAndGroup(query, this.formValue.ouGroup).subscribe(x => {
      for (let ou of x.ouList) {
        filtered.push(ou);
      }
      this.ouOptions = filtered;
    })
  }

  onBlurOu(event) {
    if (this.formValue.ouCode?.ouCode === undefined) {
      this.formValue.ouCode = undefined;
    }
  }

  onOuSelect(event): void {
    if (!this.formValue.ouGroup || this.formValue.ouGroup === 'ALL') {
      this.formValue.ouGroup = event.groupName;
    }
    this.filterEndCustomer({ query: '' });
  }

  filterCustomer(event) {
    let filtered: any[] = [];
    let query = event.query;
    this.commonApiService.getFuzzyActiveCustomerAllList(query).subscribe(x => {
      for (let customer of x.customerList) {
        filtered.push({
          displayCustomer: `${customer.customerNo} - ${customer.customerName} (${customer.customerNameEg})`,
          value: customer.customerNo,
          name: `${customer.customerName} (${customer.customerNameEg})`
        });
      }
      this.customerOptions = filtered;
    })
  }

  filterBrand(event) {
    const filtered: any[] = [];
    this.formValue.ctg1 = null;
    this.commonApiService.brandQueryByPrefix(event.query).subscribe(x => {
      for (const brand of x.brandList) {
        filtered.push({
          label: brand.name,
          value: brand.code,
        });
      }
      this.brandOptions = filtered;
    })
  }

  onBrandSelect(brand: string): void {
    this.formValue.ctg1 = null;
    if (brand) {
      this.initCtg1Options({
        tenant: this.userContextService.user$.getValue().tenant,
        brand: brand,
      });
      this.filterEndCustomer({ query: '' });
    }
  }

  initCtg1Options(target: ItemBrandCtg) {
    const filtered: any[] = [];
    this.commonApiService.getItemCtgByBrand(target).subscribe(rsp => {
      for (const brand of rsp.brandList) {
        if (brand.ctg1) {
          filtered.push({
            label: brand.ctg1,
            value: brand.ctg1,
          });
        }
      }
      this.ctg1Options = filtered;
    })
  }

  onCtg1Select(event): void {
    if (event) {
      this.formValue.productCode = null;
    }
  }

  filterItem(event) {
    if (event?.query) {
      const filtered: any[] = [];
      this.commonApiService.productQueryByPrefix("", event.query).subscribe((rsp) => {
        for (const item of rsp.productList) {
          filtered.push({
            label: item.code,
            value: item.code,
          });
        }
        this.itemOptions = filtered;
      });
    }
  }

  onItemSelect(event) {
    if (!event) {
      return;
    }
    const invItemNo = [];
    invItemNo.push(event.value);
    this.commonApiService.queryItemMasterByInvItemNos(invItemNo).subscribe(rsp => {
      const product = rsp.itemMasterList[0];
      if (product) {
        this.formValue.brand = {
          value: product.brand,
          label: product.brand
        };
        this.formValue.ctg1 = product.ctg1;
        this.formValue.endCustomer = null;
        this.filterEndCustomer({ query: '' });
        // 為了在頁面載完還沒跑完async
        setTimeout(() => {
          if (product.ctg1) {
            this.ctg1Options = [{
              value: product.ctg1,
              label: product.ctg1
            }];
          }
        }, 0);
      }
    })

  }
  onItemChange() {
    if (this.formValue.brand) {
      this.formValue.productCode = null;
      this.initCtg1Options({
        tenant: this.userContextService.user$.getValue().tenant,
        brand: this.formValue.brand.value,
      });
    }
  }

  filterEndCustomer(event) {
    let filtered: any[] = [];
    let query = event.query;
    if (!this.formValue.ouGroup || !this.formValue.ou?.ouCode || !this.formValue.brand?.value) {
      this.endCustomerOptions = [];
    }
    const request = {
      ouGroup: this.formValue.ouGroup,
      ouCode: this.formValue.ou?.ouCode,
      brand: this.formValue.brand?.value,
      keyword: query
    };
    this.commonApiService.queryEndCustomer(request).subscribe(x => {
      for (let endCustomer of x.endCustomerList) {
        filtered.push({ label: endCustomer.endCustomerName, value: endCustomer.endCustomerName });
      }
      this.endCustomerOptions = filtered;
    })
  }

  onBlurEndCustomer() {
    const selectedItem = this.endCustomerOptions.find(option => option === this.formValue.endCustomer);
    if (!selectedItem) {
      this.formValue.endCustomer = null;
    }
  }

  private showMsgDialog(label: string, mode: string) {
    this.showError = mode == 'error' ? true : false;// 決定按下關閉時是否徹底關閉全部開窗
    this.noticeContentList = new Array<string>();
    this.noticeContentList.push(this.translateService.instant(label));
    this.noticeCheckDialogParams = {
      title: this.translateService.instant('SalesMarginToleranceSetup.Label.Notification'),
      visiable: true,
      mode: mode
    };
  }

  /**
   * 控制msg顯示後是否徹底關閉全部開窗，正確時才要
   */
  msgDialogOnClose() {
    if (!this.showError) {
      this.onHideDetailDialog();
      this.saveEmitter.emit(this.editObj);
    }
  }

}
