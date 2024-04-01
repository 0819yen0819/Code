import { TestBed } from '@angular/core/testing';

import { Sc047V2FlowService } from './sc047-v2-flow.service';

describe('Sc047V2FlowService', () => {
  let service: Sc047V2FlowService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Sc047V2FlowService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
