import { TestBed } from '@angular/core/testing';

import { AddSc047V2ItemByRefProcessService } from './add-sc047-v2-item-by-ref-process.service';

describe('AddSc047V2ItemByRefProcessService', () => {
  let service: AddSc047V2ItemByRefProcessService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AddSc047V2ItemByRefProcessService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
