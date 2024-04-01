import { TestBed } from '@angular/core/testing';

import { IcpProcessService } from './icp-process.service';

describe('IcpProcessService', () => {
  let service: IcpProcessService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(IcpProcessService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
