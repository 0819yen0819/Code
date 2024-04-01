import { TestBed } from '@angular/core/testing';

import { Sc047V2ProcessService } from './sc047-v2-process.service';

describe('Sc047V2ProcessService', () => {
  let service: Sc047V2ProcessService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Sc047V2ProcessService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
