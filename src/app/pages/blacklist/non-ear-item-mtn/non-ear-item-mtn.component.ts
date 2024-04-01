import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { LazyLoadEvent, SelectItem } from 'primeng/api';
import { Table } from 'primeng/table';
import { lastValueFrom, Subscription, takeLast } from 'rxjs';
import { AuthApiService } from 'src/app/core/services/auth-api.service';
import { DplBlackApiService } from 'src/app/core/services/dpl-black-api.service';
import { ToastService } from 'src/app/core/services/toast.service';
import { CommonApiService } from '../../../core/services/common-api.service';
import { LanguageService } from '../../../core/services/language.service';
import { LoaderService } from '../../../core/services/loader.service';
import { UserContextService } from './../../../core/services/user-context.service';
import { NonEarItemMtnBean } from './bean/non-ear-item-mtn-bean';
import { NonEarItemMtnModifyRequest } from './bean/non-ear-item-mtn-modify-request';
import { NonEarItemMtnQueryRequest } from './bean/non-ear-item-mtn-query-request';
import { TableStatusKeepService } from 'src/app/core/services/table-status-keep.service';
import { FileUploader, FileUploaderManager } from 'src/app/core/model/file-uploader';

@Component({
  selector: 'app-non-ear-item-mtn',
  templateUrl: './non-ear-item-mtn.component.html',
  styleUrls: ['./non-ear-item-mtn.component.scss'],
})
export class NonEarItemMtnComponent implements OnInit, OnDestroy {
  private onLangChange$: Subscription;
  private loginStateSubscription$: Subscription;

  @ViewChild('lazyTable') lazyTable: Table;

  permissions: string[] = [];

  flagOptions: SelectItem[];
  customerOptions: SelectItem[];

  displayResult: boolean = false;

  displayDialog: boolean = false;
  dialogMsg: string;

  cols: any[];
  selectedCols: any[];

  data: any[];
  cloneData: any[];
  selectedData: any[];

  displayFilter: boolean = false;
  displayDetail: boolean = false;

  queryReq: NonEarItemMtnQueryRequest = new NonEarItemMtnQueryRequest();

  detailBean: NonEarItemMtnBean = new NonEarItemMtnBean();

  totalRecords: number;

  isEdit: boolean = false;

  editFlagOptions: SelectItem[];

  modifyStatus: boolean = false;

  selectedOu: any;
  filteredOus: any[];

  selectedCustomer: any;
  filteredCustomers: any[];

  selectedBrand: any;
  filteredBrands: any[];

  groupOptions: SelectItem[];

  editForm: FormGroup;
  formSubmitted: boolean = false;

  selectedProduct: any;
  filteredProducts: any[];

  sortField: string;
  sortOrder: number;
  first: number = 0;

  globalFilter: string = '';

  constructor(
    private router: Router,
    private formBuilder: FormBuilder,
    private userContextService: UserContextService,
    private languageService: LanguageService,
    private translateService: TranslateService,
    private toastService: ToastService,
    private dplBlackApiService: DplBlackApiService,
    private authApiService: AuthApiService,
    private commonApiService: CommonApiService,
    private loaderService: LoaderService,
    public tableStatusKeepService : TableStatusKeepService
  ) {
    if (this.userContextService.user$.getValue) {
      this.permissions = this.userContextService.getMenuUrlPermission(
        this.router.url
      );
      console.log('permissions: ', this.permissions);
    }
    this.onLangChange$ = this.translateService.onLangChange.subscribe(() => {
      // this.setBreadcrumbItems();
      this.initOptions();
      this.initColumns();
      this.changeFilter();
      // 會trigger LAZY-TABLE的onLazyLoad event
      this.displayResult = true;
      this.doGroupQuery();
    });

    this.translateService
      .use(this.languageService.getLang())
      .subscribe((next) => { });
  }

