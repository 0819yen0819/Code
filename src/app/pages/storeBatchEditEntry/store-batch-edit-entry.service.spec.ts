import { TestBed } from '@angular/core/testing';

import { StoreBatchEditEntryService } from './store-batch-edit-entry.service';

describe('StoreBatchEditEntryService', () => {
  let service: StoreBatchEditEntryService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(StoreBatchEditEntryService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
