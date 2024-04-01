import { SoaLicenseMtnBean } from "./soa-license-mtn-bean";

export class SoaLicenseMtnModifyRequest {
    action: string;
    tenant: string;
    userEmail: string;
    detail: SoaLicenseMtnBean;
}
