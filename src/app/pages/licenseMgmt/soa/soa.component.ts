import { CurFormStatusService } from 'src/app/pages/licenseMgmt/services/cur-form-status.service';
import { CurFormInfoService } from './../services/cur-form-info.service';
import { AfterViewInit, Component, isDevMode, OnDestroy, OnInit } from '@angular/core';
import { SoaCommonService } from './soa-common.service';
import { SoaApiService } from 'src/app/core/services/soa-api.service';
import { UserContextService } from 'src/app/core/services/user-context.service';
import { TranslateService } from '@ngx-translate/core';
import { DialogSettingParams } from 'src/app/core/model/selector-dialog-params';
import { Router } from '@angular/router';
import { lastValueFrom, Subject, take } from 'rxjs';
import { takeUntil, retry } from 'rxjs';
import { environment } from 'src/environments/environment';
import { ReassignDialogService } from 'src/app/core/components/reassign-dialog/reassign-dialog.service';
import { ApproveDialogService } from '../leh/leh-support/component/approve-dialog/approve-dialog.service';
import { LicenseControlApiService } from 'src/app/core/services/license-control-api.service';
import { ConfirmationService } from 'primeng/api';
import { AgentInfoTableService } from 'src/app/core/components/agent-info-table/agent-info-table.service';
@Component({
  selector: 'app-soa',
  templateUrl: './soa.component.html',
  styleUrls: ['./soa.component.scss']
})
export class SoaComponent implements OnInit, OnDestroy, AfterViewInit {
  private unsubscribeEvent = new Subject();
  noticeCheckDialogParams!: DialogSettingParams;
  noticeContentList: string[] = [];
  showSpinner = false;

  redirectAfterDialogClose: string = '';
  redirectMode: 'navigate' | 'windowOpen' = 'navigate';
  openRedirectDialog: boolean = false;

  soaData: any = {
    header: {},
    applyInfo: {},
    itemInfo: [],
    ouInfo: {},
    formCommon: {}
  }

  curFlowingStatus!: string
  formTypeId;
  showApprovingLicenseConfirmDialog: boolean = false;

  constructor(
    public soaCommonService: SoaCommonService,
    private soaApiService: SoaApiService,
    private userContextService: UserContextService,
    private translateService: TranslateService,
    private router: Router,
    public reassignDialogService: ReassignDialogService,
    private curFormStatusService: CurFormStatusService,
    private approveDialogService: ApproveDialogService,
    private licenseControlApiService: LicenseControlApiService,
    private confirmationService: ConfirmationService,
    private agentInfoTableService : AgentInfoTableService
  ) { }

  async ngOnInit(): Promise<void> {
    const formTitleRes = await lastValueFrom(this.soaApiService.getFormTitle('License_SOA'));
    this.approveDialogService.formTypeId = (formTitleRes as any).body.formTypeId;
    this.formTypeId = (formTitleRes as any).body.formTypeId;
    this.agentInfoTableService.setFormTypeId(this.formTypeId);
  }

  ngAfterViewInit(): void {
    this.curFormStatusService.getCurFormStatus$(this.soaCommonService.SOAformNo, this.soaCommonService.getSOAFormData().formTypeId).then(obs => {
      obs.pipe(takeUntil(this.unsubscribeEvent)).subscribe(res => {
        this.curFlowingStatus = this.soaCommonService.pendingIncludeMeFlag ? res : null
      })
    })
  }

  ngOnDestroy(): void {
    this.unsubscribeEvent.next(null);
    this.unsubscribeEvent.complete();
    this.soaCommonService.resetVariable();
  }

  /**
   * 取得申請單的操作(送出，草稿)
   *
   * @param e
   */
  getCommonBtnClick(e: 'apply' | 'draft') {
    if (e === 'draft') { this.sendApply(e, this.translateService.instant('SOA.Msg.AlreadySaveAsDraft')); }
    else if (e === 'apply') { if (this.sumbitCheckPass()) { this.sendApply(e, this.translateService.instant('SOA.Msg.AlreadySend')); } }
    else if (e === 'addAssignee') { if (this.sumbitCheckPass()) { this.openRedirectDialog = true; } }
  }