  ngOnInit(): void {
    this.fileUploaderSettings = new FileUploaderManager();
    this.fileUploaderSettings.accept = ".xlsx,.xls"
    
    this.composeQueryReq();

    this.initOptions();

    this.editFlagOptions = [
      { label: 'Y', value: 'Y' },
      { label: 'N', value: 'N' },
    ];

    this.initColumns();

    this.changeFilter();

    //# TK-35854
    // 會trigger LAZY-TABLE的onLazyLoad event
    //this.displayResult = true;

    this.doGroupQuery();

    this.editForm = this.formBuilder.group({
      addBrand: ['', Validators.required],
      addProduct: ['', Validators.required],
      corpGroup: ['', Validators.required],
      addOu: ['', Validators.required],
      addCustomer: ['', Validators.required],
      remark: [''],
      flag: ['', Validators.required],
    });
  }

  initColumns() {
    this.cols = this.translateService.instant('NonEARItemMtn.Columns');
  }

  initOptions() {
    this.flagOptions = this.translateService.instant(
      'NonEARItemMtn.Options.flagOptions'
    );
    this.groupOptions = this.translateService.instant(
      'NonEARItemMtn.Options.groupOptions'
    );
  }

  async doGroupQuery() {
    let rsp = await lastValueFrom(this.authApiService.groupQuery());
    for (var group of rsp.groupList) {
      this.groupOptions.push({
        label: group.groupName,
        value: group.groupName,
      });
    }
  }

  /**
   * 查詢按鈕 Click 事件
   */
  searchBtnClick(): void {
    this.tableStatusKeepService.resetPageEvent();
    this.composeAutoCompleteReq();

    if (this.displayResult) {
      // this.onLazyLoad(null);
      this.resetLazySort();
    } else {
      setTimeout(() => {
        this.displayResult = true;
      });
    }
  }

  composeAutoCompleteReq() {
    if (this.selectedOu !== undefined)
      this.queryReq.ouCode = this.selectedOu.ouCode;

    if (this.selectedCustomer !== undefined)
      this.queryReq.customerNo = this.selectedCustomer.customerNo;

    if (this.selectedBrand !== undefined)
      this.queryReq.brand = this.selectedBrand.name;
  }

  downloadBtnClick(): void {
    this.composeAutoCompleteReq();
    this.queryReq.action = 'DOWNLOAD';
    this.loaderService.show();
    this.dplBlackApiService.nonEarItemMtnQuery(this.queryReq).subscribe({
      next: (rsp) => {
        this.queryReq.action = '';
        this.commonApiService.downloadFile(rsp.fileId);
      },
      error: (e) => {
        this.queryReq.action = '';
        console.error(e);
        this.loaderService.hide();
        this.toastService.error('System.Message.Error');
      },
    });
  }

  filterLazy(globalFilter: string) {
    this.data = [];
    for (var i = 0; i < this.cloneData.length; i++) {
      for (var j = 0; j < this.selectedCols.length; j++) {
        try {
          if (this.cloneData[i][this.selectedCols[j].field] === undefined)
            continue;
          var value = this.cloneData[i][this.selectedCols[j].field];
          if (value.toLowerCase().indexOf(globalFilter.toLowerCase()) !== -1) {
            this.data.push(this.cloneData[i]);
            break;
          }
        } catch (e) {
          console.log(e);
        }
      }
    }
    return;
  }

  async onLazyLoad(event: LazyLoadEvent) { 
    await this.tableStatusKeepService.delay(1);

    event.first = this.tableStatusKeepService.get(this.tableStatusKeepService.tableStatusKeepEnum.PageEvent)?.first;
    event.rows = this.tableStatusKeepService.get(this.tableStatusKeepService.tableStatusKeepEnum.PageEvent)?.rows;
    this.queryReq.lazyLoadEvent = event;
    if (
      event &&
      event.sortField &&
      this.lazyTable &&
      this.data &&
      (event.sortField !== this.sortField || event.sortOrder !== this.sortOrder)
    ) {
      this.data = this.sortArrayData(
        this.data,
        event.sortField,
        event.sortOrder
      );
      this.lazyTable.first = this.first;
      return;
    }
    setTimeout(() => {
      this.loaderService.show();
      this.dplBlackApiService.nonEarItemMtnQuery(this.queryReq).subscribe({
        next: (rsp) => {
          this.data = rsp.resultList;
          this.cloneData = rsp.resultList;
          this.filterLazy(this.globalFilter);
          this.totalRecords = rsp.totalRecords;
          this.displayResult = true;
          this.loaderService.hide();
          this.data = this.sortArrayData(
            this.data,
            event.sortField,
            event.sortOrder
          );
        },
        error: (e) => {
          console.error(e);
          this.loaderService.hide();
          this.toastService.error('System.Message.Error');
        },
      });
    });
  }

