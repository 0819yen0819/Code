import { TestBed } from '@angular/core/testing';

import { ImpexpHandlerService } from './impexp-handler.service';

describe('ImpexpHandlerService', () => {
  let service: ImpexpHandlerService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ImpexpHandlerService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
