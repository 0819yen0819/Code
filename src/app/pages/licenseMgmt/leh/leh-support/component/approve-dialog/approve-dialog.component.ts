import {
  Component,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output,
} from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { DialogSettingParams } from 'src/app/core/model/selector-dialog-params';
import { ApproveDialogService } from './approve-dialog.service';
import { actionRadioKit } from './approve-dialog.const';
import { TranslateService } from '@ngx-translate/core';
import { ConfirmationService as NGConfirmationService } from 'primeng/api';
import { Subject, takeUntil } from 'rxjs';
import { ActivatedRoute, Router } from '@angular/router';
import { AgentInfoTableService } from 'src/app/core/components/agent-info-table/agent-info-table.service';

@Component({
  selector: 'app-approve-dialog',
  templateUrl: './approve-dialog.component.html',
  styleUrls: ['./approve-dialog.component.scss'],
})
export class ApproveDialogComponent implements OnInit, OnDestroy {
  @Input() dialogOpen: boolean;
  @Output() submitInfo = new EventEmitter<any>(); // 將formGroup與相關history log往上送
  @Output() closeDialog = new EventEmitter<any>();

  private unsubscribeEvent = new Subject(); // 取消訂閱

  formGroup = this.formBuilder.group({
    action: ['approve', [Validators.required]],
    rollbackStep: [null],
    cosigners: [null],
    comment: [null],
  });

  actionRadioKit = actionRadioKit; // Radio按鈕設定

  noticeCheckDialogParams!: DialogSettingParams; // 錯誤提示dialog設定
  noticeContentList: string[]; //錯誤提示的內容 
  onlyAllowDeleteInput = false;
  dialogTitle = '';

  constructor(
    public approveDialogService: ApproveDialogService,
    private formBuilder: FormBuilder,
    private translateService: TranslateService,
    private ngConfirmationService: NGConfirmationService,
    private activatedRoute: ActivatedRoute,
    private router: Router,
    private agentInfoTableService : AgentInfoTableService
  ) { }

  ngOnInit(): void {
    this.approveDialogService.initFinish.subscribe(()=>{
      if (this.approveDialogService.isDraft){
        this.formGroup.get('action').setValue('addAssignee')
      }
    })
    this.init(); 
    this.subscribeFormChange(); 
    this.subscribeLangChange();
  }

  ngOnDestroy(): void {
    this.unsubscribeEvent?.next(null);
    this.unsubscribeEvent?.complete();
    this.approveDialogService.destroy();
  }

  subscribeLangChange() {
    this.translateService.onLangChange.subscribe(() => { 
      let formNo = this.router.url.indexOf('queryFormNo') !== -1 ? this.router.url.split('queryFormNo=').pop().split('&backUrl=')[0] : '';  
      formNo
      ? this.dialogTitle = this.translateService.instant('Button.Label.Approve')
      : this.dialogTitle = this.translateService.instant('Button.Label.RedirectApprove') 
    });
  } 

  private init(){
    const formNo = this.router.url.indexOf('queryFormNo') !== -1 ? this.router.url.split('queryFormNo=').pop().split('&backUrl=')[0] : '';
    this.approveDialogService.onGetFlowAuditLog(formNo); // 取得當前視窗應顯示哪些欄位
    this.dialogTitle = this.translateService.instant('Button.Label.Approve')

    const currentIsNewForm = !formNo
    if (currentIsNewForm){ // 預設是在審核，但若當前是新增表單，則需要預設在加簽
      this.formGroup.get('action').setValue('addAssignee');
      this.dialogTitle = this.translateService.instant('Button.Label.RedirectApprove')
    }
  }

  /**
   * Radio button切換時清空資料
   */
  subscribeFormChange() {
    this.formGroup.get('action').valueChanges.pipe(takeUntil(this.unsubscribeEvent)).subscribe(() => {
        this.clearFormGroup();
    });
  }

  onDialogClosed() {
    this.dialogOpen = false;
  }

