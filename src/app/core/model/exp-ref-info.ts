/*
> ERP 的 EXP Ref Shipment# Single Data Info
*/

export interface ERPEXPDOInfo {
  refShipment?: string;
  key?:number;
  trx_no: string;
  org_id: number;
  inventory_item_id: number;
  part_no: string;
  ccats: string;
  vc_type: string;
  target_no: string;
  cvname: string;
  address: string;
  ship_qty: number;
  eccn?: string;
  eccn1: string;
  eccn2: string;
}
