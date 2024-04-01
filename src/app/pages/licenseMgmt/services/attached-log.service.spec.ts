import { TestBed } from '@angular/core/testing';

import { AttachedLogService } from './attached-log.service';

describe('AttachedLogService', () => {
  let service: AttachedLogService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AttachedLogService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
