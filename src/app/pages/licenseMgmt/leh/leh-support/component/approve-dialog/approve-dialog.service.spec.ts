import { TestBed } from '@angular/core/testing';

import { ApproveDialogService } from './approve-dialog.service';

describe('ApproveDialogService', () => {
  let service: ApproveDialogService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ApproveDialogService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
