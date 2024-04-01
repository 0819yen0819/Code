import { AfterViewChecked, AfterViewInit, ChangeDetectorRef, Component, ElementRef, EventEmitter, HostListener, Input, OnChanges, OnInit, Output, Pipe, QueryList, Renderer2, SecurityContext, ViewChildren } from '@angular/core';
import { Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { UserContextService } from 'src/app/core/services/user-context.service';
import { CONFIG_DATE_FILED, CONFIG_MID_SIZE_FILED, CONFIG_SMALL_SIZE_FILED, TABLE_HEADER_SOC_DEFAULT, TABLE_HEADER_SO_STD_CHG2, TABLE_HEADER_SO_STD_CHG3, CONFIG_NO_WRAP_COLS, MOBILE_CORE_COLS, MOBILE_CORE_COLS_CHG3 } from './soc-table-info';

@Component({
  selector: 'app-soc-items',
  templateUrl: './soc-items.component.html',
  styleUrls: ['./soc-items.component.scss']
})
export class SocItemsComponent implements OnInit, OnChanges, AfterViewInit, AfterViewChecked {
  @Input() formInfo: any = [];
  @Input() pendingListIncludeMe: boolean = false;
  @Input() docType: string = 'TABLE_HEADER_SOC_DEFAULT';
  @Output() lineInfo = new EventEmitter<any>();

  @ViewChildren("tableBodyElement") tableBodyElement: QueryList<ElementRef>;

  constructor(
    private translateService: TranslateService,
    private router: Router,
    private userContextService: UserContextService,
    private changeDetectorRef: ChangeDetectorRef,
    private elRef: ElementRef,
    private renderer: Renderer2
  ) {
    this.innerWidth = window.innerWidth;
  }

  get enableEditing(): boolean {
    const isApprovingPage = this.router.url.includes('approving');
    const allStatusDisabledChange = this.formInfo.lines.filter(item => item.defaultStatusReject).length === this.formInfo.lines.length
    return isApprovingPage && this.pendingListIncludeMe && !allStatusDisabledChange && !this.formInfo.iAmAssignee;
  }

  header = TABLE_HEADER_SOC_DEFAULT;
  dateHeader = CONFIG_DATE_FILED;
  smallSizeField = CONFIG_SMALL_SIZE_FILED;
  midSizField = CONFIG_MID_SIZE_FILED;
  wrapField = CONFIG_NO_WRAP_COLS;
  mobileCoreFields = [];
  alignRightField = [];

  rwdCutOffPoint = 768; // 要注意 scss 也要調整
  get rwdCutOffPointPx() { return this.rwdCutOffPoint + 'px'; }
  compressionMidSizeFieldPoint = 1580;
  scrollPoint = 1120;

  ngOnInit(): void {
    this.subscribeLangChange();
  }

  ngAfterViewInit() {
    setTimeout(() => {
      this.resetColumnsHeight();
      this.detectChanges();
    }, 0);
  }

  ngAfterViewChecked(): void {
    setTimeout(() => {
      this.resetColumnsHeight();
    }, 0);
  }

  maxColumnsHeightLine1 = 0;
  maxColumnsHeightLine2 = 0
  resetColumnsHeight() {
    const notInit = this.maxColumnsHeightLine1 === 0 && this.maxColumnsHeightLine2 === 0
    if (innerWidth < this.rwdCutOffPoint) {
      this.maxColumnsHeightLine1 = 30;
      this.maxColumnsHeightLine2 = 30;
      return;
    }

    this.maxColumnsHeightLine1 = 34;
    this.maxColumnsHeightLine2 = 34;

    const targetElements = this.tableBodyElement.toArray();

    targetElements.forEach((header, index) => {

      const line1Height = targetElements[index].nativeElement.children[0]?.children[0]?.children[0]?.children[0]?.offsetHeight ?? 0;
      const line2Height = targetElements[index].nativeElement.children[0]?.children[0]?.children[2]?.children[0]?.offsetHeight ?? 0;

      this.maxColumnsHeightLine1 = Math.max(line1Height, this.maxColumnsHeightLine1)
      this.maxColumnsHeightLine2 = Math.max(line2Height, this.maxColumnsHeightLine2)
    });

    // 補充空間 才不會太擠
    if (window.innerWidth > this.rwdCutOffPoint) {
      this.maxColumnsHeightLine1 *= 1.2;
      this.maxColumnsHeightLine2 *= 1.2;
    }

    this.changeDetectorRef.detectChanges();

  }

  tableData: any = {};
  ngOnChanges(): void {
    switch (this.docType) {
      case 'SO-STD-CHG3': this.header = TABLE_HEADER_SO_STD_CHG3; this.mobileCoreFields = MOBILE_CORE_COLS_CHG3; break;
      case 'SO-STD-CHG2': this.header = TABLE_HEADER_SO_STD_CHG2; this.mobileCoreFields = MOBILE_CORE_COLS; break;
      default: this.header = TABLE_HEADER_SOC_DEFAULT; break;
    }

    this.tableData = this.formInfo.lines;
    this.alignRightField = ['newSsdString', 'oldSsdString', 'newCrdString', 'oldCrdString', 'oldQuantityString', 'newQuantityString', 'oldAmountString', 'newAmountString', 'oldUc'] // 日期 數字靠右
    this.tableData?.forEach((element, index) => {  // 註2：lines中的data清單，HoldCommand資料若有多筆則用;分隔  
      element.isExpanded = false;
      // 為了比對日期是否一致，這邊先將時分秒去除，方便後續比對
      element.newSsdString = element.newSsd ? new Date(element.newSsd).toLocaleDateString('en-US') : ''
      element.oldSsdString = element.oldSsd ? new Date(element.oldSsd).toLocaleDateString('en-US') : ''
      element.newCrdString = element.newCrd ? new Date(element.newCrd).toLocaleDateString('en-US') : ''
      element.oldCrdString = element.oldCrd ? new Date(element.oldCrd).toLocaleDateString('en-US') : ''

      // 增加千分位
      element.oldQuantityString = (element.oldQuantity)?.toLocaleString("en", { minimumFractionDigits: 0, maximumFractionDigits: 20 })
      element.newQuantityString = (element.newQuantity)?.toLocaleString("en", { minimumFractionDigits: 0, maximumFractionDigits: 20 })
      element.oldAmountString = (element.oldAmount)?.toLocaleString("en", { minimumFractionDigits: 0, maximumFractionDigits: 20 })
      element.newAmountString = (element.newAmount)?.toLocaleString("en", { minimumFractionDigits: 0, maximumFractionDigits: 20 })

      element.holdRemark = element.datas?.map(data => this.translateService.currentLang === 'zh-tw' ? data.holdReasonC : data.holdReasonE).join(';')
      element.radioGroup = 'radioGroup' + index;
      // 整理輸出資料
      for (var k in element) {
        if (typeof element[k] == "number") this.alignRightField.push(k) // 數字靠右
        if (k === 'salesName') {
          element.salesNameString = `${element['salesCode']}  (${element['salesName']})`;
        }
      }

      if (element.itemType?.toUpperCase().includes('NCNR')) {
        const ncnrStartIndex = element.itemType.search(/ncnr/i) // 取得NCNR 開始的位置
        const originNcnrCase = element.itemType.substring(ncnrStartIndex, ncnrStartIndex + 4) // 取得 NCNR 原始的大小寫 Case 
        const redColorInnerHtml = `<span class="text-red-bold">${originNcnrCase}</span>`;
        const textBeforeNcnr = `<span class="text-output">${element.itemType.substring(0, ncnrStartIndex)}</span>`;
        const textAfterNcnr = `<span class="text-output">${element.itemType.substring(ncnrStartIndex + 4, element.itemType?.length)}</span>`;
        element.itemTypeInnerHTML = `${textBeforeNcnr}${redColorInnerHtml}${textAfterNcnr}`
      } else {
        element.itemTypeInnerHTML = `<span class="text-output">${element.itemType}</span>`
      }

    });
    this.alignRightField = [...new Set(this.alignRightField)];

    this.tableDataChange();
  }

  subscribeLangChange() {
    this.translateService.onLangChange.subscribe((lang) => {
      this.tableData.forEach(element => {
        element.holdRemark = element.datas?.map(data => lang.lang === 'zh-tw' ? data.holdReasonC : data.holdReasonE).join(';')
      });
    });
  }

  tableDataChange() {
    this.resetAllRadioStatus();
    this.lineInfo.emit(this.tableData);
  }

  toggleAll(e) {
    this.formInfo.lines.forEach(line => {
      if (!line.defaultStatusReject) {
        line.status = e;
      }
    })
    this.lineInfo.emit(this.tableData);
  }

  innerWidth
  @HostListener('window:resize', ['$event'])
  onResize(event) {
    this.innerWidth = window.innerWidth;
    this.resetColumnsHeight();
  }

  detectChanges() {
    setTimeout(() => {
      // innerHtml的元素需要透過JS去加樣式
      const CSSArr_TextRedBold = this.elRef.nativeElement.querySelectorAll('span.text-red-bold');
      CSSArr_TextRedBold?.forEach(element => {
        this.renderer.setStyle(element, 'color', 'red');

        this.innerWidth <= this.rwdCutOffPoint
          ? this.renderer.setStyle(element, 'fontSize', '16px')
          : this.renderer.setStyle(element, 'fontSize', '12px')
      });

      const CSSArr_TextOutPut = this.elRef.nativeElement.querySelectorAll('span.text-output');
      CSSArr_TextOutPut?.forEach(element => {
        this.innerWidth <= this.rwdCutOffPoint
          ? this.renderer.setStyle(element, 'fontSize', '16px')
          : this.renderer.setStyle(element, 'fontSize', '12px')
      });
      CSSArr_TextOutPut?.forEach(element => {
        this.innerWidth <= this.rwdCutOffPoint
          ? this.renderer.setStyle(element, 'fontWeight', 'normal')
          : this.renderer.setStyle(element, 'fontWeight', 'bold');
      });
    }, 0);
  }

  /**
   * 決定該欄位是否要顯示紅字
   * @param rowData 
   * @param field 
   * @returns 
   */
  highlightThis(rowData, field: string) {
    const COMPARISON_FIELD = this.formInfo.flowSetting?.flowConfig?.filter(item => item.configId === 'COMPARISON_FIELD') ?? [];
    const COMPARISON_VAL1 = COMPARISON_FIELD[0]?.configVal1.split(';');
    const COMPARISON_VAL2 = COMPARISON_FIELD[0]?.configVal2.split(';');

    if (rowData[field + 'cssClass'] !== undefined) { return rowData[field + 'cssClass'] }; // 如果已經算過了 就直接用上次算的

    const configEmpty = !COMPARISON_VAL1 || !COMPARISON_VAL2; // 有可能 COMPARISON_VAL2 還沒有撈到，所以這次不設定資料並返回 ''
    if (configEmpty) { return ''; }

    const configUnexpected = COMPARISON_VAL1.length !== COMPARISON_VAL2.length;  // COMPARISON_VAL1 跟 COMPARISON_VAL2 對不起來，設定檔有誤，設定為 nullClass 並不再處理
    const compareFieldExist = COMPARISON_VAL2.includes(field); // 當前這個是要決定是否為紅字欄位，若不是則設定為 nullCase 並不再處理
    if (configUnexpected || !compareFieldExist) { rowData[field + 'cssClass'] = 'nullClass'; return 'nullClass'; }

    rowData[field + 'cssClass'] = 'nullClass'; // 預設為 nullClass

    const fieldIndex = COMPARISON_VAL2.indexOf(field); // 用於找出對應基準的 field
    const currentField = COMPARISON_VAL2[fieldIndex]; // 當前 field
    const targetField = COMPARISON_VAL1[fieldIndex]; // 基準的 field
    const notEqual = rowData[currentField] !== rowData[targetField]; // 當前的 field 的值 與 基準 field 值不符
    // SO-STD-CHG2
    if (this.docType === 'SO-STD-CHG2') { rowData[field + 'cssClass'] = notEqual ? 'text-red-bold' : 'nullClass'; }
    // SO-STD-CHG3
    else {
      if (notEqual && rowData[currentField]) { rowData[field + 'cssClass'] = 'text-red-bold'; }
      // 如果欄位是 itemType 且值為 NCNR，則還是要顯示紅字
      else if (currentField === 'itemType' && (rowData[currentField] === 'NCNR' || rowData[currentField] === 'ncnr')) { rowData[field + 'cssClass'] = 'text-red-bold'; }
    }

    // 沒有結果 預設回傳 nullClass 表示不再處理
    return rowData[field + 'cssClass'];
  }

  isAll;
  private resetAllRadioStatus() {
    let countIsA = 0;
    let countIsR = 0;
    const dataTotal = this.tableData.filter(item => !item.defaultStatusReject).length; // 排除不可編輯的

    this.tableData.forEach(element => {
      if (!element.defaultStatusReject) {
        if (element.status === 'A') { countIsA++; }
        if (element.status === 'R') { countIsR++; }
      }
    });

    if (countIsA === dataTotal) { this.toggleAll('A'); this.isAll = 'A' }
    else if (countIsR === dataTotal) { this.toggleAll('R'); this.isAll = 'R' }
    else { this.isAll = ''; };
  }

}
