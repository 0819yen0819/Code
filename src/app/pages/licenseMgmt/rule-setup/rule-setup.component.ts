import { filter } from 'rxjs/operators';
import { Component, OnDestroy, OnInit, ViewChild } from "@angular/core";
import { FormBuilder } from "@angular/forms";
import { Router } from "@angular/router";
import { TranslateService } from "@ngx-translate/core";
import { MessageService, SelectItem, SortEvent } from "primeng/api";
import { Table } from "primeng/table";
import { Subscription } from "rxjs";
import { CommonApiService } from "src/app/core/services/common-api.service";
import { LanguageService } from "src/app/core/services/language.service";
import { LoaderService } from "src/app/core/services/loader.service";
import { RuleSetupService } from "src/app/core/services/rule-setup.service";
import { ToastService } from "src/app/core/services/toast.service";
import { UserContextService } from "src/app/core/services/user-context.service";
import { QueryRuleSetupBean } from "./bean/query-rule-setup-bean";
import { RuleSetupQueryRequest } from "./bean/rule-setup-query-request";
import { RuleSetupViewResponse } from "./bean/rule-setup-view-response";

@Component({
    selector: 'app-rule-setup',
    templateUrl: './rule-setup.component.html',
    styleUrls: ['./rule-setup.component.scss']
})
export class RuleSetupComponent implements OnInit, OnDestroy {

    @ViewChild('dt') dt: Table;

    private onLangChange$: Subscription;
    permissions: string[] = [];
    selectedTenants: string;
    tenantOptions: SelectItem[];
    defaultTenant: string;

    cols: any[];
    colFuncs: any[];
    selectedCols: any[];
    data: any[];
    displayFilterDetail = false;
    queryReq: RuleSetupQueryRequest = new RuleSetupQueryRequest();
    ruleSetupViewResponse: RuleSetupViewResponse = new RuleSetupViewResponse();
    displayEditDialog = false;
    editDialogTitle: string;
    editRuleValue: string;
    displayResult: boolean = false;

    constructor(
        private router: Router,
        private formBuilder: FormBuilder,
        private messageService: MessageService,
        private userContextService: UserContextService,
        public translateService: TranslateService,
        private toastService: ToastService,
        private commonApiService: CommonApiService,
        private languageService: LanguageService,
        private loaderService: LoaderService,
        private ruleSetupService: RuleSetupService,
    ) {
        if (this.userContextService.user$.getValue) {
            this.permissions = this.userContextService.getMenuUrlPermission(this.router.url);
            console.log('permissions: ', this.permissions);
        }
        this.onLangChange$ = this.translateService.onLangChange.subscribe(() => {
            this.initColumns();
            this.changeFilterDetail();
        })
        this.queryReq.tenantPermissionList = [];
    }
    ngOnInit(): void {

        this.defaultTenant = this.userContextService.user$.getValue()?.tenant;

        this.initTenantOptions();

        this.initColumns();
        this.changeFilterDetail();
    }

    initTenantOptions() {
        //# TK-35854
        this.tenantOptions = [];
        this.tenantOptions.push.apply(
            this.tenantOptions,
            this.translateService.instant('RuleSetup.Options.DefaultNull')
        );
        if (this.permissions.includes('view.all')) {
            this.ruleSetupService.getAllTenants()
                .subscribe({
                    next: (rsp) => {
                        if (rsp?.status != 200) {
                            return;
                        }

                        rsp.body?.tenants?.forEach((x) => {
                            let item: SelectItem = {
                                label: x.tenant,
                                value: x.tenant,
                            };
                            this.tenantOptions.push(item);
                            this.queryReq.tenantPermissionList.push(x.tenant);
                        });

                        //# TK-35854
                        // this.initData();
                    },
                    error: (rsp) => {
                        console.debug(rsp || 'error');
                        this.toastService.error('System.Message.Error');
                    },
                })
                .add(() => {
                    // this.selectedTenants = this.defaultTenant;
                });
        } else {
            let tenant = this.userContextService.user$.getValue()?.tenant;
            let item: SelectItem = {
                label: tenant,
                value: tenant,
            };
            this.tenantOptions.push(item);
            // this.selectedTenants = this.defaultTenant;
            this.queryReq.tenantPermissionList.push(tenant);

            //# TK-35854
            // this.initData();
        }
    }

