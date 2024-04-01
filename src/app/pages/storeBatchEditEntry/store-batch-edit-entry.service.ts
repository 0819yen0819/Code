import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';
import { environment } from 'src/environments/environment';
@Injectable({
  providedIn: 'root'
})
export class StoreBatchEditEntryService {
  langChange = new Subject();
  
  constructor() { }

  openByBatchEditFromStore = false;
 
  postMessageToParent(text:any){
    const iframeParent = window.opener as Window;
    iframeParent?.postMessage({ type: 'iframeChannel', message: text }, environment.storeEmbedTargetOrigin);
  }

}
