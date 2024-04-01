import { Component, Input, OnChanges, OnInit, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { UserContextService } from '../../services/user-context.service';
import { AuthApiService } from '../../services/auth-api.service';
import { lastValueFrom } from 'rxjs';
import { LanguageService } from '../../services/language.service';
import { AgentInfoTableService } from './agent-info-table.service';
import { LoaderService } from '../../services/loader.service';
import { MyFlowService } from '../../services/my-flow.service';

@Component({
  selector: 'app-agent-info-table',
  templateUrl: './agent-info-table.component.html',
  styleUrls: ['./agent-info-table.component.scss']
})
export class AgentInfoTableComponent {
  @Input() userCode = '' // 傳入人員工號陣列

  data: any;
  userInfoArr: any[] = [];
  formTypeId = '';

  constructor(
    private userContextService: UserContextService,
    private sofAuthApiService: AuthApiService,
    private loaderService: LoaderService,
    private languageService: LanguageService,
    private agentInfoTableService: AgentInfoTableService,
    private myFlowService: MyFlowService
  ) { }

  async ngOnChanges(changes: SimpleChanges): Promise<void> {
    if (this.userCode) {
      this.formTypeId = this.agentInfoTableService.getFormTypeId();
      this.loaderService.show();
      const model = this.getAgentRequest(this.userCode);
      const response = await this.getAgentInfoPromiseByUserCode(model);
      this.userInfoArr = await this.preProcessResult(response.body.result);
      this.loaderService.hide();
      this.agentInfoTableService.setAgentInfo({
        userCode: this.userCode,
        userInfoArr: this.userInfoArr
      })
    }
  }

  private preProcessResult(result: any) {
    return new Promise<any>(async (resolve, reject) => {

      try {
        for (const element of result) {
          element.formTypeIds = element.formTypeIds.split(',')
          
          if (this.formTypeId) {    // 如果有傳入 FormTypeId ，判斷當前表單是否存在於代理中
            const existOnAgentFormType = element.formTypeIds.filter((item: string) => ['ALL', this.formTypeId].includes(item)).length > 0;
            if (!existOnAgentFormType) { resolve([]); } // 當前表單類型不存在代理中
          }

          element.formTypeInfo = [];
          element.formTypeNameByLang = [];
          element.formTypeNameOutput = '';
          for (const formTypeId of element.formTypeIds) {
            const formTypeIdRsp = await lastValueFrom(this.myFlowService.getFormTypeByPost(formTypeId));
            const formTypeExist = formTypeIdRsp.body?.formTypeId; // 避免代理人新增完之後後續 FormType 資料被刪除
            if (formTypeExist){
              element.formTypeInfo.push(formTypeIdRsp.body)
              const userLang = this.languageService.getLang();
              element.formTypeNameByLang.push(userLang === 'zh-tw' ? formTypeIdRsp.body.formTypeNameC : formTypeIdRsp.body.formTypeNameE)
            } 
          }
          element.formTypeNameOutput = element.formTypeNameByLang.join(' , ')
        };

        resolve(result);
      } catch (error) {
        reject([]);
      }

    });
  }

  private getAgentInfoPromiseByUserCode(model: any) {
    return lastValueFrom(this.sofAuthApiService.getAgent(model));
  }

  private getAgentRequest(userCode: string) {
    return {
      activeFlag: "Y",
      startDate: new Date(),
      endDate: new Date(),
      tenant: this.userContextService.user$.getValue()!.tenant,
      userCode: userCode,
      staffCode: userCode
    }
  }

}
