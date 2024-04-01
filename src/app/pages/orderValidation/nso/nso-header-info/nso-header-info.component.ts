import { DatePipe } from '@angular/common';
import { Component, Input, OnInit } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-nso-header-info',
  templateUrl: './nso-header-info.component.html',
  styleUrls: ['./nso-header-info.component.scss']
})
export class NsoHeaderInfoComponent implements OnInit {
  @Input() formInfo:any = {};

  constructor(
    private datePipe:DatePipe,
    private translateService:TranslateService
  ) { }

  headerSetting = [
    {
      col: this.translateService.instant('LicenseMgmt.Common.Label.ReferenceNo'),
      content: ''
    },
    {
      col: this.translateService.instant('SalesOrderChange.Label.ApplyDate'),
      content: ''
    },
    {
      col: this.translateService.instant('APPROVING_LEH.Label.Applicant'),
      content: ''
    }
  ]

  ngOnInit(): void {
    this.subscribeLang();
  }

  /**
   * 訂閱語言變換
   */
  subscribeLang() {
    this.translateService.onLangChange.subscribe((lang) => {
      this.setHeaderSetting();
    })
  }

  ngOnChanges(): void {
    this.setHeaderSetting();
  }

  setHeaderSetting(): void {
    this.headerSetting = [
      {
        col: this.translateService.instant('LicenseMgmt.Common.Label.ReferenceNo'),
        content: this.formInfo.formNo
      },
      {
        col: this.translateService.instant('SalesOrderChange.Label.ApplyDate'),
        content:  this.datePipe.transform(this.formInfo.creationDate, 'yyyy/MM/dd')
      },
      {
        col: this.translateService.instant('APPROVING_LEH.Label.Applicant'),
        content: `${this.formInfo.userCode} ${this.formInfo.userName}` 
      }
    ]
  }

}
