import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ApplyActionDialogComponent } from './apply-action-dialog.component';

describe('ApplyActionDialogComponent', () => {
  let component: ApplyActionDialogComponent;
  let fixture: ComponentFixture<ApplyActionDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ApplyActionDialogComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ApplyActionDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
