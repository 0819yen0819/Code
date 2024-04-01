import { filter } from 'rxjs/operators';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { Subscription } from 'rxjs';
import { LanguageService } from 'src/app/core/services/language.service';
import {
  NewApplicationService,
  NewIntakeFormTypeData,
} from 'src/app/core/services/new-application.service';
import { SessionService } from 'src/app/core/services/session.service';
import { ToastService } from 'src/app/core/services/toast.service';

@Component({
  selector: 'app-new-application',
  templateUrl: './new-application.component.html',
  styleUrls: ['./new-application.component.scss'],
})
export class NewApplicationComponent implements OnInit, OnDestroy {
  private onLangChange$: Subscription;

  data: any[];
  newIntakeFormTypeList: NewIntakeFormTypeData[] = [];
  newIntakeFormTypeListCloneData: NewIntakeFormTypeData[] = [];
  formTyleList: string[] = [];

  constructor(
    private newApplicationService: NewApplicationService,
    private translateService: TranslateService,
    private toastService: ToastService,
    private languageService: LanguageService,
    private sessionService: SessionService,
  ) {
    this.onLangChange$ = this.translateService.onLangChange.subscribe(() => { });

    this.formTyleList = JSON.parse(this.sessionService.getItem('FormTyleList'));
    
  }

  ngOnInit(): void {
    this.newApplicationService.getAllNewIntakeFormType().subscribe({
      next: (rsp) => {
        this.newIntakeFormTypeList = [];
        this.newIntakeFormTypeListCloneData = [];
        rsp.newIntakeFormTypeList?.forEach((x) => {
          x.subNewIntakeFormTypeList = x.subNewIntakeFormTypeList.filter(o => this.formTyleList.includes(o.formTypeId) && o.display === 'true');
          if(x.subNewIntakeFormTypeList.length > 0){
            let newIntakeFormTypeData: NewIntakeFormTypeData = x;
            this.newIntakeFormTypeList.push(newIntakeFormTypeData);
            this.newIntakeFormTypeListCloneData.push(newIntakeFormTypeData);
          }
        });
      },
      error: (rsp) => {
        console.log(rsp);
        this.toastService.error('System.Message.Error');
      },
    });
  }

  filterNewIntakeFormType(globalFilter: string){
    var filterData = [];
    for(var i = 0; i < this.newIntakeFormTypeListCloneData.length; i++){
      var subNewIntakeFormTypeList = this.newIntakeFormTypeListCloneData[i].subNewIntakeFormTypeList.filter(x => {
        if(this.languageService.getLang() === 'zh-tw'){
          return x.formTypeNameC.toLowerCase().indexOf(globalFilter.toLowerCase()) !== -1;
        }else{
          return x.formTypeNameE.toLowerCase().indexOf(globalFilter.toLowerCase()) !== -1;
        }
      });
      
      if(subNewIntakeFormTypeList.length > 0){
        let newIntakeFormTypeList: NewIntakeFormTypeData = {
          formCategory: this.newIntakeFormTypeListCloneData[i].formCategory,
          formCategoryNameC: this.newIntakeFormTypeListCloneData[i].formCategoryNameC,
          formCategoryNameE: this.newIntakeFormTypeListCloneData[i].formCategoryNameE,
          subNewIntakeFormTypeList: subNewIntakeFormTypeList
        }
        filterData.push(newIntakeFormTypeList);
      }
    }
    this.newIntakeFormTypeList = filterData;
  }

  ngOnDestroy(): void {
    [this.onLangChange$].forEach((subscription: Subscription) => {
      if (subscription != null || subscription != undefined)
        subscription.unsubscribe();
    });
  }
}
