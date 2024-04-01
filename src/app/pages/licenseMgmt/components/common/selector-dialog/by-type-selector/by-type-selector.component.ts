import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnInit,
  Output
} from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { SelectItem } from 'primeng/api';
import { BehaviorSubject, Observable, takeLast } from 'rxjs';
import { BtnActionType } from 'src/app/core/enums/btn-action';
import { SelectorItemType } from 'src/app/core/enums/selector-item-type';
import { DeliverToAddressInfo } from 'src/app/core/model/deliver_to_address_info';
import { OUInfo } from 'src/app/core/model/ou-info';
import { ShipToAddressInfo } from 'src/app/core/model/ship_to_address_info';
import { SpecialImportLicenseInfo } from 'src/app/core/model/special_import_license_info';
import { AuthApiService } from 'src/app/core/services/auth-api.service';
import { CommonApiService } from 'src/app/core/services/common-api.service';
import { LicenseControlApiService } from 'src/app/core/services/license-control-api.service';
import { UserContextService } from 'src/app/core/services/user-context.service';
import {
  CustormerInfo,
  VendorInfo
} from '../../../../../../core/model/ven-cus-info';

@Component({
  selector: 'app-common-by-type-selector',
  templateUrl: './by-type-selector.component.html',
  styleUrls: ['./by-type-selector.component.scss'],
})
export class CommomByTypeSelectorComponent implements OnInit, OnChanges {
  @Input() selectType!: string;
  @Input() isDialogOpen!: boolean;
  @Input() data!: any;
  @Output() outputResult: EventEmitter<SelectItem<any>> = new EventEmitter<
    SelectItem<any>
  >();

  formGroup!: FormGroup;
  isLoading!: boolean;
  isEmpty!: boolean | null;

  resultList!: BehaviorSubject<SelectItem<any>[]>;
  targetSelectData!: any;

  hideHeaderSearchList!: string[];

  constructor(
    private commonApiService: CommonApiService,
    private formbuilder: FormBuilder,
    private authApiService: AuthApiService,
    private userContextService: UserContextService,
    private licenseControlApiService: LicenseControlApiService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.initParams();
    //> 隱藏 上方輸入框的
    this.hideHeaderSearchList = [
      SelectorItemType.SPECIAL_IMPORT_LICENSE,
      SelectorItemType.CUS_SHIP_TO_ADDRESS,
      SelectorItemType.CUS_DELIVER_TO_ADDRESS,
      SelectorItemType.SHIP_FROM_ADDRESS,
      SelectorItemType.BAFA,
      SelectorItemType.CUS_ADDRESS_QUERY_ADDRESS,
      SelectorItemType.CUS_ADDRESS_QUERY_SHIP,
    ];
  }

  ngOnChanges(): void {
    if (this.isDialogOpen) {
      this.initParams();

      //> 需要直接有資料列表的
      if (this.hideHeaderSearchList.includes(this.selectType)) {
        this.onSearchSubmit();
      }
    }
  }

  initParams(): void {
    //> init form
    this.formGroup = this.formbuilder.group({
      keyword: ['', [Validators.required]],
    });

    //> init loading status
    this.isLoading = false;

    //>init empty status
    this.isEmpty = null;

    //> init result list
    this.resultList = new BehaviorSubject<SelectItem[]>([]);

    this.formGroup.enable({ onlySelf: true });
  }