  private sendApply(e: 'apply' | 'draft' | 'addAssignee', msg?: string, assigneeData?) {
    this.showSpinner = true;
    const model = this.getApplyModel(e, assigneeData);
    if (e === 'draft') { return this.saveSoa(model, msg, e); } // 草稿不須查有無 getApprovingAndApproveLicenseModel
    if (e === 'addAssignee') { msg = this.translateService.instant('SOA.Msg.AlreadySend') };

    const approvingFormModel = this.getApprovingAndApproveLicenseModel()
    lastValueFrom(this.licenseControlApiService.getApprovingAndApproveLicense(approvingFormModel))
      .then(res => {
        this.showSpinner = false

        const doNotMatchProductCode = res.beans.filter(item => item.formNo !== this.soaCommonService.formNo).length === 0 // 沒有任何一筆Item有查到
        if (doNotMatchProductCode) {
          this.showSpinner = true;
          this.saveSoa(model, msg, e);
        } else {
          const matchProductCodes = [];
          let matchAllItem = false;
          res.beans.forEach(element => {
            if (element.productCode === '0') { matchAllItem = true; } // 判斷有沒有匹配到 productCode為 0 的單
            matchProductCodes.push(element.productCode) // 紀錄每個匹配到的 ProductCode
          });

          let matchProductCodesTemp = [];
          let matchProductCodesDeduplication = [];
          if (matchAllItem) { matchProductCodesTemp = this.soaData.itemInfo.map(item => item.productCode) }
          else { matchProductCodesTemp = [...new Set(matchProductCodes)]; }

          matchProductCodesTemp.forEach(element => {
            matchProductCodesDeduplication.push(element === '0' ? 'All Item' : element)
          });

          this.showApprovingLicenseConfirmDialog = true; // 避免點擊審核時跳出多個 Confirm 視窗 
          setTimeout(() => { // 打開確認視窗
            this.confirmationService.confirm({
              header: this.translateService.instant('DPL_Fail.Label.Confirm'),
              message: `${this.translateService.instant('SOA.ApprovingLicense.Label.AlreadyHaveApprovingLicense')}：<br>${matchProductCodesDeduplication?.join('<br>')}  `,
              accept: () => {
                this.showSpinner = true;
                this.showApprovingLicenseConfirmDialog = false;
                this.saveSoa(model, msg, e)
              },
              reject: () => { this.showApprovingLicenseConfirmDialog = false; }
            });
          }, 0);
        }
      })
      .catch(err => { console.log(err); this.showSpinner = false })
    return;
  }

  private saveSoa(model, msg, e) {
    this.soaApiService.saveSOA(model)
      .pipe(retry(2))
      .subscribe({
        next: (rsp: any) => {
          if (rsp.body) {
            this.showSpinner = false;

            if (environment.storeRedirectUrlPrefix == 'local') {
              this.handleSubmitRediret(msg, '/applicationMgmt/my-application', 'navigate');
            } else {

              if (e === 'draft') {
                const url = environment.storeRedirectUrlPrefix + '?entryUrl=myforms/search&type=' + this.soaCommonService.SOAformNo + '&formTypeId=' + this.formTypeId;
                this.handleRedirect(url, 'windowOpen');
              } else if (e === 'apply') {
                const url = environment.storeRedirectUrlPrefix + '?entryUrl=myforms/success&type=' + this.soaCommonService.SOAformNo + '&formTypeId=' + this.formTypeId;
                this.handleRedirect(url, 'windowOpen');
              } else if (e === 'addAssignee') {
                const url = environment.storeRedirectUrlPrefix + '?entryUrl=myforms/success&type=' + this.soaCommonService.SOAformNo + '&formTypeId=' + this.formTypeId;
                this.handleRedirect(url, 'windowOpen');
              }

            }
          }
        },
        error: (rsp) => {
          console.log('fail', rsp);
          this.showSpinner = false;

          this.noticeContentList = new Array<string>();
          this.noticeContentList.push(`${this.soaCommonService.SOAformNo} 送出失敗。`);
          this.showNoticeDialog('error');
        }
      });
  }

