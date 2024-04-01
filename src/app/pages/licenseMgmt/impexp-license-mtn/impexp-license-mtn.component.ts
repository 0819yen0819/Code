import { DateInputHandlerService } from './../../../core/services/date-input-handler.service';
import { ObjectFormatService } from './../../../core/services/object-format.service';

import { ChangeDetectorRef, Component, OnDestroy, OnInit, ViewChild } from "@angular/core";
import { FormBuilder, FormGroup, Validators } from "@angular/forms";
import { Router } from "@angular/router";
import { TranslateService } from "@ngx-translate/core";
import { LazyLoadEvent, SelectItem } from "primeng/api";
import { Table } from "primeng/table";
import { lastValueFrom, Subscription } from "rxjs";
import { ResponseCodeEnum } from 'src/app/core/enums/ResponseCodeEnum';
import { SelectorItemType } from 'src/app/core/enums/selector-item-type';
import { SelectorDialogParams } from 'src/app/core/model/selector-dialog-params';
import { CommonApiService } from "src/app/core/services/common-api.service";
import { LicenseControlApiService } from "src/app/core/services/license-control-api.service";
import { LoaderService } from "src/app/core/services/loader.service";
import { ToastService } from "src/app/core/services/toast.service";
import { UserContextService } from "src/app/core/services/user-context.service";
import { GetItemEccnResponse } from './bean/get-item-eccn-response';
import { ImpExpLicenseMtnBean } from "./bean/impexp-license-mtn-bean";
import { ImpExpLicenseMtnModifyRequest } from "./bean/impexp-license-mtn-modify-request";
import { ImpExpLicenseMtnQueryRequest } from "./bean/impexp-license-mtn-query-request";
import { LicenseHistoryResponse } from './bean/license-history-response';
import { TableStatusKeepService } from 'src/app/core/services/table-status-keep.service';

@Component({
  selector: 'app-impexp-license-mtn',
  templateUrl: './impexp-license-mtn.component.html',
  styleUrls: ['./impexp-license-mtn.component.scss'],
})
export class ImpExpLicenseMtnComponent implements OnInit, OnDestroy {
  @ViewChild('lazyTableImp') lazyTableImp: Table;
  @ViewChild('lazyTableExp') lazyTableExp: Table;

  private onLangChange$: Subscription;
  permissions: string[] = [];
  formNo: string;
  formNoExp: string;
  countryCode: string;
  countryCodeExp: string;
  countryCodeOptions: SelectItem[];
  countryCodeAllOptions: SelectItem[];
  countryCodeExpOptions: SelectItem[];
  countryCodeExpAllOptions: SelectItem[];
  customerVendorType: string;
  customerVendorTypeExp: string;
  customerVendorTypeOptions: SelectItem[];
  customerVendorCode: any;
  customerVendorCodeExp: any;
  flagOptions: SelectItem[];

  displayResultImp: boolean = false;
  displayResultExp: boolean = false;

  colsImp: any[];
  colsExp: any[];
  dataImp: any[];
  dataExp: any[];
  cloneDataImp: any[];
  cloneDataExp: any[];
  selectedColsImp: any[];
  selectedColsExp: any[];

  queryReq: ImpExpLicenseMtnQueryRequest = new ImpExpLicenseMtnQueryRequest();
  queryReqExp: ImpExpLicenseMtnQueryRequest =
    new ImpExpLicenseMtnQueryRequest();

  sortFieldImp: string;
  sortOrderImp: number;
  firstImp: number = 0;
  globalFilterImp: string = '';
  totalRecordsImp: number;
  sortFieldExp: string;
  sortOrderExp: number;
  firstExp: number = 0;
  globalFilterExp: string = '';
  totalRecordsExp: number;

  detailBeanImp: ImpExpLicenseMtnBean = new ImpExpLicenseMtnBean();
  editFormImp: FormGroup;
  detailBeanExp: ImpExpLicenseMtnBean = new ImpExpLicenseMtnBean();
  editFormExp: FormGroup;

  displayFilterImp: boolean = false;
  displayDetailImp: boolean = false;
  editFlagOptions: SelectItem[];
  editScFlagOptions: SelectItem[];
  editVcTypeOptions: SelectItem[];
  displayFilterExp: boolean = false;
  displayDetailExp: boolean = false;

  isEdit: boolean = false;
  formSubmitted: boolean = false;
  isEditExp: boolean = false;
  formSubmittedExp: boolean = false;
  colFuncs: any[];
  delSeqImp: number;
  delSeqExp: number;
  displayDelDialogImp: boolean = false;
  displayDelDialogExp: boolean = false;
  itemFilterType: string;
  itemFilterTypeExp: string;
  itemFilterTypeOptions: SelectItem[];
  filteredEditProductCode: any[];
  filteredEditProductCodeExp: any[];

  displayArea: boolean = false;
  displayHistory: boolean = false;
  getItemEccnRsp: GetItemEccnResponse = new GetItemEccnResponse();
  colsAreaEccn: any[];
  selectedColsAreaEccn: any[];
  colsHistory: any[];
  selectedColsHistory: any[];
  licenseHistoryRsp: LicenseHistoryResponse = new LicenseHistoryResponse();
  filteredEditEndUserExp: any[];
  shipFromAddressResult: any[];
  shipFromAddressOuCodeAndVcNoRequired: boolean = false;
  shipFromAddressResultExp: any[];
  shipFromAddressOuCodeAndVcNoRequiredExp: boolean = false;
  shipToAddressOuCodeAndVcNoRequired: boolean = false;
  shipToAddressResultExp: any[];
  shipToAddressOuCodeAndVcNoRequiredExp: boolean = false;
  deliverToAddressResultExp: any[];
  deliverToAddressOuCodeAndVcNoRequiredExp: boolean = false;

  //> v/c selector dialog params
  selectorDialogParams!: SelectorDialogParams;
  curCVLable: string = '';
  curCVLableExp: string = '';
  curSelectLicenseType: string;
  curSelectType: string;
  curOULable: string = '';
  curOOULable: string = '';
  curOULableExp: string = '';
  curOOULableExp: string = '';
  curAddOuLable: string = '';
  curAddOOuLable: string = '';
  curAddOuExpLable: string = '';
  curAddOOuExpLable: string = '';
  editFormImpQtyMustBeGE: boolean = false;
  editFormImpQty: number = 0;
  editFormExpQtyMustBeGE: boolean = false;
  editFormExpQty: number = 0;
  curVcOuLable: string = '';
  curVcOuExpLable: string = '';
  editFormImpPriceMustBeGE: boolean = false;
  editFormImpPrice: number = 0;
  editFormExpPriceMustBeGE: boolean = false;
  editFormExpPrice: number = 0;
  editFormImpEndDateMustBeLater: boolean = false;
  editFormExpEndDateMustBeLater: boolean = false;

  constructor(
    private router: Router,
    private formBuilder: FormBuilder,
    private userContextService: UserContextService,
    private translateService: TranslateService,
    private toastService: ToastService,
    private commonApiService: CommonApiService,
    private loaderService: LoaderService,
    private licenseControlApiService: LicenseControlApiService,
    private changeDetectorRef: ChangeDetectorRef,
    private objectFormatService:ObjectFormatService,
    private dateInputHandlerService:DateInputHandlerService,
    public tableStatusKeepService : TableStatusKeepService
  ) {
    if (this.userContextService.user$.getValue) {
      this.permissions = this.userContextService.getMenuUrlPermission(
        this.router.url
      );
      console.log('permissions: ', this.permissions);
    }
    this.onLangChange$ = this.translateService.onLangChange.subscribe(() => {
      this.initColumns();
      this.initOptions();
      this.changeFilterImp();
      this.changeFilterExp();
      this.changeFilterAreaEccn();
      this.changeFilterHistory();
    });
    this.queryReq.flag = 'Y';
    // this.queryReq.startDate = new Date();
    // this.queryReq.endDate = new Date();
    // this.queryReq.startDate.setMonth(this.queryReq.startDate.getMonth() - 6);
    this.queryReqExp.flag = 'Y';
    // this.queryReqExp.startDate = new Date();
    // this.queryReqExp.endDate = new Date();
    // this.queryReqExp.startDate.setMonth(this.queryReqExp.startDate.getMonth() - 6);
    this.queryReq.permissions = this.permissions;
    this.queryReqExp.permissions = this.permissions;
    this.queryReq.customerVendorType = 'Vendor';
    this.queryReqExp.customerVendorType = 'Customer';
    this.queryReq.itemFilterType = 'Include';
    this.queryReqExp.itemFilterType = 'Include';
  }

