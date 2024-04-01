import { TestBed } from '@angular/core/testing';

import { NoticeCheckHandlerService } from './notice-check-handler.service';

describe('NoticeCheckHandlerService', () => {
  let service: NoticeCheckHandlerService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(NoticeCheckHandlerService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
