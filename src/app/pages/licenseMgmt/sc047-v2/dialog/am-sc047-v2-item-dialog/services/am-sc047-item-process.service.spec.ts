import { TestBed } from '@angular/core/testing';

import { AmSc047ItemProcessService } from './am-sc047-item-process.service';

describe('AmSc047ItemProcessService', () => {
  let service: AmSc047ItemProcessService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AmSc047ItemProcessService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
