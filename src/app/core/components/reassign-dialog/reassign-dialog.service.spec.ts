import { TestBed } from '@angular/core/testing';

import { ReassignDialogService } from './reassign-dialog.service';

describe('ReassignDialogService', () => {
  let service: ReassignDialogService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ReassignDialogService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
