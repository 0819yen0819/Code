import { LazyLoadEvent } from "primeng/api";

export class FormFileQueryRequest {

  tenant: string;

  formTypeId: string;

  formNo: string;

  subject: string;

  remarks: string[];

  fileName: string;

  uploadBy: string;

  startDate: Date;

  endDate: Date;

  formTypePermissionList: any[];

  lazyLoadEvent: LazyLoadEvent;
}

