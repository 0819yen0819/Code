import { LazyLoadEvent } from "primeng/api";
import { WhiteListMtnBean } from "./white-list-mtn-bean";

export class WhiteListMtnModifyRequest {

  tenant: string;

  userEmail: string;

  detailList: WhiteListMtnBean[];


}

