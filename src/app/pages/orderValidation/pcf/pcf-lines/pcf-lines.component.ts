import { ChangeDetectorRef, Component, ElementRef, EventEmitter, HostListener, Input, OnChanges, OnInit, Output, Renderer2, SimpleChanges } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { BehaviorSubject, Observable, catchError, concatMap, from, lastValueFrom, mergeMap, takeLast, throwError } from 'rxjs';
import { AttachedFileLog, FileUploadCallback, SaveFileLog } from 'src/app/core/model/file-info';
import { FileUploader, FileUploaderManager } from 'src/app/core/model/file-uploader';
import { DialogSettingParams } from 'src/app/core/model/selector-dialog-params';
import { LoaderService } from 'src/app/core/services/loader.service';
import { MyFlowService } from 'src/app/core/services/my-flow.service';
import { ToastService } from 'src/app/core/services/toast.service';
import { MOBILE_CORE_COLS, PCF_CONFIG_ALIGN_RIGHT, pcfLinesCols_MC, pcfLinesCols_WorstPrice } from './pcf-lines-const';
import { LanguageService } from 'src/app/core/services/language.service';
import { PcfService } from '../pcf.service';
import { CommonApiService } from 'src/app/core/services/common-api.service';
import { DatePipe } from '@angular/common';
import { PCF_CONFIG_ID } from '../pcf-const';

@Component({
  selector: 'app-pcf-lines',
  templateUrl: './pcf-lines.component.html',
  styleUrls: ['./pcf-lines.component.scss']
})
export class PcfLinesComponent implements OnInit, OnChanges {
  @Input() formInfo;
  @Output() linesChange = new EventEmitter<any>();

  // 檔案
  fileUploaderSettings!: FileUploader;
  selectedFileList: BehaviorSubject<File[]> = new BehaviorSubject<File[]>([]);;

  // 通知
  noticeCheckDialogParams!: DialogSettingParams;
  noticeContentList!: string[];

  // Table
  alignRightCols = PCF_CONFIG_ALIGN_RIGHT;
  disabledLineApproveBtn = true; // 是否禁用Approve/Reject
  tableData;
  tableCols;
  linesMtn = { // 0-0維護畫面相關參數
    show: false,
    data: null,
    index: -1,
    formInfo: null
  }

  remarkRule = {
    ap: false,
    sm: false,
    pm: false
  }
  mobileCoreFields = MOBILE_CORE_COLS;

  rwdBreakPoints = 768; // CSS 也要改
  get rwdBreakPointsString() {
    return this.rwdBreakPoints + 'px'
  }

  constructor(
    private translateService: TranslateService,
    private myFlowService: MyFlowService,
    private loaderService: LoaderService,
    private toastService: ToastService,
    private languageService: LanguageService,
    private pcfService: PcfService,
    private commonApiService: CommonApiService,
    private changeDetectorRef: ChangeDetectorRef,
    private datePipe: DatePipe,
    private el: ElementRef,
    private renderer: Renderer2
  ) {
    this.innerWidth = window.innerWidth;
  }

  innerWidth;
  @HostListener('window:resize', ['$event'])
  onViewPointWatcher(event: { target: { innerWidth: number } }): void {
    this.innerWidth = event.target.innerWidth;
  }

  ngOnInit(): void {
    this.initMtnColumn();
    this.onInitFileUploadSettings();
    this.subscribeLangChange();
    this.initBatchRule();
    this.initLineApproveRule();
    this.initRemarkRule();
  }

  ngOnChanges(changes: SimpleChanges): void {
    this.tableCols = (this.formInfo.formType === 'SO-M-C_WorstPrice') || (this.formInfo.docType === 'SO-M-C_WorstPrice')
      ? JSON.parse(JSON.stringify(pcfLinesCols_WorstPrice))
      : JSON.parse(JSON.stringify(pcfLinesCols_MC))

    this.tableData = this.preProcess(this.formInfo.trxLines);
    this.lineStatusChange();
    this.linesChange.emit(this.tableData);
    this.initMtnPriceRule();
    this.initColumn();
  }

  subscribeLangChange() {
    this.translateService.onLangChange.subscribe((lang) => {
      this.initMtnColumn();
      this.fileUploaderSettings.chooseLabel = this.translateService.instant('LicenseMgmt.Common.Hint.AddFileCKMe'); // 更改上傳設定顯示字樣
      this.tableData.forEach(element => { element.holdRemark = element.holdCommand?.map(data => lang.lang === 'zh-tw' ? data.holdReasonC : data.holdReasonE).join(';') }); // 更改remark對應
    });
  }

