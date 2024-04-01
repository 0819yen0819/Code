import { TestBed } from '@angular/core/testing';

import { ImpexpInitService } from './impexp-init.service';

describe('ImpexpInitService', () => {
  let service: ImpexpInitService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ImpexpInitService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
