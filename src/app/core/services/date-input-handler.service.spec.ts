import { TestBed } from '@angular/core/testing';

import { DateInputHandlerService } from './date-input-handler.service';

describe('DateInputHandlerService', () => {
  let service: DateInputHandlerService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(DateInputHandlerService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
