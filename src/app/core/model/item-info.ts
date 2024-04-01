export interface ItemInfo {
  seq: number;
  tenant: string;
  status: string;
  invItemNo: string;
  brand: string;
  ctg1?: string;
  ctg2?: string;
  ctg3?: string;
  eccn?: string;
  proviso?: string;
  ccats?: string;
  quantity?: number;
}

export interface LicenseItemInfo extends ItemInfo {
  bafaLicense: string;
  bafaBalQty: number;
  bafaTotalQty: number;
  itemInfo?: ItemInfo;
  license: string;
  licenseQty: number;
  price: number;
  productCode: string;
  quantity: number;
  remark: string | null;
  startDate: number | null;
  endDate: number | null;
}

export interface ImpLicenseItemInfo extends LicenseItemInfo {
  lineId?: string;
  key?: string;
  specialFlag: string;
  specialLabel: string;
  shipFrom: string;
}

export interface ExpLicenseItemInfo extends LicenseItemInfo {
  lineId?: string;
  key?: string;
  deliveryNo: string;
  refShipment: string;
}
