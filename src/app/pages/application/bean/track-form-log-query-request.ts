import { LazyLoadEvent } from "primeng/api";

export class TrackFormLogQueryRequest{
    tenant: string;
    userEmail: string;
    userCode: string;
    userTimeZone: string;
    userLang: string;

    searchType: string;
	formTypeId: string;
	formNo: string;
	applicant: string;
	owner: string;
	startDate: Date;
	endDate: Date;
	status: string;
	subject: string;
	ouCodeList: any[];
  
    formTypePermissionList: any[];

    applicantList: any[];
    ownerList: any[];
    keywords: string[];
    
    lazyLoadEvent: LazyLoadEvent;
}