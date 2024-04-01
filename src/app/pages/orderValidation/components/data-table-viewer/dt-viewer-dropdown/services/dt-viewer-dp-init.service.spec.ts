import { TestBed } from '@angular/core/testing';

import { DtViewerDropdownInitService } from './dt-viewer-dp-init.service';

describe('DtViewerDropdownInitService', () => {
  let service: DtViewerDropdownInitService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(DtViewerDropdownInitService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