  ngOnInit(): void {
    this.initColumns();
    this.initOptions();
    this.changeFilterImp();
    this.changeFilterExp();
    this.changeFilterAreaEccn();
    this.changeFilterHistory();
    //# TK-35854
    // 會trigger LAZY-TABLE的onLazyLoad event
    // this.displayResultImp = true;
    // this.displayResultExp = true;

    this.editFormImp = this.formBuilder.group({
      ouCode: [''],
      countryCode: ['', Validators.required],
      oouCode: [''],
      productCode: [''],
      vcType: [''],
      shipFromAddress: ['', Validators.required],
      price: [0],
      quantity: ['', Validators.required],
      startDate: ['', Validators.required],
      endDate: ['', Validators.required],
      scFlag: [''],
      activeFlag: ['', Validators.required],
      addOu: ['', Validators.required],
      addOOu: ['', Validators.required],
      vcOu: ['', Validators.required],
      product: [''],
      endUser: [''],
      remark: [''],
      endUserOu: [''],
      licenseNo: ['', Validators.required],
      ccats: [''],
    });

    this.editFormExp = this.formBuilder.group({
      ouCode: [''],
      countryCode: ['', Validators.required],
      oouCode: [''],
      productCode: [''],
      vcType: [''],
      // shipFromAddress: ['', Validators.required],
      shipToAddress: ['', Validators.required],
      price: [0],
      quantity: ['', Validators.required],
      startDate: ['', Validators.required],
      endDate: ['', Validators.required],
      scFlag: [''],
      activeFlag: ['', Validators.required],
      addOu: ['', Validators.required],
      addOOu: ['', Validators.required],
      vcOu: ['', Validators.required],
      product: [''],
      deliveryNo: [''],
      endUseRmk: [''],
      endUser: [''],
      endUserAddress: [''],
      remark: [''],
      endUserOu: [''],
      licenseNo: ['', Validators.required],
      deliverToAddress: [''],
      ccats: [''],
    });

    // this.editScFlagOptions = [
    //   { label: 'SC047', value: 'SC047' },
    //   { label: 'SC054', value: 'SC054' },
    //   { label: 'N', value: 'N' }
    // ];

    this.editFlagOptions = [
      { label: 'Y', value: 'Y' },
      { label: 'N', value: 'N' },
    ];

    this.composeAutoCompleteReq();
    this.composeAutoCompleteReqExp();
  }

  initColumns() {
    this.colsImp = this.translateService.instant('ImpExpLicenseMtn.ImpColumns');
    this.colsExp = this.translateService.instant('ImpExpLicenseMtn.ExpColumns');
    this.colFuncs = this.translateService.instant(
      'ImpExpLicenseMtn.ColumnFunctions'
    );
    this.colFuncs = this.colFuncs.filter(
      (x) =>
        this.permissions.includes(x.field) ||
        x.field === 'viewArea' ||
        x.field === 'viewHistory'
    );
    this.colsAreaEccn = this.translateService.instant(
      'ImpExpLicenseMtn.AreaEccnColums'
    );
    this.colsHistory = this.translateService.instant(
      'ImpExpLicenseMtn.HistoryColums'
    );
  }

  initOptions() {
    this.customerVendorTypeOptions = [];
    this.customerVendorTypeOptions.push.apply(
      this.customerVendorTypeOptions,
      this.translateService.instant(
        'ImpExpLicenseMtn.Options.customerVendorTypeOptions'
      )
    );
    this.flagOptions = this.translateService.instant(
      'ImpExpLicenseMtn.Options.flagOptions'
    );
    this.editVcTypeOptions = [];
    this.editVcTypeOptions.push.apply(
      this.editVcTypeOptions,
      this.translateService.instant('ImpExpLicenseMtn.Options.vcTypeOptions')
    );
    this.countryCodeOptions = [];
    this.countryCodeOptions.push.apply(
      this.countryCodeOptions,
      this.translateService.instant(
        'ImpExpLicenseMtn.Options.countryCodeOptions'
      )
    );
    this.countryCodeAllOptions = [];
    this.countryCodeExpOptions = [];
    this.countryCodeExpOptions.push.apply(
      this.countryCodeExpOptions,
      this.translateService.instant(
        'ImpExpLicenseMtn.Options.countryCodeOptions'
      )
    );
    this.countryCodeExpAllOptions = [];
    this.getCountryCode();
    this.getCountryCodeExp();
    this.itemFilterTypeOptions = [];
    this.itemFilterTypeOptions.push.apply(
      this.itemFilterTypeOptions,
      this.translateService.instant(
        'ImpExpLicenseMtn.Options.itemFilterTypeOptions'
      )
    );
    this.editScFlagOptions = this.translateService.instant(
      'ImpExpLicenseMtn.Options.editScFlagOptions'
    );
  }

  changeFilterImp() {
    this.selectedColsImp = this.colsImp.filter((x) => {
      return x.isDefault;
    });
    if (this.permissions.includes('edit')) {
      this.selectedColsImp.unshift(
        this.translateService.instant('ImpExpLicenseMtn.EditColums')
      );
    }
    this.colFuncs?.forEach((x) => {
      this.selectedColsImp.unshift(x);
    });
  }

  changeFilterExp() {
    this.selectedColsExp = this.colsExp.filter((x) => {
      return x.isDefault;
    });
    if (this.permissions.includes('edit')) {
      this.selectedColsExp.unshift(
        this.translateService.instant('ImpExpLicenseMtn.EditColums')
      );
    }
    this.colFuncs?.forEach((x) => {
      this.selectedColsExp.unshift(x);
    });
  }

  changeFilterAreaEccn() {
    this.selectedColsAreaEccn = this.colsAreaEccn.filter((x) => {
      return x.isDefault;
    });
  }

  changeFilterHistory() {
    this.selectedColsHistory = this.colsHistory.filter((x) => {
      return x.isDefault;
    });
  }

  editDetail(seq: number) {
    if (seq !== undefined) {
      this.loaderService.show();
      this.isEdit = true;
      const req = {
        seq: seq,
        tenant:this.userContextService.user$.getValue().tenant
      };
      this.licenseControlApiService.licenseMasterImpView(req).subscribe({
        next: (res) => {
          this.detailBeanImp = res.detail;
          let scFlag = null;
          if (
            this.detailBeanImp.scFlagType === null &&
            this.detailBeanImp.scFlag === 'N' &&
            this.detailBeanImp.sc047Flag === 'N'
          ) {
            scFlag = 'N';
          } else if (
            this.detailBeanImp.scFlag === 'Y' &&
            this.detailBeanImp.sc047Flag === 'Y'
          ) {
            scFlag = this.detailBeanImp.scFlagType;
          }
          let editFormData = {
            ouCode: this.detailBeanImp?.ouCode ? this.detailBeanImp.ouCode : '',
            countryCode: this.detailBeanImp?.countryCode
              ? this.detailBeanImp.countryCode
              : '',
            oouCode: this.detailBeanImp?.oouCode
              ? this.detailBeanImp.oouCode
              : '',
            productCode: this.detailBeanImp?.productCode
              ? this.detailBeanImp.productCode
              : '',
            vcType: this.detailBeanImp.vcType,
            shipFromAddress: this.detailBeanImp?.shipFromAddress
              ? this.detailBeanImp.shipFromAddress
              : '',
            price: this.detailBeanImp?.price ? this.detailBeanImp.price : 0,
            quantity: this.detailBeanImp?.quantity
              ? this.detailBeanImp.quantity
              : 0,
            startDate: this.detailBeanImp.displayStartDate,
            endDate: this.detailBeanImp.displayEndDate,
            scFlag: scFlag,
            activeFlag: this.detailBeanImp.activeFlag,
            addOu: this.detailBeanImp?.addOu ? this.detailBeanImp.addOu : '',
            addOOu: this.detailBeanImp?.addOOu ? this.detailBeanImp.addOOu : '',
            vcOu: this.detailBeanImp?.vcOu ? this.detailBeanImp.vcOu : '',
            product: this.detailBeanImp?.product
              ? this.detailBeanImp.product
              : '',
            endUser: this.detailBeanImp?.endUser
              ? this.detailBeanImp.endUser
              : '',
            remark: this.detailBeanImp?.remark ? this.detailBeanImp.remark : '',
            endUserOu: this.detailBeanImp?.endUserOu
              ? this.detailBeanImp.endUserOu
              : '',
            licenseNo: this.detailBeanImp?.licenseNo
              ? this.detailBeanImp?.licenseNo
              : '',
            ccats: this.detailBeanImp?.ccats ? this.detailBeanImp?.ccats : '',
          };
          this.editFormImp.setValue(editFormData);
          this.impMinDate = new Date(this.editFormImp.get('startDate').value);
          this.curAddOuLable = this.detailBeanImp?.addOu
            ? this.detailBeanImp.addOu.displayOu
            : '';
          this.curAddOOuLable = this.detailBeanImp?.addOOu
            ? this.detailBeanImp.addOOu.displayOu
            : '';
          this.curVcOuLable = this.detailBeanImp?.vcOu
            ? this.detailBeanImp.vcOu.displayOu
            : '';
          this.loaderService.hide();
        },
        error: (e) => {
          console.error(e);
          this.loaderService.hide();
          this.toastService.error('System.Message.Error');
        },
      });
    } else {
      this.isEdit = false;
      let editFormData = {
        ouCode: '',
        countryCode: '',
        oouCode: '',
        productCode: '',
        vcType: '',
        shipFromAddress: '',
        price: 0,
        quantity: null,
        startDate: '',
        endDate: '',
        scFlag: '',
        activeFlag: 'Y',
        addOu: '',
        addOOu: '',
        vcOu: '',
        product: '',
        endUser: '',
        remark: '',
        endUserOu: '',
        licenseNo: '',
        ccats: '',
      };
      this.editFormImp.setValue(editFormData);
      this.impMinDate = new Date(this.editFormImp.get('startDate').value);
      this.detailBeanImp = new ImpExpLicenseMtnBean();
      this.curAddOuLable = '';
      this.curAddOOuLable = '';
      this.curVcOuLable = '';
    }

    this.displayDetailImp = true;
    this.formSubmitted = false;
  }

