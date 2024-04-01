import { TestBed } from '@angular/core/testing';

import { NsoService } from './nso.service';

describe('NsoService', () => {
  let service: NsoService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(NsoService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
