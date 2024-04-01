import { LazyLoadEvent } from "primeng/api";

export class SampleOutLogQueryRequest {

  startDate: Date = new Date();

  endDate: Date = new Date();

  tenant: string;

  userCode: string;

  permissionCode: string[];

  lazyLoadEvent: LazyLoadEvent;

  action: string;

}
