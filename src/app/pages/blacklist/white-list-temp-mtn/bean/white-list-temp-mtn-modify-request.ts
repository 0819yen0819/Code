import { LazyLoadEvent } from "primeng/api";
import { WhiteListTempMtnBean } from "./white-list-temp-mtn-bean";

export class WhiteListTempMtnModifyRequest {

    userEmail: string;

    tenant: string;

    detailList: WhiteListTempMtnBean[];

}