  onSearchSubmit(): void {
    this.formGroup.disable({ onlySelf: true });

    //> toggle loading status
    this.isLoading = true;

    //> toggle empty status
    this.isEmpty = null;

    //> reset result list
    this.resultList.next(new Array());

    //> switch case by selectType
    if (this.selectType === SelectorItemType.CUSTOMER) {
      this.onCustomerSearchSubmit(this.formGroup.get('keyword').value);
    }

    if (this.selectType === SelectorItemType.VENDOR) {
      this.onVendorSearchSubmit(this.formGroup.get('keyword').value);
    }

    if (this.selectType === SelectorItemType.ITEM) {
      this.onItemSearchSubmit(this.formGroup.get('keyword').value);
    }

    if (this.selectType === SelectorItemType.CUS_SHIP_TO_ADDRESS) {
      this.onCusShipToAddressSearchSubmit(this.formGroup.get('keyword').value);
    }

    if (this.selectType === SelectorItemType.CUS_DELIVER_TO_ADDRESS) {
      this.onCusDeliverToAddressSearchSubmit(
        this.formGroup.get('keyword').value
      );
    }

    if (this.selectType === SelectorItemType.CUS_ADDRESS_QUERY_SHIP) {
      this.customerAddressQueryForLicense(
        this.formGroup.get('keyword').value,
        'SHIP_TO'
      );
    }

    if (this.selectType === SelectorItemType.CUS_ADDRESS_QUERY_ADDRESS) {
      this.customerAddressQueryForLicense(
        this.formGroup.get('keyword').value,
        'DELIVER_TO'
      );
    }

    if (this.selectType === SelectorItemType.SHIP_FROM_ADDRESS) {
      this.onShipFromAddressSearchSubmit(this.formGroup.get('keyword').value);
    }

    if (this.selectType === SelectorItemType.SPECIAL_IMPORT_LICENSE) {
      this.onQuerySpecialImportLicense(this.formGroup.get('keyword').value);
    }

    if (this.selectType === SelectorItemType.BAFA) {
      this.onBAFASearchSubmit();
    }

    if (
      this.selectType === SelectorItemType.OOU ||
      this.selectType === SelectorItemType.OU
    ) {
      this.onOUSearchSubmit(this.formGroup.get('keyword').value);
    }

    if (this.selectType === SelectorItemType.ALLCUSTOMER) {
      this.onAllCustomerSearchSubmit(this.formGroup.get('keyword').value);
    }
    if (this.selectType === SelectorItemType.ALLVENDOR) {
      this.onAllVendorSearchSubmit(this.formGroup.get('keyword').value);
    }

    if (
      this.selectType === SelectorItemType.ALLOOU ||
      this.selectType === SelectorItemType.ALLOU
    ) {
      this.onAllOUSearchSubmit(this.formGroup.get('keyword').value);
    }

    if (
      this.selectType === SelectorItemType.ALLOOU_ALL ||
      this.selectType === SelectorItemType.ALLOU_ALL
    ) {
      this.onOuQueryByPrefixEnableAllOu(this.formGroup.get('keyword').value);
    }

    if (this.selectType === SelectorItemType.CUSTOMER_INCLUDE_ALL) {
      this.onCustomerAllSearchSubmit(this.formGroup.get('keyword').value);
    }

    if (this.selectType === SelectorItemType.VENDOR_INCLUDE_ALL) {
      this.onVendorAllSearchSubmit(this.formGroup.get('keyword').value);
    }

    if (this.selectType === SelectorItemType.BRAND) {
      this.onBrandSearchSubmit(this.formGroup.get('keyword').value);
    }
    if (this.selectType === SelectorItemType.BRAND_WITHOUT_ALL) {
      this.onBrandSearchSubmit(this.formGroup.get('keyword').value,'N');
    }
  }

  onSearchKeywordChange(): void {
    this.resultList.next(new Array());
  }

  onSearchKeywordClean(): void {
    this.formGroup.get('keyword').setValue('');
    this.formGroup.enable({ onlySelf: true });
    this.resultList.next(new Array());
  }

  onSelectResultChange(item: SelectItem): void {
    this.targetSelectData = item;
  }

  onCustomerSearchSubmit(keyword: string): void {
    const getFuzzyCustomerList$ = (
      keyword: string
    ): Observable<CustormerInfo[]> =>
      new Observable<CustormerInfo[]>((obs) => {
        this.commonApiService
          .getFuzzyActiveCustomerList(keyword)
          .pipe(takeLast(1))
          .subscribe({
            next: (res) => {
              obs.next(res.customerList);
              obs.complete();
            },
            error: (err) => {
              console.error(err);
              obs.next([]);
              obs.complete();
            },
          });
      });

    getFuzzyCustomerList$(keyword).subscribe((res) => {
      res.forEach((item) => {
        this.resultList.next([
          ...this.resultList.getValue(),
          {
            label: `${item.customerNo} - ${item.customerName} (${item.customerNameEg})`,
            value: item,
          },
        ]);
      });

      this.isLoading = false;
      this.formGroup.enable({ onlySelf: true });

      if (this.resultList.getValue().length != 0) {
        this.isEmpty = false;
      } else {
        this.isEmpty = true;
      }
    });
  }

