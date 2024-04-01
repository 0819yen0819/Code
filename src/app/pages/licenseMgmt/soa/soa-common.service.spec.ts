import { TestBed } from '@angular/core/testing';

import { SoaCommonService } from './soa-common.service';

describe('SoaCommonService', () => {
  let service: SoaCommonService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SoaCommonService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
