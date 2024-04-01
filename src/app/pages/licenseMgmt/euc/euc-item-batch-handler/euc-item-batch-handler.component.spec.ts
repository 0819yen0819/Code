import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EucItemBatchHandlerComponent } from './euc-item-batch-handler.component';

describe('EucItemBatchHandlerComponent', () => {
  let component: EucItemBatchHandlerComponent;
  let fixture: ComponentFixture<EucItemBatchHandlerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ EucItemBatchHandlerComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(EucItemBatchHandlerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