  onSort(event) {
    this.sortField = event.field;
    this.sortOrder = event.order;
  }

  onPage(event) {
    this.tableStatusKeepService.keep(this.tableStatusKeepService.tableStatusKeepEnum.PageEvent,event); 
    this.first = event.first;
  }

  resetLazySort() {
    this.lazyTable.sortOrder = undefined;
    this.lazyTable.sortField = undefined;
    this.lazyTable.first = 0;
    this.lazyTable.rows = 10;
    this.lazyTable.reset();
  }

  sortArrayData(arrayData: any[], field: string, sort: number) {
    if (arrayData && field && sort) {
      if (sort && sort == 1) {
        return arrayData.sort((a, b) =>
          (a[field] != null ? a[field] : '') <
            (b[field] != null ? b[field] : '')
            ? -1
            : 1
        );
      } else {
        return arrayData.sort((a, b) =>
          (a[field] != null ? a[field] : '') >
            (b[field] != null ? b[field] : '')
            ? -1
            : 1
        );
      }
    }
    return arrayData;
  }

  resetBtnClick() {
    this.displayResult = false;
    this.composeQueryReq();
    this.first = 0;
    this.sortField = undefined;
    this.sortOrder = undefined;
  }

  showFilter() {
    this.displayFilter = true;
  }

  changeFilter() {
    this.selectedCols = this.cols.filter((x) => {
      return x.isDefault;
    });
    // this.selectedCols.unshift({ field: 'edit', header: '編輯', css: 'icon-col' });
    if (this.permissions.includes('edit')) {
      this.selectedCols.unshift(
        this.translateService.instant('NonEARItemMtn.EditColums')
      );
    }
  }

  resetFilter() {
    this.selectedCols = this.cols.filter((x) => {
      return x.isDefault;
    });
  }

  dialogShowMultiple = false;
  editDetail(seq: number) {
    this.dialogShowMultiple = false;
    if (seq !== undefined) {
      this.loaderService.show();
      this.isEdit = true;
      this.queryReq.seq = seq;
      this.dplBlackApiService.nonEarItemMtnView(this.queryReq).subscribe({
        next: (res) => {
          this.detailBean = res.detail;
          let editFormData = {
            addCustomer: this.detailBean.addCustomer,
            addBrand: this.detailBean.addBrand,
            addOu: this.detailBean.addOu,
            corpGroup: this.detailBean.corpGroup,
            flag: this.detailBean.flag,
            addProduct: this.detailBean.addProduct,
            remark: this.detailBean.remark,
          };
          this.editForm.setValue(editFormData);
          this.loaderService.hide();
        },
        error: (e) => {
          console.error(e);
          this.loaderService.hide();
          this.toastService.error('System.Message.Error');
        },
      });
    } else {
      this.dialogShowMultiple = true;
      this.isEdit = false;
      this.isEdit = false;
      let editFormData = {
        addCustomer: '',
        addBrand: '',
        addOu: '',
        corpGroup: '',
        flag: 'Y',
        addProduct: '',
        remark: '',
      };
      this.editForm.setValue(editFormData);
      this.detailBean = new NonEarItemMtnBean();
    }

    this.displayDetail = true;
  }

