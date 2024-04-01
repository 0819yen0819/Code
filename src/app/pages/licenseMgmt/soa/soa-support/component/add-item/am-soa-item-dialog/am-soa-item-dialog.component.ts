import { Component, EventEmitter, Input, isDevMode, OnInit, Output } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { SelectorItemType } from 'src/app/core/enums/selector-item-type';
import { FileUploader, FileUploaderManager } from 'src/app/core/model/file-uploader';
import { DialogSettingParams, SelectorDialogParams } from 'src/app/core/model/selector-dialog-params';
import { SoaApiService } from 'src/app/core/services/soa-api.service';
import { SoaCommonService } from '../../../../soa-common.service';
import { allItemTemplate } from '../add-item.const';
import { CommonApiService } from 'src/app/core/services/common-api.service';
import { ConfirmationService as NGConfirmationService, SelectItem } from 'primeng/api';
import { lastValueFrom, takeLast } from 'rxjs';
import { LicenseControlApiService } from 'src/app/core/services/license-control-api.service';

@Component({
  selector: 'app-am-soa-item-dialog',
  templateUrl: './am-soa-item-dialog.component.html',
  styleUrls: ['./am-soa-item-dialog.component.scss']
})
export class AmSoaItemDialogComponent implements OnInit {
  @Input() showDialog = false;
  @Output() closeDialog = new EventEmitter<any>();
  @Output() itemInfoEmitter = new EventEmitter<any>();
  @Output() mulitpleItemEmitter = new EventEmitter<any>();

  itemInfo = JSON.parse(JSON.stringify(allItemTemplate));
  showSpinner = false;

  selectorDialogParams!: SelectorDialogParams;
  fileUploaderSettings: FileUploader = new FileUploaderManager();

  noticeCheckDialogParams!: DialogSettingParams;
  noticeContentList: string[] = new Array<string>();

  deduction = {
    options: ['N', 'Y']
  };

  constructor(
    private translateService: TranslateService,
    private soaApiService: SoaApiService,
    public soaCommonService: SoaCommonService,
    private commonApiService: CommonApiService,
    private ngConfirmationService: NGConfirmationService,
    private licenseControlApiService:LicenseControlApiService
  ) { }

  ngOnInit(): void {
    this.getEccnList();
    this.subscribeLangChange();
  }

  subscribeLangChange() {
    this.translateService.onLangChange.subscribe(() => {
      this.eccnListOptions[0] = {label:`${this.translateService.instant('Input.PlaceHolder.PleaseSelect')} ECCN`,value:''};
      // 觸發刷新
      this.itemInfo.value.eccn = ' ';
      setTimeout(() => { this.itemInfo.value.eccn = '';  }, 0);
    });
  } // 訂閱語言變換


  deductChange() {
    this.itemInfo.value.isDeduct === 'N' ? this.itemInfo.value.qty = 0 : this.itemInfo.value.qty = null
  }

  onFormSubmit() {
    this.itemInfoEmitter.emit(this.itemInfo);
    this.close();
  }
  
  onOpenSelectorBrandDialog(): void {
    this.selectorDialogParams = {
      title: `${this.translateService.instant('Dialog.Header.Choose')} Brand`,
      type: SelectorItemType.BRAND_WITHOUT_ALL,
      visiable: true,
    };
  } 

  onOpenSelectorDialogEvent(): void {
    this.selectorDialogParams = {
      title: `${this.translateService.instant('Dialog.Header.Choose')} Item`,
      type: SelectorItemType.ITEM,
      visiable: true,
    };
  }

  async onSelectorDialogCallback(res) { 
    if (this.selectorDialogParams.type === SelectorItemType.ITEM){
      this.itemInfo = this.appendOriginDeductValue(res);
      let rsp = await lastValueFrom(this.commonApiService.queryItemMasterByInvItemNos([res.value.invItemNo])); 
      this.itemInfo.value.eccn = rsp.itemMasterList[0].eccn
      this.itemInfo.value.brand = rsp.itemMasterList[0].brand; 
      this.itemInfo.value.ctg1 = rsp.itemMasterList[0].ctg1;
      this.itemInfo.value.ctg2 = rsp.itemMasterList[0].ctg2;
      this.itemInfo.value.ctg3 = rsp.itemMasterList[0].ctg3; 
    }else if(this.selectorDialogParams.type === SelectorItemType.BRAND_WITHOUT_ALL ){
      // brand變更時清除資料
      this.itemInfo.value.brand = res.value.code; 
      this.itemInfo.value.ctg1 = '';
      this.itemInfo.value.ctg2 = '';
      this.itemInfo.value.ctg3 = '';

      this.ctg2Options = [];
      this.ctg3Options = [];

      // 設定ctg1下拉選單選項
      this.setCtg1Options();
    }
  }

