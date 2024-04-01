import { TestBed } from '@angular/core/testing';

import { CurFormInfoService } from './cur-form-info.service';

describe('CurFormInfoService', () => {
  let service: CurFormInfoService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CurFormInfoService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