    initColumns() {
        this.cols = this.translateService.instant('RuleSetup.Columns');
        let colFuns = this.translateService.instant('RuleSetup.ColumnFunctions');
        this.colFuncs = colFuns.filter((x) => this.permissions.includes(x.field));
        this.editDialogTitle = this.translateService.instant('RuleSetup.Title.EditRuleSetup');
    }

    changeFilterDetail() {
        this.selectedCols = this.cols.filter((x) => {
            return x.isDefault;
        });
        this.colFuncs?.forEach((x) => {
            this.selectedCols.push(x);
        });
    }

    resetCondition() {
        this.selectedTenants = '';
        this.displayResult = false;
    }

    initData() {
        this.displayResult = true;
        this.loaderService.show();
        this.data = [];
        this.queryReq.searchTenant = (this.selectedTenants || '') == '' ? null : this.selectedTenants;
        // console.log('queryReq: ', this.queryReq);
        this.ruleSetupService.queryRuleSetup(this.queryReq).subscribe({
            next: (rsp) => {
                let ruleList = rsp.ruleList.filter((x) => {
                    return x.isConfigurable === 'Y';
                });
                ruleList.forEach((x) => {
                    let queryRuleSetupBean: QueryRuleSetupBean = x;
                    this.data.push(queryRuleSetupBean);
                });
                this.dt.reset();
            },
            error: (rsp) => {
                console.debug(rsp || 'error');
                this.toastService.error('System.Message.Error');
            },
        })
            .add(() => {
                this.loaderService.hide();
            });
    }

    clickEditRuleSetup(data) {
        this.loaderService.show();
        this.ruleSetupViewResponse = new RuleSetupViewResponse();
        this.editRuleValue = '';
        let model = {
            tenant: data.rulesTenant,
            ruleId: data.rulesCategoryRuleId
        };
        this.ruleSetupService.ruleSetupView(model).subscribe({
            next: (rsp) => {
                this.ruleSetupViewResponse = rsp;
                this.editRuleValue = this.ruleSetupViewResponse.ruleVal;
                this.displayEditDialog = true;
            },
            error: (rsp) => {
                console.debug(rsp || 'error');
                this.toastService.error('System.Message.Error');
            },
        });
        // .add(() => {
        //     this.loaderService.hide();
        // });
        this.loaderService.hide();
    }

    showFilter() {
        this.displayFilterDetail = true;
    }

    closeEditDialog() {
        this.displayEditDialog = false;
    }

    saveData() {
        if (!this.editRuleValue) {
            this.toastService.error('RuleSetup.Message.RuleValRequied');
            return;
        }
        let model = {
            tenant: this.ruleSetupViewResponse.tenant,
            ruleId: this.ruleSetupViewResponse.ruleId,
            ruleVal: this.editRuleValue,
            userEmail: this.userContextService.user$.getValue().userEmail
        }
        this.ruleSetupService.ruleSetupModify(model).subscribe({
            next: (rsp) => {
                this.displayEditDialog = false;
                this.toastService.success('Dialog.Message.SuccessfullySaved');
                this.initData();
            },
            error: (rsp) => {
                console.debug(rsp || 'error');
                this.toastService.error('System.Message.Error');
            },
        })
            .add(() => {
                this.loaderService.hide();
            });
    }

    customSort(event: SortEvent) {
        event.data.sort((data1, data2) => {
            let value1 = data1[event.field];
            let value2 = data2[event.field];
            let result = null;

            if (value1 == null && value2 != null)
                result = -1;
            else if (value1 != null && value2 == null)
                result = 1;
            else if (value1 == null && value2 == null)
                result = 0;
            else if (typeof value1 === 'string' && typeof value2 === 'string')
                result = value1.localeCompare(value2);
            else
                result = (value1 < value2) ? -1 : (value1 > value2) ? 1 : 0;

            return (event.order * result);
        });
    }

    ngOnDestroy(): void {
        [
            this.onLangChange$,
        ].forEach((subscription: Subscription) => {
            if (subscription != null)
                subscription.unsubscribe();
        });
    }
}
