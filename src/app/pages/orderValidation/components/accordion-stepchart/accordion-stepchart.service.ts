import { Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { lastValueFrom } from 'rxjs';
import { MyFlowService } from 'src/app/core/services/my-flow.service';

@Injectable({
  providedIn: 'root'
})
export class AccordionStepchartService {

  constructor(
    private myFlowService: MyFlowService,
    private translateService: TranslateService
  ) { }



  async getProcessForecastingByLang(formTypeId: string, formNo: string, lang = this.translateService.currentLang) {
    return new Promise<any>(async (resolve, reject) => {

      try {
        // 1-1.確認表單有沒有在簽核中，沒有就不往下
        const isApproving = await this.isApproving(formTypeId, formNo);
        if (!isApproving) { return [] };

        // 1-2.取得這張表單的未來簽核流程，如果空直接回傳
        const rsp = await lastValueFrom(this.myFlowService.getProcessForecasting(formTypeId, formNo))
        if (!(rsp.process) || (rsp.process?.length === 0)) { resolve([]); }

        // 1-3.取得這張表單Log 中最大的 StepNumber
        const maxStepNumber = Math.max.apply(Math, rsp.process.map(function (obj) { return obj.stepNumber; }));
        // 1-4.取得這張表單目前Pending的 StepNumber
        const curPendingStepNumber = await this.getPendingStepNumber(formTypeId, formNo);

        // 1-5.開始建立處理完成後回傳用的陣列
        const ForecastingResult = [];
        for (let targetStepNumber = 1; targetStepNumber <= maxStepNumber; targetStepNumber++) {  // 依照stepNumber排序，並依照stepNumber來Group並用signerCode來排序 (0不用)
          let toolTipsOfStepNumberCn = "";
          let contentOfStepNumberCn = "";
          let toolTipsOfStepNumberEn = "";
          let contentOfStepNumberEn = "";
          let classNameOfStepNumber = "inactive"; // 預設狀態為未處理 (灰色)
          let stepMemberCount = 0; // 計算這個 StepNumber 有幾個人
          if (targetStepNumber < curPendingStepNumber) { classNameOfStepNumber = "done" } // 比當前Pending的StepNumber小 -> 表示已經處理完 (綠色)
          else if (targetStepNumber === curPendingStepNumber) { classNameOfStepNumber = "active" } // 跟當前Pending的StepNumber一樣 -> 表示處理中 (藍色)

          const targetArr = [];
          for (let index = 0; index < rsp.process.length; index++) { // 找出所有符合當前 targetStepNumber 的 Log
            if (+rsp.process[index].stepNumber === targetStepNumber) { targetArr.push(rsp.process[index]); }
          }

          targetArr
          .sort((a, b) => parseInt(a.signerCode) - parseInt(b.signerCode)) // 工號排序小到大
          .forEach(element => {
            toolTipsOfStepNumberCn += `(${element.signerCode})${element.signerNameCn}/` // tooltips內容為(signerCode)+ signerNameCn或signerNameEn(依照語系判斷)
            contentOfStepNumberCn += `${element.stepName}-${element.signerNameCn}/` // 顯示內容為stepName+-+ signerNameCn或signerNameEn(依照語系判斷)
            toolTipsOfStepNumberEn += `(${element.signerCode})${element.signerNameEn}/`
            contentOfStepNumberEn += `${element.stepName}-${element.signerNameEn}/`
            stepMemberCount++;
          })

          ForecastingResult.push({
            className: classNameOfStepNumber,
            toolTipsCn: toolTipsOfStepNumberCn.slice(0, -1),
            contentCn: stepMemberCount > 1 ? contentOfStepNumberCn.split('/')[0] + '...' : contentOfStepNumberCn.split('/')[0],// 若同一關卡有多位，畫面只需顯示第一個簽核者後面加上…表示該關卡有多位
            toolTipsEn: toolTipsOfStepNumberEn.slice(0, -1),
            contentEn: stepMemberCount > 1 ? contentOfStepNumberEn.split('/')[0] + '...' : contentOfStepNumberEn.split('/')[0]
          })
        }

        resolve(ForecastingResult);

      } catch (error) {
        resolve([]);
        console.log('getProcessForecastingByLang取得預跑流程失敗', error)
      }
    })
  }

  private async isApproving(formTypeId: string, formNo: string) {
    return new Promise<boolean>(async (resolve, reject) => {
      const rsp = await lastValueFrom(this.myFlowService.getFormLog(formNo, formTypeId));
      resolve(rsp.status === 'Approving')
    })
  }

  private async getPendingStepNumber(formTypeId: string, formNo: string) {
    return new Promise<number>(async (resolve, reject) => {
      const flowAuditLog = await lastValueFrom(this.myFlowService.getFlowAuditLog(formNo, formTypeId));
      const pendingLog = flowAuditLog.filter(item => item.status === 'Approving');
      resolve(pendingLog[0].stepNumber)
    });
  }


}