  saveDetail() {
    this.formSubmitted = true;
    if (this.editForm.invalid) {
      return;
    }

    let modifyReq = new NonEarItemMtnModifyRequest();
    modifyReq.userEmail = this.userContextService.user$.getValue().userEmail;
    modifyReq.tenant = this.userContextService.user$.getValue().tenant;
    modifyReq.action = 'ADD';
    modifyReq.detail = this.detailBean;

    modifyReq.detail.corpGroup = this.editForm.get('corpGroup').value;
    modifyReq.detail.flag = this.editForm.get('flag').value;
    modifyReq.detail.remark = this.editForm.get('remark').value;

    if (this.isEdit) {
      modifyReq.action = 'EDIT';
    }

    modifyReq.detail.customerNo =
      this.editForm.get('addCustomer').value.customerNo;
    modifyReq.detail.ouCode = this.editForm.get('addOu').value.ouCode;
    modifyReq.detail.brand = this.editForm.get('addBrand').value.name;
    modifyReq.detail.productCode = this.editForm.get('addProduct').value.code;

    this.dplBlackApiService.nonEarItemMtnModify(modifyReq).subscribe({
      next: (rsp) => {
        this.displayResult = false;
        this.modifyStatus = true;
        this.dialogMsg = this.translateService.instant(
          'Dialog.Message.SuccessfullySaved'
        );
        this.displayDialog = true;
        this.loaderService.hide();
      },
      error: (rsp) => {
        console.log(rsp);
        if (rsp?.status == 500 && rsp.error?.code) {
          this.modifyStatus = false;
          this.dialogMsg = rsp.error?.message;
          this.displayDialog = true;
        } else {
          this.toastService.error('System.Message.Error');
        }
        this.loaderService.hide();
      },
    });
  }

  onHideMsgDialog(event: any) {
    if (this.modifyStatus) {
      this.displayDetail = false;
      setTimeout(() => {
        this.displayResult = true;
      });

      this.formSubmitted = false;
      this.editForm.reset();
    }
  }

  onHideDetailDialog(event: any) {
    this.formSubmitted = false;
    this.editForm.reset();
  }

  cancelDetail() {
    this.displayDetail = false;
    this.formSubmitted = false;
    this.editForm.reset();
  }

  composeQueryReq() {
    this.queryReq = new NonEarItemMtnQueryRequest();
    this.queryReq.tenant = this.userContextService.user$.getValue().tenant;
    this.selectedBrand = undefined;
    this.selectedCustomer = undefined;
    this.selectedOu = undefined;
  }

  onChangeGroup(event) {
    if (this.detailBean.ouCode && this.detailBean.ouCode == '0') {
      return;
    }
    this.editForm.get('addOu').setValue('');
    this.detailBean.ouCode = undefined;
    this.detailBean.ouName = undefined;
  }

  async filterOu(event) {
    let filtered: any[] = [];
    let query = event.query;

    let rsp = await lastValueFrom(this.authApiService.ouQueryByPrefix(query,'Y'));
    for (var ou of rsp.ouList) {
      filtered.push(ou);
    }

    this.filteredOus = filtered;
  }

  async filterOuByGroup(event) {
    let filtered: any[] = [];
    let query = event.query;
    let groupName = this.editForm.get('corpGroup').value;

    let rsp = await lastValueFrom(
      this.authApiService.ouQueryByPrefixAndGroup(query, groupName)
    );
    for (var ou of rsp.ouList) {
      filtered.push(ou);
    }

    this.filteredOus = filtered;
  }

  onBlurOu(event) {
    // 沒選autoComplete的話.清空input內容
    if (this.selectedOu === undefined || this.selectedOu.ouCode === undefined) {
      this.selectedOu = undefined;
      this.queryReq.ouCode = undefined;
    }
  }

  onSelectAddOu() {
    let ou = this.editForm.get('addOu').value;
    this.detailBean.ouCode = ou.ouCode;
    this.detailBean.ouName = ou.ouName;
    if (!this.editForm.get('corpGroup').value) {
      this.editForm.get('corpGroup').setValue(ou.groupName);
    }
  }

  onBlurAddOu(event) {
    if (
      this.editForm.get('addOu').value === undefined ||
      this.editForm.get('addOu').value.ouCode === undefined
    ) {
      this.editForm.get('addOu').setValue('');
      this.detailBean.ouName = undefined;
    }
  }