  getApproveDialogResult(res) {
    this.approveDialogService.formTypeId = this.soaCommonService.getSOAFormData().formTypeId;
    const model = this.getApproveModel(res);
    if (model.action === 'approve') {// 只有approve需要檢查
      if (!this.sumbitCheckPass()) { return; }
    }

    if ((this.soaCommonService.role === 'Applyer') && (model.action !== 'reject') && (model.action !== 'rollback')) { // 退回第一關 審核,加簽,加簽傳回 送出前要檢查Item
      this.showSpinner = true
      const approvingFormModel = this.getApprovingAndApproveLicenseModel()
      lastValueFrom(this.licenseControlApiService.getApprovingAndApproveLicense(approvingFormModel))
        .then(res => {
          this.showSpinner = false

          const doNotMatchProductCode = res.beans.filter(item => item.formNo !== this.soaCommonService.formNo).length === 0  // 沒有任何一筆Item有查到
          if (doNotMatchProductCode) {
            this.showSpinner = true;
            this.approveSOA(model);
          } else {
            const matchProductCodes = [];
            let matchAllItem = false;
            res.beans.forEach(element => {
              if (element.productCode === '0') { matchAllItem = true; } // 判斷有沒有匹配到 productCode為 0 的單
              matchProductCodes.push(element.productCode) // 紀錄每個匹配到的 ProductCode
            });
  
            let matchProductCodesTemp = [];
            let matchProductCodesDeduplication = [];
            if (matchAllItem) { matchProductCodesTemp = this.soaData.itemInfo.map(item => item.productCode) }
            else { matchProductCodesTemp = [...new Set(matchProductCodes)]; }
  
            matchProductCodesTemp.forEach(element => {
              matchProductCodesDeduplication.push(element === '0' ? 'All Item' : element)
            });

            this.showApprovingLicenseConfirmDialog = true; // 避免點擊審核時跳出多個 Confirm 視窗 
            setTimeout(() => { // 打開確認視窗
              this.confirmationService.confirm({
                header: this.translateService.instant('DPL_Fail.Label.Confirm'),
                message: `${this.translateService.instant('SOA.ApprovingLicense.Label.AlreadyHaveApprovingLicense')}：<br>${matchProductCodesDeduplication?.join('<br>')}  `,
                accept: () => {
                  this.showApprovingLicenseConfirmDialog = false;
                  this.approveSOA(model);
                },
                reject: () => { this.showApprovingLicenseConfirmDialog = false; }
              });
            }, 0);
          }
        })
        .catch(err => { console.log(err); this.showSpinner = false })
    } else { // 非第一關的 Approve 送出前不檢查Item
      this.approveSOA(model);
    }
  }

  private approveSOA(model) {
    this.showSpinner = true;
    this.soaApiService.approveSOA(model)
      .pipe(takeUntil(this.unsubscribeEvent))
      .pipe(retry(2))
      .subscribe({
        next: (rsp: any) => {

          if (rsp.body) {
            this.showSpinner = false;
            if (environment.storeRedirectUrlPrefix == 'local') {
              this.handleSubmitRediret(this.translateService.instant('SOA.Msg.AlreadySend'));
            }
            else {
              const url = environment.storeRedirectUrlPrefix + '?entryUrl=myforms/success&type=' + this.soaCommonService.getRouteParams().queryFormNo + '&formTypeId=' + this.soaCommonService.getSOAFormData().formTypeId;
              this.handleRedirect(url, 'windowOpen');
            }
          }
        },
        error: (rsp) => {
          console.log('fail', rsp);
          this.showSpinner = false;

          this.noticeContentList = new Array<string>();
          this.noticeContentList.push(`${this.soaCommonService.getRouteParams().queryFormNo} 送出失敗。`);
          this.showNoticeDialog('error');
        }
      });
  }

  getEmitHandler(e: any, key: string) {
    this.soaData[key] = e;
  }

  getItemInfo(e) {
    this.soaData.itemInfo = [];
    e.forEach(item => {
      this.soaData.itemInfo.push({
        brand: item.brand,
        productCode: item.productCode,
        isDeduct: item.isDeduct,
        quantity: item.qty,
        ctg1: item.ctg1,
        ctg2: item.ctg2,
        ctg3: item.ctg3,
        eccn: item.eccn
      })
    });
  }

  getApplyInfo(e) {
    this.soaData.applyInfo = {
      area: e.docAreaValue,// 正本歸檔區域
      ieType: e.IEtypeValue === 'Import' ? "I" : "E",// I:Import , E:Export
      vcType: e.cvValue.type === 'Vendor' ? "V" : "C",// C:客戶 , V:供應商,
      corp: e.cvValue.data?.value?.vendorCode || '', // 公司代號
      corpName: e.cvValue.data?.value?.vendorName || '',// 公司名稱
      vcCode: e.cvValue.data?.value?.customerNo || e.cvValue.data?.value?.vendorCode || '', // 客戶代碼
      vcNameC: e.cvValue.data?.value?.customerName || e.cvValue.data?.value?.vendorName || '', // 客戶中文名稱
      vcNameE: e.cvValue.data?.value?.customerNameEg || e.cvValue.data?.value?.vendorEngName || '',// 客戶英文名稱
      startDate: e.startDate, // 有效日期(起)
      endDate: e.endDate,// 有效日期(迄)
      remark: e.remarkInfo,// 備註
      areaInfo: e.areaInfo,
      specialApproval: e.specialApprovalValue,
    }
  }

