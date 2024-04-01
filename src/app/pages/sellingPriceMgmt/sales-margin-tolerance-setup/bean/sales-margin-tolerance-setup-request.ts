import { LazyLoadEvent } from "primeng/api";

export class SalesMarginToleranceSetupRequest {
    tenant:string;
    ouGroup: string;
    ouCode: string;
    custCode: string;
    endCustomer: string;
    brand:string;
    ctg1:string;
    productCode:string;
    status:string;
    userEmail: string;
    lazyLoadEvent: LazyLoadEvent;
    sofcBaseHerf:string;
}
