import { Component, EventEmitter, Input, isDevMode, OnChanges, OnInit, Output, SimpleChanges } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { SelectorItemType } from 'src/app/core/enums/selector-item-type';
import { SelectorDialogParams } from 'src/app/core/model/selector-dialog-params';
import { SoaCommonService } from '../../../../soa-common.service';
import { lastValueFrom, takeLast } from 'rxjs';
import { CommonApiService } from 'src/app/core/services/common-api.service';
import { SelectItem } from 'primeng/api';
import { LicenseControlApiService } from 'src/app/core/services/license-control-api.service';

@Component({
  selector: 'app-soa-modify-item-dialog',
  templateUrl: './soa-modify-item-dialog.component.html',
  styleUrls: ['./soa-modify-item-dialog.component.scss']
})
export class SoaModifyItemDialogComponent implements OnInit,OnChanges {
  @Input() showDialog = false;
  @Input() itemInfo: any = { item: '', brand: '',ctg1: '', ctg2: '', ctg3: '',eccn:''};
  @Output() closeDialog = new EventEmitter<any>();
  @Output() modifyResult = new EventEmitter<any>();

  selectorDialogParams!: SelectorDialogParams;

  deduction = {
    options: ['N', 'Y']
  };

  qtyWarning: boolean = false;

  ctg1Options: SelectItem[] = [];
  ctg2Options: SelectItem[] = [];
  ctg3Options: SelectItem[] = [];

  constructor(
    private translateService: TranslateService,
    public soaCommonService: SoaCommonService,
    private commonApiService:CommonApiService,
    private licenseControlApiService:LicenseControlApiService
  ) { }

  get enableModifyField(){
    return ['Applyer','GroupOU','TCSU'].includes(this.soaCommonService.currentRole);
  }

  get isCreatedByItem(){ // or by brand
    return this.itemInfo.item !== 'All Item'
  }

  ngOnInit(): void {
    this.getEccnList();
  }

  ngOnChanges(changes: SimpleChanges): void {  
    if (this.itemInfo.item === 'All Item' && this.showDialog){
      console.log(this.itemInfo);
      this.setOptions();
    } 
  }

  showSpinner = false;
  async setOptions(){
    this.showSpinner = true;
    await this.setCtg1Options();
    await this.setCtg2Options();
    await this.setCtg3Options(); 
    this.showSpinner = false;
  }

  close() { 
    this.ctg1Options = [];
    this.ctg2Options = [];
    this.ctg3Options = [];
    this.closeDialog.emit();
  }
  
  async onSelectorDialogCallback(res) {

    if (this.selectorDialogParams.type === SelectorItemType.ITEM){
      this.itemInfo.item = res.label;
      this.itemInfo.productCode = res.value.invItemNo;
      this.itemInfo.brand = res.value.brand;
      this.itemInfo.ctg1 = res.value.ctg1;
      this.itemInfo.ctg2 = res.value.ctg2;
      this.itemInfo.ctg3 = res.value.ctg3;

      let rsp = await lastValueFrom(this.commonApiService.queryItemMasterByInvItemNos([res.value.invItemNo]));  
      this.itemInfo.eccn = rsp.itemMasterList[0].eccn || '';
      this.itemInfo.brand = rsp.itemMasterList[0].brand; 
      this.itemInfo.ctg1 = rsp.itemMasterList[0].ctg1;
      this.itemInfo.ctg2 = rsp.itemMasterList[0].ctg2;
      this.itemInfo.ctg3 = rsp.itemMasterList[0].ctg3; 

    } else if(this.selectorDialogParams.type === SelectorItemType.BRAND_WITHOUT_ALL ){
      // brand變更時清除資料
      this.itemInfo.brand = res.value.code; 
      this.itemInfo.ctg1 = '';
      this.itemInfo.ctg2 = '';
      this.itemInfo.ctg3 = '';

      this.ctg2Options = [];
      this.ctg3Options = [];

      // 設定ctg1下拉選單選項
      this.setCtg1Options();
    }
  }

  onOpenSelectorDialogEvent(): void {
    this.selectorDialogParams = {
      title: `${this.translateService.instant('Dialog.Header.Choose')} Item`,
      type: SelectorItemType.ITEM,
      visiable: true,
    };
  }
    
  onOpenSelectorBrandDialog(): void {
    this.selectorDialogParams = {
      title: `${this.translateService.instant('Dialog.Header.Choose')} Brand`,
      type: SelectorItemType.BRAND_WITHOUT_ALL,
      visiable: true,
    };
  } 

