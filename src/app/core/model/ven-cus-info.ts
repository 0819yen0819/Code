export interface CustormerInfo {
  seq: number;
  tenant: string;
  customerNo: string;
  customerName: string;
  customerNameEg: string;
}

export interface VendorInfo {
  seq: number;
  tenant: string;
  vendorCode: string;
  vendorName: string;
  vendorEngName: string;
}

export interface VenCusInfo extends CustormerInfo, VendorInfo {}
