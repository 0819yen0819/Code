export interface SOAExclusionControlInfo {
  group?: string | null;
  vcType?: string | null;
  vcCode?: any;
  vcName?: string | null;
  brand?: any;
  validFrom?: number | null;
  flag?: string | null;
  remark?: string | null;
  createdBy: string;
  createdDate: number;
  lastUpdatedBy: string;
  lastUpdatedDate: number;
}

export interface SOAExclusionControlInfoDialog
  extends Omit<
    SOAExclusionControlInfo,
    'createdBy' | 'createdDate' | 'lastUpdatedBy' | 'lastUpdatedDate'
  > {
  mode?: string;
  key?: number;
  vcLabel?: string | null;
}
