import { Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { TranslateService } from '@ngx-translate/core';
import { SelectItem } from 'primeng/api';
import { BehaviorSubject, lastValueFrom, Observable, takeLast } from 'rxjs';
import { SelectorItemType } from 'src/app/core/enums/selector-item-type';
import { DialogSettingParams, SelectorDialogParams } from 'src/app/core/model/selector-dialog-params';
import { CommonApiService } from 'src/app/core/services/common-api.service';
import { LicenseControlApiService } from 'src/app/core/services/license-control-api.service';
import { UserContextService } from 'src/app/core/services/user-context.service';
import { EccnCheckRequest } from 'src/app/pages/blacklist/sample-out-dpl/bean/eccn-check-request';

@Component({
  selector: 'app-eccn-dialog',
  templateUrl: './eccn-dialog.component.html',
  styleUrls: ['./eccn-dialog.component.scss']
})
export class EccnDialogComponent implements OnInit, OnChanges {
  @Input() showDialog = false;
  @Input() editObj = null;
  @Output() closeDialog = new EventEmitter<any>();
  @Output() submit = new EventEmitter<any>();

  selectorDialogParams!: SelectorDialogParams;
  formGroup: FormGroup = this.formbuilder.group(this.getFormGroupDefault());

  areaList: SelectItem[] = [];
  eccnListOptions: SelectItem[] = [];
  formTitle = '';

  noticeCheckDialogParams!: DialogSettingParams;
  noticeContentList: string[] = [];

  constructor(
    private commonApiService: CommonApiService,
    private formbuilder: FormBuilder,
    private translateService: TranslateService,
    private licenseControlApiService: LicenseControlApiService,
    private userContextService: UserContextService
  ) { }

  ngOnInit(): void {
    this.init();
  }

  ngOnChanges(changes: SimpleChanges): void {
    this.recover();
    this.setFormTitle();
  }

  get currentMode() {
    return this.editObj ? 'edit' : 'add';
  }

  get hint() {
    return this.translateService.instant('EccnMtn.Msg.PleaseChooseMasterEccn');
  }

  setFormTitle() {
    this.currentMode === 'edit'
      ? this.formTitle = `${this.translateService.instant('Button.Label.Edit')} Area ECCN`
      : this.formTitle = `${this.translateService.instant('Button.Label.Add')} Area ECCN`;
  }

  async init() {
    // 預設都是禁用
    this.formGroup.get('masterEccn').disable();

    // 取得area下拉選單選項
    this.areaList = [];
    const rsp = await lastValueFrom(this.licenseControlApiService.getAreaFromAreaCountryMapping());
    rsp.areaList?.forEach((area:string) => { this.areaList.push({ label: area, value: area }) });

    // 取得eccn下拉選單選項
    this.eccnListOptions = [];
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

  /**
   * 根據editObj 綁定對應資料
   */
  async recover() {
    if (this.editObj) {
      // 取得
      const invItemNo = [];
      invItemNo.push(this.editObj.item);
      let masterEccn = await lastValueFrom(this.commonApiService.queryItemMasterByInvItemNos(invItemNo));

      let masterExportControl;
      let masterExportControlRes;
      if (masterEccn?.itemMasterList[0]?.eccn) {
        masterExportControlRes = await this.getMasterFlagByEccn(masterEccn?.itemMasterList[0]?.eccn);
        masterExportControl = masterExportControlRes?.exportFlag;
      }

      this.formGroup = this.formbuilder.group(this.getFormGroupDefault())

      this.formGroup.get('item').setValue(this.editObj.item);
      this.formGroup.get('masterEccn').setValue(masterEccn?.itemMasterList[0]?.eccn);
      this.formGroup.get('masterExportControl').setValue(masterExportControl);
      this.formGroup.get('area').setValue(this.editObj.area);
      this.formGroup.get('eccn').setValue(this.editObj.eccn);
      this.formGroup.get('exportControl').setValue('');

      this.formGroup.get('item').disable();
      this.formGroup.get('area').disable();

      this.getAreaEccnNonOuCheck();
    }
  }

  /**
   * 送出
   *
   * @returns
   */
  onSumbit() {
    if (!this.submitCheck()) { return; }
    else {
      this.formGroup.get('item').enable();
      this.formGroup.get('area').enable();
      this.submit.emit(this.formGroup.value);
      this.close();
    }
  }

  close() {
    this.clear();
    this.closeDialog.emit();
  }

  /**
   * 選完Item的callback
   *
   * @param e
   */
  async onSelectorDialogCallback(e) {
    const invItemNo = [];
    invItemNo.push(e.value.invItemNo);
    let rsp = await lastValueFrom(this.commonApiService.queryItemMasterByInvItemNos(invItemNo));
    const masterExportControl = await this.getMasterFlagByEccn(rsp?.itemMasterList[0]?.eccn)

    this.formGroup.get('item').setValue(e.value.invItemNo);
    this.formGroup.get('masterEccn').setValue(rsp?.itemMasterList[0]?.eccn);
    this.formGroup.get('masterExportControl').setValue(masterExportControl.exportFlag);
  }

  /**
   * 打開Item選擇dialog
   *
   * @returns
   */
  showItemSelectDialog() {
    if (this.currentMode === 'edit') { return; };
    this.selectorDialogParams = {
      title: `${this.translateService.instant('Dialog.Header.Choose')} Item`,
      type: SelectorItemType.ITEM,
      visiable: true,
    };
  }

  /**
   * 送出前必填檢查
   *
   * @returns
   */
  submitCheck() {
    this.noticeContentList = [];
    const plzChoose = this.translateService.instant('EccnMtn.Msg.PleaseChoose');
    if (this.currentMode === 'add') {
      if (!this.formGroup.get('item').value) { this.noticeContentList.push(`${plzChoose} Item`); }
      if (!this.formGroup.get('area').value) { this.noticeContentList.push(`${plzChoose} Area`); }
      if (!this.formGroup.get('eccn').value) { this.noticeContentList.push(`${plzChoose} ECCN`); }
    } else if (this.currentMode === 'edit') {
      if (!this.formGroup.get('eccn').value) { this.noticeContentList.push(`${plzChoose} ECCN`); }
    }

    if (this.noticeContentList.length > 0) { this.showNoticeDialog('error'); return false; }
    return true;
  }

  async getAreaEccnNonOuCheck() {
    if (!this.formGroup.get('eccn').value || !this.formGroup.get('area').value){return;}
    const eccnNpnOuCheckModel  ={
      eccn: this.formGroup.get('eccn').value,
      tenant:  this.userContextService.user$.getValue().tenant,
      area: this.formGroup.get('area').value
    }
    const eccnNpnOuCheckRes = await lastValueFrom(this.licenseControlApiService.areaEccnNonOuCheck(eccnNpnOuCheckModel));
    this.formGroup.get('exportControl').setValue(eccnNpnOuCheckRes.exportFlag);
  }

  private async getMasterFlagByEccn(eccn: string) {
    let eccnCheckReq = new EccnCheckRequest();
    eccnCheckReq.eccn = eccn;
    eccnCheckReq.tenant = this.userContextService.user$.getValue().tenant;
    return lastValueFrom(this.licenseControlApiService.eccnCheck(eccnCheckReq))
  }

  private showNoticeDialog(mode:string) {
    this.noticeCheckDialogParams = {
      title: this.translateService.instant('LicenseMgmt.Common.Title.Notification'),
      visiable: true,
      mode:mode
    };
  }

  private clear() {
    this.formGroup = this.formbuilder.group(this.getFormGroupDefault());
  }

  private getFormGroupDefault() {
    const formTemplate = {
      item: '',
      masterEccn: '',
      masterExportControl: '',
      area: '',
      eccn: '',
      exportControl: ''
    }
    return formTemplate
  }
}
