import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AmEccnStatusDialogComponent } from './am-eccn-status-dialog.component';

describe('AmEccnStatusDialogComponent', () => {
  let component: AmEccnStatusDialogComponent;
  let fixture: ComponentFixture<AmEccnStatusDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ AmEccnStatusDialogComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AmEccnStatusDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