  async filterCustomer(event) {
    let filtered: any[] = [];
    let query = event.query;

    let rsp = await lastValueFrom(
      this.dplBlackApiService.blackCustomerQueryByPrefix(query)
    );
    for (var customer of rsp.customerList) {
      filtered.push(customer);
    }

    this.filteredCustomers = filtered;
  }

  onBlurCustomer(event) {
    // 沒選autoComplete的話.清空input內容
    if (
      this.selectedCustomer === undefined ||
      this.selectedCustomer.customerNo === undefined
    ) {
      this.selectedCustomer = undefined;
      this.queryReq.customerNo = undefined;
    }
  }

  onBlurAddCustomer(event) {
    if (
      this.editForm.get('addCustomer').value === undefined ||
      this.editForm.get('addCustomer').value.customerNo === undefined
    ) {
      this.editForm.get('addCustomer').setValue('');
    }
  }

  onSelectAddCustomer() {
    let customer = this.editForm.get('addCustomer').value;
    this.detailBean.customerNo = customer.customerNo;
    this.detailBean.customerName = customer.customerName;
  }

  async filterBrand(event) {
    let filtered: any[] = [];
    let query = event.query;

    let rsp = await lastValueFrom(
      this.commonApiService.brandQueryByPrefix(query)
    );
    for (var brand of rsp.brandList) {
      filtered.push(brand);
    }

    this.filteredBrands = filtered;
  }

  onBlurBrand(event) {
    // 沒選autoComplete的話.清空input內容
    if (
      this.selectedBrand === undefined ||
      this.selectedBrand.name === undefined
    ) {
      this.selectedBrand = undefined;
      this.queryReq.brand = undefined;
    }
  }

  onBlurAddBrand(event) {
    // 沒選autoComplete的話.清空input內容
    if (
      this.editForm.get('addBrand').value === undefined ||
      this.editForm.get('addBrand').value.name === undefined
    ) {
      this.editForm.get('addBrand').setValue('');
      this.detailBean.brand = undefined;
    }
    if (this.editForm.get('addBrand').value.name !== this.detailBean.brand) {
      if (
        this.detailBean.productCode &&
        this.detailBean.productCode !== 'ALL'
      ) {
        this.editForm.get('addProduct').setValue('');
        this.detailBean.productCode = undefined;
      }
    }
  }

  onSelectAddBrand() {
    let brand = this.editForm.get('addBrand').value;
    this.detailBean.brand = brand.code;

    if (this.detailBean.productCode && this.detailBean.productCode !== 'ALL') {
      this.editForm.get('addProduct').setValue('');
      this.detailBean.productCode = undefined;
    }
  }

  async filterProduct(event) {
    let filtered: any[] = [];
    let query = event.query;

    let rsp = await lastValueFrom(
      this.commonApiService.productQueryByPrefix(this.detailBean.brand, query)
    );
    console.log(rsp)
    for (var product of rsp.productList) {
      filtered.push(product);
    }

    this.filteredProducts = filtered;
  }

  onBlurProduct(event) {
    // 沒選autoComplete的話.清空input內容
    if (
      this.selectedProduct === undefined ||
      this.selectedProduct.name === undefined
    ) {
      this.selectedProduct = undefined;
      this.queryReq.productCode = undefined;
    }
  }

  onBlurAddProduct(event) {
    if (
      this.editForm.get('addProduct').value === undefined ||
      this.editForm.get('addProduct').value.name === undefined
    ) {
      this.editForm.get('addProduct').setValue('');
    }
  }

  onSelectAddProduct() {
    let product = this.editForm.get('addProduct').value;
    console.log(product);
    this.detailBean.productCode = product.code;

    if (this.editForm.get('addBrand').value.name === undefined) {
      this.editForm
        .get('addBrand')
        .setValue(this.composeBrand(product.brandName));
      this.detailBean.brand = product.brandName;
    }
  }