  /**
   * 取消
   */
  onCloseAddItemDialogEvent() {
    this.close();
  }

  onDownloadSampleFileEvent(): void {
    this.commonApiService.downloadFile(1644);
  }

  /**
   * 送出按鈕
   */
  multipleItemUpload() {
    this.showSpinner = true;
    const formNo = this.soaCommonService.SOAformNo;
    this.soaApiService.itemUploadSOA(this.selectedFileList[0], formNo).subscribe({
      next: (rsp: any) => {
        if (rsp.body) {
          this.mulitpleItemEmitter.emit(this.handleNullItem(rsp.body));
          this.showSpinner = false;
          this.close();
        }
      },
      error: (rsp) => {
        isDevMode() && console.log('fail', rsp);

        if (rsp.error?.code === 'ItemUploadCanNotParse') {
          this.showMulitpleMsgDialog(rsp.error.errors,'error')
        } else {
          // setTimeout(() => {
          //   const curLang = this.translateService.currentLang;
          //   const errorMsg = curLang === 'zh-tw' ? rsp.error.message : rsp.error.messageEn
          //   this.showMsgDialog(errorMsg ? errorMsg : this.translateService.instant('System.Message.Error'));
          // }, 0); 
          const errorMsg = rsp.error?.message || this.translateService.instant('System.Message.Error');
          this.showMsgDialog(errorMsg,'error');
        }
        this.showSpinner = false;
      }
    });
  }

  close() {
    this.itemInfo = JSON.parse(JSON.stringify(allItemTemplate));
    this.closeDialog.emit();
    this.fileUploader?.clear();
    this.selectedFileList = [];
    this.itemInfo.value.ctg1 = ''; 
    this.itemInfo.value.ctg2 = ''; 
    this.itemInfo.value.ctg3 = '';
    this.ctg1Options = []; 
    this.ctg2Options = []; 
    this.ctg3Options = []; 
  }

  mulitpleAddOnRemove() {
    this.selectedFileList = [];
  }

  // 檔案上傳
  selectedFileList: File[] = []; // p-fileload target file array
  fileUploader
  onFileUploadHandler(file: any, fileUploader: any): void {
    if (!this.customeSelectFileAccept(file, fileUploader)) { return; }

    this.selectedFileList = [...this.selectedFileList]; // avoid to primeNG default list opt.
    const fileErrorHint = this.isAcceptFile(file.currentFiles[0], this.fileUploaderSettings.accept);
    fileErrorHint
      ? this.showMsgDialog(fileErrorHint,'error')
      : (this.selectedFileList = file.currentFiles);

    this.fileUploader = fileUploader;
  }

  // Handle user select limit
  customeSelectFileAccept(file: any, fileUploader: any) {
    let fileUnexpectMsg = [];
    file.currentFiles.forEach((selectFile) => {
      fileUnexpectMsg.push(
        this.isAcceptFile(selectFile, this.fileUploaderSettings.accept)
      );
    });

    const haveUnexepectFile = fileUnexpectMsg.filter((item) => item !== undefined).length > 0;

    if (haveUnexepectFile) {
      fileUploader.clear();
      this.showMsgDialog(fileUnexpectMsg.pop(),'error');
      return false;
    }
    else { return true; }
  }

  // Handle drop event
  onDropHandler(event) {
    this.selectedFileList = event.files;
  }

  // Handle drop error
  onDropError(event) {
    this.showMsgDialog(event,'error');
  }

  ctg1Options: SelectItem[] = [];
  ctg2Options: SelectItem[] = [];
  ctg3Options: SelectItem[] = [];
  async ctg1OnChange(){
    this.itemInfo.value.ctg2 = '';
    this.itemInfo.value.ctg3 = '';
    this.ctg2Options = [];
    this.ctg3Options = [];
    if (!this.itemInfo.value.ctg1){return;}
    // 設定ctg2下拉選單選項
    this.setCtg2Options();
  }

