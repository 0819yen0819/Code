import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EucModifyRecordDialogComponent } from './euc-modify-record-dialog.component';

describe('EucModifyRecordDialogComponent', () => {
  let component: EucModifyRecordDialogComponent;
  let fixture: ComponentFixture<EucModifyRecordDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ EucModifyRecordDialogComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(EucModifyRecordDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