  editDetailExp(seq: number) {
    if (seq !== undefined) {
      this.loaderService.show();
      this.isEditExp = true;
      const req = {
        seq: seq,
        tenant:this.userContextService.user$.getValue().tenant
      };
      this.licenseControlApiService.licenseMasterImpView(req).subscribe({
        next: (res) => {
          this.detailBeanExp = res.detail;
          let scFlag = null;
          if (
            this.detailBeanExp.scFlagType === null &&
            this.detailBeanExp.scFlag === 'N' &&
            this.detailBeanExp.sc047Flag === 'N'
          ) {
            scFlag = 'N';
          } else if (
            this.detailBeanExp.scFlag === 'Y' &&
            this.detailBeanExp.sc047Flag === 'Y'
          ) {
            scFlag = this.detailBeanExp.scFlagType;
          }
          let editFormData = {
            ouCode: this.detailBeanExp?.ouCode ? this.detailBeanExp.ouCode : '',
            countryCode: this.detailBeanExp?.countryCode
              ? this.detailBeanExp.countryCode
              : '',
            oouCode: this.detailBeanExp?.oouCode
              ? this.detailBeanExp.oouCode
              : '',
            productCode: this.detailBeanExp?.productCode
              ? this.detailBeanExp.productCode
              : '',
            vcType: this.detailBeanExp.vcType,
            // shipFromAddress: this.detailBeanExp?.shipFromAddress ? this.detailBeanExp.shipFromAddress : '',
            shipToAddress: this.detailBeanExp?.shipToAddress
              ? this.detailBeanExp.shipToAddress
              : '',
            price: this.detailBeanExp?.price ? this.detailBeanExp.price : 0,
            quantity: this.detailBeanExp?.quantity
              ? this.detailBeanExp.quantity
              : 0,
            startDate: this.detailBeanExp.displayStartDate,
            endDate: this.detailBeanExp.displayEndDate,
            scFlag: scFlag,
            activeFlag: this.detailBeanExp.activeFlag,
            addOu: this.detailBeanExp?.addOu ? this.detailBeanExp.addOu : '',
            addOOu: this.detailBeanExp?.addOOu ? this.detailBeanExp.addOOu : '',
            vcOu: this.detailBeanExp?.vcOu ? this.detailBeanExp.vcOu : '',
            product: this.detailBeanExp?.product
              ? this.detailBeanExp.product
              : '',
            deliveryNo: this.detailBeanExp?.deliveryNo
              ? this.detailBeanExp.deliveryNo
              : '',
            endUseRmk: this.detailBeanExp?.endUseRmk
              ? this.detailBeanExp.endUseRmk
              : '',
            endUser: this.detailBeanExp?.endUser
              ? this.detailBeanExp.endUser
              : '',
            endUserAddress: this.detailBeanExp?.endUserAddress
              ? this.detailBeanExp.endUserAddress
              : '',
            remark: this.detailBeanExp?.remark ? this.detailBeanExp.remark : '',
            endUserOu: this.detailBeanExp?.endUserOu
              ? this.detailBeanExp.endUserOu
              : '',
            licenseNo: this.detailBeanExp?.licenseNo
              ? this.detailBeanExp.licenseNo
              : '',
            deliverToAddress: this.detailBeanExp?.deliveryToAddress
              ? this.detailBeanExp.deliveryToAddress
              : '',
            ccats: this.detailBeanExp?.ccats ? this.detailBeanExp?.ccats : '',
          };
          this.editFormExp.setValue(editFormData);
          this.expMinDate = new Date(this.editFormExp.get('startDate').value);
          this.curAddOuExpLable = this.detailBeanExp?.addOu
            ? this.detailBeanExp.addOu.displayOu
            : '';
          this.curAddOOuExpLable = this.detailBeanExp?.addOOu
            ? this.detailBeanExp.addOOu.displayOu
            : '';
          this.curVcOuExpLable = this.detailBeanExp?.vcOu
            ? this.detailBeanExp.vcOu.displayOu
            : '';
          this.loaderService.hide();
        },
        error: (e) => {
          console.error(e);
          this.loaderService.hide();
          this.toastService.error('System.Message.Error');
        },
      });
    } else {
      this.isEditExp = false;
      let editFormData = {
        ouCode: '',
        countryCode: '',
        oouCode: '',
        productCode: '',
        vcType: '',
        // shipFromAddress: '',
        shipToAddress: '',
        price: 0,
        quantity: null,
        startDate: '',
        endDate: '',
        scFlag: '',
        activeFlag: 'Y',
        addOu: '',
        addOOu: '',
        vcOu: '',
        product: '',
        deliveryNo: '',
        endUseRmk: '',
        endUser: '',
        endUserAddress: '',
        remark: '',
        endUserOu: '',
        licenseNo: '',
        deliverToAddress: '',
        ccats: '',
      };
      this.editFormExp.setValue(editFormData);
      this.expMinDate = new Date(this.editFormExp.get('startDate').value);
      this.detailBeanExp = new ImpExpLicenseMtnBean();
      this.curAddOuExpLable = '';
      this.curAddOOuExpLable = '';
      this.curVcOuExpLable = '';
    }

    this.displayDetailExp = true;
    this.formSubmittedExp = false;
  }

  showFilterImp() {
    this.displayFilterImp = true;
  }

  showFilterExp() {
    this.displayFilterExp = true;
  }

  resetBtnClick() {
    this.displayResultImp = false;
    this.composeQueryReq();
    this.firstImp = 0;
    this.sortFieldImp = undefined;
    this.sortOrderImp = undefined;
    this.displayResultExp = false;
    this.firstExp = 0;
    this.sortFieldExp = undefined;
    this.sortOrderExp = undefined;
  }

  /**
   * 進口
   */
  searchBtnClickImp(): void {
    this.tableStatusKeepService.resetPageEvent();
    this.composeAutoCompleteReq();
    if (this.displayResultImp) {
      this.resetLazySort();
    } else {
      setTimeout(() => {
        this.displayResultImp = true;
      });
    }
  }

  /**
   * 出口
   */
  searchBtnClickExp(): void {
    this.tableStatusKeepService.resetPageEvent();
    this.composeAutoCompleteReqExp();
    if (this.displayResultExp) {
      this.resetLazySortExp();
    } else {
      setTimeout(() => {
        this.displayResultExp = true;
      });
    }
  }

  /**
   * 下載按鈕 click 事件(共用)
   */
  downloadBtnClick(downloadType: string): void {
    let model = {};
    if (downloadType === 'downloadImport') {
      this.queryReq.licenseType = 'IMPORT';
      model = this.queryReq;
    } else if (downloadType === 'downloadExport') {
      this.queryReqExp.licenseType = 'EXPORT';
      model = this.queryReqExp;
    } else {
      return;
    }
    // console.log('model: ', model);
    this.loaderService.show();
    this.licenseControlApiService
      .downloadLazyLicenseMasterByConditions(model)
      .subscribe({
        next: (rsp) => {
          this.commonApiService.downloadFile(rsp.fileId);
          this.loaderService.hide();
        },
        error: (e) => {
          console.error(e);
          this.loaderService.hide();
          this.toastService.error('System.Message.Error');
        },
      });
  }

  composeQueryReq() {
    this.queryReq = new ImpExpLicenseMtnQueryRequest();
    this.queryReq.flag = 'Y';
    // let myDate = new Date();
    // this.queryReq.endDate = new Date(myDate.getUTCFullYear(), myDate.getUTCMonth(), myDate.getUTCDate());
    // this.queryReq.startDate = new Date(this.queryReq.endDate.getFullYear(), this.queryReq.endDate.getMonth(), this.queryReq.endDate.getDate() - 31);
    this.queryReqExp = new ImpExpLicenseMtnQueryRequest();
    this.queryReqExp.flag = 'Y';
    // this.queryReqExp.endDate = new Date(myDate.getUTCFullYear(), myDate.getUTCMonth(), myDate.getUTCDate());
    // this.queryReqExp.startDate = new Date(this.queryReq.endDate.getFullYear(), this.queryReq.endDate.getMonth(), this.queryReq.endDate.getDate() - 31);
    this.queryReq.permissions = this.permissions;
    this.queryReqExp.permissions = this.permissions;
    this.queryReq.customerVendorType = 'Vendor';
    this.queryReqExp.customerVendorType = 'Customer';
    this.queryReq.itemFilterType = 'Include';
    this.queryReqExp.itemFilterType = 'Include';
    this.curCVLable = '';
    this.curCVLableExp = '';
    this.curOOULable = '';
    this.curOULable = '';
    this.curOOULableExp = '';
    this.curOULableExp = '';
    this.curCVLable = '';
    this.curCVLableExp = '';
  }

  composeAutoCompleteReq() {
    this.queryReq.licenseType = 'IMPORT';
  }

  composeAutoCompleteReqExp() {
    this.queryReqExp.licenseType = 'EXPORT';
  }

  resetLazySort() {
    this.lazyTableImp.sortOrder = undefined;
    this.lazyTableImp.sortField = undefined;
    this.lazyTableImp.first = 0;
    this.lazyTableImp.rows = 10;
    this.lazyTableImp.reset();
  }

  resetLazySortExp() {
    this.lazyTableExp.sortOrder = undefined;
    this.lazyTableExp.sortField = undefined;
    this.lazyTableExp.first = 0;
    this.lazyTableExp.rows = 10;
    this.lazyTableExp.reset();
  }