  async ctg2OnChange(){
    this.itemInfo.value.ctg3 = '';
    this.ctg3Options = [];
    if (!this.itemInfo.value.ctg2){return;}
 
    // 設定ctg3下拉選單選項
    this.setCtg3Options();
  }

  async setCtg1Options(){
    const model = {
      "brand":this.itemInfo.value.brand
    }
    let OptionRes = await lastValueFrom(this.commonApiService.queryBrandCtg(model));
    OptionRes.brandList = OptionRes.brandList?.filter(item => item.ctg1 !== ''); // 如果沒資料就清除 免得顯示empty
    OptionRes.brandList.unshift({ctg1:'',value:'All',label:''}) // 補上選項
    this.ctg1Options = this.processToSelectOptions(OptionRes.brandList?.map(item => item.ctg1).filter(item => item !== undefined));
  }

  async setCtg2Options(){
    const model = {
      "brand":this.itemInfo.value.brand,
      "ctg1":this.itemInfo.value.ctg1
    }
    let OptionRes = await lastValueFrom(this.commonApiService.queryBrandCtg(model));
    OptionRes.brandList = OptionRes.brandList?.filter(item => item.ctg2 !== ''); // 如果沒資料就清除 免得顯示empty
    OptionRes.brandList.unshift({ctg2:'',value:'All',label:''}) // 補上選項
    this.ctg2Options = this.processToSelectOptions(OptionRes.brandList?.map(item => item.ctg2).filter(item => item !== undefined));
  }

  async setCtg3Options(){
    const model = {
      "brand":this.itemInfo.value.brand,
      "ctg1":this.itemInfo.value.ctg1,
      "ctg2":this.itemInfo.value.ctg2
    }
    let OptionRes = await lastValueFrom(this.commonApiService.queryBrandCtg(model)); 
    OptionRes.brandList = OptionRes.brandList?.filter(item => item.ctg3 !== ''); // 如果沒資料就清除 免得顯示empty
    OptionRes.brandList.unshift({ctg3:'',value:'All',label:''}) // 補上選項
    this.ctg3Options = this.processToSelectOptions(OptionRes.brandList?.map(item => item.ctg3).filter(item => item !== undefined));
  }

  // 手動上傳允許的檔案格式
  private isAcceptFile(file: File, acceptFileType: string = '', maxFileSize: number = 4 * 1024 * 1024) {
    const fileType = file.name?.split('.')?.pop() || '';
    const fileSizeAccept = file.size < maxFileSize;
    const fileTypeAccept = acceptFileType.split(',').includes('.' + fileType) || acceptFileType === '';
    if (!fileSizeAccept) { return 'SampleOutDPL.Message.FileSizeExceed'; }
    if (!fileTypeAccept) { return 'SampleOutDPL.Message.NotAllowThisUploadFileType'; }
    return;
  }

  // 顯示Dialog
  private showMsgDialog(label: string,mode: string) {
    this.noticeContentList = new Array<string>();
    this.noticeContentList.push(this.translateService.instant(label));
    this.noticeCheckDialogParams = {
      title: this.translateService.instant('LicenseMgmt.Common.Title.Notification'),
      visiable: true,
      mode:mode
    };
  }

  // TODO:跟上面整合
  private showMulitpleMsgDialog(label: string[],mode: string) {
    if (label.length === 0) { return; }
    this.noticeContentList = new Array<string>();
    label.forEach(msg => { this.noticeContentList.push(this.translateService.instant(msg)); });
    this.noticeCheckDialogParams = {
      title: this.translateService.instant('LicenseMgmt.Common.Title.Notification'),
      visiable: true,
      mode:mode
    };
  }

  /**
   * 避免扣量資料因為選擇item後被清除
   * @param res 
   * @returns 
   */
  private appendOriginDeductValue(res: any) {
    res.value.isDeduct = this.itemInfo.value.isDeduct;
    res.value.qty = this.itemInfo.value.qty;
    return res;
  }

  eccnListOptions = [];
  private getEccnList(){
    // 取得eccn下拉選單選項
    this.eccnListOptions = [{label:`${this.translateService.instant('Input.PlaceHolder.PleaseSelect')} ECCN`,value:''}];
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

  // 若Item沒有值，預設All Item
  private handleNullItem(data){ 
    data?.itemList?.forEach(element => {
      if (element.productCode == null || element.productCode == undefined){element.productCode = "0"};
      if (element.item == null || element.item == undefined){element.item = "All Item"};
    });
    return data;
  }
}
