import { TestBed } from '@angular/core/testing';

import { DtViewerDropdownProcessService } from './dt-viewer-dp-process.service';

describe('DtViewerDropdownProcessService', () => {
  let service: DtViewerDropdownProcessService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(DtViewerDropdownProcessService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
