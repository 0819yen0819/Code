import { Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { AuthApiService } from './auth-api.service';
import { CommonApiService } from './common-api.service';

@Injectable({
    providedIn: 'root'
})
export class RuleSetupService {
    constructor(
        private authApiService: AuthApiService,
        private commonApiService: CommonApiService,
    ) { }

    getAllTenants(): Observable<any> {
        return this.authApiService.getAllTenants();
    }

    queryRuleSetup(model: any): Observable<any> {
        model.msgFrom = 'RuleSetting';
        return this.commonApiService.queryRuleSetup(model);
    }

    ruleSetupView(model: any): Observable<any> {
        return this.commonApiService.ruleSetupView(model);
    }

    ruleSetupModify(model: any): Observable<any> {
        return this.commonApiService.ruleSetupModify(model);
    }
}