  onVendorSearchSubmit(keyword: string): void {
    const getFuzzyVendorList$ = (keyword: string): Observable<VendorInfo[]> =>
      new Observable<VendorInfo[]>((obs) => {
        this.commonApiService
          .getFuzzyActiveVendorList(keyword)
          .pipe(takeLast(1))
          .subscribe({
            next: (res) => {
              obs.next(res.vendorList);
              obs.complete();
            },
            error: (err) => {
              console.error(err);
              obs.next([]);
              obs.complete();
            },
          });
      });

    getFuzzyVendorList$(keyword).subscribe((res) => {
      res.forEach((item) => {
        this.resultList.next([
          ...this.resultList.getValue(),
          {
            label: `${item.vendorCode} - ${item.vendorName} (${item.vendorEngName})`,
            value: item,
          },
        ]);
      });
      this.isLoading = false;
      this.formGroup.enable({ onlySelf: true });

      if (this.resultList.getValue().length != 0) {
        this.isEmpty = false;
      } else {
        this.isEmpty = true;
      }
    });
  }

  onItemSearchSubmit(keyword: string): void {
    const getFuzzyItemList$ = (keyword: string): Observable<any[]> =>
      new Observable<any[]>((obs) => {
        this.commonApiService
          .getFuzzyItemList(keyword)
          .pipe(takeLast(1))
          .subscribe({
            next: (res) => {
              obs.next(res.productList);
              obs.complete();
            },
            error: (err) => {
              console.error(err);
              obs.next([]);
              obs.complete();
            },
          });
      });

    getFuzzyItemList$(keyword).subscribe((res) => {
      res.forEach((item) => {
        this.resultList.next([
          ...this.resultList.getValue(),
          {
            label: `${item.invItemNo}`,
            value: item,
          },
        ]);
      });
      this.isLoading = false;
      this.formGroup.enable({ onlySelf: true });

      if (this.resultList.getValue().length != 0) {
        this.isEmpty = false;
      } else {
        this.isEmpty = true;
      }
    });
  }

  onOUSearchSubmit(keyword: string): void {
    const getFuzzyOUList$ = (keyword: string): Observable<OUInfo[]> =>
      new Observable<OUInfo[]>((obs) => {
        this.authApiService
          .ouQueryByPrefixAndGroup(keyword, '')
          .pipe(takeLast(1))
          .subscribe({
            next: (res) => {
              obs.next(res.ouList);
              obs.complete();
            },
            error: (err) => {
              console.error(err);
              obs.next([]);
              obs.complete();
            },
          });
      });

    getFuzzyOUList$(keyword).subscribe((res) => {
      res.forEach((item) => {
        this.resultList.next([
          ...this.resultList.getValue(),
          {
            label: `${item.displayOu}`,
            value: item,
          },
        ]);
      });
      this.isLoading = false;
      this.formGroup.enable({ onlySelf: true });

      if (this.resultList.getValue().length != 0) {
        this.isEmpty = false;
      } else {
        this.isEmpty = true;
      }
    });
  }

