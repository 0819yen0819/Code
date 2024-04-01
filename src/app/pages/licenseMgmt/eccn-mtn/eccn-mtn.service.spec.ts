import { TestBed } from '@angular/core/testing';

import { EccnMtnService } from './eccn-mtn.service';

describe('EccnMtnService', () => {
  let service: EccnMtnService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(EccnMtnService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
