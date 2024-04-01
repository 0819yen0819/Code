import { Injectable } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { TranslateService } from '@ngx-translate/core';
import { Observable, takeLast } from 'rxjs';
import { AuditHistoryLog } from 'src/app/core/model/sign-off-history';
import { LicenseControlApiService } from 'src/app/core/services/license-control-api.service';
import { ICPRuleInfo } from './../../../core/model/icp-rule-info';
import { UserContextService } from './../../../core/services/user-context.service';

@Injectable({
  providedIn: 'root',
})
export class IcpProcessService {
  constructor(
    private translateService: TranslateService,
    private licenseControlApiService: LicenseControlApiService,
    private userContextService: UserContextService
  ) {}

  //> 取得 ICP Check Rules
  getICPCheckRules(): Observable<ICPRuleInfo[]> {
    const getICPCheckRules$ = () =>
      new Observable<ICPRuleInfo[]>((obs) => {
        this.licenseControlApiService
          .getICPCheckRules()
          .pipe(takeLast(1))
          .subscribe({
            next: (res) => {
              obs.next(res.checkOption);
              obs.complete();
            },
            error: (err) => {
              console.error(err);
              obs.next([]);
              obs.complete();
            },
          });
      });
    return getICPCheckRules$();
  }

  //> 檢測 ICP Rules Status 是否全部統一
  checkAllICPStatus(icpRules: ICPRuleInfo[]): [ICPRuleInfo[], string | null] {
    let icpRuleStatusList = new Array();
    let curAllSetStatus = null;
    for (const icpRule of icpRules) {
      for (const icpRuleOption of icpRule.checkOption) {
        //> Init isTrue
        if (!icpRuleOption.isTrue) {
          icpRuleOption.isTrue = null;
        }

        //> Init isDisabled
        if (!icpRuleOption.isDisabled) {
          icpRuleOption.isDisabled = false;
        }

        //> 推入每個 rule 的狀態
        icpRuleStatusList.push(icpRuleOption.isTrue);
      }
    }

    //> 檢測是否統一
    for (const [index, status] of icpRuleStatusList.entries()) {
      if (index > 0) {
        //> value===null 直接結束比對
        //> 對比前一個，相等就持續比對
        if (status === icpRuleStatusList[index - 1] && status !== null) {
          curAllSetStatus = status;
        } else {
          curAllSetStatus = null;
          break;
        }
      }
    }

    return [icpRules, curAllSetStatus];
  }

  //> Reset All Rules Status by All Set Selector
  resetRulesStatus(icpRules: ICPRuleInfo[], status: string): ICPRuleInfo[] {
    for (const icpRule of icpRules) {
      for (const icpRuleOption of icpRule.checkOption) {
        icpRuleOption.isTrue = status;
      }
    }

    return icpRules;
  }

  //> Valid ICP Form and Notice
  validICPForm(formGroup: FormGroup, icpRules: ICPRuleInfo[]): string[] {
    const noticeContentList: string[] = new Array<string>();

    //> 檢測 負責篩選人員 empCode
    if (!formGroup.get('empCode').value) {
      noticeContentList.push(
        this.translateService.instant('LicenseMgmt.ICP.PlaceHolder.EmpInfo')
      );
    }

    //> 檢測 客戶公司名稱 companyName
    if (!formGroup.get('companyName').value) {
      noticeContentList.push(
        this.translateService.instant('LicenseMgmt.ICP.PlaceHolder.CompanyName')
      );
    }

    //> 檢測 新/舊客戶
    if (!formGroup.get('isNew').value) {
      noticeContentList.push(
        this.translateService.instant(
          'LicenseMgmt.ICP.PlaceHolder.NewOldCustomer'
        )
      );
    }

    //> 檢測 客戶通訊地址 CustAddress
    if (!formGroup.get('custAddress').value) {
      noticeContentList.push(
        this.translateService.instant('LicenseMgmt.ICP.PlaceHolder.CustAddress')
      );
    }

    let indexCount: number = 0;
    for (const icpRule of icpRules) {
      for (const icpRuleOption of icpRule.checkOption) {
        indexCount++;
        if (!icpRuleOption.isTrue) {
          if (this.translateService.currentLang === 'zh-tw') {
            noticeContentList.push(`請填寫 ICP 問題 No.${indexCount}`);
          } else {
            noticeContentList.push(
              `Please fill in the ICP question : No.${indexCount}.`
            );
          }
        }
      }
    }

    return noticeContentList;
  }

  //> 檢測是否為起案者
  checkIsTaskStarter(auditLog: AuditHistoryLog[]): boolean {
    auditLog.sort((a, b) => (a.seq > b.seq ? 1 : -1));

    if (
      auditLog[auditLog.length - 1].authorizerCode ===
      this.userContextService.user$.getValue().userCode &&
    auditLog[auditLog.length - 1].stepNumber === 1 &&
    auditLog[auditLog.length - 1].stepName === 'Application'
    ) {
      return true;
    }
    return false;
  }

  //> 重建 ICP Rules 給予勾選與未勾選選項 ID 陣列
  parseICPRulesStatus(icpRules: ICPRuleInfo[]): {
    checkTrue: string;
    checkFalse: string;
  } {
    const checkTrueList = new Array<string>();
    const checkFalseList = new Array<string>();

    for (const icpRule of icpRules) {
      for (const icpRuleOption of icpRule.checkOption) {
        if (icpRuleOption.isTrue === 'Y') {
          checkTrueList.push(icpRuleOption.checkId);
        } else if (icpRuleOption.isTrue === 'N') {
          checkFalseList.push(icpRuleOption.checkId);
        }
      }
    }

    return {
      checkTrue: checkTrueList.toString(),
      checkFalse: checkFalseList.toString(),
    };
  }

  //> 回壓 ICP Check Rules Status
  reParseICPRulesStatusToData(
    icpRules: ICPRuleInfo[],
    checkTrueList: string[],
    checkFalseList: string[]
  ): ICPRuleInfo[] {
    for (const icpRule of icpRules) {
      for (let icpRuleOption of icpRule.checkOption) {
        if (checkTrueList.includes(icpRuleOption.checkId)) {
          icpRuleOption.isTrue = 'Y';
        }
        if (checkFalseList.includes(icpRuleOption.checkId)) {
          icpRuleOption.isTrue = 'N';
        }
      }
    }

    return icpRules;
  }
}
