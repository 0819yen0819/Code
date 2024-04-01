import { LicenseHistoryBean } from "./license-history-bean";

export class LicenseHistoryResponse{
    
    productCode: string;

    licenseNo: string;

    balanceQuantity: number;

    licenseHistories: LicenseHistoryBean[];
}