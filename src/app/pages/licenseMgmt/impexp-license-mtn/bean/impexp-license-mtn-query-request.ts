import { LazyLoadEvent } from "primeng/api";

export class ImpExpLicenseMtnQueryRequest {

    startDate: Date;

	endDate: Date;

	licenseType: string;
	
	formNo: string;

	countryCode: string;

	customerVendorType: string;

	customerVendorCode: string;

	item: string;

	itemFilterType: string;

	flag: string;

	oouCode: string;

	ouCode: string;

	consignee: string;

	consigneeAddress: string;

	ccats: string;;

    lazyLoadEvent: LazyLoadEvent;

	tenant: string;

	userCode: string;

	userEmail: string;

	permissions: string[];

	userLang: string;

	licenseNo: string;
    
	eccn: string;

	shipFrom: string;

	shipTo: string;

	deliveryTo: string;

	items: string[];

	trxReferenceNo: string;
}