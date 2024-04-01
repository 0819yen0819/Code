import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { NoticeDialogParams } from '../model/selector-dialog-params';

@Injectable({
  providedIn: 'root',
})
export class NoticeCheckHandlerService {
  noticeCheckDialogParams: BehaviorSubject<NoticeDialogParams>;
  noticeContentList: BehaviorSubject<string[]>;
  isDialogClose: BehaviorSubject<boolean>;
  constructor() {
    this.noticeCheckDialogParams = new BehaviorSubject<NoticeDialogParams>({
      title: '',
      visiable: false,
      mode: 'info',
    });
    this.noticeContentList = new BehaviorSubject<string[]>(new Array<string>());
    this.isDialogClose = new BehaviorSubject<boolean>(false);
  }

  /**
   * @description 開啟通知窗
   * @param title 通知窗標題
   * @param mode 內文字體狀態
   * @param msg 內文
   */
  openNoticeDialog(
    title: string,
    mode: NoticeDialogParams['mode'],
    msg: string | string[]
  ): void {
    this.noticeCheckDialogParams.next({
      title: title,
      visiable: true,
      mode: mode,
    });
    this.isDialogClose.next(true);
    this.noticeContentList.next(new Array<string>());
    if (typeof msg === 'string') {
      this.noticeContentList.next([msg]);
    } else {
      this.noticeContentList.next(msg);
    }
  }

  closeNoticeDialog(): void {
    this.isDialogClose.next(false);
  }
}
