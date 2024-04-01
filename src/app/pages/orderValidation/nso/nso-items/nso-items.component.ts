import { ChangeDetectorRef, Component, EventEmitter, HostListener, Input, OnChanges, OnInit, Output } from '@angular/core';
import { TABLE_HEADER_NSO_DEFAULT,MOBILE_CORE_COLS } from './nso-item-cols';
import { TranslateService } from '@ngx-translate/core';
import { Router } from '@angular/router';
import { DatePipe } from '@angular/common';
import { LanguageService } from 'src/app/core/services/language.service';
@Component({
  selector: 'app-nso-items',
  templateUrl: './nso-items.component.html',
  styleUrls: ['./nso-items.component.scss']
})
export class NsoItemsComponent implements OnInit, OnChanges {
  @Input() formInfo: any = [];
  @Input() pendingListIncludeMe: boolean = false;
  @Output() lineInfo = new EventEmitter<any>();

  constructor(
    private datePipe: DatePipe,
    private translateService: TranslateService,
    private router: Router,
    private languageService: LanguageService,
    private changeDetectorRef: ChangeDetectorRef
  ) {
    this.innerWidth = window.innerWidth;
  }

  get enableEditing(): boolean {
    const isApprovingPage = this.router.url.includes('approving');
    const allStatusDisabledChange = this.formInfo.lines.filter(item => item.disabledStatusBtn).length === this.formInfo.lines.length
    return isApprovingPage && this.pendingListIncludeMe && !allStatusDisabledChange  && !this.formInfo.iAmAssignee;
  }

  cols = JSON.parse(JSON.stringify(TABLE_HEADER_NSO_DEFAULT));
  alignRightCols = [];

  tableData;

  rwdCutOffPoint = 768; // 要注意 css 也要改
  get rwdCutOffPointPx() { return this.rwdCutOffPoint + 'px'; }
  compressionSizeFieldPoint = 1280;
  mobileCoreFields = MOBILE_CORE_COLS;

  ngOnInit(): void {
    this.subscribeLangChange();
    this.adjustTableLayout();
  }

  ngOnChanges(): void {
    this.tableData = this.formInfo.lines;

    this.alignRightCols = ['newCrd','salesMargin','newQuantityString','newAmountString'] // 日期 數字靠右
    this.tableData.forEach((element, index) => {
      element.isExpanded = false;
      element.newQuantityString = (element.newQuantity)?.toLocaleString("en", { minimumFractionDigits: 0, maximumFractionDigits: 20 })
      element.newAmountString = (element.newAmount)?.toLocaleString("en", { minimumFractionDigits: 0, maximumFractionDigits: 20 })

      element.wrapCols = [];

      element.holdRemark = element.datas?.map(data => this.translateService.currentLang === 'zh-tw' ? data.holdReasonC : data.holdReasonE).join(';')
      element.newCrd = this.datePipe.transform(element.newCrd, 'yyyy-MM-dd')

      element.radioGroup = 'radioGroup' + index;
      element.paymentTermByLang = this.languageService.getLang() === 'zh-tw' ? element.paymentTermCht : element.paymentTerm

      // 整理輸出資料
      for (var k in element) {
        if (typeof element[k] == "number") this.alignRightCols.push(k) // 數字靠右
        if (k === 'salesName') {
          element.salesNameString = `${element['salesCode']}  (${element['salesName']})`;
        }
      }

      // 8字以下，不換行
      Object.keys(element).forEach(function (k) { 
        if (element[k] && element[k]?.toString().length > 8) {
          const exceptCols = ['wrapCols', 'datas', 'newCrd']
          if (exceptCols.includes(k)) { return; }
          element.wrapCols.push(k);
        }
      });

    });  
    this.alignRightCols = [...new Set(this.alignRightCols)];

    this.tableDataChange();
  }

  innerWidth
  @HostListener('window:resize', ['$event'])
  onResize(event) {
    this.innerWidth = window.innerWidth;
    this.adjustTableLayout();
  }

  adjustTableLayout() {
    if (this.innerWidth < this.compressionSizeFieldPoint) {
      this.cols.forEach(item => { item.colSize = 'xs-col'; })
    } else {
      this.cols = JSON.parse(JSON.stringify(TABLE_HEADER_NSO_DEFAULT));
    }
    this.changeDetectorRef.detectChanges();
  }

  toggleAll(e) {
    this.tableData.forEach(line => {
      if (!line.defaultStatusReject) {
        line.status = e;
      }
    })
    this.isAll = e;
    this.lineInfo.emit(this.tableData);
  }

  tableDataChange() {
    this.resetAllRadioStatus();
    this.lineInfo.emit(this.tableData);
  }

  subscribeLangChange() {
    this.translateService.onLangChange.subscribe((lang) => {
      this.tableData.forEach(element => {
        element.holdRemark = element.datas?.map(data => lang.lang === 'zh-tw' ? data.holdReasonC : data.holdReasonE).join(';');
        element.paymentTermByLang = lang.lang === 'zh-tw' ? element.paymentTermCht : element.paymentTerm;
      });
    });
  }

  isAll;
  private resetAllRadioStatus() {
    let countIsA = 0;
    let countIsR = 0;
    const dataTotal = this.tableData.filter(item => !item.defaultStatusReject).length; // 排除不可編輯的;

    this.tableData.forEach(element => {
      if (!element.defaultStatusReject){
        if (element.status === 'A') { countIsA++; }
        if (element.status === 'R') { countIsR++; }
      } 
    });
 
    if (countIsA === dataTotal) { this.toggleAll('A'); this.isAll = 'A' }
    else if (countIsR === dataTotal) { this.toggleAll('R'); this.isAll = 'R' }
    else { this.isAll = ''; };
  }

}