  noticeDialogClose() {
    if (this.redirectAfterDialogClose) {
      if (this.redirectMode === 'navigate') { this.router.navigate([this.redirectAfterDialogClose], { queryParams: {} }); }
      else if (this.redirectMode === 'windowOpen') { window.open(this.redirectAfterDialogClose, '_self'); }
    }
    this.redirectAfterDialogClose = '';
  }

  updateDialog() {
    this.openRedirectDialog = false;
  }

  /**
   * 不跳POPUP直接導頁
   * @param url
   * @param mode
   */
  private handleRedirect(url: string = 'applicationMgmt/pending', mode: 'navigate' | 'windowOpen' = 'navigate') {
    if (mode === 'navigate') { this.router.navigate([url], { queryParams: {} }); }
    else if (mode === 'windowOpen') { window.open(url, '_self'); }
  }

  /**
   * 跳POPUP後導頁
   *
   * @param customMsg
   * @param url
   */
  private handleSubmitRediret(customMsg, url: string = 'applicationMgmt/pending', mode: 'navigate' | 'windowOpen' = 'navigate') {
    let msg = `${this.soaCommonService.formNo} ${customMsg}`;
    this.redirectMode = mode;

    this.redirectAfterDialogClose = url;
    this.noticeContentList = [];
    this.noticeContentList.push(msg);
    this.showNoticeDialog('success');
  }

  private getApproveModel(event) {
    return {
      tenant: this.userContextService.user$.getValue().tenant,
      action: event.action,
      formNo: this.soaCommonService.SOAformNo,
      userCode: this.userContextService.user$.getValue().userCode,
      comment: event.comment,
      stepNumber: event.stepNumber,
      activityId: event.rollbackStep,
      nowStep: event.nowStep,
      cosigner: this.getCosigner(event),
      deptCode: this.soaData.header.deptCode,
      deptName: this.soaData.header.deptInfo,
      ouCode: this.soaData.applyInfo.corp,
      ouName: this.soaData.applyInfo.corpName,
      vcCode: this.soaData.applyInfo.vcCode,
      vcNameC: this.soaData.applyInfo.vcNameC,
      vcNameE: this.soaData.applyInfo.vcNameE,
      area: this.soaData.applyInfo.area,
      ieType: this.soaData.applyInfo.ieType,
      vcType: this.soaData.applyInfo.vcType,
      startDate: this.soaData.applyInfo.startDate,
      endDate: this.soaData.applyInfo.endDate,
      remark: this.soaData.applyInfo.remark,
      isOriginal: this.soaData.ouInfo.docValue,
      specialApproval: this.soaData.applyInfo.specialApproval,
      ouType: this.getOuType(),
      groupDatas: this.getGroupDatas(),
      datas: this.getItemInfoForModel()
    }
  }

  private getApplyModel(e: 'apply' | 'draft' | 'addAssignee', assigneeData?: any) {
    return {
      tenant: this.userContextService.user$.getValue().tenant,
      action: e,
      formNo: this.soaCommonService.SOAformNo,
      comment: this.soaData.formCommon.opinion,
      userCode: this.userContextService.user$.getValue().userCode,
      userName: this.userContextService.user$.getValue().userName,
      deptCode: this.soaData.header.deptCode,
      deptName: this.soaData.header.deptInfo,
      cosigner: this.getCosigner(assigneeData) || null,
      ouCode: this.soaData.applyInfo.corp,
      ouName: this.soaData.applyInfo.corpName,
      vcCode: this.soaData.applyInfo.vcCode,
      vcNameC: this.soaData.applyInfo.vcNameC,
      vcNameE: this.soaData.applyInfo.vcNameE,
      area: this.soaData.applyInfo.area,
      ieType: this.soaData.applyInfo.ieType,
      vcType: this.soaData.applyInfo.vcType,
      startDate: this.soaData.applyInfo.startDate,
      endDate: this.soaData.applyInfo.endDate,
      remark: this.soaData.applyInfo.remark,
      isOriginal: this.soaData.ouInfo.docValue,
      specialApproval: 'N', // 只有 legal 與 TCSU 能編輯
      ouType: this.getOuType(),
      groupDatas: this.getGroupDatas(),
      datas: this.getItemInfoForModel()
    }
  }

