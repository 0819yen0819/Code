import { OnlineRequestParty } from "./online-request-party";

export class PrecisioinOnlineRequest {

  msgFrom: string = 'Internal';

  tenant: string;

  // 之後會拿掉不用
  sourceReferenceKey1: string;
  sourceReferenceKey3: string = 'BP-DPL';

  sourceReferenceKey2: string;

  parties: OnlineRequestParty[] = [];

}
