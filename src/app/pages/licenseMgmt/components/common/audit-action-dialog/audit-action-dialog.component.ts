import { Component, Input, OnChanges, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { TranslateService } from '@ngx-translate/core';
import {
  ConfirmationService as NGConfirmationService,
  SelectItem,
} from 'primeng/api';
import { BehaviorSubject, Observable, Subject, takeUntil } from 'rxjs';
import { skipWhile, takeLast } from 'rxjs/operators';
import { FormTypeEnum } from 'src/app/core/enums/license-name';
import { DialogSettingParams } from 'src/app/core/model/selector-dialog-params';
import { AuditHistoryLog } from 'src/app/core/model/sign-off-history';
import { SimpleUserInfo } from 'src/app/core/model/user-info';
import { MyFlowService } from 'src/app/core/services/my-flow.service';
import { ObjectFormatService } from 'src/app/core/services/object-format.service';
import { UserContextService } from 'src/app/core/services/user-context.service';
import { AuditActionControlService } from '../../../services/audit-action-control.service';
import { AuthApiService } from './../../../../../core/services/auth-api.service';
import { AgentInfoTableService } from 'src/app/core/components/agent-info-table/agent-info-table.service';

@Component({
  selector: 'app-common-audit-action-dialog',
  templateUrl: './audit-action-dialog.component.html',
  styleUrls: ['./audit-action-dialog.component.scss'],
})
export class AuditActionDialogComponent implements OnInit, OnChanges {
  @Input() settingParams!: DialogSettingParams;

  private unsubscribeEvent = new Subject();

  dialogSetting!: BehaviorSubject<DialogSettingParams>;

  formGroup!: FormGroup;

  stepNumber!: number;
  nowStep!: string;
  isAssigneeTask!: boolean;
  isTaskStarter!: boolean;
  rollbackStepOptions!: SelectItem<any>[];

  curAction!: string;
  curFormNo!: string;
  curFormType!: string;
  curFormTypeId!: string;
  fuzzyEmpInfosOptions!: BehaviorSubject<SelectItem<SimpleUserInfo>[]>;

  actionRadioKit!: {
    label: string;
    value: string;
  }[];

  //>notice check dialog params
  noticeCheckDialogParams!: DialogSettingParams;

  //> error message list
  noticeContentList!: string[];

  constructor(
    private formBuilder: FormBuilder,
    private authApiService: AuthApiService,
    private userContextService: UserContextService,
    private auditActionControlService: AuditActionControlService,
    private objectFormatService: ObjectFormatService,
    private ngConfirmationService: NGConfirmationService,
    private translateService: TranslateService,
    private myFlowService: MyFlowService,
    private agentInfoTableService : AgentInfoTableService
  ) {}

  ngOnInit(): void {
    //> init dialog setting
    this.dialogSetting = new BehaviorSubject<DialogSettingParams>({
      title: '',
      visiable: false,
      modal: true,
      maximized: true,
      draggable: false,
      resizeable: true,
      blockScroll: true,
    });

    //> init form group values
    this.formGroup = this.formBuilder.group({
      action: [null, [Validators.required]],
      activityId: [null],
      cosigners: [null],
      comment: [null],
    });

    this.isAssigneeTask = false;
    this.rollbackStepOptions = new Array<SelectItem<any>>();

    this.fuzzyEmpInfosOptions = new BehaviorSubject<
      SelectItem<SimpleUserInfo>[]
    >([]);

    this.onCosignersOptionsResetHandler();
    this.onCosignersResetHandler();
    this.onDeterminingFormTypeHandler();

    this.formGroup.valueChanges
      .pipe(takeUntil(this.unsubscribeEvent))
      .subscribe(() => {
        this.onCosignersResetHandler();
      });
  }

  ngOnChanges(): void {
    //> when any changes, reset dialog setting params
    if (this.dialogSetting) {
      this.dialogSetting.next({
        ...this.dialogSetting.getValue(),
        ...this.settingParams,
      });

      if (this.dialogSetting.getValue().visiable) {
        this.curFormNo = this.dialogSetting.getValue().data.formNo;
        this.curFormTypeId = this.dialogSetting.getValue().data.formTypeId;
        this.formGroup.reset();
        this.onGetFlowAuditLog();
      } else {
        this.onDialogHide();
      }
    }
  }

  onDialogHide(): void {
    this.unsubscribeEvent.next(null);
    this.unsubscribeEvent.complete();
  }

  onDeterminingFormTypeHandler(): void {
    try {
      if (this.curFormNo.toUpperCase().includes(FormTypeEnum.EUC_S)) {
        this.curFormType = FormTypeEnum.EUC_S;
      }
    } catch {}
  }

  //> switch page mode ( edit / approve ) by currrent url
  //> get current form history
  onGetFlowAuditLog(): void {
    const getFlowAuditLog$ = (formNo: string, formTypeId: string) =>
      new Observable<AuditHistoryLog[]>((obs) => {
        if (formNo) {
          this.myFlowService
            .getFlowAuditLog(formNo, formTypeId)
            .pipe(takeLast(1))
            .subscribe((res) => {
              obs.next(res);
              obs.complete();
            });
        } else {
          obs.next([]);
          obs.complete();
        }
      });

    getFlowAuditLog$(this.curFormNo, this.curFormTypeId).subscribe((auditHistoryLog) => {
      if (auditHistoryLog.length > 0) {
          auditHistoryLog = auditHistoryLog.sort((a, b) =>
            a.receiveTime > b.receiveTime ? 1 : -1
          );

          if (auditHistoryLog[auditHistoryLog.length - 1].stepNumber === 1) {
            this.isTaskStarter = true;
          } else {
            this.isTaskStarter = false;
          }

          auditHistoryLog.forEach((data) => {
            this.stepNumber = data.stepNumber;
            this.nowStep = data.stepName;

            if (
              data.status === 'Assignee' &&
              data.signerCode ===
                this.userContextService.user$.getValue().userCode
            ) {
              this.isAssigneeTask = true;
            }
          });

          this.rollbackStepOptions = auditHistoryLog
            .filter((data) => data.status === 'Approve')
            .map((obj) => {
              return {
                label:
                  'Step.' +
                  obj.stepNumber +
                  '：' +
                  obj.authorizerCode +
                  ' ' +
                  obj.signerNameCn +
                  ' / ' +
                  obj.signerNameEn,
                value: obj.returnStep,
              };
            });

          // distinct
          this.rollbackStepOptions = this.rollbackStepOptions.filter(
            (thing, i, arr) =>
              arr.findIndex((t) => t.value === thing.value) === i
          );

          if (this.isTaskStarter) {
            this.formGroup.get('action').setValue('approve');
            this.rollbackStepOptions = [];
            this.actionRadioKit = [
              {
                label: this.translateService.instant(
                  'LicenseMgmt.Common.Option.Accept'
                ),
                value: 'approve',
              },
              {
                label: this.translateService.instant(
                  'LicenseMgmt.Common.Option.Reject'
                ),
                value: 'reject',
              },
              {
                label: this.translateService.instant(
                  'LicenseMgmt.Common.Option.FlowReturn'
                ),
                value: 'rollback',
              },
              {
                label: this.translateService.instant(
                  'LicenseMgmt.Common.Option.RedirectApproval'
                ),
                value: 'addCosigner',
              },
              {
                label: this.translateService.instant(
                  'LicenseMgmt.Common.Option.SeekEndorsement'
                ),
                value: 'addAssignee',
              },
            ];
          } else if (this.isAssigneeTask) {
            this.formGroup.get('action').setValue('resolve');
            this.actionRadioKit = [
              {
                label: this.translateService.instant(
                  'LicenseMgmt.Common.Option.Accept'
                ),
                value: 'resolve',
              },
              {
                label: this.translateService.instant(
                  'LicenseMgmt.Common.Option.SeekEndorsement'
                ),
                value: 'addAssignee',
              }
            ];
          } else {
            this.formGroup.get('action').setValue('approve');
            //> init action radio button kit variable
            this.actionRadioKit = [
              {
                label: this.translateService.instant(
                  'LicenseMgmt.Common.Option.Accept'
                ),
                value: 'approve',
              },
              {
                label: this.translateService.instant(
                  'LicenseMgmt.Common.Option.Reject'
                ),
                value: 'reject',
              },
              {
                label: this.translateService.instant(
                  'LicenseMgmt.Common.Option.FlowReturn'
                ),
                value: 'rollback',
              },
              {
                label: this.translateService.instant(
                  'LicenseMgmt.Common.Option.RedirectApproval'
                ),
                value: 'addCosigner',
              },
              {
                label: this.translateService.instant(
                  'LicenseMgmt.Common.Option.SeekEndorsement'
                ),
                value: 'addAssignee',
              },
            ];
          }
        }
      }
    );
  }

  //> get simple emp info by keyword ( fuzzy search )
  onCosignersFilterHandler(event): void {
    const getFuzzyEmpInfo$ = (keyword: string): Observable<SimpleUserInfo[]> =>
      new Observable<SimpleUserInfo[]>((obs) => {
        const tenant = this.userContextService.user$.getValue().tenant;

        if (keyword != '' && keyword != undefined) {
          this.authApiService
            .getAllEmpByTenant(tenant, keyword)
            .pipe(skipWhile((data) => data.type == 0))
            .subscribe((res) => {
              obs.next(res.body);
              obs.complete();
            });
        } else {
          obs.next([]);
          obs.complete();
        }
      });

    getFuzzyEmpInfo$(event.query).subscribe((empInfos) => {
      this.fuzzyEmpInfosOptions.next([]);

      for (const empInfo of empInfos) {
        if (
          this.fuzzyEmpInfosOptions
            .getValue()
            .findIndex((data) => data.value.staffCode == empInfo.staffCode) ==
          -1
        ) {
          this.fuzzyEmpInfosOptions.next([
            ...this.fuzzyEmpInfosOptions.getValue(),
            {
              label: `${empInfo.staffCode} ${empInfo.fullName} ${empInfo.nickName}`,
              value: empInfo,
            },
          ]);
        }
      }
    });
  }

  onCosignersOptionsResetHandler(): void {
    //> active form group values watcher
    this.onCosignersFilterHandler({
      filter: '1',
    });
  }

  onCosignersResetHandler(): void {
    this.formGroup
      .get('action')
      .valueChanges.pipe(takeUntil(this.unsubscribeEvent))
      .subscribe((res) => {
        this.formGroup.get('cosigners').setValue(null);
      });
  }

  onDialogClosed(): void {
    this.dialogSetting.next({
      ...this.dialogSetting.getValue(),
      ...{ visiable: false },
    });
  }

  onFieldKeyDownHandler(event: KeyboardEvent, field: string): void {
    if (event.key == 'Backspace' || event.key == 'Delete') {
      this.formGroup.get(field).setValue(null);
    }
  }

  async onFormSubmit(): Promise<void> {
    //> init notice content list
    this.noticeContentList = new Array<string>();
    //> prevent notice dialog open
    this.noticeCheckDialogParams = {
      visiable: false,
    };

    //> 控管要選擇退回關卡
    if (
      this.formGroup.get('action').value == 'rollback' &&
      this.formGroup.get('activityId').value == null
    ) {
      this.noticeContentList.push(
        this.translateService.instant(
          'LicenseMgmt.Common.Hint.PlzChooseReturnTask'
        )
      );
      this.noticeCheckDialogParams = {
        title: this.translateService.instant(
          'LicenseMgmt.Common.Title.Notification'
        ),
        visiable: true,
        mode: 'error',
      };
    } else if (
      (this.formGroup.get('action').value == 'addCosigner' ||
        this.formGroup.get('action').value == 'addAssignee') &&
      this.formGroup.get('cosigners').value == null
    ) {
      this.noticeContentList.push(
        this.translateService.instant(
          'LicenseMgmt.Common.Hint.PlzChooseCosigners'
        )
      );
      this.noticeCheckDialogParams = {
        title: this.translateService.instant(
          'LicenseMgmt.Common.Title.Notification'
        ),
        visiable: true,
        mode: 'error',
      };
    } else {

      const agentCheckRsp = await this.agentCheck();
      if (!agentCheckRsp){return;}

      this.ngConfirmationService.confirm({
        message: this.translateService.instant(
          'LicenseMgmt.Common.Hint.QSubmit'
        ),
        header: 'Confirm',
        icon: 'pi pi-exclamation-triangle',
        key: 'auditActionDialog',
        accept: () => {
          let model = this.objectFormatService.ObjectClean({
            ...this.formGroup.getRawValue(),
            stepNumber: this.stepNumber,
            nowStep: this.nowStep,
          });

          if (this.formGroup.get('cosigners').value !== null) {
            const cosigner: string[] = new Array<string>();

            if (
              typeof this.formGroup.get('cosigners').value.value == 'object'
            ) {
              cosigner.push(
                this.formGroup.get('cosigners').value.value.staffCode
              );
            } else {
              for (const data of this.formGroup.get('cosigners').value) {
                cosigner.push(data.value.staffCode);
              }
            }

            delete model.cosigners;
            model = { ...model, cosigner: cosigner };
          }

          this.auditActionControlService.setAuditAction(model);
          this.dialogSetting.next({
            ...this.dialogSetting.getValue(),
            ...{ visiable: false },
          });
        },
      });
    }
  }

  actionHistory = '';
  agentInfoArr = [];
  actionOnChange(){
    const actionChange = this.actionHistory !== this.formGroup?.get('action')?.value;
    if (actionChange){ this.agentInfoArr = [];} // 清空代理人資訊
    this.actionHistory = this.formGroup?.get('action')?.value;
  }

  onFieldSelectAlready() {
    this.agentInfoArr = [(this.formGroup?.get('cosigners')?.value as any)?.value?.staffCode]
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
  
  onCosignerKeyDownHandler(event: KeyboardEvent, field: string){
    if (event.key == 'Backspace' || event.key == 'Delete') {
      this.formGroup?.get('cosigners')?.setValue(null);
      this.agentInfoArr = [];
    }
  }
  
}
