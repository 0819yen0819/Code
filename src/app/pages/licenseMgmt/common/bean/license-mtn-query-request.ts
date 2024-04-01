import { LazyLoadEvent } from "primeng/api";

export class LicenseMtnQueryRequest {

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

	eccn: string;

	licenseNo: string;

	ouGroup: string;

	// 正本/副本
	isOriginal: string;

	lazyLoadEvent: LazyLoadEvent;

	tenant: string;

	userCode: string;

	userEmail: string;

	permissions: string[];

	shipTo: string;

	deliveryTo: string;

	items: string[];

	specialApproval: string;

	trxReferenceNo: string;

}