  async onLazyLoadImp(event: LazyLoadEvent) {
    await this.tableStatusKeepService.delay(1);

    event.first = this.tableStatusKeepService.get(this.tableStatusKeepService.tableStatusKeepEnum.PageEvent)?.first;
    event.rows = this.tableStatusKeepService.get(this.tableStatusKeepService.tableStatusKeepEnum.PageEvent)?.rows;
    this.queryReq.lazyLoadEvent = event;
    if (
      event &&
      event.sortField &&
      this.lazyTableImp &&
      this.dataImp &&
      (event.sortField !== this.sortFieldImp ||
        event.sortOrder !== this.sortOrderImp)
    ) {
      this.dataImp = this.sortArrayData(
        this.dataImp,
        event.sortField,
        event.sortOrder
      );
      this.lazyTableImp.first = this.firstImp;
      return;
    }
    setTimeout(() => {
      this.loaderService.show();
      const impReq = {
        ...this.queryReq,
        customerVendorType:
        ( this.queryReq.licenseNo ||
          this.queryReq.formNo ||
          this.queryReq.item ||
          this.queryReq.trxReferenceNo ) &&
          !this.queryReq.customerVendorCode
            ? ''
            : this.queryReq.customerVendorType,
      };

       this.licenseControlApiService.getLazyLicenseMasterByConditions(impReq).subscribe({
            next: (rsp) => {
            this.dataImp = rsp.resultList;
            this.cloneDataImp = rsp.resultList;
            this.filterLazyImp(this.globalFilterImp);
            this.totalRecordsImp = rsp.totalRecords;
            this.displayResultImp = true;
            this.loaderService.hide();
            this.dataImp = this.sortArrayData(
              this.dataImp,
              event.sortField,
              event.sortOrder
            );
          },
          error: (e) => {
            console.error(e);
            this.loaderService.hide();
            this.toastService.error('System.Message.Error');
          },
        });
    });
  }

  async onLazyLoadExp(event: LazyLoadEvent) {
    await this.tableStatusKeepService.delay(1);

    event.first = this.tableStatusKeepService.get(this.tableStatusKeepService.tableStatusKeepEnum.PageEvent)?.first;
    event.rows = this.tableStatusKeepService.get(this.tableStatusKeepService.tableStatusKeepEnum.PageEvent)?.rows;
    this.queryReqExp.lazyLoadEvent = event;
    if (
      event &&
      event.sortField &&
      this.lazyTableExp &&
      this.dataExp &&
      (event.sortField !== this.sortFieldExp ||
        event.sortOrder !== this.sortOrderExp)
    ) {
      this.dataExp = this.sortArrayData(
        this.dataExp,
        event.sortField,
        event.sortOrder
      );
      this.lazyTableExp.first = this.firstExp;
      return;
    }

    setTimeout(() => {
      this.loaderService.show();
      const expReq = {
        ...this.queryReqExp,
        customerVendorType:
        ( this.queryReqExp.licenseNo ||
          this.queryReqExp.formNo ||
          this.queryReqExp.item ||
          this.queryReqExp.trxReferenceNo ) &&
          !this.queryReqExp.customerVendorCode
            ? ''
            : this.queryReqExp.customerVendorType,
      };

      this.licenseControlApiService.getLazyLicenseMasterByConditions(expReq).subscribe({
		  next: (rsp) => {
            this.dataExp = rsp.resultList;
            this.cloneDataExp = rsp.resultList;
            this.filterLazyExp(this.globalFilterExp);
            this.totalRecordsExp = rsp.totalRecords;
            this.displayResultExp = true;
            this.loaderService.hide();
            this.dataExp = this.sortArrayData(
              this.dataExp,
              event.sortField,
              event.sortOrder
            );
          },
          error: (e) => {
            console.error(e);
            this.loaderService.hide();
            this.toastService.error('System.Message.Error');
          },
        });
    });
  }

  onSortImp(event) {
    this.sortFieldImp = event.field;
    this.sortOrderImp = event.order;
  }

  onPageImp(event) {
    this.tableStatusKeepService.keep(this.tableStatusKeepService.tableStatusKeepEnum.PageEvent,event);
    this.firstImp = event.first;
  }

  onPageExp(event) {
    this.tableStatusKeepService.keep(this.tableStatusKeepService.tableStatusKeepEnum.PageEvent,event);
    this.firstExp = event.first;
  }

  sortArrayData(arrayData: any[], field: string, sort: number) {
    if (arrayData && field && sort) {
      if (sort && sort == 1) {
        return arrayData.sort((a, b) =>
          (a[field] != null ? a[field] : '') <
          (b[field] != null ? b[field] : '')
            ? -1
            : 1
        );
      } else {
        return arrayData.sort((a, b) =>
          (a[field] != null ? a[field] : '') >
          (b[field] != null ? b[field] : '')
            ? -1
            : 1
        );
      }
    }
    return arrayData;
  }

  filterLazyImp(globalFilter: string) {
    this.dataImp = [];
    for (var i = 0; i < this.cloneDataImp.length; i++) {
      for (var j = 0; j < this.selectedColsImp.length; j++) {
        try {
          if (this.cloneDataImp[i][this.selectedColsImp[j].field] === undefined)
            continue;
          var value = this.cloneDataImp[i][this.selectedColsImp[j].field];
          if (value.toLowerCase().indexOf(globalFilter.toLowerCase()) !== -1) {
            this.dataImp.push(this.cloneDataImp[i]);
            break;
          }
        } catch (e) {
          console.log(e);
        }
      }
    }
    return;
  }

  filterLazyExp(globalFilter: string) {
    this.dataExp = [];
    for (var i = 0; i < this.cloneDataExp.length; i++) {
      for (var j = 0; j < this.selectedColsExp.length; j++) {
        try {
          if (this.cloneDataExp[i][this.selectedColsExp[j].field] === undefined)
            continue;
          var value = this.cloneDataExp[i][this.selectedColsExp[j].field];
          if (value.toLowerCase().indexOf(globalFilter?.toLowerCase()) !== -1) {
            this.dataExp.push(this.cloneDataExp[i]);
            break;
          }
        } catch (e) {
          console.log(e);
        }
      }
    }
    return;
  }

  onBlurProductCode(event) {
    // 沒選autoComplete的話.清空input內容
    setTimeout(() => {
      // 先讓onSelect執行 而不是blur
      if (
        this.editFormImp.get('product').value === undefined ||
        this.editFormImp.get('product').value?.code === undefined
      ) {
        this.editFormImp.get('product').setValue('');
        this.detailBeanImp.product = undefined;
      }
    }, 300);
  }

  onBlurProductCodeExp(event) {
    // 沒選autoComplete的話.清空input內容
    setTimeout(() => {
      // 先讓onSelect執行 而不是blur
      if (
        this.editFormExp.get('product').value === undefined ||
        this.editFormExp.get('product').value?.code === undefined
      ) {
        this.editFormExp.get('product').setValue('');
        this.detailBeanExp.product = undefined;
      }
    }, 300);
  }

  async onSelectProductCode() {
    let product = this.editFormImp.get('product').value;
    if (product === undefined) {
      this.detailBeanImp.product = undefined;
      return;
    }
    this.detailBeanImp.product = product;
    let invItemNos = [];
    invItemNos.push(this.detailBeanImp.product.code);
    let rsp = await lastValueFrom(
      this.commonApiService.queryItemMasterByInvItemNos(invItemNos)
    );
    let itemMasterList = rsp.itemMasterList;
    if (itemMasterList !== undefined && itemMasterList.length > 0) {
      this.editFormImp
        .get('ccats')
        .setValue(itemMasterList[0]?.ccats ? itemMasterList[0].ccats : '');
      this.detailBeanImp.eccn = itemMasterList[0]?.eccn
        ? itemMasterList[0].eccn
        : '';
      this.detailBeanImp.proviso = itemMasterList[0]?.proviso
        ? itemMasterList[0].proviso
        : '';
    }
  }

  async onSelectProductCodeExp() {
    let product = this.editFormExp.get('product').value;
    if (product === undefined) {
      this.detailBeanExp.product = undefined;
      return;
    }
    this.detailBeanExp.product = product;
    let invItemNos = [];
    invItemNos.push(this.detailBeanExp.product.code);
    let rsp = await lastValueFrom(
      this.commonApiService.queryItemMasterByInvItemNos(invItemNos)
    );
    let itemMasterList = rsp.itemMasterList;
    if (itemMasterList !== undefined && itemMasterList.length > 0) {
      this.editFormExp
        .get('ccats')
        .setValue(itemMasterList[0]?.ccats ? itemMasterList[0].ccats : '');
      this.detailBeanExp.eccn = itemMasterList[0]?.eccn
        ? itemMasterList[0].eccn
        : '';
      this.detailBeanExp.proviso = itemMasterList[0]?.proviso
        ? itemMasterList[0].proviso
        : '';
    }
  }

  async filterProductCode(event) {
    let filtered: any[] = [];
    let query = event.query;

    let rsp = await lastValueFrom(
      this.commonApiService.activeProductQueryByPrefix(query)
    );
    for (var product of rsp.productList) {
      filtered.push(product);
    }

    this.filteredEditProductCode = filtered;
  }

  async filterProductCodeExp(event) {
    let filtered: any[] = [];
    let query = event.query;

    let rsp = await lastValueFrom(
      this.commonApiService.activeProductQueryByPrefix(query)
    );
    for (var product of rsp.productList) {
      filtered.push(product);
    }

    this.filteredEditProductCodeExp = filtered;
  }

  onHideDetailDialog(event: any) {
    this.initCheckValue();
    this.editFormImp.reset();
  }

  onHideDetailDialogExp(event: any) {
    this.initCheckValue();
    this.editFormExp.reset();
  }

  initCheckValue() {
    this.editFormImpQtyMustBeGE = false;
    this.editFormImpQty = 0;
    this.editFormExpQtyMustBeGE = false;
    this.editFormExpQty = 0;
    this.editFormImpPriceMustBeGE = false;
    this.editFormImpPrice = 0;
    this.editFormExpPriceMustBeGE = false;
    this.editFormExpPrice = 0;
    this.editFormImpEndDateMustBeLater = false;
    this.editFormExpEndDateMustBeLater = false;
  }

