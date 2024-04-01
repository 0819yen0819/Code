import { LazyLoadEvent } from "primeng/api";

export class DplResultQueryRequest {

  headerId: number;

  lineId: number;

  // 
  tenant: string;

  trxReferenceNo: string;

  precisionRunNumber: string;

  sourceType: string;

  custNameE: string;

  addressId: string;

  addressLine: string;

  country: string;

  startDate: Date;

  endDate: Date;

  lazyLoadEvent: LazyLoadEvent;

  action: string;

  userEmail: string;

  sofcBaseHerf: string;
}