  onBAFASearchSubmit(): void {
    const getFuzzyBAFAList$ = (): Observable<any[]> =>
      new Observable<any[]>((obs) => {
        this.licenseControlApiService
          .getTargetBAFAInfo(this.data.ieType, this.data.productCode)
          .pipe(takeLast(1))
          .subscribe({
            next: (res) => {
              obs.next(res.datas);
              obs.complete();
            },
            error: (err) => {
              console.error(err);
              obs.next([]);
              obs.complete();
            },
          });
      });

    getFuzzyBAFAList$().subscribe((res) => {
      res.forEach((item) => {
        this.resultList.next([
          ...this.resultList.getValue(),
          {
            label: this.router.url.includes('type=exp')
              ? `BAFA license No：${item.BAFALicense}，Item：${
                  item.productCode
                }，Import Apply Qty：${item.quantity}，Unused Qty：${
                  item.balanceQty ? item.balanceQty : '---'
                }`
              : `BAFA license No：${item.BAFALicense}，License Qty：${
                  item.quantity
                }，Unused Qty：${item.balanceQty ? item.balanceQty : '---'}`,
            value: item,
          },
        ]);
      });
      this.isLoading = false;
      this.formGroup.enable({ onlySelf: true });

      if (this.resultList.getValue().length != 0) {
        this.isEmpty = false;
      } else {
        this.isEmpty = true;
      }
    });
  }

  onShipFromAddressSearchSubmit(keyword: string): void {
    const getFuzzyShipFromAddressList$ = (model: {
      tenant: string;
      vcType: string;
      vcNo: string;
      ouCode: string;
      keyword: string;
    }): Observable<string[]> =>
      new Observable<string[]>((obs) => {
        this.licenseControlApiService
          .shipFromAddressQueryByPrefix(model)
          .pipe(takeLast(1))
          .subscribe({
            next: (res) => {
              obs.next(res.addressList);
              obs.complete();
            },
            error: (err) => {
              console.error(err);
              obs.next([]);
              obs.complete();
            },
          });
      });

    getFuzzyShipFromAddressList$({
      tenant: this.userContextService.user$.getValue().tenant,
      vcType: this.data.vcType,
      vcNo: this.data.vcCode,
      ouCode: this.data.ouCode,
      keyword: keyword,
    }).subscribe((res) => {
      res.forEach((item) => {
        this.resultList.next([
          ...this.resultList.getValue(),
          {
            label: item,
            value: item,
          },
        ]);
      });
      this.isLoading = false;
      this.formGroup.enable({ onlySelf: true });

      if (this.resultList.getValue().length != 0) {
        this.isEmpty = false;
      } else {
        this.isEmpty = true;
      }
    });
  }

  onCusShipToAddressSearchSubmit(keyword: string): void {
    const getFuzzyCusShipToAddressList$ = (model: {
      tenant: string;
      custNo: string;
      ouCode: string;
      keyword: string;
    }): Observable<ShipToAddressInfo[]> =>
      new Observable<ShipToAddressInfo[]>((obs) => {
        this.commonApiService
          .customerShipToAddressQueryByPrefix(model)
          .pipe(takeLast(1))
          .subscribe({
            next: (res) => {
              obs.next(res.addressList);
              obs.complete();
            },
            error: (err) => {
              console.error(err);
              obs.next([]);
              obs.complete();
            },
          });
      });

    getFuzzyCusShipToAddressList$({
      tenant: this.userContextService.user$.getValue().tenant,
      custNo: this.data.custNo,
      ouCode: this.data.ouCode,
      keyword: keyword,
    }).subscribe((res) => {
      res.forEach((item) => {
        this.resultList.next([
          ...this.resultList.getValue(),
          {
            label: `${item.location} - ${item.addressLineCn}`,
            value: item,
          },
        ]);
      });
      this.isLoading = false;
      this.formGroup.enable({ onlySelf: true });

      if (this.resultList.getValue().length != 0) {
        this.isEmpty = false;
      } else {
        this.isEmpty = true;
      }
    });
  }