  cancelDetail() {
    this.displayDetailImp = false;
    this.formSubmitted = false;
    this.editFormImp.reset();
  }

  cancelDetailExp() {
    this.displayDetailExp = false;
    this.formSubmittedExp = false;
    this.editFormExp.reset();
  }

  saveDetail() {
    this.formSubmitted = true;
    if (this.editFormImp.invalid) {
      return;
    }
    //檢查Price
    let price = parseFloat(this.editFormImp.get('price').value);
    this.editFormImpPriceMustBeGE = false;
    if (this.editFormImp.get('price').value === null || price < 0.0) {
      this.editFormImpPriceMustBeGE = true;
      return;
    }
    //檢查Quanty > 0
    let quanty = parseFloat(this.editFormImp.get('quantity').value);
    this.editFormImpQtyMustBeGE = false;
    this.editFormImpQty = 0;
    if (this.editFormImp.get('quantity').value === null || quanty <= 0) {
      this.editFormImpQtyMustBeGE = true;
      return;
    }
    this.editFormImp.get('quantity').setValue(quanty);
    //若是編輯，檢查Quanty是否 >= usedQuantity
    if (
      this.isEdit &&
      this.editFormImp.get('quantity').value < this.detailBeanImp.usedQuantity
    ) {
      this.editFormImpQtyMustBeGE = true;
      this.editFormImpQty = this.detailBeanImp.usedQuantity;
      return;
    }
    //檢查StartDate、EndDate
    this.editFormImpEndDateMustBeLater = false;
    if (
      this.editFormImp.get('startDate').value >
      this.editFormImp.get('endDate').value
    ) {
      this.editFormImpEndDateMustBeLater = true;
      return;
    }

    // product code || ccats 則一必填
    if (
      !this.editFormImp.get('product').value &&
      !this.editFormImp.get('ccats').value
    ) {
      return;
    }

    let modifyReq = new ImpExpLicenseMtnModifyRequest();
    modifyReq.action = 'ADD';
    modifyReq.userEmail = this.userContextService.user$.getValue().userEmail;
    modifyReq.tenant = this.userContextService.user$.getValue().tenant;
    modifyReq.detail = this.detailBeanImp;
    modifyReq.detail.tenant = this.userContextService.user$.getValue().tenant;
    modifyReq.detail.licenseType = 'IMPORT';
    modifyReq.detail.ieType = 'I';
    modifyReq.detail.displayStartDate = this.editFormImp.get('startDate').value;
    modifyReq.detail.displayEndDate = this.editFormImp.get('endDate').value;
    modifyReq.detail.price = this.editFormImp.get('price').value;
    modifyReq.detail.quantity = this.editFormImp.get('quantity').value;
    modifyReq.detail.vcType = this.editFormImp.get('vcType').value;
    // modifyReq.detail.productCode = this.editFormImp.get('productCode').value;
    modifyReq.detail.shipFromAddress =
      this.editFormImp.get('shipFromAddress').value;
    modifyReq.detail.scFlag = this.editFormImp.get('scFlag').value;
    modifyReq.detail.activeFlag = this.editFormImp.get('activeFlag').value;
    modifyReq.detail.endUser = this.editFormImp.get('endUser').value;
    modifyReq.detail.remark = this.editFormImp.get('remark').value;
    modifyReq.detail.licenseNo = this.editFormImp.get('licenseNo').value;
    modifyReq.detail.countryCode = this.editFormImp.get('countryCode').value;
    modifyReq.detail.ccats = this.editFormImp.get('ccats').value;
    if (this.isEdit) {
      modifyReq.action = 'EDIT';
    }
    console.log('modifyReq: ', modifyReq);
    this.licenseControlApiService.licenseMasterImpModify(modifyReq).subscribe({
      next: (rsp) => {
        if (rsp.code === ResponseCodeEnum.LICENSEMASTER_ALREADY_EXISTS) {
          this.toastService.error(
            'ImpExpLicenseMtn.Message.LicenseMasterExists'
          );
          return;
        }
        this.displayResultImp = false;
        if (this.isEdit) {
          this.toastService.success('ImpExpLicenseMtn.Message.EditSuccess');
        } else {
          this.toastService.success('ImpExpLicenseMtn.Message.AddSuccess');
        }
        setTimeout(() => {
          this.displayResultImp = true;
        });
        this.loaderService.hide();
        this.displayDetailImp = false;
        this.formSubmitted = false;
        this.editFormImp.reset();
      },
      error: (rsp) => {
        console.log(rsp);
        if (rsp?.status == 500 && rsp.error?.code) {
          this.toastService.error(rsp.error?.message);
        } else {
          this.toastService.error('System.Message.Error');
        }
        this.loaderService.hide();
      },
    });
  }

  saveDetailExp() {
    this.formSubmittedExp = true;
    console.log(this.editFormExp);
    if (this.editFormExp.invalid) {
      return;
    }
    //檢查Price
    let price = parseFloat(this.editFormExp.get('price').value);
    this.editFormExpPriceMustBeGE = false;
    if (this.editFormExp.get('price').value === null || price < 0.0) {
      this.editFormExpPriceMustBeGE = true;
      return;
    }
    //檢查Quanty > 0
    let quanty = parseFloat(this.editFormExp.get('quantity').value);
    this.editFormExpQtyMustBeGE = false;
    this.editFormExpQty = 0;
    if (this.editFormExp.get('quantity').value === null || quanty <= 0) {
      this.editFormExpQtyMustBeGE = true;
      return;
    }
    this.editFormExp.get('quantity').setValue(quanty);
    //若是編輯，檢查Quanty是否 >= usedQuantity
    if (
      this.isEditExp &&
      this.editFormExp.get('quantity').value < this.detailBeanExp.usedQuantity
    ) {
      this.editFormExpQtyMustBeGE = true;
      this.editFormExpQty = this.detailBeanExp.usedQuantity;
      return;
    }
    //檢查StartDate、EndDate
    this.editFormExpEndDateMustBeLater = false;
    if (
      this.editFormExp.get('startDate').value >
      this.editFormExp.get('endDate').value
    ) {
      this.editFormExpEndDateMustBeLater = true;
      return;
    }

    // product code || ccats 則一必填
    if (
      !this.editFormExp.get('product').value &&
      !this.editFormExp.get('ccats').value
    ) {
      return;
    }

    let modifyReq = new ImpExpLicenseMtnModifyRequest();
    modifyReq.action = 'ADD';
    modifyReq.userEmail = this.userContextService.user$.getValue().userEmail;
    modifyReq.tenant = this.userContextService.user$.getValue().tenant;
    modifyReq.detail = this.detailBeanExp;
    modifyReq.detail.tenant = this.userContextService.user$.getValue().tenant;
    modifyReq.detail.licenseType = 'EXPORT';
    modifyReq.detail.ieType = 'E';
    modifyReq.detail.displayStartDate = this.editFormExp.get('startDate').value;
    modifyReq.detail.displayEndDate = this.editFormExp.get('endDate').value;
    modifyReq.detail.price = this.editFormExp.get('price').value;
    modifyReq.detail.quantity = this.editFormExp.get('quantity').value;
    modifyReq.detail.vcType = this.editFormExp.get('vcType').value;
    // modifyReq.detail.productCode = this.editFormExp.get('productCode').value;
    // modifyReq.detail.shipFromAddress = this.editFormExp.get('shipFromAddress').value;
    modifyReq.detail.shipToAddress =
      this.editFormExp.get('shipToAddress').value;
    modifyReq.detail.activeFlag = this.editFormExp.get('activeFlag').value;
    modifyReq.detail.deliveryNo = this.editFormExp.get('deliveryNo').value;
    modifyReq.detail.endUseRmk = this.editFormExp.get('endUseRmk').value;
    modifyReq.detail.endUser = this.editFormExp.get('endUser').value;
    modifyReq.detail.endUserAddress =
      this.editFormExp.get('endUserAddress').value;
    modifyReq.detail.remark = this.editFormExp.get('remark').value;
    modifyReq.detail.licenseNo = this.editFormExp.get('licenseNo').value;
    modifyReq.detail.countryCode = this.editFormExp.get('countryCode').value;
    modifyReq.detail.deliveryToAddress =
      this.editFormExp.get('deliverToAddress').value;
    modifyReq.detail.ccats = this.editFormExp.get('ccats').value;
    if (this.isEditExp) {
      modifyReq.action = 'EDIT';
    }
    console.log('modifyReq: ', modifyReq);
    this.licenseControlApiService.licenseMasterImpModify(modifyReq).subscribe({
      next: (rsp) => {
        if (rsp.code === ResponseCodeEnum.LICENSEMASTER_ALREADY_EXISTS) {
          this.toastService.error(
            'ImpExpLicenseMtn.Message.LicenseMasterExists'
          );
          return;
        }
        this.displayResultExp = false;
        if (this.isEditExp) {
          this.toastService.success('ImpExpLicenseMtn.Message.EditSuccess');
        } else {
          this.toastService.success('ImpExpLicenseMtn.Message.AddSuccess');
        }
        setTimeout(() => {
          this.displayResultExp = true;
        });
        this.loaderService.hide();
        this.displayDetailExp = false;
        this.formSubmittedExp = false;
        this.editFormExp.reset();
      },
      error: (rsp) => {
        console.log(rsp);
        if (rsp?.status == 500 && rsp.error?.code) {
          this.toastService.error(rsp.error?.message);
        } else {
          this.toastService.error('System.Message.Error');
        }
        this.loaderService.hide();
      },
    });
  }

