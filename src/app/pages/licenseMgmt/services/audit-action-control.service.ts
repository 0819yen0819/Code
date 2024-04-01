import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { AuditAction } from 'src/app/core/model/audit-action';

@Injectable({
  providedIn: 'root',
})
export class AuditActionControlService {
  private auditActionStatus!: BehaviorSubject<any>;

  constructor() {
    this.auditActionStatus = new BehaviorSubject<any>(null);
  }

  setAuditAction(model: AuditAction): void {
    this.auditActionStatus.next(model);
  }

  onAuditActionHandler(): Observable<AuditAction> {
    return this.auditActionStatus.asObservable();
  }
}
