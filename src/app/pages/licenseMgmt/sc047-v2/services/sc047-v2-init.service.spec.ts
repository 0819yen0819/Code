import { TestBed } from '@angular/core/testing';

import { Sc047V2InitService } from './sc047-v2-init.service';

describe('Sc047V2InitService', () => {
  let service: Sc047V2InitService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Sc047V2InitService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