  clickDeleteImp(impData) {
    this.delSeqImp = impData.seq;
    this.displayDelDialogImp = true;
  }

  clickDeleteExp(expData) {
    this.delSeqExp = expData.seq;
    this.displayDelDialogExp = true;
  }

  deleteImp() {
    if (this.delSeqImp) {
      this.loaderService.show();
      this.licenseControlApiService.licenseMasterImpDelete(this.delSeqImp).subscribe({
        next: rsp => {
          this.displayResultImp = false;
          this.toastService.success('ImpExpLicenseMtn.Message.DelSuccess');
          setTimeout(() => {
            this.displayResultImp = true;
          });
        },
        error: rsp => {
          console.log(rsp);
          this.toastService.error('System.Message.Error');
        }
      })
        .add(() => {
          this.loaderService.hide();
        });
      this.loaderService.hide();
    }
    this.displayDelDialogImp = false;
  }

  deleteExp() {
    if (this.delSeqExp) {
      this.loaderService.show();
      this.licenseControlApiService.licenseMasterImpDelete(this.delSeqExp).subscribe({
        next: rsp => {
          this.displayResultExp = false;
          this.toastService.success('ImpExpLicenseMtn.Message.DelSuccess');
          setTimeout(() => {
            this.displayResultExp = true;
          });
        },
        error: rsp => {
          console.log(rsp);
          this.toastService.error('System.Message.Error');
        }
      })
        .add(() => {
          this.loaderService.hide();
        });
      this.loaderService.hide();
    }
    this.displayDelDialogExp = false;
  }

  async getCountryCode() {
    let currentCountryCode = this.queryReq.countryCode;
    let tenant = this.userContextService.user$.getValue().tenant;
    let tenantPermissionList = [];
    tenantPermissionList.push(tenant);
    let model = {
      msgFrom: 'ImportLicenseMtn',
      trackingId: 'IMPLicense',
      tenantPermissionList: tenantPermissionList,
      ruleId: 'IMPLicense',
    };
    let rsp = await lastValueFrom(this.commonApiService.queryRuleSetup(model));
    for (var rule of rsp.ruleList) {
      if (rule.flag === 'Y') {
        this.countryCodeOptions.push({
          label:
            this.translateService.currentLang === 'zh-tw'
              ? rule.rulesCategoryRuleItemCn
              : rule.rulesCategoryRuleItemEn,
          value: rule.ruleCode,
        });
      }
      this.countryCodeAllOptions.push({
        label:
          this.translateService.currentLang === 'zh-tw'
            ? rule.rulesCategoryRuleItemCn
            : rule.rulesCategoryRuleItemEn,
        value: rule.ruleCode,
      });
    }
    this.queryReq.countryCode = currentCountryCode;
  }
  async getCountryCodeExp() {
    let currentCountryCodeExp = this.queryReqExp.countryCode;
    let tenant = this.userContextService.user$.getValue().tenant;
    let tenantPermissionList = [];
    tenantPermissionList.push(tenant);
    let model = {
      msgFrom: 'ExportLicenseMtn',
      trackingId: 'EXPLicense',
      tenantPermissionList: tenantPermissionList,
      ruleId: 'EXPLicense',
    };
    let rsp = await lastValueFrom(this.commonApiService.queryRuleSetup(model));
    for (var rule of rsp.ruleList) {
      if (rule.flag === 'Y') {
        this.countryCodeExpOptions.push({
          label:
            this.translateService.currentLang === 'zh-tw'
              ? rule.rulesCategoryRuleItemCn
              : rule.rulesCategoryRuleItemEn,
          value: rule.ruleCode,
        });
      }
      this.countryCodeExpAllOptions.push({
        label:
          this.translateService.currentLang === 'zh-tw'
            ? rule.rulesCategoryRuleItemCn
            : rule.rulesCategoryRuleItemEn,
        value: rule.ruleCode,
      });
    }
    this.queryReqExp.countryCode = currentCountryCodeExp;
  }

  viewArea(productCode: string) {
    this.displayArea = true;

    if (productCode) {
      this.loaderService.show();
      let model = {
        tenant: this.userContextService.user$.getValue().tenant,
        productCode: productCode,
      };
      this.licenseControlApiService
        .getItemEccn(model)
        .subscribe({
          next: (rsp) => {
            this.getItemEccnRsp = rsp;
          },
          error: (rsp) => {
            console.log(rsp);
            this.toastService.error('System.Message.Error');
          },
        })
        .add(() => {
          this.loaderService.hide();
        });
      this.loaderService.hide();
    }
  }

  historyCcats: string = null;
  viewHistory(data) {
    //# BI-31169-TK-31171
    //# add formNo key
    let model = {
      tenant: this.userContextService.user$.getValue().tenant,
      licenseType: data.licenseType,
      licenseNo: data.licenseNo,
      ouCode: data.ouCode,
      ouGroup: data.ouGroup,
      vcNo: data.vcNo,
      productCode: data.productCode,
      ccats:data.ccats,
      formNo:data.formNo
    };
    this.historyCcats = data.ccats;

    this.loaderService.show();
    this.licenseControlApiService
      .queryLicenseHistory(model)
      .subscribe({
        next: (rsp) => {
          this.licenseHistoryRsp = rsp;
          this.displayHistory = true;
        },
        error: (rsp) => {
          console.log(rsp);
          this.toastService.error('System.Message.Error');
        },
      })
      .add(() => {
        this.loaderService.hide();
      });
  }

  onChangeVCType(event) {
    this.customerVendorCode = undefined;
    this.queryReq.customerVendorCode = undefined;
    this.curCVLable = '';
  }

  onChangeVCTypeExp(event) {
    this.customerVendorCodeExp = undefined;
    this.queryReqExp.customerVendorCode = undefined;
    this.curCVLableExp = '';
  }

  onChangeEditVCType(event) {
    this.editFormImp.get('vcOu').setValue('');
    this.detailBeanImp.vcOu = undefined;
    this.curVcOuLable = '';
  }

  onChangeEditVCTypeExp(event) {
    this.editFormExp.get('vcOu').setValue('');
    this.detailBeanExp.vcOu = undefined;
    this.curVcOuExpLable = '';
  }

  onSelectEndUserExp() {
    let endUserOu = this.editFormExp.get('endUserOu').value;
    if (endUserOu === undefined) {
      this.detailBeanExp.endUserOu = undefined;
      return;
    }
    if (this.detailBeanExp.endUserOu === undefined) {
      this.detailBeanExp.endUserOu = {};
    }
    this.detailBeanExp.endUserOu.ouCode = endUserOu.code;
    this.detailBeanExp.endUserOu.ouName = endUserOu.vcName;
    this.detailBeanExp.endUserOu.displayOu = endUserOu.displayOu;
  }

  async filterEndUserExp(event) {
    let filtered: any[] = [];

    let query = event.query;
    let rsp = await lastValueFrom(
      this.commonApiService.customerQueryByPrefix(query)
    );
    for (var customer of rsp.customerList) {
      var customerVendor = {
        code: customer.customerNo,
        displayOu:
          customer.customerNo +
          '_' +
          customer.customerName +
          '(' +
          customer.customerNameEg +
          ')',
        vcName: customer.customerName,
        vcNameEng: customer.customerNameEg,
      };
      filtered.push(customerVendor);
    }
    this.filteredEditEndUserExp = filtered;
  }

  onBlurEndUserExp(event) {
    // 沒選autoComplete的話.清空input內容
    if (
      this.editFormExp.get('endUserOu').value === undefined ||
      this.editFormExp.get('endUserOu').value.code === undefined
    ) {
      this.editFormExp.get('endUserOu').setValue('');
      this.detailBeanExp.endUserOu = undefined;
    }
  }

  async filterShipFromAddress(event) {
    let filtered: any[] = [];
    this.shipFromAddressOuCodeAndVcNoRequired = false;
    let vcOu = this.editFormImp.get('vcOu').value;
    let addOu = this.editFormImp.get('addOu').value;
    console.log('vcOu: ', vcOu);
    if (vcOu === undefined || vcOu === '') {
      this.shipFromAddressOuCodeAndVcNoRequired = true;
      this.shipFromAddressResult = filtered;
    } else if (addOu === undefined || addOu === '') {
      this.shipFromAddressOuCodeAndVcNoRequired = true;
      this.shipFromAddressResult = filtered;
    } else {
      let model = {
        tenant: this.userContextService.user$.getValue().tenant,
        vcType: this.editFormImp.get('vcType').value,
        vcNo: vcOu.customerNo
          ? vcOu.customerNo
          : vcOu.vendorCode
          ? vcOu.vendorCode
          : vcOu.ouCode,
        ouCode: addOu.ouCode,
        keyword: event.query,
      };
      let rsp = await lastValueFrom(
        this.licenseControlApiService.shipFromAddressQueryByPrefix(model)
      );
      filtered = rsp.addressList;
      this.shipFromAddressResult = filtered;
    }
  }

  onBlurShipFromAddress(event) {}

  async onSelectShipFromAddress() {}

