import { Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges } from '@angular/core';
import { DefaultFreightQuery } from '../freight-query-condition/freight-query-const';
import { SelectItem } from 'primeng/api';
import { FreightAdderSetupService } from '../freight-adder-setup.service';
import { FreightAdderAutocompleteService } from '../freight-adder-autocomplete.service';
import { TranslateService } from '@ngx-translate/core';
import { UserContextService } from 'src/app/core/services/user-context.service';
import { Subscription } from 'rxjs';
import { DateInputHandlerService } from 'src/app/core/services/date-input-handler.service';


@Component({
  selector: 'app-freight-adder-add-dialog',
  templateUrl: './freight-adder-add-dialog.component.html',
  styleUrls: ['./freight-adder-add-dialog.component.scss']
})
export class FreightAdderAddDialogComponent implements OnInit, OnChanges {

  @Input() showDialog: boolean = false;
  @Output() saveEmitter = new EventEmitter<any>();
  @Output() closeDialog = new EventEmitter<any>();

  onLangChange$: Subscription;
  formValue: any = JSON.parse(JSON.stringify(DefaultFreightQuery));
  isSubmitted = false;

  // ------ options
  groupOptions: SelectItem[] = [];
  flagOptions: SelectItem[] = this.translateService.instant('Common.Options.flagOptions');
  itemFilterTypeOptions: SelectItem[] = this.translateService.instant('ImpExpLicenseMtn.Options.itemFilterTypeOptions');
  normalOptions: any[] = this.translateService.instant('FreightAdder.Options.normalOptions');
  brandOptions: any[] = [];
  ouOptions: any[] = [];
  ctg1Options: any[] = [];
  customerOptions: any[] = [];
  vendorOptions: any[] = [];
  endCustomerOptions: any[] = [];
  productCodeOptions: any[] = [];
  selectButtonOptions: SelectItem<string>[] = [
    { label: 'Y', value: 'Y' },
    { label: 'N', value: 'N' },
  ];

  constructor(
    private translateService: TranslateService,
    private freightAdderSetupService: FreightAdderSetupService,
    private freightAdderAutocompleteService: FreightAdderAutocompleteService,
    private userContextService: UserContextService,
    public dateInputHandlerService: DateInputHandlerService
  ) { }


  async ngOnInit(): Promise<void> {
    this.groupOptions = await this.freightAdderSetupService.getGroupOptions();
    this.initFormValue();
    this.subscribeLangChange();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.showDialog.currentValue === false) {
      this.initFormValue();
    }
  }

  ngOnDestroy(): void {
    if (this.onLangChange$) { this.onLangChange$.unsubscribe() }
  }

  subscribeLangChange() {
    this.onLangChange$ = this.translateService.onLangChange.subscribe(async () => {
      this.groupOptions = await this.freightAdderSetupService.getGroupOptions();
    });
  }


  initFormValue() {
    this.isSubmitted = false;
    this.formValue = JSON.parse(JSON.stringify(DefaultFreightQuery));
    this.formValue.startDate = new Date();
    this.formValue.endDate = new Date('2400-12-31');
    this.formValue.flag = 'Y';
    this.formValue.ouGroup = 'ALL';
    this.formValue.ou = {
      displayOu: "0_ALL OU",
      groupCode: "ALL",
      groupName: "ALL",
      ouCode: "0",
      ouName: "ALL OU",
      ouShortName: "0"
    }
    this.formValue.customer = {
      label: "0 - ALL (ALL)",
      value: "0"
    }
    this.formValue.vendor = {
      label: "0 - ALL (ALL)",
      value: "0"
    }
    this.formValue.brand = {
      label: "ALL",
      value: "ALL"
    }
    this.formValue.ncnr = 'N'
    this.formValue.eol = 'N'
    this.formValue.single = 'N'
    this.formValue.customize = 'N'
    this.formValue.productCode = {
      label: "ALL",
      value: "ALL"
    }
  }

  saveOnClick() {
    this.isSubmitted = true;

    if (this.checkIfCanSubmit()) {
      this.formValue.groupName = this.groupOptions.filter(item => item.value === this.formValue.ouGroup)[0].label
      if (this.formValue.customer) this.formValue.customer.label = this.formValue.customer?.label?.replace(/\s/g, '').split('-')[1];
      if (this.formValue.vendor) this.formValue.vendor.label = this.formValue.vendor?.label?.replace(/\s/g, '').split('-')[1];

      this.saveEmitter.emit(this.formValue);
      this.closeDialog.emit(true);
    }
  }

  onHideDetailDialog() {
    this.closeDialog.emit(true);
  }

  async onBrandSelect(brand: string): Promise<void> {
    this.formValue.ctg1 = null;
    if (brand) {
      this.ctg1Options = await this.freightAdderSetupService.getCtg1Options({ tenant: this.userContextService.user$.getValue().tenant, brand: brand })
      this.filterEndCustomer({ query: '' });
    }
  }

  async filterOu(event) {
    const groupName = this.groupOptions.filter(item => item.value === this.formValue.ouGroup)[0].label
    this.ouOptions = await this.freightAdderAutocompleteService.filterOu(event, groupName);
  }
  async filterBrand(event) {
    this.brandOptions = await this.freightAdderAutocompleteService.filterBrand(event);
  }
  async filterCustomer(event) {
    this.customerOptions = await this.freightAdderAutocompleteService.filterCustomer(event);
  }
  async filterVendor(event) {
    this.vendorOptions = await this.freightAdderAutocompleteService.filterVendor(event);
  }
  async filterEndCustomer(event) {
    const groupName = this.groupOptions.filter(item => item.value === this.formValue.ouGroup)[0].label
    this.endCustomerOptions = await this.freightAdderAutocompleteService.dropdownEndCustomer(event, this.formValue, groupName);
  }
  async filterProductCode(event) {
    this.productCodeOptions = await this.freightAdderAutocompleteService.filterProductCode(event);
  }

  private checkIfCanSubmit() {
    const checkField = ['ouGroup', 'ou', 'customer', 'vendor', 'ncnr',
      'eol', 'single', 'customize', 'productCode', 'freightAdder', 'flag',
      'startDate', 'endDate']

    const fillInFieldCount = checkField.map(item => !this.formValue[item]).filter(item => item === false).length;
    const allRequireAlreadyFillIn = fillInFieldCount === checkField.length;

    const adderBiggerThan0 = this.formValue.freightAdder >= 0;

    return allRequireAlreadyFillIn && adderBiggerThan0;
  }
}