  onCloseAddItemDialogEvent() {
    this.close();
  }

  onFormSubmit() {
    if (!this.submitCheckPass()){return;};
    if (this.itemInfo.isDeduct === 'N') { this.itemInfo.qty = null }
    this.modifyResult.emit(this.itemInfo);
    this.close();
  }

  submitCheckPass(){ 
    if (this.itemInfo.isDeduct === 'N'){return true}
    else{ 
      this.qtyWarning = !(this.itemInfo.isDeduct === 'Y' && this.itemInfo.qty > 0);
      return !this.qtyWarning;
    } 
  }

  deductChange() {
    this.itemInfo.isDeduct === 'N' ? this.itemInfo.qty = 0 : this.itemInfo.qty = null
  } 

  async ctg1OnChange(){
    this.itemInfo.ctg2 = '';
    this.itemInfo.ctg3 = '';
    this.ctg2Options = [];
    this.ctg3Options = [];
    if (!this.itemInfo.ctg1){return;}
    // 設定ctg2下拉選單選項
    this.setCtg2Options();
  }

  async ctg2OnChange(){
    this.itemInfo.ctg3 = '';
    this.ctg3Options = [];
    if (!this.itemInfo.ctg2){return;}
    // 設定ctg2下拉選單選項
   this.setCtg3Options();
  }

  async setCtg1Options(){
    return new Promise(async (resolve, reject) => { 
      if (!this.itemInfo.brand){return resolve('');}
      // 設定ctg1下拉選單選項
      const model = {
        "brand":this.itemInfo.brand
      }
      let OptionRes = await lastValueFrom(this.commonApiService.queryBrandCtg(model));
      OptionRes.brandList = OptionRes.brandList?.filter(item => item.ctg1 !== ''); // 如果沒資料就清除 免得顯示empty
      OptionRes.brandList.unshift({ctg1:'',value:'All',label:''}) // 補上選項
      this.ctg1Options = this.processToSelectOptions(OptionRes.brandList?.map(item => item.ctg1).filter(item => item !== undefined));
      resolve(this.ctg2Options)
    }) 
  }

  async setCtg2Options(){
    return new Promise(async (resolve, reject) => { 
      if (!this.itemInfo.brand || !this.itemInfo.ctg1){return resolve('');}
      const model = {
        "brand":this.itemInfo.brand,
        "ctg1":this.itemInfo.ctg1
      }
      let OptionRes = await lastValueFrom(this.commonApiService.queryBrandCtg(model));
      OptionRes.brandList = OptionRes.brandList?.filter(item => item.ctg2 !== ''); // 如果沒資料就清除 免得顯示empty
      OptionRes.brandList.unshift({ctg2:'',value:'All',label:''}) // 補上選項
      this.ctg2Options = this.processToSelectOptions(OptionRes.brandList?.map(item => item.ctg2).filter(item => item !== undefined));
      resolve(this.ctg2Options)
    }) 
  }

  async setCtg3Options(){
    return new Promise(async (resolve, reject) => { 
      if (!this.itemInfo.brand || !this.itemInfo.ctg1 || !this.itemInfo.ctg2){return resolve('');}
      const model = {
        "brand":this.itemInfo.brand,
        "ctg1":this.itemInfo.ctg1,
        "ctg2":this.itemInfo.ctg2
      }
      let OptionRes = await lastValueFrom(this.commonApiService.queryBrandCtg(model)); 
      OptionRes.brandList = OptionRes.brandList?.filter(item => item.ctg3 !== ''); // 如果沒資料就清除 免得顯示empty
      OptionRes.brandList.unshift({ctg3:'',value:'All',label:''}) // 補上選項
      this.ctg3Options = this.processToSelectOptions(OptionRes.brandList?.map(item => item.ctg3).filter(item => item !== undefined));
      resolve(this.ctg2Options)
    }) 
  }

  eccnListOptions = [];
  private getEccnList(){
    // 取得eccn下拉選單選項
    this.eccnListOptions = [{label:this.translateService.instant('Input.PlaceHolder.PleaseSelect'),value:''}];
    this.licenseControlApiService.getECCNList()
      .pipe(takeLast(1))
      .subscribe({
        next: (rsp) => {
          rsp.eccnList?.forEach(eccn => {
            this.eccnListOptions.push({ label: eccn, value: eccn })
          });

        },
        error: (rsp) => { console.log('fail', rsp); }
      });
  }

  private processToSelectOptions(data){
    let newOptions = [];
    data.forEach(item=>{
      newOptions.push({ label: item, value: item});
    })
    return newOptions;
  }
}
