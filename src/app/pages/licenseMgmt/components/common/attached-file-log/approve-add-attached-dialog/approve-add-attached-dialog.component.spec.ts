import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ApproveAttachedDialogComponent } from './approve-add-attached-dialog.component';

describe('ApproveAttachedDialogComponent', () => {
  let component: ApproveAttachedDialogComponent;
  let fixture: ComponentFixture<ApproveAttachedDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ApproveAttachedDialogComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ApproveAttachedDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
