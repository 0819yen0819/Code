import { GetItemEccnAreaBean } from "./get-item-eccn-area-bean";
import { GetItemEccnMasterBean } from "./get-item-eccn-master-bean";

export class GetItemEccnResponse{

    productCode: string;

    masterEccn: GetItemEccnMasterBean;

    areaEccn: GetItemEccnAreaBean[];

}