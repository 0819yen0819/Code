import { ImpExpLicenseMtnBean } from "./impexp-license-mtn-bean";

export class ImpExpLicenseMtnModifyRequest {
    action: string;
    
    tenant: string;

    userEmail: string;

    detail: ImpExpLicenseMtnBean;
}