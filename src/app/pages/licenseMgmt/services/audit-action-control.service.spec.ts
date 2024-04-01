import { TestBed } from '@angular/core/testing';

import { AuditActionControlService } from './audit-action-control.service';

describe('AuditActionControlService', () => {
  let service: AuditActionControlService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AuditActionControlService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