  composeBrand(name): any {
    return JSON.parse('{"code":"' + name + '","name":"' + name + '"}');
  }

  ngOnDestroy(): void {
    [this.onLangChange$, this.loginStateSubscription$].forEach(
      (subscription: Subscription) => {
        if (subscription != null || subscription != undefined)
          subscription.unsubscribe();
      }
    );
  }

  get editF() {
    return this.editForm.controls;
  }

  fileUploaderSettings!: FileUploader;
  fileUploader!: any;
  onDownloadSampleFileEvent(){
    // TODO
    this.commonApiService.downloadFile(5);
  }

  onFormSubmit(){  
    this.loaderService.show();
 
    const formData: FormData = new FormData();
    formData.append('file', this.selectedFileList[0]);

    lastValueFrom(this.dplBlackApiService.nonEarItemUpload(formData)).then(rsp=>{
      this.loaderService.hide();
      this.modifyStatus = false;
      if (rsp.messageList.length > 0){
        this.dialogMsg = rsp.messageList?.join('\r\n');;
        this.displayDialog = true;
      }else{ 
        this.dialogMsg = this.translateService.instant('WhiteListTempMtn.Message.UploadSuccessfully');
        this.displayDialog = true; 
        this.modifyStatus = true;
        this.selectedFileList = new Array();
      } 
    }).catch(err=>{
      console.log(err);
      this.modifyStatus = false;
      this.dialogMsg = err.error.errors?.join('\r\n');;
      this.displayDialog = true;

      this.selectedFileList = new Array();
      this.fileUploader.clear();
      this.loaderService.hide();
    })
  }

  selectedFileList: File[] = []; // p-fileload target file array
  onDropHandler(event) {
    this.selectedFileList = event.files;
  }

  // Handle drop error
  onDropError(event) {
    this.modifyStatus = false;
    this.dialogMsg = this.translateService.instant(event);
    this.displayDialog = true;
  }

  // Handle user select limit
  customeSelectFileAccept(file: any, fileUploader: any) {
    let fileUnexpectMsg = [];
    file.currentFiles.forEach((selectFile) => {
      fileUnexpectMsg.push(
        this.isAcceptFile(selectFile, this.fileUploaderSettings.accept)
      );
    });

    const haveUnexepectFile =
      fileUnexpectMsg.filter((item) => item !== undefined).length > 0;

    if (haveUnexepectFile) {
      fileUploader.clear();
      this.modifyStatus = false;
      this.dialogMsg = this.translateService.instant(fileUnexpectMsg.pop());
      this.displayDialog = true;
      return false;
    }
    {
      return true;
    }
  }

  onFileRemoveHandler(): void {
    this.selectedFileList = new Array();
  }

  onFileUploadHandler(file: any, fileUploader: any): void {
    if (!this.customeSelectFileAccept(file, fileUploader)) {
      return;
    }
    this.selectedFileList = [...this.selectedFileList]; // avoid to primeNG default list opt.
    const fileErrorHint = this.isAcceptFile(
      file.currentFiles[0],
      this.fileUploaderSettings.accept
    );

    if (fileErrorHint){
      this.modifyStatus = false;
      this.dialogMsg = this.translateService.instant(fileErrorHint); 
      this.displayDialog = true;
    }else{
      (this.selectedFileList = file.currentFiles);
    } 

    this.fileUploader = fileUploader;
  }

    // 手動上傳允許的檔案格式
    private isAcceptFile(
      file: File,
      acceptFileType: string = '',
      maxFileSize: number = 40 * 1024 * 1024
    ) {
      const fileType = file.name?.split('.')?.pop() || '';
      const fileSizeAccept = file.size < maxFileSize;
      const fileTypeAccept =
        acceptFileType.split(',').includes('.' + fileType) ||
        acceptFileType === '';
      if (!fileSizeAccept) {
        return 'SampleOutDPL.Message.FileSizeExceed';
      }
      if (!fileTypeAccept) {
        return 'SampleOutDPL.Message.NotAllowThisUploadFileType';
      }
      return;
    }

}
