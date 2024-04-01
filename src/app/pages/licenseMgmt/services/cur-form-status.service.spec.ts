import { TestBed } from '@angular/core/testing';

import { CurFormStatusService } from './cur-form-status.service';

describe('CurFormStatusService', () => {
  let service: CurFormStatusService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CurFormStatusService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
