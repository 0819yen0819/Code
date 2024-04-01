import { TestBed } from '@angular/core/testing';

import { LicenseViewerHeaderService } from './license-viewer-header.service';

describe('LicenseViewerHeaderService', () => {
  let service: LicenseViewerHeaderService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(LicenseViewerHeaderService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
