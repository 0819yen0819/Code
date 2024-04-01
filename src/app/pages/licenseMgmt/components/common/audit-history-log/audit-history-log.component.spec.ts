import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AuditHistoryLogComponent } from './audit-history-log.component';

describe('AuditHistoryLogComponent', () => {
  let component: AuditHistoryLogComponent;
  let fixture: ComponentFixture<AuditHistoryLogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ AuditHistoryLogComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AuditHistoryLogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
