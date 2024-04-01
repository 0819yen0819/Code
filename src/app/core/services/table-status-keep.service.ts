import { Injectable } from '@angular/core';
import { TableStatusKeepEnum } from '../model/table-status-keep.const';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class TableStatusKeepService {
  // 目的: 編輯/新增/刪除 不得影響當前頁碼與當頁顯示數量
  // 策略:
  // 只當User切換頁碼時提供 keep function 儲存頁碼資訊 (onPage)
  // 並且在需要呼叫api拿資料時，透過先前儲存的頁碼資訊當作參考參數，而非primeNg-table提供的event (因為可能已經重置到第一頁)
  // 查詢時 可呼叫 resetPageEvent() 恢復原本設定
  public tableStatusKeepEnum = TableStatusKeepEnum;

  public keepInfo = {
    [TableStatusKeepEnum.QueryModel]: null,
    [TableStatusKeepEnum.PageEvent]: {
      first: 0,
      rows: 10
    }
  };

  constructor() { }

  keep(name, value) {
    this.keepInfo[name] = value;
    console.warn(name,value)
  }

  get(name) {
    return this.keepInfo[name];
  }

  resetPage = new Subject();
  resetPageEvent() {
    this.keepInfo[TableStatusKeepEnum.PageEvent] = {
      first: 0,
      rows: 10
    }
    this.resetPage.next({
      first: 0,
      rows: 10
    });
  }

  // 這個function是為了避免 onLazy 比 onPage 先執行，導致 onLazy 的頁碼與 onPage 不同步的問題
  // 因為 onPage 會去設定頁碼 ， onLazy 在從設定的頁碼去取來用 ， 所以 onLazy 不得早於 onPage
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

}
