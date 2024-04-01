import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EucAddRecordDialogComponent } from './euc-add-record-dialog.component';

describe('EucAddRecordDialogComponent', () => {
  let component: EucAddRecordDialogComponent;
  let fixture: ComponentFixture<EucAddRecordDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ EucAddRecordDialogComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(EucAddRecordDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
