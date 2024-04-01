import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class AgentInfoTableService {

  constructor() { }
  private agentInfoMap: Map<string, any> = new Map();
  private formTypeId = '';

  getAgentInfo(userCode: string) {
    return this.agentInfoMap.get(userCode);
  }

  setAgentInfo(e: any) {
    this.agentInfoMap.set(e.userCode, e.userInfoArr[0]);
  }

  // 設定當前表單的 FormTypeId
  setFormTypeId(formTypeId:string){
    this.formTypeId = formTypeId;
  }

  getFormTypeId(){
    return this.formTypeId;
  }
}
