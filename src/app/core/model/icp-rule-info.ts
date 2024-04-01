export interface ICPRuleInfo {
  groupId: string;
  groupNameC: string;
  groupNameE: string;
  sort: number;
  checkOption: {
    checkId: string;
    checkNameC: string;
    checkNameE: string;
    exampleC: string | null;
    exampleE: string | null;
    active: string;
    sort: number;
    isTrue?: string | null;
    isDisabled?: boolean;
  }[];
}
