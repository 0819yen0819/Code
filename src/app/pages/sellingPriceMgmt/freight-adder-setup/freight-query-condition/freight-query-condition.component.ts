import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { SelectItem } from 'primeng/api';
import { DateInputHandlerService } from 'src/app/core/services/date-input-handler.service';
import { UserContextService } from 'src/app/core/services/user-context.service';
import { DefaultFreightQuery } from './freight-query-const';
import { FreightAdderSetupService } from '../freight-adder-setup.service';
import { FreightAdderAutocompleteService } from '../freight-adder-autocomplete.service';
import { Subscription, retry } from 'rxjs';


@Component({
  selector: 'app-freight-query-condition',
  templateUrl: './freight-query-condition.component.html',
  styleUrls: ['./freight-query-condition.component.scss']
})
export class FreightQueryConditionComponent implements OnInit {
  @Output() queryCondition = new EventEmitter<any>();
  @Output() resetQueryCondition = new EventEmitter<boolean>();
  @Output() downloadQueryCondition = new EventEmitter<any>();

  onLangChange$: Subscription;
  formValue: any = JSON.parse(JSON.stringify(DefaultFreightQuery));

  // ------ options
  groupOptions: SelectItem[] = [];
  statusOptions: SelectItem[] = this.translateService.instant('Common.Options.flagOptionsWithDefault');
  itemFilterTypeOptions: SelectItem[] = this.translateService.instant('ImpExpLicenseMtn.Options.itemFilterTypeOptions');
  normalOptions: any[] = this.translateService.instant('FreightAdder.Options.normalOptions');
  brandOptions: any[] = [];
  ouOptions: any[] = [];
  ctg1Options: any[] = [];
  customerOptions: any[] = [];
  vendorOptions: any[] = [];
  endCustomerOptions: any[] = [];


  constructor(
    private translateService: TranslateService,
    private userContextService: UserContextService,
    public dateInputHandlerService: DateInputHandlerService,
    private freightAdderSetupService: FreightAdderSetupService,
    public freightAdderAutocompleteService: FreightAdderAutocompleteService
  ) { }

  async ngOnInit(): Promise<void> {
    this.reset();
    this.groupOptions = await this.freightAdderSetupService.getGroupOptions();
    this.subscribeLangChange();
  }

  ngOnDestroy(): void {
    if (this.onLangChange$) { this.onLangChange$.unsubscribe() }
  }

  subscribeLangChange() {
    this.onLangChange$ = this.translateService.onLangChange.subscribe(async () => {
      this.groupOptions = await this.freightAdderSetupService.getGroupOptions();
      this.itemFilterTypeOptions = this.translateService.instant('ImpExpLicenseMtn.Options.itemFilterTypeOptions');
      this.normalOptions = this.translateService.instant('FreightAdder.Options.normalOptions');
    });
  }

  queryOnClick() { 
    this.queryCondition.emit(this.formValue);
  }

  downloadOnClick(){
    this.downloadQueryCondition.emit(this.formValue);
  }

  reset() {
    this.formValue = JSON.parse(JSON.stringify(DefaultFreightQuery));
    this.statusOptions = this.translateService.instant('Common.Options.flagOptionsWithDefault');
    this.itemFilterTypeOptions = this.translateService.instant('ImpExpLicenseMtn.Options.itemFilterTypeOptions');
    this.brandOptions = [];
    this.ouOptions = [];
    this.ctg1Options = [];
    this.customerOptions = [];
    this.vendorOptions = [];
    this.endCustomerOptions = [];
    this.formValue.status = 'Y';
    this.formValue.lazyLoadEvent = { "first": 0, "rows": 10, "sortOrder": 1 }
    this.resetQueryCondition.emit(true);
  }

  async onBrandSelect(brand: string): Promise<void> {
    this.formValue.ctg1 = null;
    if (brand) {
      this.ctg1Options = await this.freightAdderSetupService.getCtg1Options({ tenant: this.userContextService.user$.getValue().tenant, brand: brand })
    }
  }

  onCheckDateHandler(): void {
    const startDate = new Date(new Date(this.formValue.startDate).setHours(0, 0, 0, 0)).getTime();
    const endDate = new Date(new Date(this.formValue.endDate).setHours(23, 59, 59, 0)).getTime();
    this.formValue.endDate = startDate > endDate ? null : this.formValue.endDate;
  }

  onDatePickerClose(key: string): void {
    this.formValue = {
      ...this.formValue,
      [key]: this.dateInputHandlerService.getDate() ?? this.formValue[key],
    };
    this.dateInputHandlerService.clean();
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
    this.endCustomerOptions = await this.freightAdderAutocompleteService.filterEndCustomer(event, this.formValue, groupName);
  }

}