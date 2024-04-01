import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { AttachedFileLog } from 'src/app/core/model/file-info';

@Injectable({
  providedIn: 'root',
})
export class AttachedLogService {
  existFileList!: BehaviorSubject<AttachedFileLog[]>;
  existURLList!: BehaviorSubject<AttachedFileLog[]>;

  constructor() {
    this.existFileList = new BehaviorSubject<AttachedFileLog[]>([]);
    this.existURLList = new BehaviorSubject<AttachedFileLog[]>([]);
  }

  setExistFileList(fileList: AttachedFileLog[]): void {
    this.existFileList.next(fileList);
  }

  setExistURLList(urlList: AttachedFileLog[]): void {
    this.existURLList.next(urlList);
  }

  getExistFileList(): Observable<AttachedFileLog[]> {
    return this.existFileList.asObservable();
  }

  getExistURLList(): Observable<AttachedFileLog[]> {
    return this.existURLList.asObservable();
  }

  resetExistFileList(): void {
    this.existFileList.next(new Array<AttachedFileLog>());
  }

  resetExistURLList(): void {
    this.existURLList.next(new Array<AttachedFileLog>());
  }
}
