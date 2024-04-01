import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class ResendInformerService {
  isResendInformer!: BehaviorSubject<{ status: boolean; data?: any }>;

  constructor() {
    this.isResendInformer = new BehaviorSubject<{ status: boolean; data: any }>(
      { status: false, data: null }
    );
  }

  setResendInformerStatus(status: boolean, data: any = null) {
    this.isResendInformer.next({ status: status, data: data });
  }

  getResendInformerStatus(): Observable<{ status: boolean; data?: any }> {
    return this.isResendInformer.asObservable();
  }
}
