import { TestBed } from '@angular/core/testing';

import { PcfService } from './pcf.service';

describe('PcfService', () => {
  let service: PcfService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(PcfService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
