import { TestBed } from '@angular/core/testing';

import { AmSc047ItemInitService } from './am-sc047-item-init.service';

describe('AmSc047ItemInitService', () => {
  let service: AmSc047ItemInitService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AmSc047ItemInitService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
