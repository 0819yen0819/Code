import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AMLERuleDialogComponent } from './am-le-rule-dialog.component';

describe('AMLERuleDialogComponent', () => {
  let component: AMLERuleDialogComponent;
  let fixture: ComponentFixture<AMLERuleDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [AMLERuleDialogComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AMLERuleDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