  // getFlowSetting  isDisplay 'N' 表示該欄位不顯示 type:Line表示為明細行
  initColumn() {
    // 註1：當isBatch為Y時，才需要顯示。 orderNumber、currency、orderDate、customer、orderDate、userCode
    // 註2：當checkPermission為Y，才需要顯示。 salesCostType、salesCostNo
    const note1 = this.formInfo.isBatch === 'Y' || this.formInfo.docType === 'SO-M-C';
    const note2 = this.formInfo.checkPermission === 'Y';

    const note1Arr = ['ouCode', 'ouName', 'orderNumber', 'currency', 'orderDate', 'customer', 'applicantString']
    const note2Arr = ['salesCostType', 'salesCostNo']

    if (!note1) { this.tableCols = this.tableCols.filter(cols => !note1Arr.includes(cols.field)); }
    if (!note2) { this.tableCols = this.tableCols.filter(cols => !note2Arr.includes(cols.field)); }

    // AP -> Only AP remark
    // SM -> AP / SM Remark
    // PM -> AP / SM / PM Remark 都秀 
    const signTypeNotAllowColumnArr = [];
    if (this.formInfo.signType === 'AP') { signTypeNotAllowColumnArr.push('smRemark', 'pmRemark') }
    if (this.formInfo.signType === 'SM') { signTypeNotAllowColumnArr.push('pmRemark') }
    this.tableCols = this.tableCols.filter(cols => !signTypeNotAllowColumnArr.includes(cols.field));

    this.formInfo.getFlowSettingRsp.columns.forEach(column => {
      if ((column.isDisplay === 'N') && (column.type === 'Line')) {
        this.tableCols = this.tableCols.filter(cols => {
          return cols.columnId ? cols.columnId !== column.columnId : cols.field !== column.columnId.replace("l_", "")
        });
      }
    });
  }

  mtnColumn = [];
  initMtnColumn() {
    const isWsp = this.formInfo.docType === 'SO-M-C_WorstPrice';
    this.mtnColumn = this.translateService.instant( isWsp ? 'PriceControlForm.PCFLinesMtnColumnsWSP' : 'PriceControlForm.PCFLinesMtnColumns');
    this.formInfo.getFlowSettingRsp.columns
      ?.filter(item => item.type === 'Maintain') // 只留 Maintain
      .filter(item => item.isDisplay === 'N') // 只留 isDisplay 是 N，因為預設顯示
      .forEach(column => {
        this.mtnColumn = this.mtnColumn.filter(cols => cols.columnId !== column.columnId);  // 過濾掉 display 為 N 的資料
      });
  }

  initMtnPriceRule() {
    // 是否要顯示維護M-C按鈕：Y的話點Approve時才要顯示，且Sales Cost Type要等於[FlowConfigSetting].ConfigVal2 (config2可能多個)
    // 若有ruleId= MAINTAIN_M-C且ruleVal1=Y，表示要有維護M-C功能，若ruleVal2有值表示明細的salesCostType符合裡面的條件，
    // 且user在明細中選擇Approve，要在Approve的選項下方顯示維護M-C的功能，此選項僅有在signType=PM時才會顯示
    this.tableData.forEach(line => { line.canEditPriceMtn = false })

    const MAINTAIN_MC_ARR = this.formInfo.getFlowSettingRsp.flowConfig?.filter(config => config.configId === PCF_CONFIG_ID.MAINTAIN_MC) || [{}]; // 當前 formType 撈出的 [sov].[FlowConfigSetting]
    const MAINTAIN_MC_FLAG = MAINTAIN_MC_ARR[0]?.configVal1 === 'Y'; // [sov].[FlowConfig] 是否要顯示維護M-C按鈕
    const MAINTAIN_MC_VALUE_ARR = MAINTAIN_MC_ARR[0]?.configVal2?.split(';') // MAINTAIN_M-C 的值

    if (MAINTAIN_MC_FLAG) {
      MAINTAIN_MC_VALUE_ARR?.forEach(element => {
        this.tableData.forEach(line => {
          const salesCostTypeEqual = this.formInfo.formType === 'SO-M-C_WorstPrice' ? true : line.salesCostType === element;
          const isApprovingUrl = this.formInfo?.initFormInfo?.urlIncludeApproving;
          const pendingIncludeMe = this.formInfo?.initFormInfo.pendingIncludeMe;
          const signTypeIsPM = this.formInfo?.signType === 'PM';
          // " line.canEditPriceMtn || " 是避免設成 True 後但 多個 MAINTAIN_M-C 導致又被改為 False
          line.canEditPriceMtn = line.canEditPriceMtn || (salesCostTypeEqual && isApprovingUrl && pendingIncludeMe && signTypeIsPM);
        })
      });
    }
  }

