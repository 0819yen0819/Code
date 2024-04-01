import { SelectedDataTable } from './data-table-view';

export interface EUCItemInfo {
  key?: number;
  seq: number;
  tenant: string;
  invItemNo?: string;
  brand: string;
  ctg1?: string;
  ctg2?: string;
  ctg3?: string;
  eccn?: string;
  status: string;
  proviso?: string;
  ccats?: string;
  quantity?: number;
  productCode?: string;
}
export interface SendItemInfo {
  itemID: EUCItemInfo['invItemNo'];
  dateRange: number[] | Date[];
  ctmPo: string;
  project: string;
  quantity: number;
}

export interface AddItemInfoCallback extends SendItemInfo {
  itemInfo: EUCItemInfo;
}

export interface ShowItemInfo
  extends Omit<SendItemInfo, 'dateRange' | 'itemID'>,
    SelectedDataTable {
  itemID?: string;
  productCode: string;
  brand: EUCItemInfo['brand'];
  eccn: EUCItemInfo['eccn'];
  ccats: EUCItemInfo['ccats'];
  proviso: EUCItemInfo['proviso'];
  periodFrom: Date | string | number;
  periodTo: Date | string | number;
  lineId?: number;
}
