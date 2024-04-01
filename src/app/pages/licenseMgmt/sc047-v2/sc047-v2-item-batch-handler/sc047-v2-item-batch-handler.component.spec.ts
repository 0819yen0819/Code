import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Sc047V2ItemBatchHandlerComponent } from './sc047-v2-item-batch-handler.component';

describe('Sc047V2ItemBatchHandlerComponent', () => {
  let component: Sc047V2ItemBatchHandlerComponent;
  let fixture: ComponentFixture<Sc047V2ItemBatchHandlerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ Sc047V2ItemBatchHandlerComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(Sc047V2ItemBatchHandlerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