  async onFormSubmit(): Promise<void> {
    this.noticeContentList = new Array<string>();
    this.noticeCheckDialogParams = {
      visiable: false,
    };

    // 這是因為 actionRadioKit 只有一組，但應該有兩組，一組核准時傳Approve,一組核准時傳resolve
    const action = this.approveDialogService.getIsAssigneeTask && (this.formGroup.get('action').value === 'approve') ? 'resolve' : this.formGroup.get('action').value; // 加簽傳回的要是resolve
    const rollbackStep = this.formGroup.get('rollbackStep').value;
    const cosigners = this.formGroup.get('cosigners').value;

    const checkList = [
      {
        // 選了退回，但沒有選退給誰(因為沒得選)
        condition:action == 'rollback' && rollbackStep == null && this.approveDialogService.getRollBackStepOptions.length === 0,
        errorLabel: 'LicenseMgmt.Common.Hint.NotAllowReturn',
      },
      {
        // 選了退回，但沒有選退給誰(有得選)
        condition:action == 'rollback' && rollbackStep == null && this.approveDialogService.getRollBackStepOptions.length !== 0,
        errorLabel: 'LicenseMgmt.Common.Hint.PlzChooseReturnTask',
      },
      {
        // 選了加簽至下一關或是加簽傳回，但沒有選給誰
        condition:(action == 'addCosigner' || action == 'addAssignee') && cosigners == null,
        errorLabel:'LicenseMgmt.Common.Hint.PlzChooseCosigners',
      },
    ];

    const agentCheckRsp = await this.agentCheck();
    if (!agentCheckRsp){return;}

    let canSubmit = true;
    checkList.forEach((check) => {
      canSubmit = canSubmit && this.checkBeforeSubmitIsPass(check.condition, check.errorLabel);
    });
    if (!canSubmit) {  return; }

    // 打開確認送出dialog
    this.ngConfirmationService.confirm({
      message: this.translateService.instant('LicenseMgmt.Common.Hint.QSubmit'),
      header: 'Confirm',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        // 先取消訂閱 避免setValue時觸發clear 導致往上送的資料錯誤
        this.unsubscribeEvent?.next(null);
        this.unsubscribeEvent?.complete();

        this.formGroup.get('action').setValue(action);
        const parmas = {
          ...this.formGroup.value,
          stepNumber: this.approveDialogService.getStepNumber,
          nowStep: this.approveDialogService.getNowStep,
        };
        this.submitInfo.emit(parmas);
        this.dialogOpen = false;
      }
    });
  }

  checkBeforeSubmitIsPass(condition: boolean, errorLabel: string) {
    if (condition) {
      this.noticeContentList.push(this.translateService.instant(errorLabel));
      this.noticeCheckDialogParams = {
        title: this.translateService.instant(
          'LicenseMgmt.Common.Title.Notification'
        ),
        visiable: true,
        mode:'error'
      };
      return false;
    } else {
      return true;
    }
  }

  /**
   * 加簽至下一關 backspace時刪掉一個單位
   * @param event
   * @param field
   */
  onFieldKeyDownHandler(event: KeyboardEvent, field: string): void {
    if (event.key == 'Backspace' || event.key == 'Delete') {
      this.formGroup.get(field).setValue(null);
      this.onlyAllowDeleteInput = false;
      this.agentInfoArr = [];
    }
    if (this.onlyAllowDeleteInput) { // 已經有選擇人員了，此時僅允許刪除  
      event.preventDefault();
    }
  }

  onFieldSelectAlready() {
    this.agentInfoArr = [(this.formGroup?.get('cosigners')?.value as any)?.value?.staffCode]
    this.onlyAllowDeleteInput = true;
  }
 
  /**
   * p-dialog close 機制 patch function
   */
  close() {
    this.clearFormGroup(true);
    this.closeDialog.emit();
  }

  actionHistory = '';
  agentInfoArr = [];
  actionOnChange(){
    const actionChange = this.actionHistory !== this.formGroup?.get('action')?.value;
    if (actionChange){ this.agentInfoArr = [];} // 清空代理人資訊
    this.actionHistory = this.formGroup?.get('action')?.value;
  }

  addAssigneeOnSelect(){
    this.agentInfoArr = (this.formGroup?.get('cosigners')?.value as any)?.map((item:any)=>item.value.staffCode)
  }

  onAssigneeFieldKeyDown(event: KeyboardEvent, field: string){
    if (event.key == 'Backspace' || event.key == 'Delete') {
      this.agentInfoArr = (this.formGroup?.get('cosigners')?.value as any)?.map((item:any)=>item.value.staffCode)
    }
  }
 
  agentCheck(){
    return new Promise((resolve, reject) => {
      const agents:string[] = [];
      this.agentInfoArr.forEach((userCode:any) => {
        const agentInfo = this.agentInfoTableService.getAgentInfo(userCode)
        if(agentInfo){agents.push(agentInfo?.userName);}
     }); 

     if (agents.length  === 0 ) {resolve(true)}
     else{
      this.ngConfirmationService.confirm({
        message: agents.join(' , ') + this.translateService.instant('AgentInfoHint.Hint'),
        header: 'Confirm',
        icon: 'pi pi-exclamation-triangle',
        key: "agentCheckConfirmDialog",
        accept: () => { resolve(true);  },
        reject: () => {  resolve(false); }
      });
     } 
    });
  }

  private clearFormGroup(resetSeleted: boolean = false) {
    if (resetSeleted) {
      this.formGroup.get('action').setValue('approve');
    }
    this.formGroup.get('rollbackStep').setValue(null);
    this.formGroup.get('cosigners').setValue(null); 
  }
}
