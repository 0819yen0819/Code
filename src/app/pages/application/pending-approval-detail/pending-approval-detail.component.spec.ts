import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PendingApprovalDetailComponent } from './pending-approval-detail.component';

describe('PendingApprovalDetailComponent', () => {
  let component: PendingApprovalDetailComponent;
  let fixture: ComponentFixture<PendingApprovalDetailComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ PendingApprovalDetailComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(PendingApprovalDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