  async filterShipFromAddressExp(event) {
    let filtered: any[] = [];
    this.shipFromAddressOuCodeAndVcNoRequiredExp = false;
    let vcOu = this.editFormExp.get('vcOu').value;
    let addOu = this.editFormExp.get('addOu').value;
    if (vcOu === undefined || vcOu === '') {
      this.shipFromAddressOuCodeAndVcNoRequiredExp = true;
      this.shipFromAddressResultExp = filtered;
    } else if (addOu === undefined || addOu === '') {
      this.shipFromAddressOuCodeAndVcNoRequiredExp = true;
      this.shipFromAddressResultExp = filtered;
    } else {
      let model = {
        tenant: this.userContextService.user$.getValue().tenant,
        vcType: this.editFormExp.get('vcType').value,
        vcNo: vcOu.customerNo
          ? vcOu.customerNo
          : vcOu.vendorCode
          ? vcOu.vendorCode
          : vcOu.ouCode,
        ouCode: addOu.ouCode,
        keyword: event.query,
      };
      let rsp = await lastValueFrom(
        this.licenseControlApiService.shipFromAddressQueryByPrefix(model)
      );
      filtered = rsp.addressList;
      this.shipFromAddressResultExp = filtered;
    }
  }

  onBlurShipFromAddressExp(event) {}

  async onSelectShipFromAddressExp() {}

  async filterShipToAddressExp(event) {
    let filtered: any[] = [];
    this.shipToAddressOuCodeAndVcNoRequiredExp = false;
    let vcOu = this.editFormExp.get('vcOu').value;
    let addOu = this.editFormExp.get('addOu').value;
    if (vcOu === undefined || vcOu === '') {
      this.shipToAddressOuCodeAndVcNoRequiredExp = true;
      this.shipToAddressResultExp = filtered;
    } else if (addOu === undefined || addOu === '') {
      this.shipToAddressOuCodeAndVcNoRequiredExp = true;
      this.shipToAddressResultExp = filtered;
    } else {
      let model = {
        tenant: this.userContextService.user$.getValue().tenant,
        custNo: vcOu.vendorCode
          ? vcOu.vendorCode
          : vcOu.customerNo
          ? vcOu.customerNo
          : vcOu.ouCode,
        ouCode: addOu.ouCode,
        keyword: event.query,
      };
      let rsp = await lastValueFrom(
        this.commonApiService.customerShipToAddressQueryByPrefix(model)
      );
      for (var address of rsp.addressList) {
        filtered.push(address.addressLineCn);
      }
      this.shipToAddressResultExp = filtered;
    }
  }

  onBlurDeliverToAddressExp(event) {}

  async onSelectDeliverToAddressExp() {}

  async filterDeliverToAddressExp(event) {
    let filtered: any[] = [];
    this.deliverToAddressOuCodeAndVcNoRequiredExp = false;
    let vcOu = this.editFormExp.get('vcOu').value;
    let addOu = this.editFormExp.get('addOu').value;
    if (vcOu === undefined || vcOu === '') {
      this.deliverToAddressOuCodeAndVcNoRequiredExp = true;
      this.deliverToAddressResultExp = filtered;
    } else if (addOu === undefined || addOu === '') {
      this.deliverToAddressOuCodeAndVcNoRequiredExp = true;
      this.deliverToAddressResultExp = filtered;
    } else {
      let model = {
        tenant: this.userContextService.user$.getValue().tenant,
        custNo: vcOu.vendorCode
          ? vcOu.vendorCode
          : vcOu.customerNo
          ? vcOu.customerNo
          : vcOu.ouCode,
        ouCode: addOu.ouCode,
        keyword: event.query,
      };
      let rsp = await lastValueFrom(
        this.commonApiService.customerDeliverToAddressQueryByPrefix(model)
      );
      for (var address of rsp.addressList) {
        if (this.translateService.currentLang == 'zh-tw') {
          filtered.push(address.addressLineCn);
        } else {
          filtered.push(address.addressLineEg);
        }
      }
      this.deliverToAddressResultExp = filtered;
    }
  }

  onBlurShipToAddressExp(event) {}

  async onSelectShipToAddressExp() {}

  //> open v/c selector dialog handler
  onOpenSelectorDialogEvent(licenseType: string, type: string): void {
    this.curSelectLicenseType = licenseType;
    this.curSelectType = type;
    console.log('curSelectLicenseType: ', this.curSelectLicenseType);
    console.log('curSelectType: ', this.curSelectType);

    let title = '';
    let titlePrefix: string = '';
    let searchType = '';

    if (this.translateService.currentLang == 'zh-tw') {
      titlePrefix = '選擇';
    } else {
      titlePrefix = 'Choose';
    }

    if (
      this.curSelectLicenseType === 'Import' ||
      this.curSelectLicenseType === 'EditImport'
    ) {
      if (this.curSelectType == SelectorItemType.ALLOOU) {
        title = `${titlePrefix} ${this.translateService.instant(
          'ImpExpLicenseMtn.Label.OOuCode'
        )}`;
        searchType = SelectorItemType.ALLOOU;
        console.log('title: ', title);
        console.log('searchType: ', searchType);
      } else if (this.curSelectType == SelectorItemType.ALLOU) {
        title = `${titlePrefix} ${this.translateService.instant(
          'ImpExpLicenseMtn.Label.OuCode'
        )}`;
        searchType = SelectorItemType.ALLOU;
      } else {
        if (this.curSelectLicenseType === 'Import') {
          if (this.queryReq.customerVendorType === 'Customer') {
            title = `${titlePrefix} Custormer`;
            searchType = SelectorItemType.ALLCUSTOMER;
          }
          if (this.queryReq.customerVendorType === 'Vendor') {
            title = `${titlePrefix} Vendor`;
            searchType = SelectorItemType.ALLVENDOR;
          }
        } else if (this.curSelectLicenseType === 'EditImport') {
          if (this.editFormImp.get('vcType').value === 'C') {
            title = `${titlePrefix} Custormer`;
            searchType = SelectorItemType.CUSTOMER;
          }
          if (this.editFormImp.get('vcType').value === 'V') {
            title = `${titlePrefix} Vendor`;
            searchType = SelectorItemType.VENDOR;
          }
        }
      }
    } else if (
      this.curSelectLicenseType === 'Export' ||
      this.curSelectLicenseType === 'EditExport'
    ) {
      if (this.curSelectType == SelectorItemType.ALLOOU) {
        title = `${titlePrefix} ${this.translateService.instant(
          'ImpExpLicenseMtn.Label.OOuCodeExp'
        )}`;
        searchType = SelectorItemType.ALLOOU;
      } else if (this.curSelectType == SelectorItemType.ALLOU) {
        title = `${titlePrefix} ${this.translateService.instant(
          'ImpExpLicenseMtn.Label.OuCodeExp'
        )}`;
        searchType = SelectorItemType.ALLOU;
      } else {
        if (this.curSelectLicenseType === 'Export') {
          if (this.queryReqExp.customerVendorType === 'Customer') {
            title = `${titlePrefix} Custormer`;
            searchType = SelectorItemType.ALLCUSTOMER;
          }
          if (this.queryReqExp.customerVendorType === 'Vendor') {
            title = `${titlePrefix} Vendor`;
            searchType = SelectorItemType.ALLVENDOR;
          }
        } else if (this.curSelectLicenseType === 'EditExport') {
          if (this.editFormExp.get('vcType').value === 'C') {
            title = `${titlePrefix} Custormer`;
            searchType = SelectorItemType.CUSTOMER;
          }
          if (this.editFormExp.get('vcType').value === 'V') {
            title = `${titlePrefix} Vendor`;
            searchType = SelectorItemType.VENDOR;
          }
        }
      }
    }

    this.selectorDialogParams = {
      title: title,
      type: searchType,
      visiable: true,
    };
    console.log('selectorDialogParams: ', this.selectorDialogParams);
  }

  //> open selector dialog callback event
  onSelectorDialogCallback(result: SelectItem<any>): void {
    console.log(result);
    if (this.curSelectLicenseType === 'Import') {
      if (this.curSelectType == SelectorItemType.ALLOOU) {
        this.queryReq.oouCode = result.value.ouCode;
        this.curOOULable = result.value.displayOu;
      } else if (this.curSelectType == SelectorItemType.ALLOU) {
        this.queryReq.ouCode = result.value.ouCode;
        this.curOULable = result.value.displayOu;
      } else {
        this.queryReq.customerVendorCode = result.value.customerNo
          ? result.value.customerNo
          : result.value.vendorCode;
        this.curCVLable = result.label;
      }
    } else if (this.curSelectLicenseType === 'Export') {
      if (this.curSelectType == SelectorItemType.ALLOOU) {
        this.queryReqExp.oouCode = result.value.ouCode;
        this.curOOULableExp = result.value.displayOu;
      } else if (this.curSelectType == SelectorItemType.ALLOU) {
        this.queryReqExp.ouCode = result.value.ouCode;
        this.curOULableExp = result.value.displayOu;
      } else {
        this.queryReqExp.customerVendorCode = result.value.customerNo
          ? result.value.customerNo
          : result.value.vendorCode;
        this.curCVLableExp = result.label;
      }
    } else if (this.curSelectLicenseType === 'EditImport') {
      if (this.curSelectType == SelectorItemType.ALLOOU) {
        this.detailBeanImp.addOOu = {
          ouCode: result.value.ouCode,
          displayOu: result.value.ouName,
        };
        this.editFormImp.get('addOOu').setValue(result.value);
        this.curAddOOuLable = result.value.displayOu;
        this.detailBeanImp.oouName = result.value.ouName;
      } else if (this.curSelectType == SelectorItemType.ALLOU) {
        this.detailBeanImp.addOu = {
          ouCode: result.value.ouCode,
          displayOu: result.value.ouName,
        };
        this.editFormImp.get('addOu').setValue(result.value);
        this.curAddOuLable = result.value.displayOu;
        this.detailBeanImp.ouName = result.value.ouName;
      } else {
        this.editFormImp.get('vcOu').setValue(result.value);
        this.detailBeanImp.vcOu = {
          ouCode: result.value?.customerNo
            ? result.value.customerNo
            : result.value.vendorCode,
          ouName: result.value?.customerName
            ? result.value.customerName
            : result.value.vendorName,
          ouNameEng: result.value?.customerNameEg
            ? result.value.customerNameEg
            : result.value.vendorEngName,
        };
        this.curVcOuLable = result.label;
      }
    } else if (this.curSelectLicenseType === 'EditExport') {
      if (this.curSelectType == SelectorItemType.ALLOOU) {
        this.detailBeanExp.addOOu = {
          ouCode: result.value.ouCode,
          displayOu: result.value.ouName,
        };
        this.editFormExp.get('addOOu').setValue(result.value);
        this.curAddOOuExpLable = result.value.displayOu;
        this.detailBeanExp.oouName = result.value.ouName;
      } else if (this.curSelectType == SelectorItemType.ALLOU) {
        this.detailBeanExp.addOu = {
          ouCode: result.value.ouCode,
          displayOu: result.value.ouName,
        };
        this.editFormExp.get('addOu').setValue(result.value);
        this.curAddOuExpLable = result.value.displayOu;
        this.detailBeanExp.ouName = result.value.ouName;
      } else {
        this.editFormExp.get('vcOu').setValue(result.value);
        this.detailBeanExp.vcOu = {
          ouCode: result.value?.customerNo
            ? result.value.customerNo
            : result.value.vendorCode,
          ouName: result.value?.customerName
            ? result.value.customerName
            : result.value.vendorName,
          ouNameEng: result.value?.customerNameEg
            ? result.value.customerNameEg
            : result.value.vendorEngName,
        };
        this.curVcOuExpLable = result.label;
      }
    }
  }