  onCusDeliverToAddressSearchSubmit(keyword: string): void {
    const getFuzzyCusDeliverToAddressList$ = (model: {
      tenant: string;
      custNo: string;
      ouCode: string;
      keyword: string;
    }): Observable<DeliverToAddressInfo[]> =>
      new Observable<DeliverToAddressInfo[]>((obs) => {
        this.commonApiService
          .customerDeliverToAddressQueryByPrefix(model)
          .pipe(takeLast(1))
          .subscribe({
            next: (res) => {
              obs.next(res.addressList);
              obs.complete();
            },
            error: (err) => {
              console.error(err);
              obs.next([]);
              obs.complete();
            },
          });
      });

    getFuzzyCusDeliverToAddressList$({
      tenant: this.userContextService.user$.getValue().tenant,
      custNo: this.data.custNo,
      ouCode: this.data.ouCode,
      keyword: keyword,
    }).subscribe((res) => {
      res.forEach((item) => {
        this.resultList.next([
          ...this.resultList.getValue(),
          {
            label: `${item.location} - ${item.addressLineCn}`,
            value: item,
          },
        ]);
      });
      this.isLoading = false;
      this.formGroup.enable({ onlySelf: true });

      if (this.resultList.getValue().length != 0) {
        this.isEmpty = false;
      } else {
        this.isEmpty = true;
      }
    });
  }

  onQuerySpecialImportLicense(keyword: string): void {
    const getFuzzyQuerySpecialImportLicenseList$ = (model: {
      tenant: string;
      ouCode: string;
      keyword: string;
      action: string;
      active: string;
    }): Observable<SpecialImportLicenseInfo[]> =>
      new Observable<SpecialImportLicenseInfo[]>((obs) => {
        this.licenseControlApiService
          .querySpecialImportLicense(model)
          .pipe(takeLast(1))
          .subscribe({
            next: (res) => {
              obs.next(res.datas);
              obs.complete();
            },
            error: (err) => {
              console.error(err);
              obs.next([]);
              obs.complete();
            },
          });
      });

    getFuzzyQuerySpecialImportLicenseList$({
      tenant: this.userContextService.user$.getValue().tenant,
      ouCode: this.data.ouCode,
      keyword: keyword,
      action: 'formQuery',
      active: 'Y',
    }).subscribe((res) => {
      res.forEach((item) => {
        this.resultList.next([
          ...this.resultList.getValue(),
          {
            label: `${item.descript}`,
            value: item,
          },
        ]);
      });
      this.isLoading = false;
      this.formGroup.enable({ onlySelf: true });

      if (this.resultList.getValue().length != 0) {
        this.isEmpty = false;
      } else {
        this.isEmpty = true;
      }
    });
  }

  onAllCustomerSearchSubmit(keyword: string): void {
    const getFuzzyAllCustomerList$ = (
      keyword: string
    ): Observable<CustormerInfo[]> =>
      new Observable<CustormerInfo[]>((obs) => {
        this.commonApiService
          .customerQueryByPrefix(keyword)
          .pipe(takeLast(1))
          .subscribe((res) => {
            obs.next(res.customerList);
            obs.complete();
          });
      });

    getFuzzyAllCustomerList$(keyword).subscribe((res) => {
      res.forEach((item) => {
        this.resultList.next([
          ...this.resultList.getValue(),
          {
            label: `${item.customerNo} - ${item.customerName} (${item.customerNameEg})`,
            value: item,
          },
        ]);
      });

      this.isLoading = false;
      this.formGroup.get('keyword').enable({ onlySelf: true });

      if (this.resultList.getValue().length != 0) {
        this.isEmpty = false;
      } else {
        this.isEmpty = true;
      }
    });
  }

  onAllVendorSearchSubmit(keyword: string): void {
    const getFuzzyAllVendorList$ = (
      keyword: string
    ): Observable<VendorInfo[]> =>
      new Observable<VendorInfo[]>((obs) => {
        this.commonApiService
          .vendorQueryByPrefix(keyword)
          .pipe(takeLast(1))
          .subscribe((res) => {
            obs.next(res.vendorList);
            obs.complete();
          });
      });

    this.formGroup.get('keyword').disable({ onlySelf: true });

    getFuzzyAllVendorList$(keyword).subscribe((res) => {
      res.forEach((item) => {
        this.resultList.next([
          ...this.resultList.getValue(),
          {
            label: `${item.vendorCode} - ${item.vendorName} (${item.vendorEngName})`,
            value: item,
          },
        ]);
      });
      this.isLoading = false;
      this.formGroup.get('keyword').enable({ onlySelf: true });

      if (this.resultList.getValue().length != 0) {
        this.isEmpty = false;
      } else {
        this.isEmpty = true;
      }
    });
  }

