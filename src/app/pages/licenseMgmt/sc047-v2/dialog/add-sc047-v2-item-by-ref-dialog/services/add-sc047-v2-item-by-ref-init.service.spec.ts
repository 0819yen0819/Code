import { TestBed } from '@angular/core/testing';

import { AddSc047V2ItemByRefInitService } from './add-sc047-v2-item-by-ref-init.service';

describe('AddSc047V2ItemByRefInitService', () => {
  let service: AddSc047V2ItemByRefInitService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AddSc047V2ItemByRefInitService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