  showBatch = true;
  initBatchRule() {
    const BATCH_MAINTAIN = this.formInfo.getFlowSettingRsp.flowConfig?.filter(config => config.configId === PCF_CONFIG_ID.BATCH_MAINTAIN) || [{}];
    const ENABLED_BATCH_MAINTAIN = BATCH_MAINTAIN[0]?.configVal1 === 'Y';
    this.showBatch = ENABLED_BATCH_MAINTAIN && this.formInfo.initFormInfo.pendingIncludeMe && this.formInfo.initFormInfo.urlIncludeApproving;
  }

  initLineApproveRule() {
    const allStatusDisabledChange = this.tableData.filter(item => item.defaultStatusReject).length === this.tableData.length;
    this.disabledLineApproveBtn = (!this.formInfo.initFormInfo.pendingIncludeMe || !this.formInfo.initFormInfo.urlIncludeApproving && !allStatusDisabledChange) || this.formInfo.initFormInfo.iAmAssignee;
  }

  initRemarkRule() {
    // 若表單關卡非申請人，依照傳入的signType判斷要顯示的明細行Remark欄位
    // signType：AP，可填寫Apply Remark
    // signType：SM，可填寫SM Remark
    // signType：PM，可填寫PM Remark 
    this.remarkRule = {
      ap: (this.formInfo.signType === 'AP') && this.formInfo.initFormInfo.pendingIncludeMe && this.formInfo.initFormInfo.urlIncludeApproving,
      sm: (this.formInfo.signType === 'SM') && this.formInfo.initFormInfo.pendingIncludeMe && this.formInfo.initFormInfo.urlIncludeApproving,
      pm: (this.formInfo.signType === 'PM') && this.formInfo.initFormInfo.pendingIncludeMe && this.formInfo.initFormInfo.urlIncludeApproving
    }
  }

  // 拖曳檔案
  onDropHandler(event: { files: any }) { this.selectedFileList.next([event.files[0]]); }
  // 拖曳檔案錯誤
  onDropError(event) { this.showDialog(this.translateService.instant(event).split(), 'error'); }

  // 上傳被點擊
  uploadAttachedFileOnClick(event, fileUploader: any): void {
    this.selectedFileList.next([event.files[0]]);

    this.loaderService.show();
    lastValueFrom(this.pcfService.uploadPriceControlForm(this.formInfo.curFormNo, event.files[0]))
      .then((res: any) => {
        this.tableData = this.preProcess(res.body.trxLines);
        this.linesChange.emit(this.tableData);
        this.toastService.success(`${this.translateService.instant('LicenseMgmt.Common.Hint.AddFileSuccess')}`);
      })
      .catch(err => { this.showDialog([...err.error.errors], 'error') })
      .finally(() => { this.loaderService.hide(); })
  }

  // 維護按鈕被點擊
  mtnOnClick(data, i) {
    this.linesMtn = { show: true, data: data, index: i, formInfo: this.formInfo }
  }

  getLinesMtnEvent(e) {
    this.tableData[this.linesMtn.index].maintain = {
      currency: e.currency,
      minSellingPrice: e.minSellingPrice,
      maxSellingPrice: e.maxSellingPrice,
      salesCost: e.salesCost,
      controlFlag: e.controlFlag,
      worstSalesGP: e.worstSalesGP,
      endDate: e.endDate,
      startDate: e.startDate,
      endCustomer: e.endCustomer,
      rowIndex: this.linesMtn.index,
      creationBy: e.creationBy,
      creationDate: e.creationDate,
      lastUpdatedBy: e.lastUpdatedBy,
      lastUpdatedDate: e.lastUpdatedDate
    }
    this.linesMtn = { show: false, data: this.tableData[this.linesMtn.index], index: this.linesMtn.index, formInfo: this.formInfo }
    this.linesChange.emit(this.tableData);
  }