  onAllOUSearchSubmit(keyword: string): void {
    const getFuzzyAllOUList$ = (keyword: string): Observable<OUInfo[]> =>
      new Observable<OUInfo[]>((obs) => {
        this.authApiService
          .ouQueryByPrefix(keyword)
          .pipe(takeLast(1))
          .subscribe({
            next: (res) => {
              obs.next(res.ouList);
              obs.complete();
            },
            error: (err) => {
              console.error(err);
              obs.next([]);
              obs.complete();
            },
          });
      });

    getFuzzyAllOUList$(keyword).subscribe((res) => {
      res.forEach((item) => {
        this.resultList.next([
          ...this.resultList.getValue(),
          {
            label: `${item.displayOu}`,
            value: item,
          },
        ]);
      });
      this.isLoading = false;
      this.formGroup.enable({ onlySelf: true });

      if (this.resultList.getValue().length != 0) {
        this.isEmpty = false;
      } else {
        this.isEmpty = true;
      }
    });
  }


  onSelectSubmit(type: string): void {
    if (type === BtnActionType.SUBMIT) {
      this.outputResult.emit(this.targetSelectData);
    }

    if (type === BtnActionType.CANCEL) {
      this.outputResult.emit({
        label: '',
        value: null,
      });

      //> toggle loading status
      this.isLoading = false;

      //> toggle empty status
      this.isEmpty = null;

      //> reset result list
      this.resultList.next(new Array());

      this.formGroup.reset();

      this.formGroup.enable({ onlySelf: true });
    }
  }

  onResetHandler(): void {
    this.formGroup.reset();
    if (
      this.selectType === SelectorItemType.SPECIAL_IMPORT_LICENSE ||
      this.selectType === SelectorItemType.CUS_SHIP_TO_ADDRESS ||
      this.selectType === SelectorItemType.CUS_DELIVER_TO_ADDRESS ||
      this.selectType === SelectorItemType.SHIP_FROM_ADDRESS ||
      this.selectType === SelectorItemType.BAFA ||
      this.selectType === SelectorItemType.OOU ||
      this.selectType === SelectorItemType.OU
    ) {
      this.onSearchSubmit();
    }
  }

  onCustomerAllSearchSubmit(keyword: string): void {
    const getFuzzyCustomerList$ = (
      keyword: string
    ): Observable<CustormerInfo[]> =>
      new Observable<CustormerInfo[]>((obs) => {
        this.commonApiService
          .getFuzzyActiveCustomerAllList(keyword)
          .pipe(takeLast(1))
          .subscribe({
            next: (res) => {
              obs.next(res.customerList);
              obs.complete();
            },
            error: (err) => {
              console.error(err);
              obs.next([]);
              obs.complete();
            },
          });
      });

    getFuzzyCustomerList$(keyword).subscribe((res) => {
      res.forEach((item) => {
        this.resultList.next([
          ...this.resultList.getValue(),
          {
            label: `${item.customerNo} - ${item.customerName} (${item.customerNameEg})`,
            value: item,
          },
        ]);
      });

      this.isLoading = false;
      this.formGroup.enable({ onlySelf: true });

      if (this.resultList.getValue().length != 0) {
        this.isEmpty = false;
      } else {
        this.isEmpty = true;
      }
    });
  }

