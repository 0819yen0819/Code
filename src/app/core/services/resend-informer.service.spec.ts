import { TestBed } from '@angular/core/testing';

import { ResendInformerService } from './resend-informer.service';

describe('ResendInformerService', () => {
  let service: ResendInformerService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ResendInformerService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
