import { TestBed } from '@angular/core/testing';

import { ObjectFormatService } from './object-format.service';

describe('ObjectFormatService', () => {
  let service: ObjectFormatService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ObjectFormatService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