  /**
   * Apply前檢查
   *
   * @returns
   */
  private sumbitCheckPass(): true | false {
    this.noticeContentList = new Array<string>();
    const pleaseSelect = this.translateService.instant('Input.PlaceHolder.PleaseSelect');

    const cvHaveValue = this.soaData.applyInfo.vcNameC || this.soaData.applyInfo.vcNameE
    if (!cvHaveValue) { this.noticeContentList.push(`${pleaseSelect} ${this.translateService.instant('SOA.Label.CV')}`); }

    const itemHaveValue = this.soaData.itemInfo.length !== 0;
    if (!itemHaveValue) { this.noticeContentList.push(`${pleaseSelect} Item`); }

    const groupType = this.soaData.ouInfo.groupTypeValue;

    let groupTarget = []; // 當前所選擇之Group選項
    if (groupType === 'OU') { groupTarget = this.soaData.ouInfo.ouMainList.filter(mainList => { return this.soaData.ouInfo.ouSelectedValueRadio === mainList.groupCode }) }
    else if (groupType === 'Group OU') { groupTarget = this.soaData.ouInfo.ouMainList.filter(mainList => { return this.soaData.ouInfo.ouSelectedValueCheckbox.includes(mainList.groupCode) }) }
    let groupOriginLimitList = ['WPG-CLOUD', 'WPGH'] // 限制必須為正本的Group區域
    groupTarget = groupTarget.filter(group => { return groupOriginLimitList.includes(group.groupName) });

    const shouldBeOrigin = (groupTarget.length !== 0) && (this.soaData.ouInfo.docValue === 'N')
    if (shouldBeOrigin) { this.noticeContentList.push(this.translateService.instant('SOA.Msg.ShouldBeOrigin')); }

    const showSelectOU = groupType === 'OU' && this.soaData.ouInfo.ouSubSelectedValue.length === 0;
    if (showSelectOU) { this.noticeContentList.push(`${pleaseSelect} OU`); }

    const showSelectGroupOU = groupType === 'Group OU' && this.soaData.ouInfo.ouSelectedValueCheckbox.length === 0;
    if (showSelectGroupOU) { this.noticeContentList.push(`${pleaseSelect} Group`); }

    const opinionOverSize = this.soaData.formCommon.opinion?.length > 250;
    if (opinionOverSize) { this.noticeContentList.push(this.translateService.instant('LicenseMgmt.Common.Hint.OpinionUpto250')) }

    const dateDuringIsValid = this.soaData.applyInfo.startDate <= this.soaData.applyInfo.endDate;
    if (!dateDuringIsValid) { this.noticeContentList.push(this.translateService.instant('SOA.Msg.ErrorDateFormat')) }

    const errorDeptInfo = (!this.soaData.header.deptCode) && (!this.soaData.header.deptInfo);
    if (errorDeptInfo) { this.noticeContentList.push(this.translateService.instant('SOA.Msg.PlzChooseDept')) }

    const allGroupOnlyAllowOrigin = (this.soaData.ouInfo.groupTypeValue === 'ALL Group') && (this.soaData.ouInfo.docValue === 'N')
    if (allGroupOnlyAllowOrigin) { this.noticeContentList.push(this.translateService.instant('SOA.Msg.AllGroupOnlyAllowOrigin')) }

    let docAreaIsValid = false;
    this.soaCommonService.docArea.ruleList.forEach(area => {
      if (this.soaData.applyInfo.area === area.ruleCode) { docAreaIsValid = true };
    });
    const docAreaDisabled = (this.soaCommonService.currentRole !== 'Applyer') && (this.soaCommonService.currentRole !== 'TCSU');
    if (!docAreaIsValid && !docAreaDisabled) { this.noticeContentList.push(this.translateService.instant('SOA.Msg.PlzChooseDocArea')) }

    if (this.noticeContentList.length > 0) {
      this.showNoticeDialog('error');
      this.showSpinner = false;
      return false;
    } else {
      return true;
    }
  }

