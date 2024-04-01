import { Component, EventEmitter, Input, OnChanges, OnInit, Output } from '@angular/core';
import { DefaultFreightQuery } from '../freight-query-condition/freight-query-const';
import { SelectItem } from 'primeng/api';
import { TranslateService } from '@ngx-translate/core';
import { ObjectFormatService } from 'src/app/core/services/object-format.service';

@Component({
  selector: 'app-freight-adder-edit-dialog',
  templateUrl: './freight-adder-edit-dialog.component.html',
  styleUrls: ['./freight-adder-edit-dialog.component.scss']
})
export class FreightAdderEditDialogComponent  implements OnInit,OnChanges {

  @Input() showDialog: boolean = false;
  @Input() editObj :any = {};
  @Output() saveEmitter = new EventEmitter<any>();
  @Output() closeDialog = new EventEmitter<any>();

  formValue: any = JSON.parse(JSON.stringify(DefaultFreightQuery));

  // ------ options
  flagOptions: SelectItem[] = this.translateService.instant('Common.Options.flagOptions');
  selectButtonOptions : SelectItem<string>[] =[
    { label: 'Y', value: 'Y' },
    { label: 'N', value: 'N' },
  ];

  constructor(
    private translateService: TranslateService,
    private objectFormatService :ObjectFormatService
  ) { }
  
  ngOnInit(){
    
  }

  ngOnChanges(){
    if (this.editObj && this.showDialog){
      this.formValue = this.processFormValue(this.editObj);
    } 
  }

  saveOnClick(){ 
    this.saveEmitter.emit(this.formValue);
    this.closeDialog.emit(true);
  }

  onHideDetailDialog() {
    this.closeDialog.emit(true);
  } 

  processFormValue(obj){

    for (const [key, value] of Object.entries(obj)) { 
      if (key === 'ouCode' || key === 'oouCode' || key === 'productCode' || key === 'ouGroup') {
        if (value === '0') { obj.key =  'ALL'; }
      } else if (key === 'startDate' || key === 'endDate') {
        obj.key = this.objectFormatService.DateFormat((value as Date), '/')
      }  
    }
 
    obj.vendor = `${obj.vendorCode} - ${obj.vendorName}`
    obj.customer = `${obj.custCode} - ${obj.custName}`

    return JSON.parse(JSON.stringify(obj));
  }

}
