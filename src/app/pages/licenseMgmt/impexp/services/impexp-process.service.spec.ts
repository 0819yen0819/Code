import { TestBed } from '@angular/core/testing';

import { ImpexpProcessService } from './impexp-process.service';

describe('ImpexpProcessService', () => {
  let service: ImpexpProcessService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ImpexpProcessService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
