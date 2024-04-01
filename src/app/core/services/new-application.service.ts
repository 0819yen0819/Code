import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpEventType, HttpParams } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { environment } from '../../../environments/environment';
import { UserContextService } from './user-context.service';
import { ToastService } from 'src/app/core/services/toast.service';

const baseUrl = `${environment.workflowApiUrl}${environment.apiPathPrefix}`;

const APIM_AUTH_HEADER: HttpHeaders = new HttpHeaders({ 'Ocp-Apim-Subscription-Key': environment.apiKey });

@Injectable({
    providedIn: 'root'
})

export class NewApplicationService {
    constructor(
        private http: HttpClient,
        private userContextService: UserContextService,
        private toastService: ToastService
    ) { }

    getAllNewIntakeFormType(): Observable<any> {
        const url = `${baseUrl}/formType/getAllNewIntakeFormType`;
        const userToken = this.userContextService.user$.getValue().userToken;
        const headerslocal = APIM_AUTH_HEADER
            .append('accept', 'application/json')
            .append('Content-Type', 'application/json')
            .append('userToken', userToken);

        return this.http.get(url, { headers: headerslocal });
    }

}

export class NewIntakeFormType {
    formTypeId: string;
	category: string;
	formTypeNameC: string;
	formTypeNameE: string;
	formType: string;
	isWithdraw: string;
	status: string;
    categoryE: string;
	display: string;
	addUrl: string;
    
}

export class NewIntakeFormTypeData {
    formCategory: string;
    formCategoryNameC: string;
    formCategoryNameE: string;
    subNewIntakeFormTypeList: NewIntakeFormType[] = [];
}