  onSelectorClean(licenseType: string, type: string) {
    if (licenseType === 'Import') {
      if (type == SelectorItemType.ALLOOU) {
        this.queryReq.oouCode = '';
        this.curOOULable = '';
      } else if (type == SelectorItemType.ALLOU) {
        this.queryReq.ouCode = '';
        this.curOULable = '';
      } else {
        this.queryReq.customerVendorCode = '';
        this.curCVLable = '';
      }
    } else if (licenseType === 'Export') {
      if (type == SelectorItemType.ALLOOU) {
        this.queryReqExp.oouCode = '';
        this.curOOULableExp = '';
      } else if (type == SelectorItemType.ALLOU) {
        this.queryReqExp.ouCode = '';
        this.curOULableExp = '';
      } else {
        this.queryReqExp.customerVendorCode = '';
        this.curCVLableExp = '';
      }
    }
  }

  processTableData(field: string, data: any) {
    if (
      field === 'ouCode' ||
      field === 'oouCode' ||
      field === 'productCode' ||
      field === 'ouGroup'
    ) {
      if (data[field] === '0') {
        return 'ALL';
      }
    } else if (field === 'vcType') {
      if (data[field] === 'V') {
        // return this.translateService.instant('ImpExpLicenseMtn.Label.Vendor');
        return 'Vendor';
      } else if (data[field] === 'C') {
        // return this.translateService.instant('ImpExpLicenseMtn.Label.Customer');
        return 'Customer';
      }
    } else if (field === 'countryCode') {
      let countryCodeOption = this.countryCodeAllOptions.filter(
        (x) => x.value === data.countryCode
      );
      if (countryCodeOption.length > 0) {
        return countryCodeOption[0]['label'];
      }
      return '';
    } else if (field === 'vcName') {
      if (this.translateService.currentLang !== 'zh-tw') {
        return data['vcNameE'];
      }
    } else if (field === 'startDate' || field === 'endDate') {
      return this.objectFormatService.DateFormat(data[field],'/');
    }
    return data[field];
  }
  processTableDataExp(field: string, data: any) {
    if (
      field === 'ouCode' ||
      field === 'oouCode' ||
      field === 'productCode' ||
      field === 'ouGroup'
    ) {
      if (data[field] === '0') {
        return 'ALL';
      }
    } else if (field === 'vcType') {
      if (data[field] === 'V') {
        // return this.translateService.instant('ImpExpLicenseMtn.Label.Vendor');
        return 'Vendor';
      } else if (data[field] === 'C') {
        // return this.translateService.instant('ImpExpLicenseMtn.Label.Customer');
        return 'Customer';
      }
    } else if (field === 'countryCode') {
      let countryCodeExpOption = this.countryCodeExpAllOptions.filter(
        (x) => x.value === data.countryCode
      );
      if (countryCodeExpOption.length > 0) {
        return countryCodeExpOption[0]['label'];
      }
      return '';
    } else if (field === 'vcName') {
      if (this.translateService.currentLang !== 'zh-tw') {
        return data['vcNameE'];
      }
    } else if (field === 'startDate' || field === 'endDate') {
      return this.objectFormatService.DateFormat(data[field],'/');
    }
    return data[field];
  }

  onChangeItemFilterType(licenseType: string): void {
    if (licenseType === 'Import') {
      if (this.queryReq.itemFilterType === 'Multi') {
        this.queryReq.item = '';
      } else {
        this.queryReq.items = [];
      }
    } else if (licenseType === 'Export') {
      if (this.queryReqExp.itemFilterType === 'Multi') {
        this.queryReqExp.item = '';
      } else {
        this.queryReqExp.items = [];
      }
    }
  }

  onChangeQty(event): void {
    if (event.value != null) {
      let quanty = parseFloat(event.value);
      if (quanty === 0) {
        event.originalEvent.target.value = '';
      }
    }
  }

  ngAfterContentChecked() {
    this.changeDetectorRef.detectChanges();
  }

  ngOnDestroy(): void {
    [this.onLangChange$].forEach((subscription: Subscription) => {
      if (subscription != null) subscription.unsubscribe();
    });
  }

  impMinDate = null;
  expMinDate = null;

  impProductOnClear() {
    this.editFormImp.get('product').setValue(null);
    this.editFormImp.get('ccats').setValue(null);
    this.detailBeanImp.product = undefined;
    this.detailBeanImp.eccn = '';
    this.detailBeanImp.ccats = '';
    this.detailBeanImp.proviso = '';
  }

  expProductOnClear() {
    this.editFormExp.get('product').setValue(null);
    this.editFormExp.get('ccats').setValue(null);
    this.detailBeanExp.product = undefined;
    this.detailBeanExp.eccn = '';
    this.detailBeanExp.ccats = '';
    this.detailBeanExp.proviso = '';
  }

  //#-----------------start------------------
  //# for date picker input format event
  onCheckDateHandler(type: 'imp' | 'exp'): void {
    if(type==='imp'){
      if (
        new Date(
          new Date(this.queryReq.startDate).setHours(0, 0, 0, 0)
        ).getTime() >=
        new Date(
          new Date(this.queryReq.endDate).setHours(23, 59, 59, 0)
        ).getTime()
      ) {
        this.queryReq.endDate = null;
      }
    }else{
      if (
        new Date(
          new Date(this.queryReqExp.startDate).setHours(0, 0, 0, 0)
        ).getTime() >=
        new Date(
          new Date(this.queryReqExp.endDate).setHours(23, 59, 59, 0)
        ).getTime()
      ) {
        this.queryReqExp.endDate = null;
      }
    }
  }

  onDatePickerInput(event: InputEvent): void {
    this.dateInputHandlerService.concat(event.data);
  }

  onDatePickerSelectAndBlur(): void {
    this.dateInputHandlerService.clean();
  }

  onDatePickerClose(type: 'imp' | 'exp', key: string): void {
    if (type === 'imp') {
      this.queryReq = {
        ...this.queryReq,
        [key]: this.dateInputHandlerService.getDate() ?? this.queryReq[key],
      };
    } else {
      this.queryReqExp = {
        ...this.queryReqExp,
        [key]: this.dateInputHandlerService.getDate() ?? this.queryReqExp[key],
      };
    }
    this.dateInputHandlerService.clean();
  }

  onFormCheckDateHandler(type: 'imp' | 'exp'): void {
    if (type === 'imp') {
      this.impMinDate = new Date(this.editFormImp.get('startDate').value);
      if (
        new Date(
          new Date(this.editFormImp.controls.startDate.value).setHours(
            0,
            0,
            0,
            0
          )
        ).getTime() >=
        new Date(
          new Date(this.editFormImp.controls.endDate.value).setHours(
            23,
            59,
            59,
            0
          )
        ).getTime()
      ) {
        this.editFormImp.controls.endDate.setValue(null);
      }
    } else {
      this.expMinDate = new Date(this.editFormExp.get('startDate').value);
      if (
        new Date(
          new Date(this.editFormExp.controls.startDate.value).setHours(
            0,
            0,
            0,
            0
          )
        ).getTime() >=
        new Date(
          new Date(this.editFormExp.controls.endDate.value).setHours(
            23,
            59,
            59,
            0
          )
        ).getTime()
      ) {
        this.editFormExp.controls.endDate.setValue(null);
      }
    }
  }

  onFormDatePickerInput(event: InputEvent): void {
    this.dateInputHandlerService.concat(event.data);
  }

  onFormDatePickerSelectAndBlur(): void {
    this.dateInputHandlerService.clean();
  }

  onFormDatePickerClose(type: 'imp' | 'exp', key: string): void {
    if (type === 'imp') {
      this.editFormImp.controls[key].setValue(
        this.dateInputHandlerService.getDate() ??
        this.editFormImp.controls[key].value
      );
    } else {
      this.editFormExp.controls[key].setValue(
        this.dateInputHandlerService.getDate() ??
        this.editFormExp.controls[key].value
      );
    }

    this.dateInputHandlerService.clean();
  }

  //#------------------end------------------
}
