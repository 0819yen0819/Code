export interface ECCNInfo {
  eccn: string;
}

export interface ECCNLERules extends ECCNInfo {
  tenant: string;
  civ?: string;
  gbs?: string;
  enc?: string;
  lvs?: string;
  orderAmt?: number;
  yearAmt?: number;
  remark?: string;
  flag: string;
  createdBy: string;
  createdDate: string | number;
  lastUpdatedBy: string;
  lastUpdatedDate: string | number;
}

export interface ShowECCNLERules extends Omit<ECCNLERules, 'tenant'> {
  key: ECCNInfo['eccn'];
}

export interface AUECCNLERules
  extends Omit<
    ECCNLERules,
    'tenant' | 'createdBy' | 'createdDate' | 'lastUpdatedBy' | 'lastUpdatedDate'
  > {
  saveType: string;
}

export interface ECCNStatus extends ECCNInfo {
  activeFlag: string;
  createdBy: string;
  createdDate: string | number;
  lastUpdatedBy: string;
  lastUpdatedDate: string | number;
}
