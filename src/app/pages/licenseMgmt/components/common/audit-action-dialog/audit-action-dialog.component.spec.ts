import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AuditActionDialogComponent } from './audit-action-dialog.component';

describe('AuditActionDialogComponent', () => {
  let component: AuditActionDialogComponent;
  let fixture: ComponentFixture<AuditActionDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ AuditActionDialogComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AuditActionDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
