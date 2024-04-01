import { LazyLoadEvent } from "primeng/api";

export class DplResultBatchRequest {

  seq: number;

  // 
  tenant: string;

  batchReference: string;

  custName: string;

  addressId: string;

  addressLine: string;

  country: string;

  startDate: Date;

  endDate: Date;

  action: string;

  lazyLoadEvent: LazyLoadEvent;

  userEmail: string;

  sofcBaseHerf: string;
}