  onVendorAllSearchSubmit(keyword: string): void {
    const getFuzzyVendorList$ = (keyword: string): Observable<VendorInfo[]> =>
      new Observable<VendorInfo[]>((obs) => {
        this.commonApiService
          .getFuzzyActiveVendorAllList(keyword)
          .pipe(takeLast(1))
          .subscribe({
            next: (res) => {
              obs.next(res.vendorList);
              obs.complete();
            },
            error: (err) => {
              console.error(err);
              obs.next([]);
              obs.complete();
            },
          });
      });

    getFuzzyVendorList$(keyword).subscribe((res) => {
      res.forEach((item) => {
        this.resultList.next([
          ...this.resultList.getValue(),
          {
            label: `${item.vendorCode} - ${item.vendorName} (${item.vendorEngName})`,
            value: item,
          },
        ]);
      });
      this.isLoading = false;
      this.formGroup.enable({ onlySelf: true });

      if (this.resultList.getValue().length != 0) {
        this.isEmpty = false;
      } else {
        this.isEmpty = true;
      }
    });
  }

  customerAddressQueryForLicense(keyword: string, siteUseCode: string): void {
    const getCustomerAddressQueryForLicenseList$ = (model: {
      tenant: string;
      custNo: string;
      ouCode: string;
      keyword: string;
      siteUseCode: string;
    }): Observable<DeliverToAddressInfo[]> =>
      new Observable<DeliverToAddressInfo[]>((obs) => {
        this.commonApiService
          .customerAddressQueryForLicense(model)
          .pipe(takeLast(1))
          .subscribe({
            next: (res) => {
              obs.next(res.addressList);
              obs.complete();
            },
            error: (err) => {
              console.error(err);
              obs.next([]);
              obs.complete();
            },
          });
      });

    getCustomerAddressQueryForLicenseList$({
      tenant: this.userContextService.user$.getValue().tenant,
      custNo: this.data.custNo,
      ouCode: this.data.ouCode,
      keyword: keyword,
      siteUseCode: siteUseCode,
    }).subscribe((res) => {
      res.forEach((item) => {
        this.resultList.next([
          ...this.resultList.getValue(),
          {
            label: `${item.location} - ${item.addressLineCn}`,
            value: item,
          },
        ]);
      });
      this.isLoading = false;
      this.formGroup.enable({ onlySelf: true });

      if (this.resultList.getValue().length != 0) {
        this.isEmpty = false;
      } else {
        this.isEmpty = true;
      }
    });
  }

  onOuQueryByPrefixEnableAllOu(keyword: string): void {
    const getFuzzyAllOUList$ = (keyword: string): Observable<OUInfo[]> =>
      new Observable<OUInfo[]>((obs) => {
        this.authApiService
          .ouQueryByPrefix(keyword,'Y')
          .pipe(takeLast(1))
          .subscribe({
            next: (res) => {
              obs.next(res.ouList);
              obs.complete();
            },
            error: (err) => {
              console.error(err);
              obs.next([]);
              obs.complete();
            },
          });
      });

    getFuzzyAllOUList$(keyword).subscribe((res) => {
      res.forEach((item) => {
        this.resultList.next([
          ...this.resultList.getValue(),
          {
            label: `${item.displayOu}`,
            value: item,
          },
        ]);
      });
      this.isLoading = false;
      this.formGroup.enable({ onlySelf: true });

      if (this.resultList.getValue().length != 0) {
        this.isEmpty = false;
      } else {
        this.isEmpty = true;
      }
    });
  }

  onBrandSearchSubmit(keyword: string,showALLBrand:string = 'Y'): void {
    const getFuzzyBrandList$ = (keyword: string): Observable<any> =>
      new Observable<any>((obs) => {
        this.commonApiService
          .brandQueryByPrefix(keyword,showALLBrand)
          .pipe(takeLast(1))
          .subscribe({
            next: (res) => {
              obs.next(res.brandList);
              obs.complete();
            },
            error: (err) => {
              console.error(err);
              obs.next([]);
              obs.complete();
            },
          });
      });

    getFuzzyBrandList$(keyword).subscribe((res) => { 
      res.forEach((item) => {
        console.log(item);
        this.resultList.next([
          ...this.resultList.getValue(),
          {
            label: `${item.code}`,
            value: item,
          },
        ]);
      });
      this.isLoading = false;
      this.formGroup.enable({ onlySelf: true });

      if (this.resultList.getValue().length != 0) {
        this.isEmpty = false;
      } else {
        this.isEmpty = true;
      }
    });
  }
}