  toggleAllValue = '';
  toggleAll(e) {
    this.tableData.forEach(line => {
      if (!line.defaultStatusReject) {
        line.status = e.substring(0, 1);
      }
    })
    this.linesChange.emit(this.tableData);
  }

  lineStatusChange() {
    const dataLength = this.tableData.filter(item => !item.defaultStatusReject).length; // 排除不可編輯的;;
    let aCount = 0, rCount = 0;
    this.tableData.forEach(line => {
      if (!line.defaultStatusReject) {
        if (line.status === 'A') { aCount++ }
        if (line.status === 'R') { rCount++ }
      }
    })
    this.toggleAllValue = '';
    if (aCount === dataLength) { this.toggleAllValue = 'A' }
    if (rCount === dataLength) { this.toggleAllValue = 'R' }
  }

  // 匯出檔案
  async exportListOnClick() {
    this.loaderService.show();
    try {
      const exportPriceControlFormRsp: any = await lastValueFrom(this.pcfService.exportPriceControlForm(this.formInfo.curFormNo));
      this.commonApiService.downloadFile(exportPriceControlFormRsp.body?.fileId);
    } catch (error) {
      this.loaderService.hide();
    }
    this.loaderService.hide();
  }

  // 初始化上傳檔案設定
  private onInitFileUploadSettings(): void {
    this.fileUploaderSettings = new FileUploaderManager();
    this.fileUploaderSettings.chooseLabel = this.translateService.instant('LicenseMgmt.Common.Hint.AddFileCKMe');
  }

  //> 顯示 Notice Dialog
  private showDialog(labels: string[], mode: string = 'success') {
    this.noticeContentList = new Array<string>();
    labels.forEach(label => { this.noticeContentList.push(label); });
    this.noticeCheckDialogParams = { title: this.translateService.instant('LicenseMgmt.Common.Title.Notification'), visiable: true, mode: mode };
  }

  // Table 有些資料需要先調整
  private preProcess(trxLines: any) {
    let maxItemLength = 0;
    let data = [...trxLines];
    data.forEach((line, index) => {
      line.holdCommandString = line.holdCommand[0].holdCommand;
      line.holdRemark = line.holdCommand?.map(data => this.languageService.getLang() === 'zh-tw' ? data.holdReasonC : data.holdReasonE).join(';');
      line.customerString = line.custCode + line.custName; // Customer	文字顯示	custCode+custName(註1)
      line.salesPersonString = line.salesCode + line.salesName // Sales Person	文字顯示	salesCode+salesName
      line.profitDeptString = line.salesDeptCode // 文字顯示	salesDeptCode+salesDeptName
      line.applicantString = line.userCode + line.userName // Applicant	文字顯示	userCode+userName(註1)
      line.requestDate = this.datePipe.transform(line.requestDate, 'yyyy-MM-dd');
      line.scheduleDate = this.datePipe.transform(line.scheduleDate, 'yyyy-MM-dd');
      line.orderDate = this.datePipe.transform(line.orderDate, 'yyyy-MM-dd');
      line.radioGroup = 'radioGroup' + index;
      if (line.maintain?.startDate) {
        line.maintain.startDateString = this.datePipe.transform(line.maintain.startDate, 'yyyy-MM-dd');
      }
      if (line.maintain?.endDate) {
        line.maintain.endDateString = this.datePipe.transform(line.maintain.endDate, 'yyyy-MM-dd');
      }
      line.isExpanded = false;
      maxItemLength = Math.max(maxItemLength, line.productCode?.length)  // 處理資料的時候順便計算一下trxLine中最多字的Item的字數
    })

    // 因為CSS都是固定尺寸，所以透過JS來更改Item的寬度，讓Item可以根據字數長成對應的寬度
    setTimeout(() => {
      const tempWidth = maxItemLength * 10 + 10; // 每個字給10px 確保不會換行
      const targetWidth = Math.min(Math.max(tempWidth,65),200) ;  // limit: 65px ~ 200px
      this.el.nativeElement
        .querySelectorAll('.pcf-item-col')
        .forEach((element: HTMLElement) => { this.renderer.setProperty(element, 'style', `min-width: ${targetWidth}px !important`) });
    }, 0);

    return data;
  }
}