  private showNoticeDialog(mode: string) {
    if (this.noticeContentList.length > 0) {
      this.noticeCheckDialogParams = {
        title: this.translateService.instant('LicenseMgmt.Common.Title.Notification'),
        visiable: true,
        mode: mode
      };
    }
  }

  private getOuType() {
    if (this.soaData.ouInfo.groupTypeValue === 'Group OU') { return 'GroupOU' }
    else if (this.soaData.ouInfo.groupTypeValue === 'OU') { return 'OU' }
    else if (this.soaData.ouInfo.groupTypeValue === 'ALL Group') { return 'All'; }
  }

  private getGroupDatas() {
    let groupDatas = [];
    if (this.soaData.ouInfo.groupTypeValue === 'Group OU') {
      this.soaData.ouInfo?.ouSelectedValueCheckbox?.forEach(ou => {
        this.soaData.ouInfo?.ouMainList?.forEach(mainList => {
          if (mainList.groupCode === ou) {
            groupDatas.push(
              {
                ...mainList,
                ouList: null
              }
            )
          }
        })
      })
    } else if (this.soaData.ouInfo.groupTypeValue === 'OU') {
      let targetOu = null;
      this.soaData.ouInfo.ouMainList.forEach(mainList => {
        if (mainList.groupCode === this.soaData.ouInfo.ouSelectedValueRadio) {
          targetOu = mainList;
        }
      })
      if (targetOu) {
        groupDatas.push(
          {
            "groupCode": targetOu.groupCode,
            "groupName": targetOu.groupName,
            "ouList": this.soaData.ouInfo.ouSubSelectedValue
          }
        )
      }
    } else if (this.soaData.ouInfo.groupTypeValue === 'ALL Group') {
      groupDatas = [
        {
          "groupCode": "0",
          "groupName": "0",
          "ouList": null
        }
      ]
    }
    return groupDatas;
  }

  private getItemInfoForModel() {
    const itemInfo = [];
    this.soaData.itemInfo.forEach(item =>
      itemInfo.push({
        brand: item.brand ? item.brand : null,
        isDeduct: item.isDeduct,
        productCode: item.productCode,
        quantity: item.quantity || 0, // null時傳0
        ctg1: item.ctg1 ? item.ctg1 : null,
        ctg2: item.ctg2 ? item.ctg2 : null,
        ctg3: item.ctg3 ? item.ctg3 : null,
        eccn: item.eccn ? item.eccn : null
      })
    );
    return itemInfo;
  }

  private getCosigner(event) {
    let consigner = [];
    if (event?.cosigners) {
      Array.isArray(event.cosigners)
        ? event.cosigners.forEach(cos => { consigner.push(cos.value.staffCode) })
        : consigner.push(event.cosigners.value.staffCode)
    }
    return consigner
  }

  private getApprovingAndApproveLicenseModel() {
    let ouGroups = [];
    let ouCodes = [];

    switch (this.soaData.ouInfo.groupTypeValue) {
      case 'ALL Group': ouGroups = []; ouCodes = []; break;
      case 'OU':
        // ouGroups = [this.soaData.ouInfo.ouSelectedValueRadio];  
        ouGroups = this.soaData.ouInfo.ouMainList
          .filter(item => { return item.groupCode === this.soaData.ouInfo.ouSelectedValueRadio })
          .map(item => item.groupName)
        ouCodes = this.soaData.ouInfo.ouSubSelectedValue; break;

      case 'Group OU':
        // ouGroups = this.soaData.ouInfo.ouSelectedValueCheckbox;
        this.soaData.ouInfo.ouMainList.forEach(element => {
          if (this.soaData.ouInfo.ouSelectedValueCheckbox.includes(element.groupCode)) { ouGroups.push(element.groupName) }
        });
        ouCodes = []; break;
      default: break;
    }

    let items = [];
    this.soaData.itemInfo.forEach(item => {
      items.push({
        productCode: item.productCode,
        brand: item.brand ?? null,
        ctg1: item.ctg1 ?? null,
        ctg2: item.ctg2 ?? null,
        ctg3: item.ctg3 ?? null,
        eccn: item.eccn ?? null,
      })
    });

    return {
      tenant: this.userContextService.user$.getValue().tenant,
      licenseType: "SOA",
      vcType: this.soaData.applyInfo.vcType,
      vcCode: this.soaData.applyInfo.vcCode,
      ouGroups: ouGroups,
      ouCodes: ouCodes,
      items: items
    }

  }
}
